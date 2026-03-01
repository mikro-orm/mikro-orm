import type {
  ConnectionType, Constructor, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary, Dictionary,
  IPrimaryKey, PopulateOptions, EntityDictionary, AutoPath, ObjectQuery, FilterObject, Populate, EntityName,
  PopulateHintOptions, Prefixes,
} from '../typings.js';
import type { Connection, QueryResult, Transaction } from '../connections/Connection.js';
import type { FlushMode, LockMode, QueryOrderMap, QueryFlag, LoadStrategy, PopulateHint, PopulatePath } from '../enums.js';
import type { Platform } from '../platforms/Platform.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Collection } from '../entity/Collection.js';
import type { EntityManager } from '../EntityManager.js';
import type { DriverException } from '../exceptions.js';
import type { Configuration } from '../utils/Configuration.js';
import type { MikroORM } from '../MikroORM.js';
import type { LoggingOptions, LogContext } from '../logging/Logger.js';
import type { Raw } from '../utils/RawQueryFragment.js';

export const EntityManagerType = Symbol('EntityManagerType');

export interface IDatabaseDriver<C extends Connection = Connection> {

  [EntityManagerType]: EntityManager<this>;
  readonly config: Configuration;

  createEntityManager(useContext?: boolean): this[typeof EntityManagerType];

  connect(options?: { skipOnConnect?: boolean }): Promise<C>;

  close(force?: boolean): Promise<void>;

  reconnect(options?: { skipOnConnect?: boolean }): Promise<C>;

  getConnection(type?: ConnectionType): C;

  /**
   * Finds selection of entities
   */
  find<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T, P, F, E>): Promise<EntityData<T>[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOptions<T, P, F, E>): Promise<EntityData<T> | null>;

  findVirtual<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, any, any, any>): Promise<EntityData<T>[]>;

  stream<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: StreamOptions<T>): AsyncIterableIterator<T>;

  nativeInsert<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeInsertMany<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>, transform?: (sql: string) => string): Promise<QueryResult<T>>;

  nativeUpdate<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeUpdateMany<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>[], data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  nativeDelete<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options?: NativeDeleteOptions<T>): Promise<QueryResult<T>>;

  syncCollections<T extends object, O extends object>(collections: Iterable<Collection<T, O>>, options?: DriverMethodOptions): Promise<void>;

  count<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options?: CountOptions<T, P>): Promise<number>;

  aggregate(entityName: EntityName, pipeline: any[]): Promise<any[]>;

  mapResult<T extends object>(result: EntityDictionary<T>, meta: EntityMetadata<T>, populate?: PopulateOptions<T>[]): EntityData<T> | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<T>, orderBy?: OrderDefinition<T>, ctx?: Transaction, options?: FindOptions<T, any, any, any>, pivotJoin?: boolean): Promise<Dictionary<T[]>>;

  getPlatform(): Platform;

  setMetadata(metadata: MetadataStorage): void;

  getMetadata(): MetadataStorage;

  /**
   * Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
   * for SQL drivers it also returns `knex` in the array as connectors are not used directly there
   */
  getDependencies(): string[];

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

export type EntityField<T, P extends string = PopulatePath.ALL> = keyof T | PopulatePath.ALL | AutoPath<T, P, `${PopulatePath.ALL}`>;

export type OrderDefinition<T> = (QueryOrderMap<T> & { 0?: never }) | QueryOrderMap<T>[];

export interface FindAllOptions<T, P extends string = never, F extends string = '*', E extends string = never> extends FindOptions<T, P, F, E> {
  where?: FilterQuery<T>;
}

export interface StreamOptions<
  Entity,
  Populate extends string = never,
  Fields extends string = '*',
  Exclude extends string = never,
> extends Omit<FindAllOptions<Entity, Populate, Fields, Exclude>, 'cache' | 'before' | 'after' | 'first' | 'last' | 'overfetch' | 'strategy'> {
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

export type FilterOptions = Dictionary<boolean | Dictionary> | string[] | boolean;

export interface LoadHint<
  Entity,
  Hint extends string = never,
  Fields extends string = PopulatePath.ALL,
  Excludes extends string = never,
> {
  populate?: Populate<Entity, Hint>;
  fields?: readonly AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  exclude?: readonly AutoPath<Entity, Excludes>[];
}

export interface FindOptions<
  Entity,
  Hint extends string = never,
  Fields extends string = PopulatePath.ALL,
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

export interface FindByCursorOptions<T extends object, P extends string = never, F extends string = '*', E extends string = never, I extends boolean = true> extends Omit<FindAllOptions<T, P, F, E>, 'limit' | 'offset'> {
  includeCount?: I;
}

export interface FindOneOptions<T, P extends string = never, F extends string = '*', E extends string = never> extends Omit<FindOptions<T, P, F, E>, 'limit' | 'lockMode'> {
  lockMode?: LockMode;
  lockVersion?: number | Date;
}

export interface FindOneOrFailOptions<T extends object, P extends string = never, F extends string = '*', E extends string = never> extends FindOneOptions<T, P, F, E> {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
  strict?: boolean;
}

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

export interface NativeInsertUpdateManyOptions<T> extends NativeInsertUpdateOptions<T> {
  processCollections?: boolean;
}

export interface UpsertOptions<Entity, Fields extends string = never> extends Omit<NativeInsertUpdateOptions<Entity>, 'upsert'> {
  onConflictFields?: (keyof Entity)[] | Raw;
  onConflictAction?: 'ignore' | 'merge';
  onConflictMergeFields?: AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  onConflictExcludeFields?: AutoPath<Entity, Fields, `${PopulatePath.ALL}`>[];
  onConflictWhere?: FilterQuery<Entity>;
  disableIdentityMap?: boolean;
}

export interface UpsertManyOptions<Entity, Fields extends string = never> extends UpsertOptions<Entity, Fields> {
  batchSize?: number;
}

export interface CountOptions<T extends object, P extends string = never>  {
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

export interface UpdateOptions<T> {
  filters?: FilterOptions;
  schema?: string;
  ctx?: Transaction;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
}

export interface DeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
  /** @internal */
  em?: EntityManager;
}

export interface NativeDeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
  /** sql only */
  unionWhere?: ObjectQuery<T>[];
  /** sql only */
  unionWhereStrategy?: 'union-all' | 'union';
  /** @internal */
  em?: EntityManager;
}

export interface LockOptions extends DriverMethodOptions {
  lockMode?: LockMode;
  lockVersion?: number | Date;
  lockTableAliases?: string[];
  logging?: LoggingOptions;
}

export interface DriverMethodOptions {
  ctx?: Transaction;
  schema?: string;
  loggerContext?: LogContext;
}

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
