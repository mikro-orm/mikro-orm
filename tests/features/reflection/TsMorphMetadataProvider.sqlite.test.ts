import { pathToFileURL } from 'node:url';
import { Options, Configuration, MikroORM, Utils } from '@mikro-orm/sqlite';
import { type PrimaryProperty, EntityMetadata, MetadataStorage } from '@mikro-orm/core';
import { Collection as Collection_, Reference as Reference_, ReferenceKind, EnumArrayType } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz } from './entities/index.js';
import FooBar from './entities/FooBar.js';

// we need to define those to get around typescript issues with reflection (ts-morph would return `any` for the type otherwise)
export class Collection<T extends object> extends Collection_<T> { }
export class Reference<T extends object> extends Reference_<T> { }
export type Ref<T extends object> = ({ [K in PrimaryProperty<T> & keyof T]?: T[K] } & Reference<T>);

describe('TsMorphMetadataProvider', () => {

  test('should load TS files directly', async () => {
    const orm = await MikroORM.init({
      entities: [Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz, FooBar],
      baseDir: import.meta.dirname,
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      metadataCache: { enabled: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect([...orm.getMetadata().getAll().keys()].map(e => Utils.className(e)).sort()).toEqual([
      'Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test', 'author_friends', 'book_tags', 'publisher_tests',
    ]);
    await orm.close();
  });

  test('should load entities based on .d.ts files', async () => {
    const orm = await MikroORM.init({
      entities: ['./entities-compiled'],
      preferTs: false,
      baseDir: import.meta.dirname,
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      metadataCache: { enabled: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect([...orm.getMetadata().getAll().keys()].map(e => Utils.className(e)).sort()).toEqual([
      'Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test', 'author_friends', 'book_tags', 'publisher_tests',
    ]);
    await orm.close();
  });

  test('should throw when .d.ts files missing', async () => {
    const options: Options = {
      entities: ['./entities-compiled-error'],
      entitiesTs: ['./entities-compiled-error'],
      preferTs: false,
      baseDir: import.meta.dirname,
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      metadataCache: { enabled: false },
      metadataProvider: TsMorphMetadataProvider,
    };
    const error = `Source file './entities-compiled-error/FooBar.ts' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`;
    await expect(MikroORM.init(options)).rejects.toThrow(error);
  });

  test('should load entities', async () => {
    const orm = await MikroORM.init({
      entities: ['entities'],
      baseDir: import.meta.dirname,
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      metadataCache: { pretty: true },
      metadataProvider: TsMorphMetadataProvider,
    });

    const metadata = orm.getMetadata().getAll();
    expect(metadata).toBeInstanceOf(Map);
    expect(metadata.get(Author)).toBeInstanceOf(EntityMetadata);
    expect(metadata.get(Author)?.path).toMatch('/entities/Author.ts');
    expect(metadata.get(Author)?.properties).toBeInstanceOf(Object);
    expect(metadata.get(Author)?.properties.books.type).toBe(Book.name);
    expect(metadata.get(Author)?.properties.books.kind).toBe(ReferenceKind.ONE_TO_MANY);
    expect(metadata.get(Author)?.properties.identities.array).toBe(true);
    expect(metadata.get(Author)?.properties.identities.type).toBe('string[]');
    expect(metadata.get(Author)?.properties.foo.type).toBe('string');
    expect(metadata.get(Author)?.properties.age.type).toBe('number');
    expect(metadata.get(Author)?.properties.age.optional).toBe(true);
    expect(metadata.get(Author)?.properties.age.nullable).toBe(true); // nullable is sniffed via ts-morph too
    expect(metadata.get(Book)?.properties.author.type).toBe(Author.name);
    expect(metadata.get(Book)?.properties.author.kind).toBe(ReferenceKind.MANY_TO_ONE);
    expect(metadata.get(Book)?.properties.metaArray.type).toBe('any[]');
    expect(metadata.get(Book)?.properties.metaArray.array).toBe(true);
    expect(metadata.get(Book)?.properties.metaArrayOfStrings.type).toBe('string[]');
    expect(metadata.get(Book)?.properties.metaArrayOfStrings.array).toBe(true);
    expect(metadata.get(Publisher)?.properties.tests.owner).toBe(true);
    expect(metadata.get(Publisher)?.properties.types.customType).toBeInstanceOf(EnumArrayType);
    expect(metadata.get(Publisher)?.properties.types2.customType).toBeInstanceOf(EnumArrayType);

    // customType should be re-hydrated when loading metadata from cache
    const provider = new TsMorphMetadataProvider(orm.config);
    const cacheAdapter = orm.config.getMetadataCacheAdapter();
    const cache = cacheAdapter.get('Publisher.ts');
    const meta = { properties: {
      types: { name: 'types', customType: new EnumArrayType('Publisher.types') },
      types2: { name: 'types2', customType: new EnumArrayType('Publisher.types2') },
    } } as unknown as EntityMetadata;
    provider.loadFromCache(meta, cache);
    expect(meta.properties.types.array).toBe(true);
    expect(meta.properties.types.enum).toBe(false);
    expect(meta.properties.types.customType).toBeInstanceOf(EnumArrayType);
    expect(meta.properties.types2.customType).toBeInstanceOf(EnumArrayType);
    expect(meta.properties.types2.array).toBe(true);
    expect(meta.properties.types2.enum).toBe(false);

    await orm.close(true);
  });

  test('should ignore entity without path', async () => {
    const provider = new TsMorphMetadataProvider(new Configuration({}, false));
    const initProperties = vi.spyOn(TsMorphMetadataProvider.prototype, 'initProperties' as any);
    expect(initProperties).toHaveBeenCalledTimes(0);
    provider.loadEntityMetadata({} as any);
    expect(initProperties).toHaveBeenCalledTimes(0);
  });

  test('should handle file:/// URLs in metadata paths (GH #7220)', async () => {
    // Simulate ES module behavior where decorator stack traces produce file:// URLs.
    // On Windows, ts-morph cannot handle file:// URLs directly, so initSourceFiles
    // must normalize them to regular paths first.
    const globalMetadata = MetadataStorage.getMetadata() as Record<string, EntityMetadata>;
    const originalPaths = new Map<string, string>();

    for (const [key, meta] of Object.entries(globalMetadata)) {
      if (meta.path && !meta.path.startsWith('file:')) {
        originalPaths.set(key, meta.path);
        meta.path = pathToFileURL(meta.path).href;
      }
    }

    try {
      const orm = await MikroORM.init({
        entities: [Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz, FooBar],
        baseDir: import.meta.dirname,
        clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
        metadataCache: { enabled: false },
        metadataProvider: TsMorphMetadataProvider,
      });

      expect([...orm.getMetadata().getAll().keys()].map(e => Utils.className(e)).sort()).toEqual([
        'Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test', 'author_friends', 'book_tags', 'publisher_tests',
      ]);
      await orm.close();
    } finally {
      // Restore original paths to avoid affecting other tests
      for (const [key, path] of originalPaths) {
        globalMetadata[key].path = path;
      }
    }
  });

  test('should throw when source file not found', async () => {
    const provider = new TsMorphMetadataProvider(new Configuration({}, false));
    const error = `Source file './path/to/entity.ts' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`;
    expect(() => provider.getExistingSourceFile('./path/to/entity.js')).toThrow(error);
  });

});
