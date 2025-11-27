import type { EntityManagerType, IDatabaseDriver } from './drivers/IDatabaseDriver.js';
import { type EntitySchema } from './metadata/EntitySchema.js';
import { MetadataDiscovery } from './metadata/MetadataDiscovery.js';
import { MetadataStorage } from './metadata/MetadataStorage.js';
import { ReflectMetadataProvider } from './metadata/ReflectMetadataProvider.js';
import { Configuration, type Options } from './utils/Configuration.js';
import { ConfigurationLoader } from './utils/ConfigurationLoader.js';
import { Utils } from './utils/Utils.js';
import { type Logger } from './logging/Logger.js';
import { colors } from './logging/colors.js';
import { NullCacheAdapter } from './cache/NullCacheAdapter.js';
import type { EntityManager } from './EntityManager.js';
import type { AnyEntity, Constructor, EntityClass, EntityMetadata, EntityName, IEntityGenerator, IMigrator, ISeedManager } from './typings.js';

/**
 * Helper class for bootstrapping the MikroORM.
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
    /* v8 ignore next 3 */
    if (!options) {
      throw new Error(`options parameter is required`);
    }

    options.discovery ??= {};
    options.discovery.skipSyncDiscovery ??= true;
    const orm = new this<D, EM, Entities>(options);
    await orm.discoverEntities();

    return orm;
  }

  /**
   * Synchronous variant of the `init` method with some limitations:
   * - database connection will be established when you first interact with the database (or you can use `orm.connect()` explicitly)
   * - no loading of the `config` file, `options` parameter is mandatory
   * - no support for folder based discovery
   */
  constructor(options: Options<Driver, EM, Entities>) {
    const env = ConfigurationLoader.loadEnvironmentVarsSync<Driver>();
    const coreVersion = ConfigurationLoader.checkPackageVersion();
    options = Utils.merge(options, env);
    this.config = new Configuration(options);
    const discovery = this.config.get('discovery');

    if (discovery.disableDynamicFileAccess) {
      this.config.set('metadataProvider', ReflectMetadataProvider);
      this.config.set('metadataCache', { adapter: NullCacheAdapter });
      discovery.requireEntitiesArray = true;
    }

    this.driver = this.config.getDriver();
    this.logger = this.config.getLogger();
    this.logger.log('info', `MikroORM version: ${colors.green(coreVersion)}`);
    this.discovery = new MetadataDiscovery(new MetadataStorage(), this.driver.getPlatform(), this.config);
    this.driver.getPlatform().init(this);

    for (const extension of this.config.get('extensions')) {
      extension.register(this);
    }

    if (!discovery.skipSyncDiscovery) {
      this.discoverEntitiesSync();
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
    /* v8 ignore next 3 */
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
   * Checks whether the database connection is active, returns .
   */
  async checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }> {
    return this.driver.getConnection().checkConnection();
  }

  /**
   * Closes the database connection.
   */
  async close(force = false): Promise<void> {
    await this.driver.close(force);

    if (this.config.getMetadataCacheAdapter()?.close) {
      await this.config.getMetadataCacheAdapter().close!();
    }

    if (this.config.getResultCacheAdapter()?.close) {
      await this.config.getResultCacheAdapter().close!();
    }

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
      entityName = Utils.className(entityName);
      return this.metadata.get(entityName);
    }

    return this.metadata;
  }

  async discoverEntities(): Promise<void> {
    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = this.config.get('allowGlobalContext');
    this.config.set('allowGlobalContext', true);
    const preferTs = this.config.get('preferTs', Utils.detectTypeScriptSupport());
    this.metadata = await this.discovery.discover(preferTs);
    this.createEntityManager();
    this.config.set('allowGlobalContext', allowGlobalContext);
  }

  discoverEntitiesSync(): void {
    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = this.config.get('allowGlobalContext');
    this.config.set('allowGlobalContext', true);
    this.metadata = this.discovery.discoverSync();
    this.createEntityManager();
    this.config.set('allowGlobalContext', allowGlobalContext);
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
  discoverEntity<T extends Constructor | EntitySchema>(entities: T | T[], reset?: string | string[]): void {
    for (const className of Utils.asArray(reset)) {
      this.metadata.reset(className);
      this.discovery.reset(className);
    }

    const tmp = this.discovery.discoverReferences(Utils.asArray(entities));
    const metadata = this.discovery.processDiscoveredEntities(tmp);

    for (const meta of metadata) {
      this.metadata.set(meta.className, meta);
      meta.root = this.metadata.get(meta.root.className);
    }

    this.metadata.decorate(this.em);
  }

  /**
   * Gets the SchemaGenerator.
   * @deprecated use `orm.schema` instead
   */
  getSchemaGenerator(): ReturnType<ReturnType<Driver['getPlatform']>['getSchemaGenerator']> {
    return this.schema;
  }

  /**
   * Gets the EntityGenerator.
   * @deprecated use `orm.entityGenerator` instead
   */
  getEntityGenerator<T extends IEntityGenerator = IEntityGenerator>(): T {
    return this.entityGenerator as T;
  }

  /**
   * Gets the Migrator.
   * @deprecated use `orm.migrator` instead
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    return this.migrator as T;
  }

  /**
   * Gets the SeedManager
   * @deprecated use `orm.seeder` instead
   */
  getSeeder<T extends ISeedManager = ISeedManager>(): T {
    return this.seeder as T;
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
