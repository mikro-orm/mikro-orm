import { defineEntity, p, MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// Base table for the views
const Author = defineEntity({
  name: 'Author',
  tableName: 'author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  tableName: 'book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    authorId: p.integer(),
  },
});

// Initial materialized view
const AuthorStats0 = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `select a.id, a.name, count(b.id)::int as book_count from author a left join book b on b.author_id = a.id group by a.id`,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer(),
  },
});

// Modified materialized view (changed expression)
const AuthorStats1 = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `select a.id, a.name, a.email, count(b.id)::int as book_count from author a left join book b on b.author_id = a.id group by a.id`,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    bookCount: p.integer(),
  },
});

// Another materialized view for testing add/remove
const BookStats0 = defineEntity({
  name: 'BookStats',
  tableName: 'book_stats_matview',
  view: { materialized: true },
  expression: `select count(*)::int as total_books from book`,
  properties: {
    totalBooks: p.integer().primary(),
  },
});

// Materialized view with indexes (GH #7417)
const AuthorStatsWithIndexes = defineEntity({
  name: 'AuthorStatsWithIndexes',
  tableName: 'author_stats_idx_matview',
  view: { materialized: true },
  expression: `select a.id, a.name, count(b.id)::int as book_count from author a left join book b on b.author_id = a.id group by a.id`,
  indexes: [{ properties: ['bookCount'] }],
  uniques: [{ properties: ['name'] }],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer(),
  },
});

// Modified materialized view with indexes (additional index)
const AuthorStatsWithIndexes1 = defineEntity({
  name: 'AuthorStatsWithIndexes1',
  tableName: 'author_stats_idx_matview',
  view: { materialized: true },
  expression: `select a.id, a.name, count(b.id)::int as book_count from author a left join book b on b.author_id = a.id group by a.id`,
  indexes: [{ properties: ['bookCount'] }, { properties: ['bookCount', 'name'] }],
  uniques: [{ properties: ['name'] }],
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer(),
  },
});

// Materialized view with no data on creation
const AuthorStatsNoData = defineEntity({
  name: 'AuthorStatsNoData',
  tableName: 'author_stats_nodata_matview',
  view: { materialized: true, withData: false },
  expression: `select a.id, a.name from author a`,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

// Modified version with data
const AuthorStatsWithData = defineEntity({
  name: 'AuthorStatsWithData',
  tableName: 'author_stats_nodata_matview',
  view: { materialized: true, withData: true },
  expression: `select a.id, a.name from author a`,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

describe('materialized view diffing in postgres', () => {
  test('schema generator adds new materialized view', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_matview cascade');
    await orm.schema.execute('drop materialized view if exists book_stats_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Add a materialized view
    orm.discoverEntity(AuthorStats0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('schema generator modifies materialized view expression', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, AuthorStats0],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Modify the materialized view (add email column)
    orm.discoverEntity(AuthorStats1, AuthorStats0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('schema generator removes materialized view', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, AuthorStats0, BookStats0],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_matview cascade');
    await orm.schema.execute('drop materialized view if exists book_stats_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Remove one materialized view (keep AuthorStats0, remove BookStats0)
    orm.getMetadata().reset(BookStats0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('schema generator handles add, modify, and remove in sequence', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_matview cascade');
    await orm.schema.execute('drop materialized view if exists book_stats_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Step 1: Add first materialized view
    orm.discoverEntity(AuthorStats0);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Step 2: Add second materialized view
    orm.discoverEntity(BookStats0);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Step 3: Modify first materialized view
    orm.discoverEntity(AuthorStats1, AuthorStats0);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Step 4: Remove second materialized view
    orm.getMetadata().reset(BookStats0);
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toMatchSnapshot();
    await orm.schema.execute(diff4);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('schema generator handles withData option change', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, AuthorStatsNoData],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_nodata_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // The create SQL should contain WITH NO DATA but no indexes
    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain('with no data');
    expect(createSql).not.toContain('create unique index');

    // No diff while withData is false — indexes are deferred
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Switching to withData: true picks up the deferred indexes but does NOT
    // refresh the view — the user must run REFRESH MATERIALIZED VIEW separately.
    // PostgreSQL allows creating indexes on unrefreshed views (they stay empty
    // until the next REFRESH), so executing this diff is valid.
    orm.discoverEntity(AuthorStatsWithData, AuthorStatsNoData);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toContain('create unique index');
    await orm.schema.execute(diff1);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  // GH #7417
  test('schema:create generates indexes for materialized views', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, AuthorStatsWithIndexes],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_idx_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');

    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain('author_stats_idx_matview');
    expect(createSql).toContain('create index');
    expect(createSql).toMatchSnapshot();

    await orm.schema.create();
    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  // GH #7417
  test('schema:update adds indexes for new materialized views', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_idx_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Add a materialized view with indexes
    orm.discoverEntity(AuthorStatsWithIndexes);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toContain('create materialized view');
    expect(diff1).toContain('create index');
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  // GH #7417
  test('schema:update handles index changes on materialized views', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, AuthorStatsWithIndexes],
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop materialized view if exists author_stats_idx_matview cascade');
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.create();

    // Verify no diff with current schema
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Add a new index
    orm.discoverEntity(AuthorStatsWithIndexes1, AuthorStatsWithIndexes);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toContain('create index');
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Remove the added index
    orm.discoverEntity(AuthorStatsWithIndexes, AuthorStatsWithIndexes1);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toContain('drop index');
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);

    // Verify no diff after applying
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close(true);
  });

  test('schema-qualified materialized views with indexes', async () => {
    // Use schema-qualified table references in the expression since the
    // tables will be created in 'myschema', not the default search_path
    const SchemaAuthorStats = defineEntity({
      name: 'SchemaAuthorStats',
      tableName: 'author_stats_idx_matview',
      view: { materialized: true },
      expression: `select a.id, a.name, count(b.id)::int as book_count from myschema.author a left join myschema.book b on b.author_id = a.id group by a.id`,
      indexes: [{ properties: ['bookCount'] }],
      uniques: [{ properties: ['name'] }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
        bookCount: p.integer(),
      },
    });

    const SchemaAuthorStats1 = defineEntity({
      name: 'SchemaAuthorStats1',
      tableName: 'author_stats_idx_matview',
      view: { materialized: true },
      expression: `select a.id, a.name, count(b.id)::int as book_count from myschema.author a left join myschema.book b on b.author_id = a.id group by a.id`,
      indexes: [{ properties: ['bookCount'] }, { properties: ['bookCount', 'name'] }],
      uniques: [{ properties: ['name'] }],
      properties: {
        id: p.integer().primary(),
        name: p.string(),
        bookCount: p.integer(),
      },
    });

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, SchemaAuthorStats],
      schema: 'myschema',
      dbName: 'mikro_orm_test_matview_diffing',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop schema if exists myschema cascade');

    // Create — indexes should be schema-qualified
    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain('"myschema".');
    expect(createSql).toContain('create index');
    expect(createSql).toMatchSnapshot();

    await orm.schema.create();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    // Update — add a new index
    orm.discoverEntity(SchemaAuthorStats1, SchemaAuthorStats);
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('create index');
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.schema.execute('drop schema if exists myschema cascade');
    await orm.close(true);
  });
});
