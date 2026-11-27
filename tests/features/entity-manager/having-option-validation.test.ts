import { MikroORM, ValidationError, defineEntity, p, raw } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    label: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item], dbName: ':memory:' });
  await orm.schema.create();
  await orm.em.insertMany(Item, [
    { id: 1, label: 'a' },
    { id: 2, label: 'a' },
    { id: 3, label: 'b' },
  ]);
});

afterAll(() => orm.close(true));

const groupBy = ['id', 'label'];
const having = 'count(*) > 0' as any;
const message = `Invalid query condition: 'count(*) > 0'`;

test.each([
  ['find', () => orm.em.fork().find(Item, {}, { groupBy, having })],
  ['findOne', () => orm.em.fork().findOne(Item, { id: 1 }, { groupBy, having })],
  ['findAndCount', () => orm.em.fork().findAndCount(Item, {}, { groupBy, having })],
  ['findByCursor', () => orm.em.fork().findByCursor(Item, { first: 1, orderBy: { id: 'asc' }, groupBy, having })],
  ['count', () => orm.em.fork().count(Item, {}, { groupBy: ['id'], having })],
  ['countBy', () => orm.em.fork().countBy(Item, 'label', { having })],
  [
    'stream',
    async () => {
      for await (const _ of orm.em.fork().stream(Item, { groupBy, having })) {
        // drain
      }
    },
  ],
] as [string, () => Promise<unknown>][])('string `having` is rejected in em.%s()', async (_, run) => {
  const err = await run().catch(e => e);
  expect(err).toBeInstanceOf(ValidationError);
  expect(err).toHaveProperty('message', message);
});

test('object `having` with raw fragments keeps working', async () => {
  const em = orm.em.fork();
  const having = { [raw('count(*)')]: { $gt: 1 } };

  await expect(em.find(Item, {}, { groupBy: ['label'], fields: ['label'], having })).resolves.toHaveLength(1);
  await expect(em.countBy(Item, 'label', { having })).resolves.toEqual({ a: 2 });
});

test('raw string `having` keeps working on the query builder', async () => {
  const qb = orm.em.fork().createQueryBuilder(Item).select('label').groupBy('label').having('count(*) > ?', [1]);
  await expect(qb.execute()).resolves.toEqual([{ label: 'a' }]);
});
