import type { EntityManagerType, IDatabaseDriver } from './drivers/IDatabaseDriver.js';
import { type EntitySchema } from './metadata/EntitySchema.js';
import { MetadataDiscovery } from './metadata/MetadataDiscovery.js';
import { MetadataStorage } from './metadata/MetadataStorage.js';
import { Configuration, type Options } from './utils/Configuration.js';
import { loadEnvironmentVars } from './utils/env-vars.js';
import { Utils } from './utils/Utils.js';
import { type Logger } from './logging/Logger.js';
import { colors } from './logging/colors.js';
import type { EntityManager } from './EntityManager.js';
import type { AnyEntity, Constructor, EntityClass, EntityMetadata, EntityName, IEntityGenerator, IMigrator, ISeedManager } from './typings.js';

async function registerExtension(name: string, mod: Promise<any>, extensions: Options['extensions']): Promise<void> {
  /* v8 ignore next */
  const resolved = await mod.catch(() => null);
  const module = resolved?.[name];

  /* v8 ignore else */
  if (module) {
    extensions!.push(module);
  }
}

/** @internal */
export async function lookupExtensions(options: Options): Promise<void> {
  const extensions = options.extensions ?? [];
  const exists = (name: string) => extensions.some(ext => (ext as any).name === name);

  if (!exists('SeedManager')) {
    await registerExtension('SeedManager', import('@mikro-orm/seeder'), extensions);
  }

  if (!exists('Migrator')) {
    await registerExtension('Migrator', import('@mikro-orm/migrations'), extensions);
  }

  /* v8 ignore if */
  if (!exists('Migrator')) {
    await registerExtension('Migrator', import('@mikro-orm/migrations-mongodb'), extensions);
  }

  if (!exists('EntityGenerator')) {
    await registerExtension('EntityGenerator', import('@mikro-orm/entity-generator'), extensions);
  }

  options.extensions = extensions;

  const metadataCacheEnabled = options.metadataCache?.enabled || options.metadataProvider?.useCache?.();

  if (metadataCacheEnabled) {
    options.metadataCache ??= {};
    options.metadataCache.adapter ??= await import('@mikro-orm/core/fs-utils').then(m => m.FileCacheAdapter);
  }
}


/**
 * The main class used to configure and bootstrap the ORM.
 *
 * @example
 * ```ts
 * // import from driver package
 * import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';
 *
 * const User = defineEntity({
 *   name: 'User',
 *   properties: {
 *     id: p.integer().primary(),
 *     name: p.string(),
 *   },
 * });
 *
 * const orm = new MikroORM({
 *   entities: [User],
 *   dbName: 'my.db',
 * });
 * await orm.schema.update();
 *
 * const em = orm.em.fork();
 * const u1 = em.create(User, { name: 'John' });
 * const u2 = em.create(User, { name: 'Ben' });
 * await em.flush();
 * ```
 */
export class MikroORM<
  Driver extends IDatabaseDriver = IDatabaseDriver,
  EM extends Driver[typeof EntityManagerType] & EntityManager<Driver> = Driver[typeof EntityManagerType] & EntityManager<Driver>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> {

  /** The global EntityManager instance. If you are using `RequestContext` helper, it will automatically pick the request specific context under the hood */
  em!: EM & { '~entities'?: Entities };
  readonly driver: Driver;
  readonly config: Configuration<Driver>;
  private metadata!: MetadataStorage;
  private readonly logger: Logger;
  private readonly discovery: MetadataDiscovery;

  /**
   * Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
   * If you omit the `options` parameter, your CLI config will be used.
   */
  static async init<
    D extends IDatabaseDriver = IDatabaseDriver,
    EM extends D[typeof EntityManagerType] & EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>,
    Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
  >(options: Options<D, EM, Entities>): Promise<MikroORM<D, EM, Entities>> {
    /* v8 ignore next */
    if (!options) {
      throw new Error(`options parameter is required`);
    }

    options = { ...options };
    options.discovery ??= {};
    options.discovery.skipSyncDiscovery ??= true;
    await lookupExtensions(options);
    const orm = new this<D, EM, Entities>(options);
    const preferTs = orm.config.get('preferTs', Utils.detectTypeScriptSupport());
    orm.metadata = await orm.discovery.discover(preferTs);
    orm.createEntityManager();

    return orm;
  }

  /**
   * Synchronous variant of the `init` method with some limitations:
   * - folder-based discovery not supported
   * - ORM extensions are not autoloaded
   * - when metadata cache is enabled, `FileCacheAdapter` needs to be explicitly set in the config
   */
  constructor(options: Options<Driver, EM, Entities>) {
    const env = loadEnvironmentVars();
    options = Utils.merge(options, env);
    this.config = new Configuration(options);
    const discovery = this.config.get('discovery');
    this.driver = this.config.getDriver();
    this.logger = this.config.getLogger();
    this.logger.log('info', `MikroORM version: ${colors.green(Utils.getORMVersion())}`);
    this.discovery = new MetadataDiscovery(new MetadataStorage(), this.driver.getPlatform(), this.config);
    this.driver.getPlatform().init(this);

    for (const extension of this.config.get('extensions')) {
      extension.register(this);
    }

    if (!discovery.skipSyncDiscovery) {
      this.metadata = this.discovery.discoverSync();
      this.createEntityManager();
    }
  }

  /**
   * Connects to the database.
   */
  async connect(): Promise<Driver> {
    await this.driver.connect();
    return this.driver;
  }

  /**
   * Reconnects, possibly to a different database.
   */
  async reconnect(options: Partial<Options<Driver, EM, Entities>> = {}): Promise<void> {
    /* v8 ignore next */
    for (const key of Utils.keys(options)) {
      this.config.set(key, options[key]!);
    }

    await this.driver.reconnect();
  }

  /**
   * Checks whether the database connection is active.
   */
  async isConnected(): Promise<boolean> {
    return this.driver.getConnection().isConnected();
  }

  /**
   * Checks whether the database connection is active, returns the reason if not.
   */
  async checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }> {
    return this.driver.getConnection().checkConnection();
  }

  /**
   * Closes the database connection.
   */
  async close(force = false): Promise<void> {
    await this.driver.close(force);
    await this.config.getMetadataCacheAdapter()?.close?.();
    await this.config.getResultCacheAdapter()?.close?.();
  }

  /**
   * Gets the `MetadataStorage`.
   */
  getMetadata(): MetadataStorage;

  /**
   * Gets the `EntityMetadata` instance when provided with the `entityName` parameter.
   */
  getMetadata<Entity extends object>(entityName: EntityName<Entity>): EntityMetadata<Entity>;

  /**
   * Gets the `MetadataStorage` (without parameters) or `EntityMetadata` instance when provided with the `entityName` parameter.
   */
  getMetadata<Entity extends object>(entityName?: EntityName<Entity>): EntityMetadata<Entity> | MetadataStorage {
    if (entityName) {
      return this.metadata.get(entityName);
    }

    return this.metadata;
  }

  private createEntityManager(): void {
    this.driver.setMetadata(this.metadata);
    this.em = this.driver.createEntityManager() as EM & { '~entities': Entities };
    (this.em as { global: boolean }).global = true;
    this.metadata.decorate(this.em);
    this.driver.setMetadata(this.metadata);
  }

  /**
   * Allows dynamically discovering new entity by reference, handy for testing schema diffing.
   */
  discoverEntity<T extends Constructor | EntitySchema>(entities: T | T[], reset?: EntityName | EntityName[]): void {
    for (const className of Utils.asArray(reset)) {
      this.metadata.reset(className);
      this.discovery.reset(className);
    }

    const tmp = this.discovery.discoverReferences(Utils.asArray(entities));
    const metadata = this.discovery.processDiscoveredEntities(tmp);

    for (const meta of metadata) {
      this.metadata.set(meta.class, meta);
      meta.root = this.metadata.get(meta.root.class);
    }

    this.metadata.decorate(this.em);
  }

  /**
   * Gets the SchemaGenerator.
   */
  get schema(): ReturnType<ReturnType<Driver['getPlatform']>['getSchemaGenerator']> {
    return this.config.getExtension('@mikro-orm/schema-generator')!;
  }

  /**
   * Gets the SeedManager
   */
  get seeder(): ISeedManager {
    return this.driver.getPlatform().getExtension('SeedManager', '@mikro-orm/seeder', '@mikro-orm/seeder', this.em);
  }

  /**
   * Gets the Migrator.
   */
  get migrator(): IMigrator {
    return this.driver.getPlatform().getExtension('Migrator', '@mikro-orm/migrator', '@mikro-orm/migrations', this.em);
  }

  /**
   * Gets the EntityGenerator.
   */
  get entityGenerator(): IEntityGenerator {
    return this.driver.getPlatform().getExtension('EntityGenerator', '@mikro-orm/entity-generator', '@mikro-orm/entity-generator', this.em);
  }

}
