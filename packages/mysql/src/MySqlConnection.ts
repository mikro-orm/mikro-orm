import type { Knex } from '@mikro-orm/knex';
import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';

export class MySqlConnection extends AbstractSqlConnection {

  async connect(): Promise<void> {
    this.patchKnex();
    this.client = this.createKnexClient('mysql2');
  }

  private patchKnex() {
    const { MySqlColumnCompiler } = MonkeyPatchable;

    // we need the old behaviour to be able to add auto_increment to a column that is already PK
    MySqlColumnCompiler.prototype.increments = function (options = { primaryKey: true }) {
      return 'int unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
    };

    /* istanbul ignore next */
    MySqlColumnCompiler.prototype.bigincrements = function (options = { primaryKey: true }) {
      return 'bigint unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
    };
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  getConnectionOptions(): Knex.MySqlConnectionConfig {
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

    ret.supportBigNumbers = true;
    ret.dateStrings = ['DATE'] as any;

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
