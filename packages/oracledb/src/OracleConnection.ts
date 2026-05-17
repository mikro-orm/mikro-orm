import {
  AbstractSqlConnection,
  type AnyEntity,
  type ConnectionConfig,
  type Dictionary,
  type EntityData,
  isRaw,
  type LoggingOptions,
  NativeQueryBuilder,
  OracleDialect,
  type QueryResult,
  type RawQueryFragment,
  type Transaction,
  Utils,
} from '@mikro-orm/sql';
import { Routine, ScalarReference } from '@mikro-orm/core';
import { CompiledQuery } from 'kysely';
import oracledb, { type ExecuteOptions, type PoolAttributes } from 'oracledb';

/** Maps a routine's declared runtime type to an oracledb bind descriptor; falls back to STRING/4000 when the runtime type is unset. */
function oracleBindTypeFromRuntime(runtime: string | undefined): Dictionary {
  if (runtime === 'number' || runtime === 'bigint') {
    return { type: oracledb.NUMBER };
  }

  if (runtime === 'Date') {
    return { type: oracledb.DATE };
  }

  if (runtime === 'Buffer') {
    return { type: oracledb.BUFFER, maxSize: 4000 };
  }

  return { type: oracledb.STRING, maxSize: 4000 };
}

function oracleReturnBind(routine: Routine): Dictionary {
  const returns = routine.returns;
  const runtime = returns && typeof returns === 'object' && 'runtimeType' in returns ? returns.runtimeType : undefined;
  return { dir: oracledb.BIND_OUT, ...oracleBindTypeFromRuntime(runtime) };
}

/** Read-only functions can run on a separate Oracle connection inside an EM transaction — write-ish routines would silently auto-commit. */
function isReadOnlyRoutine(routine: Routine): boolean {
  if (routine.type !== 'function') {
    return false;
  }

  return routine.dataAccess === 'no-sql' || routine.dataAccess === 'reads-sql-data';
}

export class OracleConnection extends AbstractSqlConnection {
  private oraclePool?: oracledb.Pool;
  // Resolves `password` callbacks per acquire so `callRoutine` doesn't bypass password rotation.
  private acquireOracleConnection?: () => Promise<oracledb.Connection>;

  override async createKyselyDialect(overrides: PoolAttributes): Promise<OracleDialect> {
    const options = this.mapOptions(overrides);
    const password = options.password as ConnectionConfig['password'];
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');

    const initialPassword = typeof password === 'function' ? await password() : password;

    const poolOptions = {
      ...options,
      password: initialPassword,
      sessionCallback: onCreateConnection as PoolAttributes['sessionCallback'],
    };

    // Retry pool creation for transient Oracle errors (e.g. ORA-01017 under load)
    let pool: oracledb.Pool;
    const maxRetries = 3;

    for (let attempt = 1; ; attempt++) {
      try {
        pool = await oracledb.createPool(poolOptions);
        this.oraclePool = pool;
        break;
        /* v8 ignore start: transient Oracle pool-creation errors are not reproducible in tests */
      } catch (e: any) {
        if (attempt < maxRetries && (e.errorNum === 1017 || e.errorNum === 12514 || e.errorNum === 12541)) {
          await new Promise(resolve => setTimeout(resolve, 250 * attempt));
          continue;
        }

        throw e;
      }
      /* v8 ignore stop */
    }

    const executeOptions: ExecuteOptions = {
      fetchTypeHandler: metaData => {
        const bigInt = metaData.dbType === oracledb.DB_TYPE_NUMBER && (metaData.precision ?? 0) > 10;
        metaData.name = metaData.name.toLowerCase();

        if (bigInt || metaData.dbType === oracledb.DB_TYPE_CLOB) {
          return {
            type: oracledb.DB_TYPE_VARCHAR,
          };
        }

        if (metaData.dbType === oracledb.DB_TYPE_BLOB) {
          return {
            type: oracledb.BUFFER,
          };
        }

        return undefined;
      },
    };

    this.acquireOracleConnection =
      typeof password === 'function'
        ? async () => pool.getConnection({ password: await password() })
        : () => pool.getConnection();

    const wrappedPool =
      typeof password === 'function'
        ? {
            getConnection: this.acquireOracleConnection,
            close: (drainTime?: number) => pool.close(drainTime),
          }
        : pool;

    return new OracleDialect({
      pool: wrappedPool,
      executeOptions: executeOptions as Record<string, unknown>,
    });
  }

  mapOptions(overrides: PoolAttributes): PoolAttributes {
    const ret = { ...this.getConnectionOptions() } as PoolAttributes;
    const dbName = this.config.get('dbName');
    const pool = this.config.get('pool');
    ret.poolMin = pool?.min;
    ret.poolMax = pool?.max;
    ret.poolTimeout = pool?.idleTimeoutMillis;
    const user = this.config.get('user', dbName)!;
    ret.user = user.startsWith('"') || user === 'system' ? user : this.platform.quoteIdentifier(user);
    ret.connectionString = this.options.clientUrl ?? this.platform.getDefaultClientUrl();
    Reflect.deleteProperty(ret, 'database');
    Reflect.deleteProperty(ret, 'port');
    Reflect.deleteProperty(ret, 'host');

    return Utils.mergeConfig(ret, overrides);
  }

  override async execute<
    T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[],
  >(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: readonly unknown[] = [],
    method: 'all' | 'get' | 'run' = 'all',
    ctx?: Transaction,
    loggerContext?: LoggingOptions,
  ): Promise<T> {
    await this.ensureConnection();

    if (query instanceof NativeQueryBuilder) {
      query = query.toRaw();
    }

    if (isRaw(query)) {
      params = query.params;
      query = query.sql;
    }

    query = this.stripTrailingSemicolon(query);

    let last: Dictionary | undefined;
    let rawQuery: string | undefined;
    const lastParam = params[params.length - 1];

    if (Utils.isObject(lastParam) && '__outBindings' in lastParam && lastParam.__outBindings) {
      rawQuery = lastParam.__rawQuery;
      const { __outBindings, ...rest } = lastParam as Dictionary & { __outBindings: boolean };
      last = rest;
      params = [...params.slice(0, -1), last];
    }

    query = this.config.get('onQuery')(query, params);
    const formatted = this.platform.formatQuery(query, params);
    const sql = this.getSql(rawQuery ?? query, formatted, loggerContext);

    return this.executeQuery<T>(
      sql,
      async () => {
        const compiled = CompiledQuery.raw(formatted, last as unknown[]);

        if (ctx) {
          const res = await ctx.executeQuery(compiled);
          return this.transformRawResult<T>(res, method);
        }

        const res = await this.getClient().executeQuery({
          ...compiled,
          autoCommit: true,
        } as CompiledQuery);
        return this.transformRawResult<T>(res, method);
      },
      { query, params, ...loggerContext },
    );
  }

  /** @inheritDoc */
  override async executeDump(dump: string): Promise<void> {
    await this.ensureConnection();
    const lines = dump.split('\n').filter(i => i.trim());

    for (let line of lines) {
      if (line.startsWith('--')) {
        continue;
      }

      line = this.stripTrailingSemicolon(line);

      const raw = CompiledQuery.raw(line);
      const now = Date.now();

      try {
        await this.getClient().executeQuery(raw);
      } catch (e) {
        this.logQuery(line, { took: Date.now() - now, level: 'error', query: line });
        throw e;
      }
    }
  }

  /**
   * Oracle routines acquire their own pool connection with `autoCommit: true` (refcursor binds
   * and DML need to resolve in one round-trip), so they cannot share the EM's transaction. Wrapping
   * a writing routine in `em.transactional(...)` would silently auto-commit its writes. Read-only
   * functions are allowed through.
   */
  override async callRoutine<T>(routine: Routine, args: Record<string, unknown> = {}, ctx?: Transaction): Promise<T> {
    /* v8 ignore next 3 */
    if (!this.oraclePool || !this.acquireOracleConnection) {
      throw new Error('Oracle pool not initialised — call connect() before callRoutine().');
    }

    if (ctx && !isReadOnlyRoutine(routine)) {
      throw new Error(
        `Routine ${routine.name} was invoked inside an EntityManager transaction, but Oracle's callRoutine runs on its own pool connection with autoCommit. Read-only functions are allowed through; for procedures or routines that may write, call em.callRoutine() outside em.transactional(), or mark the routine as 'dataAccess: \\'reads-sql-data\\'' / 'no-sql' if it really is read-only.`,
      );
    }

    const name = routine.name.toUpperCase();
    // Cross-schema needs an `OWNER.NAME` prefix; mirror the schema helper's quoting on both branches.
    const quotedName = this.platform.quoteIdentifier(name);
    const qualifiedName = routine.schema
      ? `${this.platform.quoteIdentifier(routine.schema.toUpperCase())}.${quotedName}`
      : quotedName;
    const oracleConn = await this.acquireOracleConnection();

    try {
      if (routine.type === 'function') {
        const argList = routine.params.map(p => `:${p.name}`).join(', ');
        const block = `BEGIN :mo_ret := ${qualifiedName}(${argList}); END;`;
        const bindings: Dictionary = { mo_ret: oracleReturnBind(routine) };

        for (const p of routine.params) {
          bindings[p.name as string] = {
            dir: oracledb.BIND_IN,
            val: Routine.convertInbound(args[p.name as string], p, this.platform),
          };
        }

        const result = await oracleConn.execute(block, bindings, { autoCommit: true });
        return Routine.convertOutbound<T>(
          (result.outBinds as Dictionary)?.mo_ret,
          routine.returnCustomType,
          this.platform,
        );
      }

      const argList = routine.params.map(p => `:${p.name}`).join(', ');
      const block = `BEGIN ${qualifiedName}(${argList}); END;`;
      const bindings: Dictionary = {};
      const refCursorParams: string[] = [];

      for (const p of routine.params) {
        const value = Routine.convertInbound(args[p.name as string], p, this.platform);
        const isRefCursor = /sys_refcursor|ref\s*cursor/i.test(p.type);

        if (p.direction === 'in') {
          bindings[p.name as string] = { dir: oracledb.BIND_IN, val: value };
          continue;
        }

        if (isRefCursor) {
          bindings[p.name as string] = { dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_CURSOR };
          refCursorParams.push(p.name as string);
          continue;
        }

        const binding: Dictionary = {
          dir: p.direction === 'out' ? oracledb.BIND_OUT : oracledb.BIND_INOUT,
          ...oracleBindTypeFromRuntime(p.runtimeType),
        };

        if (p.direction === 'inout') {
          binding.val = value;
        }

        bindings[p.name as string] = binding;
      }

      const result = await oracleConn.execute(block, bindings, {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const outBinds = result.outBinds as Dictionary | undefined;

      if (refCursorParams.length > 0 && outBinds) {
        const sets: Dictionary[][] = [];

        for (const name of refCursorParams) {
          const cursor = outBinds[name] as Dictionary & {
            getRows: (n: number) => Promise<Dictionary[]>;
            close: () => Promise<void>;
          };
          const rows = await cursor.getRows(0);
          await cursor.close();
          // outBinds ResultSets use raw column metadata (uppercase); lowercase for cross-driver parity.
          sets.push(rows.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))));
        }

        return sets as T;
      }

      if (outBinds) {
        for (const p of routine.params) {
          if (p.direction === 'in') {
            continue;
          }

          const ref = args[p.name as string];

          if (ref instanceof ScalarReference) {
            ref.set(Routine.convertOutbound(outBinds[p.name as string], p.customType, this.platform));
          }
        }
      }

      return undefined as T;
    } finally {
      await oracleConn.close();
    }
  }

  private stripTrailingSemicolon(sql: string): string {
    if (sql.endsWith(';') && !/end(\s+\w+)?;$/i.test(sql)) {
      return sql.slice(0, -1);
    }

    return sql;
  }

  protected override transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    if (res.numAffectedRows > 0n && res.outBinds) {
      const keys = Object.keys(res.outBinds);
      const rows: Dictionary[] = [];
      res.rows = rows;

      for (let i = 0; i < res.numAffectedRows; i++) {
        const o: Dictionary = {};

        for (const key of keys) {
          o[key.replace(/^out_/, '')] = res.outBinds[key][i];
        }

        rows.push(o);
      }
    } else if (res.outBinds) {
      const keys = Object.keys(res.outBinds);
      const rows: Dictionary[] = [];

      for (const key of keys) {
        const [k, i] = key.split('__');
        rows[+i] ??= {};
        rows[+i][k.replace(/^out_/, '')] = res.outBinds[key];
      }

      res.rows = rows;
    }

    const rowCount = res.rows.length;
    /* v8 ignore start: internal result-shape branches depend on Oracle driver internals */
    const hasEmptyCount = rowCount === 1 && '' in res.rows[0];
    const emptyRow = hasEmptyCount && Number(res.rows[0]['']);
    const affectedRows = hasEmptyCount
      ? emptyRow
      : res.numAffectedRows == null
        ? rowCount
        : Number(res.numAffectedRows ?? rowCount);
    /* v8 ignore stop */

    return {
      affectedRows,
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }
}
