import {
  AbstractSchemaGenerator,
  type ClearDatabaseOptions,
  type CreateSchemaOptions,
  type Dictionary,
  type DropSchemaOptions,
  type EnsureDatabaseOptions,
  type ISchemaGenerator,
  type MikroORM,
  type Transaction,
  type UpdateSchemaOptions,
  Utils,
} from '@mikro-orm/core';
import type { SchemaDifference, TableDifference } from '../typings';
import { DatabaseSchema } from './DatabaseSchema';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import { SchemaComparator } from './SchemaComparator';

export class SqlSchemaGenerator extends AbstractSchemaGenerator<AbstractSqlDriver> implements ISchemaGenerator {

  protected readonly helper = this.platform.getSchemaHelper()!;
  protected readonly options = this.config.get('schemaGenerator');
  protected lastEnsuredDatabase?: string;

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', () => new SqlSchemaGenerator(orm.em));
  }

  override async createSchema(options?: CreateSchemaOptions): Promise<void> {
    await this.ensureDatabase();
    const sql = await this.getCreateSchemaSQL(options);
    await this.execute(sql);
  }

  /**
   * Returns true if the database was created.
   */
  override async ensureDatabase(options?: EnsureDatabaseOptions): Promise<boolean> {
    const dbName = this.config.get('dbName')!;

    if (this.lastEnsuredDatabase === dbName && !options?.forceCheck) {
      return true;
    }

    const exists = await this.helper.databaseExists(this.connection, dbName);
    this.lastEnsuredDatabase = dbName;

    if (!exists) {
      const managementDbName = this.helper.getManagementDbName();

      if (managementDbName) {
        this.config.set('dbName', managementDbName);
        await this.driver.reconnect();
        await this.createDatabase(dbName);
        this.config.set('dbName', dbName);
        await this.driver.reconnect();
      }

      if (options?.create) {
        await this.createSchema(options);
      }

      return true;
    }

    if (options?.clear) {
      await this.clearDatabase(options);
    }

    return false;
  }

  getTargetSchema(schema?: string): DatabaseSchema {
    const metadata = this.getOrderedMetadata(schema);
    const schemaName = schema ?? this.config.get('schema') ?? this.platform.getDefaultSchemaName();
    return DatabaseSchema.fromMetadata(metadata, this.platform, this.config, schemaName);
  }

  override async getCreateSchemaSQL(options: CreateSchemaOptions = {}): Promise<string> {
    const toSchema = this.getTargetSchema(options.schema);
    const ret: string[] = [];

    for (const namespace of toSchema.getNamespaces()) {
      if (namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      const sql = this.helper.getCreateNamespaceSQL(namespace);
      this.append(ret, sql);
    }

    if (this.platform.supportsNativeEnums()) {
      const created: string[] = [];

      for (const [enumName, enumOptions] of Object.entries(toSchema.getNativeEnums())) {
        /* istanbul ignore if */
        if (created.includes(enumName)) {
          continue;
        }

        created.push(enumName);

        const sql = this.helper.getCreateNativeEnumSQL(enumOptions.name, enumOptions.items, this.getSchemaName(enumOptions, options));
        this.append(ret, sql);
      }
    }

    for (const table of toSchema.getTables()) {
      this.append(ret, this.helper.createTable(table), true);
    }

    if (this.helper.supportsSchemaConstraints()) {
      for (const table of toSchema.getTables()) {
        const fks = Object.values(table.getForeignKeys()).map(fk => this.helper.createForeignKey(table, fk));
        this.append(ret, fks, true);
      }
    }

    return this.wrapSchema(ret, options);
  }

  override async dropSchema(options: DropSchemaOptions = {}): Promise<void> {
    if (options.dropDb) {
      const name = this.config.get('dbName')!;
      return this.dropDatabase(name);
    }

    const sql = await this.getDropSchemaSQL(options);
    await this.execute(sql);
  }

  async createNamespace(name: string): Promise<void> {
    const sql = this.helper.getCreateNamespaceSQL(name);
    await this.execute(sql);
  }

  async dropNamespace(name: string): Promise<void> {
    const sql = this.helper.getDropNamespaceSQL(name);
    await this.execute(sql);
  }

  override async clearDatabase(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    /* istanbul ignore if */
    if (options?.truncate === false) {
      return super.clearDatabase(options);
    }

    await this.execute(this.helper.disableForeignKeysSQL());
    const schema = options?.schema ?? this.config.get('schema', this.platform.getDefaultSchemaName());

    for (const meta of this.getOrderedMetadata(schema).reverse()) {
      await this.driver.createQueryBuilder(meta.className, this.em?.getTransactionContext(), 'write', false)
        .withSchema(schema)
        .truncate();
    }

    await this.execute(this.helper.enableForeignKeysSQL());
    this.clearIdentityMap();
  }

  override async getDropSchemaSQL(options: Omit<DropSchemaOptions, 'dropDb'> = {}): Promise<string> {
    await this.ensureDatabase();
    const metadata = this.getOrderedMetadata(options.schema).reverse();
    const schemas = this.getTargetSchema(options.schema).getNamespaces();
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema, schemas);
    const ret: string[] = [];

    // remove FKs explicitly if we can't use a cascading statement and we don't disable FK checks (we need this for circular relations)
    for (const meta of metadata) {
      if (!this.platform.usesCascadeStatement() && (!this.options.disableForeignKeys || options.dropForeignKeys)) {
        const table = schema.getTable(meta.tableName);

        if (!table) {
          continue;
        }

        const foreignKeys = Object.values(table.getForeignKeys());

        for (const fk of foreignKeys) {
          this.append(ret, this.helper.dropForeignKey(table.getShortestName(), fk.constraintName));
        }
      }
    }

    for (const meta of metadata) {
      this.append(ret, this.helper.dropTableIfExists(meta.tableName, this.getSchemaName(meta, options)));
    }

    if (this.platform.supportsNativeEnums()) {
      for (const columnName of Object.keys(schema.getNativeEnums())) {
        const sql = this.helper.getDropNativeEnumSQL(columnName, options.schema ?? this.config.get('schema'));
        this.append(ret, sql);
      }
    }

    if (options.dropMigrationsTable) {
      this.append(ret, this.helper.dropTableIfExists(this.config.get('migrations').tableName!, this.config.get('schema')));
    }

    return this.wrapSchema(ret, options);
  }

  private getSchemaName(meta: { schema?: string }, options: { schema?: string }): string | undefined {
    const schemaName = options.schema ?? this.config.get('schema');
    /* istanbul ignore next */
    const resolvedName = meta.schema && meta.schema === '*' ? schemaName : (meta.schema ?? schemaName);

    // skip default schema name
    if (resolvedName === this.platform.getDefaultSchemaName()) {
      return undefined;
    }

    return resolvedName;
  }

  override async updateSchema(options: UpdateSchemaOptions<DatabaseSchema> = {}): Promise<void> {
    const sql = await this.getUpdateSchemaSQL(options);
    await this.execute(sql);
  }

  override async getUpdateSchemaSQL(options: UpdateSchemaOptions<DatabaseSchema> = {}): Promise<string> {
    await this.ensureDatabase();
    const { fromSchema, toSchema } = await this.prepareSchemaForComparison(options);
    const comparator = new SchemaComparator(this.platform);
    const diffUp = comparator.compare(fromSchema, toSchema);

    return this.diffToSQL(diffUp, options);
  }

  override async getUpdateSchemaMigrationSQL(options: UpdateSchemaOptions<DatabaseSchema> = {}): Promise<{ up: string; down: string }> {
    if (!options.fromSchema) {
      await this.ensureDatabase();
    }

    const { fromSchema, toSchema } = await this.prepareSchemaForComparison(options);
    const comparator = new SchemaComparator(this.platform);
    const diffUp = comparator.compare(fromSchema, toSchema);
    const diffDown = comparator.compare(toSchema, fromSchema, diffUp);

    return {
      up: this.diffToSQL(diffUp, options),
      down: this.platform.supportsDownMigrations() ? this.diffToSQL(diffDown, options) : '',
    };
  }

  private async prepareSchemaForComparison(options: UpdateSchemaOptions<DatabaseSchema>) {
    options.safe ??= false;
    options.dropTables ??= true;
    const toSchema = this.getTargetSchema(options.schema);
    const schemas = toSchema.getNamespaces();
    const fromSchema = options.fromSchema ?? await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema, schemas);
    const wildcardSchemaTables = Object.values(this.metadata.getAll()).filter(meta => meta.schema === '*').map(meta => meta.tableName);
    fromSchema.prune(options.schema, wildcardSchemaTables);
    toSchema.prune(options.schema, wildcardSchemaTables);

    return { fromSchema, toSchema };
  }

  diffToSQL(schemaDiff: SchemaDifference, options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; schema?: string }): string {
    const ret: string[] = [];
    (globalThis as Dictionary).idx = 0;

    if (this.platform.supportsSchemas()) {
      for (const newNamespace of schemaDiff.newNamespaces) {
        const sql = this.helper.getCreateNamespaceSQL(newNamespace);
        this.append(ret, sql);
      }
    }

    if (this.platform.supportsNativeEnums()) {
      for (const newNativeEnum of schemaDiff.newNativeEnums) {
        const sql = this.helper.getCreateNativeEnumSQL(newNativeEnum.name, newNativeEnum.items, this.getSchemaName(newNativeEnum, options));
        this.append(ret, sql);
      }
    }

    if (!options.safe && this.options.createForeignKeyConstraints) {
      for (const orphanedForeignKey of schemaDiff.orphanedForeignKeys) {
        const [schemaName, tableName] = this.helper.splitTableName(orphanedForeignKey.localTableName, true);
        /* istanbul ignore if */
        const name = (schemaName ? schemaName + '.' : '') + tableName;
        this.append(ret, this.helper.dropForeignKey(name, orphanedForeignKey.constraintName));
      }

      if (schemaDiff.orphanedForeignKeys.length > 0) {
        ret.push('');
      }
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      this.append(ret, this.helper.createTable(newTable, true), true);
    }

    if (this.helper.supportsSchemaConstraints()) {
      for (const newTable of Object.values(schemaDiff.newTables)) {
        const sql: string[] = [];

        if (this.options.createForeignKeyConstraints) {
          const fks = Object.values(newTable.getForeignKeys()).map(fk => this.helper.createForeignKey(newTable, fk));
          this.append(sql, fks);
        }

        for (const check of newTable.getChecks()) {
          this.append(sql, this.helper.createCheck(newTable, check));
        }

        this.append(ret, sql, true);
      }
    }

    if (options.dropTables && !options.safe) {
      for (const table of Object.values(schemaDiff.removedTables)) {
        this.append(ret, this.helper.dropTableIfExists(table.name, table.schema));
      }

      if (Utils.hasObjectKeys(schemaDiff.removedTables)) {
        ret.push('');
      }
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      this.append(ret, this.preAlterTable(changedTable, options.safe!), true);
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      this.append(ret, this.helper.alterTable(changedTable, options.safe), true);
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      this.append(ret, this.helper.getPostAlterTable(changedTable, options.safe!), true);
    }

    if (!options.safe && this.platform.supportsNativeEnums()) {
      for (const removedNativeEnum of schemaDiff.removedNativeEnums) {
        this.append(ret, this.helper.getDropNativeEnumSQL(removedNativeEnum.name, removedNativeEnum.schema));
      }
    }

    if (options.dropTables && !options.safe) {
      for (const removedNamespace of schemaDiff.removedNamespaces) {
        const sql = this.helper.getDropNamespaceSQL(removedNamespace);
        this.append(ret, sql);
      }
    }

    return this.wrapSchema(ret, options);
  }

  /**
   * We need to drop foreign keys first for all tables to allow dropping PK constraints.
   */
  private preAlterTable(diff: TableDifference, safe: boolean): string[] {
    const ret: string[] = [];
    this.append(ret, this.helper.getPreAlterTable(diff, safe));

    for (const foreignKey of Object.values(diff.removedForeignKeys)) {
      ret.push(this.helper.dropForeignKey(diff.toTable.getShortestName(), foreignKey.constraintName));
    }

    for (const foreignKey of Object.values(diff.changedForeignKeys)) {
      ret.push(this.helper.dropForeignKey(diff.toTable.getShortestName(), foreignKey.constraintName));
    }

    return ret;
  }

  /**
   * creates new database and connects to it
   */
  override async createDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    const sql = this.helper.getCreateDatabaseSQL('' + this.platform.quoteIdentifier(name));

    if (sql) {
      await this.execute(sql);
    }

    this.config.set('dbName', name);
    await this.driver.reconnect();
  }

  override async dropDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    this.config.set('dbName', this.helper.getManagementDbName());
    await this.driver.reconnect();
    await this.execute(this.helper.getDropDatabaseSQL(name));
    this.config.set('dbName', name);
  }

  override async execute(sql: string, options: { wrap?: boolean; ctx?: Transaction } = {}) {
    options.wrap ??= false;
    const lines = this.wrapSchema(sql, options).split('\n');
    const groups: string[][] = [];
    let i = 0;

    for (const line of lines) {
      if (line.trim() === '') {
        if (groups[i]?.length > 0) {
          i++;
        }

        continue;
      }

      groups[i] ??= [];
      groups[i].push(line.trim());
    }

    if (groups.length === 0) {
      return;
    }

    if (this.platform.supportsMultipleStatements()) {
      for (const group of groups) {
        const query = group.join('\n');
        await this.driver.execute(query);
      }

      return;
    }

    await Utils.runSerial(groups.flat(), line => this.driver.execute(line));
  }

  async dropTableIfExists(name: string, schema?: string): Promise<void> {
    const sql = this.helper.dropTableIfExists(name, schema);
    return this.execute(sql);
  }

  private wrapSchema(sql: string | string[], options: { wrap?: boolean }): string {
    const array = Utils.asArray(sql);

    if (array.length === 0) {
      return '';
    }

    if (array[array.length - 1] === '') {
      array.pop();
    }

    if (options.wrap === false) {
      return array.join('\n') + '\n';
    }

    let ret = this.helper.getSchemaBeginning(this.config.get('charset'), this.options.disableForeignKeys);

    ret += array.join('\n') + '\n';
    ret += this.helper.getSchemaEnd(this.options.disableForeignKeys);

    return ret;
  }

  private append(array: string[], sql: string | string[], pad?: boolean): void {
    return this.helper.append(array, sql, pad);
  }

}

// for back compatibility
export { SqlSchemaGenerator as SchemaGenerator };
