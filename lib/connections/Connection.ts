import { URL } from 'url';
import { Configuration } from '../utils';
import { MetadataStorage } from '../metadata';

export abstract class Connection {

  protected readonly logger = this.config.getLogger();
  protected readonly metadata = MetadataStorage.getMetadata();
  protected abstract client: any;

  constructor(protected readonly config: Configuration) { }

  /**
   * Establishes connection to database
   */
  abstract async connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract async isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  abstract async close(force?: boolean): Promise<void>;

  /**
   * Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)
   */
  abstract getDefaultClientUrl(): string;

  /**
   * Begins a transaction (if supported)
   */
  async beginTransaction(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  /**
   * Commits statements in a transaction
   */
  async commit(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  /**
   * Rollback changes in a transaction
   */
  async rollback(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract async execute(query: string, params?: any[], method?: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]>;

  getConnectionOptions(): ConnectionConfig {
    const ret: ConnectionConfig = {};
    const url = new URL(this.config.getClientUrl());
    ret.host = this.config.get('host', url.hostname);
    ret.port = this.config.get('port', +url.port);
    ret.user = this.config.get('user', url.username);
    ret.password = this.config.get('password', url.password);
    ret.database = this.config.get('dbName', url.pathname.replace(/^\//, ''));

    return ret;
  }

  getClientUrl(): string {
    const options = this.getConnectionOptions();
    const url = new URL(this.config.getClientUrl(true));

    return `${url.protocol}//${options.user}${options.password ? ':*****' : ''}@${options.host}:${options.port}`;
  }

  protected async executeQuery<T>(query: string, params: any[], cb: () => Promise<T>): Promise<T> {
    try {
      const now = Date.now();
      const res = await cb();
      this.logQuery(query, Date.now() - now);

      return res;
    } catch (e) {
      e.message += `\n in query: ${query}`;

      if (params && params.length) {
        e.message += `\n with params: ${JSON.stringify(params)}`;
      }

      throw e;
    }
  }

  protected logQuery(query: string, took: number): void {
    this.logger.debug(`[query-logger] ${query} [took ${took} ms]`);
  }

}

export interface QueryResult {
  affectedRows: number;
  insertId: number;
  row?: Record<string, any>,
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}
