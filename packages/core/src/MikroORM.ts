import type { EntityManagerType, IDatabaseDriver } from './drivers/IDatabaseDriver.js';
import { type EntitySchema } from './metadata/EntitySchema.js';
import { MetadataDiscovery } from './metadata/MetadataDiscovery.js';
import { MetadataStorage } from './metadata/MetadataStorage.js';
import { MetadataValidator } from './metadata/MetadataValidator.js';
import { ReflectMetadataProvider } from './metadata/ReflectMetadataProvider.js';
import { Configuration, type Options } from './utils/Configuration.js';
import { ConfigurationLoader } from './utils/ConfigurationLoader.js';
import { Utils } from './utils/Utils.js';
import { type Logger } from './logging/Logger.js';
import { colors } from './logging/colors.js';
import { NullCacheAdapter } from './cache/NullCacheAdapter.js';
import type { EntityManager } from './EntityManager.js';
import type { Constructor, EntityMetadata, EntityName, IEntityGenerator, IMigrator, ISeedManager } from './typings.js';

/**
 * Helper class for bootstrapping the MikroORM.
 */
export class MikroORM<Driver extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager = Driver[typeof EntityManagerType] & EntityManager> {

  /** The global EntityManager instance. If you are using `RequestContext` helper, it will automatically pick the request specific context under the hood */
  em!: EM;
  readonly driver: Driver;
  readonly config: Configuration<Driver>;
  private metadata!: MetadataStorage;
  private readonly logger: Logger;
  private readonly discovery: MetadataDiscovery;

  /**
   * Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
   * If you omit the `options` parameter, your CLI config will be used.
   */
  static async init<D extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    ConfigurationLoader.registerDotenv(options);
    const coreVersion = await ConfigurationLoader.checkPackageVersion();
    const env = await ConfigurationLoader.loadEnvironmentVars<D>();

    if (!options) {
      const configPathFromArg = ConfigurationLoader.configPathsFromArg();
      const config = (await ConfigurationLoader.getConfiguration<D, EM>(process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default', configPathFromArg ?? ConfigurationLoader.getConfigPaths()));
      options = config.getAll();
      if (configPathFromArg) {
        config.getLogger().warn('deprecated', 'Path for config file was inferred from the command line arguments. Instead, you should set the MIKRO_ORM_CLI_CONFIG environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init.', { label: 'D0001' });
      }
    }

    options = Utils.mergeConfig(options, env);
    await ConfigurationLoader.commonJSCompat(options!);

    if ('DRIVER' in this && !options!.driver) {
      (options as Options).driver = (this as unknown as { DRIVER: Constructor<IDatabaseDriver> }).DRIVER;
    }

    const orm = new MikroORM(options!);
    orm.logger.log('info', `MikroORM version: ${colors.green(coreVersion)}`);

    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = orm.config.get('allowGlobalContext');
    orm.config.set('allowGlobalContext', true);
    await orm.discoverEntities();
    orm.config.set('allowGlobalContext', allowGlobalContext);
    orm.driver.getPlatform().init(orm);

    if (orm.config.get('connect')) {
      await orm.connect();
    }

    for (const extension of orm.config.get('extensions')) {
      extension.register(orm);
    }

    if (orm.config.get('connect') && orm.config.get('ensureIndexes')) {
      await orm.getSchemaGenerator().ensureIndexes();
    }

    return orm;
  }

  /**
   * Synchronous variant of the `init` method with some limitations:
   * - database connection will be established when you first interact with the database (or you can use `orm.connect()` explicitly)
   * - no loading of the `config` file, `options` parameter is mandatory
   * - no support for folder based discovery
   * - no check for mismatched package versions
   */
  static initSync<D extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    ConfigurationLoader.registerDotenv(options);
    const env = ConfigurationLoader.loadEnvironmentVarsSync<D>();
    options = Utils.merge(options, env);

    if ('DRIVER' in this && !options!.driver) {
      (options as Options).driver = (this as unknown as { DRIVER: Constructor<IDatabaseDriver> }).DRIVER;
    }

    const orm = new MikroORM(options!);

    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = orm.config.get('allowGlobalContext');
    orm.config.set('allowGlobalContext', true);
    orm.discoverEntitiesSync();
    orm.config.set('allowGlobalContext', allowGlobalContext);
    orm.driver.getPlatform().init(orm);

    for (const extension of orm.config.get('extensions')) {
      extension.register(orm);
    }

    return orm;
  }

  constructor(options: Options<Driver, EM>) {
    this.config = new Configuration(options);
    const discovery = this.config.get('discovery');

    if (discovery.disableDynamicFileAccess) {
      this.config.set('metadataProvider', ReflectMetadataProvider);
      this.config.set('metadataCache', { adapter: NullCacheAdapter });
      discovery.requireEntitiesArray = true;
    }

    this.driver = this.config.getDriver();
    this.logger = this.config.getLogger();
    this.discovery = new MetadataDiscovery(new MetadataStorage(), this.driver.getPlatform(), this.config);
  }

  /**
   * Connects to the database.
   */
  async connect(): Promise<Driver> {
    const connection = await this.driver.connect();
    const clientUrl = connection.getClientUrl();
    const dbName = this.config.get('dbName')!;
    const db = dbName + (clientUrl ? ' on ' + clientUrl : '');

    if (this.config.get('ensureDatabase')) {
      const options = this.config.get('ensureDatabase');
      await this.schema.ensureDatabase(typeof options === 'boolean' ? {} : { ...options, forceCheck: true });
    }

    if (await this.isConnected()) {
      this.logger.log('info', `MikroORM successfully connected to database ${colors.green(db)}`);
    } else {
      this.logger.error('info', `MikroORM failed to connect to database ${db}`);
    }

    return this.driver;
  }

  /**
   * Reconnects, possibly to a different database.
   */
  async reconnect(options: Options = {}): Promise<void> {
    /* v8 ignore next 3 */
    for (const key of Utils.keys(options)) {
      this.config.set(key, options[key]);
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
    if (await this.isConnected()) {
      await this.driver.close(force);
    }

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
    this.metadata = await this.discovery.discover(this.config.get('preferTs'));
    this.createEntityManager();
  }

  discoverEntitiesSync(): void {
    this.metadata = this.discovery.discoverSync(this.config.get('preferTs'));
    this.createEntityManager();
  }

  private createEntityManager(): void {
    this.driver.setMetadata(this.metadata);
    this.em = this.driver.createEntityManager() as EM;
    (this.em as { global: boolean }).global = true;
    this.metadata.decorate(this.em);
    this.driver.setMetadata(this.metadata);
  }

  /**
   * Allows dynamically discovering new entity by reference, handy for testing schema diffing.
   */
  discoverEntity<T extends Constructor | EntitySchema>(entities: T | T[], reset?: string | string[]): void {
    entities = Utils.asArray(entities);

    for (const className of Utils.asArray(reset)) {
      this.metadata.reset(className);
      this.discovery.reset(className);
    }

    const tmp = this.discovery.discoverReferences(entities);
    const options = this.config.get('discovery');
    new MetadataValidator().validateDiscovered([...Object.values(this.metadata.getAll()), ...tmp], options);
    const metadata = this.discovery.processDiscoveredEntities(tmp);
    metadata.forEach(meta => {
      this.metadata.set(meta.className, meta);
      meta.root = this.metadata.get(meta.root.className);
    });
    this.metadata.decorate(this.em);
  }

  /**
   * Gets the SchemaGenerator.
   */
  getSchemaGenerator(): ReturnType<ReturnType<Driver['getPlatform']>['getSchemaGenerator']> {
    const extension = this.config.getExtension<ReturnType<ReturnType<Driver['getPlatform']>['getSchemaGenerator']>>('@mikro-orm/schema-generator');

    if (extension) {
      return extension;
    }

    /* v8 ignore next 2 */
    throw new Error(`SchemaGenerator extension not registered.`);
  }

  /**
   * Gets the EntityGenerator.
   */
  getEntityGenerator<T extends IEntityGenerator = IEntityGenerator>(): T {
    return this.driver.getPlatform().getExtension('EntityGenerator', '@mikro-orm/entity-generator', '@mikro-orm/entity-generator', this.em);
  }

  /**
   * Gets the Migrator.
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    return this.driver.getPlatform().getExtension('Migrator', '@mikro-orm/migrator', '@mikro-orm/migrations', this.em);
  }

  /**
   * Gets the SeedManager
   */
  getSeeder<T extends ISeedManager = ISeedManager>(): T {
    return this.driver.getPlatform().getExtension('SeedManager', '@mikro-orm/seeder', '@mikro-orm/seeder', this.em);
  }

  /**
   * Shortcut for `orm.getSchemaGenerator()`
   */
  get schema() {
    return this.getSchemaGenerator();
  }

  /**
   * Shortcut for `orm.getSeeder()`
   */
  get seeder() {
    return this.getSeeder();
  }

  /**
   * Shortcut for `orm.getMigrator()`
   */
  get migrator() {
    return this.getMigrator();
  }

  /**
   * Shortcut for `orm.getEntityGenerator()`
   */
  get entityGenerator() {
    return this.getEntityGenerator();
  }

}
