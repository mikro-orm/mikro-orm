import {
  MongoClient,
  type BulkWriteResult,
  type ClientSession,
  type Collection,
  type Db,
  type DeleteResult,
  type Filter,
  type InsertManyResult,
  type InsertOneResult,
  type MongoClientOptions,
  type OptionalUnlessRequiredId,
  type TransactionOptions,
  type UpdateFilter,
  type UpdateResult,
} from 'mongodb';
import { ObjectId } from 'bson';
import { inspect } from 'node:util';
import {
  Connection,
  EventType,
  QueryOrder,
  Utils,
  ValidationError,
  type AnyEntity,
  type Configuration,
  type ConnectionOptions,
  type ConnectionType,
  type Dictionary,
  type EntityData,
  type EntityName,
  type FilterQuery,
  type IsolationLevel,
  type QueryOrderMap,
  type QueryResult,
  type Transaction,
  type TransactionEventBroadcaster,
  type UpsertOptions,
  type UpsertManyOptions,
  type LoggingOptions,
} from '@mikro-orm/core';

export class MongoConnection extends Connection {

  protected client!: MongoClient;
  protected db!: Db;

  constructor(config: Configuration, options?: ConnectionOptions, type: ConnectionType = 'write') {
    super(config, options, type);

    // @ts-ignore
    ObjectId.prototype[inspect.custom] = function () {
      return `ObjectId('${this.toHexString()}')`;
    };

    // @ts-ignore
    Date.prototype[inspect.custom] = function () {
      return `ISODate('${this.toISOString()}')`;
    };
  }

  async connect(): Promise<void> {
    let driverOptions = this.options.driverOptions ?? this.config.get('driverOptions');

    if (typeof driverOptions === 'function') {
      driverOptions = await driverOptions();
    }

    if (driverOptions instanceof MongoClient) {
      this.logger.log('info', 'Reusing MongoClient provided via `driverOptions`');
      this.client = driverOptions;
    } else {
      this.client = new MongoClient(this.config.getClientUrl(), this.mapOptions(driverOptions as MongoClientOptions));
      await this.client.connect();
      const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');
      /* istanbul ignore next */
      this.client.on('connectionCreated', () => {
        void onCreateConnection?.(this.client);
      });
    }

    this.db = this.client.db(this.config.get('dbName'));
    this.connected = true;
  }

  override async close(force?: boolean): Promise<void> {
    await this.client?.close(!!force);
    this.connected = false;
  }

  async isConnected(): Promise<boolean> {
    try {
      const res = await this.db?.command({ ping: 1 });
      return this.connected = !!res.ok;
    } catch (error) {
      return this.connected = false;
    }
  }

  async checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }> {
    try {
      const res = await this.db?.command({ ping: 1 });
      return res.ok
        ? { ok: true }
        : { ok: false, reason: 'Ping reply does not feature "ok" property, or it evaluates to "false"' };
    } catch (error: any) {
      return { ok: false, reason: error.message, error };
    }
  }

  getClient(): MongoClient {
    return this.client;
  }

  getCollection<T extends object>(name: EntityName<T>): Collection<T> {
    return this.db.collection<T>(this.getCollectionName(name));
  }

  async createCollection<T extends object>(name: EntityName<T>): Promise<Collection<T>> {
    return this.db.createCollection(this.getCollectionName(name));
  }

  async listCollections(): Promise<string[]> {
    const collections = await this.db.listCollections({}, { nameOnly: true }).toArray();
    return collections.map(c => c.name);
  }

  async dropCollection(name: EntityName<AnyEntity>): Promise<boolean> {
    return this.db.dropCollection(this.getCollectionName(name));
  }

  mapOptions(overrides: MongoClientOptions): MongoClientOptions {
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

    ret.driverInfo = {
      name: 'MikroORM',
      version: Utils.getORMVersion(),
    };

    return Utils.mergeConfig(ret, overrides);
  }

  override getClientUrl(): string {
    const options = this.mapOptions(this.options.driverOptions ?? {});
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

  async find<T extends object>(collection: string, where: FilterQuery<T>, orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[], limit?: number, offset?: number, fields?: string[], ctx?: Transaction<ClientSession>, loggerContext?: LoggingOptions): Promise<EntityData<T>[]> {
    await this.ensureConnection();
    collection = this.getCollectionName(collection);
    const options: Dictionary = ctx ? { session: ctx } : {};

    if (fields) {
      options.projection = fields.reduce((o, k) => Object.assign(o, { [k]: 1 }), {});
    }

    const resultSet = this.getCollection<T>(collection).find(where as Filter<T>, options);
    let query = `db.getCollection('${collection}').find(${this.logObject(where)}, ${this.logObject(options)})`;
    orderBy = Utils.asArray(orderBy);

    if (Array.isArray(orderBy) && orderBy.length > 0) {
      const orderByTuples: [string, number][] = [];
      orderBy.forEach(o => {
        Utils.keys(o).forEach(k => {
          const direction = o[k];
          orderByTuples.push([k.toString(), Utils.isString(direction) ? direction.toUpperCase() === QueryOrder.ASC ? 1 : -1 : direction as number]);
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
    this.logQuery(`${query}.toArray();`, { took: Date.now() - now, results: res.length, ...loggerContext });

    return res as EntityData<T>[];
  }

  async insertOne<T extends object>(collection: string, data: Partial<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('insertOne', collection, data, undefined, ctx);
  }

  async insertMany<T extends object>(collection: string, data: Partial<T>[], ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('insertMany', collection, data, undefined, ctx);
  }

  async updateMany<T extends object>(collection: string, where: FilterQuery<T>, data: Partial<T>, ctx?: Transaction<ClientSession>, upsert?: boolean, upsertOptions?: UpsertOptions<T>): Promise<QueryResult<T>> {
    return this.runQuery<T>('updateMany', collection, data, where, ctx, upsert, upsertOptions);
  }

  async bulkUpdateMany<T extends object>(collection: string, where: FilterQuery<T>[], data: Partial<T>[], ctx?: Transaction<ClientSession>, upsert?: boolean, upsertOptions?: UpsertManyOptions<T>): Promise<QueryResult<T>> {
    return this.runQuery<T>('bulkUpdateMany', collection, data, where, ctx, upsert, upsertOptions);
  }

  async deleteMany<T extends object>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    return this.runQuery<T>('deleteMany', collection, undefined, where, ctx);
  }

  async aggregate<T extends object = any>(collection: string, pipeline: any[], ctx?: Transaction<ClientSession>, loggerContext?: LoggingOptions): Promise<T[]> {
    await this.ensureConnection();
    collection = this.getCollectionName(collection);
    /* istanbul ignore next */
    const options: Dictionary = ctx ? { session: ctx } : {};
    const query = `db.getCollection('${collection}').aggregate(${this.logObject(pipeline)}, ${this.logObject(options)}).toArray();`;
    const now = Date.now();
    const res = await this.getCollection(collection).aggregate<T>(pipeline, options).toArray();
    this.logQuery(query, { took: Date.now() - now, results: res.length, ...loggerContext });

    return res;
  }

  async countDocuments<T extends object>(collection: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<number> {
    return this.runQuery<T, number>('countDocuments', collection, undefined, where, ctx);
  }

  override async transactional<T>(cb: (trx: Transaction<ClientSession>) => Promise<T>, options: { isolationLevel?: IsolationLevel; ctx?: Transaction<ClientSession>; eventBroadcaster?: TransactionEventBroadcaster } & TransactionOptions = {}): Promise<T> {
    await this.ensureConnection();
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

  override async begin(options: { isolationLevel?: IsolationLevel; ctx?: ClientSession; eventBroadcaster?: TransactionEventBroadcaster } & TransactionOptions = {}): Promise<ClientSession> {
    await this.ensureConnection();
    const { ctx, isolationLevel, eventBroadcaster, ...txOptions } = options;

    if (!ctx) {
      await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionStart);
    }
    const session = ctx || this.client.startSession();
    session.startTransaction(txOptions);
    this.logQuery('db.begin();');
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionStart, session);

    return session;
  }

  override async commit(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    await this.ensureConnection();
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionCommit, ctx);
    await ctx.commitTransaction();
    this.logQuery('db.commit();');
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionCommit, ctx);
  }

  override async rollback(ctx: ClientSession, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    await this.ensureConnection();
    await eventBroadcaster?.dispatchEvent(EventType.beforeTransactionRollback, ctx);
    await ctx.abortTransaction();
    this.logQuery('db.rollback();');
    await eventBroadcaster?.dispatchEvent(EventType.afterTransactionRollback, ctx);
  }

  private async runQuery<T extends object, U extends QueryResult<T> | number = QueryResult<T>>(method: 'insertOne' | 'insertMany' | 'updateMany' | 'bulkUpdateMany' | 'deleteMany' | 'countDocuments', collection: string, data?: Partial<T> | Partial<T>[], where?: FilterQuery<T> | FilterQuery<T>[], ctx?: Transaction<ClientSession>, upsert?: boolean, upsertOptions?: UpsertOptions<T>, loggerContext?: LoggingOptions): Promise<U> {
    await this.ensureConnection();
    collection = this.getCollectionName(collection);
    const logger = this.config.getLogger();
    const options: Dictionary = ctx ? { session: ctx, upsert } : { upsert };

    if (options.upsert === undefined) {
      delete options.upsert;
    }

    const now = Date.now();
    let res: InsertOneResult<T> | InsertManyResult<T> | UpdateResult | DeleteResult | BulkWriteResult | number;
    let query: string;
    const log = (msg: () => string) => logger.isEnabled('query') ? msg() : '';

    switch (method) {
      case 'insertOne':
        Object.keys(data as Dictionary).filter(k => typeof (data as Dictionary)[k] === 'undefined').forEach(k => delete (data as Dictionary)[k]);
        query = log(() => `db.getCollection('${collection}').insertOne(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.rethrow(this.getCollection<T>(collection).insertOne(data as OptionalUnlessRequiredId<T>, options), query);
        break;
      case 'insertMany':
        (data as Dictionary[]).forEach(data => Object.keys(data).filter(k => typeof data[k] === 'undefined').forEach(k => delete data[k]));
        query = log(() => `db.getCollection('${collection}').insertMany(${this.logObject(data)}, ${this.logObject(options)});`);
        res = await this.rethrow(this.getCollection<T>(collection).insertMany(data as OptionalUnlessRequiredId<T>[], options), query);
        break;
      case 'updateMany': {
        const payload = Object.keys(data!).some(k => k.startsWith('$')) ? data : this.createUpdatePayload(data as T, upsertOptions);
        query = log(() => `db.getCollection('${collection}').updateMany(${this.logObject(where)}, ${this.logObject(payload)}, ${this.logObject(options)});`);
        res = await this.rethrow(this.getCollection<T>(collection).updateMany(where as Filter<T>, payload as UpdateFilter<T>, options), query) as UpdateResult;
        break;
      }
      case 'bulkUpdateMany': {
        query = log(() => `bulk = db.getCollection('${collection}').initializeUnorderedBulkOp(${this.logObject(options)});\n`);
        const bulk = this.getCollection<T>(collection).initializeUnorderedBulkOp(options);

        (data as T[]).forEach((row, idx) => {
          const id = (where as Dictionary[])[idx];
          const cond = Utils.isPlainObject(id) ? id : { _id: id };
          const doc = this.createUpdatePayload(row, upsertOptions) as Dictionary;

          if (upsert) {
            if (Utils.isEmpty(cond)) {
              query += log(() => `bulk.insert(${this.logObject(row)});\n`);
              bulk.insert(row);
            } else {
              query += log(() => `bulk.find(${this.logObject(cond)}).upsert().update(${this.logObject(doc)});\n`);
              bulk.find(cond).upsert().update(doc);
            }

            return;
          }

          query += log(() => `bulk.find(${this.logObject(cond)}).update(${this.logObject(doc)});\n`);
          bulk.find(cond).update(doc);
        });

        query += log(() => `bulk.execute()`);
        res = await this.rethrow(bulk.execute()!, query);
        break;
      }
      case 'deleteMany':
      case 'countDocuments':
        query = log(() => `db.getCollection('${collection}').${method}(${this.logObject(where)}, ${this.logObject(options)});`);
        res = await this.rethrow(this.getCollection<T>(collection)[method](where as Filter<T>, options) as Promise<number>, query);
        break;
    }

    this.logQuery(query!, { took: Date.now() - now, ...loggerContext });

    if (method === 'countDocuments') {
      return res! as unknown as U;
    }

    return this.transformResult<T>(res!) as U;
  }

  private rethrow<T>(promise: Promise<T>, query: string): Promise<T> {
    return promise.catch(e => {
      this.logQuery(query, { level: 'error' });
      e.message += '\nQuery: ' + query;
      throw e;
    });
  }

  private createUpdatePayload<T extends object>(row: T, upsertOptions?: UpsertOptions<T>): { $set?: unknown[]; $unset?: unknown[]; $setOnInsert?: unknown[] } {
    const doc: Dictionary = { $set: row };
    const $unset: { $set?: unknown[]; $unset?: unknown[]; [K: PropertyKey]: unknown } = {};

    Utils.keys(row)
      .filter(k => typeof row[k] === 'undefined')
      .forEach(k => {
        $unset[k] = '';
        delete row[k];
      });

    if (upsertOptions) {
      if (upsertOptions.onConflictAction === 'ignore') {
        doc.$setOnInsert = doc.$set;
        delete doc.$set;
      }

      if (upsertOptions.onConflictMergeFields) {
        doc.$setOnInsert = {};

        upsertOptions.onConflictMergeFields.forEach(f => {
          doc.$setOnInsert[f] = doc.$set[f];
          delete doc.$set[f];
        });

        const { $set, $setOnInsert } = doc;
        doc.$set = $setOnInsert;
        doc.$setOnInsert = $set;
      } else if (upsertOptions.onConflictExcludeFields) {
        doc.$setOnInsert = {};

        upsertOptions.onConflictExcludeFields.forEach(f => {
          doc.$setOnInsert[f] = doc.$set[f];
          delete doc.$set[f];
        });
      }
    }


    if (Utils.hasObjectKeys($unset)) {
      doc.$unset = $unset;

      if (!Utils.hasObjectKeys(doc.$set)) {
        delete doc.$set;
      }
    }

    return doc;
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
