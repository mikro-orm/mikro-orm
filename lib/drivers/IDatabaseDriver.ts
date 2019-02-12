import { FilterQuery } from './DatabaseDriver';
import { IEntity, IPrimaryKey, NamingStrategy } from '..';
import { EntityProperty } from '../decorators/Entity';
import { Connection } from '../connections/Connection';

export interface IDatabaseDriver<C extends Connection = Connection> {

  getConnection(): C;

  /**
   * Finds selection of entities
   */
  find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: { [p: string]: 1 | -1 }, limit?: number, offset?: number): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate?: string[]): Promise<T | null>;

  nativeInsert(entityName: string, data: any): Promise<IPrimaryKey>;

  nativeUpdate(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: any): Promise<number>;

  nativeDelete(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  count(entityName: string, where: any): Promise<number>;

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
  loadFromPivotTable(prop: EntityProperty, owners: IPrimaryKey[]): Promise<{ [key: string]: IPrimaryKey[] }>;

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
