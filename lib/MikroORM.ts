import { EntityManager } from './EntityManager';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';
import { NamingStrategy } from './naming-strategy/NamingStrategy';
import { MetadataStorage } from './metadata/MetadataStorage';
import { FileCacheAdapter } from './cache/FileCacheAdapter';
import { CacheAdapter } from './cache/CacheAdapter';
import { Logger } from './utils/Logger';
import { Utils } from './utils/Utils';
import { TypeScriptMetadataProvider } from './metadata/TypeScriptMetadataProvider';
import { MetadataProvider } from './metadata/MetadataProvider';
import { EntityRepository } from './entity/EntityRepository';
import { EntityClass, IEntity } from './decorators/Entity';
import { NullCacheAdapter } from './cache/NullCacheAdapter';
import { Hydrator } from './hydration/Hydrator';
import { ObjectHydrator } from './hydration/ObjectHydrator';
import { EntityFactory } from './entity/EntityFactory';
import { MetadataDiscovery } from './metadata/MetadataDiscovery';

const defaultOptions = {
  entities: [],
  entitiesDirs: [],
  entitiesDirsTs: [],
  tsConfigPath: process.cwd() + '/tsconfig.json',
  autoFlush: true,
  strict: false,
  logger: () => undefined,
  baseDir: process.cwd(),
  entityRepository: EntityRepository,
  hydrator: ObjectHydrator,
  debug: false,
  cache: {
    enabled: true,
    adapter: FileCacheAdapter,
    options: { cacheDir: process.cwd() + '/temp' },
  },
  metadataProvider: TypeScriptMetadataProvider,
};

export class MikroORM {

  em: EntityManager;
  readonly options: MikroORMOptions;
  private readonly driver: IDatabaseDriver;
  private readonly logger: Logger;

  static async init(options: Options): Promise<MikroORM> {
    const orm = new MikroORM(options);
    const driver = await orm.connect();
    orm.em = new EntityManager(orm.options, driver);

    try {
      const storage = new MetadataDiscovery(orm.em, orm.options, orm.logger);
      await storage.discover();

      return orm;
    } catch (e) {
      await orm.close(true);
      throw e;
    }
  }

  constructor(options: Options) {
    this.options = Utils.merge({}, defaultOptions, options);
    this.validateOptions();
    this.logger = new Logger(this.options);
    this.driver = this.initDriver();

    if (!this.options.cache.enabled) {
      this.options.cache.adapter = NullCacheAdapter;
    }

    if (!this.options.clientUrl) {
      this.options.clientUrl = this.driver.getConnection().getDefaultClientUrl();
    }
  }

  async connect(): Promise<IDatabaseDriver> {
    await this.driver.getConnection().connect();
    const clientUrl = this.options.clientUrl!.replace(/\/\/([^:]+):(\w+)@/, '//$1:*****@');
    this.logger.info(`MikroORM: successfully connected to database ${this.options.dbName}${clientUrl ? ' on ' + clientUrl : ''}`);

    return this.driver;
  }

  async isConnected(): Promise<boolean> {
    return this.driver.getConnection().isConnected();
  }

  async close(force = false): Promise<void> {
    return this.driver.getConnection().close(force);
  }

  private validateOptions(): void {
    if (!this.options.dbName) {
      throw new Error('No database specified, please fill in `dbName` option');
    }

    if (this.options.entities.length === 0 && this.options.entitiesDirs.length === 0) {
      throw new Error('No entities found, please use `entities` or `entitiesDirs` option');
    }
  }

  private initDriver(): IDatabaseDriver {
    if (!this.options.driver) {
      this.options.driver = require('./drivers/MongoDriver').MongoDriver;
    }

    return new this.options.driver!(this.options, this.logger);
  }

}

export interface MikroORMOptions {
  dbName: string;
  entities: EntityClass<IEntity>[];
  entitiesDirs: string[];
  entitiesDirsTs: string[];
  tsConfigPath: string;
  autoFlush: boolean;
  driver?: { new (options: MikroORMOptions, logger: Logger): IDatabaseDriver };
  namingStrategy?: { new (): NamingStrategy };
  hydrator: { new (factory: EntityFactory, driver: IDatabaseDriver): Hydrator };
  entityRepository: { new (em: EntityManager, entityName: string | EntityClass<IEntity>): EntityRepository<IEntity> };
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  multipleStatements?: boolean; // for mysql driver
  strict: boolean;
  logger: (message: string) => void;
  debug: boolean;
  baseDir: string;
  cache: {
    enabled: boolean,
    adapter: { new (...params: any[]): CacheAdapter },
    options: Record<string, any>,
  },
  metadataProvider: { new (options: MikroORMOptions): MetadataProvider },
}

export type Options = Pick<MikroORMOptions, Exclude<keyof MikroORMOptions, keyof typeof defaultOptions>> | MikroORMOptions;
