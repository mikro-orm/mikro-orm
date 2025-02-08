import {
  type DatabaseConnection,
  type QueryResult,
  type SqliteDatabase,
  SqliteDialect,
  type SqliteDialectConfig,
  SqliteDriver,
} from 'kysely';

const CONNECTION_TIMEOUT = 10_000;

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

  private readonly created = Date.now();
  declare memory: boolean;

  constructor(private readonly db: SqliteDatabase) {}

  isValid(): boolean {
    return this.memory || this.created > Date.now() - CONNECTION_TIMEOUT;
  }

  async executeQuery<R>(compiledQuery: any): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const stmt = this.db.prepare(sql);

    if (stmt.reader) {
      return {
        rows: stmt.all(parameters) as R[],
      };
    }

    const query = sql.trim().toLowerCase();

    /* istanbul ignore next */
    if (query.startsWith('select') || ((query.startsWith('insert into') || query.startsWith('update ')) && query.includes(' returning '))) {
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

  /* istanbul ignore next */
  async *streamQuery<R>(compiledQuery: any): AsyncIterableIterator<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const stmt = this.db.prepare(sql);

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

  private db!: SqliteDatabase;
  private connection!: LibSqlConnection;
  private connectionMutex = new ConnectionMutex();

  constructor(private readonly config: SqliteDialectConfig) {
    super(config);
  }

  override async init() {
    this.db = await (this.config.database as () => Promise<SqliteDatabase>)();
    this.connection = new LibSqlConnection(this.db);

    /* istanbul ignore next */
    if (this.config.onCreateConnection) {
      await this.config.onCreateConnection(this.connection);
    }
  }

  override async acquireConnection() {
    await this.connectionMutex.lock();

    /* istanbul ignore next */
    if (!this.connection.isValid()) {
      await this.destroy();
      await this.init();
    }

    return this.connection;
  }

  override async releaseConnection() {
    this.connectionMutex.unlock();
  }

  override async destroy() {
    this.db.close();
  }

}

export class LibSqlDialect extends SqliteDialect {

  constructor(private readonly config: SqliteDialectConfig) {
    super(config);
  }

  override createDriver() {
    return new LibSqlKyselyDriver(this.config);
  }

}
