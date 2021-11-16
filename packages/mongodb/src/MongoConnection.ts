import type {
  Collection, Db, MongoClientOptions, ClientSession, BulkWriteResult, Filter, UpdateFilter, OptionalId, UpdateResult,
  DeleteResult, InsertManyResult, InsertOneResult,
} from 'mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { inspect } from 'util';
import type {
  ConnectionConfig, QueryResult, Transaction, QueryOrderMap, FilterQuery, AnyEntity, EntityName, Dictionary,
  EntityData, TransactionEventBroadcaster, IsolationLevel,
} from '@mikro-orm/core';
import { Connection, Utils, QueryOrder, EventType, ValidationError } from '@mikro-orm/core';

export class MongoConnection extends Connection {

  protected client!: MongoClient;
  protected db!: Db;
  private connected = false;

  async connect(): Promise<void> {
    this.client = new MongoClient(this.config.getClientUrl(), this.getConnectionOptions());

    await this.client.connect();
    this.db = this.client.db(this.config.get('dbName'));
    this.connected = true;
  }

  async close(force?: boolean): Promise<void> {
    await this.client?.close(!!force);
    this.connected = false;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  getCollection<T>(name: EntityName<T>): Collection<T> {
    return this.db.collection<T>(this.getCollectionName(name));
  }

  async createCollection<T>(name: EntityName<T>): Promise<Collection<T>> {
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
    const ret: MongoClientOptions = {};
    const pool = this.config.get('pool')!;
    const username = this.config.get('user');
    const password = this.config.get('password') as string;

    if (this.config.get('host')) {
      throw new ValidationError('Mongo driver does not support `host` options, use `clientUrl` instead!');
    }

    if (username && password) {
      ret.auth = { username, password };
    }

    if (pool.min) {
      ret.minPoolSize = pool.min;
    }

    if (pool.max) {
      ret.maxPoolSize = pool.max;
    }

    return Utils.merge(ret, this.config.get('driverOptions'));
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const clientUrl = this.config.getClientUrl(true);
    const match = clientUrl.match(/^(\w+):\/\/((.*@.+)|.+)$/);

    return match ? `${match[1]}://${options.auth ? options.auth.username + ':*****@' : ''}${match[2]}` : clientUrl;
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

    const resultSet = this.getCollection<T>(collection).find(where as Filter<T>, options);
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
        // @ts-expect-error ??
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

  async aggregate<T = any>(collection: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<T[]> {
    collection = this.getCollectionName(collection);
    const options: Dictionary = { session: ctx };
    const query = `db.getCollection('${collection}').aggregate(${this.logObject(pipeline)}, ${this.logObject(options)}).toArray();`;
    const now = Date.now();
    const res = this.getCollection(collection).aggregate<T>(pipeline, options).toArray();
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
      await session.endSession();
    }
  }

  async begin(options: { isolationLevel?: IsolationLevel; ctx?: ClientSession; eventBroadcaster?: TransactionEventBroadcaster } = {}): Promise<ClientSession> {
    if (!options.ctx) {
      await options.eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }

    const session = options.ctx || this.client.startSession();
    session.startTransaction();
    this.logQuery('db.begin();');
    await options.eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, session);

    return session;
  }

  async commit(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);
    await ctx.commitTransaction();
    this.logQuery('db.commit();');
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
  }

  async rollback(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    await ctx.abortTransaction();
    this.logQuery('db.rollback();');
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
    let res: InsertOneResult<T> | InsertManyResult<T> | UpdateResult | DeleteResult | BulkWriteResult | number;
    let query: string;
    const log = (msg: () => string) => logger.isEnabled('query') ? msg() : '';

    switch (method) {
      case 'insertOne':
        query = log(() => `db.getCollection('${collection}').insertOne(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.getCollection<T>(collection).insertOne(data as OptionalId<T>, options);
        break;
      case 'insertMany':
        query = log(() => `db.getCollection('${collection}').insertMany(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.getCollection<T>(collection).insertMany(data as OptionalId<T>[], options);
        break;
      case 'updateMany': {
        const payload = Object.keys(data!).some(k => k.startsWith('$')) ? data : { $set: data };
        query = log(() => `db.getCollection('${collection}').updateMany(${this.logObject(where)}, ${this.logObject(payload)}, ${this.logObject(options)});`);
        res = await this.getCollection<T>(collection).updateMany(where as Filter<T>, payload as UpdateFilter<T>, options) as UpdateResult;
        break;
      }
      case 'bulkUpdateMany': {
        query = log(() => `bulk = db.getCollection('${collection}').initializeUnorderedBulkOp(${this.logObject(options)});\n`);
        const bulk = this.getCollection<T>(collection).initializeUnorderedBulkOp(options);

        (data as T[]).forEach((row, idx) => {
          const cond = { _id: (where as Dictionary[])[idx] };
          const doc = { $set: row };
          query += log(() => `bulk.find(${this.logObject(cond)}).update(${this.logObject(doc)});\n`);
          bulk.find(cond).update(doc);
        });

        query += log(() => `bulk.execute()`);
        res = await bulk.execute()!;
        break;
      }
      case 'deleteMany':
      case 'countDocuments':
        query = log(() => `db.getCollection('${collection}').${method}(${this.logObject(where)}, ${this.logObject(options)});`);
        res = await this.getCollection<T>(collection)[method as 'deleteMany'](where as Filter<T>, options); // cast to deleteMany to fix some typing weirdness
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
      insertedIds: res.insertedIds ? Object.values(res.insertedIds) : undefined,
    };
  }

  private getCollectionName<T>(name: EntityName<T>): string {
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
