import { defineEntity, defineRoutine, MikroORM, p, ScalarReference } from '@mikro-orm/postgresql';

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

const SqlHash = defineRoutine({
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

const AddRecord = defineRoutine({
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

describe('stored routines — PostgreSQL', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_routines_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord],
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
    const hash = await orm.em.callRoutine<string>(SqlHash, { name: 'Jon Snow', age: 30 });
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it('em.callRoutine invokes a procedure with INOUT param via ScalarReference', async () => {
    const hash = new ScalarReference<string>();
    await orm.em.callRoutine(AddRecord, { p_name: 'Jon Snow', p_age: 30, p_hash: hash });

    expect(hash.unwrap()).toMatch(/^[a-f0-9]{32}$/);

    const found = await orm.em.fork().findOne(RecordEntity, { hash: hash.unwrap() });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jon Snow');
    expect(found!.age).toBe(30);
  });

  it('changing a routine body triggers a schema:update diff', async () => {
    const TweakedHash = defineRoutine({
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
});
