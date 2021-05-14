import { URL } from 'url';
import c from 'ansi-colors';

import { Configuration, ConnectionOptions, Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { Dictionary } from '../typings';
import { Platform } from '../platforms/Platform';
import { TransactionEventBroadcaster } from '../events/TransactionEventBroadcaster';
import { IsolationLevel } from '../enums';

export abstract class Connection {

  protected metadata!: MetadataStorage;
  protected platform!: Platform;
  protected abstract client: any;

  constructor(protected readonly config: Configuration,
              protected readonly options?: ConnectionOptions,
              protected readonly type: 'read' | 'write' = 'write') {
    if (!this.options) {
      const props = ['dbName', 'clientUrl', 'host', 'port', 'user', 'password', 'multipleStatements', 'pool'] as const;
      this.options = props.reduce((o, i) => { (o[i] as any) = this.config.get(i); return o; }, {} as ConnectionOptions);
    }
  }

  /**
   * Establishes connection to database
   */
  abstract connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  abstract close(force?: boolean): Promise<void>;

  /**
   * Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)
   */
  abstract getDefaultClientUrl(): string;

  async transactional<T>(cb: (trx: Transaction) => Promise<T>, options?: { isolationLevel?: IsolationLevel; ctx?: Transaction; eventBroadcaster?: TransactionEventBroadcaster }): Promise<T> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async begin(options?: { isolationLevel?: IsolationLevel; ctx?: Transaction; eventBroadcaster?: TransactionEventBroadcaster }): Promise<Transaction> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async commit(ctx: Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async rollback(ctx: Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract execute(query: string, params?: any[], method?: 'all' | 'get' | 'run', ctx?: Transaction): Promise<QueryResult | any | any[]>;

  getConnectionOptions(): ConnectionConfig {
    const ret: ConnectionConfig = {};
    const url = new URL(this.options!.clientUrl || this.config.getClientUrl());
    this.options!.host = ret.host = this.config.get('host', url.hostname);
    this.options!.port = ret.port = this.config.get('port', +url.port);
    this.options!.user = ret.user = this.config.get('user', url.username);
    this.options!.password = ret.password = this.config.get('password', url.password);
    this.options!.dbName = ret.database = this.config.get('dbName', url.pathname.replace(/^\//, ''));

    return ret;
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const url = new URL(this.config.getClientUrl(true));

    return `${url.protocol}//${options.user}${options.password ? ':*****' : ''}@${options.host}:${options.port}`;
  }

  setMetadata(metadata: MetadataStorage): void {
    this.metadata = metadata;
  }

  setPlatform(platform: Platform): void {
    this.platform = platform;
  }

  getPlatform(): Platform {
    return this.platform;
  }

  protected async executeQuery<T>(query: string, cb: () => Promise<T>): Promise<T> {
    const now = Date.now();

    try {
      const res = await cb();
      this.logQuery(query, Date.now() - now);

      return res;
    } catch (e) {
      this.logQuery(c.red(query), Date.now() - now);
      throw e;
    }
  }

  protected logQuery(query: string, took?: number): void {
    const logger = this.config.getLogger();

    // We only actually log something when debugMode is enabled. If it's not enabled,
    // we can jump out here as a performance optimization and save ourselves some cycles
    // preparing a message that won't get used.
    if (!logger.isEnabled('query')) {
      return;
    }

    query = this.config.get('highlighter').highlight(query);
    let msg = query + (Utils.isDefined(took) ? c.grey(` [took ${took} ms]`) : '');

    if (this.config.get('replicas', []).length > 0) {
      msg += c.cyan(` (via ${this.type} connection '${this.options!.name || this.config.get('name') || this.options!.host}')`);
    }

    logger.log('query', msg);
  }

}

export interface QueryResult {
  affectedRows: number;
  insertId: number;
  row?: Dictionary;
  rows?: Dictionary[];
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export type Transaction<T = any> = T;
