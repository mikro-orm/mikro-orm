import { ObjectId } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { MongoConnection } from '../connections/MongoConnection';
import { EntityData, AnyEntity, FilterQuery } from '../types';
import { QueryOrderMap } from '../query';
import { Configuration, Utils } from '../utils';
import { MongoPlatform } from '../platforms/MongoPlatform';
import { QueryResult } from '../connections';
import { LockMode } from '../unit-of-work';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  protected readonly connection = new MongoConnection(this.config);
  protected readonly platform = new MongoPlatform();

  constructor(config: Configuration) {
    super(config, ['mongodb']);
  }

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy?: QueryOrderMap, fields?: string[], limit?: number, offset?: number): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.getConnection('read').find<T>(entityName, where, orderBy, limit, offset, fields);

    return res.map((r: T) => this.mapResult<T>(r, this.metadata.get(entityName))!);
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: QueryOrderMap = {}, fields?: string[], lockMode?: LockMode): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);
    const res = await this.getConnection('read').find<T>(entityName, where, orderBy, 1, undefined, fields);

    return this.mapResult<T>(res[0], this.metadata.get(entityName));
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.getConnection('read').countDocuments<T>(entityName, where);
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>): Promise<QueryResult> {
    data = this.renameFields(entityName, data);
    return this.getConnection('write').insertOne<EntityData<T>>(entityName, data);
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);
    data = this.renameFields(entityName, data);

    return this.getConnection('write').updateMany<T>(entityName, where as FilterQuery<T>, data);
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);

    return this.getConnection('write').deleteMany<T>(entityName, where);
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return this.getConnection('read').aggregate(entityName, pipeline);
  }

  private renameFields<T>(entityName: string, data: T): T {
    data = Object.assign({}, data); // copy first
    Utils.renameKey(data, 'id', '_id');
    const meta = this.metadata.get(entityName, false, false);

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
