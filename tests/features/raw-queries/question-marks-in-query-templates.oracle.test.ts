import { defineEntity, p, sql } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/oracledb';

const Item = defineEntity({
  name: 'Item',
  tableName: 'qm_item',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    meta: p.json<Record<string, unknown>>().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item],
    dbName: 'mikro_orm_test_question_marks',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('values, json keys and raw fragments containing question marks', async () => {
  const em = orm.em.fork();
  em.create(Item, { name: 'a?b', email: 'one', meta: { 'k?': 1 } });
  em.create(Item, { name: 'c??d', email: 'two?' });
  await em.flush();
  em.clear();

  await expect(em.find(Item, {}, { orderBy: { id: 'asc' } })).resolves.toMatchObject([
    { name: 'a?b', email: 'one' },
    { name: 'c??d', email: 'two?' },
  ]);
  await expect(em.find(Item, { meta: { 'k?': 1 }, email: 'one' })).resolves.toMatchObject([{ name: 'a?b' }]);
  await expect(
    em
      .createQueryBuilder(Item, 'i')
      .where(sql`lower("i"."name") = ${'c??d'}`)
      .andWhere({ email: 'two?' })
      .getResultList(),
  ).resolves.toMatchObject([{ name: 'c??d' }]);
});
