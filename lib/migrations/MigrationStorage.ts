import { AbstractSqlDriver } from '../drivers';
import { MigrationsOptions } from '../utils';
import { Table } from '../schema';

export class MigrationStorage {

  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();
  private readonly helper = this.driver.getPlatform().getSchemaHelper()!;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) { }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(row => row.name);
  }

  async logMigration(name: string): Promise<void> {
    await this.driver.nativeInsert(this.options.tableName!, { name });
  }

  async unlogMigration(name: string): Promise<void> {
    await this.driver.nativeDelete(this.options.tableName!, { name });
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const knex = this.connection.getKnex();
    const qb = knex.select('*').from(this.options.tableName!).orderBy('id', 'asc');

    return this.connection.execute<MigrationRow[]>(qb);
  }

  async ensureTable(): Promise<void> {
    const tables = await this.connection.execute<Table[]>(this.helper.getListTablesSQL());

    if (tables.find(t => t.table_name === this.options.tableName!)) {
      return;
    }

    await this.knex.schema.createTable(this.options.tableName!, table => {
      table.increments();
      table.string('name');
      table.dateTime('executed_at').defaultTo(this.knex.fn.now());
    });
  }

}

export interface MigrationRow {
  name: string;
  executed_at: Date;
}
