import { getMetadataStorage, MikroORMOptions } from '../MikroORM';
import { EntityMetadata } from '../BaseEntity';
import { IDatabaseDriver } from './IDatabaseDriver';
import { IEntity, IPrimaryKey } from '..';
import { NamingStrategy } from '../naming-strategy/NamingStrategy';
import { UnderscoreNamingStrategy } from '../naming-strategy/UnderscoreNamingStrategy';
import { Utils } from '../Utils';

export abstract class DatabaseDriver implements IDatabaseDriver {

  protected readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(protected options: MikroORMOptions) {
    this.metadata = getMetadataStorage();
  }

  /**
   * Establishes connection to database
   */
  abstract async connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract async isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  abstract async close(force: boolean): Promise<void>;

  /**
   * Finds selection of entities
   */
  abstract async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]>;

  /**
   * Finds single entity (table row, document)
   */
  abstract async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T>;

  abstract async nativeInsert(entityName: string, data: any): Promise<IPrimaryKey>;

  abstract async nativeUpdate(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: any): Promise<number>;

  abstract async nativeDelete(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number>;

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

  usesPivotTable(): boolean {
    return true;
  }

  getDefaultNamingStrategy(): { new (): NamingStrategy } {
    return UnderscoreNamingStrategy;
  }

  mapResult(result: any, meta: EntityMetadata): any {
    if (!result || !meta) {
      return result;
    }

    const ret = Object.assign({}, result);

    Object.keys(meta.properties).forEach(p => {
      const prop = meta.properties[p];

      if (prop.fieldName && prop.fieldName in ret) {
        Utils.renameKey(ret, prop.fieldName, prop.name);
      }
    });

    return ret;
  }

}

export type FilterQuery<T> = {
  [P in keyof T]?: T[P];
} | { [key: string]: any };
