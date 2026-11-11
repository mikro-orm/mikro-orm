import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Profile = defineEntity({
  name: 'Profile',
  embeddable: true,
  properties: {
    a: p.string(),
  },
});

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
    label: p.string(),
    author: () => p.manyToOne(Author),
    profile: () => p.embedded(Profile),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: ':memory:', entities: [Author, Book, Profile] });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(Author, { id: 1, name: 'a1' });
  em.create(Author, { id: 2, name: 'a2' });
  em.create(Book, { id: 1, label: 'foo', author: 1, profile: { a: 'A' } });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('values changed in a transactional fork are merged back to the parent entity', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);

  await em.transactional(
    async fork => {
      const b = await fork.findOneOrFail(Book, 1);
      b.label = 'bar';
      b.author = fork.getReference(Author, 2);
      b.profile = { a: 'B' };
    },
    { clear: true },
  );

  expect(book.label).toBe('bar');
  expect(book.author.id).toBe(2);
  expect(book.profile.a).toBe('B');
  expect(Object.keys(book)).toEqual(['id', 'label', 'author', 'profile']);

  const fresh = await orm.em.fork().findOneOrFail(Book, 1);
  expect(fresh.label).toBe('bar');
  expect(fresh.author.id).toBe(2);
  expect(fresh.profile.a).toBe('B');
});
