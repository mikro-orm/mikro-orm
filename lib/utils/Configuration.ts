import { PoolConfig } from 'knex';
import { fromJson, Theme } from 'cli-highlight';

import { NamingStrategy } from '../naming-strategy';
import { CacheAdapter, FileCacheAdapter, NullCacheAdapter } from '../cache';
import { MetadataProvider, TsMorphMetadataProvider } from '../metadata';
import { EntityFactory, EntityRepository } from '../entity';
import { Dictionary, EntityClass, EntityClassGroup, EntityName, AnyEntity, IPrimaryKey } from '../typings';
import { Hydrator, ObjectHydrator } from '../hydration';
import { Logger, LoggerNamespace, Utils, ValidationError } from '../utils';
import { EntityManager } from '../EntityManager';
import { EntityOptions, EntitySchema, IDatabaseDriver } from '..';
import { Platform } from '../platforms';

export class Configuration<D extends IDatabaseDriver = IDatabaseDriver> {

  static readonly DEFAULTS = {
    type: 'mongo',
    pool: {},
    entities: [],
    entitiesDirs: [],
    entitiesDirsTs: [],
    discovery: {
      warnWhenNoEntities: true,
      requireEntitiesArray: false,
      alwaysAnalyseProperties: true,
      disableDynamicFileAccess: false,
      tsConfigPath: process.cwd() + '/tsconfig.json',
    },
    autoFlush: false,
    strict: false,
    // tslint:disable-next-line:no-console
    logger: console.log.bind(console),
    findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => ValidationError.findOneFailed(entityName, where),
    baseDir: process.cwd(),
    entityRepository: EntityRepository,
    hydrator: ObjectHydrator,
    autoJoinOneToOneOwner: true,
    propagateToOneOwner: true,
    forceUtcTimezone: false,
    ensureIndexes: false,
    tsNode: false,
    debug: false,
    verbose: false,
    driverOptions: {},
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: process.cwd() + '/migrations',
      pattern: /^[\w-]+\d+\.ts$/,
      transactional: true,
      disableForeignKeys: true,
      allOrNothing: true,
      emit: 'ts',
    },
    cache: {
      enabled: true,
      pretty: false,
      adapter: FileCacheAdapter,
      options: { cacheDir: process.cwd() + '/temp' },
    },
    metadataProvider: TsMorphMetadataProvider,
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

  private readonly options: MikroORMOptions<D>;
  private readonly logger: Logger;
  private readonly driver: D;
  private readonly platform: Platform;
  private readonly cache: Dictionary = {};
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

  /**
   * Gets specific configuration option. Falls back to specified `defaultValue` if provided.
   */
  get<T extends keyof MikroORMOptions<D>, U extends MikroORMOptions<D>[T]>(key: T, defaultValue?: U): U {
    return (Utils.isDefined(this.options[key]) ? this.options[key] : defaultValue) as U;
  }

  /**
   * Overrides specified configuration value.
   */
  set<T extends keyof MikroORMOptions<D>, U extends MikroORMOptions<D>[T]>(key: T, value: U): void {
    this.options[key] = value;
  }

  /**
   * Gets Logger instance.
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Gets current client URL (connection string).
   */
  getClientUrl(hidePassword = false): string {
    if (hidePassword) {
      return this.options.clientUrl!.replace(/\/\/([^:]+):(.+)@/, '//$1:*****@');
    }

    return this.options.clientUrl!;
  }

  /**
   * Gets current database driver instance.
   */
  getDriver(): D {
    return this.driver;
  }

  /**
   * Gets instance of NamingStrategy. (cached)
   */
  getNamingStrategy(): NamingStrategy {
    return this.cached(this.options.namingStrategy || this.platform.getNamingStrategy());
  }

  /**
   * Gets instance of Hydrator. Hydrator cannot be cached as it would have reference to wrong (global) EntityFactory.
   */
  getHydrator(factory: EntityFactory, em: EntityManager): Hydrator {
    return new this.options.hydrator(factory, em);
  }

  /**
   * Gets instance of MetadataProvider. (cached)
   */
  getMetadataProvider(): MetadataProvider {
    return this.cached(this.options.metadataProvider, this);
  }

  /**
   * Gets instance of CacheAdapter. (cached)
   */
  getCacheAdapter(): CacheAdapter {
    return this.cached(this.options.cache.adapter!, this.options.cache.options, this.options.baseDir, this.options.cache.pretty);
  }

  /**
   * Gets EntityRepository class to be instantiated.
   */
  getRepositoryClass(customRepository: EntityOptions<AnyEntity>['customRepository']): MikroORMOptions<D>['entityRepository'] {
    if (customRepository) {
      return customRepository();
    }

    return this.options.entityRepository;
  }

  /**
   * Gets highlight there used when logging SQL.
   */
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

    if (!('implicitTransactions' in this.options)) {
      this.set('implicitTransactions', this.platform.usesImplicitTransactions());
    }

    const url = this.getClientUrl().match(/:\/\/.+\/([^?]+)/);

    if (url) {
      this.options.dbName = this.get('dbName', url[1]);
    }

    if (this.options.entitiesDirsTs.length === 0) {
      this.options.entitiesDirsTs = this.options.entitiesDirs;
    }
  }

  private validateOptions(): void {
    if (!this.options.dbName && !this.options.clientUrl) {
      throw new Error('No database specified, please fill in `dbName` or `clientUrl` option');
    }

    if (this.options.entities.length === 0 && this.options.entitiesDirs.length === 0 && this.options.discovery.warnWhenNoEntities) {
      throw new Error('No entities found, please use `entities` or `entitiesDirs` option');
    }

    const notDirectory = this.options.entitiesDirs.find(dir => dir.match(/\.[jt]s$/));

    if (notDirectory) {
      throw new Error(`Please provide path to directory in \`entitiesDirs\`, found: '${notDirectory}'`);
    }
  }

  private initDriver(): D {
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
  dbName?: string;
  name?: string;
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  multipleStatements?: boolean; // for mysql driver
  pool?: PoolConfig;
}

export type MigrationsOptions = {
  tableName?: string;
  path?: string;
  pattern?: RegExp;
  transactional?: boolean;
  disableForeignKeys?: boolean;
  allOrNothing?: boolean;
  emit?: 'js' | 'ts';
};

export interface MikroORMOptions<D extends IDatabaseDriver = IDatabaseDriver> extends ConnectionOptions {
  entities: (EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema<any>)[]; // `any` required here for some TS weirdness
  entitiesDirs: string[];
  entitiesDirsTs: string[];
  discovery: {
    warnWhenNoEntities?: boolean;
    requireEntitiesArray?: boolean;
    alwaysAnalyseProperties?: boolean;
    disableDynamicFileAccess?: boolean;
    tsConfigPath?: string;
  };
  autoFlush: boolean;
  type: keyof typeof Configuration.PLATFORMS;
  driver?: { new (config: Configuration): D };
  driverOptions: Dictionary;
  namingStrategy?: { new (): NamingStrategy };
  implicitTransactions?: boolean;
  autoJoinOneToOneOwner: boolean;
  propagateToOneOwner: boolean;
  forceUtcTimezone: boolean;
  ensureIndexes: boolean;
  hydrator: { new (factory: EntityFactory, em: EntityManager): Hydrator };
  entityRepository: { new (em: EntityManager, entityName: EntityName<AnyEntity>): EntityRepository<AnyEntity> };
  replicas?: Partial<ConnectionOptions>[];
  strict: boolean;
  logger: (message: string) => void;
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  debug: boolean | LoggerNamespace[];
  highlight: boolean;
  highlightTheme?: Dictionary<string | string[]>;
  tsNode: boolean;
  baseDir: string;
  migrations: MigrationsOptions;
  cache: {
    enabled?: boolean;
    pretty?: boolean;
    adapter?: { new (...params: any[]): CacheAdapter };
    options?: Dictionary;
  };
  metadataProvider: { new (config: Configuration): MetadataProvider };
}

export type Options<D extends IDatabaseDriver = IDatabaseDriver> = Pick<MikroORMOptions<D>, Exclude<keyof MikroORMOptions<D>, keyof typeof Configuration.DEFAULTS>> | MikroORMOptions<D>;
