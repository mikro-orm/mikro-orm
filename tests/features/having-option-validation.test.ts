import { Entity, MikroORM, PrimaryKey, Property, raw, ValidationError } from '@mikro-orm/sqlite';

@Entity()
class Item {

  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item], dbName: ':memory:' });
  await orm.schema.createSchema();
  await orm.em.insertMany(Item, [
    { id: 1, label: 'a' },
    { id: 2, label: 'a' },
    { id: 3, label: 'b' },
  ]);
});

afterAll(() => orm.close(true));

const groupBy = ['id', 'label'];
const having = 'count(*) > 0' as any;

test.each([
  ['find', () => orm.em.fork().find(Item, {}, { groupBy, having })],
  ['findOne', () => orm.em.fork().findOne(Item, { id: 1 }, { groupBy, having })],
  ['findAndCount', () => orm.em.fork().findAndCount(Item, {}, { groupBy, having })],
  ['findByCursor', () => orm.em.fork().findByCursor(Item, {}, { first: 1, orderBy: { id: 'asc' }, groupBy, having })],
  ['count', () => orm.em.fork().count(Item, {}, { groupBy: ['id'], having })],
] as [string, () => Promise<unknown>][])('string `having` is rejected in em.%s()', async (_, run) => {
  const err = await run().catch(e => e);
  expect(err).toBeInstanceOf(ValidationError);
  expect(err).toHaveProperty('message', `Invalid query condition: 'count(*) > 0'`);
});

test('object `having` with raw fragments keeps working', async () => {
  const having = { [raw('count(*)')]: { $gt: 1 } };
  const res = await orm.em.fork().find(Item, {}, { groupBy: ['label'], fields: ['label'], having });
  expect(res).toHaveLength(1);
});

test('raw string `having` keeps working on the query builder', async () => {
  const qb = orm.em.fork().createQueryBuilder(Item).select('label').groupBy('label').having('count(*) > ?', [1]);
  await expect(qb.execute()).resolves.toEqual([{ label: 'a' }]);
});
