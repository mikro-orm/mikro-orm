import { BaseSqliteConnection } from '@mikro-orm/knex';
import { BetterSqliteKnexDialect } from '@mikro-orm/knex-patches';

export class BetterSqliteConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(BetterSqliteKnexDialect as any);
    this.connected = true;
  }

}
