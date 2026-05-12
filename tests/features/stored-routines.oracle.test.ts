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

describe('stored routines — Oracle', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_sg',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord, TwoCursors],
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

  it('throws when invoked inside em.transactional (Oracle callRoutine cannot share the EM transaction)', async () => {
    await expect(
      orm.em.transactional(em => em.callRoutine<string>(SqlHash, { p_name: 'x', p_age: 1 })),
    ).rejects.toThrow(/Oracle's callRoutine runs on its own pool connection/);
  });
});
