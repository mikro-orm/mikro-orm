import { type Configuration, type ConnectionOptions } from '../utils/Configuration.js';
import { Utils } from '../utils/Utils.js';
import type { LogContext, Logger } from '../logging/Logger.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { ConnectionType, Dictionary, ISchemaGenerator, MaybePromise, Primary } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import type { TransactionEventBroadcaster } from '../events/TransactionEventBroadcaster.js';
import type { IsolationLevel } from '../enums.js';

export abstract class Connection {
  protected metadata!: MetadataStorage;
  protected platform!: Platform;
  protected readonly options: ConnectionOptions;
  protected readonly logger: Logger;
  protected connected = false;
  readonly #connectionLabel: { type: ConnectionType; name: string | undefined };

  constructor(
    protected readonly config: Configuration,
    options?: ConnectionOptions,
    protected readonly type: ConnectionType = 'write',
  ) {
    this.logger = this.config.getLogger();
    this.platform = this.config.getPlatform();
    this.#connectionLabel = { type, name: options?.name || config.get('name') || options?.host || config.get('host') };

    if (options) {
      this.options = Utils.copy(options);
    } else {
      const props = [
        'dbName',
        'clientUrl',
        'host',
        'port',
        'user',
        'password',
        'multipleStatements',
        'pool',
        'schema',
        'driverOptions',
      ] as const;
      this.options = props.reduce((o, i) => {
        (o[i] as any) = this.config.get(i);
        return o;
      }, {} as ConnectionOptions);
    }
  }

  /**
   * Establishes connection to database
   */
  abstract connect(options?: { skipOnConnect?: boolean }): void | Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract isConnected(): Promise<boolean>;

  /**
   * Are we connected to the database
   */
  abstract checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }>;

  /**
   * Closes the database connection (aka disconnect)
   */
  async close(force?: boolean): Promise<void> {
    Object.keys(this.options)
      .filter(k => k !== 'name')
      .forEach(k => delete this.options[k as keyof ConnectionOptions]);
  }

  /**
   * Ensure the connection exists, this is used to support lazy connect when using `new MikroORM()` instead of the async `init` method.
   */
  async ensureConnection(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  /**
   * Execute raw SQL queries, handy from running schema dump loaded from a file.
   * This method doesn't support transactions, as opposed to `orm.schema.execute()`, which is used internally.
   */
  async executeDump(dump: string): Promise<void> {
    throw new Error(`Executing SQL dumps is not supported by current driver`);
  }

  protected async onConnect(): Promise<void> {
    const schemaGenerator = this.config.getExtension<ISchemaGenerator>('@mikro-orm/schema-generator');

    if (this.type === 'write' && schemaGenerator) {
      if (this.config.get('ensureDatabase')) {
        const options = this.config.get('ensureDatabase');
        await schemaGenerator.ensureDatabase(typeof options === 'boolean' ? {} : { ...options, forceCheck: true });
      }

      if (this.config.get('ensureIndexes')) {
        await schemaGenerator.ensureIndexes();
      }
    }
  }

  async transactional<T>(
    cb: (trx: Transaction) => Promise<T>,
    options?: {
      isolationLevel?: IsolationLevel | `${IsolationLevel}`;
      readOnly?: boolean;
      ctx?: Transaction;
      eventBroadcaster?: TransactionEventBroadcaster;
      loggerContext?: LogContext;
    },
  ): Promise<T> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async begin(options?: {
    isolationLevel?: IsolationLevel | `${IsolationLevel}`;
    readOnly?: boolean;
    ctx?: Transaction;
    eventBroadcaster?: TransactionEventBroadcaster;
    loggerContext?: LogContext;
  }): Promise<Transaction> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async commit(
    ctx: Transaction,
    eventBroadcaster?: TransactionEventBroadcaster,
    loggerContext?: LogContext,
  ): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  async rollback(
    ctx: Transaction,
    eventBroadcaster?: TransactionEventBroadcaster,
    loggerContext?: LogContext,
  ): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract execute<T>(
    query: string,
    params?: any[],
    method?: 'all' | 'get' | 'run',
    ctx?: Transaction,
  ): Promise<QueryResult<T> | any | any[]>;

  getConnectionOptions(): ConnectionConfig {
    const ret: ConnectionConfig = {};

    if (this.options.clientUrl) {
      const url = new URL(this.options.clientUrl);
      this.options.host = ret.host = this.options.host ?? decodeURIComponent(url.hostname);
      this.options.port = ret.port = this.options.port ?? +url.port;
      this.options.user = ret.user = this.options.user ?? decodeURIComponent(url.username);
      this.options.password = ret.password = this.options.password ?? decodeURIComponent(url.password);
      this.options.dbName = ret.database = this.options.dbName ?? decodeURIComponent(url.pathname).replace(/^\//, '');

      if (this.options.schema || url.searchParams.has('schema')) {
        this.options.schema = ret.schema = this.options.schema ?? decodeURIComponent(url.searchParams.get('schema')!);
        this.config.set('schema', ret.schema);
      }
    } else {
      const url = new URL(this.config.get('clientUrl')!);
      this.options.host = ret.host = this.options.host ?? this.config.get('host', decodeURIComponent(url.hostname));
      this.options.port = ret.port = this.options.port ?? this.config.get('port', +url.port);
      this.options.user = ret.user = this.options.user ?? this.config.get('user', decodeURIComponent(url.username));
      this.options.password = ret.password =
        this.options.password ?? this.config.get('password', decodeURIComponent(url.password));
      this.options.dbName = ret.database =
        this.options.dbName ?? this.config.get('dbName', decodeURIComponent(url.pathname).replace(/^\//, ''));
    }

    return ret;
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
      const took = Date.now() - now;
      const results = Array.isArray(res) ? res.length : undefined;
      const affected = Utils.isPlainObject<QueryResult>(res) ? res.affectedRows : undefined;

      this.logQuery(query, { ...context, took, results, affected });
      this.logSlowQuery(query, took, { ...context, results, affected });

      return res;
    } catch (e) {
      const took = Date.now() - now;
      this.logQuery(query, { ...context, took, level: 'error' });
      this.logSlowQuery(query, took, { ...context, level: 'error' });
      throw e;
    }
  }

  private logSlowQuery(query: string, took: number, context?: LogContext): void {
    const threshold = this.config.get('slowQueryThreshold');

    if (threshold == null || took < threshold) {
      return;
    }

    this.config.getSlowQueryLogger().logQuery({
      ...context,
      // `enabled: true` bypasses the debug-mode check in isEnabled(),
      // ensuring slow query logs are always emitted regardless of the `debug` setting.
      enabled: true,
      level: context?.level ?? 'warning',
      namespace: 'slow-query',
      took,
      connection: this.#connectionLabel,
      query,
    });
  }

  protected logQuery(query: string, context: LogContext = {}): void {
    this.logger.logQuery({
      level: 'info',
      connection: this.#connectionLabel,
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
  password?: string | (() => MaybePromise<string>);
  database?: string;
  schema?: string;
}

export type Transaction<T = any> = T & {};
