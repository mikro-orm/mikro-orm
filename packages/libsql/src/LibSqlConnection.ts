import { BaseSqliteConnection } from '@mikro-orm/knex';
import { LibSqlKnexDialect } from '@mikro-orm/knex-patches';

export class LibSqlConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(LibSqlKnexDialect as any);
    this.connected = true;
  }

}
