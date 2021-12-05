import { inspect } from 'util';

import type { NamingStrategy } from '../naming-strategy';
import type { CacheAdapter } from '../cache';
import { FileCacheAdapter, NullCacheAdapter } from '../cache';
import type { EntityRepository } from '../entity';
import type {
  AnyEntity,
  Constructor,
  Dictionary,
  EntityClass,
  EntityClassGroup,
  FilterDef,
  Highlighter,
  HydratorConstructor,
  IHydrator,
  IMigrationGenerator,
  IPrimaryKey,
  MaybePromise,
  MigrationObject,
} from '../typings';
import { ObjectHydrator } from '../hydration';
import { NullHighlighter } from '../utils/NullHighlighter';
import type { Logger, LoggerNamespace, LoggerOptions } from '../logging';
import { DefaultLogger, colors } from '../logging';
import { Utils } from '../utils/Utils';
import type { EntityManager } from '../EntityManager';
import type { Platform } from '../platforms';
import type { EntitySchema } from '../metadata/EntitySchema';
import type { MetadataProvider } from '../metadata/MetadataProvider';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { ReflectMetadataProvider } from '../metadata/ReflectMetadataProvider';
import type { EventSubscriber } from '../events';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver';
import { NotFoundError } from '../errors';
import { RequestContext } from './RequestContext';
import { FlushMode, LoadStrategy } from '../enums';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter';

export class Configuration<D extends IDatabaseDriver = IDatabaseDriver> {

  static readonly DEFAULTS = {
    pool: {},
    entities: [],
    entitiesTs: [],
    subscribers: [],
    filters: {},
    discovery: {
      warnWhenNoEntities: true,
      requireEntitiesArray: false,
      alwaysAnalyseProperties: true,
      disableDynamicFileAccess: false,
    },
    strict: false,
    validate: false,
    context: (name: string) => RequestContext.getEntityManager(name),
    contextName: 'default',
    allowGlobalContext: false,
    // eslint-disable-next-line no-console
    logger: console.log.bind(console),
    findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => NotFoundError.findOneFailed(entityName, where),
    baseDir: process.cwd(),
    hydrator: ObjectHydrator,
    flushMode: FlushMode.AUTO,
    loadStrategy: LoadStrategy.SELECT_IN,
    autoJoinOneToOneOwner: true,
    propagateToOneOwner: true,
    populateAfterFlush: false,
    forceEntityConstructor: false,
    forceUndefined: false,
    forceUtcTimezone: false,
    ensureIndexes: false,
    batchSize: 300,
    debug: false,
    verbose: false,
    driverOptions: {},
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: './migrations',
      pattern: /^[\w-]+\d+\.[jt]s$/,
      transactional: true,
      disableForeignKeys: true,
      allOrNothing: true,
      dropTables: true,
      safe: false,
      snapshot: true,
      emit: 'ts',
      fileName: (timestamp: string) => `Migration${timestamp}`,
    },
    cache: {
      pretty: false,
      adapter: FileCacheAdapter,
      options: { cacheDir: process.cwd() + '/temp' },
    },
    resultCache: {
      adapter: MemoryCacheAdapter,
      expiration: 1000, // 1s
      options: {},
    },
    metadataProvider: ReflectMetadataProvider,
    highlighter: new NullHighlighter(),
    seeder: { path: './database/seeder', defaultSeeder: 'DatabaseSeeder' },
  };

  static readonly PLATFORMS = {
    mongo: { className: 'MongoDriver', module: () => require('@mikro-orm/mongodb') },
    mysql: { className: 'MySqlDriver', module: () => require('@mikro-orm/mysql') },
    mariadb: { className: 'MariaDbDriver', module: () => require('@mikro-orm/mariadb') },
    postgresql: { className: 'PostgreSqlDriver', module: () => require('@mikro-orm/postgresql') },
    sqlite: { className: 'SqliteDriver', module: () => require('@mikro-orm/sqlite') },
  };

  private readonly options: MikroORMOptions<D>;
  private readonly logger: Logger;
  private readonly driver: D;
  private readonly platform: Platform;
  private readonly cache: Dictionary = {};

  constructor(options: Options, validate = true) {
    this.options = Utils.merge({}, Configuration.DEFAULTS, options);
    this.options.baseDir = Utils.absolutePath(this.options.baseDir);

    if (validate) {
      this.validateOptions();
    }

    this.options.loggerFactory ??= (options: LoggerOptions) => new DefaultLogger(options);
    this.logger = this.options.loggerFactory({
      debugMode: this.options.debug,
      usesReplicas: (this.options.replicas?.length ?? 0) > 0,
      highlighter: this.options.highlighter,
      writer: this.options.logger,
    });
    this.driver = this.initDriver();
    this.platform = this.driver.getPlatform();
    this.platform.setConfig(this);
    this.init();
  }

  /**
   * Gets specific configuration option. Falls back to specified `defaultValue` if provided.
   */
  get<T extends keyof MikroORMOptions<D>, U extends MikroORMOptions<D>[T]>(key: T, defaultValue?: U): U {
    return (Utils.isDefined(this.options[key]) ? this.options[key] : defaultValue) as U;
  }

  getAll(): MikroORMOptions<D> {
    return this.options;
  }

  /**
   * Overrides specified configuration value.
   */
  set<T extends keyof MikroORMOptions<D>, U extends MikroORMOptions<D>[T]>(key: T, value: U): void {
    this.options[key] = value;
  }

  /**
   * Resets the configuration to its default value
   */
  reset<T extends keyof MikroORMOptions<D>, U extends MikroORMOptions<D>[T]>(key: T): void {
    this.options[key] = Configuration.DEFAULTS[key as string];
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
   * Gets instance of Hydrator.
   */
  getHydrator(metadata: MetadataStorage): IHydrator {
    return this.cached(this.options.hydrator, metadata, this.platform, this);
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
   * Gets instance of CacheAdapter for result cache. (cached)
   */
  getResultCacheAdapter(): CacheAdapter {
    return this.cached(this.options.resultCache.adapter!, { expiration: this.options.resultCache.expiration, ...this.options.resultCache.options });
  }

  /**
   * Gets EntityRepository class to be instantiated.
   */
  getRepositoryClass(customRepository: () => Constructor<EntityRepository<AnyEntity>>): MikroORMOptions<D>['entityRepository'] {
    if (customRepository) {
      return customRepository();
    }

    if (this.options.entityRepository) {
      return this.options.entityRepository;
    }

    return this.platform.getRepositoryClass();
  }

  private init(): void {
    if (!this.getMetadataProvider().useCache()) {
      this.options.cache.adapter = NullCacheAdapter;
    }

    if (!('enabled' in this.options.cache)) {
      this.options.cache.enabled = this.getMetadataProvider().useCache();
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

    if (!this.options.charset) {
      this.options.charset = this.platform.getDefaultCharset();
    }

    Object.keys(this.options.filters).forEach(key => {
      this.options.filters[key].default ??= true;
    });

    const subscribers = Object.values(MetadataStorage.getSubscriberMetadata());
    this.options.subscribers = [...new Set([...this.options.subscribers, ...subscribers])];

    if (!colors.enabled()) {
      this.options.highlighter = new NullHighlighter();
    }
  }

  private validateOptions(): void {
    if (!this.options.type && !this.options.driver) {
      throw new Error('No platform type specified, please fill in `type` or provide custom driver class in `driver` option. Available platforms types: ' + inspect(Object.keys(Configuration.PLATFORMS)));
    }

    if (this.options.type && !(this.options.type in Configuration.PLATFORMS)) {
      throw new Error(`Invalid platform type specified: '${this.options.type}', please fill in valid \`type\` or provide custom driver class in \`driver\` option. Available platforms types: ${inspect(Object.keys(Configuration.PLATFORMS))}`);
    }

    if (!this.options.dbName && !this.options.clientUrl) {
      throw new Error('No database specified, please fill in `dbName` or `clientUrl` option');
    }

    if (this.options.entities.length === 0 && this.options.discovery.warnWhenNoEntities) {
      throw new Error('No entities found, please use `entities` option');
    }
  }

  private initDriver(): D {
    if (!this.options.driver) {
      const { className, module } = Configuration.PLATFORMS[this.options.type!];
      this.options.driver = module()[className];
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

export interface DynamicPassword {
  password: string;
  expirationChecker?: () => boolean;
}

export interface ConnectionOptions {
  dbName?: string;
  schema?: string;
  name?: string;
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string | (() => MaybePromise<string> | MaybePromise<DynamicPassword>);
  charset?: string;
  collate?: string;
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
  dropTables?: boolean;
  safe?: boolean;
  snapshot?: boolean;
  emit?: 'js' | 'ts';
  generator?: Constructor<IMigrationGenerator>;
  fileName?: (timestamp: string) => string;
  migrationsList?: MigrationObject[];
};

export interface PoolConfig {
  name?: string;
  afterCreate?: (...a: unknown[]) => unknown;
  min?: number;
  max?: number;
  refreshIdle?: boolean;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  returnToHead?: boolean;
  priorityRange?: number;
  log?: (message: string, logLevel: string) => void;

  // generic-pool v3 configs
  maxWaitingClients?: number;
  testOnBorrow?: boolean;
  acquireTimeoutMillis?: number;
  fifo?: boolean;
  autostart?: boolean;
  evictionRunIntervalMillis?: number;
  numTestsPerRun?: number;
  softIdleTimeoutMillis?: number;
  Promise?: any;
}

export interface MikroORMOptions<D extends IDatabaseDriver = IDatabaseDriver> extends ConnectionOptions {
  entities: (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema<any>)[]; // `any` required here for some TS weirdness
  entitiesTs: (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema<any>)[]; // `any` required here for some TS weirdness
  subscribers: EventSubscriber[];
  filters: Dictionary<{ name?: string } & Omit<FilterDef<AnyEntity>, 'name'>>;
  discovery: {
    warnWhenNoEntities?: boolean;
    requireEntitiesArray?: boolean;
    alwaysAnalyseProperties?: boolean;
    disableDynamicFileAccess?: boolean;
  };
  type?: keyof typeof Configuration.PLATFORMS;
  driver?: { new(config: Configuration): D };
  driverOptions: Dictionary;
  namingStrategy?: { new(): NamingStrategy };
  implicitTransactions?: boolean;
  autoJoinOneToOneOwner: boolean;
  propagateToOneOwner: boolean;
  populateAfterFlush: boolean;
  forceEntityConstructor: boolean | (Constructor<AnyEntity> | string)[];
  forceUndefined: boolean;
  forceUtcTimezone: boolean;
  timezone?: string;
  ensureIndexes: boolean;
  useBatchInserts?: boolean;
  useBatchUpdates?: boolean;
  batchSize: number;
  hydrator: HydratorConstructor;
  loadStrategy: LoadStrategy;
  flushMode: FlushMode;
  entityRepository?: Constructor<EntityRepository<any>>;
  replicas?: Partial<ConnectionOptions>[];
  strict: boolean;
  validate: boolean;
  context: (name: string) => EntityManager | undefined;
  contextName: string;
  allowGlobalContext: boolean;
  logger: (message: string) => void;
  loggerFactory?: (options: LoggerOptions) => Logger;
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  debug: boolean | LoggerNamespace[];
  highlighter: Highlighter;
  tsNode?: boolean;
  baseDir: string;
  migrations: MigrationsOptions;
  cache: {
    enabled?: boolean;
    pretty?: boolean;
    adapter?: { new(...params: any[]): CacheAdapter };
    options?: Dictionary;
  };
  resultCache: {
    expiration?: number;
    adapter?: { new(...params: any[]): CacheAdapter };
    options?: Dictionary;
  };
  metadataProvider: { new(config: Configuration): MetadataProvider };
  seeder: { path: string; defaultSeeder: string };
}

export type Options<D extends IDatabaseDriver = IDatabaseDriver> =
  Pick<MikroORMOptions<D>, Exclude<keyof MikroORMOptions<D>, keyof typeof Configuration.DEFAULTS>>
  & Partial<MikroORMOptions<D>>;
