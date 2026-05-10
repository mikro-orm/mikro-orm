import { defineEntity, defineRoutine, MikroORM, p, ScalarReference } from '@mikro-orm/mssql';

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
    name: { type: 'nvarchar(255)' },
    age: { type: 'int' },
  },
  returns: { runtimeType: 'string', columnType: 'nvarchar(40)' },
  body: p =>
    `return convert(nvarchar(40), hashbytes('SHA1', concat(${p.name}, cast(${p.age} as nvarchar(10)), N'secret salt')), 2)`,
});

const AddRecord = defineRoutine({
  name: 'add_record',
  type: 'procedure',
  params: {
    p_name: { type: 'nvarchar(255)' },
    p_age: { type: 'int' },
    p_hash: { type: 'nvarchar(40)', direction: 'inout', ref: true },
  },
  body: p => `
    set ${p.p_hash} = convert(nvarchar(40), hashbytes('SHA1', concat(${p.p_name}, cast(${p.p_age} as nvarchar(10)), N'secret salt')), 2);
    insert into record_entity (hash, name, age) values (${p.p_hash}, ${p.p_name}, ${p.p_age});
  `,
});

describe('stored routines — MSSQL', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_routines_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      password: 'Root.Root',
      entities: [RecordEntity],
      routines: [SqlHash, AddRecord],
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
    expect(sql).toMatch(/create or alter function \[sql_hash\]/i);
    expect(sql).toMatch(/create or alter procedure \[add_record\]/i);
  });

  it('schema:diff round-trips cleanly after refresh (no churn)', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
  });

  it('em.callRoutine invokes a function and returns scalar value', async () => {
    const hash = await orm.em.callRoutine<string>(SqlHash, { name: 'Jon Snow', age: 30 });
    expect(hash).toMatch(/^[A-F0-9]{40}$/i);
  });

  it('em.callRoutine invokes a procedure with INOUT param via ScalarReference', async () => {
    const hash = new ScalarReference<string>();
    await orm.em.callRoutine(AddRecord, { p_name: 'Jon Snow', p_age: 30, p_hash: hash });

    expect(hash.unwrap()).toMatch(/^[A-F0-9]{40}$/i);

    const found = await orm.em.fork().findOne(RecordEntity, { hash: hash.unwrap() });
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jon Snow');
  });
});
