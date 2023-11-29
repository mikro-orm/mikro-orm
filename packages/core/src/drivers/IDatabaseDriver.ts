import type {
  ConnectionType, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary, Dictionary, QBFilterQuery,
  IPrimaryKey, PopulateOptions, EntityDictionary, AutoPath, ObjectQuery, FilterObject, Populate,
} from '../typings';
import type { Connection, QueryResult, Transaction } from '../connections';
import type { FlushMode, LockMode, QueryOrderMap, QueryFlag, LoadStrategy, PopulateHint } from '../enums';
import type { Platform } from '../platforms';
import type { MetadataStorage } from '../metadata';
import type { Collection } from '../entity/Collection';
import type { EntityManager } from '../EntityManager';
import type { DriverException } from '../exceptions';
import type { Configuration } from '../utils/Configuration';
import type { LoggingOptions, LogContext } from '../logging';

export const EntityManagerType = Symbol('EntityManagerType');

export interface IDatabaseDriver<C extends Connection = Connection> {

  [EntityManagerType]: EntityManager<this>;
  readonly config: Configuration;

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType];

  connect(): Promise<C>;

  close(force?: boolean): Promise<void>;

  reconnect(): Promise<C>;

  getConnection(type?: ConnectionType): C;

  /**
   * Finds selection of entities
   */
  find<T extends object, P extends string = never, F extends string = '*'>(entityName: string, where: FilterQuery<T>, options?: FindOptions<T, P, F>): Promise<EntityData<T>[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends object, P extends string = never, F extends string = '*'>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P, F>): Promise<EntityData<T> | null>;

  findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any, any>): Promise<EntityData<T>[]>;

  nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  nativeDelete<T extends object>(entityName: string, where: FilterQuery<T>, options?: NativeDeleteOptions<T>): Promise<QueryResult<T>>;

  syncCollections<T extends object, O extends object>(collections: Iterable<Collection<T, O>>, options?: DriverMethodOptions): Promise<void>;

  count<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: CountOptions<T, P>): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  mapResult<T extends object>(result: EntityDictionary<T>, meta: EntityMetadata<T>, populate?: PopulateOptions<T>[]): EntityData<T> | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<T>, orderBy?: OrderDefinition<T>, ctx?: Transaction, options?: FindOptions<T, any, any>, pivotJoin?: boolean): Promise<Dictionary<T[]>>;

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
  getSchemaName(meta?: EntityMetadata, options?: { schema?: string }): string | undefined;

}

export type EntityField<T, P extends string = never> = keyof T | '*' | AutoPath<T, P, '*'>;

export type OrderDefinition<T> = (QueryOrderMap<T> & { 0?: never }) | QueryOrderMap<T>[];

export interface FindAllOptions<T, P extends string = never, F extends string = never> extends FindOptions<T, P, F> {
  where?: FilterQuery<T>;
}

export type FilterOptions = Dictionary<boolean | Dictionary> | string[] | boolean;

export interface FindOptions<T, P extends string = never, F extends string = never> {
  where?: FilterQuery<T>;
  populate?: Populate<T, P>;
  populateWhere?: ObjectQuery<T> | PopulateHint | `${PopulateHint}`;
  populateOrderBy?: OrderDefinition<T>;
  fields?: readonly AutoPath<T, F, '*'>[];
  orderBy?: OrderDefinition<T>;
  cache?: boolean | number | [string, number];
  limit?: number;
  offset?: number;
  /** Fetch items `before` this cursor. */
  before?: string | { startCursor: string | null } | FilterObject<T>;
  /** Fetch items `after` this cursor. */
  after?: string | { endCursor: string | null } | FilterObject<T>;
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
  having?: QBFilterQuery<T>;
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
  /** sql only */
  indexHint?: string;
  /** sql only */
  comments?: string | string[];
  /** sql only */
  hintComments?: string | string[];
  loggerContext?: LogContext;
  logging?: LoggingOptions;
}

export interface FindByCursorOptions<T extends object, P extends string = never, F extends string = never> extends Omit<FindOptions<T, P, F>, 'limit' | 'offset'> {
}

export interface FindOneOptions<T extends object, P extends string = never, F extends string = never> extends Omit<FindOptions<T, P, F>, 'limit' | 'lockMode'> {
  lockMode?: LockMode;
  lockVersion?: number | Date;
}

export interface FindOneOrFailOptions<T extends object, P extends string = never, F extends string = never> extends FindOneOptions<T, P, F> {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
  strict?: boolean;
}

export interface NativeInsertUpdateOptions<T> {
  convertCustomTypes?: boolean;
  ctx?: Transaction;
  schema?: string;
  /** `nativeUpdate()` only option */
  upsert?: boolean;
}

export interface NativeInsertUpdateManyOptions<T> extends NativeInsertUpdateOptions<T> {
  processCollections?: boolean;
}

export interface UpsertOptions<Entity> extends Omit<NativeInsertUpdateOptions<Entity>, 'upsert'> {
  onConflictFields?: (keyof Entity)[];
  onConflictAction?: 'ignore' | 'merge';
  onConflictMergeFields?: (keyof Entity)[];
  onConflictExcludeFields?: (keyof Entity)[];
}

export interface UpsertManyOptions<Entity> extends UpsertOptions<Entity> {
  batchSize?: number;
}

export interface CountOptions<T extends object, P extends string = never>  {
  filters?: FilterOptions;
  schema?: string;
  groupBy?: string | readonly string[];
  having?: QBFilterQuery<T>;
  cache?: boolean | number | [string, number];
  populate?: Populate<T, P>;
  ctx?: Transaction;
  connectionType?: ConnectionType;
  /** sql only */
  indexHint?: string;
  /** sql only */
  comments?: string | string[];
  /** sql only */
  hintComments?: string | string[];
}

export interface UpdateOptions<T> {
  filters?: FilterOptions;
  schema?: string;
  ctx?: Transaction;
}

export interface DeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
}

export interface NativeDeleteOptions<T> extends DriverMethodOptions {
  filters?: FilterOptions;
}

export interface LockOptions extends DriverMethodOptions {
  lockMode?: LockMode;
  lockVersion?: number | Date;
  lockTableAliases?: string[];
}

export interface DriverMethodOptions {
  ctx?: Transaction;
  schema?: string;
}

export interface GetReferenceOptions {
  wrapped?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
}
