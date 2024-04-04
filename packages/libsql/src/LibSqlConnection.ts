import { LibSqlKnexDialect, BaseSqliteConnection } from '@mikro-orm/knex';

export class LibSqlConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(LibSqlKnexDialect as any);
    this.connected = true;
  }

}
