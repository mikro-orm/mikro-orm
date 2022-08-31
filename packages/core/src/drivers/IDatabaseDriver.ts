import type {
  ConnectionType, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary, Dictionary, QBFilterQuery,
  IPrimaryKey, PopulateOptions, EntityDictionary, ExpandProperty, AutoPath, ObjectQuery,
} from '../typings';
import type { Connection, QueryResult, Transaction } from '../connections';
import type { FlushMode, LockMode, QueryOrderMap, QueryFlag, LoadStrategy, PopulateHint } from '../enums';
import type { Platform } from '../platforms';
import type { MetadataStorage } from '../metadata';
import type { Collection } from '../entity/Collection';
import type { EntityManager } from '../EntityManager';
import type { DriverException } from '../exceptions';
import type { Configuration } from '../utils/Configuration';

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
  find<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<EntityData<T>[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<EntityData<T> | null>;

  findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any>): Promise<EntityData<T>[]>;

  nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  nativeDelete<T extends object>(entityName: string, where: FilterQuery<T>, options?: NativeDeleteOptions<T>): Promise<QueryResult<T>>;

  syncCollection<T extends object, O extends object>(collection: Collection<T, O>, options?: DriverMethodOptions): Promise<void>;

  count<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: CountOptions<T, P>): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  mapResult<T extends object>(result: EntityDictionary<T>, meta: EntityMetadata<T>, populate?: PopulateOptions<T>[]): EntityData<T> | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<T>, orderBy?: QueryOrderMap<T>[], ctx?: Transaction, options?: FindOptions<T, any>): Promise<Dictionary<T[]>>;

  getPlatform(): Platform;

  setMetadata(metadata: MetadataStorage): void;

  getMetadata(): MetadataStorage;

  ensureIndexes(): Promise<void>;

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

type FieldsMap<T, P extends string = never> = { [K in keyof T]?: EntityField<ExpandProperty<T[K]>>[] };
export type EntityField<T, P extends string = never> = keyof T | '*' | AutoPath<T, P, '*'> | FieldsMap<T, P>;

export interface FindOptions<T, P extends string = never> {
  populate?: readonly AutoPath<T, P>[] | boolean;
  populateWhere?: ObjectQuery<T> | PopulateHint;
  orderBy?: (QueryOrderMap<T> & { 0?: never }) | QueryOrderMap<T>[];
  cache?: boolean | number | [string, number];
  limit?: number;
  offset?: number;
  refresh?: boolean;
  convertCustomTypes?: boolean;
  disableIdentityMap?: boolean;
  fields?: readonly EntityField<T, P>[];
  schema?: string;
  flags?: QueryFlag[];
  groupBy?: string | string[];
  having?: QBFilterQuery<T>;
  strategy?: LoadStrategy;
  flushMode?: FlushMode;
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
  lockTableAliases?: string[];
  ctx?: Transaction;
  connectionType?: ConnectionType;
}

export interface FindOneOptions<T extends object, P extends string = never> extends Omit<FindOptions<T, P>, 'limit' | 'offset' | 'lockMode'> {
  lockMode?: LockMode;
  lockVersion?: number | Date;
}

export interface FindOneOrFailOptions<T extends object, P extends string = never> extends FindOneOptions<T, P> {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
  strict?: boolean;
}

export interface NativeInsertUpdateOptions<T> {
  convertCustomTypes?: boolean;
  ctx?: Transaction;
  schema?: string;
}

export interface NativeInsertUpdateManyOptions<T> extends NativeInsertUpdateOptions<T> {
  processCollections?: boolean;
}

export interface CountOptions<T extends object, P extends string = never>  {
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
  schema?: string;
  groupBy?: string | readonly string[];
  having?: QBFilterQuery<T>;
  cache?: boolean | number | [string, number];
  populate?: readonly AutoPath<T, P>[] | boolean;
  ctx?: Transaction;
  connectionType?: ConnectionType;
}

export interface UpdateOptions<T>  {
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
  schema?: string;
  ctx?: Transaction;
}

export interface DeleteOptions<T> extends DriverMethodOptions {
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
}

export interface NativeDeleteOptions<T> extends DriverMethodOptions {
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
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
