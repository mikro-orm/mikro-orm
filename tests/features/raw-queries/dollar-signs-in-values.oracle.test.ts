import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/oracledb';
import { sql } from 'kysely';

const Item = defineEntity({
  name: 'Item',
  tableName: 'ds_item',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const values = ['price $5', '$2b$10$abcdefghijklmnopqrstuv', '$1', 'a$10b'];

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item],
    dbName: 'mikro_orm_test_dollar_signs',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.schema.clear());

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

async function stored(): Promise<string[]> {
  const rows = await orm.em.fork().find(Item, {}, { orderBy: { id: 'asc' } });
  return rows.map(row => row.name);
}

test('flush keeps dollar signs followed by digits in values', async () => {
  const em = orm.em.fork();
  values.forEach(name => em.create(Item, { name }));
  await em.flush();

  await expect(stored()).resolves.toEqual(values);

  const [first] = await em.fork().find(Item, { name: values[0] });
  first.name = values[1];
  await orm.em.fork().persist(first).flush();
  await expect(stored()).resolves.toEqual([values[1], ...values.slice(1)]);
});

test('single row flush keeps dollar signs followed by digits in values', async () => {
  for (const name of values) {
    const em = orm.em.fork();
    em.create(Item, { name });
    await em.flush();
  }
  await expect(stored()).resolves.toEqual(values);
});

test('native queries keep dollar signs followed by digits in values', async () => {
  const em = orm.em.fork();

  for (const name of values) {
    await em.insert(Item, { name });
  }
  await expect(stored()).resolves.toEqual(values);
  await em.insertMany(
    Item,
    values.map(name => ({ name })),
  );
  await expect(stored()).resolves.toEqual([...values, ...values]);

  await em.nativeUpdate(Item, { name: '$1' }, { name: 'a$2$3' });
  await expect(em.count(Item, { name: 'a$2$3' })).resolves.toBe(2);
  await expect(em.count(Item, { name: { $in: ['price $5', 'a$10b'] } })).resolves.toBe(4);
});

test('kysely queries bind values with dollar signs followed by digits', async () => {
  const em = orm.em.fork();
  await em.insertMany(
    Item,
    values.map(name => ({ name })),
  );
  const kysely = em.getKysely();

  for (const name of values) {
    const compiled = sql<{ name: string }>`select "name" from "ds_item" where "name" = ${name} and "id" > ${0}`.compile(
      kysely,
    );
    const res = await kysely.executeQuery(compiled);
    expect(res.rows).toEqual([{ name }]);
  }
});
