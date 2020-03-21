import { EntityData, EntityMetadata, EntityProperty, AnyEntity, FilterQuery, Primary, Dictionary } from '../typings';
import { Connection, QueryResult, Transaction } from '../connections';
import { QueryOrderMap } from '../query';
import { Platform } from '../platforms';
import { MetadataStorage } from '../metadata';
import { LockMode } from '../unit-of-work';
import { Collection } from '../entity';

export interface IDatabaseDriver<C extends Connection = Connection> {

  connect(): Promise<C>;

  close(force?: boolean): Promise<void>;

  reconnect(): Promise<C>;

  getConnection(type?: 'read' | 'write'): C;

  /**
   * Finds selection of entities
   */
  find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOptions, ctx?: Transaction): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions, ctx?: Transaction): Promise<T | null>;

  nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<QueryResult>;

  syncCollection<T extends AnyEntity<T>, O extends AnyEntity<O>>(collection: Collection<T, O>, ctx?: Transaction): Promise<void>;

  count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  mapResult<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata): T | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends AnyEntity<T>, O extends AnyEntity<O>>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Dictionary<T[]>>;

  getPlatform(): Platform;

  setMetadata(metadata: MetadataStorage): void;

  ensureIndexes(): Promise<void>;

  /**
   * Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
   * for SQL drivers it also returns `knex` in the array as connectors are not used directly there
   */
  getDependencies(): string[];

}

export interface FindOptions {
  populate?: string[] | boolean;
  orderBy?: QueryOrderMap;
  limit?: number;
  offset?: number;
  refresh?: boolean;
  fields?: string[];
  schema?: string;
}

export interface FindOneOptions {
  populate?: string[] | boolean;
  orderBy?: QueryOrderMap;
  lockMode?: LockMode;
  lockVersion?: number | Date;
  refresh?: boolean;
  fields?: string[];
  schema?: string;
}
