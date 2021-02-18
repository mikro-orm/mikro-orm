import { MigrationsOptions, Transaction } from '@mikro-orm/core';
import { AbstractSqlDriver, Table } from '@mikro-orm/knex';
import { MigrationRow } from './typings';

export class MigrationStorage {

  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) { }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(row => row.name);
  }

  async logMigration(name: string): Promise<void> {
    await this.driver.nativeInsert(this.options.tableName!, { name }, this.masterTransaction);
  }

  async unlogMigration(name: string): Promise<void> {
    await this.driver.nativeDelete(this.options.tableName!, { name }, this.masterTransaction);
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const qb = this.knex.select('*').from(this.options.tableName!).orderBy('id', 'asc');

    if (this.masterTransaction) {
      qb.transacting(this.masterTransaction);
    }

    return this.connection.execute<MigrationRow[]>(qb);
  }

  async ensureTable(): Promise<void> {
    const tables = await this.connection.execute<Table[]>(this.helper.getListTablesSQL(), [], 'all', this.masterTransaction);

    if (tables.find(t => t.table_name === this.options.tableName! && t.schema_name === this.connection.getSchema())) {
      return;
    }

    await this.knex.schema.createSchemaIfNotExists(this.connection.getSchema())
      .withSchema(this.connection.getSchema()).createTable(this.options.tableName!, table => {
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

}
