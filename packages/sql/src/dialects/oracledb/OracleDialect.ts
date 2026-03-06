// inlined https://github.com/griffiths-waite/kysely-oracledb with minor adjustments
/* v8 ignore start: internal Kysely driver integration, tested through the main Oracle driver */

import {
  type AliasNode,
  CompiledQuery,
  createQueryId,
  type DatabaseConnection,
  type DatabaseIntrospector,
  DefaultQueryCompiler,
  type Dialect,
  DialectAdapterBase,
  type Driver,
  IdentifierNode,
  type Kysely,
  type QueryCompiler,
  type QueryResult,
  RawNode,
  type TransactionSettings,
} from 'kysely';

/**
 * Subset of oracledb's Pool interface used by the dialect.
 * We define our own interface to avoid importing the `oracledb` package directly.
 */
export interface OraclePool {
  getConnection(): Promise<OraclePoolConnection>;
  close(drainTime?: number): Promise<void>;
}

/**
 * Subset of oracledb's Connection interface used by the dialect.
 */
export interface OraclePoolConnection {
  execute<R>(
    sql: string,
    params: unknown[],
    options?: Record<string, unknown>,
  ): Promise<{
    rows?: R[];
    rowsAffected?: number;
    resultSet?: OracleResultSet<R>;
    outBinds?: unknown;
  }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): Promise<void>;
}

interface OracleResultSet<R> {
  getRow(): Promise<R>;
  close(): Promise<void>;
}

function parseSavepointCommand(command: string, savepointName: string) {
  return RawNode.createWithChildren([
    RawNode.createWithSql(`${command} `),
    IdentifierNode.create(savepointName), // ensures savepointName gets sanitized
  ]);
}

class OracleQueryCompiler extends DefaultQueryCompiler {
  protected override getLeftIdentifierWrapper(): string {
    return '';
  }

  protected override getRightIdentifierWrapper(): string {
    return '';
  }

  protected override visitAlias(node: AliasNode): void {
    this.visitNode(node.node);
    this.append(' ');
    this.visitNode(node.alias);
  }
}

class OracleAdapter extends DialectAdapterBase {
  #supportsReturning = false;
  #supportsTransactionalDdl = false;

  override get supportsReturning(): boolean {
    return this.#supportsReturning;
  }

  override get supportsTransactionalDdl(): boolean {
    return this.#supportsTransactionalDdl;
  }

  async acquireMigrationLock(_: Kysely<any>): Promise<void> {
    throw new Error('Not implemented');
  }

  async releaseMigrationLock(_: Kysely<any>): Promise<void> {
    throw new Error('Not implemented');
  }
}

const OUT_FORMAT_OBJECT = 4002;

let i = 0;

class OracleConnection implements DatabaseConnection {
  readonly id = i++;
  #executeOptions: Record<string, unknown>;
  #connection: OraclePoolConnection;

  constructor(connection: OraclePoolConnection, executeOptions?: Record<string, unknown>) {
    this.#executeOptions = executeOptions ?? {};
    this.#connection = connection;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, bindParams } = this.formatQuery(compiledQuery);
    const result = await this.#connection.execute<R>(sql, bindParams, {
      autoCommit: (compiledQuery as any).autoCommit,
      outFormat: OUT_FORMAT_OBJECT,
      ...this.#executeOptions,
    });

    return {
      rows: result?.rows || [],
      numAffectedRows: result.rowsAffected ? BigInt(result.rowsAffected) : undefined,
      // @ts-ignore internal extension for Oracle returning clause
      outBinds: result.outBinds,
    };
  }

  formatQuery(query: CompiledQuery): { sql: string; bindParams: unknown[] } {
    return {
      sql: query.sql.replace(/\$(\d+)/g, (_match, p1) => `:${parseInt(p1, 10) - 1}`), // Format bind params in Oracle syntax :0, :1, etc.
      bindParams: query.parameters as unknown[],
    };
  }

  async *streamQuery<R>(compiledQuery: CompiledQuery, _chunkSize?: number): AsyncIterableIterator<QueryResult<R>> {
    const { sql, bindParams } = this.formatQuery(compiledQuery);
    const result = await this.#connection.execute<R>(sql, bindParams, {
      resultSet: true,
      autoCommit: (compiledQuery as any).autoCommit,
      outFormat: OUT_FORMAT_OBJECT,
      ...this.#executeOptions,
    });
    const rs = result.resultSet!;
    try {
      let row: R;
      while ((row = await rs.getRow())) {
        yield { rows: [row] };
      }
    } finally {
      await rs.close();
    }
  }

  get connection(): OraclePoolConnection {
    return this.#connection;
  }
}

class OracleDriver implements Driver {
  readonly #config: OracleDialectConfig;
  readonly #connections = new Set<OracleConnection>();

  constructor(config: OracleDialectConfig) {
    this.#config = config;
  }

  async init(): Promise<void> {
    //
  }

  async acquireConnection(): Promise<OracleConnection> {
    const connection = new OracleConnection(await this.#config.pool.getConnection(), this.#config.executeOptions);
    this.#connections.add(connection);
    return connection;
  }

  async savepoint(
    connection: OracleConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(compileQuery(parseSavepointCommand('savepoint', savepointName), createQueryId()));
  }

  async rollbackToSavepoint(
    connection: OracleConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(parseSavepointCommand('rollback to savepoint', savepointName), createQueryId()),
    );
  }

  async releaseSavepoint(
    connection: OracleConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    //
  }

  async beginTransaction(connection: OracleConnection, settings: TransactionSettings): Promise<void> {
    if (settings.accessMode) {
      await connection.executeQuery(CompiledQuery.raw(`set transaction ${settings.accessMode}`));
      return;
    }

    if (settings.isolationLevel) {
      await connection.executeQuery(CompiledQuery.raw(`set transaction isolation level ${settings.isolationLevel}`));
    }
  }

  async commitTransaction(connection: OracleConnection): Promise<void> {
    await connection.connection.commit();
  }

  async rollbackTransaction(connection: OracleConnection): Promise<void> {
    await connection.connection.rollback();
  }

  async releaseConnection(connection: OracleConnection): Promise<void> {
    try {
      await connection.connection.close();
    } catch (err) {
      //
    } finally {
      this.#connections.delete(connection);
    }
  }

  async destroy(): Promise<void> {
    for (const connection of this.#connections) {
      await this.releaseConnection(connection);
    }
    await this.#config.pool?.close(0);
  }
}

export interface OracleDialectConfig {
  pool: OraclePool;
  executeOptions?: Record<string, unknown>;
}

export class OracleDialect implements Dialect {
  readonly #config: OracleDialectConfig;

  constructor(config: OracleDialectConfig) {
    this.#config = config;
  }

  createDriver(): OracleDriver {
    return new OracleDriver(this.#config);
  }

  createAdapter(): OracleAdapter {
    return new OracleAdapter();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    throw new Error('Not implemented');
  }

  createQueryCompiler(): OracleQueryCompiler {
    return new OracleQueryCompiler();
  }
}
/* v8 ignore stop */
