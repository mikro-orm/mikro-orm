import {
  Collection,
  Db, DeleteWriteOpResultObject,
  InsertOneWriteOpResult,
  MongoClient,
  MongoClientOptions,
  ObjectId,
  UpdateWriteOpResult,
} from 'mongodb';
import { inspect } from 'util';

import { Connection, ConnectionConfig, QueryResult } from './Connection';
import { Utils } from '../utils';
import { QueryOrder, QueryOrderMap } from '../query';
import { FilterQuery, IEntity } from '..';
import { EntityName } from '../decorators';

export class MongoConnection extends Connection {

  protected client: MongoClient;
  protected db: Db;

  async connect(): Promise<void> {
    this.client = await MongoClient.connect(this.config.getClientUrl(), this.getConnectionOptions());
    this.db = this.client.db(this.config.get('dbName'));
  }

  async close(force?: boolean): Promise<void> {
    return this.client.close(force);
  }

  async isConnected(): Promise<boolean> {
    return this.client.isConnected();
  }

  getCollection(name: EntityName<IEntity>): Collection {
    return this.db.collection(this.getCollectionName(name));
  }

  getDefaultClientUrl(): string {
    return 'mongodb://127.0.0.1:27017';
  }

  getConnectionOptions(): MongoClientOptions & ConnectionConfig {
    const ret: MongoClientOptions = { useNewUrlParser: true };
    const user = this.config.get('user');
    const password = this.config.get('password');

    if (user && password) {
      ret.auth = { user, password };
    }

    return ret;
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const clientUrl = this.config.getClientUrl(true);
    const match = clientUrl.match(/^(\w+):\/\/((.*@.+)|.+)$/);

    return match ? `${match[1]}://${options.auth ? options.auth.user + ':*****@' : ''}${match[2]}` : clientUrl;
  }

  async execute(query: string): Promise<any> {
    throw new Error(`${this.constructor.name} does not support generic execute method`);
  }

  async find<T>(collection: string, where: FilterQuery<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number, fields?: string[]): Promise<T[]> {
    collection = this.getCollectionName(collection);
    where = this.convertObjectIds(where);
    const options = {} as Record<string, any>;

    if (fields) {
      options.projection = fields.reduce((o, k) => ({ ...o, [k]: 1 }), {});
    }

    const resultSet = this.getCollection(collection).find(where, options);
    let query = `db.getCollection('${collection}').find(${this.logObject(where)}, ${this.logObject(options)})`;

    if (orderBy && Object.keys(orderBy).length > 0) {
      orderBy = Object.keys(orderBy).reduce((p, c) => {
        const direction = orderBy![c];
        return { ...p, [c]: Utils.isString(direction) ? direction.toUpperCase() === QueryOrder.ASC ? 1 : -1 : direction };
      }, {});
      query += `.sort(${this.logObject(orderBy)})`;
      resultSet.sort(orderBy);
    }

    if (limit !== undefined) {
      query += `.limit(${limit})`;
      resultSet.limit(limit);
    }

    if (offset !== undefined) {
      query += `.skip(${offset})`;
      resultSet.skip(offset);
    }

    const now = Date.now();
    const res = await resultSet.toArray();
    this.logQuery(`${query}.toArray();`, Date.now() - now);

    return res;
  }

  async insertOne<T>(collection: string, data: Partial<T>): Promise<QueryResult> {
    return this.runQuery<T>('insertOne', collection, data);
  }

  async updateMany<T>(collection: string, where: FilterQuery<T>, data: Partial<T>): Promise<QueryResult> {
    return this.runQuery<T>('updateMany', collection, data, where);
  }

  async deleteMany<T>(collection: string, where: FilterQuery<T>): Promise<QueryResult> {
    return this.runQuery<T>('deleteMany', collection, undefined, where);
  }

  async aggregate(collection: string, pipeline: any[]): Promise<any[]> {
    collection = this.getCollectionName(collection);
    const query = `db.getCollection('${collection}').aggregate(${this.logObject(pipeline)}).toArray();`;
    const now = Date.now();
    const res = this.getCollection(collection).aggregate(pipeline).toArray();
    this.logQuery(query, Date.now() - now);

    return res;
  }

  async countDocuments<T>(collection: string, where: FilterQuery<T>): Promise<number> {
    return this.runQuery<T, number>('countDocuments', collection, undefined, where);
  }

  protected logQuery(query: string, took?: number): void {
    super.logQuery(query, took, 'javascript');
  }

  private async runQuery<T, U extends QueryResult | number = QueryResult>(method: 'insertOne' | 'updateMany' | 'deleteMany' | 'countDocuments', collection: string, data?: Partial<T>, where?: FilterQuery<T>): Promise<U> {
    collection = this.getCollectionName(collection);
    data = this.convertObjectIds(data!);
    where = this.convertObjectIds(where!);
    const now = Date.now();
    let res: InsertOneWriteOpResult | UpdateWriteOpResult | DeleteWriteOpResultObject | number;
    let query: string;

    switch (method) {
      case 'insertOne':
        query = `db.getCollection('${collection}').insertOne(${this.logObject(data)});`;
        res = await this.getCollection(collection).insertOne(data);
        break;
      case 'updateMany':
        const payload = Object.keys(data).some(k => k.startsWith('$')) ? data : { $set: data };
        query = `db.getCollection('${collection}').updateMany(${this.logObject(where)}, ${this.logObject(payload)});`;
        res = await this.getCollection(collection).updateMany(where, payload);
        break;
      case 'deleteMany':
      case 'countDocuments':
        query = `db.getCollection('${collection}').${method}(${this.logObject(where)});`;
        res = await this.getCollection(collection)[method as 'deleteMany'](where); // cast to deleteMany to fix some typing weirdness
        break;
    }

    this.logQuery(query!, Date.now() - now);

    if (method === 'countDocuments') {
      return res! as U;
    }

    return this.transformResult(res!) as U;
  }

  private convertObjectIds<T extends ObjectId | Record<string, any> | any[]>(payload: T): T {
    if (payload instanceof ObjectId) {
      return payload;
    }

    if (Utils.isString(payload) && payload.match(/^[0-9a-f]{24}$/i)) {
      return new ObjectId(payload) as T;
    }

    if (Array.isArray(payload)) {
      return payload.map((item: any) => this.convertObjectIds(item)) as T;
    }

    if (Utils.isObject(payload)) {
      Object.keys(payload).forEach(k => {
        payload[k] = this.convertObjectIds(payload[k]);
      });
    }

    return payload;
  }

  private transformResult(res: any): QueryResult {
    return {
      affectedRows: res.modifiedCount || res.deletedCount || 0,
      insertId: res.insertedId,
    };
  }

  private getCollectionName(name: EntityName<IEntity>): string {
    name = Utils.className(name);
    const meta = this.metadata.get(name);

    return meta ? meta.collection : name;
  }

  private logObject(o: object): string {
    return inspect(o, { depth: 5, compact: true, breakLength: 300 });
  }

}

ObjectId.prototype[inspect.custom] = function () {
  return `ObjectId('${this.toHexString()}')`;
};

Date.prototype[inspect.custom] = function () {
  return `ISODate('${this.toISOString()}')`;
};
