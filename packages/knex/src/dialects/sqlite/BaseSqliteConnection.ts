import { dirname } from 'node:path';
import { ensureDir } from 'fs-extra';
import { CompiledQuery } from 'kysely';
import { AbstractSqlConnection } from '../../AbstractSqlConnection';

export abstract class BaseSqliteConnection extends AbstractSqlConnection {

  override async connect(): Promise<void> {
    await super.connect();
    await ensureDir(dirname(this.config.get('dbName')!));
    await this.client.executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
  }

  override getClientUrl(): string {
    return '';
  }

}
