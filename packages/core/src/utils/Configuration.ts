import type { NamingStrategy } from '../naming-strategy/NamingStrategy.js';
import { NullCacheAdapter } from '../cache/NullCacheAdapter.js';
import { type CacheAdapter, type SyncCacheAdapter } from '../cache/CacheAdapter.js';
import type { EntityRepository } from '../entity/EntityRepository.js';
import type {
  AnyEntity,
  Constructor,
  Dictionary,
  EnsureDatabaseOptions,
  EntityClass,
  EntityMetadata,
  FilterDef,
  GenerateOptions,
  Highlighter,
  HydratorConstructor,
  IHydrator,
  IMigrationGenerator,
  IPrimaryKey,
  MaybePromise,
  Migration,
  MigrationObject,
} from '../typings.js';
import { ObjectHydrator } from '../hydration/ObjectHydrator.js';
import { NullHighlighter } from '../utils/NullHighlighter.js';
import { type Logger, type LoggerNamespace, type LoggerOptions } from '../logging/Logger.js';
import { DefaultLogger } from '../logging/DefaultLogger.js';
import { colors } from '../logging/colors.js';
import { Utils } from '../utils/Utils.js';
import type { EntityManager } from '../EntityManager.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntitySchema } from '../metadata/EntitySchema.js';
import { MetadataProvider } from '../metadata/MetadataProvider.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { EventSubscriber } from '../events/EventSubscriber.js';
import type { AssignOptions } from '../entity/EntityAssigner.js';
import type { EntityManagerType, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import { NotFoundError } from '../errors.js';
import { RequestContext } from './RequestContext.js';
import { DataloaderType, FlushMode, LoadStrategy, PopulateHint, type EmbeddedPrefixMode } from '../enums.js';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter.js';
import { EntityComparator } from './EntityComparator.js';
import type { Type } from '../types/Type.js';
import type { MikroORM } from '../MikroORM.js';
import { setEnv } from './env-vars.js';

const DEFAULTS = {
  pool: {},
  entities: [],
  entitiesTs: [],
  extensions: [],
  subscribers: [],
  filters: {},
  discovery: {
    warnWhenNoEntities: true,
    checkDuplicateTableNames: true,
    checkDuplicateFieldNames: true,
    checkDuplicateEntities: true,
    checkNonPersistentCompositeProps: true,
    inferDefaultValues: true,
  },
  validateRequired: true,
  context: (name: string) => RequestContext.getEntityManager(name),
  contextName: 'default',
  allowGlobalContext: false,
  // eslint-disable-next-line no-console
  logger: console.log.bind(console),
  colors: true,
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => NotFoundError.findOneFailed(entityName, where),
  findExactlyOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => NotFoundError.findExactlyOneFailed(entityName, where),
  baseDir: globalThis.process?.cwd?.(),
  hydrator: ObjectHydrator,
  flushMode: FlushMode.AUTO,
  loadStrategy: LoadStrategy.BALANCED,
  dataloader: DataloaderType.NONE,
  populateWhere: PopulateHint.ALL,
  ignoreUndefinedInQuery: false,
  onQuery: (sql: string) => sql,
  autoJoinOneToOneOwner: true,
  autoJoinRefsForFilters: true,
  filtersOnRelations: true,
  propagationOnPrototype: true,
  populateAfterFlush: true,
  serialization: {
    includePrimaryKeys: true,
  },
  assign: {
    updateNestedEntities: true,
    updateByPrimaryKey: true,
    mergeObjectProperties: false,
    mergeEmbeddedProperties: true,
    ignoreUndefined: false,
  },
  persistOnCreate: true,
  upsertManaged: true,
  forceEntityConstructor: false,
  forceUndefined: false,
  forceUtcTimezone: true,
  processOnCreateHooksEarly: true,
  ensureDatabase: true,
  ensureIndexes: false,
  batchSize: 300,
  debug: false,
  ignoreDeprecations: false,
  verbose: false,
  driverOptions: {},
  migrations: {
    tableName: 'mikro_orm_migrations',
    glob: '!(*.d).{js,ts,cjs}',
    silent: false,
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    snapshot: true,
    emit: 'ts',
    fileName: (timestamp: string, name?: string) => `Migration${timestamp}${name ? '_' + name : ''}`,
  },
  schemaGenerator: {
    disableForeignKeys: false,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
    skipTables: [],
    skipColumns: {},
  },
  embeddables: {
    prefixMode: 'relative',
  },
  entityGenerator: {
    forceUndefined: true,
    undefinedDefaults: false,
    scalarTypeInDecorator: false,
    bidirectionalRelations: true,
    identifiedReferences: true,
    scalarPropertiesForRelations: 'never',
    entityDefinition: 'defineEntity',
    decorators: 'legacy',
    enumMode: 'dictionary',
    /* v8 ignore next */
    fileName: (className: string) => className,
    onlyPurePivotTables: false,
    outputPurePivotTables: false,
    readOnlyPivotTables: false,
    useCoreBaseEntity: false,
  },
  metadataCache: {},
  resultCache: {
    adapter: MemoryCacheAdapter,
    expiration: 1000, // 1s
    options: {},
  },
  metadataProvider: MetadataProvider,
  highlighter: new NullHighlighter(),
  seeder: {
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
    fileName: (className: string) => className,
  },
  preferReadReplicas: true,
  dynamicImportProvider: /* v8 ignore next */ (id: string) => import(id),
} as const;

export class Configuration<D extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager<D> = D[typeof EntityManagerType] & EntityManager<D>> {

  private readonly options: RequiredOptions<D, EM>;
  private readonly logger: Logger;
  private readonly driver!: D;
  private readonly platform!: ReturnType<D['getPlatform']>;
  private readonly cache = new Map<string, any>();
  private readonly extensions = new Map<string, () => unknown>();

  constructor(options: Options, validate = true) {
    if (options.dynamicImportProvider) {
      (globalThis as any).dynamicImportProvider = options.dynamicImportProvider;
    }

    this.options = Utils.mergeConfig({} as RequiredOptions<D, EM>, DEFAULTS, options);

    if (validate) {
      this.validateOptions();
    }

    this.options.loggerFactory ??= DefaultLogger.create;
    this.logger = this.options.loggerFactory({
      debugMode: this.options.debug,
      ignoreDeprecations: this.options.ignoreDeprecations,
      usesReplicas: (this.options.replicas?.length ?? 0) > 0,
      highlighter: this.options.highlighter,
      writer: this.options.logger,
    });

    if (this.options.driver) {
      this.driver = new this.options.driver!(this);
      this.platform = this.driver.getPlatform() as ReturnType<D['getPlatform']>;
      this.platform.setConfig(this);
      this.init(validate);
    }
  }

  getPlatform(): ReturnType<D['getPlatform']> {
    return this.platform;
  }

  /**
   * Gets specific configuration option. Falls back to specified `defaultValue` if provided.
   */
  get<T extends keyof Options<D, EM>, U extends RequiredOptions<D, EM>[T]>(key: T, defaultValue?: U): U {
    if (typeof this.options[key] !== 'undefined') {
      return this.options[key] as U;
    }

    return defaultValue as U;
  }

  getAll(): RequiredOptions<D, EM> {
    return this.options;
  }

  /**
   * Overrides specified configuration value.
   */
  set<T extends keyof Options<D, EM>, U extends RequiredOptions<D, EM>[T]>(key: T, value: U): void {
    this.options[key] = value;
    this.sync();
  }

  /**
   * Resets the configuration to its default value
   */
  reset<T extends keyof RequiredOptions<D, EM>>(key: T): void {
    this.options[key] = DEFAULTS[key as keyof typeof DEFAULTS] as RequiredOptions<D, EM>[T];
  }

  /**
   * Gets Logger instance.
   */
  getLogger(): Logger {
    return this.logger;
  }

  getDataloaderType(): DataloaderType {
    if (typeof this.options.dataloader === 'boolean') {
      return this.options.dataloader ? DataloaderType.ALL : DataloaderType.NONE;
    }

    return this.options.dataloader;
  }

  getSchema(skipDefaultSchema = false): string | undefined {
    if (skipDefaultSchema && this.options.schema === this.platform.getDefaultSchemaName()) {
      return undefined;
    }

    return this.options.schema;
  }

  /**
   * Gets current database driver instance.
   */
  getDriver(): D {
    return this.driver;
  }

  registerExtension(name: string, cb: () => unknown): void {
    this.extensions.set(name, cb);
  }

  getExtension<T>(name: string): T | undefined {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const ext = this.extensions.get(name);

    /* v8 ignore next */
    if (!ext) {
      return undefined;
    }

    this.cache.set(name, ext());
    return this.cache.get(name);
  }

  /**
   * Gets instance of NamingStrategy. (cached)
   */
  getNamingStrategy(): NamingStrategy {
    return this.getCachedService(this.options.namingStrategy || this.platform.getNamingStrategy());
  }

  /**
   * Gets instance of Hydrator. (cached)
   */
  getHydrator(metadata: MetadataStorage): IHydrator {
    return this.getCachedService(this.options.hydrator, metadata, this.platform, this);
  }

  /**
   * Gets instance of Comparator. (cached)
   */
  getComparator(metadata: MetadataStorage) {
    return this.getCachedService(EntityComparator, metadata, this.platform);
  }

  /**
   * Gets instance of MetadataProvider. (cached)
   */
  getMetadataProvider(): MetadataProvider {
    return this.getCachedService(this.options.metadataProvider, this);
  }

  /**
   * Gets instance of metadata CacheAdapter. (cached)
   */
  getMetadataCacheAdapter(): SyncCacheAdapter {
    return this.getCachedService(this.options.metadataCache.adapter!, this.options.metadataCache.options, this.options.baseDir, this.options.metadataCache.pretty);
  }

  /**
   * Gets instance of CacheAdapter for result cache. (cached)
   */
  getResultCacheAdapter(): CacheAdapter {
    return this.getCachedService(this.options.resultCache.adapter!, { expiration: this.options.resultCache.expiration, ...this.options.resultCache.options });
  }

  /**
   * Gets EntityRepository class to be instantiated.
   */
  getRepositoryClass(repository: () => EntityClass<EntityRepository<AnyEntity>>): Options<D, EM>['entityRepository'] {
    if (repository) {
      return repository();
    }

    if (this.options.entityRepository) {
      return this.options.entityRepository;
    }

    return this.platform.getRepositoryClass();
  }

  /**
   * Creates instance of given service and caches it.
   */
  getCachedService<T extends { new(...args: any[]): InstanceType<T> }>(cls: T, ...args: ConstructorParameters<T>): InstanceType<T> {
    if (!this.cache.has(cls.name)) {
      this.cache.set(cls.name, new cls(...args));
    }

    return this.cache.get(cls.name);
  }

  resetServiceCache(): void {
    this.cache.clear();
  }

  private init(validate: boolean): void {
    const useCache = this.getMetadataProvider().useCache();
    const metadataCache = this.options.metadataCache;

    if (!useCache) {
      metadataCache.adapter = NullCacheAdapter;
    }

    metadataCache.enabled ??= useCache;
    this.options.clientUrl ??= this.platform.getDefaultClientUrl();
    this.options.implicitTransactions ??= this.platform.usesImplicitTransactions();

    if (validate && metadataCache.enabled && !metadataCache.adapter) {
      throw new Error('No metadata cache adapter specified, please fill in `metadataCache.adapter` option or use the async MikroORM.init() method which can autoload it.');
    }

    try {
      const url = new URL(this.options.clientUrl);

      if (url.pathname) {
        this.options.dbName = this.get('dbName', decodeURIComponent(url.pathname).substring(1));
      }
    } catch {
      const url = this.options.clientUrl.match(/:\/\/.*\/([^?]+)/);

      if (url) {
        this.options.dbName = this.get('dbName', decodeURIComponent(url[1]));
      }
    }

    if (validate && !this.options.dbName && this.options.clientUrl) {
      throw new Error("No database specified, `clientUrl` option provided but it's missing the pathname.");
    }

    this.options.schema ??= this.platform.getDefaultSchemaName();
    this.options.charset ??= this.platform.getDefaultCharset();

    Object.keys(this.options.filters).forEach(key => {
      this.options.filters[key].default ??= true;
    });

    if (!this.options.filtersOnRelations) {
      this.options.autoJoinRefsForFilters ??= false;
    }

    this.options.subscribers = [...this.options.subscribers].map(subscriber => {
      return subscriber.constructor.name === 'Function' ? new (subscriber as Constructor)() : subscriber;
    }) as EventSubscriber[];

    this.sync();

    if (!colors.enabled()) {
      this.options.highlighter = new NullHighlighter();
    }
  }

  private sync(): void {
    setEnv('MIKRO_ORM_COLORS', this.options.colors);
    this.logger.setDebugMode(this.options.debug);
  }

  private validateOptions(): void {
    /* v8 ignore next */
    if ('type' in this.options) {
      throw new Error('The `type` option has been removed in v6, please fill in the `driver` option instead or use `defineConfig` helper (to define your ORM config) or `MikroORM` class (to call the `init` method) exported from the driver package (e.g. `import { defineConfig } from \'@mikro-orm/mysql\'; export default defineConfig({ ... })`).');
    }

    if (!this.options.driver) {
      throw new Error('No driver specified, please fill in the `driver` option or use `defineConfig` helper (to define your ORM config) or `MikroORM` class (to call the `init` method) exported from the driver package (e.g. `import { defineConfig } from \'@mikro-orm/mysql\'; export defineConfig({ ... })`).');
    }

    if (!this.options.dbName && !this.options.clientUrl) {
      throw new Error('No database specified, please fill in `dbName` or `clientUrl` option');
    }

    if (this.options.entities.length === 0 && this.options.discovery.warnWhenNoEntities) {
      throw new Error('No entities found, please use `entities` option');
    }

    if (typeof this.options.driverOptions === 'function' && this.options.driverOptions.constructor.name === 'AsyncFunction') {
      throw new Error('`driverOptions` callback cannot be async');
    }
  }

}

/**
 * Type helper to make it easier to use `mikro-orm.config.js`.
 */
export function defineConfig<
  D extends IDatabaseDriver = IDatabaseDriver,
  EM extends EntityManager<D> = EntityManager<D>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
>(options: Options<D, EM, Entities>) {
  return options;
}

/**
 * Connection configuration options for database connections.
 * @see https://mikro-orm.io/docs/configuration#connection
 */
export interface ConnectionOptions {
  /** Name of the database to connect to. */
  dbName?: string;
  /** Default database schema to use. */
  schema?: string;
  /** Name of the connection (used for logging when replicas are used). */
  name?: string;
  /** Full client connection URL. Overrides individual connection options. */
  clientUrl?: string;
  /** Database server hostname. */
  host?: string;
  /** Database server port number. */
  port?: number;
  /** Database user name. */
  user?: string;
  /**
   * Database password. Can be a string or a callback function that returns the password.
   * The callback is useful for short-lived tokens from cloud providers.
   * @example
   * password: async () => someCallToGetTheToken()
   */
  password?: string | (() => MaybePromise<string>);
  /** Character set for the connection. */
  charset?: string;
  /** Collation for the connection. */
  collate?: string;
  /**
   * Enable multiple statements in a single query.
   * Required for importing database dump files.
   * Should be disabled in production for security.
   * @default false
   */
  multipleStatements?: boolean;
  /** Connection pool configuration. */
  pool?: PoolConfig;
  /**
   * Additional driver-specific options.
   * The object will be deeply merged with internal driver options.
   */
  driverOptions?: Dictionary;
  /** Callback to execute when a new connection is created. */
  onCreateConnection?: (connection: unknown) => Promise<void>;
}

/**
 * Configuration options for database migrations.
 * @see https://mikro-orm.io/docs/migrations
 */
export type MigrationsOptions = {
  /**
   * Name of the migrations table.
   * @default 'mikro_orm_migrations'
   */
  tableName?: string;
  /**
   * Path to the folder with migration files (for compiled JavaScript files).
   * @default './migrations'
   */
  path?: string;
  /**
   * Path to the folder with migration files (for TypeScript source files).
   * Used when running in TypeScript mode.
   */
  pathTs?: string;
  /**
   * Glob pattern to match migration files.
   * @default '!(*.d).{js,ts,cjs}'
   */
  glob?: string;
  /**
   * Disable logging for migration operations.
   * @default false
   */
  silent?: boolean;
  /**
   * Run each migration inside a transaction.
   * @default true
   */
  transactional?: boolean;
  /**
   * Try to disable foreign key checks during migrations.
   * @default false
   */
  disableForeignKeys?: boolean;
  /**
   * Run all migrations in the current batch in a master transaction.
   * @default true
   */
  allOrNothing?: boolean;
  /**
   * Allow dropping tables during schema diff.
   * @default true
   */
  dropTables?: boolean;
  /**
   * Safe mode - only allow adding new tables and columns, never dropping existing ones.
   * @default false
   */
  safe?: boolean;
  /**
   * Create a snapshot of the current schema after migration generation.
   * @default true
   */
  snapshot?: boolean;
  /** Custom name for the snapshot file. */
  snapshotName?: string;
  /**
   * File extension for generated migration files.
   * @default 'ts'
   */
  emit?: 'js' | 'ts' | 'cjs';
  /** Custom migration generator class. */
  generator?: Constructor<IMigrationGenerator>;
  /**
   * Custom function to generate migration file names.
   * @default (timestamp, name) => `Migration${timestamp}${name ? '_' + name : ''}`
   */
  fileName?: (timestamp: string, name?: string) => string;
  /** List of migration classes or objects to use instead of file-based discovery. */
  migrationsList?: (MigrationObject | Constructor<Migration>)[];
};

/**
 * Configuration options for database seeders.
 * @see https://mikro-orm.io/docs/seeding
 */
export interface SeederOptions {
  /**
   * Path to the folder with seeder files (for compiled JavaScript files).
   * @default './seeders'
   */
  path?: string;
  /**
   * Path to the folder with seeder files (for TypeScript source files).
   * Used when running in TypeScript mode.
   */
  pathTs?: string;
  /**
   * Glob pattern to match seeder files.
   * @default '!(*.d).{js,ts}'
   */
  glob?: string;
  /**
   * Name of the default seeder class to run.
   * @default 'DatabaseSeeder'
   */
  defaultSeeder?: string;
  /**
   * File extension for generated seeder files.
   * @default 'ts'
   */
  emit?: 'js' | 'ts';
  /**
   * Custom function to generate seeder file names.
   * @default (className) => className
   */
  fileName?: (className: string) => string;
}

/**
 * Connection pool configuration.
 * @see https://mikro-orm.io/docs/configuration#connection
 */
export interface PoolConfig {
  /** Minimum number of connections to keep in the pool. */
  min?: number;
  /** Maximum number of connections allowed in the pool. */
  max?: number;
  /** Time in milliseconds before an idle connection is closed. */
  idleTimeoutMillis?: number;
}

/**
 * Configuration options for metadata discovery.
 * @see https://mikro-orm.io/docs/configuration#entity-discovery
 */
export interface MetadataDiscoveryOptions {
  /**
   * Throw an error when no entities are discovered.
   * @default true
   */
  warnWhenNoEntities?: boolean;
  /**
   * Check for duplicate table names and throw an error if found.
   * @default true
   */
  checkDuplicateTableNames?: boolean;
  /**
   * Check for duplicate field names and throw an error if found.
   * @default true
   */
  checkDuplicateFieldNames?: boolean;
  /**
   * Check for composite primary keys marked as `persist: false` and throw an error if found.
   * @default true
   */
  checkNonPersistentCompositeProps?: boolean;
  /**
   * Infer default values from property initializers when possible
   * (if the constructor can be invoked without parameters).
   * @default true
   */
  inferDefaultValues?: boolean;
  /**
   * Custom callback to override default type mapping.
   * Allows customizing how property types are mapped to database column types.
   * @example
   * getMappedType(type, platform) {
   *   if (type === 'string') {
   *     return Type.getType(TextType);
   *   }
   *   return platform.getDefaultMappedType(type);
   * }
   */
  getMappedType?: (type: string, platform: Platform) => Type<unknown> | undefined;
  /**
   * Hook called for each entity metadata during discovery.
   * Can be used to modify metadata dynamically before defaults are filled in.
   * The hook can be async when using `MikroORM.init()`.
   */
  onMetadata?: (meta: EntityMetadata, platform: Platform) => MaybePromise<void>;
  /**
   * Hook called after all entities are discovered.
   * Can be used to access and modify all metadata at once.
   */
  afterDiscovered?: (storage: MetadataStorage, platform: Platform) => MaybePromise<void>;
  /** Path to the TypeScript configuration file for ts-morph metadata provider. */
  tsConfigPath?: string;
  /** @internal */
  skipSyncDiscovery?: boolean;
}

/**
 * MikroORM configuration options.
 * @see https://mikro-orm.io/docs/configuration
 */
export interface Options<
  Driver extends IDatabaseDriver = IDatabaseDriver,
  EM extends EntityManager<Driver> & Driver[typeof EntityManagerType] = EntityManager<Driver> & Driver[typeof EntityManagerType],
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> extends ConnectionOptions {
  /**
   * Array of entity classes or paths to entity modules.
   * Paths support glob patterns for automatic discovery.
   * @example
   * entities: [Author, Book, Publisher] // class references
   * entities: ['./dist/entities'] // folder paths
   */
  entities?: Entities;
  /**
   * Array of TypeScript entity source paths.
   * Used when running in TypeScript mode (e.g., via `tsx` or `swc`).
   * Should always be specified when using folder-based discovery.
   * @example
   * entitiesTs: ['./src/entities']
   */
  entitiesTs?: Entities;
  /**
   * ORM extensions to register (e.g., Migrator, EntityGenerator, SeedManager).
   * Extensions registered here are available via shortcuts like `orm.migrator`.
   * @example
   * extensions: [Migrator, EntityGenerator, SeedManager]
   */
  extensions?: { register: (orm: MikroORM) => void }[];
  /**
   * Event subscribers to register.
   * Can be class references or instances.
   */
  subscribers?: Iterable<EventSubscriber | Constructor<EventSubscriber>>;
  /**
   * Global entity filters to apply.
   * Filters are applied by default unless explicitly disabled.
   * @see https://mikro-orm.io/docs/filters
   */
  filters?: Dictionary<{ name?: string } & Omit<FilterDef, 'name'>>;
  /**
   * Metadata discovery configuration options.
   * Controls how entities are discovered and validated.
   */
  discovery?: MetadataDiscoveryOptions;
  /**
   * Database driver class to use.
   * Should be imported from the specific driver package (e.g. `@mikro-orm/mysql`, `@mikro-orm/postgresql`).
   * Alternatively, use the `defineConfig` helper or `MikroORM` class exported from the driver package.
   * @example
   * import { MySqlDriver } from '@mikro-orm/mysql';
   *
   * MikroORM.init({
   *   driver: MySqlDriver,
   *   dbName: 'my_db',
   * });
   */
  driver?: { new(config: Configuration): Driver };
  /**
   * Custom naming strategy class for mapping entity/property names to database table/column names.
   * Built-in options: `UnderscoreNamingStrategy`, `MongoNamingStrategy`, `EntityCaseNamingStrategy`.
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  namingStrategy?: { new(): NamingStrategy };
  /**
   * Enable implicit transactions for all write operations.
   * When enabled, all queries will be wrapped in a transaction.
   * Disabled for MongoDB driver by default.
   */
  implicitTransactions?: boolean;
  /**
   * Disable all transactions.
   * When enabled, no queries will be wrapped in transactions, even when explicitly requested.
   * @default false
   */
  disableTransactions?: boolean;
  /**
   * Enable verbose logging of internal operations.
   * @default false
   */
  verbose?: boolean;
  /**
   * Ignore `undefined` values in find queries instead of treating them as `null`.
   * @default false
   * @example
   * // With ignoreUndefinedInQuery: true
   * em.find(User, { email: undefined }) // resolves to em.find(User, {})
   */
  ignoreUndefinedInQuery?: boolean;
  /**
   * Hook to modify SQL queries before execution.
   * Useful for adding observability hints or query modifications.
   * @param sql - The generated SQL query
   * @param params - Query parameters
   * @returns Modified SQL query
   */
  onQuery?: (sql: string, params: readonly unknown[]) => string;
  /**
   * Automatically join the owning side of 1:1 relations when querying the inverse side.
   * @default true
   */
  autoJoinOneToOneOwner?: boolean;
  /**
   * Automatically join M:1 and 1:1 relations when filters are defined on them.
   * Important for implementing soft deletes via filters.
   * @default true
   */
  autoJoinRefsForFilters?: boolean;
  /**
   * Apply filters to relations in queries.
   * @default true
   */
  filtersOnRelations?: boolean;
  /**
   * Enable propagation of changes on entity prototypes.
   * @default true
   */
  propagationOnPrototype?: boolean;
  /**
   * Mark all relations as populated after flush for new entities.
   * This aligns serialized output of loaded entities and just-inserted ones.
   * @default true
   */
  populateAfterFlush?: boolean;
  /**
   * Serialization options for `toJSON()` and `serialize()` methods.
   */
  serialization?: {
    /**
     * Include primary keys in serialized output.
     * @default true
     */
    includePrimaryKeys?: boolean;
    /**
     * Enforce unpopulated references to be returned as objects.
     * When enabled, references are serialized as `{ author: { id: 1 } }` instead of `{ author: 1 }`.
     * @default false
     */
    forceObject?: boolean;
  };
  /**
   * Default options for entity assignment via `em.assign()`.
   * @see https://mikro-orm.io/docs/entity-helper
   */
  assign?: AssignOptions<boolean>;
  /**
   * Automatically call `em.persist()` on entities created via `em.create()`.
   * @default true
   */
  persistOnCreate?: boolean;
  /**
   * When upsert creates a new entity, mark it as managed in the identity map.
   * @default true
   */
  upsertManaged?: boolean;
  /**
   * Force use of entity constructors when creating entity instances.
   * Required when using native private properties inside entities.
   * Can be `true` for all entities or an array of specific entity classes/names.
   * @default false
   */
  forceEntityConstructor?: boolean | (Constructor<AnyEntity> | string)[];
  /**
   * Convert `null` values from database to `undefined` when hydrating entities.
   * @default false
   */
  forceUndefined?: boolean;
  /**
   * Property `onCreate` hooks are normally executed during `flush` operation.
   * With this option, they will be processed early inside `em.create()` method.
   * @default true
   */
  processOnCreateHooksEarly?: boolean;
  /**
   * Force `Date` values to be stored in UTC for datetime columns without timezone.
   * Works for MySQL (`datetime` type), PostgreSQL (`timestamp` type), and MSSQL (`datetime`/`datetime2` types).
   * SQLite does this by default.
   * @default true
   */
  forceUtcTimezone?: boolean;
  /**
   * Timezone to use for date operations.
   * @example '+02:00'
   */
  timezone?: string;
  /**
   * Ensure the database exists when initializing the ORM.
   * When `true`, will create the database if it doesn't exist.
   * @default true
   */
  ensureDatabase?: boolean | EnsureDatabaseOptions;
  /**
   * Ensure database indexes exist on startup. This option works only with the MongoDB driver.
   * When enabled, indexes will be created based on entity metadata.
   * @default false
   */
  ensureIndexes?: boolean;
  /**
   * Use batch insert queries for better performance.
   * @default true
   */
  useBatchInserts?: boolean;
  /**
   * Use batch update queries for better performance.
   * @default true
   */
  useBatchUpdates?: boolean;
  /**
   * Number of entities to process in each batch for batch inserts/updates.
   * @default 300
   */
  batchSize?: number;
  /**
   * Custom hydrator class for assigning database values to entities.
   * @default ObjectHydrator
   */
  hydrator?: HydratorConstructor;
  /**
   * Default loading strategy for relations.
   * - `'joined'`: Use SQL JOINs (single query, may cause cartesian product)
   * - `'select-in'`: Use separate SELECT IN queries (multiple queries)
   * - `'balanced'`: Decides based on relation type and context.
   * @default 'balanced'
   */
  loadStrategy?: LoadStrategy | `${LoadStrategy}`;
  /**
   * Enable dataloader for batching reference loading.
   * - `true` or `DataloaderType.ALL`: Enable for all relation types
   * - `false` or `DataloaderType.NONE`: Disable dataloader
   * - `DataloaderType.REFERENCE`: Enable only for scalar references
   * - `DataloaderType.COLLECTION`: Enable only for collections
   * @default DataloaderType.NONE
   */
  dataloader?: DataloaderType | boolean;
  /**
   * Determines how where conditions are applied during population.
   * - `'all'`: Populate all matching relations (default in v5+)
   * - `'infer'`: Infer conditions from the original query (v4 behavior)
   * @default 'all'
   */
  populateWhere?: PopulateHint | `${PopulateHint}`;
  /**
   * Default flush mode for the entity manager.
   * - `'commit'`: Flush only on explicit commit
   * - `'auto'`: Flush before queries when needed
   * - `'always'`: Always flush before queries
   * @default 'auto'
   */
  flushMode?: FlushMode | `${FlushMode}`;
  /**
   * Custom base repository class for all entities.
   * Entity-specific repositories can still be defined and will take precedence.
   * @see https://mikro-orm.io/docs/repositories
   */
  entityRepository?: EntityClass<EntityRepository<any>>;
  /**
   * Custom entity manager class to use.
   */
  entityManager?: Constructor<EM>;
  /**
   * Read replica connection configurations.
   * Each replica can override parts of the main connection options.
   * @see https://mikro-orm.io/docs/read-connections
   */
  replicas?: ConnectionOptions[];
  /**
   * Validate that required properties are set on new entities before insert.
   * @default true
   */
  validateRequired?: boolean;
  /**
   * Callback to get the current request context's EntityManager.
   * Used for automatic context propagation in web frameworks.
   * @default RequestContext.getEntityManager
   */
  context?: (name: string) => EntityManager | undefined;
  /**
   * Name of the context for multi-ORM setups.
   * @default 'default'
   */
  contextName?: string;
  /**
   * Allow using the global EntityManager without a request context.
   * Not recommended for production - each request should have its own context.
   * Can also be set via `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` environment variable.
   * @default false
   */
  allowGlobalContext?: boolean;
  /**
   * Disable the identity map.
   * When disabled, each query returns new entity instances.
   * Not recommended for most use cases.
   * @default false
   */
  disableIdentityMap?: boolean;
  /**
   * Custom logger function for ORM output.
   * @default console.log
   */
  logger?: (message: string) => void;
  /**
   * Enable colored output in logs.
   * @default true
   */
  colors?: boolean;
  /**
   * Factory function to create a custom logger instance.
   * @default DefaultLogger.create
   */
  loggerFactory?: (options: LoggerOptions) => Logger;
  /**
   * Custom error handler for `em.findOneOrFail()` when no entity is found.
   * @param entityName - Name of the entity being queried
   * @param where - Query conditions
   * @returns Error instance to throw
   */
  findOneOrFailHandler?: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  /**
   * Custom error handler for `em.findExactlyOneOrFail()` when entity count is not exactly one.
   * Used when strict mode is enabled.
   * @param entityName - Name of the entity being queried
   * @param where - Query conditions
   * @returns Error instance to throw
   */
  findExactlyOneOrFailHandler?: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  /**
   * Enable debug logging.
   * Can be `true` for all namespaces or an array of specific namespaces.
   * Available namespaces: `'query'`, `'query-params'`, `'discovery'`, `'info'`.
   * @default false
   * @see https://mikro-orm.io/docs/logging
   */
  debug?: boolean | LoggerNamespace[];
  /**
   * Ignore deprecation warnings.
   * Can be `true` to ignore all or an array of specific deprecation labels.
   * @default false
   * @see https://mikro-orm.io/docs/logging#deprecation-warnings
   */
  ignoreDeprecations?: boolean | string[];
  /**
   * Syntax highlighter for SQL queries in logs.
   * @default NullHighlighter
   */
  highlighter?: Highlighter;
  /**
   * Force the ORM to use TypeScript options regardless of detection.
   * Uses `entitiesTs` for discovery and `pathTs` for migrations/seeders.
   * Should only be used for tests, not production builds.
   * @default false
   */
  preferTs?: boolean;
  /**
   * Base directory for resolving relative paths.
   * @default process.cwd()
   */
  baseDir?: string;
  /**
   * Migration configuration options.
   * @see https://mikro-orm.io/docs/migrations
   */
  migrations?: MigrationsOptions;
  /**
   * Schema generator configuration options.
   */
  schemaGenerator?: {
    /**
     * Try to disable foreign key checks during schema operations.
     * @default false
     */
    disableForeignKeys?: boolean;
    /**
     * Generate foreign key constraints.
     * @default true
     */
    createForeignKeyConstraints?: boolean;
    /**
     * Schema names to ignore when comparing schemas.
     * @default []
     */
    ignoreSchema?: string[];
    /**
     * Table names or patterns to skip during schema generation.
     * @default []
     */
    skipTables?: (string | RegExp)[];
    /**
     * Column names or patterns to skip during schema generation, keyed by table name.
     * @default {}
     */
    skipColumns?: Dictionary<(string | RegExp)[]>;
    /**
     * Database name to use for management operations (e.g., creating/dropping databases).
     */
    managementDbName?: string;
  };
  /**
   * Embeddable entity configuration options.
   */
  embeddables?: {
    /**
     * Mode for generating column prefixes for embedded properties.
     * @default 'relative'
     */
    prefixMode: EmbeddedPrefixMode;
  };
  /**
   * Entity generator (code generation) configuration options.
   * @see https://mikro-orm.io/docs/entity-generator
   */
  entityGenerator?: GenerateOptions;
  /**
   * Metadata cache configuration for improved startup performance.
   * @see https://mikro-orm.io/docs/metadata-cache
   */
  metadataCache?: {
    /**
     * Enable metadata caching.
     * Defaults based on the metadata provider's `useCache()` method.
     */
    enabled?: boolean;
    /**
     * Combine all metadata into a single cache file.
     * Can be `true` for default path or a custom path string.
     */
    combined?: boolean | string;
    /**
     * Pretty print JSON cache files.
     * @default false
     */
    pretty?: boolean;
    /**
     * Cache adapter class to use. When cache is enabled, and no adapter is provided explicitly, {@link FileCacheAdapter} is used automatically - but only if you use the async `MikroORM.init()` method.
     */
    adapter?: { new(...params: any[]): SyncCacheAdapter };
    /**
     * Options passed to the cache adapter constructor.
     * @default { cacheDir: process.cwd() + '/temp' }
     */
    options?: Dictionary;
  };
  /**
   * Result cache configuration for query result caching.
   */
  resultCache?: {
    /**
     * Default cache expiration time in milliseconds.
     * @default 1000
     */
    expiration?: number;
    /**
     * Cache adapter class to use.
     * @default MemoryCacheAdapter
     */
    adapter?: { new(...params: any[]): CacheAdapter };
    /**
     * Options passed to the cache adapter constructor.
     * @default {}
     */
    options?: Dictionary;
    /**
     * Enable global result caching for all queries.
     * Can be `true`, an expiration number, or a tuple of `[key, expiration]`.
     */
    global?: boolean | number | [string, number];
  };
  /**
   * Metadata provider class for entity discovery.
   * Built-in options: `ReflectMetadataProvider` (default), `TsMorphMetadataProvider`.
   * @default ReflectMetadataProvider
   * @see https://mikro-orm.io/docs/metadata-providers
   */
  metadataProvider?: { new(config: Configuration): MetadataProvider; useCache?: MetadataProvider['useCache'] };
  /**
   * Seeder configuration options.
   * @see https://mikro-orm.io/docs/seeding
   */
  seeder?: SeederOptions;
  /**
   * Prefer read replicas for read operations when available.
   * @default true
   */
  preferReadReplicas?: boolean;
  /**
   * Custom dynamic import provider for loading modules.
   * @default (id) => import(id)
   */
  dynamicImportProvider?: (id: string) => Promise<unknown>;
}

type MarkRequired<T, D> = {
  [K in keyof T as Extract<K, keyof D>]-?: T[K];
} & {
  [K in keyof T as Exclude<K, keyof D>]?: T[K];
};

export type RequiredOptions<
  D extends IDatabaseDriver = IDatabaseDriver,
  EM extends EntityManager<D> = EntityManager<D>,
  Entities extends (string | EntityClass<AnyEntity> | EntitySchema)[] = (string | EntityClass<AnyEntity> | EntitySchema)[],
> = MarkRequired<Options<D, EM, Entities>, typeof DEFAULTS>;
