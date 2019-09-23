import { FilterQuery, ObjectId } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { MongoConnection } from '../connections/MongoConnection';
import { EntityData, IEntityType, IPrimaryKey } from '../decorators';
import { QueryOrderMap } from '../query';
import { Configuration, Utils } from '../utils';
import { MongoPlatform } from '../platforms/MongoPlatform';
import { QueryResult } from '../connections';
import { LockMode } from '../unit-of-work';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  protected readonly connection = new MongoConnection(this.config);
  protected readonly platform = new MongoPlatform();

  protected constructor(config: Configuration) {
    super(config, ['mongo']);
  }

  async find<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: QueryOrderMap, limit: number, offset: number): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.getConnection('read').find<T>(entityName, where, orderBy, limit, offset);

    return res.map((r: T) => this.mapResult<T>(r, this.metadata.get(entityName))!);
  }

  async findOne<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = [], orderBy: QueryOrderMap = {}, fields?: string[], lockMode?: LockMode): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    const res = await this.getConnection('read').find<T>(entityName, where, orderBy, 1, undefined, fields);

    return this.mapResult<T>(res[0], this.metadata.get(entityName));
  }

  async count<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.getConnection('read').countDocuments<T>(entityName, where);
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<QueryResult> {
    data = this.renameFields(entityName, data);
    return this.getConnection('write').insertOne<EntityData<T>>(entityName, data);
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey, data: EntityData<T>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;
    data = this.renameFields(entityName, data);

    return this.getConnection('write').updateMany<T>(entityName, where, data);
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where) as FilterQuery<T>;

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
