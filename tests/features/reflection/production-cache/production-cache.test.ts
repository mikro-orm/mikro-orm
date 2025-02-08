import {
  Collection as Collection_,
  Entity,
  FileCacheAdapter,
  GeneratedCacheAdapter,
  IsUnknown,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey, PrimaryProperty,
  Property,
  Reference as Reference_,
} from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export class Collection<T extends object> extends Collection_<T> { }
export class Reference<T extends object> extends Reference_<T> { }
export type Ref<T extends object> = true extends IsUnknown<PrimaryProperty<T>>
  ? Reference<T>
  : ({ [K in PrimaryProperty<T> & keyof T]: T[K] } & Reference<T>);

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  types!: number[];

  @ManyToOne()
  parent?: Ref<A>;

  @OneToMany({ mappedBy: 'parent' })
  children = new Collection<A>(this);

}

test('bundler friendly production cache', async () => {
  // warm up cache by doing async init, this creates a single metadata.json file
  const orm1 = await MikroORM.init({
    metadataCache: { enabled: true, pretty: true, adapter: FileCacheAdapter, options: { combined: './metadata-cache.json', cacheDir: __dirname } },
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    connect: false,
  });
  await orm1.close();

  // now we can use the combined cached to init the ORM synchronously, without the ts-morph dependency
  const orm2 = MikroORM.initSync({
    metadataCache: { enabled: true, adapter: GeneratedCacheAdapter, options: { data: require('./metadata-cache.json') } },
    entities: [A],
    dbName: ':memory:',
  });
  await orm2.close();
});

test('bundler friendly production cache (default metadata file)', async () => {
  // warm up cache by doing async init, this creates a single metadata.json file
  const orm1 = await MikroORM.init({
    metadataCache: { enabled: true, adapter: FileCacheAdapter, options: { combined: true, cacheDir: __dirname } },
    entities: [A],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    connect: false,
  });
  await orm1.close();

  // now we can use the combined cached to init the ORM synchronously, without the ts-morph dependency
  const orm2 = MikroORM.initSync({
    metadataCache: { enabled: true, adapter: GeneratedCacheAdapter, options: { data: require('./metadata.json') } },
    entities: [A],
    dbName: ':memory:',
  });
  await orm2.close();
});
