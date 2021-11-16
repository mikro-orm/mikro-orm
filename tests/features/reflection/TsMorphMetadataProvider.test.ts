import type { MongoDriver } from '@mikro-orm/mongodb';
import type { AnyEntity, Options, PrimaryProperty, Cast, IsUnknown, EntityMetadata } from '@mikro-orm/core';
import { Collection as Collection_, MikroORM, Reference as Reference_, ReferenceType, EnumArrayType } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz } from './entities';
import FooBar from './entities/FooBar';

// we need to define those to get around typescript issues with reflection (ts-morph would return `any` for the type otherwise)
export class Collection<T> extends Collection_<T> { }
export class Reference<T> extends Reference_<T> { }
export type IdentifiedReference<T extends AnyEntity<T>, PK extends keyof T | unknown = PrimaryProperty<T>> = true extends IsUnknown<PK> ? Reference<T> : ({ [K in Cast<PK, keyof T>]?: T[K] } & Reference<T>);

describe('TsMorphMetadataProvider', () => {

  test('should load TS files directly', async () => {
    const orm = await MikroORM.init({
      entities: [Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz, FooBar],
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
      type: 'mongo',
      cache: { enabled: false },
      discovery: { alwaysAnalyseProperties: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should load entities based on .d.ts files', async () => {
    const orm = await MikroORM.init({
      entities: ['./entities-compiled'],
      tsNode: false,
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
      type: 'mongo',
      cache: { enabled: false },
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
      tsNode: false,
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
      type: 'mongo',
      cache: { enabled: false },
      metadataProvider: TsMorphMetadataProvider,
    };
    const error = `Source file './entities-compiled-error/FooBar.ts' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`;
    await expect(MikroORM.init(options, false)).rejects.toThrowError(error);
  });

  test('should load entities', async () => {
    const orm = await MikroORM.init<MongoDriver>({
      entities: ['entities'],
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
      type: 'mongo',
      cache: { pretty: true },
      metadataProvider: TsMorphMetadataProvider,
    });

    const metadata = orm.getMetadata().getAll();
    expect(metadata).toBeInstanceOf(Object);
    expect(metadata[Author.name]).toBeInstanceOf(Object);
    expect(metadata[Author.name].path).toBe('./entities/Author.ts');
    expect(metadata[Author.name].properties).toBeInstanceOf(Object);
    expect(metadata[Author.name].properties.books.type).toBe(Book.name);
    expect(metadata[Author.name].properties.books.reference).toBe(ReferenceType.ONE_TO_MANY);
    expect(metadata[Author.name].properties.foo.type).toBe('string');
    expect(metadata[Author.name].properties.age.type).toBe('number');
    expect(metadata[Author.name].properties.age.nullable).toBe(true); // nullable is sniffed via ts-morph too
    expect(metadata[Book.name].properties.author.type).toBe(Author.name);
    expect(metadata[Book.name].properties.author.reference).toBe(ReferenceType.MANY_TO_ONE);
    expect(metadata[Publisher.name].properties.tests.owner).toBe(true);
    expect(metadata[Publisher.name].properties.types.customType).toBeInstanceOf(EnumArrayType);
    expect(metadata[Publisher.name].properties.types2.customType).toBeInstanceOf(EnumArrayType);

    // customType should be re-hydrated when loading metadata from cache
    const provider = new TsMorphMetadataProvider(orm.config);
    const cacheAdapter = orm.config.getCacheAdapter();
    const cache = await cacheAdapter.get('Publisher.ts');
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
    const provider = new TsMorphMetadataProvider({} as any);
    const initProperties = jest.spyOn(TsMorphMetadataProvider.prototype, 'initProperties' as any);
    expect(initProperties).toBeCalledTimes(0);
    await provider.loadEntityMetadata({} as any, 'name');
    expect(initProperties).toBeCalledTimes(0);
  });

  test('should throw when source file not found', async () => {
    const provider = new TsMorphMetadataProvider({} as any);
    const error = `Source file './path/to/entity.ts' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`;
    await expect(provider.getExistingSourceFile('./path/to/entity.js')).rejects.toThrowError(error);
  });

});
