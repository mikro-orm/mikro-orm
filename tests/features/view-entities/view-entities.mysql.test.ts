import { defineEntity, p, sql, type EntityManager as EM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM as MySqlORM, EntityManager as MySqlEM } from '@mikro-orm/mysql';
import { MikroORM as MariaDbORM, EntityManager as MariaDbEM } from '@mikro-orm/mariadb';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2, Address2, Configuration2 } from '../../entities-sql/index.js';

// View entity with string expression
const authorStatsSQL = `select min(name) as name, (select count(*) from book2 b where b.author_id = a.id) as book_count from author2 a group by a.id`;

const AuthorStats = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_view',
  view: true,
  expression: authorStatsSQL,
  properties: {
    name: p.string().primary(),
    bookCount: p.integer(),
  },
});

// View entity with QueryBuilder expression
const BookSummary = defineEntity({
  name: 'BookSummary',
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EM) => {
    return (em as MySqlEM | MariaDbEM).createQueryBuilder(Book2, 'b')
      .join('b.author', 'a')
      .select(['b.title', sql.ref('a', 'name').as('author_name')]);
  },
  properties: {
    title: p.string().primary(),
    authorName: p.string(),
  },
});

// View depending on another view (for testing dependency ordering)
const ProlificAuthors = defineEntity({
  name: 'ProlificAuthors',
  tableName: 'prolific_authors_view',
  view: true,
  expression: `select name, book_count from author_stats_view where book_count > 1`,
  properties: {
    name: p.string().primary(),
    bookCount: p.integer(),
  },
});

const drivers = [
  { name: 'mysql', ORM: MySqlORM, port: 3308 },
  { name: 'mariadb', ORM: MariaDbORM, port: 3309 },
] as const;

describe.each(drivers)('View entities ($name)', ({ name, ORM, port }) => {

  let orm: MySqlORM | MariaDbORM;

  beforeAll(async () => {
    orm = await ORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, AuthorStats, BookSummary, ProlificAuthors],
      dbName: 'mikro_orm_test_views',
      port,
    });

    await orm.schema.refresh();

    // Create test data once for all tests
    const em = orm.em.fork();
    const author = em.create(Author2, { name: 'Jon Snow', email: 'snow@wall.st' });
    em.create(Book2, { title: 'Book 1', author });
    em.create(Book2, { title: 'Book 2', author });
    await em.flush();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema generator should create views', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
  });

  test('schema generator should drop views before tables', async () => {
    const sql = await orm.schema.getDropSchemaSQL();
    expect(sql).toContain('drop view');
  });

  test('can query view entity with string expression', async () => {
    const em = orm.em.fork();

    const stats = await em.find(AuthorStats, {});
    expect(stats.length).toBe(1);
    expect(stats[0].name).toBe('Jon Snow');
    expect(stats[0].bookCount).toBe(2);
  });

  test('can query view entity with QueryBuilder expression', async () => {
    const em = orm.em.fork();

    const summaries = await em.find(BookSummary, {});
    expect(summaries.length).toBe(2);
    expect(summaries.every(s => s.authorName === 'Jon Snow')).toBe(true);
    expect(summaries.map(s => s.title).sort()).toEqual(['Book 1', 'Book 2']);
  });

  test('views depending on other views are created in correct order', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();

    const authorStatsPos = sql.indexOf('author_stats_view');
    const prolificAuthorsPos = sql.indexOf('prolific_authors_view');

    expect(authorStatsPos).toBeGreaterThan(-1);
    expect(prolificAuthorsPos).toBeGreaterThan(-1);
    expect(authorStatsPos).toBeLessThan(prolificAuthorsPos);
  });

  test('views depending on other views are dropped in correct order', async () => {
    const sql = await orm.schema.getDropSchemaSQL();

    const authorStatsPos = sql.indexOf('author_stats_view');
    const prolificAuthorsPos = sql.indexOf('prolific_authors_view');

    expect(authorStatsPos).toBeGreaterThan(-1);
    expect(prolificAuthorsPos).toBeGreaterThan(-1);
    expect(prolificAuthorsPos).toBeLessThan(authorStatsPos);
  });

  test('can query view depending on another view', async () => {
    const em = orm.em.fork();

    const prolificAuthors = await em.find(ProlificAuthors, {});
    expect(prolificAuthors.length).toBe(1);
    expect(prolificAuthors[0].name).toBe('Jon Snow');
    expect(prolificAuthors[0].bookCount).toBe(2);
  });

  test('updateSchema detects no changes for unchanged views', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL();
    expect(sql).toBe('');
  });

});
