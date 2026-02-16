import { MikroORM, Loaded, type EntityDTO, type EntityDTOFlat, type SerializeDTO, type Dictionary } from '@mikro-orm/mysql';
import { Author2, Book2, Publisher2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';
import { expectTypeOf } from 'vitest';
import type { ModifyFields } from '@mikro-orm/sql';

// ============================================
// Internal helper types (copied for testing)
// These mirror the types in QueryBuilder.ts
// ============================================

// Extract alias names from Context
type ExtractAliasNames<Context> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, any, any]
      ? Alias & string
      : never
    : never
  : never;

// Strip root alias prefix from a field path
type StripRootAlias<F extends string, RootAlias extends string, Context = never> = F extends `${RootAlias}.${infer Field}`
  ? Field
  : F extends `${infer Alias}.${string}`
    ? Alias extends ExtractAliasNames<Context>
      ? never
      : F
    : F;

// Extract root entity fields from selected fields
type ExtractRootFields<Fields, RootAlias extends string, Context = never> = [Fields] extends ['*']
  ? '*'
  : Fields extends `${RootAlias}.*`
    ? '*'
    : Fields extends string
      ? StripRootAlias<Fields, RootAlias, Context>
      : never;

describe('QueryBuilder Fields type tracking', () => {
  let orm: MikroORM;

  beforeAll(async () => (orm = await initORMMySql('mysql')));
  afterAll(async () => await orm.close(true));

  describe('StripRootAlias helper type', () => {
    test('should strip root alias from simple field', () => {
      type Result = StripRootAlias<'a.name', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'name'>();
    });

    test('should strip root alias from embedded property path', () => {
      // 'a.identity.foo' -> 'identity.foo'
      type Result = StripRootAlias<'a.identity.foo', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });

    test('should return never for joined alias paths when Context is provided', () => {
      // 'b.title' with root alias 'a' and 'b' in Context -> never
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = StripRootAlias<'b.title', 'a', Context>;
      expectTypeOf<Result>().toEqualTypeOf<never>();
    });

    test('should keep unaliased simple fields as-is', () => {
      type Result = StripRootAlias<'name', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'name'>();
    });

    test('should handle unaliased embedded property paths (no Context)', () => {
      // 'identity.foo' without alias should be preserved when Context is empty
      type Result = StripRootAlias<'identity.foo', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });

    test('should handle unaliased embedded property paths (with Context)', () => {
      // 'identity.foo' should be preserved even when Context has other aliases
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = StripRootAlias<'identity.foo', 'a', Context>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });
  });

  describe('ExtractRootFields helper type', () => {
    test('should handle wildcard', () => {
      type Result = ExtractRootFields<'*', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'*'>();
    });

    test('should handle aliased wildcard', () => {
      type Result = ExtractRootFields<'a.*', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'*'>();
    });

    test('should extract simple field from aliased path', () => {
      type Result = ExtractRootFields<'a.name', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'name'>();
    });

    test('should extract embedded field from aliased path', () => {
      type Result = ExtractRootFields<'a.identity.foo', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });

    test('should return never for joined alias path with Context', () => {
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = ExtractRootFields<'b.title', 'a', Context>;
      expectTypeOf<Result>().toEqualTypeOf<never>();
    });

    test('should extract unaliased embedded property path (no Context)', () => {
      // 'identity.foo' -> 'identity.foo' when no Context
      type Result = ExtractRootFields<'identity.foo', 'a'>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });

    test('should extract unaliased embedded property path (with Context)', () => {
      // 'identity.foo' -> 'identity.foo' even with Context
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = ExtractRootFields<'identity.foo', 'a', Context>;
      expectTypeOf<Result>().toEqualTypeOf<'identity.foo'>();
    });
  });

  describe('ModifyFields helper type', () => {
    test('should add join fields with proper path prefix', () => {
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = ModifyFields<'*', 'a', Context, 'books', 'b', readonly ['title', 'price']>;
      expectTypeOf<Result>().toEqualTypeOf<'*' | 'books.title' | 'books.price'>();
    });

    test('should strip alias prefix from join fields', () => {
      type Context = { b: ['books', 'b', Book2, true] };
      // Fields with alias prefix should be stripped: 'b.title' -> 'title' -> 'books.title'
      type Result = ModifyFields<'*', 'a', Context, 'books', 'b', readonly ['b.title', 'b.price']>;
      expectTypeOf<Result>().toEqualTypeOf<'*' | 'books.title' | 'books.price'>();
    });

    test('should preserve existing fields when no join fields specified', () => {
      type Context = { b: ['books', 'b', Book2, true] };
      type Result = ModifyFields<'id' | 'name', 'a', Context, 'books', 'b', undefined>;
      expectTypeOf<Result>().toEqualTypeOf<'id' | 'name'>();
    });
  });

  describe('select() method return type', () => {
    test('should track selected fields from aliased paths', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.name']);

      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, 'id' | 'name'>[]>();
    });

    test('should track wildcard selection', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, '*'>[]>();
    });

    test('should track aliased wildcard selection', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('a.*');

      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, '*'>[]>();
    });
  });

  describe('addSelect() method return type', () => {
    test('should accumulate fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('a.id').addSelect('a.name');

      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, 'id' | 'name'>[]>();
    });
  });

  describe('joinAndSelect() method return type', () => {
    test('should track join fields when specified', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('a.id').leftJoinAndSelect('a.books', 'b', {}, ['title', 'price']);

      const result = await qb.getResultList();
      // Should include root fields + prefixed join fields
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, 'books', 'id' | 'books.title' | 'books.price'>[]>();
    });

    test('should preserve fields when no join fields specified', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('a.id').leftJoinAndSelect('a.books', 'b');

      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, 'books', 'id'>[]>();
    });
  });

  describe('joinAndSelect fields type safety', () => {
    test('should reject invalid field names', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');
      // @ts-expect-error 'nameasd' is not a valid field of Book2
      qb.leftJoinAndSelect('a.books', 'b', {}, ['nameasd']);
    });

    test('should reject empty array', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');
      // @ts-expect-error empty array is not allowed
      qb.leftJoinAndSelect('a.books', 'b', {}, []);
    });

    test('should accept valid field names without alias prefix', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*').leftJoinAndSelect('a.books', 'b', {}, ['title', 'price']);
      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, 'books', '*' | 'books.title' | 'books.price'>[]>();
    });

    test('should accept valid field names with alias prefix', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*').leftJoinAndSelect('a.books', 'b', {}, ['b.title', 'b.price']);
      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, 'books', '*' | 'books.title' | 'books.price'>[]>();
    });

    test('should work with innerJoinAndSelect', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*').innerJoinAndSelect('a.books', 'b', {}, ['title']);
      const result = await qb.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, 'books', '*' | 'books.title'>[]>();
    });

    test('should reject invalid fields in innerJoinAndSelect', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');
      // @ts-expect-error 'invalid' is not a valid field of Book2
      qb.innerJoinAndSelect('a.books', 'b', {}, ['invalid']);
    });
  });

  describe('getResult and getSingleResult return types', () => {
    test('getResult should return Loaded with Fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.getResult();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, 'id' | 'email'>[]>();
    });

    test('getSingleResult should return Loaded with Fields or null', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.getSingleResult();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, 'id' | 'email'> | null>();
    });

    test('getResultAndCount should return tuple with Loaded', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.name']);

      const result = await qb.getResultAndCount();
      expectTypeOf(result).toEqualTypeOf<[Loaded<Author2, never, 'id' | 'name'>[], number]>();
    });
  });

  describe('clone() preserves Fields type', () => {
    test('clone should preserve selected fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.name']);

      const cloned = qb.clone();
      const result = await cloned.getResultList();
      expectTypeOf(result).toEqualTypeOf<Loaded<Author2, never, 'id' | 'name'>[]>();
    });
  });

  describe('execute() return types', () => {
    test('execute() should return EntityDTO with Fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.execute();
      expectTypeOf(result).toEqualTypeOf<Pick<EntityDTO<Author2>, 'id' | 'email'>[]>();
    });

    test('execute("all") should return EntityDTO array with Fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.execute('all');
      expectTypeOf(result).toEqualTypeOf<Pick<EntityDTO<Author2>, 'id' | 'email'>[]>();
    });

    test('execute("get") should return single EntityDTO with Fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.execute('get');
      expectTypeOf(result).toEqualTypeOf<Pick<EntityDTO<Author2>, 'id' | 'email'>>();
    });

    test('execute() with wildcard should return EntityDTO', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*');

      const result = await qb.execute();
      expectTypeOf(result).toEqualTypeOf<EntityDTOFlat<Author2>[]>();
    });

    test('execute() with wildcard joinAndSelect should expand relation', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('*').leftJoinAndSelect('a.books', 'b');

      const result = await qb.execute();
      // Wildcard + single-level join: Omit + override populated relations
      type ResultElement = (typeof result)[number];
      expectTypeOf<ResultElement['books']>().toEqualTypeOf<EntityDTOFlat<Book2>[]>();
      expectTypeOf<ResultElement['name']>().toEqualTypeOf<string>();
    });

    test('execute() with joinAndSelect and fields should include Hint', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select('a.id').leftJoinAndSelect('a.books', 'b', {}, ['title', 'price']);

      const result = await qb.execute();
      // DirectDTO: root has selected fields + PK, joined entity has sub-fields + PK
      type ResultElement = (typeof result)[number];
      expectTypeOf<ResultElement['id']>().toEqualTypeOf<number>();
      expectTypeOf<ResultElement['books']>().toBeArray();
      expectTypeOf<ResultElement['books'][number]>().toHaveProperty('title');
      expectTypeOf<ResultElement['books'][number]>().toHaveProperty('price');
      expectTypeOf<ResultElement['books'][number]>().toHaveProperty('uuid');
    });

    test('execute() with 2-level nested joins and wildcard', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoinAndSelect('a.books', 'b')
        .leftJoinAndSelect('b.publisher', 'p');

      const result = await qb.execute();
      // Nested hints → uses SerializeDTO for wildcard case
      expectTypeOf(result).toEqualTypeOf<SerializeDTO<Author2, 'books' | 'books.publisher'>[]>();
    });

    test('execute() with 3-level nested joins and wildcard', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('*')
        .leftJoinAndSelect('a.books', 'b')
        .leftJoinAndSelect('b.publisher', 'p')
        .leftJoinAndSelect('p.books', 'pb');

      const result = await qb.execute();
      expectTypeOf(result).toEqualTypeOf<SerializeDTO<Author2, 'books' | 'books.publisher' | 'books.publisher.books'>[]>();
    });

    test('execute() with 3-level nested joins and selected fields', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a')
        .select('a.id')
        .leftJoinAndSelect('a.books', 'b', {}, ['title'])
        .leftJoinAndSelect('b.publisher', 'p', {}, ['name'])
        .leftJoinAndSelect('p.books', 'pb', {}, ['title']);

      const result = await qb.execute();
      expectTypeOf(result).toEqualTypeOf<EntityDTOFlat<Loaded<Author2, 'books' | 'books.publisher' | 'books.publisher.books', 'id' | 'books.title' | 'books.publisher.name' | 'books.publisher.books.title'>>[]>();
    });

    test('execute() with explicit type param should override default', async () => {
      const qb = orm.em.createQueryBuilder(Author2, 'a').select(['a.id', 'a.email']);

      const result = await qb.execute<Dictionary[]>();
      expectTypeOf(result).toEqualTypeOf<Dictionary[]>();
    });
  });
});
