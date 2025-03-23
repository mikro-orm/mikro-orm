import { dirname } from 'node:path';
import { LibSqlKnexDialect, BaseSqliteConnection, Utils, type Knex } from '@mikro-orm/knex';
import { ensureDir } from 'fs-extra';

export class LibSqlConnection extends BaseSqliteConnection {

  override async connect(): Promise<void> {
    this.createKnex();

    const dbName = this.config.get('dbName');

    if (dbName && dbName !== ':memory:' && !dirname(dbName).startsWith('libsql:/')) {
      await ensureDir(dirname(dbName));
    }

    await this.client.raw('pragma foreign_keys = on');
  }

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
