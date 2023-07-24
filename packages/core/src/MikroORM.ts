import type { EntityManagerType, IDatabaseDriver } from './drivers';
import { MetadataDiscovery, MetadataStorage, MetadataValidator, ReflectMetadataProvider } from './metadata';
import type { Options } from './utils';
import type { Logger } from './logging';
import { Configuration, ConfigurationLoader, Utils } from './utils';
import { NullCacheAdapter } from './cache';
import type { EntityManager } from './EntityManager';
import type { Constructor, EntityMetadata, EntityName, IEntityGenerator, IMigrator, ISeedManager } from './typings';
import { colors } from './logging';

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
  static async init<D extends IDatabaseDriver = IDatabaseDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    ConfigurationLoader.registerDotenv(options);
    const coreVersion = await ConfigurationLoader.checkPackageVersion();
    const env = ConfigurationLoader.loadEnvironmentVars<D>();

    if (!options) {
      options = await ConfigurationLoader.getConfiguration<D>();
    }

    let opts = options instanceof Configuration ? options.getAll() : options;
    opts = Utils.mergeConfig(opts, env);
    await ConfigurationLoader.commonJSCompat(opts as object);

    if ('DRIVER' in this && !opts.driver && !opts.type) {
      (opts as Options).driver = (this as unknown as { DRIVER: Constructor<IDatabaseDriver> }).DRIVER;
    }

    const orm = new MikroORM(opts);
    orm.logger.log('info', `MikroORM version: ${colors.green(coreVersion)}`);

    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = orm.config.get('allowGlobalContext');
    orm.config.set('allowGlobalContext', true);
    await orm.discoverEntities();
    orm.config.set('allowGlobalContext', allowGlobalContext);
    orm.driver.getPlatform().lookupExtensions(orm);

    connect &&= orm.config.get('connect');

    if (connect) {
      await orm.connect();
    }

    for (const extension of orm.config.get('extensions')) {
      extension.register(orm);
    }

    if (connect && orm.config.get('ensureIndexes')) {
      await orm.getSchemaGenerator().ensureIndexes();
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
      this.config.set('cache', { adapter: NullCacheAdapter });
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

      await this.driver.init();
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
    for (const key of Object.keys(options)) {
      this.config.set(key as keyof Options, options[key]);
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
   * Closes the database connection.
   */
  async close(force = false): Promise<void> {
    return this.driver.close(force);
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
    this.driver.setMetadata(this.metadata);
    this.em = this.driver.createEntityManager<D>();
    (this.em as { global: boolean }).global = true;
    this.metadata.decorate(this.em);
    this.driver.setMetadata(this.metadata);
  }

  /**
   * Allows dynamically discovering new entity by reference, handy for testing schema diffing.
   */
  async discoverEntity(entities: Constructor | Constructor[]): Promise<void> {
    entities = Utils.asArray(entities);
    const tmp = await this.discovery.discoverReferences(entities);
    const options = this.config.get('discovery');
    new MetadataValidator().validateDiscovered([...Object.values(this.metadata.getAll()), ...tmp], options.warnWhenNoEntities, options.checkDuplicateTableNames);
    const metadata = await this.discovery.processDiscoveredEntities(tmp);
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

    // TODO remove in v6 (https://github.com/mikro-orm/mikro-orm/issues/3743)
    /* istanbul ignore next */
    return this.driver.getPlatform().getSchemaGenerator(this.driver, this.em) as any;
  }

  /**
   * Gets the EntityGenerator.
   */
  getEntityGenerator<T extends IEntityGenerator = IEntityGenerator>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/entity-generator');

    if (extension) {
      return extension;
    }

    // TODO remove in v6 (https://github.com/mikro-orm/mikro-orm/issues/3743)
    return this.driver.getPlatform().getEntityGenerator(this.em) as T;
  }

  /**
   * Gets the Migrator.
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/migrator');

    if (extension) {
      return extension;
    }

    // TODO remove in v6 (https://github.com/mikro-orm/mikro-orm/issues/3743)
    return this.driver.getPlatform().getMigrator(this.em) as T;
  }

  /**
   * Gets the SeedManager
   */
  getSeeder<T extends ISeedManager = ISeedManager>(): T {
    const extension = this.config.getExtension<T>('@mikro-orm/seeder');

    if (extension) {
      return extension;
    }

    // TODO remove in v6 (https://github.com/mikro-orm/mikro-orm/issues/3743)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SeedManager } = require('@mikro-orm/seeder');
    return this.config.getCachedService(SeedManager, this.em);
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
