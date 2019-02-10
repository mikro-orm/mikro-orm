import { FilterQuery, ObjectID } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { Utils } from '../utils/Utils';
import { IEntity, IPrimaryKey, NamingStrategy, MongoNamingStrategy } from '..';
import { MongoConnection } from '../connections/MongoConnection';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  protected readonly connection = new MongoConnection(this.options, this.logger);

  async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [k: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.connection.find<T>(this.metadata[entityName].collection, where, orderBy, limit, offset);

    return res.map((r: any) => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as any) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    const res = await this.connection.find<T>(this.metadata[entityName].collection, where, {}, 1);

    return this.mapResult(res[0], this.metadata[entityName]);
  }

  async count<T extends IEntity>(entityName: string, where: FilterQuery<T>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.connection.countDocuments<T>(this.metadata[entityName].collection, where);
  }

  async nativeInsert<T extends IEntity>(entityName: string, data: Partial<T>): Promise<ObjectID> {
    data = this.renameFields(entityName, data);
    const res = await this.connection.insertOne<T>(this.metadata[entityName].collection, data);

    return res.insertedId;
  }

  async nativeUpdate<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, data: any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as any) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    data = this.renameFields(entityName, data);
    const res = await this.connection.updateMany<T>(this.metadata[entityName].collection, where, data);

    return res.modifiedCount;
  }

  async nativeDelete<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as any) };
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    const res = await this.connection.deleteMany<T>(this.metadata[entityName].collection, where);

    return res.deletedCount || 0;
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return this.connection.aggregate(this.metadata[entityName].collection, pipeline);
  }

  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T {
    if (data instanceof ObjectID) {
      return data.toHexString() as unknown as T;
    }

    return data as unknown as T;
  }

  denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return new ObjectID(data);
  }

  getDefaultNamingStrategy(): { new (): NamingStrategy } {
    return MongoNamingStrategy;
  }

  usesPivotTable(): boolean {
    return false;
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
