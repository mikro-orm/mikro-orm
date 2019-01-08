import { getMetadataStorage, Options } from '../MikroORM';
import { BaseEntity, EntityMetadata } from '../BaseEntity';
import { IDatabaseDriver } from './IDatabaseDriver';
import { IPrimaryKey } from '..';

export abstract class DatabaseDriver implements IDatabaseDriver {

  protected readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(protected options: Options) {
    this.metadata = getMetadataStorage();
  }

  /**
   * Establishes connection to database
   */
  abstract async connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract isConnected(): boolean;

  /**
   * Closes the database connection (aka disconnect)
   */
  abstract close(force: boolean);

  /**
   * Finds selection of entities
   */
  abstract async find<T extends BaseEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  abstract async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T>;

  abstract async nativeInsert(entityName: string, data: any): Promise<IPrimaryKey>;

  abstract async nativeUpdate(entityName: string, where: FilterQuery<BaseEntity> | IPrimaryKey, data: any): Promise<number>;

  abstract async nativeDelete(entityName: string, where: FilterQuery<BaseEntity> | IPrimaryKey): Promise<number>;

  abstract async aggregate(entityName: string, pipeline: any[]): Promise<any[]>;

  abstract async count(entityName: string, where: any): Promise<number>;

  /**
   * Returns default client url for given driver (e.g. mongodb://localhost:27017 for mongodb)
   */
  abstract getDefaultClientUrl(): string;

  /**
   * Begins a transaction (if supported)
   */
  async begin(savepoint: string): Promise<void> { }

  /**
   * Commits statements in a transaction
   */
  async commit(savepoint: string): Promise<void> { }

  /**
   * Rollback changes in a transaction
   */
  async rollback(savepoint: string): Promise<void> { }

  /**
   * Normalizes primary key wrapper to string value (e.g. mongodb's ObjectID)
   */
  normalizePrimaryKey(where: any): string {
    return where;
  }

  getTableName(entityName: string): string {
    return this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
  }

  protected logQuery(query: string): void {
    if (this.options.debug) {
      this.options.logger(`[query-logger] ${query}`);
    }
  }

  getDefaultForeignKey(): string {
    return 'id';
  }

  usesPivotTable(): boolean {
    return true;
  }

}

export type FilterQuery<T> = {
  [P in keyof T]?: T[P];
} | { [key: string]: any };
