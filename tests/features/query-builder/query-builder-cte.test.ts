import { type Ref, raw, Utils } from '@mikro-orm/core';
import { MikroORM, type AbstractSqlDriver, type SelectQueryBuilder } from '@mikro-orm/sql';
import { Entity, PrimaryKey, Property, ManyToOne, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  age?: number;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Ref<Author>;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_cte', port: 3308 },
  postgresql: { dbName: 'mikro_orm_cte' },
  mssql: { dbName: 'mikro_orm_cte', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('CTE [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Author, Book],
      driver: PLATFORMS[type],
      metadataProvider: ReflectMetadataProvider,
      ...options[type],
    });
    await orm.schema.refresh();

    const alice = orm.em.create(Author, { name: 'Alice', age: 25 });
    const bob = orm.em.create(Author, { name: 'Bob', age: 50 });
    orm.em.create(Author, { name: 'Charlie', age: 45 });
    orm.em.create(Author, { name: 'Dave', age: 20 });
    orm.em.create(Book, { title: 'Alice Book', author: alice });
    orm.em.create(Book, { title: 'Bob Book', author: bob });
    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close());

  test('CTE select', async () => {
    const sub = orm.em
      .createQueryBuilder(Author, 'a')
      .select(['a.id', 'a.name'])
      .where({ age: { $gte: 50 } });
    const qb = orm.em.createQueryBuilder(Author).with('older', sub).select('*').from('older', 'o');

    const rows = await qb.execute<{ id: number; name: string }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Bob');
  });

  test('CTE with FROM string overload', async () => {
    const sub = orm.em
      .createQueryBuilder(Author, 'a')
      .select(['a.name', 'a.age'])
      .where({ age: { $gte: 45 } });
    const qb = orm.em.createQueryBuilder(Author).with('older_authors', sub).select('*').from('older_authors', 'oa');

    const rows = await qb.execute<{ name: string; age: number }[]>();
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.name).sort()).toEqual(['Bob', 'Charlie']);
  });

  test('recursive CTE', async () => {
    const qb = orm.em
      .createQueryBuilder(Author)
      .withRecursive('seq', raw('select 1 as n union all select n + 1 from seq where n < ?', [5]))
      .select('*')
      .from('seq', 's');

    const rows = await qb.execute<{ n: number }[]>();
    expect(rows).toHaveLength(5);
    expect(rows.map((r: { n: number }) => r.n)).toEqual([1, 2, 3, 4, 5]);
  });

  test('CTE with getCount()', async () => {
    const sub = orm.em
      .createQueryBuilder(Author, 'a')
      .select('*')
      .where({ age: { $gte: 45 } });
    const qb = orm.em.createQueryBuilder(Author).with('old_authors', sub).select('*').from('old_authors', 'oa');

    const count = await qb.getCount();
    expect(count).toBe(2);
  });

  test('multiple CTEs', async () => {
    const authorsCte = orm.em.createQueryBuilder(Author, 'a').select(['a.id', 'a.name']).where({ name: 'Bob' });
    const booksCte = orm.em.createQueryBuilder(Book, 'b').select(['b.id', 'b.title']).where({ title: 'Bob Book' });

    const qb = orm.em
      .createQueryBuilder(Author, 'a2')
      .with('a_cte', authorsCte)
      .with('b_cte', booksCte)
      .select('*')
      .where({ name: 'Bob' });

    const results = await qb.getResultList();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Bob');
  });

  test('CTE with entity QB body used in FROM', async () => {
    const sub = orm.em
      .createQueryBuilder(Author, 'a')
      .select('*')
      .where({ age: { $gte: 50 } });
    const qb = orm.em.createQueryBuilder(Author).with('seniors', sub).select('*').from('seniors', 's');

    const rows = await qb.execute<{ name: string }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Bob');
  });

  test('duplicate CTE name throws', () => {
    const sub = orm.em.createQueryBuilder(Author, 'a').select('*');
    expect(() => {
      orm.em.createQueryBuilder(Author, 'a2').with('cte', sub).with('cte', sub);
    }).toThrow(`CTE with name 'cte' already exists`);
  });

  test('CTE FROM does not schema-qualify the CTE name', () => {
    const sub = orm.em.createQueryBuilder(Author, 'a').select('*');
    const qb = orm.em
      .createQueryBuilder(Author)
      .withSchema('custom_schema')
      .with('my_cte', sub)
      .select('*')
      .from('my_cte', 'mc');

    const sql = qb.getFormattedQuery();
    // CTE name in FROM must NOT be schema-qualified
    expect(sql).not.toMatch(/custom_schema.*my_cte/);
  });

  test('CTE type-safe from() infers entity type', async () => {
    const sub = orm.em.createQueryBuilder(Author, 'a').select(['a.id', 'a.name']).where({ name: 'Alice' });
    const qb = orm.em.createQueryBuilder(Author).with('typed_cte', sub).select('*').from('typed_cte', 'tc');

    // The query should execute and return results from the CTE
    const rows = await qb.execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty('name');
  });

  test('CTE from() type inference - compile-time checks', () => {
    const booksSub = orm.em.createQueryBuilder(Book, 'b').select('*');

    // with() tracks the CTE entity type
    const withCte = orm.em.createQueryBuilder(Author, 'a').with('recent_books', booksSub);

    // from() with CTE name infers the entity type and preserves the alias literal
    const fromCte = withCte.select('*').from('recent_books', 'rb');

    // Verify the return type has Book as entity and 'rb' as alias
    const _check: SelectQueryBuilder<Book, 'rb', never, never, never, '*', { recent_books: Book }> = fromCte;
    void _check;

    // Field autocomplete works with the CTE alias
    const withSelect = withCte.select('*').from('recent_books', 'rb').select(['rb.title', 'rb.id']);
    void withSelect;

    // from() without alias defaults alias to the CTE name itself
    const noAlias = withCte.select('*').from('recent_books');
    const _check2: SelectQueryBuilder<Book, 'recent_books', never, never, never, '*', { recent_books: Book }> = noAlias;
    void _check2;

    // Chaining multiple CTEs preserves all CTE types
    const authorsSub = orm.em.createQueryBuilder(Author, 'a2').select('*');
    const multiCte = orm.em.createQueryBuilder(Author, 'a').with('books_cte', booksSub).with('authors_cte', authorsSub);

    // from() on first CTE gives Book
    const fromBooks = multiCte.select('*').from('books_cte', 'bc');
    const _check3: SelectQueryBuilder<Book, 'bc'> = fromBooks;
    void _check3;

    // from() on second CTE gives Author
    const fromAuthors = multiCte.select('*').from('authors_cte', 'ac');
    const _check4: SelectQueryBuilder<Author, 'ac'> = fromAuthors;
    void _check4;
  });

  // PostgreSQL-specific tests
  if (type === 'postgresql') {
    test('CTE name matching entity name', async () => {
      // Name the CTE "author" — same as the entity table name
      const sub = orm.em.createQueryBuilder(Author, 'a').select(['a.id', 'a.name']).where({ name: 'Alice' });

      const qb = orm.em.createQueryBuilder(Author).with('author', sub).select('*').from('author', 'a2');

      const rows = await qb.execute<{ id: number; name: string }[]>();
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Alice');
    });

    test('MATERIALIZED hint executes', async () => {
      const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ name: 'Bob' });
      const qb = orm.em
        .createQueryBuilder(Author, 'a2')
        .with('cte', sub, { materialized: true })
        .select('*')
        .where({ name: 'Bob' });

      const results = await qb.getResultList();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob');
    });

    test('NOT MATERIALIZED hint executes', async () => {
      const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ name: 'Charlie' });
      const qb = orm.em
        .createQueryBuilder(Author, 'a2')
        .with('cte', sub, { materialized: false })
        .select('*')
        .where({ name: 'Charlie' });

      const results = await qb.getResultList();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Charlie');
    });
  }
});
