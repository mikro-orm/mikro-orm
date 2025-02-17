import { dirname } from 'node:path';
import { CompiledQuery } from 'kysely';
import { Utils } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export abstract class BaseSqliteConnection extends AbstractSqlConnection {

  override async connect(simple = false): Promise<void> {
    await super.connect();

    if (simple) {
      return;
    }

    const dbName = this.config.get('dbName');

    if (dbName && dbName !== ':memory:') {
      Utils.ensureDir(dirname(this.config.get('dbName')!));
    }

    await this.client.executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
  }

  override getClientUrl(): string {
    return '';
  }

}
