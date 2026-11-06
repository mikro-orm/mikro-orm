import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    size: p.enum(['small', 'large, extra']),
    owner: p.enum(['owner', "owner's friend"]),
    path: p.enum(['a\\b', 'line\nbreak']),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item],
    dbName: 'mikro_orm_test_enum_items',
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('enum items with a comma, a quote or a backslash round-trip', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });

  orm.em.create(Item, { id: 1, size: 'large, extra', owner: "owner's friend", path: 'a\\b' });
  await orm.em.flush();
  orm.em.clear();
  const item = await orm.em.findOneOrFail(Item, 1);
  expect(item).toMatchObject({ size: 'large, extra', owner: "owner's friend", path: 'a\\b' });
});
