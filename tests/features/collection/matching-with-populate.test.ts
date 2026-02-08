import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book, book => book.authors)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany({
    entity: () => Author,
    inversedBy: 'books',
    pivotTable: 'book2author',
  })
  authors = new Collection<Author>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const author1 = orm.em.create(Author, {
    id: 1,
    name: 'Author 1',
  });
  const author2 = orm.em.create(Author, {
    id: 2,
    name: 'Author 2',
  });
  const book1 = orm.em.create(Book, {
    id: 1,
    title: 'Book 1',
  });
  const book2 = orm.em.create(Book, {
    id: 2,
    title: 'Book 2',
  });

  author1.books.add(book1, book2);
  author2.books.add(book1, book2);

  await orm.em.flush();
  orm.em.clear();
});

beforeEach(() => {
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('populate many-to-many relations with matching', async () => {
  const author1 = await orm.em.findOneOrFail(Author, 1);
  const books = await author1.books.matching({
    where: { title: 'Book 1' },
    populate: ['authors'],
  });

  expect(books).toHaveLength(1);
  expect(books[0].title).toBe('Book 1');
  expect(books[0].authors).toHaveLength(2);
});
