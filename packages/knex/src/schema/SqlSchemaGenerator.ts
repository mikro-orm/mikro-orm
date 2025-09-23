import type { Knex } from 'knex';
import {
  AbstractSchemaGenerator,
  type ClearDatabaseOptions,
  type CreateSchemaOptions,
  type DropSchemaOptions,
  type EnsureDatabaseOptions,
  type EntityMetadata,
  type ISchemaGenerator,
  type MikroORM,
  type Transaction,
  type UpdateSchemaOptions,
  Utils,
} from '@mikro-orm/core';
import type { CheckDef, IndexDef, SchemaDifference, TableDifference } from '../typings';
import { DatabaseSchema } from './DatabaseSchema';
import type { DatabaseTable } from './DatabaseTable';
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

  protected override getOrderedMetadata(schema?: string): EntityMetadata[] {
    const metadata = super.getOrderedMetadata(schema);

    // Filter out skipped tables
    return metadata.filter(meta => {
      const tableName = meta.tableName;
      const tableSchema = meta.schema ?? schema ?? this.config.get('schema');
      return !this.isTableSkipped(tableName, tableSchema);
    });
  }

  override async getCreateSchemaSQL(options: CreateSchemaOptions = {}): Promise<string> {
    const toSchema = this.getTargetSchema(options.schema);
    let ret = '';

    for (const namespace of toSchema.getNamespaces()) {
      if (namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      const sql = this.helper.getCreateNamespaceSQL(namespace);
      ret += await this.dump(sql, '\n');
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
        ret += await this.dump(sql, '\n');
      }
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.helper.createTable(tableDef));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.helper.createSchemaBuilder(tableDef.schema).alterTable(tableDef.name, table => this.createForeignKeys(table, tableDef, options.schema)));
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
    let ret = '';

    // remove FKs explicitly if we can't use cascading statement and we don't disable FK checks (we need this for circular relations)
    for (const meta of metadata) {
      const table = schema.getTable(meta.tableName);

      if (!this.platform.usesCascadeStatement() && table && (!this.options.disableForeignKeys || options.dropForeignKeys)) {
        for (const fk of Object.values(table.getForeignKeys())) {
          const builder = this.helper.createSchemaBuilder(table.schema).alterTable(table.name, tbl => {
            tbl.dropForeign(fk.columnNames, fk.constraintName);
          });
          ret += await this.dump(builder, '\n');
        }
      }
    }

    for (const meta of metadata) {
      ret += await this.dump(this.dropTable(meta.collection, this.getSchemaName(meta, options)), '\n');
    }

    if (this.platform.supportsNativeEnums()) {
      for (const columnName of Object.keys(schema.getNativeEnums())) {
        const sql = this.helper.getDropNativeEnumSQL(columnName, options.schema ?? this.config.get('schema'));
        ret += await this.dump(sql, '\n');
      }
    }

    if (options.dropMigrationsTable) {
      ret += await this.dump(this.dropTable(this.config.get('migrations').tableName!, this.config.get('schema')), '\n');
    }

    return this.wrapSchema(ret + '\n', options);
  }

  private getSchemaName(meta: { schema?: string }, options: { schema?: string }): string | undefined {
    const schemaName = options.schema ?? this.config.get('schema');
    /* istanbul ignore next */
    return meta.schema && meta.schema === '*' ? schemaName : (meta.schema ?? schemaName);
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
      up: await this.diffToSQL(diffUp, options),
      down: this.platform.supportsDownMigrations() ? await this.diffToSQL(diffDown, options) : '',
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

  async diffToSQL(schemaDiff: SchemaDifference, options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; schema?: string }): Promise<string> {
    let ret = '';

    if (this.platform.supportsSchemas()) {
      for (const newNamespace of schemaDiff.newNamespaces) {
        const sql = this.helper.getCreateNamespaceSQL(newNamespace);
        ret += await this.dump(sql, '\n');
      }
    }

    if (this.platform.supportsNativeEnums()) {
      for (const newNativeEnum of schemaDiff.newNativeEnums) {
        const sql = this.helper.getCreateNativeEnumSQL(newNativeEnum.name, newNativeEnum.items, this.getSchemaName(newNativeEnum, options));
        ret += await this.dump(sql, '\n');
      }
    }

    if (!options.safe && this.options.createForeignKeyConstraints) {
      for (const orphanedForeignKey of schemaDiff.orphanedForeignKeys) {
        const [schemaName, tableName] = this.helper.splitTableName(orphanedForeignKey.localTableName);
        ret += await this.dump(this.helper.createSchemaBuilder(schemaName).alterTable(tableName, table => {
          return table.dropForeign(orphanedForeignKey.columnNames, orphanedForeignKey.constraintName);
        }));
      }
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.helper.createTable(newTable, true));
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.helper.createSchemaBuilder(newTable.schema).alterTable(newTable.name, table => {
        this.createForeignKeys(table, newTable, options.schema);
      }));
    }

    if (options.dropTables && !options.safe) {
      for (const table of Object.values(schemaDiff.removedTables)) {
        ret += await this.dump(this.dropTable(table.name, table.schema));
      }
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      for (const builder of this.preAlterTable(changedTable, options.safe!)) {
        ret += await this.dump(builder);
      }
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      for (const builder of this.alterTable(changedTable, options.safe!)) {
        let diff = await this.dump(builder);

        if (diff.includes('CREATE TABLE `_knex_temp_alter') && this.helper.getAlterTable) {
          diff = await this.helper.getAlterTable(changedTable, options.wrap);
        }

        ret += diff;
      }
    }

    for (const changedTable of Object.values(schemaDiff.changedTables)) {
      for (const builder of this.postAlterTable(changedTable, options.safe!)) {
        ret += await this.dump(builder);
      }
    }

    if (!options.safe && this.platform.supportsNativeEnums()) {
      for (const removedNativeEnum of schemaDiff.removedNativeEnums) {
        const sql = this.helper.getDropNativeEnumSQL(removedNativeEnum.name, removedNativeEnum.schema);
        ret += await this.dump(sql, '\n');
      }
    }

    if (options.dropTables && !options.safe) {
      for (const removedNamespace of schemaDiff.removedNamespaces) {
        const sql = this.helper.getDropNamespaceSQL(removedNamespace);
        ret += await this.dump(sql, '\n');
      }
    }

    return this.wrapSchema(ret, options);
  }

  /**
   * We need to drop foreign keys first for all tables to allow dropping PK constraints.
   */
  private preAlterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const push = (sql: string) => sql ? ret.push(this.knex.schema.raw(sql)) : undefined;
    push(this.helper.getPreAlterTable(diff, safe));
    const [schemaName, tableName] = this.helper.splitTableName(diff.name);

    ret.push(this.helper.createSchemaBuilder(schemaName).alterTable(tableName, table => {
      for (const foreignKey of Object.values(diff.removedForeignKeys)) {
        table.dropForeign(foreignKey.columnNames, foreignKey.constraintName);
      }

      for (const foreignKey of Object.values(diff.changedForeignKeys)) {
        table.dropForeign(foreignKey.columnNames, foreignKey.constraintName);
      }
    }));

    return ret;
  }

  private postAlterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const push = (sql: string) => sql ? ret.push(this.knex.schema.raw(sql)) : undefined;
    push(this.helper.getPostAlterTable(diff, safe));

    return ret;
  }

  private alterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const [schemaName, tableName] = this.helper.splitTableName(diff.name);

    if (this.platform.supportsNativeEnums()) {
      const changedNativeEnums: [enumName: string, itemsNew: string[], itemsOld: string[]][] = [];

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (!column.nativeEnumName) {
          continue;
        }

        const key = schemaName && schemaName !== this.platform.getDefaultSchemaName() && !column.nativeEnumName.includes('.')
          ? schemaName + '.' + column.nativeEnumName
          : column.nativeEnumName;

        if (changedProperties.has('enumItems') && key in diff.fromTable.nativeEnums) {
          changedNativeEnums.push([column.nativeEnumName, column.enumItems!, diff.fromTable.nativeEnums[key].items]);
        }
      }

      Utils.removeDuplicates(changedNativeEnums).forEach(([enumName, itemsNew, itemsOld]) => {
        // postgres allows only adding new items
        const newItems = itemsNew.filter(val => !itemsOld.includes(val));

        if (enumName.includes('.')) {
          const [enumSchemaName, rawEnumName] = enumName.split('.');
          ret.push(...newItems.map(val => this.knex.schema.raw(this.helper.getAlterNativeEnumSQL(rawEnumName, enumSchemaName, val, itemsNew, itemsOld))));
          return;
        }

        ret.push(...newItems.map(val => this.knex.schema.raw(this.helper.getAlterNativeEnumSQL(enumName, schemaName, val, itemsNew, itemsOld))));
      });
    }

    ret.push(this.helper.createSchemaBuilder(schemaName).alterTable(tableName, table => {
      for (const index of Object.values(diff.removedIndexes)) {
        this.dropIndex(table, index);
      }

      for (const index of Object.values(diff.changedIndexes)) {
        this.dropIndex(table, index);
      }

      for (const check of Object.values(diff.removedChecks)) {
        this.dropCheck(table, check);
      }

      for (const check of Object.values(diff.changedChecks)) {
        this.dropCheck(table, check);
      }

      /* istanbul ignore else */
      if (!safe && Object.values(diff.removedColumns).length > 0) {
        this.helper.pushTableQuery(table, this.helper.getDropColumnsSQL(tableName, Object.values(diff.removedColumns), schemaName));
      }
    }));

    ret.push(this.helper.createSchemaBuilder(schemaName).alterTable(tableName, table => {
      for (const column of Object.values(diff.addedColumns)) {
        const col = this.helper.createTableColumn(table, column, diff.fromTable, undefined, true)!;
        this.helper.configureColumn(column, col, this.knex);
        const foreignKey = Object.values(diff.addedForeignKeys).find(fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name);

        if (foreignKey && this.options.createForeignKeyConstraints) {
          delete diff.addedForeignKeys[foreignKey.constraintName];
          const builder = col.references(foreignKey.referencedColumnNames[0])
            .inTable(this.helper.getReferencedTableName(foreignKey.referencedTableName))
            .withKeyName(foreignKey.constraintName)
            .onUpdate(foreignKey.updateRule!)
            .onDelete(foreignKey.deleteRule!);

          if (foreignKey.deferMode) {
            builder.deferrable(foreignKey.deferMode);
          }
        }
      }

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (changedProperties.size === 1 && changedProperties.has('comment')) {
          continue;
        }

        if (changedProperties.size === 1 && changedProperties.has('enumItems') && column.nativeEnumName) {
          continue;
        }

        const col = this.helper.createTableColumn(table, column, diff.fromTable, changedProperties, true)?.alter();

        if (col) {
          this.helper.configureColumn(column, col, this.knex, changedProperties);
        }
      }

      for (const { column } of Object.values(diff.changedColumns).filter(diff => diff.changedProperties.has('autoincrement'))) {
        this.helper.pushTableQuery(table, this.helper.getAlterColumnAutoincrement(tableName, column, schemaName));
      }

      for (const { column, changedProperties } of Object.values(diff.changedColumns).filter(diff => diff.changedProperties.has('comment'))) {
        if (['type', 'nullable', 'autoincrement', 'unsigned', 'default', 'enumItems'].some(t => changedProperties.has(t))) {
          continue; // will be handled via knex
        }

        this.helper.pushTableQuery(table, this.helper.getChangeColumnCommentSQL(tableName, column, schemaName));
      }

      for (const [oldColumnName, column] of Object.entries(diff.renamedColumns)) {
        this.helper.pushTableQuery(table, this.helper.getRenameColumnSQL(tableName, oldColumnName, column, schemaName));
      }

      for (const foreignKey of Object.values(diff.addedForeignKeys)) {
        this.helper.createForeignKey(table, foreignKey, undefined);
      }

      for (const foreignKey of Object.values(diff.changedForeignKeys)) {
        this.helper.createForeignKey(table, foreignKey, undefined);
      }

      for (const index of Object.values(diff.addedIndexes)) {
        this.helper.createIndex(table, index, diff.toTable);
      }

      for (const index of Object.values(diff.changedIndexes)) {
        this.helper.createIndex(table, index, diff.toTable, true);
      }

      for (const [oldIndexName, index] of Object.entries(diff.renamedIndexes)) {
        if (index.unique) {
          this.dropIndex(table, index, oldIndexName);
          this.helper.createIndex(table, index, diff.toTable);
        } else {
          this.helper.pushTableQuery(table, this.helper.getRenameIndexSQL(diff.name, index, oldIndexName));
        }
      }

      for (const check of Object.values(diff.addedChecks)) {
        this.helper.createCheck(table, check);
      }

      for (const check of Object.values(diff.changedChecks)) {
        this.helper.createCheck(table, check);
      }

      if ('changedComment' in diff) {
        const comment = diff.changedComment ? this.platform.quoteValue(diff.changedComment).replace(/^'|'$/g, '') : '';
        table.comment(comment);
      }
    }));

    return ret;
  }

  /**
   * creates new database and connects to it
   */
  override async createDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    const sql = this.helper.getCreateDatabaseSQL('' + this.knex.ref(name));

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

  private wrapSchema(sql: string, options: { wrap?: boolean }): string {
    if (options.wrap === false || sql.trim() === '') {
      return sql;
    }

    let ret = this.helper.getSchemaBeginning(this.config.get('charset'), this.options.disableForeignKeys);
    ret += sql;
    ret += this.helper.getSchemaEnd(this.options.disableForeignKeys);

    return ret;
  }

  private dropIndex(table: Knex.CreateTableBuilder, index: IndexDef, oldIndexName = index.keyName) {
    if (index.primary) {
      table.dropPrimary(oldIndexName);
    } else if (index.unique && index.constraint) {
      table.dropUnique(index.columnNames, oldIndexName);
    } else {
      table.dropIndex(index.columnNames, oldIndexName);
    }
  }

  private dropCheck(table: Knex.CreateTableBuilder, check: CheckDef) {
    table.dropChecks(check.name);
  }

  private dropTable(name: string, schema?: string): Knex.SchemaBuilder {
    let builder = this.helper.createSchemaBuilder(schema).dropTableIfExists(name);

    if (this.platform.usesCascadeStatement()) {
      builder = this.knex.schema.raw(builder.toQuery() + ' cascade');
    }

    return builder;
  }

  private createForeignKeys(table: Knex.CreateTableBuilder, tableDef: DatabaseTable, schema?: string): void {
    if (!this.helper.supportsSchemaConstraints()) {
      return;
    }

    for (const fk of Object.values(tableDef.getForeignKeys())) {
      this.helper.createForeignKey(table, fk, schema);
    }
  }

  private async dump(builder: Knex.SchemaBuilder | string, append = '\n\n'): Promise<string> {
    return this.helper.dump(builder, append);
  }

  private get knex() {
    return this.connection.getKnex();
  }

  private matchName(name: string, nameToMatch: string | RegExp): boolean {
    return typeof nameToMatch === 'string'
      ? name.toLocaleLowerCase() === nameToMatch.toLocaleLowerCase()
      : nameToMatch.test(name);
  }

  private isTableSkipped(tableName: string, schemaName?: string): boolean {
    const skipTables = this.options.skipTables;
    if (!skipTables || skipTables.length === 0) {
      return false;
    }

    const fullTableName = schemaName ? `${schemaName}.${tableName}` : tableName;
    return skipTables.some(pattern =>
      this.matchName(tableName, pattern) || this.matchName(fullTableName, pattern),
    );
  }

}

// for back compatibility
export { SqlSchemaGenerator as SchemaGenerator };
