import type { NamingStrategy } from '../naming-strategy/NamingStrategy.js';
import { FileCacheAdapter } from '../cache/FileCacheAdapter.js';
import { NullCacheAdapter } from '../cache/NullCacheAdapter.js';
import { type SyncCacheAdapter, type CacheAdapter } from '../cache/CacheAdapter.js';
import type { EntityRepository } from '../entity/EntityRepository.js';
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
  EntityMetadata,
  EnsureDatabaseOptions,
  GenerateOptions,
  Migration,
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
import type { MetadataProvider } from '../metadata/MetadataProvider.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import { ReflectMetadataProvider } from '../metadata/ReflectMetadataProvider.js';
import type { EmbeddedPrefixMode } from '../decorators/Embedded.js';
import type { EventSubscriber } from '../events/EventSubscriber.js';
import type { AssignOptions } from '../entity/EntityAssigner.js';
import type { EntityManagerType, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import { NotFoundError } from '../errors.js';
import { RequestContext } from './RequestContext.js';
import { DataloaderType, FlushMode, LoadStrategy, PopulateHint } from '../enums.js';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter.js';
import { EntityComparator } from './EntityComparator.js';
import type { Type } from '../types/Type.js';
import type { MikroORM } from '../MikroORM.js';

export class Configuration<D extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager> {

  static readonly DEFAULTS = {
    pool: {},
    entities: [],
    entitiesTs: [],
    extensions: [],
    subscribers: [],
    filters: {},
    discovery: {
      warnWhenNoEntities: true,
      requireEntitiesArray: false,
      checkDuplicateTableNames: true,
      checkDuplicateFieldNames: true,
      checkDuplicateEntities: true,
      checkNonPersistentCompositeProps: true,
      alwaysAnalyseProperties: true,
      disableDynamicFileAccess: false,
      inferDefaultValues: true,
    },
    strict: false,
    validate: false,
    validateRequired: true,
    context: (name: string) => RequestContext.getEntityManager(name),
    contextName: 'default',
    allowGlobalContext: false,
    // eslint-disable-next-line no-console
    logger: console.log.bind(console),
    colors: true,
    findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => NotFoundError.findOneFailed(entityName, where),
    findExactlyOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => NotFoundError.findExactlyOneFailed(entityName, where),
    baseDir: process.cwd(),
    hydrator: ObjectHydrator,
    flushMode: FlushMode.AUTO,
    loadStrategy: LoadStrategy.JOINED,
    dataloader: DataloaderType.NONE,
    populateWhere: PopulateHint.ALL,
    connect: true,
    ignoreUndefinedInQuery: false,
    onQuery: sql => sql,
    autoJoinOneToOneOwner: true,
    autoJoinRefsForFilters: true,
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
    ensureDatabase: true,
    ensureIndexes: false,
    batchSize: 300,
    debug: false,
    ignoreDeprecations: false,
    verbose: false,
    driverOptions: {},
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: './migrations',
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
    },
    embeddables: {
      prefixMode: 'absolute',
    },
    entityGenerator: {
      forceUndefined: true,
      undefinedDefaults: false,
      bidirectionalRelations: false,
      identifiedReferences: false,
      scalarTypeInDecorator: false,
      scalarPropertiesForRelations: 'never',
      fileName: (className: string) => className,
      onlyPurePivotTables: false,
      outputPurePivotTables: false,
      readOnlyPivotTables: false,
      useCoreBaseEntity: false,
    },
    metadataCache: {
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
    seeder: {
      path: './seeders',
      defaultSeeder: 'DatabaseSeeder',
      glob: '!(*.d).{js,ts}',
      emit: 'ts',
      fileName: (className: string) => className,
    },
    preferReadReplicas: true,
    dynamicImportProvider: /* v8 ignore next */ (id: string) => import(id),
  } satisfies MikroORMOptions;

  private readonly options: MikroORMOptions<D, EM>;
  private readonly logger: Logger;
  private readonly driver!: D;
  private readonly platform!: ReturnType<D['getPlatform']>;
  private readonly cache = new Map<string, any>();
  private readonly extensions = new Map<string, () => unknown>();

  constructor(options: Options, validate = true) {
    if (options.dynamicImportProvider) {
      Utils.setDynamicImportProvider(options.dynamicImportProvider);
    }

    this.options = Utils.mergeConfig({} as MikroORMOptions<D, EM>, Configuration.DEFAULTS, options);
    this.options.baseDir = Utils.absolutePath(this.options.baseDir);
    this.options.preferTs ??= options.preferTs;

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
      this.detectSourceFolder(options);
      this.init(validate);
    }
  }

  getPlatform(): ReturnType<D['getPlatform']> {
    return this.platform;
  }

  /**
   * Gets specific configuration option. Falls back to specified `defaultValue` if provided.
   */
  get<T extends keyof MikroORMOptions<D, EM>, U extends MikroORMOptions<D, EM>[T]>(key: T, defaultValue?: U): U {
    if (typeof this.options[key] !== 'undefined') {
      return this.options[key] as U;
    }

    return defaultValue as U;
  }

  getAll(): MikroORMOptions<D, EM> {
    return this.options;
  }

  /**
   * Overrides specified configuration value.
   */
  set<T extends keyof MikroORMOptions<D, EM>, U extends MikroORMOptions<D, EM>[T]>(key: T, value: U): void {
    this.options[key] = value;
    this.sync();
  }

  /**
   * Resets the configuration to its default value
   */
  reset<T extends keyof MikroORMOptions<D, EM>>(key: T): void {
    this.options[key] = (Configuration.DEFAULTS as MikroORMOptions<D, EM>)[key];
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

  /**
   * Gets current client URL (connection string).
   */
  getClientUrl(hidePassword = false): string {
    if (hidePassword) {
      return this.options.clientUrl!.replace(/\/\/([^:]+):(.+)@/, '//$1:*****@');
    }

    return this.options.clientUrl!;
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

    /* v8 ignore next 3 */
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
  getRepositoryClass(repository: () => EntityClass<EntityRepository<AnyEntity>>): MikroORMOptions<D, EM>['entityRepository'] {
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
      const Class = cls as { new(...args: any[]): T };
      this.cache.set(cls.name, new Class(...args));
    }

    return this.cache.get(cls.name);
  }

  resetServiceCache(): void {
    this.cache.clear();
  }

  private init(validate: boolean): void {
    if (!this.getMetadataProvider().useCache()) {
      this.options.metadataCache.adapter = NullCacheAdapter;
    }

    if (!('enabled' in this.options.metadataCache)) {
      this.options.metadataCache.enabled = this.getMetadataProvider().useCache();
    }

    if (!this.options.clientUrl) {
      this.options.clientUrl = this.platform.getDefaultClientUrl();
    }

    if (!('implicitTransactions' in this.options)) {
      this.options.implicitTransactions = this.platform.usesImplicitTransactions();
    }

    try {
      const url = new URL(this.getClientUrl());

      if (url.pathname) {
        this.options.dbName = this.get('dbName', decodeURIComponent(url.pathname).substring(1));
      }
    } catch {
      const url = this.getClientUrl().match(/:\/\/.*\/([^?]+)/);

      if (url) {
        this.options.dbName = this.get('dbName', decodeURIComponent(url[1]));
      }
    }

    if (validate && !this.options.dbName && this.options.clientUrl) {
      throw new Error("No database specified, `clientUrl` option provided but it's missing the pathname.");
    }

    if (!this.options.schema) {
      this.options.schema = this.platform.getDefaultSchemaName();
    }

    if (!this.options.charset) {
      this.options.charset = this.platform.getDefaultCharset();
    }

    Object.keys(this.options.filters).forEach(key => {
      this.options.filters[key].default ??= true;
    });

    this.options.subscribers = Utils.unique(this.options.subscribers).map(subscriber => {
      return subscriber.constructor.name === 'Function' ? new (subscriber as Constructor)() : subscriber;
    }) as EventSubscriber[];

    this.sync();

    if (!colors.enabled()) {
      this.options.highlighter = new NullHighlighter();
    }
  }

  private sync(): void {
    process.env.MIKRO_ORM_COLORS = '' + this.options.colors;
    this.logger.setDebugMode(this.options.debug);
  }

  /**
   * Checks if `src` folder exists, it so, tries to adjust the migrations and seeders paths automatically to use it.
   * If there is a `dist` or `build` folder, it will be used for the JS variant (`path` option), while the `src` folder will be
   * used for the TS variant (`pathTs` option).
   *
   * If the default folder exists (e.g. `/migrations`), the config will respect that, so this auto-detection should not
   * break existing projects, only help with the new ones.
   */
  private detectSourceFolder(options: Options): void {
    if (!Utils.pathExistsSync(this.options.baseDir + '/src')) {
      return;
    }

    const migrationsPathExists = Utils.pathExistsSync(this.options.baseDir + '/' + this.options.migrations.path);
    const seedersPathExists = Utils.pathExistsSync(this.options.baseDir + '/' + this.options.seeder.path);
    const distDir = Utils.pathExistsSync(this.options.baseDir + '/dist');
    const buildDir = Utils.pathExistsSync(this.options.baseDir + '/build');
    // if neither `dist` nor `build` exist, we use the `src` folder as it might be a JS project without building, but with `src` folder
    const path = distDir ? './dist' : (buildDir ? './build' : './src');

    // only if the user did not provide any values and if the default path does not exist
    if (!options.migrations?.path && !options.migrations?.pathTs && !migrationsPathExists) {
      this.options.migrations.path = `${path}/migrations`;
      this.options.migrations.pathTs = './src/migrations';
    }

    // only if the user did not provide any values and if the default path does not exist
    if (!options.seeder?.path && !options.seeder?.pathTs && !seedersPathExists) {
      this.options.seeder.path = `${path}/seeders`;
      this.options.seeder.pathTs = './src/seeders';
    }
  }

  private validateOptions(): void {
    /* v8 ignore next 3 */
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
  }

}

/**
 * Type helper to make it easier to use `mikro-orm.config.js`.
 */
export function defineConfig<D extends IDatabaseDriver>(options: Options<D>) {
  return options;
}

export interface ConnectionOptions {
  dbName?: string;
  schema?: string;
  name?: string;
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string | (() => MaybePromise<string>);
  charset?: string;
  collate?: string;
  multipleStatements?: boolean; // for mysql driver
  pool?: PoolConfig;
  driverOptions?: Dictionary;
  onCreateConnection?: (connection: unknown) => Promise<void>;
}

export type MigrationsOptions = {
  tableName?: string;
  path?: string;
  pathTs?: string;
  glob?: string;
  silent?: boolean;
  transactional?: boolean;
  disableForeignKeys?: boolean;
  allOrNothing?: boolean;
  dropTables?: boolean;
  safe?: boolean;
  snapshot?: boolean;
  snapshotName?: string;
  emit?: 'js' | 'ts' | 'cjs';
  generator?: Constructor<IMigrationGenerator>;
  fileName?: (timestamp: string, name?: string) => string;
  migrationsList?: (MigrationObject | Constructor<Migration>)[];
};

export interface SeederOptions {
  path?: string;
  pathTs?: string;
  glob?: string;
  defaultSeeder?: string;
  emit?: 'js' | 'ts';
  fileName?: (className: string) => string;
}

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
}

export interface MetadataDiscoveryOptions {
  warnWhenNoEntities?: boolean;
  requireEntitiesArray?: boolean;
  checkDuplicateTableNames?: boolean;
  checkDuplicateFieldNames?: boolean;
  checkDuplicateEntities?: boolean;
  checkNonPersistentCompositeProps?: boolean;
  alwaysAnalyseProperties?: boolean;
  disableDynamicFileAccess?: boolean;
  inferDefaultValues?: boolean;
  getMappedType?: (type: string, platform: Platform) => Type<unknown> | undefined;
  onMetadata?: (meta: EntityMetadata, platform: Platform) => MaybePromise<void>;
  afterDiscovered?: (storage: MetadataStorage, platform: Platform) => MaybePromise<void>;
  tsConfigPath?: string;
}

export interface MikroORMOptions<D extends IDatabaseDriver = IDatabaseDriver, EM extends EntityManager = EntityManager> extends ConnectionOptions {
  entities: (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[]; // `any` required here for some TS weirdness
  entitiesTs: (string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema)[]; // `any` required here for some TS weirdness
  extensions: { register: (orm: MikroORM) => void }[];
  subscribers: (EventSubscriber | Constructor<EventSubscriber>)[];
  filters: Dictionary<{ name?: string } & Omit<FilterDef, 'name'>>;
  discovery: MetadataDiscoveryOptions;
  driver?: { new(config: Configuration): D };
  namingStrategy?: { new(): NamingStrategy };
  implicitTransactions?: boolean;
  disableTransactions?: boolean;
  connect: boolean;
  verbose: boolean;
  ignoreUndefinedInQuery?: boolean;
  onQuery: (sql: string, params: readonly unknown[]) => string;
  autoJoinOneToOneOwner: boolean;
  autoJoinRefsForFilters: boolean;
  propagationOnPrototype: boolean;
  populateAfterFlush: boolean;
  serialization: {
    includePrimaryKeys?: boolean;
    /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
    forceObject?: boolean;
  };
  assign: AssignOptions<boolean>;
  persistOnCreate: boolean;
  upsertManaged: boolean;
  forceEntityConstructor: boolean | (Constructor<AnyEntity> | string)[];
  forceUndefined: boolean;
  forceUtcTimezone?: boolean;
  timezone?: string;
  ensureDatabase: boolean | EnsureDatabaseOptions;
  ensureIndexes: boolean;
  useBatchInserts?: boolean;
  useBatchUpdates?: boolean;
  batchSize: number;
  hydrator: HydratorConstructor;
  loadStrategy: LoadStrategy | 'select-in' | 'joined';
  dataloader: DataloaderType | boolean;
  populateWhere?: PopulateHint | `${PopulateHint}`;
  flushMode: FlushMode | 'commit' | 'auto' | 'always';
  entityRepository?: EntityClass<EntityRepository<any>>;
  entityManager?: Constructor<EM>;
  replicas?: ConnectionOptions[];
  strict: boolean;
  validate: boolean;
  validateRequired: boolean;
  context: (name: string) => EntityManager | undefined;
  contextName: string;
  allowGlobalContext: boolean;
  disableIdentityMap?: boolean;
  logger: (message: string) => void;
  colors?: boolean;
  loggerFactory?: (options: LoggerOptions) => Logger;
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  findExactlyOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => Error;
  debug: boolean | LoggerNamespace[];
  ignoreDeprecations: boolean | string[];
  highlighter: Highlighter;
  /**
   * Using this option, you can force the ORM to use the TS options regardless of whether the TypeScript support
   * is detected or not. This effectively means using `entitiesTs` for discovery and `pathTs` for migrations and
   * seeders. Should be used only for tests and stay disabled for production builds.
   */
  preferTs?: boolean;
  baseDir: string;
  migrations: MigrationsOptions;
  schemaGenerator: {
    disableForeignKeys?: boolean;
    createForeignKeyConstraints?: boolean;
    ignoreSchema?: string[];
    managementDbName?: string;
  };
  embeddables: {
    prefixMode: EmbeddedPrefixMode;
  };
  entityGenerator: GenerateOptions;
  metadataCache: {
    enabled?: boolean;
    combined?: boolean | string;
    pretty?: boolean;
    adapter?: { new(...params: any[]): SyncCacheAdapter };
    options?: Dictionary;
  };
  resultCache: {
    expiration?: number;
    adapter?: { new(...params: any[]): CacheAdapter };
    options?: Dictionary;
    global?: boolean | number | [string, number];
  };
  metadataProvider: { new(config: Configuration): MetadataProvider };
  seeder: SeederOptions;
  preferReadReplicas: boolean;
  dynamicImportProvider: (id: string) => Promise<unknown>;
}

export type Options<D extends IDatabaseDriver = IDatabaseDriver, EM extends D[typeof EntityManagerType] & EntityManager = D[typeof EntityManagerType] & EntityManager> =
  Pick<MikroORMOptions<D, EM>, Exclude<keyof MikroORMOptions<D, EM>, keyof typeof Configuration.DEFAULTS>>
  & Partial<MikroORMOptions<D, EM>>;
