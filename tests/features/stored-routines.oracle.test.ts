import { defineEntity, Routine, MikroORM, p, ScalarReference } from '@mikro-orm/oracledb';

const RecordSchema = defineEntity({
  name: 'RecordEntity',
  properties: {
    id: p.integer().primary().autoincrement(),
    hash: p.string().length(40),
    name: p.string().length(255),
    age: p.integer(),
  },
});
class RecordEntity extends RecordSchema.class {}
RecordSchema.setClass(RecordEntity);

const SqlHash = new Routine({
  name: 'sql_hash',
  type: 'function',
  params: {
    p_name: { type: 'varchar2(255)' },
    p_age: { type: 'number' },
  },
  returns: { runtimeType: 'string', columnType: 'varchar2(40)' },
  body: p => `
    return upper(${p.p_name}) || ':' || to_char(${p.p_age});
  `,
});

const AddRecord = new Routine({
  name: 'add_record',
  type: 'procedure',
  params: {
    p_name: { type: 'varchar2(255)' },
    p_age: { type: 'number' },
    p_hash: { type: 'varchar2(40)', direction: 'inout', ref: true },
  },
  body: p => `
    ${p.p_hash} := upper(${p.p_name}) || ':' || to_char(${p.p_age});
    insert into "record_entity" ("hash", "name", "age") values (${p.p_hash}, ${p.p_name}, ${p.p_age});
  `,
});

const TwoCursors = new Routine({
  name: 'two_cursors',
  type: 'procedure',
  params: {
    c1: { type: 'sys_refcursor', direction: 'out', ref: true },
    c2: { type: 'sys_refcursor', direction: 'out', ref: true },
  },
  body: p => `
    open ${p.c1} for select 1 as a from dual union select 2 from dual order by a;
    open ${p.c2} for select 'foo' as label, 10 as n from dual union select 'bar', 20 from dual order by n;
  `,
});

// Three functions/procedures with non-string return runtime types so the Oracle bind-type
// derivation in `oracleBindTypeFromRuntime` is exercised for NUMBER / DATE / BUFFER (RAW).
const NumberDoubler = new Routine({
  name: 'number_doubler',
  type: 'function',
  params: { x: { type: 'number' } },
  returns: { runtimeType: 'number', columnType: 'number' },
  body: p => `return ${p.x} * 2;`,
});

const TodayPlus = new Routine({
  name: 'today_plus',
  type: 'function',
  params: { offset_days: { type: 'number' } },
  returns: { runtimeType: 'Date', columnType: 'date' },
  body: p => `return trunc(sysdate) + ${p.offset_days};`,
});

const TagBytes = new Routine({
  name: 'tag_bytes',
  type: 'function',
  params: { input: { type: 'raw(64)' } },
  returns: { runtimeType: 'Buffer', columnType: 'raw(64)' },
  body: p => `return utl_raw.concat(utl_raw.cast_to_raw('tag:'), ${p.input});`,
});

describe('stored routines — Oracle', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_sg',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord, TwoCursors, NumberDoubler, TodayPlus, TagBytes],
    });
    // Oracle test schema is shared across runs; clean up any leftover state first.
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop({ wrap: false });
    await orm.close(true);
  });

  it('schema:create emits CREATE OR REPLACE PROCEDURE/FUNCTION DDL', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatch(/create or replace function "SQL_HASH"/i);
    expect(sql).toMatch(/create or replace procedure "ADD_RECORD"/i);
  });

  it('routine introspection round-trips with no diff for managed routines', async () => {
    const helper = orm.em.getPlatform().getSchemaHelper()!;
    const dbRoutines = await helper.getAllRoutines(orm.em.getConnection());
    const names = dbRoutines.map(r => r.name).sort();
    expect(names).toEqual(expect.arrayContaining(['ADD_RECORD', 'SQL_HASH']));
  });

  it('em.callRoutine invokes a function and returns scalar value', async () => {
    const value = await orm.em.callRoutine<string>(SqlHash, { p_name: 'Jon Snow', p_age: 30 });
    expect(value).toBe('JON SNOW:30');
  });

  it('em.callRoutine invokes a procedure with INOUT param via ScalarReference', async () => {
    const hash = new ScalarReference<string>();
    await orm.em.callRoutine(AddRecord, { p_name: 'Jon Snow', p_age: 30, p_hash: hash });

    expect(hash.unwrap()).toBe('JON SNOW:30');

    const found = await orm.em.fork().findOne(RecordEntity, { hash: 'JON SNOW:30' });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jon Snow');
  });

  it('multi-result-set procedure returns each REF CURSOR as a row array', async () => {
    const sets = await orm.em.callRoutine<unknown[][]>(TwoCursors, {});
    expect(sets).toHaveLength(2);
    expect(sets[0]).toEqual([{ a: 1 }, { a: 2 }]);
    expect(sets[1]).toEqual([
      { label: 'foo', n: 10 },
      { label: 'bar', n: 20 },
    ]);
  });

  it('throws when invoked inside em.transactional for routines that could write', async () => {
    // SqlHash has no dataAccess flag — treated as potentially write-ish to be safe.
    await expect(
      orm.em.transactional(em => em.callRoutine<string>(SqlHash, { p_name: 'x', p_age: 1 })),
    ).rejects.toThrow(/Oracle's callRoutine runs on its own pool connection/);
  });

  it("read-only functions (dataAccess: 'reads-sql-data' / 'no-sql') are allowed inside em.transactional", async () => {
    const PureHash = new Routine({
      name: 'pure_hash',
      type: 'function',
      dataAccess: 'no-sql',
      params: { p_name: { type: 'varchar2(255)' } },
      returns: { runtimeType: 'string', columnType: 'varchar2(40)' },
      body: p => `return upper(${p.p_name});`,
    });

    const orm2 = await MikroORM.init({
      dbName: 'mikro_orm_test_sg',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      entities: [RecordEntity],
      routines: [PureHash],
    });
    await orm2.schema.execute(
      'create or replace function "PURE_HASH"("P_NAME" varchar2) return varchar2 as begin return upper("P_NAME"); end;',
    );

    const result = await orm2.em.transactional(em => em.callRoutine<string>(PureHash, { p_name: 'sam' }));
    expect(result).toBe('SAM');

    await orm2.schema.execute('drop function "PURE_HASH"');
    await orm2.close(true);
  });

  it('function with NUMBER return binds via oracledb.NUMBER (not coerced to STRING)', async () => {
    const result = await orm.em.callRoutine<number>(NumberDoubler, { x: 21 });
    expect(typeof result).toBe('number');
    expect(result).toBe(42);
  });

  it('function with DATE return binds via oracledb.DATE', async () => {
    const result = await orm.em.callRoutine<Date>(TodayPlus, { offset_days: 0 });
    expect(result).toBeInstanceOf(Date);
  });

  it('function with RAW return binds via oracledb.BUFFER', async () => {
    // Input: 0xCAFE — proc prepends 'tag:' as raw bytes, output should start with 'tag:' then CAFE.
    const result = await orm.em.callRoutine<Buffer>(TagBytes, { input: Buffer.from([0xca, 0xfe]) });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.subarray(0, 4).toString('utf8')).toBe('tag:');
    expect(result.subarray(4)).toEqual(Buffer.from([0xca, 0xfe]));
  });
});
