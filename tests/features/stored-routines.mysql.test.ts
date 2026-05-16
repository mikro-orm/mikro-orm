import { defineEntity, Routine, MikroORM, p, ScalarReference } from '@mikro-orm/mysql';

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
  deterministic: true,
  dataAccess: 'no-sql',
  params: {
    name: { type: 'varchar(255)' },
    age: { type: 'integer' },
  },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: "return sha1(concat(name, age, 'secret salt'));",
});

const AddRecord = new Routine({
  name: 'add_record',
  type: 'procedure',
  deterministic: false,
  dataAccess: 'modifies-sql-data',
  params: {
    p_name: { type: 'varchar(255)' },
    p_age: { type: 'integer' },
    p_hash: { type: 'char(40)', direction: 'inout', ref: true },
  },
  body: `
    set p_hash = sha1(concat(p_name, p_age, 'secret salt'));
    insert into record_entity (hash, name, age) values (p_hash, p_name, p_age);
  `,
});

const TwoSets = new Routine({
  name: 'two_sets',
  type: 'procedure',
  params: {},
  body: `
    select 1 as a;
    select 'foo' as label, 10 as n union select 'bar', 20;
  `,
}).withTypes<Record<string, unknown>, unknown[][]>();

describe('stored routines — MySQL', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_routines_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      port: 3308,
      user: 'root',
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord, TwoSets],
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
    expect(sql).toMatch(/create function `sql_hash`/i);
    expect(sql).toMatch(/create procedure `add_record`/i);
  });

  it('schema:diff round-trips cleanly after refresh (no churn)', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
  });

  it('em.callRoutine invokes a function and returns scalar value', async () => {
    const hash = await orm.em.callRoutine(SqlHash, { name: 'Jon Snow', age: 30 });
    expect(hash).toMatch(/^[a-f0-9]{40}$/);
  });

  it('em.callRoutine invokes a procedure with INOUT param via ScalarReference', async () => {
    const hash = new ScalarReference<string>();
    await orm.em.callRoutine(AddRecord, { p_name: 'Jon Snow', p_age: 30, p_hash: hash });

    expect(hash.unwrap()).toMatch(/^[a-f0-9]{40}$/);

    const found = await orm.em.fork().findOne(RecordEntity, { hash: hash.unwrap() });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jon Snow');
    expect(found!.age).toBe(30);
  });

  it('multi-result-set procedure returns each SELECT as its own row array', async () => {
    const sets = await orm.em.callRoutine(TwoSets, {});
    expect(sets).toHaveLength(2);
    expect(sets[0]).toEqual([{ a: 1 }]);
    expect(sets[1]).toEqual([
      { label: 'foo', n: 10 },
      { label: 'bar', n: 20 },
    ]);
  });

  it('em.callRoutine invokes an IN-only procedure (no OUT/INOUT params)', async () => {
    const InsertRecord = new Routine({
      name: 'insert_record',
      type: 'procedure',
      params: {
        p_hash: { type: 'char(40)' },
        p_name: { type: 'varchar(255)' },
        p_age: { type: 'integer' },
      },
      body: 'insert into record_entity (hash, name, age) values (p_hash, p_name, p_age);',
    });

    // Preserve the global routines so subsequent tests see the same DB state.
    const orm2 = await MikroORM.init({
      dbName,
      port: 3308,
      user: 'root',
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord, InsertRecord],
    });
    await orm2.schema.update();

    await orm2.em.callRoutine(InsertRecord, { p_hash: 'in-only-test', p_name: 'Sam', p_age: 25 });
    const found = await orm2.em.findOne(RecordEntity, { hash: 'in-only-test' });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Sam');

    // Clean up the extra routine so the next test's diff matches expectations.
    const orm3 = await MikroORM.init({
      dbName,
      port: 3308,
      user: 'root',
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord],
    });
    await orm3.schema.update();
    await orm3.close(true);

    await orm2.close(true);
  });

  it('changing a routine body triggers a schema:update diff', async () => {
    const TweakedHash = new Routine({
      name: 'sql_hash',
      type: 'function',
      deterministic: true,
      dataAccess: 'no-sql',
      params: {
        name: { type: 'varchar(255)' },
        age: { type: 'integer' },
      },
      returns: { runtimeType: 'string', columnType: 'char(40)' },
      body: "return sha1(concat(name, age, 'different salt'));",
    });

    const orm2 = await MikroORM.init({
      dbName,
      port: 3308,
      user: 'root',
      entities: [RecordEntity],
      routines: [TweakedHash, AddRecord],
    });

    const diff = await orm2.schema.getUpdateSchemaSQL();
    expect(diff).toMatch(/drop function if exists `sql_hash`/i);
    expect(diff).toMatch(/create function `sql_hash`/i);

    await orm2.close(true);
  });
});
