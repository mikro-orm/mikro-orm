import type { QueryConfig } from 'mariadb';
import { MySqlConnection, type Knex } from '@mikro-orm/knex';
import { MariaDbKnexDialect } from './MariaDbKnexDialect';

export class MariaDbConnection extends MySqlConnection {

  override createKnex(): void {
    this.client = this.createKnexClient(MariaDbKnexDialect as any);
    this.connected = true;
  }

  override getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.MySqlConnectionConfig & QueryConfig;
    ret.insertIdAsNumber = true;
    ret.checkDuplicate = false;

    return ret;
  }

}
