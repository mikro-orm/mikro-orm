import { defineEntity, p, type MigrationsOptions, type Transaction, type EntitySchema } from '@mikro-orm/core';
import {
  type AbstractSqlDriver,
  type AbstractSqlConnection,
  type AbstractSqlPlatform,
  type SchemaHelper,
  DatabaseTable,
} from '@mikro-orm/sql';
import type { MigrationRow } from './typings.js';

/** Tracks executed migrations in a database table. */
export class MigrationStorage {
  readonly #connection: AbstractSqlConnection;
  readonly #helper: SchemaHelper;
  #masterTransaction?: Transaction;
  #runSchema?: string;
  readonly #platform: AbstractSqlPlatform;
  readonly #ensuredSchemas = new Set<string>();

  constructor(
    protected readonly driver: AbstractSqlDriver,
    protected readonly options: MigrationsOptions,
  ) {
    this.#connection = this.driver.getConnection();
    this.#platform = this.driver.getPlatform();
    this.#helper = this.#platform.getSchemaHelper()!;
  }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => this.getMigrationName(name));
  }

  async logMigration(params: { name: string }): Promise<void> {
    await this.ensureTable();
    const { entity } = this.getTableName();
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(entity, { name }, { ctx: this.#masterTransaction });
  }

  async unlogMigration(params: { name: string }): Promise<void> {
    await this.ensureTable();
    const { entity } = this.getTableName();
    const withoutExt = this.getMigrationName(params.name);
    const names = [withoutExt, withoutExt + '.js', withoutExt + '.ts'];
    await this.driver.nativeDelete(
      entity,
      { name: { $in: [params.name, ...names] } },
      { ctx: this.#masterTransaction },
    );
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await this.ensureTable();
    const { entity, schemaName } = this.getTableName();
    const res = await this.driver
      .createQueryBuilder<MigrationRow>(entity, this.#masterTransaction)
      .withSchema(schemaName)
      .orderBy({ id: 'asc' })
      .execute('all', false);

    return res.map(row => {
      if (typeof row.executed_at === 'string' || typeof row.executed_at === 'number') {
        row.executed_at = new Date(row.executed_at);
      }

      return row;
    });
  }

  async ensureTable(): Promise<void> {
    const { tableName, schemaName } = this.getTableName();
    const cacheKey = `${schemaName ?? ''}.${tableName}`;

    if (this.#ensuredSchemas.has(cacheKey)) {
      return;
    }

    if (await this.#helper.tableExists(this.#connection, tableName, schemaName, this.#masterTransaction)) {
      this.#ensuredSchemas.add(cacheKey);
      return;
    }

    const schemas = await this.#helper.getNamespaces(this.#connection, this.#masterTransaction);

    if (schemaName && !schemas.includes(schemaName)) {
      const sql = this.#helper.getCreateNamespaceSQL(schemaName);
      await this.#connection.execute(sql, [], 'run', this.#masterTransaction);
    }

    const table = new DatabaseTable(this.#platform, tableName, schemaName);
    table.addColumn({
      name: 'id',
      type: this.#platform.getIntegerTypeDeclarationSQL({ autoincrement: true, unsigned: true }),
      mappedType: this.#platform.getMappedType('number'),
      primary: true,
      autoincrement: true,
    });
    table.addColumn({
      name: 'name',
      type: this.#platform.getVarcharTypeDeclarationSQL({}),
      mappedType: this.#platform.getMappedType('string'),
    });
    const length = this.#platform.getDefaultDateTimeLength();
    table.addColumn({
      name: 'executed_at',
      type: this.#platform.getDateTimeTypeDeclarationSQL({ length }),
      mappedType: this.#platform.getMappedType('datetime'),
      default: this.#platform.getCurrentTimestampSQL(length),
      length,
    });
    const sql = this.#helper.createTable(table);
    await this.#connection.execute(sql.join(';\n'), [], 'run', this.#masterTransaction);
    this.#ensuredSchemas.add(cacheKey);
  }

  setMasterMigration(trx: Transaction) {
    this.#masterTransaction = trx;
  }

  unsetMasterMigration() {
    this.#masterTransaction = undefined;
  }

  setRunSchema(schema?: string) {
    this.#runSchema = this.#helper.resolveMigrationSchema(schema);
  }

  unsetRunSchema() {
    this.#runSchema = undefined;
  }

  /**
   * @internal
   */
  getMigrationName(name: string): string {
    return name.replace(/\.[jt]s$/, '');
  }

  /**
   * @internal
   */
  getTableName(): { tableName: string; schemaName: string; entity: EntitySchema } {
    const parts = this.options.tableName!.split('.');
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    const schemaName =
      this.#runSchema ??
      this.options.schema ??
      (parts.length > 1
        ? parts[0]
        : this.driver.config.get('schema', this.driver.getPlatform().getDefaultSchemaName()));

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
