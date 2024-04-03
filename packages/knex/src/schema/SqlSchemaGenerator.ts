import type { Knex } from 'knex';
import {
  AbstractSchemaGenerator,
  Utils,
  type Dictionary,
  type EntityMetadata,
  type MikroORM,
  type ISchemaGenerator,
  type ClearDatabaseOptions,
  type CreateSchemaOptions,
  type EnsureDatabaseOptions,
  type DropSchemaOptions,
  type UpdateSchemaOptions,
} from '@mikro-orm/core';
import type { CheckDef, ForeignKey, IndexDef, SchemaDifference, TableDifference } from '../typings';
import { DatabaseSchema } from './DatabaseSchema';
import type { DatabaseTable } from './DatabaseTable';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import { SchemaComparator } from './SchemaComparator';

export class SqlSchemaGenerator extends AbstractSchemaGenerator<AbstractSqlDriver> implements ISchemaGenerator {

  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly options = this.config.get('schemaGenerator');
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
    const wrap = options.wrap ?? this.options.disableForeignKeys;
    const toSchema = this.getTargetSchema(options.schema);
    let ret = '';

    for (const namespace of toSchema.getNamespaces()) {
      if (namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      ret += await this.dump(this.knex.schema.createSchemaIfNotExists(namespace));
    }

    if (this.platform.supportsNativeEnums()) {
      const created: string[] = [];

      for (const [enumName, enumOptions] of Object.entries(toSchema.getNativeEnums())) {
        /* istanbul ignore if */
        if (created.includes(enumName)) {
          continue;
        }

        created.push(enumName);
        const sql = this.helper.getCreateNativeEnumSQL(enumName, enumOptions.items, options.schema ?? this.config.get('schema'));
        ret += await this.dump(this.knex.schema.raw(sql), '\n');
      }
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.createTable(tableDef));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.createSchemaBuilder(tableDef.schema).alterTable(tableDef.name, table => this.createForeignKeys(table, tableDef, options.schema)));
    }

    return this.wrapSchema(ret, { wrap });
  }

  override async dropSchema(options: DropSchemaOptions = {}): Promise<void> {
    if (options.dropDb) {
      const name = this.config.get('dbName')!;
      return this.dropDatabase(name);
    }

    const sql = await this.getDropSchemaSQL(options);
    await this.execute(sql);
  }

  override async clearDatabase(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    /* istanbul ignore if */
    if (options?.truncate === false) {
      return super.clearDatabase(options);
    }

    await this.execute(this.helper.disableForeignKeysSQL());

    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      await this.driver.createQueryBuilder(meta.className, this.em?.getTransactionContext(), 'write', false)
        .withSchema(options?.schema)
        .truncate();
    }

    await this.execute(this.helper.enableForeignKeysSQL());

    if (this.em) {
      const allowGlobalContext = this.config.get('allowGlobalContext');
      this.config.set('allowGlobalContext', true);
      this.em.clear();
      this.config.set('allowGlobalContext', allowGlobalContext);
    }
  }

  override async getDropSchemaSQL(options: Omit<DropSchemaOptions, 'dropDb'> = {}): Promise<string> {
    await this.ensureDatabase();
    const wrap = options.wrap ?? this.options.disableForeignKeys;
    const metadata = this.getOrderedMetadata(options.schema).reverse();
    const schemas = this.getTargetSchema(options.schema).getNamespaces();
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema, schemas);
    let ret = '';

    // remove FKs explicitly if we can't use cascading statement and we don't disable FK checks (we need this for circular relations)
    for (const meta of metadata) {
      const table = schema.getTable(meta.tableName);

      if (!this.platform.usesCascadeStatement() && table && !wrap) {
        for (const fk of Object.values(table.getForeignKeys())) {
          const builder = this.createSchemaBuilder(table.schema).alterTable(table.name, tbl => {
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
        ret += await this.dump(this.knex.schema.raw(sql), '\n');
      }
    }

    if (options.dropMigrationsTable) {
      ret += await this.dump(this.dropTable(this.config.get('migrations').tableName!, this.config.get('schema')), '\n');
    }

    return this.wrapSchema(ret + '\n', { wrap });
  }

  private getSchemaName(meta: EntityMetadata, options: { schema?: string }): string | undefined {
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
    options.wrap ??= this.options.disableForeignKeys;
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
        // schema might already exist, e.g. explicit usage of `public` in postgres
        ret += await this.dump(this.knex.schema.createSchemaIfNotExists(newNamespace));
      }
    }

    if (this.platform.supportsNativeEnums()) {
      for (const newNativeEnum of schemaDiff.newNativeEnums) {
        const sql = this.helper.getCreateNativeEnumSQL(newNativeEnum.name, newNativeEnum.items, newNativeEnum.schema ?? options.schema ?? this.config.get('schema'));
        ret += await this.dump(this.knex.schema.raw(sql), '\n');
      }
    }

    if (!options.safe) {
      for (const orphanedForeignKey of schemaDiff.orphanedForeignKeys) {
        const [schemaName, tableName] = this.splitTableName(orphanedForeignKey.localTableName);
        ret += await this.dump(this.createSchemaBuilder(schemaName).alterTable(tableName, table => {
          return table.dropForeign(orphanedForeignKey.columnNames, orphanedForeignKey.constraintName);
        }));
      }
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.createTable(newTable, true));
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.createSchemaBuilder(newTable.schema).alterTable(newTable.name, table => {
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
        ret += await this.dump(builder);
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
        ret += await this.dump(this.knex.schema.raw(sql), '\n');
      }
    }

    if (options.dropTables && !options.safe) {
      for (const removedNamespace of schemaDiff.removedNamespaces) {
        ret += await this.dump(this.knex.schema.dropSchema(removedNamespace));
      }
    }

    return this.wrapSchema(ret, options);
  }

  private getReferencedTableName(referencedTableName: string, schema?: string) {
    const [schemaName, tableName] = this.splitTableName(referencedTableName);
    schema = schemaName ?? schema ?? this.config.get('schema');

    /* istanbul ignore next */
    if (schema && schemaName === '*') {
      return `${schema}.${referencedTableName.replace(/^\*\./, '')}`;
    }

    if (!schemaName || schemaName === this.platform.getDefaultSchemaName()) {
      return tableName;
    }

    return `${schemaName}.${tableName}`;
  }

  private createForeignKey(table: Knex.CreateTableBuilder, foreignKey: ForeignKey, schema?: string) {
    if (!this.options.createForeignKeyConstraints) {
      return;
    }

    const builder = table
      .foreign(foreignKey.columnNames, foreignKey.constraintName)
      .references(foreignKey.referencedColumnNames)
      .inTable(this.getReferencedTableName(foreignKey.referencedTableName, schema))
      .withKeyName(foreignKey.constraintName);

    if (foreignKey.updateRule) {
      builder.onUpdate(foreignKey.updateRule);
    }

    if (foreignKey.deleteRule) {
      builder.onDelete(foreignKey.deleteRule);
    }

    if (foreignKey.deferMode) {
      builder.deferrable(foreignKey.deferMode);
    }
  }

  /**
   * We need to drop foreign keys first for all tables to allow dropping PK constraints.
   */
  private preAlterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const push = (sql: string) => sql ? ret.push(this.knex.schema.raw(sql)) : undefined;
    push(this.helper.getPreAlterTable(diff, safe));
    const [schemaName, tableName] = this.splitTableName(diff.name);

    ret.push(this.createSchemaBuilder(schemaName).alterTable(tableName, table => {
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

  private splitTableName(name: string): [string | undefined, string] {
    const parts = name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();

    return [schemaName, tableName];
  }

  private alterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const [schemaName, tableName] = this.splitTableName(diff.name);

    if (this.platform.supportsNativeEnums()) {
      const changedNativeEnums: [enumName: string, itemsNew: string[], itemsOld: string[]][] = [];

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (!column.nativeEnumName) {
          continue;
        }

        const key = schemaName && schemaName !== this.platform.getDefaultSchemaName() ? schemaName + '.' + column.nativeEnumName : column.nativeEnumName;

        if (changedProperties.has('enumItems') && key in diff.fromTable.nativeEnums) {
          changedNativeEnums.push([column.nativeEnumName, column.enumItems!, diff.fromTable.nativeEnums[key].items]);
        }
      }

      Utils.removeDuplicates(changedNativeEnums).forEach(([enumName, itemsNew, itemsOld]) => {
        // postgres allows only adding new items, the values are case insensitive
        itemsOld = itemsOld.map(v => v.toLowerCase());
        const newItems = itemsNew.filter(val => !itemsOld.includes(val.toLowerCase()));
        ret.push(...newItems.map(val => this.knex.schema.raw(this.helper.getAlterNativeEnumSQL(enumName, schemaName, val))));
      });
    }

    ret.push(this.createSchemaBuilder(schemaName).alterTable(tableName, table => {
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

    ret.push(this.createSchemaBuilder(schemaName).alterTable(tableName, table => {
      for (const column of Object.values(diff.addedColumns)) {
        const col = this.helper.createTableColumn(table, column, diff.fromTable, undefined, true);
        this.helper.configureColumn(column, col, this.knex);
        const foreignKey = Object.values(diff.addedForeignKeys).find(fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name);

        if (foreignKey && this.options.createForeignKeyConstraints) {
          delete diff.addedForeignKeys[foreignKey.constraintName];
          col.references(foreignKey.referencedColumnNames[0])
            .inTable(this.getReferencedTableName(foreignKey.referencedTableName))
            .withKeyName(foreignKey.constraintName)
            .onUpdate(foreignKey.updateRule!)
            .onDelete(foreignKey.deleteRule!);
        }
      }

      for (const { column, changedProperties, fromColumn } of Object.values(diff.changedColumns)) {
        if (changedProperties.size === 1 && changedProperties.has('comment')) {
          continue;
        }

        if (changedProperties.size === 1 && changedProperties.has('enumItems') && column.nativeEnumName) {
          continue;
        }

        const col = this.helper.createTableColumn(table, column, diff.fromTable, changedProperties, true).alter();
        this.helper.configureColumn(column, col, this.knex, changedProperties);
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
        this.createForeignKey(table, foreignKey);
      }

      for (const foreignKey of Object.values(diff.changedForeignKeys)) {
        this.createForeignKey(table, foreignKey);
      }

      for (const index of Object.values(diff.addedIndexes)) {
        this.createIndex(table, index, diff.toTable);
      }

      for (const index of Object.values(diff.changedIndexes)) {
        this.createIndex(table, index, diff.toTable, true);
      }

      for (const [oldIndexName, index] of Object.entries(diff.renamedIndexes)) {
        if (index.unique) {
          this.dropIndex(table, index, oldIndexName);
          this.createIndex(table, index, diff.toTable);
        } else {
          this.helper.pushTableQuery(table, this.helper.getRenameIndexSQL(diff.name, index, oldIndexName));
        }
      }

      for (const check of Object.values(diff.addedChecks)) {
        this.createCheck(table, check);
      }

      for (const check of Object.values(diff.changedChecks)) {
        this.createCheck(table, check);
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
  override async createDatabase(name: string): Promise<void> {
    const sql = this.helper.getCreateDatabaseSQL('' + this.knex.ref(name));

    if (sql) {
      await this.driver.execute(sql);
    }

    this.config.set('dbName', name);
    await this.driver.reconnect();
  }

  override async dropDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    this.config.set('dbName', this.helper.getManagementDbName());
    await this.driver.reconnect();
    await this.driver.execute(this.helper.getDropDatabaseSQL('' + this.knex.ref(name)));
  }

  override async execute(sql: string, options: { wrap?: boolean } = {}) {
    options.wrap ??= false;
    const lines = this.wrapSchema(sql, options).split('\n').filter(i => i.trim());

    if (lines.length === 0) {
      return;
    }

    if (this.platform.supportsMultipleStatements()) {
      const query = lines.join('\n');
      await this.driver.execute(query);
      return;
    }

    await Utils.runSerial(lines, line => this.driver.execute(line));
  }

  private wrapSchema(sql: string, options: { wrap?: boolean }): string {
    options.wrap ??= this.options.disableForeignKeys;

    if (!options.wrap || sql.trim() === '') {
      return sql;
    }

    let ret = this.helper.getSchemaBeginning(this.config.get('charset'));
    ret += sql;
    ret += this.helper.getSchemaEnd();

    return ret;
  }

  private createSchemaBuilder(schema?: string): Knex.SchemaBuilder {
    const builder = this.knex.schema;

    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      builder.withSchema(schema);
    }

    return builder;
  }

  private createTable(tableDef: DatabaseTable, alter?: boolean): Knex.SchemaBuilder {
    return this.createSchemaBuilder(tableDef.schema).createTable(tableDef.name, table => {
      tableDef.getColumns().forEach(column => {
        const col = this.helper.createTableColumn(table, column, tableDef, undefined, alter);
        this.helper.configureColumn(column, col, this.knex);
      });

      for (const index of tableDef.getIndexes()) {
        const createPrimary = !tableDef.getColumns().some(c => c.autoincrement && c.primary) || this.helper.hasNonDefaultPrimaryKeyName(tableDef);
        this.createIndex(table, index, tableDef, createPrimary);
      }

      for (const check of tableDef.getChecks()) {
        this.createCheck(table, check);
      }

      if (tableDef.comment) {
        const comment = this.platform.quoteValue(tableDef.comment).replace(/^'|'$/g, '');
        table.comment(comment);
      }

      if (!this.helper.supportsSchemaConstraints()) {
        for (const fk of Object.values(tableDef.getForeignKeys())) {
          this.createForeignKey(table, fk);
        }
      }

      this.helper.finalizeTable(table, this.config.get('charset'), this.config.get('collate'));
    });
  }

  private createIndex(table: Knex.CreateTableBuilder, index: IndexDef, tableDef: DatabaseTable, createPrimary = false) {
    if (index.primary && !createPrimary) {
      return;
    }

    if (index.primary) {
      const keyName = this.helper.hasNonDefaultPrimaryKeyName(tableDef) ? index.keyName : undefined;
      table.primary(index.columnNames, keyName);
    } else if (index.unique) {
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      if (index.columnNames.some(column => column.includes('.'))) {
        const columns = this.platform.getJsonIndexDefinition(index);
        table.index(columns.map(column => this.knex.raw(column)), index.keyName, { indexType: 'unique' });
      } else {
        table.unique(index.columnNames, { indexName: index.keyName });
      }
    } else if (index.expression) {
      this.helper.pushTableQuery(table, index.expression);
    } else if (index.type === 'fulltext') {
      const columns = index.columnNames.map(name => ({ name, type: tableDef.getColumn(name)!.type }));

      if (this.platform.supportsCreatingFullTextIndex()) {
        this.helper.pushTableQuery(table, this.platform.getFullTextIndexExpression(index.keyName, tableDef.schema, tableDef.name, columns));
      }
    } else {
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      if (index.columnNames.some(column => column.includes('.'))) {
        const columns = this.platform.getJsonIndexDefinition(index);
        table.index(columns.map(column => this.knex.raw(column)), index.keyName, index.type as Dictionary);
      } else {
        table.index(index.columnNames, index.keyName, index.type as Dictionary);
      }
    }
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

  private createCheck(table: Knex.CreateTableBuilder, check: CheckDef) {
    table.check(check.expression as string, {}, check.name);
  }

  private dropCheck(table: Knex.CreateTableBuilder, check: CheckDef) {
    table.dropChecks(check.name);
  }

  private dropTable(name: string, schema?: string): Knex.SchemaBuilder {
    let builder = this.createSchemaBuilder(schema).dropTableIfExists(name);

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
      this.createForeignKey(table, fk, schema);
    }
  }

  private async dump(builder: Knex.SchemaBuilder, append = '\n\n'): Promise<string> {
    const sql = await builder.generateDdlCommands();
    const queries = [...sql.pre, ...sql.sql, ...sql.post];

    if (queries.length === 0) {
      return '';
    }

    const dump = `${queries.map(q => typeof q === 'object' ? (q as Dictionary).sql : q).join(';\n')};${append}`;
    const tmp = dump.replace(/pragma table_.+/ig, '').replace(/\n\n+/g, '\n').trim();

    return tmp ? tmp + append : '';
  }

  private get knex() {
    return this.connection.getKnex();
  }

}

// for back compatibility
export { SqlSchemaGenerator as SchemaGenerator };
