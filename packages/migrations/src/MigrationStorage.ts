import { defineEntity, p, type MigrationsOptions, type Transaction, type EntitySchema } from '@mikro-orm/core';
import {
  type AbstractSqlDriver,
  type Table,
  type AbstractSqlConnection,
  type AbstractSqlPlatform,
  type SchemaHelper,
  DatabaseTable,
} from '@mikro-orm/sql';
import type { MigrationParams, UmzugStorage } from 'umzug';
import { parse } from 'node:path';
import type { MigrationRow } from './typings.js';

export class MigrationStorage implements UmzugStorage {
  private readonly connection: AbstractSqlConnection;
  private readonly helper: SchemaHelper;
  private masterTransaction?: Transaction;
  private readonly platform: AbstractSqlPlatform;

  constructor(
    protected readonly driver: AbstractSqlDriver,
    protected readonly options: MigrationsOptions,
  ) {
    this.connection = this.driver.getConnection();
    this.platform = this.driver.getPlatform();
    this.helper = this.platform.getSchemaHelper()!;
  }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => `${this.getMigrationName(name)}`);
  }

  async logMigration(params: MigrationParams<any>): Promise<void> {
    const { entity } = this.getTableName();
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(entity, { name }, { ctx: this.masterTransaction });
  }

  async unlogMigration(params: MigrationParams<any>): Promise<void> {
    const { entity } = this.getTableName();
    const withoutExt = this.getMigrationName(params.name);
    const names = [withoutExt, withoutExt + '.js', withoutExt + '.ts'];
    await this.driver.nativeDelete(entity, { name: { $in: [params.name, ...names] } }, { ctx: this.masterTransaction });
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const { entity, schemaName } = this.getTableName();
    const res = await this.driver
      .createQueryBuilder<MigrationRow>(entity, this.masterTransaction)
      .withSchema(schemaName)
      .orderBy({ id: 'asc' })
      .execute('all', false);

    return res.map(row => {
      if (typeof row.executed_at === 'string') {
        row.executed_at = new Date(row.executed_at);
      }

      return row;
    });
  }

  async ensureTable(): Promise<void> {
    const tables = await this.connection.execute<Table[]>(
      this.helper.getListTablesSQL(),
      [],
      'all',
      this.masterTransaction,
    );
    const { tableName, schemaName } = this.getTableName();

    if (tables.find(t => t.table_name === tableName && (!t.schema_name || t.schema_name === schemaName))) {
      return;
    }

    const schemas = await this.helper.getNamespaces(this.connection);

    if (schemaName && !schemas.includes(schemaName)) {
      const sql = this.helper.getCreateNamespaceSQL(schemaName);
      await this.connection.execute(sql);
    }

    const table = new DatabaseTable(this.platform, tableName, schemaName);
    table.addColumn({
      name: 'id',
      type: this.platform.getIntegerTypeDeclarationSQL({ autoincrement: true, unsigned: true }),
      mappedType: this.platform.getMappedType('number'),
      primary: true,
      autoincrement: true,
    });
    table.addColumn({
      name: 'name',
      type: this.platform.getVarcharTypeDeclarationSQL({}),
      mappedType: this.platform.getMappedType('string'),
    });
    const length = this.platform.getDefaultDateTimeLength();
    table.addColumn({
      name: 'executed_at',
      type: this.platform.getDateTimeTypeDeclarationSQL({ length }),
      mappedType: this.platform.getMappedType('datetime'),
      default: this.platform.getCurrentTimestampSQL(length),
      length,
    });
    const sql = this.helper.createTable(table);
    await this.connection.execute(sql.join(';\n'), [], 'run', this.masterTransaction);
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
    const parsedName = parse(name);

    if (['.js', '.ts'].includes(parsedName.ext)) {
      // strip extension
      return parsedName.name;
    }

    return name;
  }

  /**
   * @internal
   */
  getTableName(): { tableName: string; schemaName: string; entity: EntitySchema } {
    const parts = this.options.tableName!.split('.');
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    const schemaName =
      parts.length > 1 ? parts[0] : this.driver.config.get('schema', this.driver.getPlatform().getDefaultSchemaName());

    const entity = defineEntity({
      name: 'Migration',
      tableName,
      schema: schemaName,
      properties: {
        id: p.integer().primary().fieldNames('id'),
        name: p.string().fieldNames('name'),
        executedAt: p.datetime().defaultRaw('current_timestamp').fieldNames('executed_at'),
      },
    }).init();
    entity.meta.sync();

    return { tableName, schemaName, entity };
  }
}
