import { defineEntity, Routine, MikroORM, p, ScalarReference, Type } from '@mikro-orm/postgresql';

class TaggedStringType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    return `IN<${value}>`;
  }

  override convertToJSValue(value: string): string {
    return `OUT<${value}>`;
  }
}

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
  language: 'sql',
  params: {
    name: { type: 'varchar(255)' },
    age: { type: 'integer' },
  },
  returns: { runtimeType: 'string', columnType: 'text' },
  body: "select md5(name || age::text || 'secret salt')",
});

const AddRecord = new Routine({
  name: 'add_record',
  type: 'procedure',
  language: 'plpgsql',
  params: {
    p_name: { type: 'varchar(255)' },
    p_age: { type: 'integer' },
    p_hash: { type: 'text', direction: 'inout', ref: true },
  },
  body: `
    p_hash := md5(p_name || p_age::text || 'secret salt');
    insert into record_entity (hash, name, age) values (p_hash, p_name, p_age);
  `,
});

const NoArgPi = new Routine({
  name: 'no_arg_pi',
  type: 'function',
  language: 'sql',
  params: {},
  returns: { runtimeType: 'number', columnType: 'double precision' },
  body: 'select 3.14159',
});

// `customType` on an IN param goes through `convertToDatabaseValue` before being bound;
// on the scalar function return it goes through `convertToJSValue` before being returned.
const TaggedEcho = new Routine({
  name: 'tagged_echo',
  type: 'function',
  language: 'sql',
  params: { input: { type: 'text', customType: TaggedStringType } },
  returns: { runtimeType: 'string', columnType: 'text', customType: new TaggedStringType() },
  body: 'select input',
});

// `customType` on an INOUT param applies in both directions: inbound seed via
// `convertToDatabaseValue`, outbound return via `convertToJSValue`.
const TaggedRoundtrip = new Routine({
  name: 'tagged_roundtrip',
  type: 'procedure',
  language: 'plpgsql',
  params: { val: { type: 'text', direction: 'inout', ref: true, customType: TaggedStringType } },
  body: "val := val || '!';",
});

// Multi-result-set proc: opens two refcursors. Caller must run inside a transaction so the
// cursors remain valid for FETCH.
const TwoCursors = new Routine({
  name: 'two_cursors',
  type: 'procedure',
  language: 'plpgsql',
  params: {
    c1: { type: 'refcursor', direction: 'out', ref: true },
    c2: { type: 'refcursor', direction: 'out', ref: true },
  },
  body: `
    open c1 for select 1 as a union select 2 as a order by a;
    open c2 for select 'foo'::text as label, 10 as n union select 'bar', 20 order by n;
  `,
}).withTypes<Record<string, never>, unknown[][]>();

describe('stored routines — PostgreSQL', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_routines_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord, NoArgPi, TaggedEcho, TaggedRoundtrip, TwoCursors],
      forceUtcTimezone: true,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  it('schema:create emits CREATE FUNCTION/PROCEDURE DDL', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatch(/create or replace function "sql_hash"/i);
    expect(sql).toMatch(/create or replace procedure "add_record"/i);
  });

  it('schema:diff round-trips cleanly after refresh (no churn)', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
  });

  it('em.callRoutine invokes a function and returns scalar value', async () => {
    const hash = await orm.em.callRoutine(SqlHash, { name: 'Jon Snow', age: 30 });
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it('em.callRoutine works with a parameterless function (covers empty arg-signature path)', async () => {
    const pi = await orm.em.callRoutine(NoArgPi, {});
    expect(Number(pi)).toBeCloseTo(3.14159, 4);
  });

  it('em.callRoutine invokes a procedure with INOUT param via ScalarReference', async () => {
    const hash = new ScalarReference<string>();
    const ret = await orm.em.callRoutine(AddRecord, { p_name: 'Jon Snow', p_age: 30, p_hash: hash });

    // Procedures without refcursor OUT params should return undefined — OUT/INOUT values come
    // back via the ScalarReference. Other drivers do this; PG used to leak the raw CALL row.
    expect(ret).toBeUndefined();

    expect(hash.unwrap()).toMatch(/^[a-f0-9]{32}$/);

    const found = await orm.em.fork().findOne(RecordEntity, { hash: hash.unwrap() });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jon Snow');
    expect(found!.age).toBe(30);
  });

  it('changing a routine body triggers a schema:update diff', async () => {
    const TweakedHash = new Routine({
      name: 'sql_hash',
      type: 'function',
      language: 'sql',
      params: {
        name: { type: 'varchar(255)' },
        age: { type: 'integer' },
      },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: "select md5(name || age::text || 'different salt')",
    });

    const orm2 = await MikroORM.init({
      dbName,
      entities: [RecordEntity],
      routines: [TweakedHash, AddRecord],
      forceUtcTimezone: true,
    });

    const diff = await orm2.schema.getUpdateSchemaSQL();
    expect(diff).toMatch(/drop function if exists "sql_hash"/i);
    expect(diff).toMatch(/create or replace function "sql_hash"/i);

    await orm2.close(true);
  });

  it('customType marshals scalar function params/return through convertToDatabaseValue/JSValue', async () => {
    // IN value 'hello' -> convertToDatabaseValue -> 'IN<hello>' (stored verbatim in DB)
    //                  -> SQL echoes 'IN<hello>'
    //                  -> convertToJSValue -> 'OUT<IN<hello>>'
    const wrapped = await orm.em.callRoutine(TaggedEcho, { input: 'hello' });
    expect(wrapped).toBe('OUT<IN<hello>>');
  });

  it('customType applies to INOUT procedure params in both directions', async () => {
    const ref = new ScalarReference<string>('seed');
    await orm.em.callRoutine(TaggedRoundtrip, { val: ref });
    // 'seed' -> convertToDatabaseValue -> 'IN<seed>' -> PG appends '!' -> 'IN<seed>!'
    //        -> convertToJSValue -> 'OUT<IN<seed>!>'
    expect(ref.unwrap()).toBe('OUT<IN<seed>!>');
  });

  it('multi-result-set procedure returns refcursor rows in declaration order', async () => {
    const sets = await orm.em.transactional(em => em.callRoutine(TwoCursors, {}));
    expect(sets).toHaveLength(2);
    expect(sets[0]).toEqual([{ a: 1 }, { a: 2 }]);
    expect(sets[1]).toEqual([
      { label: 'foo', n: 10 },
      { label: 'bar', n: 20 },
    ]);
  });

  it('multi-result-set procedure throws with a helpful message when called outside a transaction', async () => {
    await expect(orm.em.callRoutine(TwoCursors, {})).rejects.toThrow(/not called inside a transaction/i);
  });
});
