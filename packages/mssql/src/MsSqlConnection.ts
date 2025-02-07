import {
  AbstractSqlConnection,
  type ConnectionConfig,
  type TransactionEventBroadcaster,
  Utils,
} from '@mikro-orm/knex';
import { type ControlledTransaction, MssqlDialect } from 'kysely';
import type { ConnectionConfiguration } from 'tedious';
import * as Tedious from 'tedious';
import * as Tarn from 'tarn';

export class MsSqlConnection extends AbstractSqlConnection {

  override createKyselyDialect(overrides: ConnectionConfiguration) {
    const options = this.mapOptions(overrides);
    const poolOptions = Utils.mergeConfig({
      min: 0,
      max: 10,
    }, this.config.get('pool'));
    const password = options.authentication?.options?.password as ConnectionConfig['password'];
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');

    return new MssqlDialect({
      tarn: { ...Tarn, options: poolOptions },
      tedious: {
        ...Tedious,
        connectionFactory: async () => {
          options.authentication!.options.password = typeof password === 'function' ? await password() : password;
          const connection = new Tedious.Connection(options);
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

    /* istanbul ignore next */
    if (ret.server.includes('\\')) {
      const [host, ...name] = ret.server.split('\\');
      ret.server = host;
      ret.options!.instanceName = name.join('\\');
      delete ret.options!.port;
    }

    return Utils.mergeConfig(ret, overrides);
  }

  override async commit(ctx: ControlledTransaction<any, any>, eventBroadcaster?: TransactionEventBroadcaster): Promise<void> {
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
    const hasEmptyCount = (rowCount === 1) && ('' in res.rows[0]);
    const emptyRow = hasEmptyCount && Number(res.rows[0]['']);

    return {
      affectedRows: hasEmptyCount ? emptyRow : Number(res.numAffectedRows),
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }

}
