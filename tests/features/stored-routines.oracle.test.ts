import { defineEntity, defineRoutine, MikroORM, p, ScalarReference } from '@mikro-orm/oracledb';

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
  params: {
    p_name: { type: 'varchar2(255)' },
    p_age: { type: 'number' },
  },
  returns: { runtimeType: 'string', columnType: 'varchar2(40)' },
  body: p => `
    return upper(${p.p_name}) || ':' || to_char(${p.p_age});
  `,
});

const AddRecord = defineRoutine({
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

describe('stored routines — Oracle', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_sg',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord],
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
});
