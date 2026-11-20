import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';

const schema = `it's]schema`;
const tableName = `it's]table`;

const Item1 = defineEntity({
  name: 'Item',
  tableName,
  schema,
  properties: {
    id: p.integer().primary(),
    name: p.string().fieldName(`it's]name`).index(),
    kind: p.enum(['a', 'b']).fieldName(`it's]kind`),
    status: p.string().fieldName(`it's]status`).default('new'),
  },
});

const Item2 = defineEntity({
  name: 'Item',
  tableName,
  schema,
  properties: {
    id: p.integer().primary(),
    name: p.string().fieldName(`it's]name`).index(),
    kind: p.enum(['a', 'b']).fieldName(`it's]kind`),
    status: p.string().fieldName(`it's]status`).default('old'),
  },
});

const Item3 = defineEntity({
  name: 'Item',
  tableName,
  schema,
  properties: {
    id: p.integer().primary(),
    name: p.string().fieldName(`it's]name`).index(),
    kind: p.enum(['a', 'b']).fieldName(`it's]kind`),
  },
});

const Item4 = defineEntity({
  name: 'Item',
  tableName,
  schema,
  properties: {
    id: p.integer().primary(),
    name: p.string().fieldName(`it's]renamed`).index(),
    kind: p.enum(['a', 'b']).fieldName(`it's]kind`),
  },
});

describe('names with quotes and brackets in mssql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item1],
      dbName: 'mikro_orm_test_names_with_quotes',
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('schema is introspected, column defaults can be changed and dropped, columns can be renamed', async () => {
    await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

    orm.discoverEntity(Item2, Item1);
    const diff1 = await orm.schema.getUpdateSchemaSQL();
    expect(diff1).toContain(`default 'old' for [it's]]status]`);
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

    orm.discoverEntity(Item3, Item2);
    const diff2 = await orm.schema.getUpdateSchemaSQL();
    expect(diff2).toContain(`drop column [it's]]status]`);
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

    orm.discoverEntity(Item4, Item3);
    const diff3 = await orm.schema.getUpdateSchemaSQL();
    expect(diff3).toContain(`exec sp_rename '[it''s]]schema].[it''s]]table].[it''s]]name]', 'it''s]renamed', 'COLUMN'`);
    await orm.schema.execute(diff3);
    await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');
  });

  test('database existence check', async () => {
    const helper = orm.em.getPlatform().getSchemaHelper()!;
    await expect(helper.databaseExists(orm.em.getConnection(), `it's]db`)).resolves.toBe(false);
  });

  test('tables and views are dropped', async () => {
    const helper = orm.em.getPlatform().getSchemaHelper()!;
    const connection = orm.em.getConnection();
    const exists = async (name: string) => {
      const [row] = await connection.execute(`select object_id(?) as id`, [`[it's]]schema].[${name}]`]);
      return row.id != null;
    };

    await connection.execute(`create view [it's]]schema].[it's]]view] as select 1 as one`);
    await expect(exists(`it's]]view`)).resolves.toBe(true);
    await connection.execute(helper.dropViewIfExists(`it's]view`, schema));
    await expect(exists(`it's]]view`)).resolves.toBe(false);

    await expect(exists(`it's]]table`)).resolves.toBe(true);
    await connection.execute(helper.dropTableIfExists(tableName, schema));
    await expect(exists(`it's]]table`)).resolves.toBe(false);
  });
});
