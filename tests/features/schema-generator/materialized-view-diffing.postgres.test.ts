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

    // The create SQL should contain WITH NO DATA
    const createSql = await orm.schema.getCreateSchemaSQL();
    expect(createSql).toContain('with no data');

    // Change from withData: false to withData: true
    // Note: withData is a creation-time option, not a view property that can be diffed.
    // The view structure itself is the same, so no diff is expected.
    // To populate a WITH NO DATA view, use REFRESH MATERIALIZED VIEW.
    orm.discoverEntity(AuthorStatsWithData, AuthorStatsNoData);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe(''); // No diff expected since withData doesn't affect view structure

    await orm.close(true);
  });
});
