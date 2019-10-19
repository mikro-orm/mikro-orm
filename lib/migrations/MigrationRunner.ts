import { AbstractSqlDriver } from '../drivers';
import { MigrationsOptions, Utils } from '../utils';
import { Migration } from './Migration';

export class MigrationRunner {

  private readonly connection = this.driver.getConnection();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) { }

  async run(migration: Migration, method: 'up' | 'down'): Promise<void> {
    migration.reset();
    await migration[method]();
    let queries = migration.getQueries();

    if (this.options.disableForeignKeys) {
      queries.unshift(...this.helper.getSchemaBeginning().split('\n'));
      queries.push(...this.helper.getSchemaEnd().split('\n'));
    }

    queries = queries.filter(sql => sql.trim().length > 0);

    if (!this.options.transactional || !migration.isTransactional()) {
      await Utils.runSerial(queries, sql => this.connection.execute(sql));
      return;
    }

    await this.connection.transactional(async tx => {
      await Utils.runSerial(queries, sql => this.connection.execute(tx.raw(sql)));
    });
  }

}
