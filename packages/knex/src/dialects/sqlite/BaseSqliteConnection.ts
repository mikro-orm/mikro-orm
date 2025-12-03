import { CompiledQuery } from 'kysely';
import { AbstractSqlConnection } from '../../AbstractSqlConnection.js';

export abstract class BaseSqliteConnection extends AbstractSqlConnection {

  override async connect(options?: { skipOnConnect?: boolean }): Promise<void> {
    await super.connect(options);
    await this.client.executeQuery(CompiledQuery.raw('pragma foreign_keys = on'));
  }

}
