import { EntityManager } from './EntityManager';
import { IDatabaseDriver } from './drivers';
import { MetadataDiscovery } from './metadata';
import { Configuration, Logger, Options } from './utils';
import { EntityMetadata } from './decorators';

export class MikroORM {

  em: EntityManager;
  readonly config: Configuration;
  private metadata: Record<string, EntityMetadata>;
  private readonly driver: IDatabaseDriver;
  private readonly logger: Logger;

  static async init(options: Options): Promise<MikroORM> {
    const orm = new MikroORM(options);
    const driver = await orm.connect();
    orm.em = new EntityManager(orm.config, driver);

    try {
      const storage = new MetadataDiscovery(orm.em, orm.config, orm.logger);
      orm.metadata = await storage.discover();

      return orm;
    } catch (e) {
      await orm.close(true);
      throw e;
    }
  }

  constructor(options: Options | Configuration) {
    if (options instanceof Configuration) {
      this.config = options;
    } else {
      this.config = new Configuration(options);
    }

    this.driver = this.config.getDriver();
    this.logger = this.config.getLogger();
  }

  async connect(): Promise<IDatabaseDriver> {
    const connection = this.driver.getConnection();
    await connection.connect();
    const clientUrl = connection.getClientUrl();
    const dbName = this.config.get('dbName');
    this.logger.info(`MikroORM: successfully connected to database ${dbName}${clientUrl ? ' on ' + clientUrl : ''}`);

    return this.driver;
  }

  async isConnected(): Promise<boolean> {
    return this.driver.getConnection().isConnected();
  }

  async close(force = false): Promise<void> {
    return this.driver.getConnection().close(force);
  }

  getMetadata(): Record<string, EntityMetadata> {
    return this.metadata;
  }

}
