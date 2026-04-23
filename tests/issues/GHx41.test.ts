import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const ItemSchema = defineEntity({
  name: 'ItemGHx41',
  tableName: 'item_ghx41',
  indexes: [
    {
      name: 'item_ghx41_deleted_at_idx',
      expression: (columns, table) =>
        `create index item_ghx41_deleted_at_idx on ${table.qualifiedName} (${columns.code}) where ${columns.deletedAt} is null`,
    },
  ],
  properties: {
    id: p.integer().primary(),
    code: p.text(),
    deletedAt: p.datetime().nullable(),
  },
});

const UserSchema = defineEntity({
  name: 'UserGHx41',
  tableName: 'user_ghx41',
  schema: 'auth_ghx41',
  indexes: [
    {
      name: 'user_ghx41_deleted_at_idx',
      expression: (columns, table) =>
        `create index user_ghx41_deleted_at_idx on ${table.qualifiedName} (${columns.code}) where ${columns.deletedAt} is null`,
    },
  ],
  properties: {
    id: p.integer().primary(),
    code: p.text(),
    deletedAt: p.datetime().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ItemSchema, UserSchema],
    dbName: 'mikro_orm_test_ghx41',
  });
  await orm.schema.refresh({ dropDb: true });
});

afterAll(async () => {
  await orm.close(true);
});

test('dropping custom-expression index on public-schema entity produces clean diff', async () => {
  const meta = orm.getMetadata().get(ItemSchema);
  meta.indexes = [];

  const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(sql).toContain('drop index');
  expect(sql).toContain('item_ghx41_deleted_at_idx');
  await orm.schema.update();

  const after = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(after).toBe('');
});

test('dropping custom-expression index on non-public schema entity produces clean diff', async () => {
  const meta = orm.getMetadata().get(UserSchema);
  meta.indexes = [];

  const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(sql).toContain('drop index');
  expect(sql).toContain('user_ghx41_deleted_at_idx');
  await orm.schema.update();

  const after = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(after).toBe('');
});
