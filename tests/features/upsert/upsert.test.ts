import { MikroORM, Entity, PrimaryKey, ManyToOne, Property, SimpleLogger } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';

@Entity()
export class Author {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = Author.id++;

  @Property({ unique: true })
  email: string;

  @Property({ name: 'current_age' })
  age: number;

  constructor(email: string, age: number) {
    this.email = email;
    this.age = age;
  }

}

@Entity()
export class Book {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = Book.id++;

  @ManyToOne(() => Author)
  author: Author;

  @Property()
  name: string;

  constructor(name: string, author: Author) {
    this.name = name;
    this.author = author;
  }

}

const options = {
  'sqlite': { dbName: ':memory:' },
  'better-sqlite': { dbName: ':memory:' },
  'mysql': { dbName: 'mikro_orm_upsert', port: 3308 },
  'mariadb': { dbName: 'mikro_orm_upsert', port: 3309 },
  'postgresql': { dbName: 'mikro_orm_upsert' },
  'mongo': { dbName: 'mikro_orm_upsert' },
};

describe.each(Object.keys(options))('em.upsert [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      type,
      loggerFactory: options => new SimpleLogger(options),
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    Author.id = Book.id = 1;
  });

  afterAll(() => orm.close());

  async function createEntities() {
    const books = [
      new Book('b1', new Author('a1', 31)),
      new Book('b2', new Author('a2', 32)),
      new Book('b3', new Author('a3', 33)),
    ];
    await orm.em.persist(books).flush();
    expect(books.map(b => b.id)).toEqual([1, 2, 3]);
    expect(books.map(b => b.author.id)).toEqual([1, 2, 3]);

    return books;
  }

  async function assert(author: Author, mock: jest.Mock) {
    expect(mock.mock.calls).toMatchSnapshot();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    author.age = 123;
    await orm.em.flush();
    expect(mock).toBeCalled();

    orm.em.clear();
    const authors = await orm.em.find(Author, {}, { orderBy: { email: 'asc' } });
    expect(authors).toHaveLength(3);

    mock.mockReset();
    authors[1].age = 321;
    const author12 = await orm.em.upsert(authors[0]); // exists
    const author22 = await orm.em.upsert(authors[1]); // exists
    const author32 = await orm.em.upsert(authors[2]); // exists
    expect(author12).toBe(authors[0]);
    expect(author22).toBe(authors[1]);
    expect(author32).toBe(authors[2]);
    expect(author22.age).toBe(321);
    expect(mock).not.toBeCalled();
    await orm.em.flush();
    await orm.em.refresh(author22);
    expect(author22.age).toBe(321);
  }

  test('em.upsert(Type, data) with PK', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const author1 = await orm.em.upsert(Author, { id: 1, email: 'a1', age: 41 }); // exists
    const author2 = await orm.em.upsert(Author, { id: 2, email: 'a2', age: 42 }); // inserts
    const author3 = await orm.em.upsert(Author, { id: 3, email: 'a3', age: 43 }); // inserts

    await assert(author2, mock);
  });

  test('em.upsert(Type, data) with unique property', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const author1 = await orm.em.upsert(Author, { email: 'a1', age: 41 }); // exists
    const author2 = await orm.em.upsert(Author, { email: 'a2', age: 42 }); // inserts
    const author3 = await orm.em.upsert(Author, { email: 'a3', age: 43 }); // inserts

    await assert(author2, mock);
  });

  test('em.upsert(entity)', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const a1 = orm.em.create(Author, { id: 1, email: 'a1', age: 41 });
    const a2 = orm.em.create(Author, { id: 2, email: 'a2', age: 42 });
    const a3 = orm.em.create(Author, { id: 3, email: 'a3', age: 43 });
    const author1 = await orm.em.upsert(a1); // exists
    const author2 = await orm.em.upsert(a2); // inserts
    const author3 = await orm.em.upsert(a3); // inserts
    expect(a1).toBe(author1);
    expect(a2).toBe(author2);
    expect(a3).toBe(author3);

    await assert(author2, mock);
  });
});
