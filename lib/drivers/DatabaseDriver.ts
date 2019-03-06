import { MikroORMOptions } from '../MikroORM';
import { DriverConfig, IDatabaseDriver } from './IDatabaseDriver';
import { IEntity, IPrimaryKey, UnderscoreNamingStrategy, Utils, QueryOrder } from '..';
import { EntityData, EntityMetadata, EntityProperty, IEntityType } from '../decorators/Entity';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { Logger } from '../utils/Logger';
import { Connection } from '../connections/Connection';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  protected readonly connection: Connection;
  protected readonly metadata = MetadataStorage.getMetadata();
  protected transactionLevel = 0;
  protected transactionRolledBack = false;

  constructor(protected readonly options: MikroORMOptions,
              protected readonly logger: Logger) { }

  abstract async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]>;

  abstract async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T | null>;

  abstract async nativeInsert<T extends IEntity>(entityName: string, data: EntityData<T>): Promise<IPrimaryKey>;

  abstract async nativeUpdate<T extends IEntity>(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: EntityData<T>): Promise<number>;

  abstract async nativeDelete<T extends IEntity>(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number>;

  abstract async count<T extends IEntity>(entityName: string, where: FilterQuery<T>): Promise<number>;

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends IEntity>(prop: EntityProperty, owners: IPrimaryKey[]): Promise<Record<string, T[]>> {
    if (!this.getConfig().usesPivotTable) {
      throw new Error(`${this.constructor.name} does not use pivot tables`);
    }

    const fk1 = prop.joinColumn;
    const fk2 = prop.inverseJoinColumn;
    const pivotTable = prop.owner ? prop.pivotTable : this.metadata[prop.type].properties[prop.mappedBy].pivotTable;
    const orderBy = { [`${pivotTable}.${this.metadata[pivotTable].primaryKey}`]: QueryOrder.ASC };
    const items = owners.length ? await this.find(prop.type, { [fk1]: { $in: owners } }, [pivotTable], orderBy) : [];

    const map: Record<string, T[]> = {};
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

  mapResult<T extends IEntityType<T>>(result: T, meta: EntityMetadata): T {
    if (!result || !meta) {
      return result || null;
    }

    const ret = Object.assign({}, result);

    Object.values(meta.properties).forEach(prop => {
      if (prop.fieldName && prop.fieldName in ret) {
        Utils.renameKey(ret, prop.fieldName, prop.name);
      }
    });

    return ret;
  }

  getConnection(): C {
    return this.connection as C;
  }

  async beginTransaction(): Promise<void> {
    this.transactionLevel++;
    await this.runTransaction('beginTransaction');
  }

  async commit(): Promise<void> {
    if (this.transactionRolledBack) {
      throw new Error('Transaction commit failed because the transaction has been marked for rollback only');
    }

    await this.runTransaction('commit');
    this.transactionLevel = Math.max(this.transactionLevel - 1, 0);
  }

  async rollback(): Promise<void> {
    await this.runTransaction('rollback');

    if (this.transactionLevel === 1) {
      this.transactionRolledBack = false;
    } else if (!this.getConfig().supportsSavePoints) {
      this.transactionRolledBack = true;
    }

    this.transactionLevel = Math.max(this.transactionLevel - 1, 0);
  }

  async transactional(cb: () => Promise<any>): Promise<any> {
    try {
      await this.beginTransaction();
      const ret = await cb();
      await this.commit();

      return ret;
    } catch (e) {
      await this.rollback();
      throw e;
    }
  }

  isInTransaction(): boolean {
    return this.transactionLevel > 0;
  }

  getConfig(): DriverConfig {
    return {
      usesPivotTable: true,
      supportsTransactions: true,
      supportsSavePoints: false,
      namingStrategy: UnderscoreNamingStrategy,
    };
  }

  private async runTransaction(method: 'beginTransaction' | 'commit' | 'rollback'): Promise<void> {
    if (this.transactionLevel === 1 || this.getConfig().supportsSavePoints) {
      const useSavepoint = this.transactionLevel !== 1 && this.getConfig().supportsSavePoints;
      await this.connection[method](useSavepoint ? this.getSavePointName() : undefined);
    }
  }

  private getSavePointName(): string {
    return `${this.constructor.name}_${this.transactionLevel}`;
  }

}

export type FilterQuery<T> = Partial<T> | Record<string, any>;
