import { Collection as MongoCollection, Db, FilterQuery, MongoClient, ObjectID } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { Utils } from '../Utils';
import { IEntity, IPrimaryKey, NamingStrategy, MongoNamingStrategy } from '..';

export class MongoDriver extends DatabaseDriver {

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

  getCollection(entityName: string): MongoCollection {
    return this.db.collection(this.getTableName(entityName));
  }

  async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [k: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]> {
    const { query, resultSet } = this.buildQuery<T>(entityName, where, orderBy, limit, offset);
    const now = Date.now();
    const res = await resultSet.toArray();
    this.logQuery(`${query}.toArray(); [took ${Date.now() - now} ms]`);

    return res.map(r => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)}).limit(1).next();`;
    where = this.convertObjectIds(where);
    const now = Date.now();
    const res = await this.getCollection(entityName).find<T>(where as FilterQuery<T>).limit(1).next();
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return this.mapResult(res, this.metadata[entityName]);
  }

  async count(entityName: string, where: any): Promise<number> {
    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").count(${JSON.stringify(where)});`;
    where = this.convertObjectIds(where);

    const now = Date.now();
    const res = await this.getCollection(this.metadata[entityName].collection).countDocuments(where, {});
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
  }

  async nativeInsert(entityName: string, data: any): Promise<ObjectID> {
    data = this.renameFields(entityName, data);
    const query = `db.getCollection("${this.metadata[entityName].collection}").insertOne(${JSON.stringify(data)});`;
    data = this.convertObjectIds(data);

    const now = Date.now();
    const result = await this.getCollection(entityName).insertOne(data);
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return result.insertedId;
  }

  async nativeUpdate(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey, data: any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").updateMany(${JSON.stringify(where)}, { $set: ${JSON.stringify(data)} });`;
    where = this.convertObjectIds(where);

    const now = Date.now();
    const result = await this.getCollection(entityName).updateMany(where as FilterQuery<IEntity>, { $set: data });
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return result.modifiedCount;
  }

  async nativeDelete(entityName: string, where: FilterQuery<IEntity> | IPrimaryKey): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").deleteMany(${JSON.stringify(where)});`;
    where = this.convertObjectIds(where);

    const now = Date.now();
    const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where as FilterQuery<IEntity>);
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return result.deletedCount;
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    const query = `db.getCollection("${this.metadata[entityName].collection}").aggregate(${JSON.stringify(pipeline)}).toArray();`;

    const now = Date.now();
    const res = await this.getCollection(this.metadata[entityName].collection).aggregate(pipeline).toArray();
    this.logQuery(`${query} [took ${Date.now() - now} ms]`);

    return res;
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

  getDefaultClientUrl(): string {
    return 'mongodb://localhost:27017';
  }

  getDefaultNamingStrategy(): { new (): NamingStrategy } {
    return MongoNamingStrategy;
  }

  usesPivotTable(): boolean {
    return false;
  }

  private buildQuery<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): { query: string; resultSet: any } {
    where = this.renameFields(entityName, where);
    let query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)})`;
    where = this.convertObjectIds(where);
    const resultSet = this.getCollection(entityName).find(where as FilterQuery<T>);

    if (Object.keys(orderBy).length > 0) {
      query += `.sort(${JSON.stringify(orderBy)})`;
      resultSet.sort(orderBy);
    }

    if (limit !== null) {
      query += `.limit(${limit})`;
      resultSet.limit(limit);
    }

    if (offset !== null) {
      query += `.skip(${offset})`;
      resultSet.skip(offset);
    }

    return { query, resultSet };
  }

  private renameFields(entityName: string, data: any): any {
    data = Object.assign({}, data); // copy first
    Utils.renameKey(data, 'id', '_id');

    Object.keys(data).forEach(k => {
      if (this.metadata[entityName] && this.metadata[entityName].properties[k]) {
        const prop = this.metadata[entityName].properties[k];

        if (prop.fieldName) {
          Utils.renameKey(data, k, prop.fieldName);
        }
      }
    });

    return data;
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
