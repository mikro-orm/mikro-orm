import type { Knex } from 'knex';
import { AbstractSchemaGenerator, Utils, type Dictionary, type EntityMetadata, type MikroORM } from '@mikro-orm/core';
import type { Check, ForeignKey, Index, SchemaDifference, TableDifference } from '../typings';
import { DatabaseSchema } from './DatabaseSchema';
import type { DatabaseTable } from './DatabaseTable';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import { SchemaComparator } from './SchemaComparator';

/**
 * Should be renamed to `SqlSchemaGenerator` in v6
 */
export class SchemaGenerator extends AbstractSchemaGenerator<AbstractSqlDriver> {

  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly options = this.config.get('schemaGenerator');
  protected lastEnsuredDatabase?: string;

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', new SchemaGenerator(orm.em));
  }

  /** @deprecated use `dropSchema` and `createSchema` commands respectively */
  async generate(): Promise<string> {
    const [dropSchema, createSchema] = await Promise.all([
      this.getDropSchemaSQL({ wrap: false }),
      this.getCreateSchemaSQL({ wrap: false }),
    ]);

    return this.wrapSchema(dropSchema + createSchema);
  }

  async createSchema(options?: { wrap?: boolean; schema?: string }): Promise<void> {
    await this.ensureDatabase();
    const sql = await this.getCreateSchemaSQL(options);
    await this.execute(sql);
  }

  /**
   * Returns true if the database was created.
   */
  async ensureDatabase(): Promise<boolean> {
    const dbName = this.config.get('dbName')!;

    if (this.lastEnsuredDatabase === dbName) {
      return true;
    }

    const exists = await this.helper.databaseExists(this.connection, dbName);
    this.lastEnsuredDatabase = dbName;

    if (!exists) {
      this.config.set('dbName', this.helper.getManagementDbName());
      await this.driver.reconnect();
      await this.createDatabase(dbName);
      this.config.set('dbName', dbName);
      await this.driver.reconnect();

      return true;
    }

    return false;
  }

  getTargetSchema(schema?: string): DatabaseSchema {
    const metadata = this.getOrderedMetadata(schema);
    const schemaName = schema ?? this.config.get('schema') ?? this.platform.getDefaultSchemaName();
    return DatabaseSchema.fromMetadata(metadata, this.platform, this.config, schemaName);
  }

  async getCreateSchemaSQL(options: { wrap?: boolean; schema?: string } = {}): Promise<string> {
    const wrap = options.wrap ?? this.options.disableForeignKeys;
    const toSchema = this.getTargetSchema(options.schema);
    let ret = '';

    for (const namespace of toSchema.getNamespaces()) {
      if (namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      ret += await this.dump(this.knex.schema.createSchemaIfNotExists(namespace));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.createTable(tableDef));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.createSchemaBuilder(tableDef.schema).alterTable(tableDef.name, table => this.createForeignKeys(table, tableDef, options.schema)));
    }

    return this.wrapSchema(ret, { wrap });
  }

  async dropSchema(options: { wrap?: boolean; dropMigrationsTable?: boolean; dropDb?: boolean; schema?: string } = {}): Promise<void> {
    if (options.dropDb) {
      const name = this.config.get('dbName')!;
      return this.dropDatabase(name);
    }

    const sql = await this.getDropSchemaSQL(options);
    await this.execute(sql);
  }

  async clearDatabase(options?: { schema?: string; truncate?: boolean }): Promise<void> {
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

  async getDropSchemaSQL(options: { wrap?: boolean; dropMigrationsTable?: boolean; schema?: string } = {}): Promise<string> {
    await this.ensureDatabase();
    const wrap = options.wrap ?? this.options.disableForeignKeys;
    const metadata = this.getOrderedMetadata(options.schema).reverse();
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema);
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

  async updateSchema(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema; schema?: string } = {}): Promise<void> {
    const sql = await this.getUpdateSchemaSQL(options);
    await this.execute(sql);
  }

  async getUpdateSchemaSQL(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema; schema?: string } = {}): Promise<string> {
    await this.ensureDatabase();
    const { fromSchema, toSchema } = await this.prepareSchemaForComparison(options);
    const comparator = new SchemaComparator(this.platform);
    const diffUp = comparator.compare(fromSchema, toSchema);

    return this.diffToSQL(diffUp, options);
  }

  async getUpdateSchemaMigrationSQL(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema; schema?: string } = {}): Promise<{ up: string; down: string }> {
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

  private async prepareSchemaForComparison(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema; schema?: string }) {
    options.wrap ??= this.options.disableForeignKeys;
    options.safe ??= false;
    options.dropTables ??= true;
    const toSchema = this.getTargetSchema(options.schema);
    const fromSchema = options.fromSchema ?? await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema);
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

    if (!options.safe) {
      for (const orphanedForeignKey of schemaDiff.orphanedForeignKeys) {
        const [schemaName, tableName] = this.splitTableName(orphanedForeignKey.localTableName);
        ret += await this.dump(this.createSchemaBuilder(schemaName).alterTable(tableName, table => {
          return table.dropForeign(orphanedForeignKey.columnNames, orphanedForeignKey.constraintName);
        }));
      }
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.createTable(newTable));
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

  private splitTableName(name: string): [string | undefined, string] {
    const parts = name.split('.');
    const tableName = parts.pop()!;
    const schemaName = parts.pop();

    return [schemaName, tableName];
  }

  private alterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];
    const [schemaName, tableName] = this.splitTableName(diff.name);

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

      for (const column of Object.values(diff.addedColumns)) {
        const col = this.helper.createTableColumn(table, column, diff.fromTable);
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

      /* istanbul ignore else */
      if (!safe) {
        for (const column of Object.values(diff.removedColumns)) {
          table.dropColumn(column.name);
        }
      }

      for (const { column, changedProperties } of Object.values(diff.changedColumns)) {
        if (changedProperties.size === 1 && changedProperties.has('comment')) {
          continue;
        }

        const col = this.helper.createTableColumn(table, column, diff.fromTable, changedProperties).alter();
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
  async createDatabase(name: string): Promise<void> {
    await this.driver.execute(this.helper.getCreateDatabaseSQL('' + this.knex.ref(name)));
    this.config.set('dbName', name);
    await this.driver.reconnect();
  }

  override async dropDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    this.config.set('dbName', this.helper.getManagementDbName());
    await this.driver.reconnect();
    await this.driver.execute(this.helper.getDropDatabaseSQL('' + this.knex.ref(name)));
  }

  async execute(sql: string, options: { wrap?: boolean } = {}) {
    options.wrap ??= false;
    const lines = this.wrapSchema(sql, options).split('\n').filter(i => i.trim());

    if (lines.length === 0) {
      return;
    }

    if (this.platform.supportsMultipleStatements()) {
      const query = lines.join('\n');
      return void await this.driver.execute(query);
    }

    await Utils.runSerial(lines, line => this.driver.execute(line));
  }

  private wrapSchema(sql: string, options: { wrap?: boolean } = {}): string {
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

  private createTable(tableDef: DatabaseTable): Knex.SchemaBuilder {
    return this.createSchemaBuilder(tableDef.schema).createTable(tableDef.name, table => {
      tableDef.getColumns().forEach(column => {
        const col = this.helper.createTableColumn(table, column, tableDef);
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

  private createIndex(table: Knex.CreateTableBuilder, index: Index, tableDef: DatabaseTable, createPrimary = false) {
    if (index.primary && !createPrimary) {
      return;
    }

    if (index.primary) {
      const keyName = this.helper.hasNonDefaultPrimaryKeyName(tableDef) ? index.keyName : undefined;
      table.primary(index.columnNames, keyName);
    } else if (index.unique) {
      table.unique(index.columnNames, { indexName: index.keyName });
    } else if (index.expression) {
      this.helper.pushTableQuery(table, index.expression);
    } else if (index.type === 'fulltext') {
      const columns = index.columnNames.map(name => ({ name, type: tableDef.getColumn(name)!.type }));

      if (this.platform.supportsCreatingFullTextIndex()) {
        this.helper.pushTableQuery(table, this.platform.getFullTextIndexExpression(index.keyName, tableDef.schema, tableDef.name, columns));
      }
    } else {
      table.index(index.columnNames, index.keyName, index.type as Dictionary);
    }
  }

  private dropIndex(table: Knex.CreateTableBuilder, index: Index, oldIndexName = index.keyName) {
    if (index.primary) {
      table.dropPrimary(oldIndexName);
    } else if (index.unique) {
      table.dropUnique(index.columnNames, oldIndexName);
    } else {
      table.dropIndex(index.columnNames, oldIndexName);
    }
  }

  private createCheck(table: Knex.CreateTableBuilder, check: Check) {
    table.check(check.expression as string, {}, check.name);
  }

  private dropCheck(table: Knex.CreateTableBuilder, check: Check) {
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
