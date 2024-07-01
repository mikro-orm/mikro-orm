import { LibSqlKnexDialect, BaseSqliteConnection, Utils, type Knex } from '@mikro-orm/knex';

export class LibSqlConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(LibSqlKnexDialect as any);
    this.connected = true;
  }

  protected override getKnexOptions(type: string): Knex.Config {
    return Utils.mergeConfig({
      client: type,
      connection: {
        filename: this.config.get('dbName'),
        authToken: this.config.get('password'),
      },
      pool: this.config.get('pool'),
      useNullAsDefault: true,
    }, this.config.get('driverOptions'));
  }

}
