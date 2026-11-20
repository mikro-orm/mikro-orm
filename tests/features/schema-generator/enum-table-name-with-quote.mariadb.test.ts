import { defineEntity, MikroORM, p } from '@mikro-orm/mariadb';
import { DatabaseSchema } from '@mikro-orm/sql';

const Item = defineEntity({
  name: 'Item',
  tableName: "owner's_item",
  properties: {
    id: p.integer().primary(),
    size: p.enum(['small', 'large']),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item],
    dbName: 'mikro_orm_test_enum_table_quote',
    port: 3309,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('enum items are read from a table with a single quote in its name', async () => {
  const schema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
  const column = schema.getTable("owner's_item")!.getColumn('size')!;
  expect(column.enumItems).toEqual(['small', 'large']);

  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });
});
