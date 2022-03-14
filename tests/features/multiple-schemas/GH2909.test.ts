import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';

@Entity({ schema: '*' })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

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

describe('GH issue 2909', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: 'mikro_orm_test_2909',
      type: 'postgresql',
    });

    await orm.getSchemaGenerator().refreshDatabase();
    await orm.getSchemaGenerator().updateSchema({ schema: 'test' });
    await orm.getSchemaGenerator().clearDatabase({ schema: 'test' });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populate already loaded entities', async () => {
    const b = new Book();
    b.name = 'b';
    const author = new Author();
    author.name = 'a';
    b.author = author;
    wrap(b).setSchema('test');
    wrap(b.author).setSchema('test');
    await orm.em.fork().persistAndFlush(b);
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

});
