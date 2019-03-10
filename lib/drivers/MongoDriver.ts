import { FilterQuery, ObjectID } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { MongoConnection } from '../connections/MongoConnection';
import { EntityData, IEntityType, IPrimaryKey } from '../decorators';
import { QueryOrder } from '../query';
import { Utils } from '../utils';
import { DriverConfig } from './IDatabaseDriver';
import { MongoNamingStrategy } from '../naming-strategy';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  protected readonly connection = new MongoConnection(this.config);

  async find<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: Record<string, QueryOrder>, limit: number, offset: number): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.connection.find<T>(this.metadata[entityName].collection, where, orderBy, limit, offset);

    return res.map((r: T) => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as string) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    const res = await this.connection.find<T>(this.metadata[entityName].collection, where, {}, 1);

    return this.mapResult(res[0], this.metadata[entityName]);
  }

  async count<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.connection.countDocuments<T>(this.metadata[entityName].collection, where);
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<ObjectID> {
    data = this.renameFields(entityName, data);
    const res = await this.connection.insertOne<EntityData<T>>(this.metadata[entityName].collection, data);

    return res.insertedId;
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey, data: EntityData<T>): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as string) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    data = this.renameFields(entityName, data);
    const res = await this.connection.updateMany<T>(this.metadata[entityName].collection, where, data);

    return res.modifiedCount;
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as string) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    const res = await this.connection.deleteMany<T>(this.metadata[entityName].collection, where);

    return res.deletedCount || 0;
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return this.connection.aggregate(this.metadata[entityName].collection, pipeline);
  }

  normalizePrimaryKey<T = number | string>(data: IPrimaryKey | ObjectID): T {
    if (data instanceof ObjectID) {
      return data.toHexString() as unknown as T;
    }

    return data as unknown as T;
  }

  denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return new ObjectID(data);
  }

  getConfig(): DriverConfig {
    return {
      usesPivotTable: false,
      supportsTransactions: false,
      supportsSavePoints: false,
      namingStrategy: MongoNamingStrategy,
    };
  }

  private renameFields(entityName: string, data: any): any {
    data = Object.assign({}, data); // copy first
    Utils.renameKey(data, 'id', '_id');
    const meta = this.metadata[entityName];

    Object.keys(data).forEach(k => {
      if (meta && meta.properties[k]) {
        const prop = meta.properties[k];

        if (prop.fieldName) {
          Utils.renameKey(data, k, prop.fieldName);
        }
      }
    });

    return data;
  }

}
