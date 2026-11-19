import { MikroORM, Ref, Rel } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @ManyToOne(() => Publisher, { ref: true })
  publisher!: Ref<Publisher>;

  @OneToOne(() => Profile, p => p.author)
  profile?: Rel<Profile>;
}

@Entity()
class Profile {
  @PrimaryKey()
  id!: number;

  @Property()
  bio!: string;

  @Property()
  website!: string;

  @OneToOne(() => Author, { owner: true })
  author!: Author;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Publisher, Author, Profile, Book],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.create();

  const publisher = orm.em.create(Publisher, { id: 1, name: 'p1' });

  for (let i = 1; i <= 3; i++) {
    const author = orm.em.create(Author, { id: i, name: `a${i}`, email: `a${i}@x`, publisher });
    orm.em.create(Profile, { id: i, bio: `bio${i}`, website: `w${i}`, author });
    orm.em.create(Book, { id: i, title: `b${i}`, author });
  }

  await orm.em.flush();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('to-one populate with fields reloads only targets that miss a requested field', async () => {
  await orm.em.find(Book, {}, { populate: ['author'], fields: ['title', 'author.name'] });

  const mock = mockLogger(orm);
  const books = await orm.em.find(Book, {}, { populate: ['author'], fields: ['title', 'author.name'] });
  expect(mock.mock.calls).toHaveLength(1);
  expect(books.map(b => b.author.name)).toEqual(['a1', 'a2', 'a3']);

  mock.mockReset();
  const books2 = await orm.em.find(
    Book,
    {},
    { populate: ['author'], fields: ['title', 'author.name', 'author.email'] },
  );
  expect(mock.mock.calls).toHaveLength(2);
  expect(mock.mock.calls[1][0]).toMatch('from `author`');
  expect(books2.map(b => b.author.email)).toEqual(['a1@x', 'a2@x', 'a3@x']);
});

test('to-one populate with fields reloads targets that are uninitialized references', async () => {
  orm.em.getReference(Author, 1);
  await orm.em.find(Author, { id: 2 }, { fields: ['name'] });

  const mock = mockLogger(orm);
  const books = await orm.em.find(Book, {}, { populate: ['author'], fields: ['title', 'author.name'] });
  expect(mock.mock.calls).toHaveLength(2);
  expect(mock.mock.calls[1][0]).toMatch('from `author`');
  expect(books.map(b => b.author.name)).toEqual(['a1', 'a2', 'a3']);
});

test('`:ref` children in fields do not force a reload of loaded targets', async () => {
  const options = {
    populate: ['author', 'author.publisher:ref'] as const,
    fields: ['title', 'author.name', 'author.publisher'] as const,
  };
  await orm.em.find(Book, {}, options);

  const mock = mockLogger(orm);
  const books = await orm.em.find(Book, {}, options);
  expect(mock.mock.calls).toHaveLength(1);
  expect(books.map(b => b.author.publisher.id)).toEqual([1, 1, 1]);
});

test('inverse 1:1 populate with fields loads the requested fields of loaded targets', async () => {
  await orm.em.find(Author, {}, { populate: ['profile'], fields: ['name', 'profile.bio'] });

  const mock = mockLogger(orm);
  const authors = await orm.em.find(Author, {}, { populate: ['profile'], fields: ['name', 'profile.bio'] });
  expect(mock.mock.calls).toHaveLength(1);
  expect(authors.map(a => a.profile!.bio)).toEqual(['bio1', 'bio2', 'bio3']);

  mock.mockReset();
  // the inverse 1:1 is joined to the main query, so the missing field needs no extra query
  const authors2 = await orm.em.find(Author, {}, { populate: ['profile'], fields: ['name', 'profile.website'] });
  expect(mock.mock.calls).toHaveLength(1);
  expect(authors2.map(a => a.profile!.website)).toEqual(['w1', 'w2', 'w3']);
});

test('em.populate() with fields skips loaded targets and loads the missing fields', async () => {
  const books = await orm.em.find(Book, {}, { populate: ['author'], fields: ['title', 'author.name'] });

  const mock = mockLogger(orm);
  await orm.em.populate(books, ['author'], { fields: ['title', 'author.name'] as any });
  expect(mock.mock.calls).toHaveLength(0);

  await orm.em.populate(books, ['author'], { fields: ['title', 'author.name', 'author.email'] as any });
  expect(mock.mock.calls).toHaveLength(1);
  expect(books.map(b => (b.author as Author).email)).toEqual(['a1@x', 'a2@x', 'a3@x']);
});

test('em.populate() of an inverse 1:1 with fields reloads only targets that miss a requested field', async () => {
  const authors = await orm.em.find(Author, {}, { populate: ['profile'], fields: ['name', 'profile.bio'] });

  const mock = mockLogger(orm);
  await orm.em.populate(authors, ['profile'], { fields: ['name', 'profile.bio'] as any });
  expect(mock.mock.calls).toHaveLength(0);

  await orm.em.populate(authors, ['profile'], { fields: ['name', 'profile.website'] as any });
  expect(mock.mock.calls).toHaveLength(1);
  expect(mock.mock.calls[0][0]).toMatch('from `profile`');
  expect(authors.map(a => (a.profile as Profile).website)).toEqual(['w1', 'w2', 'w3']);

  mock.mockReset();
  await orm.em.populate(authors, ['profile'], { fields: ['name'] as any });
  expect(mock.mock.calls).toHaveLength(0);
});
