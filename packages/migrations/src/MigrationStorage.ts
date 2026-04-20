import { defineEntity, p, type MigrationsOptions, type Transaction, type EntitySchema } from '@mikro-orm/core';
import {
  type AbstractSqlDriver,
  type Table,
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
    const { entity } = this.getTableName();
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(entity, { name }, { ctx: this.#masterTransaction });
  }

  async unlogMigration(params: { name: string }): Promise<void> {
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
    const tables = await this.#connection.execute<Table[]>(
      this.#helper.getListTablesSQL(),
      [],
      'all',
      this.#masterTransaction,
    );
    const { tableName, schemaName } = this.getTableName();

    // `!t.schema_name` means the row came from the connection's current schema — only treat
    // that as a match when we are looking at that same schema (no runtime override in play),
    // otherwise we would skip creating the table in the target schema.
    const matches = (t: Table) => {
      if (t.table_name !== tableName) {
        return false;
      }

      if (this.#runSchema) {
        return t.schema_name === this.#runSchema;
      }

      return !t.schema_name || t.schema_name === schemaName;
    };

    if (tables.find(matches)) {
      return;
    }

    const schemas = await this.#helper.getNamespaces(this.#connection);

    if (schemaName && !schemas.includes(schemaName)) {
      const sql = this.#helper.getCreateNamespaceSQL(schemaName);
      await this.#connection.execute(sql);
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
  }

  setMasterMigration(trx: Transaction) {
    this.#masterTransaction = trx;
  }

  unsetMasterMigration() {
    this.#masterTransaction = undefined;
  }

  setRunSchema(schema?: string) {
    if (!schema) {
      this.#runSchema = undefined;
      return;
    }

    if (!this.#helper.supportsMigrationSchema()) {
      // schemaless drivers (sqlite, libsql) silently ignore — the schema concept does not apply
      if (!this.#platform.supportsSchemas()) {
        return;
      }

      throw new Error(
        `Runtime schema for migrations is not supported by the ${this.#platform.constructor.name} driver`,
      );
    }

    this.#runSchema = schema;
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
