import { IndexHints, MikroORM, PrimaryKeyProp, type EntityManager, type IndexFilterQuery } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { defineEntity, p, SqliteDriver } from '@mikro-orm/sqlite';
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
    // Should compile — 'name' is in idx_user_name
    em.find(User, { name: 'foo' }, { using: 'idx_user_name' }) as any;
    // Should compile — 'name' and 'email' are in idx_user_name_email
    em.find(User, { name: 'foo', email: 'bar' }, { using: 'idx_user_name_email' }) as any;
    // Should compile — PK is always allowed
    em.find(User, 1, { using: 'idx_user_name' }) as any;
    // Should compile — no using, full FilterQuery
    em.find(User, { age: 30 }) as any;
  });

  test('decorator entity errors on non-index props in where', () => {
    // @ts-expect-error 'age' is not in idx_user_name
    em.find(User, { age: 30 }, { using: 'idx_user_name' }) as any;
    // @ts-expect-error 'age' is not in idx_user_name_email
    em.find(User, { name: 'foo', age: 30 }, { using: 'idx_user_name_email' }) as any;
  });

  test('defineEntity entity infers index hints and narrows where', () => {
    em.find(Article, { title: 'foo' }, { using: 'idx_article_title' }) as any;
    em.find(Article, { slug: 'foo' }, { using: 'uniq_article_slug' }) as any;
    em.find(Article, { status: 'draft', views: 100 }, { using: 'idx_article_status_views' }) as any;
  });

  test('defineEntity entity errors on non-index props', () => {
    // @ts-expect-error 'views' is not in idx_article_title
    em.find(Article, { views: 100 }, { using: 'idx_article_title' }) as any;
    // @ts-expect-error 'title' is not in idx_article_status_views
    em.find(Article, { title: 'foo' }, { using: 'idx_article_status_views' }) as any;
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
// Runtime Tests - SQLite (validation only, no SQL hints)
// ==========================================

describe('using option - runtime validation (SQLite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Article, Tag],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

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

  test('using throws when where property not covered by index', async () => {
    await expect(orm.em.find(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age' in where clause is not covered by index 'idx_user_name'/,
    );
  });

  test('using throws when orderBy property not covered by index', async () => {
    await expect(
      orm.em.find(
        User,
        { name: 'foo' } as any,
        {
          using: 'idx_user_name',
          orderBy: { age: 'asc' },
        } as any,
      ),
    ).rejects.toThrow(/Property 'age' in orderBy is not covered by index 'idx_user_name'/);
  });

  test('using with multiple indexes allows union of properties', async () => {
    // idx_user_name covers 'name', uniq_user_email covers 'email'
    await orm.em.find(User, { name: 'foo', email: 'bar' } as any, {
      using: ['idx_user_name', 'uniq_user_email'],
    });
  });

  test('using does not override explicit indexHint', async () => {
    const mock = mockLogger(orm);
    await orm.em.find(User, { name: 'foo' } as any, {
      using: 'idx_user_name',
      indexHint: 'indexed by idx_user_name',
    });
    expect(mock.mock.calls[0][0]).toMatch(/indexed by idx_user_name/);
  });

  test('using validates with findOne', async () => {
    await expect(orm.em.findOne(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age' in where clause is not covered by index 'idx_user_name'/,
    );
  });

  test('using validates with findAndCount', async () => {
    await expect(orm.em.findAndCount(User, { age: 30 } as any, { using: 'idx_user_name' })).rejects.toThrow(
      /Property 'age' in where clause is not covered by index 'idx_user_name'/,
    );
  });

  test('using skips $-prefixed operators in where validation', async () => {
    await orm.em.find(User, { $and: [{ name: 'foo' }] } as any, { using: 'idx_user_name' });
  });

  test('using validation lists available indexes in error message', async () => {
    await expect(orm.em.find(User, { name: 'foo' } as any, { using: 'bad_idx' })).rejects.toThrow(/Available indexes/);
  });

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

  test('using with empty where passes validation', async () => {
    await orm.em.find(User, {} as any, { using: 'idx_user_name' });
  });
});
