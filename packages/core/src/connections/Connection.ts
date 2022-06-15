import { URL } from 'url';
import type { Configuration, ConnectionOptions, DynamicPassword } from '../utils';
import type { LogContext } from '../logging';
import type { MetadataStorage } from '../metadata';
import type { AnyEntity, ConnectionType, Dictionary, MaybePromise, Primary } from '../typings';
import type { Platform } from '../platforms/Platform';
import type { TransactionEventBroadcaster } from '../events/TransactionEventBroadcaster';
import type { IsolationLevel } from '../enums';

export abstract class Connection {

  protected metadata!: MetadataStorage;
  protected platform!: Platform;
  protected readonly options: ConnectionOptions;
  protected abstract client: unknown;
  protected readonly logger = this.config.getLogger();

  constructor(protected readonly config: Configuration,
              options?: ConnectionOptions,
              protected readonly type: ConnectionType = 'write') {
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
  abstract connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  async close(force?: boolean): Promise<void> {
    Object.keys(this.options)
      .filter(k => k !== 'name')
      .forEach(k => delete this.options[k]);
  }

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

  abstract execute<T>(query: string, params?: any[], method?: 'all' | 'get' | 'run', ctx?: Transaction): Promise<QueryResult<T> | any | any[]>;

  getConnectionOptions(): ConnectionConfig {
    const ret: ConnectionConfig = {};
    const url = new URL(this.options.clientUrl ?? this.config.getClientUrl());
    const socketPath = this.config.get('driverOptions').connection.socketPath;
    this.options.host = ret.host = socketPath ?? this.config.get('host', url.hostname);
    this.options.host = ret.host = this.options.host ?? this.config.get('host', decodeURIComponent(url.hostname));
    this.options.port = ret.port = this.options.port ?? this.config.get('port', +url.port);
    this.options.user = ret.user = this.options.user ?? this.config.get('user', decodeURIComponent(url.username));
    this.options.password = ret.password = this.options.password ?? this.config.get('password', decodeURIComponent(url.password));
    this.options.dbName = ret.database = this.options.dbName ?? this.config.get('dbName', decodeURIComponent(url.pathname).replace(/^\//, ''));

    return ret;
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const url = new URL(this.config.getClientUrl(true));
    if(this.config.get('driverOptions').connection.socketPath)
        return `${url.protocol}//${options.user}${options.password ? ':*****' : ''}@/${options.database}?host=${options.host}`;
    else
        return `${url.protocol}//${options.user}${options.password ? ':*****' : ''}@${options.host}${options.port}`;
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
      this.logQuery(query, { ...context, took: Date.now() - now });

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

export interface QueryResult<T extends AnyEntity<T> = { id: number }> {
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
