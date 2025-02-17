import { dirname } from 'node:path';
import { CompiledQuery } from 'kysely';
import { Utils } from '@mikro-orm/core';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export abstract class BaseSqliteConnection extends AbstractSqlConnection {

  override async connect(): Promise<void> {
    await super.connect();
    Utils.ensureDir(dirname(this.config.get('dbName')!));
    await this.client.executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
  }

  override getClientUrl(): string {
    return '';
  }

}
