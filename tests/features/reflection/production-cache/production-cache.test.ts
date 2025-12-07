import { Collection, GeneratedCacheAdapter, MikroORM, Ref, sql } from '@mikro-orm/sqlite';
import { FileCacheAdapter } from '@mikro-orm/core/fs-utils';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  types!: number[];

  @Property({ default: sql`current_timestamp` })
  createdAt!: Date;

  @ManyToOne()
  parent?: Ref<A>;

  @OneToMany({ mappedBy: 'parent' })
  children = new Collection<A>(this);

}

test('bundler friendly production cache', async () => {
  // warm up cache by doing async init, this creates a single metadata.json file
  const orm1 = await MikroORM.init({
    metadataCache: { enabled: true, pretty: true, adapter: FileCacheAdapter, options: { combined: './metadata-cache.json', cacheDir: import.meta.dirname } },
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
  });
  await orm1.close();

  // now we can use the combined cached to init the ORM synchronously, without the ts-morph dependency
  const orm2 = new MikroORM({
    metadataCache: { enabled: true, adapter: GeneratedCacheAdapter, options: { data: require('./metadata-cache.json') } },
    entities: [A],
    dbName: ':memory:',
  });
  await orm2.close();
});

test('bundler friendly production cache (default metadata file)', async () => {
  // warm up cache by doing async init, this creates a single metadata.json file
  const orm1 = await MikroORM.init({
    metadataCache: { enabled: true, adapter: FileCacheAdapter, options: { combined: true, cacheDir: import.meta.dirname } },
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
  });
  await orm1.close();

  // now we can use the combined cached to init the ORM synchronously, without the ts-morph dependency
  const orm2 = new MikroORM({
    metadataCache: { enabled: true, adapter: GeneratedCacheAdapter, options: { data: require('./metadata.json') } },
    entities: [A],
    dbName: ':memory:',
  });
  await orm2.close();
});

test('explicit cache adapter required with sync init', async () => {
  expect(() => new MikroORM({
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
  })).toThrow('No metadata cache adapter specified, please fill in `metadataCache.adapter` option or use the async MikroORM.init() method which can autoload it.');
  const orm = new MikroORM({
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { adapter: FileCacheAdapter },
  });
  await orm.close();
});

test('cache adapter auto-loaded with async init', async () => {
  const orm = await MikroORM.init({
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
  });
  expect(orm.config.get('metadataCache').adapter).toBe(FileCacheAdapter);
  await orm.close();
});
