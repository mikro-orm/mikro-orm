import { defineEntity, p, type MigrationsOptions, type Transaction, type EntitySchema } from '@mikro-orm/core';
import {
  type AbstractSqlDriver,
  type AbstractSqlConnection,
  type AbstractSqlPlatform,
  type SchemaHelper,
  DatabaseTable,
  SchemaComparator,
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

  async logMigration(params: { name: string }, tx?: Transaction): Promise<void> {
    await this.ensureTable();
    const { entity } = this.getTableName();
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(entity, { name }, { ctx: tx ?? this.#masterTransaction });
  }

  async unlogMigration(params: { name: string }, tx?: Transaction): Promise<void> {
    await this.ensureTable();
    const { entity } = this.getTableName();
    const withoutExt = this.getMigrationName(params.name);
    const names = [withoutExt, withoutExt + '.js', withoutExt + '.ts'];
    await this.driver.nativeDelete(
      entity,
      { name: { $in: [params.name, ...names] } },
      { ctx: tx ?? this.#masterTransaction },
    );
  }

  async setBreakpoint(params: { name: string; breakpoint: boolean }): Promise<void> {
    const rows = await this.getExecutedMigrations();
    const name = this.getMigrationName(params.name);
    const row = rows.find(migration => this.getMigrationName(migration.name) === name);

    if (!row) {
      throw new Error(`Cannot set breakpoint on a migration that has not been executed: ${name}`);
    }

    const { entity, tableName, schemaName } = this.getTableName();

    // Legacy tracking tables are upgraded only when explicitly setting a breakpoint.
    if (!('breakpoint' in row)) {
      const fromTable = new DatabaseTable(this.#platform, tableName, schemaName);
      const toTable = new DatabaseTable(this.#platform, tableName, schemaName);
      this.addBreakpointColumn(toTable);
      const diff = new SchemaComparator(this.#platform).diffTable(fromTable, toTable);
      const sql = this.#helper.alterTable(diff as Exclude<typeof diff, false>);
      await this.#connection.execute(sql.join(';\n'), [], 'run', this.#masterTransaction);
    }

    await this.driver.nativeUpdate(
      entity,
      { name: { $in: [name, `${name}.js`, `${name}.ts`] } },
      { breakpoint: params.breakpoint },
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

      if ('breakpoint' in row) {
        row.breakpoint = Boolean(row.breakpoint);
      }

      return row;
    });
  }

  async ensureTable(): Promise<void> {
    const { tableName, schemaName } = this.resolveTableName();
    // `\x00` can't appear in SQL identifiers — unambiguous pair encoding
    const cacheKey = `${schemaName ?? ''}\x00${tableName}`;

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
    this.addBreakpointColumn(table);
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
    const { tableName, schemaName } = this.resolveTableName();

    const entity = defineEntity({
      name: 'Migration',
      tableName,
      schema: schemaName,
      properties: {
        id: p.integer().primary().fieldNames('id'),
        name: p.string().fieldNames('name'),
        executedAt: p.datetime().defaultRaw('current_timestamp').fieldNames('executed_at'),
        breakpoint: p.boolean().default(false),
      },
    }).init();
    entity.meta.sync();

    return { tableName, schemaName, entity };
  }

  private addBreakpointColumn(table: DatabaseTable): void {
    table.addColumn({
      name: 'breakpoint',
      type: this.#platform.getBooleanTypeDeclarationSQL(),
      mappedType: this.#platform.getMappedType('boolean'),
      default: String(this.#helper.normalizeDefaultValue('false')),
      nullable: false,
    });
  }

  private resolveTableName(): { tableName: string; schemaName: string } {
    const parts = this.options.tableName!.split('.');
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    const schemaName =
      this.#runSchema ??
      this.options.schema ??
      (parts.length > 1
        ? parts[0]
        : this.driver.config.get('schema', this.driver.getPlatform().getDefaultSchemaName()));
    return { tableName, schemaName };
  }
}
