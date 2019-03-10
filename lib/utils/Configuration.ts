import { NamingStrategy } from '../naming-strategy';
import { CacheAdapter, FileCacheAdapter, NullCacheAdapter } from '../cache';
import { TypeScriptMetadataProvider } from '../metadata';
import { EntityRepository } from '../entity';
import { MetadataProvider } from '../metadata';
import { EntityClass, EntityName, EntityOptions, IEntity } from '../decorators';
import { Hydrator, ObjectHydrator } from '../hydration';
import { EntityFactory } from '../entity';
import { Logger } from './Logger';
import { Utils } from './Utils';
import { EntityManager } from '../EntityManager';
import { IDatabaseDriver } from '..';

export class Configuration {

  static readonly DEFAULTS = {
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

  private readonly options: MikroORMOptions;
  private readonly logger: Logger;
  private readonly driver: IDatabaseDriver;
  private readonly cache: Record<string, any> = {};

  constructor(options: Options, validate = true) {
    this.options = Utils.merge({}, Configuration.DEFAULTS, options);

    if (validate) {
      this.validateOptions();
    }

    this.logger = new Logger(this.options.logger, this.options.debug);
    this.driver = this.initDriver();
    this.init();
  }

  get<T extends keyof MikroORMOptions, U>(key: T, defaultValue?: U): MikroORMOptions[T] {
    return (this.options[key] || defaultValue) as MikroORMOptions[T];
  }

  getLogger(): Logger {
    return this.logger;
  }

  getClientUrl(hidePassword = false): string {
    if (hidePassword) {
      return this.options.clientUrl!.replace(/\/\/([^:]+):(\w+)@/, '//$1:*****@');
    }

    return this.options.clientUrl!;
  }

  getDriver(): IDatabaseDriver {
    return this.driver;
  }

  getNamingStrategy(): NamingStrategy {
    return this.cached(this.options.namingStrategy || this.driver.getConfig().namingStrategy);
  }

  getHydrator(factory: EntityFactory): Hydrator {
    return this.cached(this.options.hydrator, factory, this.driver);
  }

  getMetadataProvider(): MetadataProvider {
    return this.cached(this.options.metadataProvider, this);
  }

  getCacheAdapter(): CacheAdapter {
    return this.cached(this.options.cache.adapter, this.options.cache.options);
  }

  getRepositoryClass(customRepository: EntityOptions['customRepository']): MikroORMOptions['entityRepository'] {
    if (customRepository) {
      return customRepository();
    } else {
      return this.options.entityRepository;
    }
  }

  private init(): void {
    if (!this.options.cache.enabled) {
      this.options.cache.adapter = NullCacheAdapter;
    }

    if (!this.options.clientUrl) {
      this.options.clientUrl = this.driver.getConnection().getDefaultClientUrl();
    }

    if (this.options.entitiesDirsTs.length === 0) {
      this.options.entitiesDirsTs = this.options.entitiesDirs;
    }
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
      this.options.driver = require('../drivers/MongoDriver').MongoDriver;
    }

    return new this.options.driver!(this);
  }

  private cached<T extends { new(...args: any[]): InstanceType<T> }>(cls: T, ...args: ConstructorParameters<T>): InstanceType<T> {
    if (!this.cache[cls.name]) {
      const Class = cls as { new(...args: any[]): T };
      this.cache[cls.name] = new Class(...args);
    }

    return this.cache[cls.name];
  }

}

export interface MikroORMOptions {
  dbName: string;
  entities: EntityClass<IEntity>[];
  entitiesDirs: string[];
  entitiesDirsTs: string[];
  tsConfigPath: string;
  autoFlush: boolean;
  driver?: { new (config: Configuration): IDatabaseDriver };
  namingStrategy?: { new (): NamingStrategy };
  hydrator: { new (factory: EntityFactory, driver: IDatabaseDriver): Hydrator };
  entityRepository: { new (em: EntityManager, entityName: EntityName<IEntity>): EntityRepository<IEntity> };
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
  metadataProvider: { new (config: Configuration): MetadataProvider },
}

export type Options = Pick<MikroORMOptions, Exclude<keyof MikroORMOptions, keyof typeof Configuration.DEFAULTS>> | MikroORMOptions;
