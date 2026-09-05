import {
  type DatabaseConnection,
  type QueryResult,
  type SqliteDatabase,
  SqliteDialect,
  type SqliteDialectConfig,
  SqliteDriver,
} from 'kysely';

const CONNECTION_TIMEOUT = 10_000;

/** Kysely SQLite dialect config extended with the connection recycling libSQL needs for embedded replicas. */
export interface LibSqlDialectConfig extends SqliteDialectConfig {
  /**
   * Recreates the underlying connection once it gets stale. Embedded replicas swap the local file out when
   * syncing, so a long lived handle would keep serving the pre-sync data. A plain local database never goes
   * stale, and recycling it would silently drop per-connection state like pragmas and attached databases.
   */
  recycleConnection?: boolean;

  /** Re-applies the per-connection state after a stale connection was replaced. */
  onRecycleConnection?: () => Promise<void>;
}

class ConnectionMutex {
  #promise?: Promise<void>;
  #resolve?: () => void;

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise;
    }

    this.#promise = new Promise(resolve => {
      this.#resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.#resolve;

    this.#promise = undefined;
    this.#resolve = undefined;

    resolve?.();
  }
}

class LibSqlConnection implements DatabaseConnection {
  readonly #created = Date.now();
  readonly #db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.#db = db;
  }

  isValid(): boolean {
    return this.#created > Date.now() - CONNECTION_TIMEOUT;
  }

  async executeQuery<R>(compiledQuery: any): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const stmt = this.#db.prepare(sql);

    if (stmt.reader) {
      return {
        rows: stmt.all(parameters) as R[],
      };
    }

    const query = sql.trim().toLowerCase();

    /* v8 ignore next */
    if (
      query.startsWith('select') ||
      ((query.startsWith('insert into') || query.startsWith('update ')) && query.includes(' returning '))
    ) {
      return {
        rows: stmt.all(parameters) as R[],
      };
    }

    const { changes, lastInsertRowid } = stmt.run(parameters);
    return {
      numAffectedRows: changes as any,
      insertId: lastInsertRowid as any,
      rows: [],
    };
  }

  async *streamQuery<R>(compiledQuery: any): AsyncIterableIterator<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const stmt = this.#db.prepare(sql);

    /* v8 ignore next */
    if (!sql.toLowerCase().startsWith('select')) {
      throw new Error('Sqlite driver only supports streaming of select queries');
    }

    for (const row of stmt.iterate(parameters)) {
      yield {
        rows: [row as R],
      };
    }
  }
}

class LibSqlKyselyDriver extends SqliteDriver {
  #db!: SqliteDatabase;
  #connection!: LibSqlConnection;
  #connectionMutex = new ConnectionMutex();
  readonly #config: LibSqlDialectConfig;

  constructor(config: LibSqlDialectConfig) {
    super(config);
    this.#config = config;
  }

  override async init() {
    this.#db = await (this.#config.database as () => Promise<SqliteDatabase>)();
    this.#connection = new LibSqlConnection(this.#db);

    /* v8 ignore next */
    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection);
    }
  }

  override async acquireConnection() {
    await this.#connectionMutex.lock();

    if (this.#config.recycleConnection && !this.#connection.isValid()) {
      await this.destroy();
      await this.init();
      await this.#config.onRecycleConnection?.();
    }

    return this.#connection;
  }

  override async releaseConnection() {
    this.#connectionMutex.unlock();
  }

  override async destroy() {
    this.#db.close();
  }
}

/** Kysely dialect adapter for libSQL. */
export class LibSqlDialect extends SqliteDialect {
  readonly #config: LibSqlDialectConfig;

  constructor(config: LibSqlDialectConfig) {
    super(config);
    this.#config = config;
  }

  override createDriver(): SqliteDriver {
    return new LibSqlKyselyDriver(this.#config);
  }
}
