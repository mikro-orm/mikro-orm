import { BaseSqliteConnection } from '@mikro-orm/knex';
import { LibSqlKnexDialect } from './LibSqlKnexDialect';

export class LibSqlConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(LibSqlKnexDialect as any);
    this.connected = true;
  }

}
