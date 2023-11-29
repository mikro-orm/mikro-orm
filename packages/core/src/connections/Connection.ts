import { URL } from 'url';
import { type Configuration, type ConnectionOptions, type DynamicPassword, Utils } from '../utils';
import type { LogContext, Logger } from '../logging';
import type { MetadataStorage } from '../metadata';
import type { ConnectionType, Dictionary, MaybePromise, Primary } from '../typings';
import type { Platform } from '../platforms/Platform';
import type { TransactionEventBroadcaster } from '../events/TransactionEventBroadcaster';
import type { IsolationLevel } from '../enums';

export abstract class Connection {

  protected metadata!: MetadataStorage;
  protected platform!: Platform;
  protected readonly options: ConnectionOptions;
  protected readonly logger: Logger;
  protected connected = false;

  constructor(protected readonly config: Configuration,
              options?: ConnectionOptions,
              protected readonly type: ConnectionType = 'write') {
    this.logger = this.config.getLogger();

    if (options) {
      this.options = options;
    } else {
      const props = ['dbName', 'clientUrl', 'host', 'port', 'user', 'password', 'multipleStatements', 'pool'] as const;
      this.options = props.reduce((o, i) => {
        (o[i] as any) = this.config.get(i);
        return o;
      }, {} as ConnectionOptions);
    }
  }

  /**
   * Establishes connection to database
   */
  abstract connect(): void | Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract isConnected(): Promise<boolean>;

  /**
   * Are we connected to the database
   */
  abstract checkConnection(): Promise<{ ok: boolean; reason?: string; error?: Error }>;

  /**
   * Closes the database connection (aka disconnect)
   */
  async close(force?: boolean): Promise<void> {
    Object.keys(this.options)
      .filter(k => k !== 'name')
      .forEach(k => delete this.options[k as keyof ConnectionOptions]);
  }

  /**
   * Ensure the connection exists, this is used to support lazy connect when using `MikroORM.initSync()`
   */
  async ensureConnection(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  /**
   * Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)
   */
  abstract getDefaultClientUrl(): string;

  async transactional<T>(cb: (trx: Transaction) => Promise<T>, options?: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: Transaction; eventBroadcaster?: TransactionEventBroadcaster }): Promise<T> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async begin(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean; ctx?: Transaction; eventBroadcaster?: TransactionEventBroadcaster }): Promise<Transaction> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async commit(ctx: Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async rollback(ctx: Transaction, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract execute<T>(query: string, params?: any[], method?: 'all' | 'get' | 'run', ctx?: Transaction): Promise<QueryResult<T> | any | any[]>;

  getConnectionOptions(): ConnectionConfig {
    const ret: ConnectionConfig = {};

    if (this.options.clientUrl) {
      const url = new URL(this.options.clientUrl);
      this.options.host = ret.host = this.options.host ?? decodeURIComponent(url.hostname);
      this.options.port = ret.port = this.options.port ?? +url.port;
      this.options.user = ret.user = this.options.user ?? decodeURIComponent(url.username);
      this.options.password = ret.password = this.options.password ?? decodeURIComponent(url.password);
      this.options.dbName = ret.database = this.options.dbName ?? decodeURIComponent(url.pathname).replace(/^\//, '');
    } else {
      const url = new URL(this.config.getClientUrl());
      this.options.host = ret.host = this.options.host ?? this.config.get('host', decodeURIComponent(url.hostname));
      this.options.port = ret.port = this.options.port ?? this.config.get('port', +url.port);
      this.options.user = ret.user = this.options.user ?? this.config.get('user', decodeURIComponent(url.username));
      this.options.password = ret.password = this.options.password ?? this.config.get('password', decodeURIComponent(url.password));
      this.options.dbName = ret.database = this.options.dbName ?? this.config.get('dbName', decodeURIComponent(url.pathname).replace(/^\//, ''));
    }

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

  protected async executeQuery<T>(query: string, cb: () => Promise<T>, context?: LogContext): Promise<T> {
    const now = Date.now();

    try {
      const res = await cb();
      this.logQuery(query, {
        ...context,
        took: Date.now() - now,
        results: Array.isArray(res) ? res.length : undefined,
        affected: Utils.isPlainObject<QueryResult>(res) ? res.affectedRows : undefined,
      });

      return res;
    } catch (e) {
      this.logQuery(query, { ...context, took: Date.now() - now, level: 'error' });
      throw e;
    }
  }

  protected logQuery(query: string, context: LogContext = {}): void {
    this.logger.logQuery({
      level: 'info',
      connection: {
        type: this.type,
        name: this.options.name || this.config.get('name') || this.options.host,
      },
      ...context,
      query,
    });
  }

}

export interface QueryResult<T = { id: number }> {
  affectedRows: number;
  insertId: Primary<T>;
  row?: Dictionary;
  rows?: Dictionary[];
  insertedIds?: Primary<T>[];
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string | (() => MaybePromise<string> | MaybePromise<DynamicPassword>);
  database?: string;
}

export type Transaction<T = any> = T;
