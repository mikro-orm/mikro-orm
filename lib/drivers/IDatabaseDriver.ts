import { FilterQuery } from './DatabaseDriver';
import { EntityProperty, IEntity, IPrimaryKey, NamingStrategy } from '..';

export interface IDatabaseDriver {

  /**
   * Establishes connection to database
   */
  connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  close(force?: boolean): Promise<void>;

  /**
   * Finds selection of entities
   */
  find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: { [p: string]: 1 | -1 }, limit?: number, offset?: number): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate?: string[]): Promise<T>;

  nativeInsert(entityName: string, data: any): Promise<IPrimaryKey>;

  nativeUpdate(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: any): Promise<number>;

  nativeDelete(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number>;

  aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  count(entityName: string, where: any): Promise<number>;

  getTableName(entityName: string): string;

  /**
   * Returns default client url for given driver (e.g. mongodb://localhost:27017 for mongodb)
   */
  getDefaultClientUrl(): string;

  getDefaultNamingStrategy(): { new (): NamingStrategy };

  /**
   * Begins a transaction (if supported)
   */
  begin(savepoint?: string): Promise<void>;

  /**
   * Commits statements in a transaction
   */
  commit(savepoint?: string): Promise<void>;

  /**
   * Rollback changes in a transaction
   */
  rollback(savepoint?: string): Promise<void>;

  /**
   * Normalizes primary key wrapper to scalar value (e.g. mongodb's ObjectID to string)
   */
  normalizePrimaryKey(data: IPrimaryKey): number | string;

  /**
   * De-normalizes primary key wrapper to value required by driver (e.g. string to mongodb's ObjectID)
   */
  denormalizePrimaryKey(data: any): IPrimaryKey;

  /**
   * NoSQL databases do require pivot table for M:N
   */
  usesPivotTable(): boolean;

  /**
   * When driver uses pivot tables for M:N, this method will load identifiers for given collections from them
   */
  loadFromPivotTable(prop: EntityProperty, owners: IPrimaryKey[]): Promise<{ [key: number]: IPrimaryKey[] }>;

}
