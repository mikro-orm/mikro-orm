import { Collection, ValidationError } from '@mikro-orm/core';
import { MikroORM, type Options } from '@mikro-orm/sql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

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

const drivers: [string, Options][] = [
  ['sqlite', { driver: SqliteDriver, dbName: ':memory:' }],
  ['mysql', { driver: MySqlDriver, dbName: 'mikro_orm_test_string_limit', port: 3308 }],
];

// values typically coming untyped from an HTTP query string
const str = (v: unknown) => v as number;

describe.each(drivers)('numeric string limit and offset (%s)', (_, options) => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...options,
      entities: [Author, Book],
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();

    for (let i = 1; i <= 5; i++) {
      orm.em.create(Author, {
        id: i,
        name: `a${i}`,
        books: [1, 2, 3].map(j => ({ id: i * 10 + j, title: `b${i}-${j}` })),
      });
    }

    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('em.find and em.findAndCount', async () => {
    const authors = await orm.em.find(Author, {}, { limit: str('2'), offset: str('1'), orderBy: { id: 'asc' } });
    expect(authors.map(a => a.id)).toEqual([2, 3]);

    const [res, count] = await orm.em.findAndCount(Author, {}, { limit: str('2'), orderBy: { id: 'asc' } });
    expect(res.map(a => a.id)).toEqual([1, 2]);
    expect(count).toBe(5);
  });

  test('em.findByCursor', async () => {
    const cursor = await orm.em.findByCursor(Author, { first: str('2'), orderBy: { id: 'asc' } });
    expect(cursor.items.map(a => a.id)).toEqual([1, 2]);
    expect(cursor.hasNextPage).toBe(true);

    const prev = await orm.em.findByCursor(Author, { last: str('2'), orderBy: { id: 'asc' } });
    expect(prev.items.map(a => a.id)).toEqual([4, 5]);
    expect(prev.hasPrevPage).toBe(true);
  });

  test('populate hints and Collection.matching', async () => {
    const authors = await orm.em.find(
      Author,
      {},
      {
        populate: ['books'],
        populateHints: { books: { limit: str('1'), offset: str('1') } },
        orderBy: { id: 'asc', books: { id: 'asc' } },
      },
    );
    expect(authors[0].books.getItems().map(b => b.id)).toEqual([12]);

    const author = await orm.em.findOneOrFail(Author, 1);
    const books = await author.books.matching({ limit: str('1'), offset: str('2'), orderBy: { id: 'asc' } });
    expect(books.map(b => b.id)).toEqual([13]);
  });

  test('QueryBuilder.limit() and offset()', async () => {
    const qb = orm.em.createQueryBuilder(Author).select('id').limit(str('2'), str('1')).orderBy({ id: 'asc' });
    expect(qb.getParams()).toEqual([2, 1]);
    const res = await qb.execute();
    expect(res.map(a => a.id)).toEqual([2, 3]);

    const qb2 = orm.em.createQueryBuilder(Author).select('id').limit(1).offset(str('4')).orderBy({ id: 'asc' });
    expect(qb2.getParams()).toEqual([1, 4]);
    expect((await qb2.execute()).map(a => a.id)).toEqual([5]);
  });

  test('null and undefined keep meaning no limit or offset', async () => {
    const authors = await orm.em.find(Author, {}, { limit: undefined, offset: null as any });
    expect(authors).toHaveLength(5);
    expect(orm.em.createQueryBuilder(Author).limit(undefined).offset(undefined).getParams()).toEqual([]);
  });

  test('numbers are passed through as before', async () => {
    expect(orm.em.createQueryBuilder(Author).limit(-1).offset(1.5).getParams()).toEqual([-1, 1.5]);
  });

  test.each(['abc', '1; x', '', ' 1', '1e1', '-1', '1.5'])('invalid string %j is rejected', async value => {
    const err = /expected a number or a string with a non-negative integer/;
    await expect(orm.em.find(Author, {}, { limit: str(value) })).rejects.toThrow(ValidationError);
    await expect(orm.em.find(Author, {}, { limit: str(value) })).rejects.toThrow(err);
    await expect(orm.em.find(Author, {}, { offset: str(value) })).rejects.toThrow(err);
    await expect(orm.em.findAndCount(Author, {}, { limit: str(value) })).rejects.toThrow(err);
    await expect(orm.em.findByCursor(Author, { first: str(value), orderBy: { id: 'asc' } })).rejects.toThrow(err);
    await expect(orm.em.findByCursor(Author, { last: str(value), orderBy: { id: 'asc' } })).rejects.toThrow(err);
    await expect(
      orm.em.find(Author, {}, { populate: ['books'], populateHints: { books: { limit: str(value) } } }),
    ).rejects.toThrow(err);
    expect(() => orm.em.createQueryBuilder(Author).limit(str(value))).toThrow(err);
    expect(() => orm.em.createQueryBuilder(Author).offset(str(value))).toThrow(err);
  });
});
