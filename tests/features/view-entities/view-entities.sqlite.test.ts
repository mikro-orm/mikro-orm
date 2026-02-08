import { defineEntity, p, sql } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import {
  Author4,
  BaseEntity4,
  BaseEntity5,
  Book4,
  BookTag4,
  FooBar4,
  FooBaz4,
  Publisher4,
  Test4,
  IdentitySchema,
} from '../../entities-schema/index.js';

// View entity with string expression
class AuthorStats {
  name!: string;
  bookCount!: number;
}

const authorStatsSQL = `select name, (select count(*) from book4 b where b.author_id = a.id) as book_count from author4 a`;

const AuthorStatsSchema = defineEntity({
  class: AuthorStats,
  tableName: 'author_stats_view',
  view: true,
  expression: authorStatsSQL,
  properties: {
    name: p.string().primary(),
    bookCount: p.integer(),
  },
});

// View entity with QueryBuilder expression using defineEntity
const BookSummary = defineEntity({
  name: 'BookSummary',
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em
      .createQueryBuilder(Book4, 'b')
      .join('b.author', 'a')
      .select(['b.title', sql.ref('a', 'name').as('author_name')]);
  },
  properties: {
    title: p.string().primary(),
    authorName: p.string(),
  },
});

// View depending on another view (for testing dependency ordering)
// This view references author_stats_view
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

describe('View entities (sqlite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [
        Author4,
        Book4,
        BookTag4,
        Publisher4,
        Test4,
        FooBar4,
        FooBaz4,
        BaseEntity4,
        BaseEntity5,
        IdentitySchema,
        AuthorStatsSchema,
        BookSummary,
        ProlificAuthors,
      ],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    await orm.schema.create();

    // Create test data once for all tests
    const em = orm.em.fork();
    const author = em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    em.create(Book4, { title: 'Book 1', author });
    em.create(Book4, { title: 'Book 2', author });
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

  test('view entity should be read-only', async () => {
    const em = orm.em.fork();

    const stat = new AuthorStats();
    stat.name = 'Test';
    stat.bookCount = 0;

    // Trying to persist should not cause issues - it's just ignored
    em.persist(stat);
    await em.flush();
  });

  test('updateSchema detects no changes for unchanged views', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL();
    expect(sql).toBe('');
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
});
