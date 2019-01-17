import { Collection as MongoCollection, Db, FilterQuery, MongoClient, ObjectID } from 'mongodb';
import { DatabaseDriver } from './DatabaseDriver';
import { BaseEntity } from '../BaseEntity';
import { Utils } from '../Utils';
import { IPrimaryKey } from '..';
import { NamingStrategy } from '../naming-strategy/NamingStrategy';
import { MongoNamingStrategy } from '../naming-strategy/MongoNamingStrategy';

export class MongoDriver extends DatabaseDriver {

  protected client: MongoClient;
  protected db: Db;

  async connect(): Promise<void> {
    this.client = await MongoClient.connect(this.options.clientUrl as string, { useNewUrlParser: true });
    this.db = this.client.db(this.options.dbName);
  }

  async close(force: boolean): Promise<void> {
    return this.client.close(force);
  }

  async isConnected(): Promise<boolean> {
    return this.client.isConnected();
  }

  getCollection(entityName: string): MongoCollection {
    return this.db.collection(this.getTableName(entityName));
  }

  async find<T extends BaseEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [k: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]> {
    const { query, resultSet } = this.buildQuery<T>(entityName, where, orderBy, limit, offset);
    this.logQuery(`${query}.toArray();`);
    const res = await resultSet.toArray();

    return res.map(r => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)}).limit(1).next();`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);
    const res = await this.getCollection(entityName).find<T>(where as FilterQuery<T>).limit(1).next();

    return this.mapResult(res, this.metadata[entityName]);
  }

  async count(entityName: string, where: any): Promise<number> {
    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").count(${JSON.stringify(where)});`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    return this.getCollection(this.metadata[entityName].collection).countDocuments(where, {});
  }

  async nativeInsert(entityName: string, data: any): Promise<ObjectID> {
    data = this.renameFields(entityName, data);
    const query = `db.getCollection("${this.metadata[entityName].collection}").insertOne(${JSON.stringify(data)});`;
    this.logQuery(query);
    data = Utils.convertObjectIds(data);

    const result = await this.getCollection(entityName).insertOne(data);

    return result.insertedId;
  }

  async nativeUpdate(entityName: string, where: FilterQuery<BaseEntity> | IPrimaryKey, data: any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").updateMany(${JSON.stringify(where)}, { $set: ${JSON.stringify(data)} });`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    const result = await this.getCollection(entityName).updateMany(where as FilterQuery<BaseEntity>, { $set: data });

    return result.modifiedCount;
  }

  async nativeDelete(entityName: string, where: FilterQuery<BaseEntity> | IPrimaryKey): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { _id: new ObjectID(where as IPrimaryKey) };
    }

    where = this.renameFields(entityName, where);
    const query = `db.getCollection("${this.metadata[entityName].collection}").deleteMany(${JSON.stringify(where)});`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where as FilterQuery<BaseEntity>);

    return result.deletedCount;
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    const query = `db.getCollection("${this.metadata[entityName].collection}").aggregate(${JSON.stringify(pipeline)}).toArray();`;
    this.logQuery(query);

    return this.getCollection(this.metadata[entityName].collection).aggregate(pipeline).toArray();
  }

  normalizePrimaryKey(data: any): string {
    if (data instanceof ObjectID) {
      return data.toHexString();
    }

    return data;
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

  private buildQuery<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): { query: string; resultSet: any } {
    where = this.renameFields(entityName, where);
    let query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)})`;
    where = Utils.convertObjectIds(where);
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

}
