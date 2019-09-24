import { PoolConfig } from 'knex';
import { fromJson, Theme } from 'cli-highlight';

import { NamingStrategy } from '../naming-strategy';
import { CacheAdapter, FileCacheAdapter, NullCacheAdapter } from '../cache';
import { MetadataProvider, TypeScriptMetadataProvider } from '../metadata';
import { EntityFactory, EntityRepository } from '../entity';
import { EntityClass, EntityClassGroup, EntityName, EntityOptions, IEntity, IPrimaryKey } from '../decorators';
import { Hydrator, ObjectHydrator } from '../hydration';
import { Logger, LoggerNamespace, Utils, ValidationError } from '../utils';
import { EntityManager } from '../EntityManager';
import { IDatabaseDriver } from '..';
import { Platform } from '../platforms';

export class Configuration {

  static readonly DEFAULTS = {
    type: 'mongo',
    pool: {},
    entities: [],
    entitiesDirs: [],
    entitiesDirsTs: [],
    warnWhenNoEntities: true,
    tsConfigPath: process.cwd() + '/tsconfig.json',
    autoFlush: false,
    strict: false,
    // tslint:disable-next-line:no-console
    logger: console.log.bind(console),
    findOneOrFailHandler: (entityName: string, where: Record<string, any> | IPrimaryKey) => ValidationError.findOneFailed(entityName, where),
    baseDir: process.cwd(),
    entityRepository: EntityRepository,
    hydrator: ObjectHydrator,
    tsNode: false,
    debug: false,
    verbose: false,
    cache: {
      enabled: true,
      pretty: false,
      adapter: FileCacheAdapter,
      options: { cacheDir: process.cwd() + '/temp' },
    },
    metadataProvider: TypeScriptMetadataProvider,
    highlight: true,
    highlightTheme: {
      keyword: ['white', 'bold'],
      built_in: ['cyan', 'dim'],
      string: ['yellow'],
      literal: 'cyan',
      meta: ['yellow', 'dim'],
    },
  };

  static readonly PLATFORMS = {
    mongo: 'MongoDriver',
    mysql: 'MySqlDriver',
    mariadb: 'MariaDbDriver',
    postgresql: 'PostgreSqlDriver',
    sqlite: 'SqliteDriver',
  };

  private readonly options: MikroORMOptions;
  private readonly logger: Logger;
  private readonly driver: IDatabaseDriver;
  private readonly platform: Platform;
  private readonly cache: Record<string, any> = {};
  private readonly highlightTheme: Theme;

  constructor(options: Options, validate = true) {
    this.options = Utils.merge({}, Configuration.DEFAULTS, options);
    this.options.baseDir = Utils.absolutePath(this.options.baseDir);

    if (validate) {
      this.validateOptions();
    }

    this.logger = new Logger(this.options.logger, this.options.debug);
    this.driver = this.initDriver();
    this.platform = this.driver.getPlatform();
    this.highlightTheme = fromJson(this.options.highlightTheme!);
    this.init();
  }

  get<T extends keyof MikroORMOptions, U extends MikroORMOptions[T]>(key: T, defaultValue?: U): U {
    return (Utils.isDefined(this.options[key]) ? this.options[key] : defaultValue) as U;
  }

  set<T extends keyof MikroORMOptions, U extends MikroORMOptions[T]>(key: T, value: U): void {
    this.options[key] = value;
  }

  getLogger(): Logger {
    return this.logger;
  }

  getClientUrl(hidePassword = false): string {
    if (hidePassword) {
      return this.options.clientUrl!.replace(/\/\/([^:]+):(.+)@/, '//$1:*****@');
    }

    return this.options.clientUrl!;
  }

  getDriver(): IDatabaseDriver {
    return this.driver;
  }

  getNamingStrategy(): NamingStrategy {
    return this.cached(this.options.namingStrategy || this.platform.getNamingStrategy());
  }

  getHydrator(factory: EntityFactory): Hydrator {
    // Hydrator cannot be cached as it would have reference to wrong factory
    return new this.options.hydrator(factory, this.driver);
  }

  getMetadataProvider(): MetadataProvider {
    return this.cached(this.options.metadataProvider, this);
  }

  getCacheAdapter(): CacheAdapter {
    return this.cached(this.options.cache.adapter!, this.options.cache.options, this.options.baseDir, this.options.cache.pretty);
  }

  getRepositoryClass(customRepository: EntityOptions['customRepository']): MikroORMOptions['entityRepository'] {
    if (customRepository) {
      return customRepository();
    }

    return this.options.entityRepository;
  }

  getHighlightTheme(): Theme {
    return this.highlightTheme;
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

    if (this.options.entities.length === 0 && this.options.entitiesDirs.length === 0 && this.options.warnWhenNoEntities) {
      throw new Error('No entities found, please use `entities` or `entitiesDirs` option');
    }

    const notDirectory = this.options.entitiesDirs.find(dir => dir.match(/\.[jt]s$/));

    if (notDirectory) {
      throw new Error(`Please provide path to directory in \`entitiesDirs\`, found: '${notDirectory}'`);
    }
  }

  private initDriver(): IDatabaseDriver {
    if (!this.options.driver) {
      const driver = Configuration.PLATFORMS[this.options.type];
      this.options.driver = require('../drivers/' + driver)[driver];
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

export interface ConnectionOptions {
  name?: string;
  dbName: string;
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  multipleStatements?: boolean; // for mysql driver
  pool: PoolConfig;
}

export interface MikroORMOptions extends ConnectionOptions {
  entities: (EntityClass<IEntity> | EntityClassGroup<IEntity>)[];
  entitiesDirs: string[];
  entitiesDirsTs: string[];
  warnWhenNoEntities: boolean;
  tsConfigPath: string;
  autoFlush: boolean;
  type: keyof typeof Configuration.PLATFORMS;
  driver?: { new (config: Configuration): IDatabaseDriver };
  namingStrategy?: { new (): NamingStrategy };
  hydrator: { new (factory: EntityFactory, driver: IDatabaseDriver): Hydrator };
  entityRepository: { new (em: EntityManager, entityName: EntityName<IEntity>): EntityRepository<IEntity> };
  replicas?: Partial<ConnectionOptions>[];
  strict: boolean;
  logger: (message: string) => void;
  findOneOrFailHandler: (entityName: string, where: Record<string, any> | IPrimaryKey) => Error;
  debug: boolean | LoggerNamespace[];
  highlight: boolean;
  highlightTheme?: Record<string, string | string[]>;
  tsNode: boolean;
  baseDir: string;
  cache: {
    enabled?: boolean;
    pretty?: boolean;
    adapter?: { new (...params: any[]): CacheAdapter };
    options?: Record<string, any>;
  };
  metadataProvider: { new (config: Configuration): MetadataProvider };
}

export type Options = Pick<MikroORMOptions, Exclude<keyof MikroORMOptions, keyof typeof Configuration.DEFAULTS>> | MikroORMOptions;
