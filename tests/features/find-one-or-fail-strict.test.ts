import { BigIntType, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey({ type: BigIntType })
  id?: string;

  @Property()
  name!: string;

  @OneToMany({ entity: () => Book, mappedBy: (book: Book) => book.author, orphanRemoval: true })
  books: Collection<Book> = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey({ type: BigIntType })
  id?: string;

  @Property()
  title!: string;

  @ManyToOne({ entity: () => Author })
  author!: Author;

}

describe('GH issue 3051', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      driver: SqliteDriver,
    });

    await orm.schema.createSchema();
    const author = orm.em.create(Author, {
      name: 'Jon Snow',
      books: [{ title: 'b1' }, { title: 'b2' }, { title: 'b3' }],
    });
    await orm.em.fork().persistAndFlush(author);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('find a result and throw if it is not a single entity', async () => {
    const jonSnow = await orm.em.findOneOrFail(Author, { name: 'Jon Snow' }, { strict: true, populate: ['books'] });

    expect(jonSnow).not.toBeNull();

    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true })).rejects.toThrowError(`Wrong number of Book entities found for query { author: '${jonSnow.id}' }, expected exactly one`);
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' })).rejects.toThrowError('Book not found ({ title: \'b4\' })');
    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true, failHandler: () => new Error('Test') })).rejects.toThrowError('Test');
    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true, failHandler: (entityName: string) => new Error(`Failed: ${entityName}`) })).rejects.toThrowError('Failed: Book');
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' }, { strict: true, failHandler: () => new Error('Test') })).rejects.toThrowError('Test');
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' }, { strict: true, failHandler: (entityName: string) => new Error(`Failed: ${entityName}`) })).rejects.toThrowError('Failed: Book');
  });
});
