import type { EntityManagerType, IDatabaseDriver } from './drivers';
import { MetadataDiscovery, MetadataStorage, MetadataValidator, ReflectMetadataProvider } from './metadata';
import { Configuration, ConfigurationLoader, Utils, type Options } from './utils';
import { colors, type Logger } from './logging';
import { NullCacheAdapter } from './cache';
import type { EntityManager } from './EntityManager';
import type { Constructor, EntityMetadata, EntityName, IEntityGenerator, IMigrator, ISeedManager } from './typings';

/**
 * Helper class for bootstrapping the MikroORM.
 */
export class MikroORM<D extends IDatabaseDriver = IDatabaseDriver> {

  /** The global EntityManager instance. If you are using `RequestContext` helper, it will automatically pick the request specific context under the hood */
  em!: D[typeof EntityManagerType] & EntityManager;
  readonly config: Configuration<D>;
  private metadata!: MetadataStorage;
  private readonly driver: D;
  private readonly logger: Logger;
  private readonly discovery: MetadataDiscovery;

  /**
   * Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
   * If you omit the `options` parameter, your CLI config will be used.
   */
  static async init<D extends IDatabaseDriver = IDatabaseDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    ConfigurationLoader.registerDotenv(options);
    const coreVersion = await ConfigurationLoader.checkPackageVersion();
    const env = ConfigurationLoader.loadEnvironmentVars<D>();

    if (!options) {
      options = (await ConfigurationLoader.getConfiguration<D>()).getAll();
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
    orm.driver.getPlatform().lookupExtensions(orm);

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
  static initSync<D extends IDatabaseDriver = IDatabaseDriver>(options: Options<D>): MikroORM<D> {
    ConfigurationLoader.registerDotenv(options);
    const env = ConfigurationLoader.loadEnvironmentVars<D>();
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
    orm.driver.getPlatform().lookupExtensions(orm);

    for (const extension of orm.config.get('extensions')) {
      extension.register(orm);
    }

    return orm;
  }

  constructor(options: Options<D> | Configuration<D>) {
    if (options instanceof Configuration) {
      this.config = options;
    } else {
      this.config = new Configuration(options);
    }

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
  async connect(): Promise<D> {
    const connection = await this.driver.connect();
    const clientUrl = connection.getClientUrl();
    const dbName = this.config.get('dbName')!;
    const db = dbName + (clientUrl ? ' on ' + clientUrl : '');

    if (await this.isConnected()) {
      this.logger.log('info', `MikroORM successfully connected to database ${colors.green(db)}`);

      if (this.config.get('ensureDatabase')) {
        await this.schema.ensureDatabase();
      }
    } else {
      this.logger.error('info', `MikroORM failed to connect to database ${db}`);
    }

    return this.driver;
  }

  /**
   * Reconnects, possibly to a different database.
   */
  async reconnect(options: Options = {}): Promise<void> {
    /* istanbul ignore next */
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
  async checkConnection(): Promise<{ ok: boolean; reason?: string; error?: Error }> {
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
    this.metadata = await this.discovery.discover(this.config.get('tsNode'));
    this.createEntityManager();
  }

  discoverEntitiesSync(): void {
    this.metadata = this.discovery.discoverSync(this.config.get('tsNode'));
    this.createEntityManager();
  }

  private createEntityManager(): void {
    this.driver.setMetadata(this.metadata);
    this.em = this.driver.createEntityManager<D>();
    (this.em as { global: boolean }).global = true;
    this.metadata.decorate(this.em);
    this.driver.setMetadata(this.metadata);
  }

  /**
   * Allows dynamically discovering new entity by reference, handy for testing schema diffing.
   */
  discoverEntity(entities: Constructor | Constructor[]): void {
    entities = Utils.asArray(entities);
    const tmp = this.discovery.discoverReferences(entities);
    const options = this.config.get('discovery');
    new MetadataValidator().validateDiscovered([...Object.values(this.metadata.getAll()), ...tmp], options);
    const metadata = this.discovery.processDiscoveredEntities(tmp);
    metadata.forEach(meta => this.metadata.set(meta.className, meta));
    this.metadata.decorate(this.em);
  }

  /**
   * Gets the SchemaGenerator.
   */
  getSchemaGenerator(): ReturnType<ReturnType<D['getPlatform']>['getSchemaGenerator']> {
    const extension = this.config.getExtension<ReturnType<ReturnType<D['getPlatform']>['getSchemaGenerator']>>('@mikro-orm/schema-generator');

    if (extension) {
      return extension;
    }

    /* istanbul ignore next */
    throw new Error(`SchemaGenerator extension not registered.`);
  }

  /**
   * Gets the EntityGenerator.
   */
  getEntityGenerator<T extends IEntityGenerator = IEntityGenerator>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/entity-generator');

    if (extension) {
      return extension;
    }

    throw new Error(`EntityGenerator extension not registered.`);
  }

  /**
   * Gets the Migrator.
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/migrator');

    if (extension) {
      return extension;
    }

    /* istanbul ignore next */
    throw new Error(`Migrator extension not registered.`);
  }

  /**
   * Gets the SeedManager
   */
  getSeeder<T extends ISeedManager = ISeedManager>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/seeder');

    if (extension) {
      return extension;
    }

    /* istanbul ignore next */
    throw new Error(`SeedManager extension not registered.`);
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
