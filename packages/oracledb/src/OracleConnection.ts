import {
  AbstractSqlConnection,
  type AnyEntity,
  type ConnectionConfig,
  type Dictionary,
  type EntityData,
  type LoggingOptions,
  NativeQueryBuilder,
  OracleDialect,
  type QueryResult,
  RawQueryFragment,
  type Transaction,
  Utils,
} from '@mikro-orm/sql';
import { CompiledQuery } from 'kysely';
import oracledb, { type ExecuteOptions, type PoolAttributes } from 'oracledb';

export class OracleConnection extends AbstractSqlConnection {
  override async createKyselyDialect(overrides: PoolAttributes) {
    const options = this.mapOptions(overrides);
    const password = options.password as ConnectionConfig['password'];
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');

    const poolOptions = {
      ...options,
      /* v8 ignore next: password-as-function branch requires mocking pool creation */
      password: typeof password === 'function' ? await password() : password,
      sessionCallback: onCreateConnection as PoolAttributes['sessionCallback'],
    };

    // Retry pool creation for transient Oracle errors (e.g. ORA-01017 under load)
    let pool: oracledb.Pool;
    const maxRetries = 3;

    for (let attempt = 1; ; attempt++) {
      try {
        pool = await oracledb.createPool(poolOptions);
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

    return new OracleDialect({
      pool,
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

    if (query instanceof RawQueryFragment) {
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
