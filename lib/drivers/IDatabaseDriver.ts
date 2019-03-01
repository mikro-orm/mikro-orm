import { FilterQuery } from './DatabaseDriver';
import { IEntity, IPrimaryKey, NamingStrategy, QueryOrder } from '..';
import { EntityData, EntityProperty } from '../decorators/Entity';
import { Connection } from '../connections/Connection';

export interface IDatabaseDriver<C extends Connection = Connection> {

  getConnection(): C;

  /**
   * Finds selection of entities
   */
  find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: { [p: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate?: string[]): Promise<T | null>;

  nativeInsert<T extends IEntity>(entityName: string, data: EntityData<T>): Promise<IPrimaryKey>;

  nativeUpdate<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, data: EntityData<T>): Promise<number>;

  nativeDelete<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey): Promise<number>;

  count<T extends IEntity>(entityName: string, where: FilterQuery<T>): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  /**
   * Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectID to string)
   */
  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T;

  /**
   * Converts scalar primary key representation to native driver wrapper (e.g. string to mongodb's ObjectID)
   */
  denormalizePrimaryKey(data: number | string): IPrimaryKey;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable<T extends IEntity>(prop: EntityProperty, owners: IPrimaryKey[]): Promise<{ [key: string]: T[] }>;

  /**
   * Begins a transaction (if supported)
   */
  beginTransaction(): Promise<void>;

  /**
   * Commits statements in a transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback changes in a transaction
   */
  rollback(): Promise<void>;

  /**
   * Runs callback inside transaction
   */
  transactional(cb: () => Promise<any>): Promise<any>;

  isInTransaction(): boolean;

  getConfig(): DriverConfig;

}

export interface DriverConfig {
  usesPivotTable: boolean;
  supportsTransactions: boolean;
  supportsSavePoints: boolean;
  namingStrategy: { new(): NamingStrategy };
}
