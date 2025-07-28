import type { MigrationsOptions, Transaction } from '@mikro-orm/core';
import type { AbstractSqlDriver, Table, AbstractSqlConnection, SchemaHelper } from '@mikro-orm/knex';
import type { MigrationParams, UmzugStorage } from 'umzug';
import * as path from 'node:path';
import type { MigrationRow } from './typings';

export class MigrationStorage implements UmzugStorage {

  private readonly connection: AbstractSqlConnection;
  private readonly helper: SchemaHelper;
  private masterTransaction?: Transaction;

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) {
    this.connection = this.driver.getConnection();
    this.helper = this.driver.getPlatform().getSchemaHelper()!;
  }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => `${this.getMigrationName(name)}`);
  }

  async logMigration(params: MigrationParams<any>): Promise<void> {
    const { tableName, schemaName } = this.getTableName();
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(tableName, { name }, { schema: schemaName, ctx: this.masterTransaction });
  }

  async unlogMigration(params: MigrationParams<any>): Promise<void> {
    const { tableName, schemaName } = this.getTableName();
    const withoutExt = this.getMigrationName(params.name);
    const names = [withoutExt, withoutExt + '.js', withoutExt + '.ts'];
    const qb = this.knex.delete().from(tableName).withSchema(schemaName).where('name', 'in', [params.name, ...names]);

    if (this.masterTransaction) {
      qb.transacting(this.masterTransaction);
    }

    await this.connection.execute(qb);
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const { tableName, schemaName } = this.getTableName();
    const qb = this.knex.select('*').from(tableName).withSchema(schemaName).orderBy('id', 'asc');

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
    const { tableName, schemaName } = this.getTableName();

    if (tables.find(t => t.table_name === tableName && (!t.schema_name || t.schema_name === schemaName))) {
      return;
    }

    const schemas = await this.helper.getNamespaces(this.connection);

    if (schemaName && !schemas.includes(schemaName)) {
      const sql = this.helper.getCreateNamespaceSQL(schemaName);
      await this.connection.execute(sql);
    }

    const builder = this.knex.schema.createTable(tableName, table => {
      table.increments();
      table.string('name');
      table.dateTime('executed_at').defaultTo(this.knex.fn.now());
    }).withSchema(schemaName);

    for (const { sql, bindings } of builder.toSQL()) {
      await this.connection.execute(sql, bindings as unknown[], 'run', this.masterTransaction);
    }
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

  /**
   * @internal
   */
  getTableName(): { tableName: string; schemaName: string } {
    const parts = this.options.tableName!.split('.');
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    const schemaName = parts.length > 1 ? parts[0] : this.driver.config.get('schema', this.driver.getPlatform().getDefaultSchemaName());

    return { tableName, schemaName };
  }

  private get knex() {
    return this.connection.getKnex();
  }

}
