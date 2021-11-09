import c from 'ansi-colors';

import type { EntityManagerType, IDatabaseDriver } from './drivers';
import { MetadataDiscovery, MetadataStorage, MetadataValidator, ReflectMetadataProvider } from './metadata';
import type { Logger, Options } from './utils';
import { Configuration, ConfigurationLoader, Utils } from './utils';
import { NullCacheAdapter } from './cache';
import type { EntityManager } from './EntityManager';
import type { AnyEntity, Constructor, IEntityGenerator, IMigrator, ISchemaGenerator, ISeedManager } from './typings';

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
    const env = ConfigurationLoader.loadEnvironmentVars<D>(options);

    if (!options) {
      options = await ConfigurationLoader.getConfiguration<D>();
    }

    options = options instanceof Configuration ? options.getAll() : options;
    const orm = new MikroORM<D>(Utils.merge(options, env));

    // we need to allow global context here as we are not in a scope of requests yet
    const allowGlobalContext = orm.config.get('allowGlobalContext');
    orm.config.set('allowGlobalContext', true);
    await orm.discoverEntities();
    orm.config.set('allowGlobalContext', allowGlobalContext);

    if (connect) {
      await orm.connect();

      if (orm.config.get('ensureIndexes')) {
        await orm.driver.ensureIndexes();
      }
    }

    return orm;
  }

  constructor(options: Options<D> | Configuration<D>) {
    if (options instanceof Configuration) {
      this.config = options;
    } else {
      this.config = new Configuration(options);
    }

    if (this.config.get('discovery').disableDynamicFileAccess) {
      this.config.set('metadataProvider', ReflectMetadataProvider);
      this.config.set('cache', { adapter: NullCacheAdapter });
      this.config.set('discovery', { disableDynamicFileAccess: true, requireEntitiesArray: true, alwaysAnalyseProperties: false });
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
      this.logger.log('info', `MikroORM successfully connected to database ${c.green(db)}`);
    } else {
      this.logger.log('info', c.red(`MikroORM failed to connect to database ${db}`));
    }

    return this.driver;
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
   * Gets the MetadataStorage.
   */
  getMetadata(): MetadataStorage {
    return this.metadata;
  }

  async discoverEntities(): Promise<void> {
    this.metadata = await this.discovery.discover(this.config.get('tsNode'));
    this.driver.setMetadata(this.metadata);
    this.em = this.driver.createEntityManager<D>();
    this.metadata.decorate(this.em);
    this.driver.setMetadata(this.metadata);
  }

  /**
   * Allows dynamically discovering new entity by reference, handy for testing schema diffing.
   */
  async discoverEntity<T>(entities: Constructor<T> | Constructor<AnyEntity>[]): Promise<void> {
    entities = Utils.asArray(entities);
    const tmp = await this.discovery.discoverReferences(entities);
    new MetadataValidator().validateDiscovered([...Object.values(this.metadata.getAll()), ...tmp], this.config.get('discovery').warnWhenNoEntities!);
    const metadata = await this.discovery.processDiscoveredEntities(tmp);
    metadata.forEach(meta => this.metadata.set(meta.className, meta));
    this.metadata.decorate(this.em);
  }

  /**
   * Gets the SchemaGenerator.
   */
  getSchemaGenerator<T extends ISchemaGenerator = ISchemaGenerator>(): T {
    return this.driver.getPlatform().getSchemaGenerator(this.em) as T;
  }

  /**
   * Gets the EntityGenerator.
   */
  getEntityGenerator<T extends IEntityGenerator = IEntityGenerator>(): T {
    return this.driver.getPlatform().getEntityGenerator(this.em) as T;
  }

  /**
   * Gets the Migrator.
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    return this.driver.getPlatform().getMigrator(this.em) as T;
  }

  getSeeder<T extends ISeedManager = ISeedManager>(): T {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SeedManager } = require('@mikro-orm/seeder');
    return new SeedManager(this);
  }

}
