import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

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
    { id: 2, title: 'b' },
    { id: 3, title: 'c' },
  ]);
});

beforeEach(() => orm.em.clear());

afterAll(() => orm.close(true));

test('em.find() with offset and no limit', async () => {
  const books = await orm.em.find(Book, {}, { orderBy: { id: 'asc' }, offset: 1 });
  expect(books.map(b => b.id)).toEqual([2, 3]);
});

test('qb.offset() with no limit', async () => {
  const qb = orm.em.createQueryBuilder(Book, 'b').select('*').orderBy({ id: 'asc' }).offset(1);
  expect(qb.getQuery()).toBe('select `b`.* from `book` as `b` order by `b`.`id` asc limit -1 offset ?');
  const books = await qb.getResultList();
  expect(books.map(b => b.id)).toEqual([2, 3]);
});
