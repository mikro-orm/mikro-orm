import { Configuration, MikroORM } from '@mikro-orm/mongodb';
import type { Options, PrimaryProperty, EntityMetadata } from '@mikro-orm/core';
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
      discovery: { alwaysAnalyseProperties: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should load entities based on .d.ts files', async () => {
    const orm = await MikroORM.init({
      entities: ['./entities-compiled'],
      preferTs: false,
      baseDir: import.meta.dirname,
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      metadataCache: { enabled: false },
      discovery: { alwaysAnalyseProperties: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
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
      connect: false,
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
    expect(metadata).toBeInstanceOf(Object);
    expect(metadata[Author.name]).toBeInstanceOf(Object);
    expect(metadata[Author.name].path).toBe('./entities/Author.ts');
    expect(metadata[Author.name].properties).toBeInstanceOf(Object);
    expect(metadata[Author.name].properties.books.type).toBe(Book.name);
    expect(metadata[Author.name].properties.books.kind).toBe(ReferenceKind.ONE_TO_MANY);
    expect(metadata[Author.name].properties.identities.array).toBe(true);
    expect(metadata[Author.name].properties.identities.type).toBe('string[]');
    expect(metadata[Author.name].properties.foo.type).toBe('string');
    expect(metadata[Author.name].properties.age.type).toBe('number');
    expect(metadata[Author.name].properties.age.optional).toBe(true);
    expect(metadata[Author.name].properties.age.nullable).toBe(true); // nullable is sniffed via ts-morph too
    expect(metadata[Book.name].properties.author.type).toBe(Author.name);
    expect(metadata[Book.name].properties.author.kind).toBe(ReferenceKind.MANY_TO_ONE);
    expect(metadata[Book.name].properties.metaArray.type).toBe('any[]');
    expect(metadata[Book.name].properties.metaArray.array).toBe(true);
    expect(metadata[Book.name].properties.metaArrayOfStrings.type).toBe('string[]');
    expect(metadata[Book.name].properties.metaArrayOfStrings.array).toBe(true);
    expect(metadata[Publisher.name].properties.tests.owner).toBe(true);
    expect(metadata[Publisher.name].properties.types.customType).toBeInstanceOf(EnumArrayType);
    expect(metadata[Publisher.name].properties.types2.customType).toBeInstanceOf(EnumArrayType);

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
    provider.loadEntityMetadata({} as any, 'name');
    expect(initProperties).toHaveBeenCalledTimes(0);
  });

  test('should throw when source file not found', async () => {
    const provider = new TsMorphMetadataProvider(new Configuration({}, false));
    const error = `Source file './path/to/entity.ts' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`;
    expect(() => provider.getExistingSourceFile('./path/to/entity.js')).toThrow(error);
  });

});
