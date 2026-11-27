import type { QueryConfig } from 'mariadb';
import { MySqlConnection, type Knex, MariaDbKnexDialect } from '@mikro-orm/knex';

export class MariaDbConnection extends MySqlConnection {

  override createKnex(): void {
    this.client = this.createKnexClient(MariaDbKnexDialect as any);
    this.connected = true;
  }

  override getConnectionOptions(): Knex.MySqlConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.MySqlConnectionConfig & QueryConfig;
    ret.insertIdAsNumber = true;
    ret.checkDuplicate = false;

    // the mariadb client has no ssl profiles and reads any other string as `false`
    if (typeof ret.ssl === 'string') {
      ret.ssl = true as any;
    }

    return ret;
  }

}
