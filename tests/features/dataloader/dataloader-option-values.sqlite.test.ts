import { MikroORM, defineEntity, p, ref, wrap } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.bigint().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
  filters: {
    byName: { name: 'byName', cond: args => ({ name: args.re }), default: false },
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book], dbName: ':memory:' });
  await orm.schema.create();
  const a1 = orm.em.create(Author, { id: 1n, name: 'a1' });
  const a2 = orm.em.create(Author, { id: 2n, name: 'b2' });
  orm.em.create(Book, { title: 'foo1', author: a1 });
  orm.em.create(Book, { title: 'bar1', author: a1 });
  orm.em.create(Book, { title: 'foo2', author: a2 });
  orm.em.create(Book, { title: 'bar2', author: a2 });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

test('1:m collections keep regexp conditions', async () => {
  const em = orm.em.fork();
  const [a1, a2] = await em.find(Author, {}, { orderBy: { id: 1 } });
  const [r1, r2] = await Promise.all([
    a1.books.load({ where: { title: /^foo/ }, dataloader: true }),
    a2.books.load({ where: { title: /^bar/ }, dataloader: true }),
  ]);
  expect(r1.getItems().map(b => b.title)).toEqual(['foo1']);
  expect(r2.getItems().map(b => b.title)).toEqual(['bar2']);
});

test('counts with different regexp conditions are not batched together', async () => {
  const em = orm.em.fork();
  const [a1, a2] = await em.find(Author, {}, { orderBy: { id: 1 } });
  const [c1, c2] = await Promise.all([
    a1.books.loadCount({ where: { title: /^foo1/ }, dataloader: true }),
    a2.books.loadCount({ where: { title: /^bar/ }, dataloader: true }),
  ]);
  expect(c1).toBe(1);
  expect(c2).toBe(1);
});

test('references keep regexp filter params', async () => {
  const em = orm.em.fork();
  const [r1, r2] = await Promise.all([
    ref(em.getReference(Author, 1n)).load({ filters: { byName: { re: /^b/ } }, dataloader: true }),
    ref(em.getReference(Author, 2n)).load({ filters: { byName: { re: /^b/ } }, dataloader: true }),
  ]);
  expect(wrap(r1!).isInitialized()).toBe(false);
  expect(wrap(r2!).isInitialized()).toBe(true);
});
