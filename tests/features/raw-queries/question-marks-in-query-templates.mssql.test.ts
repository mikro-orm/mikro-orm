import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mssql';

const Item = defineEntity({
  name: 'Item',
  tableName: 'item?',
  properties: {
    id: p.integer().primary().fieldName('id?'),
    name: p.string().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item],
    dbName: 'mikro_orm_test_question_marks',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('multi insert without any parameter', async () => {
  const em = orm.em.fork();
  await em.insertMany(Item, [{}, {}]);
  await expect(em.count(Item, { name: null })).resolves.toBe(2);
});
