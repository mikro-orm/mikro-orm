import { EntityData, EntityMetadata, EntityProperty, AnyEntity, FilterQuery, Primary } from '../types';
import { Connection, QueryResult, Transaction } from '../connections';
import { QueryOrderMap } from '../query';
import { Platform } from '../platforms';
import { LockMode } from '../unit-of-work';
import { MetadataStorage } from '../metadata';

export interface IDatabaseDriver<C extends Connection = Connection> {

  connect(): Promise<C>;

  close(force?: boolean): Promise<void>;

  getConnection(type?: 'read' | 'write'): C;

  /**
   * Finds selection of entities
   */
  find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: QueryOrderMap, fields?: string[], limit?: number, offset?: number, ctx?: Transaction): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: QueryOrderMap, fields?: string[], lockMode?: LockMode, ctx?: Transaction): Promise<T | null>;

  nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<QueryResult>;

  count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  mapResult<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata): T | null;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends AnyEntity<T>>(prop: EntityProperty, owners: Primary<T>[], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Record<string, T[]>>;

  getPlatform(): Platform;

  setMetadata(metadata: MetadataStorage): void;

  /**
   * Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
   * for SQL drivers it also returns `knex` in the array as connectors are not used directly there
   */
  getDependencies(): string[];

}
