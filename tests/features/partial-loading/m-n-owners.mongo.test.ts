import { MikroORM, ObjectId, Collection } from '@mikro-orm/mongodb';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @ManyToMany(() => Book)
  books = new Collection<Book, Author>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  title!: string;

  @ManyToMany(() => Author, 'books')
  authors = new Collection<Author, Book>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '123',
    entities: [Author, Book],
  });
  await orm.schema.refresh();

  orm.em.create(Author, {
    name: 'Arthur C. Clark',
    books: [
      { title: "Childhood's End" },
      { title: '2001: A Space Odyssey' },
      { title: 'Rendezvous with Rama' },
    ],
  });

  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  orm.em.clear();
});

test('m:n collections on owning side and partial loading 1 [mongo]', async () => {
  const authors = await orm.em.findAll(Author, { fields: ['name'] });
  // @ts-expect-error
  expect(authors[0].books.isInitialized()).toBe(false);

  const a1 = await orm.em.populate(authors, ['books:ref']);
  expect(a1[0].books.isInitialized()).toBe(true);
  expect(a1[0].books.isInitialized(true)).toBe(false);

  const a2 = await orm.em.populate(authors, ['books']);
  expect(a2[0].books.isInitialized()).toBe(true);
  expect(a2[0].books.isInitialized(true)).toBe(true);
});

test('m:n collections on owning side and partial loading 2 [mongo]', async () => {
  const authors = await orm.em.findAll(Author, { fields: ['name', 'books'], populate: [] });
  expect(authors[0].books.isInitialized()).toBe(true);
  expect(authors[0].books.isInitialized(true)).toBe(false);
  expect(authors[0].books).toHaveLength(3);
});

test('m:n collections on owning side and partial loading 3 [mongo]', async () => {
  const authors = await orm.em.findAll(Author, { fields: ['name', 'books'], populate: ['books:ref'] });
  expect(authors[0].books.isInitialized()).toBe(true);
  expect(authors[0].books.isInitialized(true)).toBe(false);
  expect(authors[0].books).toHaveLength(3);
});

test('m:n collections on owning side and partial loading 4 [mongo]', async () => {
  const authors = await orm.em.findAll(Author, { fields: ['name', 'books'] });
  expect(authors[0].books.isInitialized()).toBe(true);
  expect(authors[0].books.isInitialized(true)).toBe(true);
  expect(authors[0].books).toHaveLength(3);
});
