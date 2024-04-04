import { BetterSqliteKnexDialect, BaseSqliteConnection } from '@mikro-orm/knex';

export class BetterSqliteConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(BetterSqliteKnexDialect as any);
    this.connected = true;
  }

}
