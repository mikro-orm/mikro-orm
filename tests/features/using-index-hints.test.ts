import { IndexHints, MikroORM, PrimaryKeyProp, type EntityManager, type IndexFilterQuery } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { defineEntity, p, SqliteDriver } from '@mikro-orm/sqlite';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { mockLogger } from '../helpers.js';

// ==========================================
// Test Entities
// ==========================================

@Entity()
@Index({ name: 'idx_user_name', properties: ['name'] })
@Index({ name: 'idx_user_name_email', properties: ['name', 'email'] })
@Unique({ name: 'uniq_user_email', properties: ['email'] })
class User {
  [PrimaryKeyProp]?: 'id';
  [IndexHints]?: {
    idx_user_name: 'name';
    idx_user_name_email: 'name' | 'email';
    uniq_user_email: 'email';
  };

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  age?: number;
}

const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    title: p.string().index('idx_article_title'),
    slug: p.string().unique('uniq_article_slug'),
    status: p.string(),
    views: p.integer(),
  },
  indexes: [{ name: 'idx_article_status_views', properties: ['status', 'views'] }],
});

// Entity with NO named indexes at all (only unnamed)
@Entity()
class Plain {
  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;
}

// MongoDB-compatible entity (uses ObjectId PK)
@Entity()
@Index({ name: 'idx_doc_title', properties: ['title'] })
class Doc {
  [IndexHints]?: { idx_doc_title: 'title' };

  @PrimaryKey()
  _id!: string;

  @Property()
  title!: string;

  @Property({ nullable: true })
  body?: string;
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;
}

// ==========================================
// Type Tests (compile-time only)
// ==========================================

// Type tests verified at compile time by `yarn tsc-check-tests`.
// At runtime, skip the block entirely.
describe.skipIf(true)('using option - type safety', () => {
  const em = null as unknown as EntityManager;

  test('decorator entity with [IndexHints] narrows where', () => {
    em.find(User, { name: 'foo' }, { using: 'idx_user_name' }) as any;
    em.find(User, { name: 'foo', email: 'bar' }, { using: 'idx_user_name_email' }) as any;
    em.find(User, 1, { using: 'idx_user_name' }) as any;
    em.find(User, { age: 30 }) as any;
  });

  test('decorator entity errors on non-index props in where', () => {
    // @ts-expect-error 'age' is not in idx_user_name
    em.find(User, { age: 30 }, { using: 'idx_user_name' }) as any;
    // @ts-expect-error 'age' is not in idx_user_name_email
    em.find(User, { name: 'foo', age: 30 }, { using: 'idx_user_name_email' }) as any;
  });

  test('defineEntity entity infers index hints from property-level .index()/.unique()', () => {
    em.find(Article, { title: 'foo' }, { using: 'idx_article_title' }) as any;
    em.find(Article, { slug: 'foo' }, { using: 'uniq_article_slug' }) as any;
  });

  test('defineEntity entity errors on non-index props', () => {
    // @ts-expect-error 'views' is not in idx_article_title
    em.find(Article, { views: 100 }, { using: 'idx_article_title' }) as any;
  });

  test('entity without [IndexHints] allows any string for using', () => {
    em.find(Tag, { label: 'foo' }, { using: 'some_idx' }) as any;
  });

  test('using works with findOne', () => {
    em.findOne(User, { name: 'foo' }, { using: 'idx_user_name' }) as any;
    // @ts-expect-error 'age' is not in idx_user_name
    em.findOne(User, { age: 30 }, { using: 'idx_user_name' }) as any;
  });

  test('using works with findOneOrFail', () => {
    em.findOneOrFail(User, { email: 'foo' }, { using: 'uniq_user_email' }) as any;
    // @ts-expect-error 'name' is not in uniq_user_email
    em.findOneOrFail(User, { name: 'foo' }, { using: 'uniq_user_email' }) as any;
  });

  test('using works with findAndCount', () => {
    em.findAndCount(User, { name: 'foo' }, { using: 'idx_user_name' }) as any;
    // @ts-expect-error 'age' is not in idx_user_name
    em.findAndCount(User, { age: 30 }, { using: 'idx_user_name' }) as any;
  });

  test('using works with findAll', () => {
    em.findAll(User, { where: { name: 'foo' }, using: 'idx_user_name' }) as any;
    // @ts-expect-error 'age' is not in idx_user_name
    em.findAll(User, { where: { age: 30 }, using: 'idx_user_name' }) as any;
  });

  test('using accepts array for multiple indexes', () => {
    em.find(User, { name: 'foo' }, { using: ['idx_user_name', 'uniq_user_email'] }) as any;
  });
});

// ==========================================
// Runtime Tests - SQLite (validation + all code paths)
// ==========================================

describe('using option - runtime validation (SQLite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Article, Tag, Plain],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  // --- Basic validation ---

  test('using with valid where passes validation', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/select/i);
  });

  test('using does not add SQL hint for SQLite', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).not.toMatch(/use index/i);
  });

  test('using throws on unknown index name', async () => {
    await expect(orm.em.find(User, { name: 'foo' } as any, { using: 'nonexistent_idx' })).rejects.toThrow(
      /Index 'nonexistent_idx' not found on entity 'User'/,
    );
  });

  test('using throws on unknown index for entity with no named indexes', async () => {
    await expect(orm.em.find(Plain, { value: 'x' } as any, { using: 'bad_idx' })).rejects.toThrow(
      /No named indexes defined/,
    );
  });

  // --- where validation ---

  test('using throws when where property not covered by index', async () => {
    await expect(orm.em.find(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age' in where clause is not covered by index 'idx_user_name'/,
    );
  });

  test('using validates properties inside $and/$or/$not', async () => {
    await orm.em.find(User, { $and: [{ name: 'foo' }] } as any, { using: 'idx_user_name' });
    await expect(orm.em.find(User, { $and: [{ age: 30 }] } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age'/,
    );
    await expect(
      orm.em.find(User, { $or: [{ name: 'foo' }, { age: 30 }] } as any, { using: 'idx_user_name' }),
    ).rejects.toThrow(/Property 'age'/);
    await expect(orm.em.find(User, { $not: { age: 30 } } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age'/,
    );
  });

  test('using skips non-condition $ operators like $eq', async () => {
    await orm.em.find(User, { name: { $eq: 'foo' } } as any, { using: 'idx_user_name' });
  });

  test('using with empty where passes validation', async () => {
    await orm.em.find(User, {} as any, { using: 'idx_user_name' });
  });

  test('using with null/PK where skips where validation', async () => {
    await orm.em.find(User, 1 as any, { using: 'idx_user_name' });
  });

  // --- orderBy validation ---

  test('using throws when orderBy property not covered by index', async () => {
    await expect(
      orm.em.find(User, { name: 'foo' } as any, { using: 'idx_user_name', orderBy: { age: 'asc' } } as any),
    ).rejects.toThrow(/Property 'age' in orderBy is not covered by index 'idx_user_name'/);
  });

  test('using validates orderBy array', async () => {
    await expect(
      orm.em.find(
        User,
        { name: 'foo' } as any,
        {
          using: 'idx_user_name',
          orderBy: [{ name: 'asc' }, { age: 'desc' }],
        } as any,
      ),
    ).rejects.toThrow(/Property 'age' in orderBy/);
  });

  test('using allows valid orderBy', async () => {
    await orm.em.find(
      User,
      { name: 'foo' } as any,
      {
        using: 'idx_user_name',
        orderBy: { name: 'asc' },
      } as any,
    );
  });

  // --- Multiple indexes ---

  test('using with multiple indexes allows union of properties', async () => {
    await orm.em.find(User, { name: 'foo', email: 'bar' } as any, {
      using: ['idx_user_name', 'uniq_user_email'],
    });
  });

  // --- indexHint precedence ---

  test('using does not override explicit indexHint', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, {
      using: 'idx_user_name',
      indexHint: 'indexed by idx_user_name',
    });
    expect(mock.mock.calls[0][0]).toMatch(/indexed by idx_user_name/);
  });

  // --- All EM methods ---

  test('using validates with findOne', async () => {
    await expect(orm.em.findOne(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age'/,
    );
    const mock = mockLogger(orm);
    await orm.em.findOne(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/select/i);
  });

  test('using validates with findOneOrFail', async () => {
    await expect(orm.em.findOneOrFail(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age'/,
    );
  });

  test('using validates with findAndCount', async () => {
    await expect(orm.em.findAndCount(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age'/,
    );
    const mock = mockLogger(orm);
    await orm.em.findAndCount(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/select/i);
  });

  test('using validates with findAll', async () => {
    await expect(orm.em.findAll(User, { where: { age: 30 }, using: 'idx_user_name' } as any)).rejects.toThrow(
      /Property 'age'/,
    );
    const mock = mockLogger(orm);
    await orm.em.findAll(User, { where: { name: 'foo' }, using: 'idx_user_name' } as any);
    expect(mock.mock.calls[0][0]).toMatch(/select/i);
  });

  test('using validates with findByCursor', async () => {
    await expect(
      orm.em.findByCursor(User, { where: { age: 30 }, using: 'idx_user_name', orderBy: { name: 'asc' } } as any),
    ).rejects.toThrow(/Property 'age'/);
  });

  test('using validates with stream', async () => {
    await expect(async () => {
      for await (const _ of orm.em.stream(User, { where: { age: 30 }, using: 'idx_user_name' } as any)) {
        // should not reach here
      }
    }).rejects.toThrow(/Property 'age'/);
  });

  // --- Available indexes in error message ---

  test('using validation lists available indexes in error message', async () => {
    await expect(orm.em.find(User, { name: 'foo' } as any, { using: 'bad_idx' })).rejects.toThrow(/Available indexes/);
  });

  // --- defineEntity entities ---

  test('using works with defineEntity entities at runtime', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(Article, { title: 'foo' } as any, { using: 'idx_article_title' });
    expect(mock.mock.calls[0][0]).toMatch(/select/i);
  });

  test('using validates defineEntity entities at runtime', async () => {
    await expect(orm.em.find(Article, { views: 100 } as any, { using: 'idx_article_title' })).rejects.toThrow(
      /Property 'views' in where clause is not covered by index 'idx_article_title'/,
    );
  });

  test('using works with defineEntity entity-level indexes at runtime', async () => {
    await orm.em.find(Article, { status: 'draft', views: 100 } as any, { using: 'idx_article_status_views' });
  });

  test('using works with defineEntity unique constraint at runtime', async () => {
    await orm.em.find(Article, { slug: 'foo' } as any, { using: 'uniq_article_slug' });
  });
});

// ==========================================
// Runtime Tests - MySQL (SQL hint generation)
// ==========================================

describe('using option - MySQL runtime', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Tag, Plain],
      dbName: 'using_test',
      driver: MySqlDriver,
      port: 3308,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('using generates USE INDEX hint for MySQL', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/use index\(idx_user_name\)/);
  });

  test('using with multiple indexes generates combined hint', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo', email: 'bar' } as any, {
      using: ['idx_user_name', 'idx_user_name_email'],
    });
    expect(mock.mock.calls[0][0]).toMatch(/use index\(idx_user_name, idx_user_name_email\)/);
  });

  test('using does not override explicit indexHint', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, {
      using: 'idx_user_name',
      indexHint: 'force index(idx_user_name_email)',
    });
    expect(mock.mock.calls[0][0]).toMatch(/force index\(idx_user_name_email\)/);
    expect(mock.mock.calls[0][0]).not.toMatch(/use index/);
  });

  test('using generates hint for findOne', async () => {
    const mock = mockLogger(orm);
    await orm.em.findOne(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/use index\(idx_user_name\)/);
  });

  test('using generates hint for count (via findAndCount)', async () => {
    const mock = mockLogger(orm);
    await orm.em.findAndCount(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    // Both the find and count queries should have the hint
    const queries = mock.mock.calls.map((c: any) => c[0]).filter((q: string) => q.includes('idx_user_name'));
    expect(queries.length).toBeGreaterThanOrEqual(1);
  });
});

// ==========================================
// Runtime Tests - MSSQL (SQL hint generation)
// ==========================================

describe('using option - MSSQL runtime', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Tag, Plain],
      dbName: 'using_test',
      driver: MsSqlDriver,
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('using generates WITH (INDEX(...)) hint for MSSQL', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, { using: 'idx_user_name' });
    expect(mock.mock.calls[0][0]).toMatch(/with \(index\(idx_user_name\)\)/);
  });

  test('using with multiple indexes generates combined MSSQL hint', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo', email: 'bar' } as any, {
      using: ['idx_user_name', 'idx_user_name_email'],
    });
    expect(mock.mock.calls[0][0]).toMatch(/with \(index\(idx_user_name, idx_user_name_email\)\)/);
  });
});

// ==========================================
// Runtime Tests - MongoDB
// ==========================================

describe('using option - MongoDB runtime', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Doc],
      dbName: 'using_test',
      driver: MongoDriver,
      clientUrl: 'mongodb://localhost:27017',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('using passes index name as hint to MongoDB', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(Doc, { title: 'foo' } as any, { using: 'idx_doc_title' });
    expect(mock.mock.calls[0][0]).toMatch(/idx_doc_title/);
  });

  test('using throws when multiple indexes provided for MongoDB', async () => {
    await expect(
      orm.em.find(Doc, { title: 'foo' } as any, { using: ['idx_doc_title', 'idx_doc_title'] }),
    ).rejects.toThrow(/MongoDB only supports a single index hint per query/);
  });

  test('using does not override explicit indexHint in MongoDB', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(Doc, { title: 'foo' } as any, {
      using: 'idx_doc_title',
      indexHint: '_id_',
    });
    expect(mock.mock.calls[0][0]).toMatch(/_id_/);
  });

  test('using throws on unknown index (MongoDB)', async () => {
    await expect(orm.em.find(Doc, { title: 'foo' } as any, { using: 'nonexistent_idx' })).rejects.toThrow(
      /Index 'nonexistent_idx' not found on entity 'Doc'/,
    );
  });

  test('using throws when where property not covered (MongoDB)', async () => {
    await expect(orm.em.find(Doc, { body: 'x' } as any, { using: 'idx_doc_title' })).rejects.toThrow(
      /Property 'body' in where clause is not covered by index 'idx_doc_title'/,
    );
  });
});
