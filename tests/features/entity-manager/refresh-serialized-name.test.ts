import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string().serializedName('bookTitle'),
    author: () => p.manyToOne(Author).serializedName('writer'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Book, Author], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  em.create(Author, { id: 2, name: 'b' });
  em.create(Book, { id: 1, title: 't1', author: { id: 1, name: 'a' } });
  await em.flush();
});

afterAll(() => orm.close(true));

test('em.refresh() reloads properties with `serializedName`', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);
  await orm.em.fork().nativeUpdate(Book, 1, { title: 't2', author: 2 });
  await em.refresh(book);
  expect(book.title).toBe('t2');
  expect(book.author.id).toBe(2);
});

test('em.refresh() reloads properties with `serializedName` on detached entity', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);
  em.clear();
  await orm.em.fork().nativeUpdate(Book, 1, { title: 't2', author: 2 });
  await em.refresh(book);
  expect(book.title).toBe('t2');
  expect(book.author.id).toBe(2);
});
