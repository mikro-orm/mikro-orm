import { URL } from 'url';
import chalk from 'chalk';
import highlight from 'cli-highlight';

import { Configuration, ConnectionOptions, Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { Dictionary } from '../typings';

export abstract class Connection {

  protected metadata!: MetadataStorage;
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

  async transactional<T>(cb: (trx: Transaction) => Promise<T>, ctx?: Transaction): Promise<T> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract async execute(query: string, params?: any[], method?: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]>;

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

  protected async executeQuery<T>(query: string, cb: () => Promise<T>): Promise<T> {
    const now = Date.now();

    try {
      const res = await cb();
      this.logQuery(query, Date.now() - now);

      return res;
    } catch (e) {
      this.logQuery(chalk.red(query), Date.now() - now, undefined);
      throw e;
    }
  }

  protected logQuery(query: string, took?: number, language?: string): void {
    if (this.config.get('highlight') && language) {
      query = highlight(query, { language, ignoreIllegals: true, theme: this.config.getHighlightTheme() });
    }

    let msg = query + (Utils.isDefined(took) ? chalk.grey(` [took ${chalk.grey(took)} ms]`) : '');

    if (this.config.get('replicas', []).length > 0) {
      msg += chalk.cyan(` (via ${this.type} connection '${this.options!.name || this.config.get('name') || this.options!.host}')`);
    }

    this.config.getLogger().log('query', msg);
  }

}

export interface QueryResult {
  affectedRows: number;
  insertId: number;
  row?: Dictionary;
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export type Transaction<T = any> = T;
