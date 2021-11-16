import type { MigrationsOptions, Transaction } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { AbstractSqlDriver, Table } from '@mikro-orm/knex';
import type { MigrationRow } from './typings';

export class MigrationStorage {

  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) { }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    /* istanbul ignore next */
    const ext = this.options.emit === 'js' || !Utils.detectTsNode() ? 'js' : 'ts';

    return migrations.map(({ name }) => `${this.getMigrationName(name)}.${ext}`);
  }

  async logMigration(name: string): Promise<void> {
    name = this.getMigrationName(name);
    await this.driver.nativeInsert(this.options.tableName!, { name }, { ctx: this.masterTransaction });
  }

  async unlogMigration(name: string): Promise<void> {
    const withoutExt = this.getMigrationName(name);
    const qb = this.knex.delete().from(this.options.tableName!).where('name', 'in', [name, withoutExt]);

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

    return this.connection.execute<MigrationRow[]>(qb);
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

  protected getMigrationName(name: string) {
    // strip extension
    return name.replace(/\.\w+$/, '');
  }

}
