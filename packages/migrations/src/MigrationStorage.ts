import type { MigrationsOptions, Transaction } from '@mikro-orm/core';
import type { AbstractSqlDriver, Table } from '@mikro-orm/knex';
import type { MigrationParams, UmzugStorage } from 'umzug';
import * as path from 'path';
import type { MigrationRow } from './typings';

export class MigrationStorage implements UmzugStorage {

  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) { }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => `${this.getMigrationName(name)}`);
  }

  async logMigration(params: MigrationParams<any>): Promise<void> {
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(this.options.tableName!, { name }, { ctx: this.masterTransaction });
  }

  async unlogMigration(params: MigrationParams<any>): Promise<void> {
    const withoutExt = this.getMigrationName(params.name);
    const qb = this.knex.delete().from(this.options.tableName!).where('name', 'in', [params.name, withoutExt]);

    if (this.masterTransaction) {
      qb.transacting(this.masterTransaction);
    }

    await this.connection.execute(qb);
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const qb = this.knex.select('*').from(this.options.tableName!).orderBy('id', 'asc');

    if (this.masterTransaction) {
      qb.transacting(this.masterTransaction);
    }

    const res = await this.connection.execute<MigrationRow[]>(qb);

    return res.map(row => {
      if (typeof row.executed_at === 'string') {
        row.executed_at = new Date(row.executed_at);
      }

      return row;
    });
  }

  async ensureTable(): Promise<void> {
    const tables = await this.connection.execute<Table[]>(this.helper.getListTablesSQL(), [], 'all', this.masterTransaction);

    if (tables.find(t => t.table_name === this.options.tableName!)) {
      return;
    }

    await this.knex.schema.createTable(this.options.tableName!, table => {
      table.increments();
      table.string('name');
      table.dateTime('executed_at').defaultTo(this.knex.fn.now());
    });
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

  /**
   * @internal
   */
  getMigrationName(name: string) {
    const parsedName = path.parse(name);

    if (['.js', '.ts'].includes(parsedName.ext)) {
      // strip extension
      return parsedName.name;
    }

    return name;
  }

}
