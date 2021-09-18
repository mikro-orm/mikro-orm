import type {
  Collection, Db, DeleteWriteOpResultObject, InsertOneWriteOpResult, MongoClientOptions, UpdateWriteOpResult, FilterQuery as MongoFilterQueryOrPrimary, ClientSession, SortOptionObject, BulkWriteResult } from 'mongodb';
import { MongoClient,
  ObjectId,
} from 'mongodb';
import { inspect } from 'util';
import type { ConnectionConfig, QueryResult, Transaction, QueryOrderMap,
  FilterQuery, AnyEntity, EntityName, Dictionary, EntityData, TransactionEventBroadcaster, IsolationLevel } from '@mikro-orm/core';
import {
  Connection, Utils, QueryOrder, EventType,
} from '@mikro-orm/core';

export class MongoConnection extends Connection {

  protected client!: MongoClient;
  protected db!: Db;

  async connect(): Promise<void> {
    this.client = await MongoClient.connect(this.config.getClientUrl(), this.getConnectionOptions());
    this.db = this.client.db(this.config.get('dbName'));
  }

  async close(force?: boolean): Promise<void> {
    return this.client?.close(force);
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
    const password = this.config.get('password') as string;

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

  async find<T extends AnyEntity<T>>(collection: string, where: FilterQuery<T>, orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[], limit?: number, offset?: number, fields?: string[], ctx?: Transaction<ClientSession>): Promise<EntityData<T>[]> {
    collection = this.getCollectionName(collection);
    const options: Dictionary = { session: ctx };

    if (fields) {
      options.projection = fields.reduce((o, k) => ({ ...o, [k]: 1 }), {});
    }

    const resultSet = this.getCollection(collection).find<T>(where as Dictionary, options);
    let query = `db.getCollection('${collection}').find(${this.logObject(where)}, ${this.logObject(options)})`;
    orderBy = Utils.asArray(orderBy);

    if (orderBy.length > 0) {
      const orderByTuples: [string, number][] = [];
      orderBy.forEach(o => {
        Object.keys(o).forEach(k => {
          const direction = o[k];
          orderByTuples.push([k, Utils.isString(direction) ? direction.toUpperCase() === QueryOrder.ASC ? 1 : -1 : direction]);
        });
      });
      if (orderByTuples.length > 0) {
        query += `.sort(${this.logObject(orderByTuples)})`;
        resultSet.sort(orderByTuples);
      }
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

  async insertOne<T>(collection: string, data: Partial<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('insertOne', collection, data, undefined, ctx);
  }

  async insertMany<T>(collection: string, data: Partial<T>[], ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('insertMany', collection, data, undefined, ctx);
  }

  async updateMany<T>(collection: string, where: FilterQuery<T>, data: Partial<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('updateMany', collection, data, where, ctx);
  }

  async bulkUpdateMany<T>(collection: string, where: FilterQuery<T>[], data: Partial<T>[], ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('bulkUpdateMany', collection, data, where, ctx);
  }

  async deleteMany<T>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
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

  async countDocuments<T>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<number> {
    return this.runQuery<T, number>('countDocuments', collection, undefined, where, ctx);
  }

  async transactional<T>(cb: (trx: Transaction<ClientSession>) => Promise<T>, options: { isolationLevel?: IsolationLevel; ctx?: Transaction<ClientSession>; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<T> {
    const session = await this.begin(options);

    try {
      const ret = await cb(session);
      await this.commit(session, options.eventBroadcaster);

      return ret;
    } catch (error) {
      await this.rollback(session, options.eventBroadcaster);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async begin(options: { isolationLevel?: IsolationLevel; ctx?: ClientSession; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<ClientSession> {
    if (!options.ctx) {
      /* istanbul ignore next */
      await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }

    const session = options.ctx || this.client.startSession();
    session.startTransaction();
    this.logQuery('db.begin();');
    /* istanbul ignore next */
    await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, session);

    return session;
  }

  async commit(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    /* istanbul ignore next */
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);
    await ctx.commitTransaction();
    this.logQuery('db.commit();');
    /* istanbul ignore next */
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
  }

  async rollback(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    /* istanbul ignore next */
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    await ctx.abortTransaction();
    this.logQuery('db.rollback();');
    /* istanbul ignore next */
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
  }

  protected logQuery(query: string, took?: number): void {
    super.logQuery(query, took);
  }

  private async runQuery<T, U extends QueryResult<T> | number = QueryResult<T>>(method: 'insertOne' | 'insertMany' | 'updateMany' | 'bulkUpdateMany' | 'deleteMany' | 'countDocuments', collection: string, data?: Partial<T> | Partial<T>[], where?: FilterQuery<T> | FilterQuery<T>[], ctx?: Transaction<ClientSession>): Promise<U> {
    collection = this.getCollectionName(collection);
    const logger = this.config.getLogger();
    const options: Dictionary = { session: ctx };
    const now = Date.now();
    let res: InsertOneWriteOpResult<T & { _id: any }> | UpdateWriteOpResult | DeleteWriteOpResultObject | BulkWriteResult | number;
    let query: string;
    const log = (msg: () => string) => logger.isEnabled('query') ? msg() : '';

    switch (method) {
      case 'insertOne':
        query = log(() => `db.getCollection('${collection}').insertOne(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.getCollection(collection).insertOne(data, options);
        break;
      case 'insertMany':
        query = log(() => `db.getCollection('${collection}').insertMany(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.getCollection(collection).insertMany(data as Partial<T>[], options);
        break;
      case 'updateMany': {
        const payload = Object.keys(data!).some(k => k.startsWith('$')) ? data : { $set: data };
        query = log(() => `db.getCollection('${collection}').updateMany(${this.logObject(where)}, ${this.logObject(payload)}, ${this.logObject(options)});`);
        res = await this.getCollection(collection).updateMany(where as MongoFilterQueryOrPrimary<T>, payload!, options);
        break;
      }
      case 'bulkUpdateMany': {
        query = log(() => `bulk = db.getCollection('${collection}').initializeUnorderedBulkOp(${this.logObject(options)});\n`);
        const bulk = this.getCollection(collection).initializeUnorderedBulkOp(options);

        (data as T[]).forEach((row, idx) => {
          const cond = { _id: (where as Dictionary[])[idx] };
          const doc = { $set: row };
          query += log(() => `bulk.find(${this.logObject(cond)}).update(${this.logObject(doc)});\n`);
          bulk.find(cond).update(doc);
        });

        query += log(() => `bulk.execute()`);
        res = await bulk.execute();
        break;
      }
      case 'deleteMany':
      case 'countDocuments':
        query = log(() => `db.getCollection('${collection}').${method}(${this.logObject(where)}, ${this.logObject(options)});`);
        res = await this.getCollection(collection)[method as 'deleteMany'](where as MongoFilterQueryOrPrimary<T>, options); // cast to deleteMany to fix some typing weirdness
        break;
    }

    this.logQuery(query!, Date.now() - now);

    if (method === 'countDocuments') {
      return res! as unknown as U;
    }

    return this.transformResult<T>(res!) as U;
  }

  private transformResult<T>(res: any): QueryResult<T> {
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
