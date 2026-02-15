import { Collection, LoadStrategy, MikroORM, ref, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../bootstrap.js';

@Entity()
class Country {

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

  @ManyToOne(() => Country)
  country!: Ref<Country>;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

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

describe('populateHints', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Country, Author, Book],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();

    const country = orm.em.create(Country, { name: 'France' });
    const author = orm.em.create(Author, { name: 'Albert Camus', country: ref(country) });
    orm.em.create(Book, { title: 'The Stranger', author });
    orm.em.create(Book, { title: 'The Plague', author });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('joinType override on non-nullable m:1 with joined strategy', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Book, {}, {
      populate: ['author'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        author: { joinType: 'left join' },
      },
    });
    // Non-nullable m:1 would normally use inner join, but we override to left join
    expect(mock.mock.calls[0][0]).toMatch(/left join `author`/);
  });

  test('strategy override from joined to select-in', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Book, {}, {
      populate: ['author'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        author: { strategy: LoadStrategy.SELECT_IN },
      },
    });
    // Should produce two separate queries instead of a join
    expect(mock.mock.calls.length).toBe(2);
    expect(mock.mock.calls[0][0]).not.toMatch(/join `author`/);
  });

  test('nested path hint applies to correct level', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Author, {}, {
      populate: ['books.author.country'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        'books.author': { joinType: 'left join' },
      },
    });
    // The nested `author` join within `books` should be left join
    // SQL uses grouped join: left join (`author` as `a2` inner join `country` ...) on ...
    const sql = mock.mock.calls[0][0];
    expect(sql).toMatch(/left join `book`/);
    expect(sql).toMatch(/left join \(`author`/);
  });

  test('strategy override on nested path', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Book, {}, {
      populate: ['author.country'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        'author.country': { strategy: LoadStrategy.SELECT_IN },
      },
    });
    // author should still be joined, but country should be a separate query
    const firstQuery = mock.mock.calls[0][0];
    expect(firstQuery).toMatch(/join `author`/);
    expect(firstQuery).not.toMatch(/join `country`/);
    // country loaded via separate select-in query
    expect(mock.mock.calls.length).toBe(2);
  });

  test('hints for non-existent paths are silently ignored', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Book, {}, {
      populate: ['author'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        nonexistent: { joinType: 'left join' },
      } as any,
    });
    // Should still work normally without errors
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(/join `author`/);
  });

  test('multiple hints for different relations', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.fork().find(Author, {}, {
      populate: ['books', 'country'],
      strategy: LoadStrategy.JOINED,
      populateHints: {
        books: { joinType: 'inner join' },
        country: { joinType: 'left join' },
      },
    });
    const sql = mock.mock.calls[0][0];
    expect(sql).toMatch(/inner join `book`/);
    expect(sql).toMatch(/left join `country`/);
  });
});
