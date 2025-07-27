import {
  AbstractSqlConnection,
  type Knex,
  MsSqlKnexDialect,
  Utils,
} from '@mikro-orm/knex';
import type { Dictionary } from '@mikro-orm/core';

export class MsSqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.client = this.createKnexClient(MsSqlKnexDialect as any);
    this.connected = true;
  }

  getDefaultClientUrl(): string {
    return 'mssql://sa@localhost:1433';
  }

  override getConnectionOptions(): Knex.MsSqlConnectionConfig {
    const config = super.getConnectionOptions();
    const overrides: Dictionary = {
      options: {
        enableArithAbort: true,
        fallbackToDefaultDb: true,
        useUTC: this.config.get('forceUtcTimezone', false),
      },
    };

    /* istanbul ignore next */
    if (config.host?.includes('\\')) {
      const [host, ...name] = config.host.split('\\');
      overrides.server = host;
      overrides.options.instanceName = name.join('\\');
      delete config.host;
      delete config.port;
    }

    Utils.mergeConfig(config, overrides);

    return config as Knex.MsSqlConnectionConfig;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all' || !res) {
      return res;
    }

    const rowCount = res.length;
    const hasEmptyCount = (rowCount === 1) && ('' in res[0]);
    const emptyRow = hasEmptyCount && res[0][''];

    return {
      affectedRows: hasEmptyCount ? emptyRow : res.length,
      insertId: res[0] ? res[0].id : 0,
      row: res[0],
      rows: res,
    } as unknown as T;
  }

}
