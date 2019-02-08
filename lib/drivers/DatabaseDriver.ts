import { MikroORMOptions } from '../MikroORM';
import { IDatabaseDriver } from './IDatabaseDriver';
import { IEntity, IPrimaryKey, NamingStrategy, UnderscoreNamingStrategy } from '..';
import { EntityMetadata, EntityProperty } from '../decorators/Entity';
import { Utils } from '../utils/Utils';
import { QueryOrder } from '../QueryBuilder';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { Logger } from '../utils/Logger';

export abstract class DatabaseDriver implements IDatabaseDriver {

  protected readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(protected readonly options: MikroORMOptions,
              protected readonly logger: Logger) {
    this.metadata = MetadataStorage.getMetadata();
  }

  abstract async connect(): Promise<void>;

  abstract async isConnected(): Promise<boolean>;

  abstract async close(force?: boolean): Promise<void>;

  abstract async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: { [p: string]: 1 | -1 }, limit?: number, offset?: number): Promise<T[]>;

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

  async loadFromPivotTable(prop: EntityProperty, owners: IPrimaryKey[]): Promise<{ [key: string]: IPrimaryKey[] }> {
    if (!this.usesPivotTable()) {
      throw new Error(`${this.constructor.name} does not use pivot tables`);
    }

    const fk1 = prop.joinColumn;
    const fk2 = prop.inverseJoinColumn;
    const pivotTable = prop.owner ? prop.pivotTable : this.metadata[prop.type].properties[prop.mappedBy].pivotTable;
    const orderBy = { [`${pivotTable}.${this.metadata[pivotTable].primaryKey}`]: QueryOrder.ASC };
    const items = owners.length ? await this.find(prop.type, { [fk1]: { $in: owners } }, [pivotTable], orderBy) : [];

    const map = {} as any;
    owners.forEach(owner => map['' + owner] = []);
    items.forEach((item: any) => {
      map['' + item[fk1]].push(item);
      delete item[fk1];
      delete item[fk2];
    });

    return map;
  }

  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T {
    return data as T;
  }

  denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return data;
  }

  getTableName(entityName: string): string {
    return this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
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

  protected logQuery(query: string): void {
    this.logger.debug(`[query-logger] ${query}`);
  }

}

export type FilterQuery<T> = {
  [P in keyof T]?: T[P];
} | { [key: string]: any };
