import { MikroORM, ObjectHydrator, Utils } from '@mikro-orm/sqlite';
import { CompileCommand } from '../../../packages/cli/src/commands/CompileCommand.js';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Embeddable()
class Address {
  @Property()
  street!: string;

  @Property()
  city!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Address)
  address!: Address;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  price!: number;
}

const initOptions = {
  metadataProvider: ReflectMetadataProvider,
  entities: [Author, Book, Address],
  dbName: ':memory:' as const,
};

describe('compiled functions', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(initOptions);
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  function generateCompiledFunctions(fromOrm: MikroORM): Record<string, (...args: any[]) => any> {
    const captured = CompileCommand.capture(fromOrm.getMetadata(), fromOrm.config);
    const result: Record<string, (...args: any[]) => any> = {};

    for (const { key, contextKeys, code } of captured) {
      // eslint-disable-next-line no-new-func
      const fn = new Function(...contextKeys, `'use strict';\n` + code) as (...args: any[]) => any;
      result[key] = fn;
    }

    return result;
  }

  test('Utils.createFunction uses compiledFunctions when key matches', () => {
    const context = new Map<string, any>([
      ['a', 1],
      ['b', 2],
    ]);
    const mockFn = vi.fn((...args: any[]) => 'pregenerated');
    const compiledFunctions = { 'test-key': mockFn };

    const result = Utils.createFunction(context, 'return a + b;', compiledFunctions, 'test-key');

    expect(result).toBe('pregenerated');
    expect(mockFn).toHaveBeenCalledWith(1, 2);
  });

  test('Utils.createFunction falls back to new Function when key does not match', () => {
    const context = new Map<string, any>([
      ['a', 1],
      ['b', 2],
    ]);
    const compiledFunctions = { 'other-key': vi.fn() };

    const result = Utils.createFunction(context, 'return a + b;', compiledFunctions, 'test-key');

    expect(result).toBe(3);
  });

  test('Utils.createFunction falls back to new Function when compiledFunctions is undefined', () => {
    const context = new Map<string, any>([
      ['a', 1],
      ['b', 2],
    ]);

    const result = Utils.createFunction(context, 'return a + b;', undefined, 'test-key');

    expect(result).toBe(3);
  });

  test('Utils.createFunction falls back to new Function when key is undefined', () => {
    const context = new Map<string, any>([
      ['a', 1],
      ['b', 2],
    ]);
    const compiledFunctions = { 'test-key': vi.fn() };

    const result = Utils.createFunction(context, 'return a + b;', compiledFunctions);

    expect(result).toBe(3);
  });

  test('generates all expected function keys', () => {
    const compiledFunctions = generateCompiledFunctions(orm);
    const keys = Object.keys(compiledFunctions);

    const authorMeta = orm.getMetadata().get(Author);
    const bookMeta = orm.getMetadata().get(Book);

    // Author functions (using uniqueName)
    expect(keys).toContain(`hydrator-${authorMeta.uniqueName}-full-false`);
    expect(keys).toContain(`hydrator-${authorMeta.uniqueName}-full-true`);
    expect(keys).toContain(`hydrator-${authorMeta.uniqueName}-reference-false`);
    expect(keys).toContain(`hydrator-${authorMeta.uniqueName}-reference-true`);
    expect(keys).toContain(`comparator-${authorMeta.uniqueName}`);
    expect(keys).toContain(`snapshotGenerator-${authorMeta.uniqueName}`);
    expect(keys).toContain(`resultMapper-${authorMeta.uniqueName}`);
    expect(keys).toContain(`pkGetter-${authorMeta.uniqueName}`);
    expect(keys).toContain(`pkGetterConverted-${authorMeta.uniqueName}`);
    expect(keys).toContain(`pkSerializer-${authorMeta.uniqueName}`);

    // Book functions (using uniqueName)
    expect(keys).toContain(`hydrator-${bookMeta.uniqueName}-full-false`);
    expect(keys).toContain(`comparator-${bookMeta.uniqueName}`);
    expect(keys).toContain(`snapshotGenerator-${bookMeta.uniqueName}`);
    expect(keys).toContain(`resultMapper-${bookMeta.uniqueName}`);
    expect(keys).toContain(`pkGetter-${bookMeta.uniqueName}`);
    expect(keys).toContain(`pkGetterConverted-${bookMeta.uniqueName}`);
    expect(keys).toContain(`pkSerializer-${bookMeta.uniqueName}`);
  });

  test('compiled functions produce identical results to JIT path', async () => {
    const compiledFunctions = generateCompiledFunctions(orm);

    const orm2 = await MikroORM.init({ ...initOptions, compiledFunctions });

    try {
      await orm2.schema.refresh();

      // Insert test data via orm (JIT path)
      const author = orm.em.create(Author, {
        name: 'John',
        address: { street: '123 Main St', city: 'Springfield' },
      });
      await orm.em.flush();

      // Insert same data via orm2 (compiled functions path)
      const author2 = orm2.em.create(Author, {
        name: 'John',
        address: { street: '123 Main St', city: 'Springfield' },
      });
      await orm2.em.flush();

      // Test comparator - both ORMs should produce same snapshot
      const comparator1 = orm.config.getComparator(orm.getMetadata());
      const comparator2 = orm2.config.getComparator(orm2.getMetadata());
      const meta = orm.getMetadata().get(Author);
      const meta2 = orm2.getMetadata().get(Author);

      const snapshot1 = comparator1.prepareEntity(author);
      const snapshot2 = comparator2.prepareEntity(author2);

      expect(snapshot1).toEqual(snapshot2);

      // Test result mapper - both should map DB rows identically
      const mapper1 = comparator1.getResultMapper(meta);
      const mapper2 = comparator2.getResultMapper(meta2);
      const testRow = { id: 1, name: 'John', address_street: '123 Main St', address_city: 'Springfield' };
      expect(mapper1(testRow)).toEqual(mapper2(testRow));

      // Test PK getter
      const pkGetter1 = comparator1.getPkGetter(meta);
      const pkGetter2 = comparator2.getPkGetter(meta2);
      expect(pkGetter1(author)).toEqual(pkGetter2(author2));

      // Test PK serializer
      const pkSerializer1 = comparator1.getPkSerializer(meta);
      const pkSerializer2 = comparator2.getPkSerializer(meta2);
      expect(pkSerializer1(author)).toEqual(pkSerializer2(author2));
    } finally {
      await orm2.close(true);
    }
  });

  test('no new Function calls when compiledFunctions covers all entities', async () => {
    const compiledFunctions = generateCompiledFunctions(orm);

    const orm2 = await MikroORM.init({ ...initOptions, compiledFunctions });

    try {
      // Wrap createFunction to track if new Function is ever called (JIT fallback)
      let jitFallbackCalled = false;
      const original = Utils.createFunction;
      Utils.createFunction = (context, code, cf, key) => {
        const result = original.call(Utils, context, code, cf, key);

        if (!key || !cf?.[key]) {
          jitFallbackCalled = true;
        }

        return result;
      };

      try {
        // Trigger all compiled function paths
        const metadata = orm2.getMetadata();
        const comparator = orm2.config.getComparator(metadata);
        const hydrator = orm2.config.getHydrator(metadata) as ObjectHydrator;

        for (const meta of metadata) {
          if (meta.abstract) {
            continue;
          }

          hydrator.getEntityHydrator(meta, 'full', false);
          hydrator.getEntityHydrator(meta, 'full', true);
          comparator.getEntityComparator(meta.class);
          comparator.getSnapshotGenerator(meta.class);
          comparator.getResultMapper(meta);

          if (!meta.embeddable && !meta.virtual) {
            hydrator.getEntityHydrator(meta, 'reference', false);
            hydrator.getEntityHydrator(meta, 'reference', true);
          }

          if (meta.primaryKeys.length > 0) {
            comparator.getPkGetter(meta);
            comparator.getPkGetterConverted(meta);
            comparator.getPkSerializer(meta);
          }
        }
      } finally {
        Utils.createFunction = original;
      }

      // No JIT fallback should have occurred
      expect(jitFallbackCalled).toBe(false);
    } finally {
      await orm2.close(true);
    }
  });

  test('falls back to JIT when key is missing from compiledFunctions', async () => {
    // Provide only partial compiled functions (missing Book)
    const allFunctions = generateCompiledFunctions(orm);
    const partialFunctions: Record<string, (...args: any[]) => any> = {};
    const authorUniqueName = orm.getMetadata().get(Author).uniqueName;

    for (const [key, fn] of Object.entries(allFunctions)) {
      if (key.includes(authorUniqueName)) {
        partialFunctions[key] = fn;
      }
    }

    const orm2 = await MikroORM.init({ ...initOptions, compiledFunctions: partialFunctions });

    try {
      await orm2.schema.refresh();

      // Should still work - Book uses JIT fallback, Author uses compiled
      const book = orm2.em.create(Book, { title: 'Test', price: 9.99 });
      await orm2.em.flush();
      orm2.em.clear();

      const loaded = await orm2.em.findOneOrFail(Book, book.id);
      expect(loaded.title).toBe('Test');
      expect(loaded.price).toBe(9.99);
    } finally {
      await orm2.close(true);
    }
  });
});
