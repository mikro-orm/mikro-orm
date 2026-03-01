import { type EntityMetadata, MikroORM, MetadataProvider, Utils, quote, type Ref } from '@mikro-orm/postgresql';
import { Entity, Index, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { rm } from 'node:fs/promises';

/**
 * A metadata provider that actually persists to the file cache (like TsMorphMetadataProvider)
 * but uses reflect-metadata for type resolution (simpler test setup).
 */
class CachingReflectMetadataProvider extends ReflectMetadataProvider {

  static override useCache(): boolean {
    return true;
  }

  override saveToCache(meta: EntityMetadata): void {
    if (!this.useCache()) {
      return;
    }

    Reflect.deleteProperty(meta, 'root');
    const copy = Utils.copy(meta, false);

    ([
      'prototype', 'props', 'referencingProperties', 'propertyOrder', 'relations',
      'concurrencyCheckKeys', 'checks',
    ] as const).forEach(key => delete copy[key]);

    if (meta.path) {
      this.config.getMetadataCacheAdapter().set(this.getCacheKey(meta), copy, meta.path);
    }
  }

}

@Entity({ tableName: 'organizations' })
@Index({
  name: 'organizations_name_ui',
  expression: (columns, table, indexName) => quote`create unique index ${indexName} on ${table}(${columns.name}) where ${columns.deletedAt} is null`,
})
class Organization {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  deletedAt?: Date;

}

@Entity({ tableName: 'users' })
@Index({
  name: 'users_organization_id_ui',
  expression: (columns, table, indexName) => quote`create unique index ${indexName} on ${table}(${columns.organization}) where ${columns.deletedAt} is null`,
})
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Organization, { ref: true })
  organization!: Ref<Organization>;

  @Property({ nullable: true })
  deletedAt?: Date;

}

const migrationsPath = process.cwd() + '/temp/migrations-gh7238';
const cachePath = process.cwd() + '/temp/cache-gh7238';

describe('expression-based index diffing (GH #7238)', () => {

  afterAll(async () => {
    await rm(migrationsPath, { recursive: true, force: true });
    await rm(cachePath, { recursive: true, force: true });
  });

  test('function expression indexes survive when metadata cache is disabled', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Organization, User],
      dbName: 'mikro_orm_test_gh_7238',
      metadataCache: { enabled: false },
    });

    const meta = orm.getMetadata().get(Organization);
    const idx = meta.indexes.find(i => i.name === 'organizations_name_ui');
    expect(idx).toBeDefined();
    expect(typeof idx!.expression).toBe('function');

    await orm.close();
  });

  test('function expression indexes should survive metadata cache round-trip', async () => {
    await rm(cachePath, { recursive: true, force: true });

    // First init: populate the cache
    const orm1 = await MikroORM.init({
      metadataProvider: CachingReflectMetadataProvider,
      entities: [Organization, User],
      dbName: 'mikro_orm_test_gh_7238',
      metadataCache: { enabled: true, options: { cacheDir: cachePath } },
    });

    const meta1 = orm1.getMetadata().get(Organization);
    const idx1 = meta1.indexes.find(i => i.name === 'organizations_name_ui');
    expect(idx1).toBeDefined();
    expect(typeof idx1!.expression).toBe('function');

    await orm1.close();

    // Second init: load from cache — expression functions must survive
    const orm2 = await MikroORM.init({
      metadataProvider: CachingReflectMetadataProvider,
      entities: [Organization, User],
      dbName: 'mikro_orm_test_gh_7238',
      metadataCache: { enabled: true, options: { cacheDir: cachePath } },
    });

    const meta2 = orm2.getMetadata().get(Organization);
    const idx2 = meta2.indexes.find(i => i.name === 'organizations_name_ui');
    expect(idx2).toBeDefined();
    expect(typeof idx2!.expression).toBe('function');

    const meta2u = orm2.getMetadata().get(User);
    const idx2u = meta2u.indexes.find(i => i.name === 'users_organization_id_ui');
    expect(idx2u).toBeDefined();
    expect(typeof idx2u!.expression).toBe('function');

    await orm2.close();
    await rm(cachePath, { recursive: true, force: true });
  });

  test('schema diff should be clean after cache round-trip', async () => {
    await rm(cachePath, { recursive: true, force: true });
    await rm(migrationsPath, { recursive: true, force: true });

    // First init: populate cache + create schema
    const orm1 = await MikroORM.init({
      metadataProvider: CachingReflectMetadataProvider,
      entities: [Organization, User],
      dbName: 'mikro_orm_test_gh_7238',
      metadataCache: { enabled: true, options: { cacheDir: cachePath } },
      migrations: { path: migrationsPath, snapshot: true },
      extensions: [Migrator],
    });
    await orm1.schema.refresh({ dropDb: true });
    await orm1.close();

    // Second init: load from cache — should still produce clean diffs
    const orm2 = await MikroORM.init({
      metadataProvider: CachingReflectMetadataProvider,
      entities: [Organization, User],
      dbName: 'mikro_orm_test_gh_7238',
      metadataCache: { enabled: true, options: { cacheDir: cachePath } },
      migrations: { path: migrationsPath, snapshot: true },
      extensions: [Migrator],
    });

    const updateSQL = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(updateSQL).toBe('');

    await orm2.close();
    await rm(cachePath, { recursive: true, force: true });
    await rm(migrationsPath, { recursive: true, force: true });
  });

});
