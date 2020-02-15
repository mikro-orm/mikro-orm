import chalk from 'chalk';

import { EntityManager } from './EntityManager';
import { AbstractSqlDriver, IDatabaseDriver } from './drivers';
import { MetadataDiscovery, MetadataStorage, ReflectMetadataProvider } from './metadata';
import { Configuration, Logger, Options } from './utils';
import { SchemaGenerator } from './schema';
import { EntityGenerator } from './schema/EntityGenerator';
import { Migrator } from './migrations';
import { NullCacheAdapter } from './cache';
import { CLIHelper } from './cli/CLIHelper';

/**
 * Helper class for bootstrapping the MikroORM.
 */
export class MikroORM<D extends IDatabaseDriver = IDatabaseDriver> {

  em!: EntityManager<D>;
  readonly config: Configuration<D>;
  private metadata!: MetadataStorage;
  private readonly driver: D;
  private readonly logger: Logger;

  /**
   * Initialize the ORM, load entity metadata, create EntityManager and connect to the database.
   * If you omit the `options` parameter, your CLI config will be used.
   */
  static async init<D extends IDatabaseDriver = IDatabaseDriver>(options?: Options<D> | Configuration<D>): Promise<MikroORM<D>> {
    if (!options) {
      options = await CLIHelper.getConfiguration<D>();
    }

    const orm = new MikroORM<D>(options);
    const discovery = new MetadataDiscovery(MetadataStorage.init(), orm.driver.getPlatform(), orm.config);
    orm.metadata = await discovery.discover();
    orm.em = new EntityManager(orm.config, orm.driver, orm.metadata);
    orm.metadata.decorate(orm.em);
    orm.driver.setMetadata(orm.metadata);
    await orm.connect();

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
      this.logger.log('info', `MikroORM successfully connected to database ${chalk.green(db)}`);
    } else {
      this.logger.log('info', chalk.red(`MikroORM failed to connect to database ${db}`));
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
  getSchemaGenerator(): SchemaGenerator {
    const driver = this.driver as object;

    if (!(driver instanceof AbstractSqlDriver)) {
      throw new Error('Not supported by given driver');
    }

    return new SchemaGenerator(driver, this.metadata, this.config);
  }

  /**
   * Gets the EntityGenerator.
   */
  getEntityGenerator(): EntityGenerator {
    const driver = this.driver as object;

    if (!(driver instanceof AbstractSqlDriver)) {
      throw new Error('Not supported by given driver');
    }

    return new EntityGenerator(driver, this.config);
  }

  /**
   * Gets the Migrator.
   */
  getMigrator(): Migrator {
    const driver = this.driver as object;

    if (!(driver instanceof AbstractSqlDriver)) {
      throw new Error('Not supported by given driver');
    }

    return new Migrator(driver, this.getSchemaGenerator(), this.config);
  }

}
