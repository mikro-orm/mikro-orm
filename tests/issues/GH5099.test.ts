import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

@Entity()
class Publisher {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne()
  owner!: Author;

  constructor(name: string, owner: Author) {
    this.name = name;
    this.owner = owner;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Publisher],
    dbName: ':memory:',
    ensureDatabase: { create: true },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('$some on nested relation', async () => {
  const author1 = new Author('Author 1');
  const author2 = new Author('Author 2');

  const book1 = new Book('Book 1', author1);
  const book2 = new Book('Book 2', author1);
  const book3 = new Book('Book 3', author2);

  const publisher1 = new Publisher('Publisher 1', author1);
  const publisher2 = new Publisher('Publisher 2', author2);

  await orm.em.fork().persistAndFlush([
    publisher1,
    publisher2,
    author1,
    author2,
    book1,
    book2,
    book3,
  ]);

  const res = await orm.em.find(Publisher, {
    owner: {
      books: {
        $some: {
          title: 'Book 2',
        },
      },
    },
  });
  expect(res).toHaveLength(1);
});
