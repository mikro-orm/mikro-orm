import { MikroORM, defineEntity, p, wrap } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

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
    title: p.string(),
    author: () => p.manyToOne(Author).nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.merge() marks a new entity with PK as managed', async () => {
  const em = orm.em.fork();
  const a = em.create(Author, { id: 5, name: 'x' }, { persist: false });
  expect(wrap(a).isManaged()).toBe(false);

  const merged = em.merge(a);
  expect(merged).toBe(a);
  expect(wrap(a).isManaged()).toBe(true);
  expect(em.getUnitOfWork().getIdentityMap().values()).toContain(a);
});

test('merged entity is updated, not inserted, on flush', async () => {
  await orm.em.fork().insert(Author, { id: 5, name: 'x' });

  const em = orm.em.fork();
  const a = em.create(Author, { id: 5, name: 'x' }, { persist: false });
  em.merge(a);
  a.name = 'y';

  const mock = mockLogger(orm);
  await em.flush();

  const queries = mock.mock.calls.map(c => c[0]);
  expect(queries.some(q => q.includes("update `author` set `name` = 'y' where `id` = 5"))).toBe(true);
  expect(queries.some(q => q.includes('insert'))).toBe(false);
  expect(wrap(a).isManaged()).toBe(true);

  const fresh = await orm.em.fork().findOneOrFail(Author, 5);
  expect(fresh.name).toBe('y');
});

test('cascading merge skips related entities that are not managed', async () => {
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'a' }, { persist: false });
  const book = em.create(Book, { id: 1, title: 'b', author }, { persist: false });

  em.merge(book);

  expect(wrap(book).isManaged()).toBe(true);
  expect(wrap(author).isManaged()).toBe(false);
  const identityMap = em.getUnitOfWork().getIdentityMap().values();
  expect(identityMap).toContain(book);
  expect(identityMap).not.toContain(author);
});

test('cascading merge still re-merges related managed entities', async () => {
  await orm.em.fork().insert(Author, { id: 1, name: 'a' });
  await orm.em.fork().insert(Book, { id: 1, title: 'b', author: 1 });

  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'a' }, { persist: false });
  em.merge(author);
  const book = em.create(Book, { id: 1, title: 'b', author }, { persist: false });
  em.merge(book);

  expect(wrap(author).isManaged()).toBe(true);
  expect(wrap(book).isManaged()).toBe(true);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual(expect.arrayContaining([author, book]));

  author.name = 'a2';
  book.title = 'b2';
  const mock = mockLogger(orm);
  await em.flush();

  const queries = mock.mock.calls.map(c => c[0]);
  expect(queries.filter(q => q.includes('update')).length).toBe(2);
  expect(queries.some(q => q.includes('insert'))).toBe(false);
});

test('em.merge() with cascade: false marks the entity as managed', async () => {
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'a' }, { persist: false });
  const book = em.create(Book, { id: 1, title: 'b', author }, { persist: false });

  em.merge(book, { cascade: false });

  expect(wrap(book).isManaged()).toBe(true);
  expect(wrap(author).isManaged()).toBe(false);
  const identityMap = em.getUnitOfWork().getIdentityMap().values();
  expect(identityMap).toContain(book);
  expect(identityMap).not.toContain(author);
});

test('merged entity serializes as a PK when nested and not populated', async () => {
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'a' }, { persist: false });
  em.merge(author);
  const book = em.create(Book, { id: 1, title: 'b', author }, { persist: false });

  expect(wrap(book).toObject()).toEqual({ id: 1, title: 'b', author: 1 });
});

test('merging an already merged entity again keeps its pending changes', async () => {
  await orm.em.fork().insert(Author, { id: 5, name: 'x' });

  const em = orm.em.fork();
  const a = em.create(Author, { id: 5, name: 'x' }, { persist: false });
  em.merge(a);
  a.name = 'y';
  em.merge(a);
  await em.flush();

  const fresh = await orm.em.fork().findOneOrFail(Author, 5);
  expect(fresh.name).toBe('y');
});

test('merged entity can be removed after being persisted', async () => {
  await orm.em.fork().insert(Author, { id: 5, name: 'x' });

  const em = orm.em.fork();
  const a = em.create(Author, { id: 5, name: 'x' }, { persist: false });
  em.merge(a);
  em.persist(a);
  em.remove(a);
  await em.flush();

  expect(await orm.em.fork().count(Author)).toBe(0);
});
