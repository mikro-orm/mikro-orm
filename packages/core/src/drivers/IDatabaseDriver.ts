import type {
  ConnectionType,
  Constructor,
  EntityData,
  EntityMetadata,
  EntityProperty,
  FilterQuery,
  Primary,
  Dictionary,
  IPrimaryKey,
  PopulateOptions,
  EntityDictionary,
  AutoPath,
  ObjectQuery,
  FilterObject,
  Populate,
  EntityName,
  PopulateHintOptions,
  Prefixes,
} from '../typings.js';
import type { Connection, QueryResult, Transaction } from '../connections/Connection.js';
import type {
  FlushMode,
  LockMode,
  QueryOrderMap,
  QueryFlag,
  LoadStrategy,
  PopulateHint,
  PopulatePath,
} from '../enums.js';
import type { Platform } from '../platforms/Platform.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Collection } from '../entity/Collection.js';
import type { EntityManager } from '../EntityManager.js';
import type { DriverException } from '../exceptions.js';
import type { Configuration } from '../utils/Configuration.js';
import type { MikroORM } from '../MikroORM.js';
import type { LoggingOptions, LogContext } from '../logging/Logger.js';
import type { Raw } from '../utils/RawQueryFragment.js';

/** Symbol used to extract the EntityManager type from a driver instance. */
export const EntityManagerType = Symbol('EntityManagerType');

/** Interface defining the contract for all database drivers. */
export interface IDatabaseDriver<C extends Connection = Connection> {
  [EntityManagerType]: EntityManager<this>;
  readonly config: Configuration;

  /** Creates a new EntityManager instance for this driver. */
  createEntityManager(useContext?: boolean): this[typeof EntityManagerType];

  /** Opens a connection to the database. */
  connect(options?: { skipOnConnect?: boolean }): Promise<C>;

  /** Closes the database connection. */
  close(force?: boolean): Promise<void>;

  /** Closes and re-establishes the database connection. */
  reconnect(options?: { skipOnConnect?: boolean }): Promise<C>;

  /** Returns the underlying database connection (write or read replica). */
  getConnection(type?: ConnectionType): C;

  /**
   * Finds selection of entities
   */
  find<T extends object, P extends string = never, F extends string = never, E extends string = never>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options?: FindOptions<T, P, F, E>,
  ): Promise<EntityData<T>[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends object, P extends string = never, F extends string = never, E extends string = never>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options?: FindOneOptions<T, P, F, E>,
  ): Promise<EntityData<T> | null>;

  /** Finds entities backed by a virtual (expression-based) definition. */
  findVirtual<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options: FindOptions<T, any, any, any>,
  ): Promise<EntityData<T>[]>;

  /** Returns an async iterator that streams query results one entity at a time. */
  stream<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options: StreamOptions<T>,
  ): AsyncIterableIterator<T>;

  /** Inserts a single row into the database. */
  nativeInsert<T extends object>(
    entityName: EntityName<T>,
    data: EntityDictionary<T>,
    options?: NativeInsertUpdateOptions<T>,
  ): Promise<QueryResult<T>>;

  /** Inserts multiple rows into the database in a single batch operation. */
  nativeInsertMany<T extends object>(
    entityName: EntityName<T>,
    data: EntityDictionary<T>[],
    options?: NativeInsertUpdateManyOptions<T>,
    transform?: (sql: string) => string,
  ): Promise<QueryResult<T>>;

  /** Updates rows matching the given condition. */
  nativeUpdate<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    data: EntityDictionary<T>,
    options?: NativeInsertUpdateOptions<T>,
  ): Promise<QueryResult<T>>;

  /** Updates multiple rows with different payloads in a single batch operation. */
  nativeUpdateMany<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>[],
    data: EntityDictionary<T>[],
    options?: NativeInsertUpdateManyOptions<T>,
  ): Promise<QueryResult<T>>;

  /** Deletes rows matching the given condition. */
  nativeDelete<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options?: NativeDeleteOptions<T>,
  ): Promise<QueryResult<T>>;

  /** Persists changes to M:N collections (inserts/deletes pivot table rows). */
  syncCollections<T extends object, O extends object>(
    collections: Iterable<Collection<T, O>>,
    options?: DriverMethodOptions,
  ): Promise<void>;

  /** Counts entities matching the given condition. */
  count<T extends object, P extends string = never>(
    entityName: EntityName<T>,
    where: FilterQuery<T>,
    options?: CountOptions<T, P>,
  ): Promise<number>;

  /** Executes a MongoDB aggregation pipeline (MongoDB driver only). */
  aggregate(entityName: EntityName, pipeline: any[]): Promise<any[]>;

  /** Maps raw database result to entity data, converting column names to property names. */
  mapResult<T extends object>(
    result: EntityDictionary<T>,
    meta: EntityMetadata<T>,
    populate?: PopulateOptions<T>[],
  ): EntityData<T> | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends object, O extends object>(
    prop: EntityProperty,
    owners: Primary<O>[][],
    where?: FilterQuery<T>,
    orderBy?: OrderDefinition<T>,
    ctx?: Transaction,
    options?: FindOptions<T, any, any, any>,
    pivotJoin?: boolean,
  ): Promise<Dictionary<T[]>>;

  /** Returns the database platform abstraction for this driver. */
  getPlatform(): Platform;

  /** Sets the metadata storage used by this driver. */
  setMetadata(metadata: MetadataStorage): void;

  /** Returns the metadata storage used by this driver. */
  getMetadata(): MetadataStorage;

  /**
   * Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
   * for SQL drivers it also returns `knex` in the array as connectors are not used directly there
   */
  getDependencies(): string[];

  /** Acquires a pessimistic lock on the given entity. */
  lockPessimistic<T extends object>(entity: T, options: LockOptions): Promise<void>;

  /**
   * Converts native db errors to standardized driver exceptions
   */
  convertException(exception: Error): DriverException;

  /**
   * @internal
   */
  getSchemaName(meta?: EntityMetadata, options?: { schema?: string; parentSchema?: string }): string | undefined;

  /**
   * @internal
   */
  getORMClass(): Constructor<MikroORM>;
}

/** Represents a field selector for entity queries (property name or wildcard). */
export type EntityField<T, P extends string = PopulatePath.ALL> =
  | keyof T
  | PopulatePath.ALL
  | AutoPath<T, P, `${PopulatePath.ALL}`>;

/** Defines the ordering for query results, either a single order map or an array of them. */
export type OrderDefinition<T> = (QueryOrderMap<T> & { 0?: never }) | QueryOrderMap<T>[];

/** Options for `em.findAll()`, extends FindOptions with an optional `where` clause. */
export interface FindAllOptions<
  T,
  P extends string = never,
  F extends string = never,
  E extends string = never,
> extends FindOptions<T, P, F, E> {
  where?: FilterQuery<T>;
}

/** Options for streaming query results via `em.stream()`. */
export interface StreamOptions<
  Entity,
  Populate extends string = never,
  Fields extends string = never,
  Exclude extends string = never,
> extends Omit<
  FindAllOptions<Entity, Populate, Fields, Exclude>,
  'cache' | 'before' | 'after' | 'first' | 'last' | 'overfetch' | 'strategy'
> {
  /**
   * When populating to-many relations, the ORM streams fully merged entities instead of yielding every row.
   * You can opt out of this behavior by specifying `mergeResults: false`. This will yield every row from
   * the SQL result, but still mapped to entities, meaning that to-many collections will contain at most
   * a single item, and you will get duplicate root entities when they have multiple items in the populated
   * collection.
   *
   * @default true
   */
  mergeResults?: boolean;
}

/** Configuration for enabling/disabling named filters on a query. */
export type FilterOptions = Dictionary<boolean | Dictionary> | string[] | boolean;

/** Specifies which relations to populate and which fields to select or exclude. */
export interface LoadHint<
  Entity,
  Hint extends string = never,
  Fields extends string = never,
  Excludes extends string = never,
> {
  populate?: Populate<Entity, Hint>;
  fields?: readonly AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  exclude?: readonly AutoPath<Entity, Excludes>[];
}

/** Options for `em.find()` queries, including population, ordering, pagination, and locking. */
export interface FindOptions<
  Entity,
  Hint extends string = never,
  Fields extends string = never,
  Excludes extends string = never,
> extends LoadHint<Entity, Hint, Fields, Excludes> {
  /**
   * Where condition for populated relations. This will have no effect on the root entity.
   * With `select-in` strategy, this is applied only to the populate queries.
   * With `joined` strategy, those are applied as `join on` conditions.
   * When you use a nested condition on a to-many relation, it will produce a nested inner join,
   * discarding the collection items based on the child condition.
   */
  populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;

  /**
   * Filter condition for populated relations. This is similar to `populateWhere`, but will produce a `left join`
   * when nesting the condition. This is used for implementation of joined filters.
   */
  populateFilter?: ObjectQuery<Entity>;

  /**
   * Index-friendly alternative to `$or` for conditions that span joined relations.
   * Each array element becomes an independent branch combined via `UNION ALL` subquery:
   * `WHERE pk IN (branch_1 UNION ALL branch_2 ... branch_N)`.
   * The database plans each branch independently, enabling per-table index usage
   * (e.g. GIN trigram indexes for fuzzy search across related entities).
   * sql only
   */
  unionWhere?: ObjectQuery<Entity>[];

  /**
   * Strategy for combining `unionWhere` branches.
   * - `'union-all'` (default) — skips deduplication, faster for most use cases.
   * - `'union'` — deduplicates rows between branches; useful when branch overlap is very high.
   * sql only
   */
  unionWhereStrategy?: 'union-all' | 'union';

  /** Used for ordering of the populate queries. If not specified, the value of `options.orderBy` is used. */
  populateOrderBy?: OrderDefinition<Entity>;

  /** Per-relation overrides for populate loading behavior. Keys are populate paths (same as used in `populate`). */
  populateHints?: [Hint] extends [never] ? never : { [K in Prefixes<Hint>]?: PopulateHintOptions };

  /** Ordering of the results.Can be an object or array of objects, keys are property names, values are ordering (asc/desc) */
  orderBy?: OrderDefinition<Entity>;

  /** Control result caching for this query. Result cache is by default disabled, not to be confused with the identity map. */
  cache?: boolean | number | [string, number];

  /**
   * Limit the number of returned results. If you try to use limit/offset on a query that joins a to-many relation, pagination mechanism
   * will be triggered, resulting in a subquery condition, to apply this limit only to the root entities
   * instead of the cartesian product you get from a database in this case.
   */
  limit?: number;

  /**
   * Sets the offset. If you try to use limit/offset on a query that joins a to-many relation, pagination mechanism
   * will be triggered, resulting in a subquery condition, to apply this limit only to the root entities
   * instead of the cartesian product you get from a database in this case.
   */
  offset?: number;

  /** Fetch items `before` this cursor. */
  before?: string | { startCursor: string | null } | FilterObject<Entity>;

  /** Fetch items `after` this cursor. */
  after?: string | { endCursor: string | null } | FilterObject<Entity>;

  /** Fetch `first` N items. */
  first?: number;

  /** Fetch `last` N items. */
  last?: number;

  /** Fetch one more item than `first`/`last`, enabled automatically in `em.findByCursor` to check if there is a next page. */
  overfetch?: boolean;

  refresh?: boolean;
  convertCustomTypes?: boolean;
  disableIdentityMap?: boolean;
  schema?: string;
  flags?: QueryFlag[];
  /** sql only */
  groupBy?: string | string[];
  having?: FilterQuery<Entity>;
  /** sql only */
  strategy?: LoadStrategy | `${LoadStrategy}`;
  flushMode?: FlushMode | `${FlushMode}`;
  filters?: FilterOptions;
  /** sql only */
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
  /** sql only */
  lockTableAliases?: string[];
  ctx?: Transaction;
  connectionType?: ConnectionType;
  /** SQL: appended to FROM clause (e.g. `'force index(my_index)'`); MongoDB: index name or spec passed as `hint`. */
  indexHint?: string | Dictionary;
  /** sql only */
  comments?: string | string[];
  /** sql only */
  hintComments?: string | string[];
  /** SQL: collation name string applied as COLLATE to ORDER BY; MongoDB: CollationOptions object. */
  collation?: CollationOptions | string;
  /** mongodb only */
  maxTimeMS?: number;
  /** mongodb only */
  allowDiskUse?: boolean;
  loggerContext?: LogContext;
  logging?: LoggingOptions;
  /** @internal used to apply filters to the auto-joined relations */
  em?: EntityManager;
}

/** Options for cursor-based pagination via `em.findByCursor()`. */
export interface FindByCursorOptions<
  T extends object,
  P extends string = never,
  F extends string = never,
  E extends string = never,
  I extends boolean = true,
> extends Omit<FindAllOptions<T, P, F, E>, 'limit' | 'offset'> {
  includeCount?: I;
}

/** Options for `em.findOne()`, extends FindOptions with optimistic lock version support. */
export interface FindOneOptions<
  T,
  P extends string = never,
  F extends string = never,
  E extends string = never,
> extends Omit<FindOptions<T, P, F, E>, 'limit' | 'lockMode'> {
  lockMode?: LockMode;
  lockVersion?: number | Date;
}

/** Options for `em.findOneOrFail()`, adds a custom error handler for missing entities. */
export interface FindOneOrFailOptions<
  T extends object,
  P extends string = never,
  F extends string = never,
  E extends string = never,
> extends FindOneOptions<T, P, F, E> {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
  strict?: boolean;
}

/** Options for native insert and update operations. */
export interface NativeInsertUpdateOptions<T> {
  convertCustomTypes?: boolean;
  ctx?: Transaction;
  schema?: string;
  /** `nativeUpdate()` only option */
  upsert?: boolean;
  loggerContext?: LogContext;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
  filters?: FilterOptions;
  /** @internal */
  em?: EntityManager;
}

/** Options for batch native insert and update operations. */
export interface NativeInsertUpdateManyOptions<T> extends NativeInsertUpdateOptions<T> {
  processCollections?: boolean;
}

/** Options for `em.upsert()`, controlling conflict resolution behavior. */
export interface UpsertOptions<Entity, Fields extends string = never> extends Omit<
  NativeInsertUpdateOptions<Entity>,
  'upsert'
> {
  onConflictFields?: (keyof Entity)[] | Raw;
  onConflictAction?: 'ignore' | 'merge';
  onConflictMergeFields?: AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  onConflictExcludeFields?: AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  onConflictWhere?: FilterQuery<Entity>;
  disableIdentityMap?: boolean;
}

/** Options for `em.upsertMany()`, adds batch size control. */
export interface UpsertManyOptions<Entity, Fields extends string = never> extends UpsertOptions<Entity, Fields> {
  batchSize?: number;
}

/** Options for `em.count()` queries. */
export interface CountOptions<T extends object, P extends string = never> {
  filters?: FilterOptions;
  schema?: string;
  groupBy?: string | readonly string[];
  having?: FilterQuery<T>;
  cache?: boolean | number | [string, number];
  populate?: Populate<T, P>;
  populateWhere?: ObjectQuery<T> | PopulateHint | `${PopulateHint}`;
  populateFilter?: ObjectQuery<T>;
  /** @see FindOptions.unionWhere */
  unionWhere?: ObjectQuery<T>[];
  /** @see FindOptions.unionWhereStrategy */
  unionWhereStrategy?: 'union-all' | 'union';
  ctx?: Transaction;
  connectionType?: ConnectionType;
  flushMode?: FlushMode | `${FlushMode}`;
  /** SQL: appended to FROM clause (e.g. `'force index(my_index)'`); MongoDB: index name or spec passed as `hint`. */
  indexHint?: string | Dictionary;
  /** sql only */
  comments?: string | string[];
  /** sql only */
  hintComments?: string | string[];
  /** SQL: collation name string applied as COLLATE; MongoDB: CollationOptions object. */
  collation?: CollationOptions | string;
  /** mongodb only */
  maxTimeMS?: number;
  loggerContext?: LogContext;
  logging?: LoggingOptions;
  /** @internal used to apply filters to the auto-joined relations */
  em?: EntityManager;
}

/** Options for `em.countBy()` queries. */
export interface CountByOptions<T extends object> {
  where?: FilterQuery<T>;
  filters?: FilterOptions;
  having?: FilterQuery<T>;
  schema?: string;
  flushMode?: FlushMode | `${FlushMode}`;
  loggerContext?: LogContext;
  logging?: LoggingOptions;
}

/** Options for `em.qb().update()` operations. */
export interface UpdateOptions<T> {
  filters?: FilterOptions;
  schema?: string;
  ctx?: Transaction;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
}

/** Options for `em.qb().delete()` operations. */
export interface DeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
  /** @internal */
  em?: EntityManager;
}

/** Options for `em.nativeDelete()` operations. */
export interface NativeDeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
  /** @internal */
  em?: EntityManager;
}

/** Options for pessimistic and optimistic lock operations. */
export interface LockOptions extends DriverMethodOptions {
  lockMode?: LockMode;
  lockVersion?: number | Date;
  lockTableAliases?: string[];
  logging?: LoggingOptions;
}

/** Base options shared by all driver methods (transaction context, schema, logging). */
export interface DriverMethodOptions {
  ctx?: Transaction;
  schema?: string;
  loggerContext?: LogContext;
}

/** MongoDB-style collation options for locale-aware string comparison. */
export interface CollationOptions {
  locale: string;
  caseLevel?: boolean;
  caseFirst?: string;
  strength?: number;
  numericOrdering?: boolean;
  alternate?: string;
  maxVariable?: string;
  backwards?: boolean;
}

/** Options for `em.getReference()`, controlling wrapping and type conversion. */
export interface GetReferenceOptions {
  wrapped?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
  /**
   * Property name to use for identity map lookup instead of the primary key.
   * This is useful for creating references by unique non-PK properties.
   */
  key?: string;
}
