import type { Knex } from 'knex';
import { parseJsonSafe, ValidationError } from '@mikro-orm/core';
import { MySqlKnexDialect } from './MySqlKnexDialect';
import { AbstractSqlConnection } from '../../AbstractSqlConnection';

export class MySqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.client = this.createKnexClient(MySqlKnexDialect as any);
    this.connected = true;
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  override getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.MySqlConnectionConfig;

    if (this.config.get('multipleStatements')) {
      ret.multipleStatements = this.config.get('multipleStatements');
    }

    if (this.config.get('forceUtcTimezone')) {
      ret.timezone = 'Z';
    }

    if (this.config.get('timezone')) {
      ret.timezone = this.config.get('timezone');
    }

    // `clientUrl` is split into separate options, so the `ssl` param from its query string needs to be mapped too
    const params = new URL(this.options.clientUrl ?? this.config.getClientUrl()).searchParams;
    const unsupported = [...params.keys()].find(key => /^ssl-?mode$/i.test(key));

    if (unsupported) {
      throw new ValidationError(`The \`${unsupported}\` parameter in \`clientUrl\` is not supported by the MySQL driver, use the \`ssl\` parameter or \`driverOptions\` instead.`);
    }

    const ssl = params.get('ssl');

    if (ssl != null) {
      ret.ssl = parseJsonSafe(ssl);
    }

    ret.supportBigNumbers = true;
    ret.dateStrings = true;

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'run' && ['OkPacket', 'ResultSetHeader'].includes(res[0].constructor.name)) {
      return {
        insertId: res[0].insertId,
        affectedRows: res[0].affectedRows,
        rows: [],
      } as unknown as T;
    }

    if (method === 'get') {
      return res[0][0];
    }

    return res[0];
  }

}
