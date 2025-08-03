import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({
    entity: () => Book,
    mappedBy: (book: Book) => book.author,
    orphanRemoval: true,
  })
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => Author,
  })
  author!: Author;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  orm.em.create(Author, {
    name: 'Foo',
    books: [
      { name: 'Foo' },
      { name: 'Bar' },
    ],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('orphan removal, relation reconstruction (joined strategy)', async () => {
  const author = await orm.em.findOneOrFail(Author, { name: 'Foo' }, {
    populate: ['books'],
    strategy: 'joined',
  });
  const books = author.books.getItems();
  orm.em.assign(author, { books: [] });

  for (const book of books) {
    book.author = author;
  }

  await orm.em.flush();

  expect(author.books.count()).toBe(2);
});

test('orphan removal, relation reconstruction (balanced strategy)', async () => {
  const author = await orm.em.findOneOrFail(Author, { name: 'Foo' }, {
    populate: ['books'],
    strategy: 'balanced',
  });
  const books = author.books.getItems();
  orm.em.assign(author, { books: [] });

  for (const book of books) {
    book.author = author;
  }

  await orm.em.flush();

  expect(author.books.count()).toBe(2);
});
