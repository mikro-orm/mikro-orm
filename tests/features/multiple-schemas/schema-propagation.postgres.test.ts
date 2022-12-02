import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ schema: '*' })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

}

@Entity({ schema: '*' })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => Author, onDelete: 'cascade' })
  author!: Author;

}

describe('GH issue 2909 & 3270', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: 'mikro_orm_test_2909',
      driver: PostgreSqlDriver,
    });

    await orm.schema.refreshDatabase();
    await orm.schema.updateSchema({ schema: 'test' });
    await orm.schema.clearDatabase({ schema: 'test' });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  async function createEntities() {
    const book = new Book();
    book.name = 'b';
    const author = new Author();
    author.name = 'a';
    book.author = author;
    author.books.add(book);
    wrap(book).setSchema('test');
    wrap(author).setSchema('test');
    await orm.em.fork().persistAndFlush(author);

    return author;
  }

  test('populate already loaded entities', async () => {
    await createEntities();
    const books = await orm.em.getRepository(Book).findAll({ schema: 'test' });

    expect(wrap(books[0]).getSchema()).toBe('test');
    expect(wrap(books[0].author).getSchema()).toBe('test');
    expect(wrap(books[0].author).isInitialized()).toBe(false);
    await orm.em.populate(books, ['author']);

    expect(wrap(books[0]).getSchema()).toBe('test');
    expect(wrap(books[0].author).getSchema()).toBe('test');
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].name).toBe('b');
    expect(books[0].author.name).toBe('a');
  });

  test('custom schema should propagate through 1:m relation when both entities have wildcard schema (GH 3270)', async () => {
    const b = new Book();
    b.name = 'b';
    const author = new Author();
    wrap(author).setSchema('test');
    author.name = 'a';
    b.author = author;
    author.books.add(b);
    wrap(author).setSchema('test');
    await orm.em.fork().persistAndFlush(author);

    const a = await orm.em.findOneOrFail(Author, { id: author.id }, { schema: 'test', populate: ['books'] });
    expect(wrap(a).getSchema()).toBe('test');
    expect(wrap(a.books[0]).getSchema()).toBe('test');
  });

  test('populate 1:m relation between two wildcard entities (GH 3270)', async () => {
    const author = await createEntities();

    function assert(a: Author) {
      expect(a.books).toHaveLength(1);
      const books = a.books.getItems();
      expect(books).toHaveLength(1);
      expect(wrap(a).getSchema()).toBe('test');
      expect(wrap(a.books[0]).getSchema()).toBe('test');
    }

    {
      const a = await orm.em.findOneOrFail(Author, { id: author.id }, { schema: 'test' });
      await a.books.loadItems();
      assert(a);
      orm.em.clear();
    }

    {
      const a = await orm.em.findOneOrFail(Author, { id: author.id }, { schema: 'test', populate: ['books'] });
      assert(a);
      orm.em.clear();
    }

    {
      const a = await orm.em.findOneOrFail(Author, { id: author.id }, { schema: 'test' });
      await orm.em.populate(a, ['books'], { schema: 'test' });
      assert(a);
      orm.em.clear();
    }
  });

});
