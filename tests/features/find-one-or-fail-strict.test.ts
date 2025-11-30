import { Collection, MikroORM } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id?: bigint;

  @Property()
  name!: string;

  @OneToMany({ entity: () => Book, mappedBy: (book: Book) => book.author, orphanRemoval: true })
  books: Collection<Book> = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id?: bigint;

  @Property()
  title!: string;

  @ManyToOne({ entity: () => Author })
  author!: Author;

}

describe('GH issue 3051', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: ':memory:',
      driver: SqliteDriver,
    });

    await orm.schema.create();
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

    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true })).rejects.toThrow(`Wrong number of Book entities found for query { author: ${jonSnow.id}n }, expected exactly one`);
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' })).rejects.toThrow('Book not found ({ title: \'b4\' })');
    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true, failHandler: () => new Error('Test') })).rejects.toThrow('Test');
    await expect(orm.em.findOneOrFail(Book, { author: jonSnow }, { strict: true, failHandler: (entityName: string) => new Error(`Failed: ${entityName}`) })).rejects.toThrow('Failed: Book');
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' }, { strict: true, failHandler: () => new Error('Test') })).rejects.toThrow('Test');
    await expect(orm.em.findOneOrFail(Book, { title: 'b4' }, { strict: true, failHandler: (entityName: string) => new Error(`Failed: ${entityName}`) })).rejects.toThrow('Failed: Book');
  });
});
