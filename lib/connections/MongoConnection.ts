import {
  Collection, Db, DeleteWriteOpResultObject, InsertOneWriteOpResult, MongoClient, ObjectID, UpdateWriteOpResult,
} from 'mongodb';
import { Connection } from './Connection';
import { Utils } from '../utils/Utils';
import { FilterQuery } from '..';

export class MongoConnection extends Connection {

  protected client: MongoClient;
  protected db: Db;

  async connect(): Promise<void> {
    this.client = await MongoClient.connect(this.options.clientUrl as string, { useNewUrlParser: true });
    this.db = this.client.db(this.options.dbName);
  }

  async close(force?: boolean): Promise<void> {
    return this.client.close(force);
  }

  async isConnected(): Promise<boolean> {
    return this.client.isConnected();
  }

  getCollection(name: string): Collection {
    return this.db.collection(name);
  }

  getDefaultClientUrl(): string {
    return 'mongodb://localhost:27017';
  }

  async execute(query: string): Promise<any> {
    throw new Error(`${this.constructor.name} does not support generic execute method`);
  }

  async find<T>(collection: string, where: FilterQuery<T>, orderBy?: { [k: string]: 1 | -1 }, limit?: number, offset?: number): Promise<T[]> {
    let query = `db.getCollection("${collection}").find`;
    where = this.convertObjectIds(where);
    const resultSet = this.getCollection(collection).find(where);
    const now = Date.now();

    query += `(${JSON.stringify(where)})`;

    if (orderBy && Object.keys(orderBy).length > 0) {
      query += `.sort(${JSON.stringify(orderBy)})`;
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

    const res = await resultSet.toArray();
    this.logQuery(`${query}.toArray(); [took ${Date.now() - now} ms]`);

    return res;
  }

  async insertOne<T>(collection: string, data: Partial<T>): Promise<InsertOneWriteOpResult> {
    data = this.convertObjectIds(data);
    const now = Date.now();
    const res = await this.getCollection(collection).insertOne(data);
    const query = `db.getCollection("${collection}").insertOne(${JSON.stringify(data)});`;
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  async updateMany<T>(collection: string, where: FilterQuery<T>, data: Partial<T>): Promise<UpdateWriteOpResult> {
    where = this.convertObjectIds(where);
    data = this.convertObjectIds(data);
    const now = Date.now();
    const res = await this.getCollection(collection).updateMany(where, { $set: data });
    const query = `db.getCollection("${collection}").updateMany(${JSON.stringify(where)}, { $set: ${JSON.stringify(data)} });`;
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  async deleteMany<T>(collection: string, where: FilterQuery<T>): Promise<DeleteWriteOpResultObject> {
    where = this.convertObjectIds(where);
    const res = await this.getCollection(collection).deleteMany(where);
    const query = `db.getCollection("${collection}").deleteMany()`;
    const now = Date.now();
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  async aggregate(collection: string, pipeline: any[]): Promise<any[]> {
    const query = `db.getCollection("${collection}").aggregate(${JSON.stringify(pipeline)}).toArray();`;
    const now = Date.now();
    const res = this.getCollection(collection).aggregate(pipeline).toArray();
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  async countDocuments<T>(collection: string, where: FilterQuery<T>): Promise<number> {
    where = this.convertObjectIds(where);
    const query = `db.getCollection("${collection}").countDocuments(${JSON.stringify(where)})`;
    const now = Date.now();
    const res = await this.getCollection(collection).countDocuments(where);
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  private convertObjectIds(payload: any): any {
    if (payload instanceof ObjectID) {
      return payload;
    }

    if (Utils.isString(payload) && payload.match(/^[0-9a-f]{24}$/i)) {
      return new ObjectID(payload);
    }

    if (Array.isArray(payload)) {
      return payload.map((item: any) => this.convertObjectIds(item));
    }

    if (Utils.isObject(payload)) {
      Object.keys(payload).forEach(k => {
        payload[k] = this.convertObjectIds(payload[k]);
      });
    }

    return payload;
  }

}
