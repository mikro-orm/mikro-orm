import { ClientSession, ObjectId } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { MongoConnection } from '../connections/MongoConnection';
import { EntityData, AnyEntity, FilterQuery } from '../typings';
import { Configuration, Utils } from '../utils';
import { MongoPlatform } from '../platforms/MongoPlatform';
import { FindOneOptions, FindOptions } from './IDatabaseDriver';
import { QueryResult, Transaction } from '../connections';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  protected readonly connection = new MongoConnection(this.config);
  protected readonly platform = new MongoPlatform();

  constructor(config: Configuration) {
    super(config, ['mongodb']);
  }

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOptions, ctx?: Transaction<ClientSession>): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.getConnection('read').find<T>(entityName, where, options.orderBy, options.limit, options.offset, options.fields, ctx);

    return res.map((r: T) => this.mapResult<T>(r, this.metadata.get(entityName))!);
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOneOptions = { populate: [], orderBy: {} }, ctx?: Transaction<ClientSession>): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);
    const res = await this.getConnection('read').find<T>(entityName, where, options.orderBy, 1, undefined, options.fields, ctx);

    return this.mapResult<T>(res[0], this.metadata.get(entityName));
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.getConnection('read').countDocuments(entityName, where, ctx);
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    data = this.renameFields(entityName, data);
    return this.getConnection('write').insertOne(entityName, data as { _id: any }, ctx);
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);
    data = this.renameFields(entityName, data);

    return this.getConnection('write').updateMany(entityName, where as FilterQuery<T>, data as { _id: any }, ctx);
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectId(where as string) } as FilterQuery<T>;
    }

    where = this.renameFields(entityName, where);

    return this.getConnection('write').deleteMany(entityName, where, ctx);
  }

  async aggregate(entityName: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    return this.getConnection('read').aggregate(entityName, pipeline, ctx);
  }

  async createCollections(): Promise<void> {
    await Promise.all(Object.values(this.metadata.getAll()).map(meta => {
      return this.getConnection('write').createCollection(meta.collection);
    }));
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
