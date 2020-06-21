import { MongoDriver } from '@mikro-orm/mongodb';
import { Collection as Collection_, MikroORM, Reference as Reference_, ReferenceType } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz } from './entities';
import FooBar from './entities/FooBar';

// we need to define those to get around typescript issues with reflection (ts-morph would return `any` for the type otherwise)
export class Collection<T> extends Collection_<T> { }
export class Reference<T> extends Reference_<T> { }
export type IdentifiedReference<T, PK extends keyof T = 'id' & keyof T> = { [K in PK]: T[K] } & Reference<T>;

describe('TsMorphMetadataProvider', () => {

  test('should load TS files directly', async () => {
    const orm = await MikroORM.init({
      entities: [Author, Book, Publisher, BaseEntity, BaseEntity3, BookTagSchema, Test, FooBaz, FooBar],
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
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
      entitiesDirs: ['./entities-compiled'],
      tsNode: false,
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
      type: 'mongo',
      cache: { enabled: false },
      discovery: { alwaysAnalyseProperties: false },
      metadataProvider: TsMorphMetadataProvider,
    });

    expect(Object.keys(orm.getMetadata().getAll()).sort()).toEqual(['Author', 'Book', 'BookTag', 'FooBar', 'FooBaz', 'Publisher', 'Test']);
    await orm.close();
  });

  test('should load entities', async () => {
    const orm = await MikroORM.init<MongoDriver>({
      entitiesDirs: ['entities'],
      baseDir: __dirname,
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
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

    await orm.close(true);
  });

  test('should ignore entity without path', async () => {
    const provider = new TsMorphMetadataProvider({} as any);
    const initProperties = jest.spyOn(TsMorphMetadataProvider.prototype, 'initProperties' as any);
    expect(initProperties).toBeCalledTimes(0);
    await provider.loadEntityMetadata({} as any, 'name');
    expect(initProperties).toBeCalledTimes(0);
  });

});
