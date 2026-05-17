import { AbstractSqlConnection, type ConnectionConfig, type TransactionEventBroadcaster, Utils } from '@mikro-orm/sql';
import { type ControlledTransaction, MssqlDialect } from 'kysely';
import {
  convertRoutineInbound,
  convertRoutineOutbound,
  type Dictionary,
  ScalarReference,
  type Routine,
  type Transaction,
} from '@mikro-orm/core';
import type { ConnectionConfiguration } from 'tedious';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';

/** Microsoft SQL Server database connection using the `tedious` driver. */
export class MsSqlConnection extends AbstractSqlConnection {
  override createKyselyDialect(overrides: ConnectionConfiguration): MssqlDialect {
    const options = this.mapOptions(overrides);
    const poolOptions = Utils.mergeConfig(
      {
        min: 0,
        max: 10,
      },
      this.config.get('pool'),
    );
    const password = options.authentication?.options?.password as ConnectionConfig['password'];
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');

    return new MssqlDialect({
      tarn: { ...Tarn, options: poolOptions },
      tedious: {
        ...Tedious,
        connectionFactory: async () => {
          options.authentication!.options.password = typeof password === 'function' ? await password() : password;
          const connection = new Tedious.Connection(options);
          /* v8 ignore next */
          await onCreateConnection?.(connection);

          return connection;
        },
      },
    });
  }

  private mapOptions(overrides: ConnectionConfiguration): ConnectionConfiguration {
    const options = this.getConnectionOptions();
    const ret = {
      authentication: {
        options: {
          password: options.password,
          userName: options.user,
        },
        type: 'default',
      },
      options: {
        database: options.database,
        port: options.port,
        enableArithAbort: true,
        fallbackToDefaultDb: true,
        useUTC: this.config.get('forceUtcTimezone', false),
        encrypt: false,
      },
      server: options.host!,
    } as ConnectionConfiguration;

    /* v8 ignore next */
    if (ret.server.includes('\\')) {
      const [host, ...name] = ret.server.split('\\');
      ret.server = host;
      ret.options!.instanceName = name.join('\\');
      delete ret.options!.port;
    }

    return Utils.mergeConfig(ret, overrides);
  }

  override async callRoutine<T>(routine: Routine, args: Record<string, unknown> = {}, ctx?: Transaction): Promise<T> {
    const schema = routine.schema ?? this.platform.getDefaultSchemaName() ?? 'dbo';
    // MSSQL scalar UDF calls must be schema-qualified — `select sql_hash(...)` fails to parse.
    const qualified = `${this.platform.quoteIdentifier(schema)}.${this.platform.quoteIdentifier(routine.name)}`;

    if (routine.type === 'function') {
      const placeholders = routine.params.map(() => '?').join(', ');
      const positional = routine.params.map(p => convertRoutineInbound(args[p.name as string], p, this.platform));
      const rows = (await this.execute(
        `select ${qualified}(${placeholders}) as value`,
        positional,
        'all',
        ctx,
      )) as Dictionary[];
      return convertRoutineOutbound<T>(rows[0]?.value, routine.returnCustomType, this.platform);
    }

    // T-SQL session variables don't persist across execute() calls (different pool connections),
    // so DECLARE/SET/EXEC/SELECT must go through as a single batch.
    const declareLines: string[] = [];
    const setLines: string[] = [];
    const setValues: unknown[] = [];
    const callArgs: string[] = [];
    const inValues: unknown[] = [];
    const outVars: { name: string; varName: string; param: (typeof routine.params)[number] }[] = [];

    routine.params.forEach((p, i) => {
      if (p.direction === 'in') {
        callArgs.push('?');
        inValues.push(convertRoutineInbound(args[p.name as string], p, this.platform));
        return;
      }

      const varName = `@_mikro_orm_routine_${i}`;
      declareLines.push(`declare ${varName} ${p.type}`);
      outVars.push({ name: p.name as string, varName, param: p });

      if (p.direction === 'inout') {
        setLines.push(`set ${varName} = ?`);
        setValues.push(convertRoutineInbound(args[p.name as string], p, this.platform));
      }

      callArgs.push(`${varName} output`);
    });

    const allValues = [...setValues, ...inValues];
    const batch = [...declareLines, ...setLines, `exec ${qualified} ${callArgs.join(', ')}`];

    if (outVars.length > 0) {
      const selectClause = outVars.map(o => `${o.varName} as [${o.name}]`).join(', ');
      batch.push(`select ${selectClause}`);
    }

    const result = await this.execute(batch.join('; '), allValues, 'all', ctx);

    if (outVars.length === 0) {
      return undefined as T;
    }

    const rows = result as Dictionary[];
    const row = rows[0] ?? {};

    for (const { name: paramName, param } of outVars) {
      const ref = args[paramName];

      if (ref instanceof ScalarReference) {
        ref.set(convertRoutineOutbound(row[paramName], param.customType, this.platform));
      }
    }

    return undefined as T;
  }

  override async commit(
    ctx: ControlledTransaction<any, any>,
    eventBroadcaster?: TransactionEventBroadcaster,
  ): Promise<void> {
    if ('savepointName' in ctx) {
      return;
    }

    return super.commit(ctx, eventBroadcaster);
  }

  protected override transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    const rowCount = res.rows.length;
    const hasEmptyCount = rowCount === 1 && '' in res.rows[0];
    const emptyRow = hasEmptyCount && Number(res.rows[0]['']);

    return {
      affectedRows: hasEmptyCount ? emptyRow : Number(res.numAffectedRows),
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }
}
