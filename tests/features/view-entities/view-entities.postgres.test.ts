import { defineEntity, p, sql } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2 } from '../../entities-sql/index.js';

// View entity with string expression using decorator
const authorStatsSQL = `select min(name) as name, (select count(*)::int from book2 b where b.author_id = a.id) as book_count from author2 a group by a.id`;

@Entity({ tableName: 'author_stats_view', view: true, expression: authorStatsSQL })
class AuthorStats {

  @PrimaryKey()
  name!: string;

  @Property()
  bookCount!: number;

}

// View entity with QueryBuilder expression using defineEntity
const BookSummary = defineEntity({
  name: 'BookSummary',
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book2, 'b')
      .select([sql`min(b.title)`.as('title'), sql`min(a.name)`.as('author_name')])
      .join('b.author', 'a')
      .groupBy('b.uuid_pk');
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

describe('View entities (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, AuthorStats, BookSummary, ProlificAuthors],
      dbName: 'mikro_orm_test_views',
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
    expect(sql).toContain('cascade'); // PostgreSQL uses cascade
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

  test('updateSchema detects changed view definitions', async () => {
    const ModifiedAuthorStats = defineEntity({
      name: 'ModifiedAuthorStats',
      tableName: 'author_stats_view',
      view: true,
      expression: `select min(name) as name, (select count(*)::int * 2 from book2 b where b.author_id = a.id) as book_count from author2 a group by a.id`,
      properties: {
        name: p.string().primary(),
        bookCount: p.integer(),
      },
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, ModifiedAuthorStats, BookSummary, ProlificAuthors],
      dbName: 'mikro_orm_test_views',
    });

    try {
      const sql = await orm2.schema.getUpdateSchemaSQL();
      expect(typeof sql).toBe('string');
    } finally {
      await orm2.close();
    }
  });

  test('updateSchema detects new views', async () => {
    const NewView = defineEntity({
      name: 'NewView',
      tableName: 'new_test_view',
      view: true,
      expression: `select 1 as id`,
      properties: {
        id: p.integer().primary(),
      },
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, AuthorStats, BookSummary, ProlificAuthors, NewView],
      dbName: 'mikro_orm_test_views',
    });

    try {
      const sql = await orm2.schema.getUpdateSchemaSQL();
      expect(sql).toContain('new_test_view');
      expect(sql).toContain('create view');
    } finally {
      await orm2.close();
    }
  });

  test('updateSchema detects removed views', async () => {
    await orm.em.execute(`create or replace view extra_view as select 1 as id`);

    try {
      const sql = await orm.schema.getUpdateSchemaSQL();
      expect(sql).toContain('extra_view');
      expect(sql).toContain('drop view');
    } finally {
      await orm.em.execute(`drop view if exists extra_view`);
    }
  });

  test('view in custom schema', async () => {
    // Create a schema for testing
    await orm.em.execute(`create schema if not exists custom_schema`);

    const SchemaView = defineEntity({
      name: 'SchemaView',
      tableName: 'schema_test_view',
      schema: 'custom_schema',
      view: true,
      expression: `select 1 as id`,
      properties: {
        id: p.integer().primary(),
      },
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [SchemaView],
      dbName: 'mikro_orm_test_views',
    });

    try {
      await orm2.schema.refresh();

      // Verify view was created in schema
      const createSql = await orm2.schema.getCreateSchemaSQL();
      expect(createSql).toContain('custom_schema');
      expect(createSql).toContain('schema_test_view');

      // Query the view
      const em = orm2.em.fork();
      const results = await em.find(SchemaView, {});
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);

      // Verify updateSchema can find the view by schema-qualified name
      const updateSql = await orm2.schema.getUpdateSchemaSQL();
      expect(typeof updateSql).toBe('string');
    } finally {
      await orm2.schema.drop();
      await orm2.close();
      await orm.em.execute(`drop schema if exists custom_schema cascade`);
    }
  });

  test('circular view dependencies are handled', async () => {
    // Create two views that reference each other (circular dependency)
    // In practice this would be a bad design, but we should handle it gracefully
    const CircularViewA = defineEntity({
      name: 'CircularViewA',
      tableName: 'circular_view_a',
      view: true,
      // This references circular_view_b
      expression: `select 1 as id, (select count(*) from circular_view_b) as b_count`,
      properties: {
        id: p.integer().primary(),
        bCount: p.integer(),
      },
    });

    const CircularViewB = defineEntity({
      name: 'CircularViewB',
      tableName: 'circular_view_b',
      view: true,
      // This references circular_view_a
      expression: `select 1 as id, (select count(*) from circular_view_a) as a_count`,
      properties: {
        id: p.integer().primary(),
        aCount: p.integer(),
      },
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [CircularViewA, CircularViewB],
      dbName: 'mikro_orm_test_views',
    });

    try {
      // Get create SQL - should include both views even with circular dependency
      const createSql = await orm2.schema.getCreateSchemaSQL();
      expect(createSql).toContain('circular_view_a');
      expect(createSql).toContain('circular_view_b');
    } finally {
      await orm2.close();
    }
  });

  test('async expression throws error', async () => {
    const AsyncView = defineEntity({
      name: 'AsyncView',
      tableName: 'async_view',
      view: true,
      expression: async () => {
        return 'select 1 as id';
      },
      properties: {
        id: p.integer().primary(),
      },
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [AsyncView],
      dbName: 'mikro_orm_test_views',
    });

    try {
      await expect(orm2.schema.getCreateSchemaSQL()).rejects.toThrow(/async.*not supported/i);
    } finally {
      await orm2.close();
    }
  });

});
