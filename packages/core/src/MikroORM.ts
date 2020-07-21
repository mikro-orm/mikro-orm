import c from 'ansi-colors';

import { EntityManagerType, IDatabaseDriver } from './drivers';
import { MetadataDiscovery, MetadataStorage, ReflectMetadataProvider } from './metadata';
import { Configuration, ConfigurationLoader, Logger, Options, Utils } from './utils';
import { NullCacheAdapter } from './cache';
import { EntityManager } from './EntityManager';
import { IEntityGenerator, IMigrator, ISchemaGenerator } from './typings';

/**
 * Helper class for bootstrapping the MikroORM.
 */
export class MikroORM<D extends IDatabaseDriver = IDatabaseDriver> {

  em!: D[typeof EntityManagerType] & EntityManager;
  readonly config: Configuration<D>;
  private metadata!: MetadataStorage;
  private readonly driver: D;
  private readonly logger: Logger;

  /**
   * Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
   * If you omit the `options` parameter, your CLI config will be used.
   */
  static async init<D extends IDatabaseDriver = IDatabaseDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    if (!options) {
      options = await ConfigurationLoader.getConfiguration<D>();
    }

    const orm = new MikroORM<D>(options!);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), orm.driver.getPlatform(), orm.config);
    orm.metadata = await discovery.discover(orm.config.get('tsNode'));
    orm.driver.setMetadata(orm.metadata);
    orm.em = orm.driver.createEntityManager<D>();
    orm.metadata.decorate(orm.em);
    orm.driver.setMetadata(orm.metadata);

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
    const { EntityGenerator } = Utils.requireFrom('@mikro-orm/entity-generator', this.config.get('baseDir'));
    return new EntityGenerator(this.em);
  }

  /**
   * Gets the Migrator.
   */
  getMigrator<T extends IMigrator = IMigrator>(): T {
    const { Migrator } = Utils.requireFrom('@mikro-orm/migrations', this.config.get('baseDir'));
    return new Migrator(this.em);
  }

}
