import {
  Collection, Db, DeleteWriteOpResultObject, InsertOneWriteOpResult, MongoClient, MongoClientOptions,
  ObjectId, UpdateWriteOpResult, FilterQuery as MongoFilterQuery, ClientSession, SortOptionObject,
} from 'mongodb';
import { inspect } from 'util';
import {
  Connection, ConnectionConfig, QueryResult, Transaction, Utils, QueryOrder, QueryOrderMap,
  FilterQuery, AnyEntity, EntityName, Dictionary, EntityData,
} from '@mikro-orm/core';

export class MongoConnection extends Connection {

  protected client!: MongoClient;
  protected db!: Db;

  async connect(): Promise<void> {
    this.client = await MongoClient.connect(this.config.getClientUrl(), this.getConnectionOptions());
    this.db = this.client.db(this.config.get('dbName'));
  }

  async close(force?: boolean): Promise<void> {
    return this.client.close(force);
  }

  async isConnected(): Promise<boolean> {
    const ret = this.client?.isConnected();
    return !!ret;
  }

  getCollection(name: EntityName<AnyEntity>): Collection {
    return this.db.collection(this.getCollectionName(name));
  }

  async createCollection(name: EntityName<AnyEntity>): Promise<Collection> {
    return this.db.createCollection(this.getCollectionName(name));
  }

  async listCollections(): Promise<string[]> {
    const collections = await this.db.listCollections({}, { nameOnly: true }).toArray();
    return collections.map(c => c.name);
  }

  async dropCollection(name: EntityName<AnyEntity>): Promise<boolean> {
    return this.db.dropCollection(this.getCollectionName(name));
  }

  getDefaultClientUrl(): string {
    return 'mongodb://127.0.0.1:27017';
  }

  getConnectionOptions(): MongoClientOptions & ConnectionConfig {
    const ret: MongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
    const user = this.config.get('user');
    const password = this.config.get('password');

    if (user && password) {
      ret.auth = { user, password };
    }

    return Utils.merge(ret, this.config.get('driverOptions'));
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const clientUrl = this.config.getClientUrl(true);
    const match = clientUrl.match(/^(\w+):\/\/((.*@.+)|.+)$/);

    return match ? `${match[1]}://${options.auth ? options.auth.user + ':*****@' : ''}${match[2]}` : clientUrl;
  }

  getDb(): Db {
    return this.db;
  }

  async execute(query: string): Promise<any> {
    throw new Error(`${this.constructor.name} does not support generic execute method`);
  }

  async find<T extends AnyEntity<T>>(collection: string, where: FilterQuery<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number, fields?: string[], ctx?: Transaction<ClientSession>): Promise<EntityData<T>[]> {
    collection = this.getCollectionName(collection);
    const options: Dictionary = { session: ctx };

    if (fields) {
      options.projection = fields.reduce((o, k) => ({ ...o, [k]: 1 }), {});
    }

    const resultSet = this.getCollection(collection).find<T>(where as Dictionary, options);
    let query = `db.getCollection('${collection}').find(${this.logObject(where)}, ${this.logObject(options)})`;

    if (orderBy && Object.keys(orderBy).length > 0) {
      orderBy = Object.keys(orderBy).reduce((p, c) => {
        const direction = orderBy![c];
        return { ...p, [c]: Utils.isString(direction) ? direction.toUpperCase() === QueryOrder.ASC ? 1 : -1 : direction };
      }, {});
      query += `.sort(${this.logObject(orderBy)})`;
      resultSet.sort(orderBy as SortOptionObject<T>);
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

    return res as EntityData<T>[];
  }

  async insertOne<T extends { _id: any }>(collection: string, data: Partial<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    return this.runQuery<T>('insertOne', collection, data, undefined, ctx);
  }

  async insertMany<T extends { _id: any }>(collection: string, data: Partial<T>[], ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    return this.runQuery<T>('insertMany', collection, data, undefined, ctx);
  }

  async updateMany<T extends { _id: any }>(collection: string, where: FilterQuery<T>, data: Partial<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    return this.runQuery<T>('updateMany', collection, data, where, ctx);
  }

  async deleteMany<T extends { _id: any }>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    return this.runQuery<T>('deleteMany', collection, undefined, where, ctx);
  }

  async aggregate(collection: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    collection = this.getCollectionName(collection);
    const options: Dictionary = { session: ctx };
    const query = `db.getCollection('${collection}').aggregate(${this.logObject(pipeline)}, ${this.logObject(options)}).toArray();`;
    const now = Date.now();
    const res = this.getCollection(collection).aggregate(pipeline, options).toArray();
    this.logQuery(query, Date.now() - now);

    return res;
  }

  async countDocuments<T extends { _id: any }>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<number> {
    return this.runQuery<T, number>('countDocuments', collection, undefined, where, ctx);
  }

  async transactional<T>(cb: (trx: Transaction<ClientSession>) => Promise<T>, ctx?: Transaction<ClientSession>): Promise<T> {
    const session = ctx || this.client.startSession();
    let ret: T = null as unknown as T;

    try {
      this.logQuery('db.begin();');
      await session.withTransaction(async () => ret = await cb(session));
      session.endSession();
      this.logQuery('db.commit();');
    } catch (e) {
      this.logQuery('db.rollback();');
      throw e;
    }

    return ret;
  }

  async begin(ctx?: ClientSession): Promise<ClientSession> {
    const session = ctx || this.client.startSession();
    session.startTransaction();
    this.logQuery('db.begin();');

    return session;
  }

  async commit(ctx: ClientSession): Promise<void> {
    await ctx.commitTransaction();
    this.logQuery('db.commit();');
  }

  async rollback(ctx: ClientSession): Promise<void> {
    await ctx.abortTransaction();
    this.logQuery('db.rollback();');
  }

  protected logQuery(query: string, took?: number): void {
    super.logQuery(query, took);
  }

  private async runQuery<T extends { _id: any }, U extends QueryResult | number = QueryResult>(method: 'insertOne' | 'insertMany' | 'updateMany' | 'deleteMany' | 'countDocuments', collection: string, data?: Partial<T> | Partial<T>[], where?: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<U> {
    collection = this.getCollectionName(collection);
    const options: Dictionary = { session: ctx };
    const now = Date.now();
    let res: InsertOneWriteOpResult<T> | UpdateWriteOpResult | DeleteWriteOpResultObject | number;
    let query: string;

    switch (method) {
      case 'insertOne':
        query = `db.getCollection('${collection}').insertOne(${this.logObject(data)}, ${this.logObject(options)});`;
        res = await this.getCollection(collection).insertOne(data, options);
        break;
      case 'insertMany':
        query = `db.getCollection('${collection}').insertMany(${this.logObject(data)}, ${this.logObject(options)});`;
        res = await this.getCollection(collection).insertMany(data as Partial<T>[], options);
        break;
      case 'updateMany': {
        const payload = Object.keys(data!).some(k => k.startsWith('$')) ? data : { $set: data };
        query = `db.getCollection('${collection}').updateMany(${this.logObject(where)}, ${this.logObject(payload)}, ${this.logObject(options)});`;
        res = await this.getCollection(collection).updateMany(where as MongoFilterQuery<T>, payload!, options);
        break;
      }
      case 'deleteMany':
      case 'countDocuments':
        query = `db.getCollection('${collection}').${method}(${this.logObject(where)}, ${this.logObject(options)});`;
        res = await this.getCollection(collection)[method as 'deleteMany'](where as MongoFilterQuery<T>, options); // cast to deleteMany to fix some typing weirdness
        break;
    }

    this.logQuery(query!, Date.now() - now);

    if (method === 'countDocuments') {
      return res! as unknown as U;
    }

    return this.transformResult(res!) as U;
  }

  private transformResult(res: any): QueryResult {
    return {
      affectedRows: res.modifiedCount || res.deletedCount || res.insertedCount || 0,
      insertId: res.insertedId ?? res.insertedIds?.[0],
      row: res.ops?.[0],
      rows: res.ops,
    };
  }

  private getCollectionName(name: EntityName<AnyEntity>): string {
    name = Utils.className(name);
    const meta = this.metadata.find(name);

    return meta ? meta.collection : name;
  }

  private logObject(o: any): string {
    if (o.session) {
      o = { ...o, session: `[ClientSession]` };
    }

    return inspect(o, { depth: 5, compact: true, breakLength: 300 });
  }

}

ObjectId.prototype[inspect.custom] = function () {
  return `ObjectId('${this.toHexString()}')`;
};

Date.prototype[inspect.custom] = function () {
  return `ISODate('${this.toISOString()}')`;
};
