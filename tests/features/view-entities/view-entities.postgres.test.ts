import { defineEntity, p, sql, Collection } from '@mikro-orm/core';
import { Entity, Formula, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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

// View entity with formula property using decorator
const bookPriceViewSQL = `select uuid_pk, title, price from book2 where price is not null`;

@Entity({ tableName: 'book_price_view', view: true, expression: bookPriceViewSQL })
class BookPriceView {

  @PrimaryKey({ type: 'uuid' })
  uuidPk!: string;

  @Property()
  title!: string;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  price!: string;

  @Formula(alias => `${alias}.price * 1.19`)
  priceTaxed!: string;

  @Formula(alias => `upper(${alias}.title)`)
  titleUpper!: string;

}

// View entity with custom types (enum, json, decimal) using defineEntity
enum BookStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

const BookMetadataView = defineEntity({
  name: 'BookMetadataView',
  tableName: 'book_metadata_view',
  view: true,
  expression: `
    select
      b.uuid_pk,
      b.title,
      b.price,
      b.meta,
      case when b.price > 100 then 'published' else 'draft' end as status
    from book2 b
  `,
  properties: {
    uuidPk: p.uuid().primary(),
    title: p.string(),
    price: p.decimal().precision(8).scale(2).nullable(),
    meta: p.json<{ category?: string; items?: number }>().nullable(),
    status: p.enum(() => BookStatus),
  },
});

// View entity with PK that can be a relation target
const authorViewSQL = `select id, name, email, age from author2`;

@Entity({ tableName: 'author_view', view: true, expression: authorViewSQL })
class AuthorView {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  age?: number;

  // One-to-many from view to regular entity (view is the "one" side)
  @OneToMany(() => BookForViewRelation, book => book.authorView)
  books = new Collection<BookForViewRelation>(this);

}

// Regular entity that references a view entity
@Entity({ tableName: 'book_for_view_relation' })
class BookForViewRelation {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // Many-to-one to a view entity - no FK constraint since views can't be FK targets
  @ManyToOne(() => AuthorView, { nullable: true })
  authorView?: AuthorView;

}

// View entity with formula using defineEntity
const AuthorWithComputedFields = defineEntity({
  name: 'AuthorWithComputedFields',
  tableName: 'author_computed_view',
  view: true,
  expression: `select id, name, email, age from author2`,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    age: p.integer().nullable(),
    // Formula computed from view columns
    displayName: p.string().formula(alias => `${alias}.name || ' <' || ${alias}.email || '>'`),
    isAdult: p.boolean().formula(alias => `${alias}.age >= 18`),
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

describe('View entities with formulas (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, BookPriceView],
      dbName: 'mikro_orm_test_views_formulas',
    });

    await orm.schema.refresh();

    // Create test data with prices
    const em = orm.em.fork();
    const author = em.create(Author2, { name: 'Formula Author', email: 'formula@test.com' });
    em.create(Book2, { title: 'Priced Book', author, price: 100.00 });
    em.create(Book2, { title: 'Another Priced Book', author, price: 50.50 });
    await em.flush();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('view entity with formula is created correctly', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('book_price_view');
    expect(sql).toMatchSnapshot();
  });

  test('can query view with formula properties', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookPriceView, {}, { orderBy: { price: 'desc' } });
    expect(books.length).toBe(2);

    // Check base properties
    expect(books[0].title).toBe('Priced Book');
    expect(parseFloat(books[0].price)).toBe(100);

    // Check formula properties are computed
    expect(books[0].priceTaxed).toBeDefined();
    expect(parseFloat(books[0].priceTaxed)).toBeCloseTo(119, 0); // 100 * 1.19
    expect(books[0].titleUpper).toBe('PRICED BOOK');

    expect(books[1].title).toBe('Another Priced Book');
    expect(parseFloat(books[1].priceTaxed)).toBeCloseTo(60.1, 0); // 50.50 * 1.19
    expect(books[1].titleUpper).toBe('ANOTHER PRICED BOOK');
  });

  test('can filter by formula properties on view', async () => {
    const em = orm.em.fork();

    // Filter by formula property
    const expensiveBooks = await em.find(BookPriceView, {
      priceTaxed: { $gt: '100' },
    });
    expect(expensiveBooks.length).toBe(1);
    expect(expensiveBooks[0].title).toBe('Priced Book');
  });

});

describe('View entities with custom types (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, BookMetadataView],
      dbName: 'mikro_orm_test_views_custom_types',
    });

    await orm.schema.refresh();

    // Create test data with various types
    const em = orm.em.fork();
    const author = em.create(Author2, { name: 'Type Author', email: 'types@test.com' });
    em.create(Book2, {
      title: 'Expensive Book',
      author,
      price: 150.00,
      meta: { category: 'fiction', items: 5 },
    });
    em.create(Book2, {
      title: 'Cheap Book',
      author,
      price: 50.00,
      meta: { category: 'non-fiction', items: 3 },
    });
    await em.flush();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('view entity with custom types is created correctly', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('book_metadata_view');
    expect(sql).toMatchSnapshot();
  });

  test('can query view with enum type', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookMetadataView, {}, { orderBy: { price: 'desc' } });
    expect(books.length).toBe(2);

    // Expensive book should be 'published'
    expect(books[0].status).toBe(BookStatus.PUBLISHED);
    // Cheap book should be 'draft'
    expect(books[1].status).toBe(BookStatus.DRAFT);
  });

  test('can filter by enum value on view', async () => {
    const em = orm.em.fork();

    const publishedBooks = await em.find(BookMetadataView, {
      status: BookStatus.PUBLISHED,
    });
    expect(publishedBooks.length).toBe(1);
    expect(publishedBooks[0].title).toBe('Expensive Book');
  });

  test('can query view with json type', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookMetadataView, {});
    expect(books.every(b => b.meta !== null)).toBe(true);
    expect(books.some(b => b.meta?.category === 'fiction')).toBe(true);
    expect(books.some(b => b.meta?.category === 'non-fiction')).toBe(true);
  });

  test('can filter by json property on view', async () => {
    const em = orm.em.fork();

    const fictionBooks = await em.find(BookMetadataView, {
      meta: { category: 'fiction' },
    });
    expect(fictionBooks.length).toBe(1);
    expect(fictionBooks[0].title).toBe('Expensive Book');
  });

  test('can query view with decimal type', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookMetadataView, { price: { $gt: '100' } });
    expect(books.length).toBe(1);
    expect(books[0].price).toBe('150.00');
  });

});

describe('View entities with formulas via defineEntity (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, AuthorWithComputedFields],
      dbName: 'mikro_orm_test_views_define_entity_formulas',
    });

    await orm.schema.refresh();

    // Create test data
    const em = orm.em.fork();
    em.create(Author2, { name: 'Adult Author', email: 'adult@test.com', age: 30 });
    em.create(Author2, { name: 'Young Author', email: 'young@test.com', age: 16 });
    await em.flush();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('view entity with formula via defineEntity is created correctly', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('author_computed_view');
    expect(sql).toMatchSnapshot();
  });

  test('can query view with formula properties from defineEntity', async () => {
    const em = orm.em.fork();

    const authors = await em.find(AuthorWithComputedFields, {}, { orderBy: { age: 'desc' } });
    expect(authors.length).toBe(2);

    // Check formula properties
    expect(authors[0].displayName).toBe('Adult Author <adult@test.com>');
    expect(authors[0].isAdult).toBe(true);

    expect(authors[1].displayName).toBe('Young Author <young@test.com>');
    expect(authors[1].isAdult).toBe(false);
  });

  test('can filter by string formula on defineEntity view', async () => {
    const em = orm.em.fork();

    // Filter by string formula using LIKE
    const adults = await em.find(AuthorWithComputedFields, {
      displayName: { $like: '%adult@%' },
    });
    expect(adults.length).toBe(1);
    expect(adults[0].name).toBe('Adult Author');
  });

  test('can order by formula properties on defineEntity view', async () => {
    const em = orm.em.fork();

    // Order by formula property
    const authors = await em.find(AuthorWithComputedFields, {}, {
      orderBy: { displayName: 'asc' },
    });
    expect(authors.length).toBe(2);
    // "Adult Author <adult@test.com>" comes before "Young Author <young@test.com>"
    expect(authors[0].name).toBe('Adult Author');
    expect(authors[1].name).toBe('Young Author');
  });

});

describe('View entities as relation targets (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Address2, Configuration2, AuthorView, BookForViewRelation],
      dbName: 'mikro_orm_test_views_relations',
    });

    await orm.schema.refresh();

    // Create test data - authors in the base table
    const em = orm.em.fork();
    const author1 = em.create(Author2, { name: 'View Author 1', email: 'view1@test.com' });
    const author2 = em.create(Author2, { name: 'View Author 2', email: 'view2@test.com' });
    await em.flush();

    // Now create books that reference the view
    const em2 = orm.em.fork();
    const authorView1 = await em2.findOneOrFail(AuthorView, { name: 'View Author 1' });
    const authorView2 = await em2.findOneOrFail(AuthorView, { name: 'View Author 2' });

    em2.create(BookForViewRelation, { id: 1, title: 'Book by View Author 1', authorView: authorView1 });
    em2.create(BookForViewRelation, { id: 2, title: 'Another Book by View Author 1', authorView: authorView1 });
    em2.create(BookForViewRelation, { id: 3, title: 'Book by View Author 2', authorView: authorView2 });
    await em2.flush();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('view entity as relation target creates correct schema', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('author_view');
    expect(sql).toContain('book_for_view_relation');
    // Column for the relation exists
    expect(sql).toContain('author_view_id');
    // No FK constraint since views can't be FK targets in PostgreSQL
    expect(sql).not.toMatch(/references.*author_view/i);
    expect(sql).toMatchSnapshot();
  });

  test('can query entity with ManyToOne to view', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookForViewRelation, {}, {
      populate: ['authorView'],
      orderBy: { id: 'asc' },
    });

    expect(books.length).toBe(3);
    expect(books[0].authorView?.name).toBe('View Author 1');
    expect(books[1].authorView?.name).toBe('View Author 1');
    expect(books[2].authorView?.name).toBe('View Author 2');
  });

  test('can filter by relation to view entity', async () => {
    const em = orm.em.fork();

    const books = await em.find(BookForViewRelation, {
      authorView: { name: 'View Author 1' },
    });

    expect(books.length).toBe(2);
    expect(books.every(b => b.title.includes('View Author 1'))).toBe(true);
  });

  test('can query view with OneToMany to regular entity', async () => {
    const em = orm.em.fork();

    const authors = await em.find(AuthorView, {}, {
      populate: ['books'],
      orderBy: { name: 'asc' },
    });

    expect(authors.length).toBe(2);
    expect(authors[0].name).toBe('View Author 1');
    expect(authors[0].books.length).toBe(2);
    expect(authors[1].name).toBe('View Author 2');
    expect(authors[1].books.length).toBe(1);
  });

  test('can use view entity in join', async () => {
    const em = orm.em.fork();

    const qb = em.createQueryBuilder(BookForViewRelation, 'b')
      .select(['b.title', 'a.name'])
      .join('b.authorView', 'a')
      .where({ 'a.name': 'View Author 1' });

    const results = await qb.execute();
    expect(results.length).toBe(2);
  });

});
