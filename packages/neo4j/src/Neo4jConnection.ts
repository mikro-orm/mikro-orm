import {
  type QueryResult,
  type Transaction,
  Connection,
  type ConnectionConfig,
  type ConnectionOptions,
  type ConnectionType,
  type Configuration,
} from '@mikro-orm/core';
import neo4j, {
  type Driver,
  type Session,
  type SessionMode,
  type Transaction as Neo4jTx,
} from 'neo4j-driver';

export interface Neo4jConnectionOptions extends ConnectionOptions {
  user?: string;
  password?: string;
  database?: string;
  driverOptions?: Record<string, unknown>;
}

export interface Neo4jTransactionContext extends Neo4jTx {
  __mikro_session?: Session;
}

export class Neo4jConnection extends Connection {

  protected driver!: Driver;
  protected database?: string;

  constructor(
    config: Configuration,
    options?: ConnectionOptions,
    type: ConnectionType = 'write',
  ) {
    super(config, options, type);
  }

  override async connect(): Promise<void> {
    const opts = this.getConnectionOptions();
    this.driver = neo4j.driver(
      opts.url,
      neo4j.auth.basic(opts.user, opts.password),
      opts.driverOptions,
    );
    this.database = opts.database;
    await this.driver.getServerInfo();
  }

  override async checkConnection(): Promise<
    { ok: true } | { ok: false; reason: string; error?: Error }
  > {
    try {
      const connected = await this.isConnected();
      return connected ? { ok: true } : { ok: false, reason: 'Not connected' };
    } catch (e) {
      return { ok: false, reason: (e as Error).message, error: e as Error };
    }
  }

  override async close(force?: boolean): Promise<void> {
    void force;
    await this.driver.close();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.driver.getServerInfo();
      return true;
    } catch {
      return false;
    }
  }

  getSession(type: ConnectionType = 'write'): Session {
    const mode: SessionMode =
      type === 'read' ? neo4j.session.READ : neo4j.session.WRITE;
    return this.driver.session({
      defaultAccessMode: mode,
      database: this.database,
    });
  }

  /**
   * Execute a Cypher query and return raw Neo4j result
   */
  async executeRaw(
    cypher: string,
    params: any = {},
    ctx?: Transaction,
  ): Promise<any> {
    const isWriteQuery = /(CREATE|MERGE|SET|DELETE|REMOVE)/i.test(cypher);
    const session = ctx
      ? (ctx as Neo4jTransactionContext)
      : this.getSession(isWriteQuery ? 'write' : 'read');
    const shouldCloseSession = !ctx;

    try {
      const paramObject = Array.isArray(params)
        ? params.reduce(
            (acc, cur, i) => ({ ...acc, [`p${i}`]: cur }),
            {} as Record<string, unknown>,
          )
        : params ?? {};

      // Convert all numeric parameters to Neo4j integers
      // Neo4j requires explicit Integer objects for LIMIT/SKIP and other integer values
      const convertedParams: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(paramObject)) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          // Convert all finite numbers to Neo4j Integer objects
          const intValue = Number.isInteger(value) ? value : Math.floor(value);
          convertedParams[key] = neo4j.int(intValue);
        } else {
          convertedParams[key] = value;
        }
      }

      return await session.run(cypher, convertedParams);
    } finally {
      if (shouldCloseSession && 'close' in session) {
        await (session as Session).close();
      }
    }
  }

  override async execute<T>(
    cypher: string,
    params: any = {},
    method?: 'all' | 'get' | 'run',
    ctx?: Transaction,
  ): Promise<QueryResult<T> | any | any[]> {
    const result = await this.executeRaw(cypher, params, ctx);
    return {
      affectedRows: result.summary.counters.updates().length,
      insertId: 0 as any,
      insertedIds: [],
      rows: result.records.map((r: any) => r.toObject()),
      row: result.records.length > 0 ? result.records[0].toObject() : undefined,
    } as unknown as QueryResult<T>;
  }

  override async transactional<T>(
    cb: (trx: Neo4jTransactionContext) => Promise<T>,
    options?: { ctx?: Neo4jTransactionContext; eventBroadcaster?: any },
  ): Promise<T> {
    const ctx = options?.ctx;
    if (ctx) {
      // Nested transaction - reuse existing context
      return cb(ctx);
    }

    const session = this.getSession('write');
    const tx = session.beginTransaction() as Neo4jTransactionContext;
    tx.__mikro_session = session;

    try {
      const result = await cb(tx);
      await tx.commit();
      return result;
    } catch (e) {
      await tx.rollback().catch(() => undefined);
      throw e;
    } finally {
      await session.close();
    }
  }

  override async begin(options?: {
    ctx?: Neo4jTransactionContext;
    eventBroadcaster?: any;
  }): Promise<Neo4jTransactionContext> {
    const ctx = options?.ctx as Neo4jTransactionContext;
    if (ctx) {
      // Nested transaction support - Neo4j doesn't support savepoints, but we can reuse existing transaction
      return ctx;
    }

    const session = this.getSession('write');
    const tx = session.beginTransaction() as Neo4jTransactionContext;
    // Store session reference for later cleanup
    tx.__mikro_session = session;
    return tx;
  }

  override async commit(ctx: Neo4jTransactionContext): Promise<void> {
    await ctx.commit();
    // Close the session after commit
    if (ctx.__mikro_session) {
      await ctx.__mikro_session.close();
    }
  }

  override async rollback(ctx: Neo4jTransactionContext): Promise<void> {
    await ctx.rollback();
    // Close the session after rollback
    if (ctx.__mikro_session) {
      await ctx.__mikro_session.close();
    }
  }

  async withTransaction<T>(
    cb: (tx: Neo4jTx) => Promise<T>,
    type: ConnectionType = 'write',
  ): Promise<T> {
    const session = this.getSession(type);
    const tx = session.beginTransaction();
    try {
      const result = await cb(tx);
      await tx.commit();
      return result;
    } catch (e) {
      await tx.rollback().catch(() => undefined);
      throw e;
    } finally {
      await session.close();
    }
  }

  getDefaultClientUrl(): string {
    return 'bolt://localhost:7687';
  }

  override getConnectionOptions(): ConnectionConfig & {
    url: string;
    user: string;
    password: string;
    driverOptions?: Record<string, unknown>;
    database?: string;
  } {
    const base = super.getConnectionOptions();
    const {
      user = 'neo4j',
      password = 'test',
      database,
    } = base as Neo4jConnectionOptions;
    return {
      ...base,
      url: this.getClientUrl(),
      user,
      password,
      database,
      driverOptions: (base as Neo4jConnectionOptions).driverOptions,
    };
  }

  override getClientUrl(): string {
    const url = this.config.getClientUrl();
    return url ?? this.getDefaultClientUrl();
  }

}
