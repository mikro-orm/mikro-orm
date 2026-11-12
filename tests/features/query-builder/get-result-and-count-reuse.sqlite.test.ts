import { defineEntity, MikroORM, p, raw } from '@mikro-orm/sqlite';

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Book], dbName: ':memory:' });
  await orm.schema.create();
  await orm.em.insertMany(Book, [
    { id: 1, title: 'a' },
    { id: 2, title: 'bbb' },
    { id: 3, title: 'cc' },
    { id: 4, title: 'x' },
  ]);
});

afterAll(() => orm.close(true));

test('getResultAndCount() leaves an explicit select query builder reusable', async () => {
  const qb = orm.em
    .fork()
    .createQueryBuilder(Book, 'b')
    .select(['b.id', 'b.title'])
    .where({ id: { $lt: 4 } })
    .orderBy([{ [raw('length(b.title)')]: 'DESC' }, { 'b.id': 'ASC' }])
    .limit(2);
  const sql = qb.clone().getQuery();

  const [res1, count1] = await qb.getResultAndCount();
  expect(res1.map(b => b.id)).toEqual([2, 3]);
  expect(count1).toBe(3);
  expect(qb.getQuery()).toBe(sql);

  const [res2, count2] = await qb.getResultAndCount();
  expect(res2.map(b => b.id)).toEqual([2, 3]);
  expect(count2).toBe(3);
  expect((await qb.getResultList()).map(b => b.id)).toEqual([2, 3]);
});

test('getResultAndCount() leaves a query builder without explicit type reusable', async () => {
  const qb = orm.em
    .fork()
    .createQueryBuilder(Book, 'b')
    .where({ id: { $gt: 1 } })
    .orderBy({ id: 'desc' })
    .limit(1);

  const [res1, count1] = await qb.getResultAndCount();
  expect(res1.map(b => b.id)).toEqual([4]);
  expect(count1).toBe(3);
  expect((await qb.getResultList()).map(b => b.id)).toEqual([4]);
});
