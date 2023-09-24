import { AbstractSqlConnection, MonkeyPatchable, type Knex } from '@mikro-orm/knex';

export class MySqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.patchKnex();
    this.client = this.createKnexClient('mysql2');
    this.connected = true;
  }

  private patchKnex() {
    const { MySqlColumnCompiler, MySqlQueryCompiler } = MonkeyPatchable;

    // we need the old behaviour to be able to add auto_increment to a column that is already PK
    MySqlColumnCompiler.prototype.increments = function (options = { primaryKey: true }) {
      return 'int unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
    };

    /* istanbul ignore next */
    MySqlColumnCompiler.prototype.bigincrements = function (options = { primaryKey: true }) {
      return 'bigint unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
    };

    // mysql dialect disallows query non scalar params, but we dont use it to execute the query, it always goes through the `platform.formatQuery()`
    delete MySqlQueryCompiler.prototype.whereBasic;
    delete MySqlQueryCompiler.prototype.whereRaw;
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
