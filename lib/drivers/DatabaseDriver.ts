import { getMetadataStorage, MikroORMOptions } from '../MikroORM';
import { IDatabaseDriver } from './IDatabaseDriver';
import { IEntity, IPrimaryKey, EntityMetadata, NamingStrategy, UnderscoreNamingStrategy } from '..';
import { Utils } from '../Utils';

export abstract class DatabaseDriver implements IDatabaseDriver {

  protected readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(protected options: MikroORMOptions) {
    this.metadata = getMetadataStorage();
  }

  abstract async connect(): Promise<void>;

  abstract async isConnected(): Promise<boolean>;

  abstract async close(force?: boolean): Promise<void>;

  abstract async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]>;

  abstract async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T>;

  abstract async nativeInsert(entityName: string, data: any): Promise<IPrimaryKey>;

  abstract async nativeUpdate(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: any): Promise<number>;

  abstract async nativeDelete(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number>;

  abstract async count(entityName: string, where: any): Promise<number>;

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  abstract getDefaultClientUrl(): string;

  async begin(savepoint: string): Promise<void> {
    throw new Error(`Transactions are not supported by ${this.constructor.name} driver`);
  }

  async commit(savepoint: string): Promise<void> {
    throw new Error(`Transactions are not supported by ${this.constructor.name} driver`);
  }

  async rollback(savepoint: string): Promise<void> {
    throw new Error(`Transactions are not supported by ${this.constructor.name} driver`);
  }

  normalizePrimaryKey(data: IPrimaryKey): number | string {
    return data as number | string;
  }

  denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return data;
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
      return result || null;
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
