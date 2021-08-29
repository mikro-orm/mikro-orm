import type { Knex } from 'knex';
import type { Dictionary, EntityMetadata } from '@mikro-orm/core';
import { CommitOrderCalculator } from '@mikro-orm/core';
import type { Column, ForeignKey, Index, SchemaDifference, TableDifference } from '../typings';
import { DatabaseSchema } from './DatabaseSchema';
import type { DatabaseTable } from './DatabaseTable';
import type { SqlEntityManager } from '../SqlEntityManager';
import { SchemaComparator } from './SchemaComparator';

export class SchemaGenerator {

  private readonly config = this.em.config;
  private readonly driver = this.em.getDriver();
  private readonly metadata = this.em.getMetadata();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();

  constructor(private readonly em: SqlEntityManager) { }

  async generate(): Promise<string> {
    const [dropSchema, createSchema] = await Promise.all([
      this.getDropSchemaSQL({ wrap: false }),
      this.getCreateSchemaSQL({ wrap: false }),
    ]);

    return this.wrapSchema(dropSchema + createSchema);
  }

  async createSchema(options?: { wrap?: boolean }): Promise<void> {
    await this.ensureDatabase();
    const sql = await this.getCreateSchemaSQL(options);
    await this.execute(sql);
  }

  async ensureDatabase() {
    const dbName = this.config.get('dbName')!;
    const exists = await this.helper.databaseExists(this.connection, dbName);

    if (!exists) {
      this.config.set('dbName', this.helper.getManagementDbName());
      await this.driver.reconnect();
      await this.createDatabase(dbName);
      this.config.set('dbName', dbName);
      await this.driver.reconnect();
    }
  }

  getTargetSchema(): DatabaseSchema {
    const metadata = this.getOrderedMetadata();
    return DatabaseSchema.fromMetadata(metadata, this.platform, this.config);
  }

  async getCreateSchemaSQL(options: { wrap?: boolean } = {}): Promise<string> {
    const wrap = options.wrap ?? true;
    const toSchema = this.getTargetSchema();
    let ret = '';

    for (const namespace of toSchema.getNamespaces()) {
      ret += await this.dump(this.knex.schema.createSchemaIfNotExists(namespace));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.createTable(tableDef));
    }

    for (const tableDef of toSchema.getTables()) {
      ret += await this.dump(this.knex.schema.alterTable(tableDef.getShortestName(), table => this.createForeignKeys(table, tableDef)));
    }

    return this.wrapSchema(ret, { wrap });
  }

  async dropSchema(options: { wrap?: boolean; dropMigrationsTable?: boolean; dropDb?: boolean } = {}): Promise<void> {
    options.wrap = options.wrap ?? true;

    if (options.dropDb) {
      const name = this.config.get('dbName')!;
      return this.dropDatabase(name);
    }

    const sql = await this.getDropSchemaSQL(options);
    await this.execute(sql);
  }

  async getDropSchemaSQL(options: { wrap?: boolean; dropMigrationsTable?: boolean } = {}): Promise<string> {
    const wrap = options.wrap ?? true;
    const metadata = this.getOrderedMetadata().reverse();
    let ret = '';

    for (const meta of metadata) {
      ret += await this.dump(this.dropTable(meta.collection, meta.schema), '\n');
    }

    if (options.dropMigrationsTable) {
      ret += await this.dump(this.dropTable(this.config.get('migrations').tableName!, this.config.get('schema')), '\n');
    }

    return this.wrapSchema(ret + '\n', { wrap });
  }

  async updateSchema(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema } = {}): Promise<void> {
    const sql = await this.getUpdateSchemaSQL(options);
    await this.execute(sql);
  }

  async getUpdateSchemaSQL(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema } = {}): Promise<string> {
    options.wrap = options.wrap ?? true;
    options.safe = options.safe ?? false;
    options.dropTables = options.dropTables ?? true;
    const toSchema = this.getTargetSchema();
    /* istanbul ignore next */
    const fromSchema = options.fromSchema ?? await DatabaseSchema.create(this.connection, this.platform, this.config);
    const comparator = new SchemaComparator(this.platform);
    const diffUp = comparator.compare(fromSchema, toSchema);

    return this.diffToSQL(diffUp, options);
  }

  async getUpdateSchemaMigrationSQL(options: { wrap?: boolean; safe?: boolean; dropTables?: boolean; fromSchema?: DatabaseSchema } = {}): Promise<{ up: string; down: string }> {
    options.wrap = options.wrap ?? true;
    options.safe = options.safe ?? false;
    options.dropTables = options.dropTables ?? true;
    const toSchema = this.getTargetSchema();
    const fromSchema = options.fromSchema ?? await DatabaseSchema.create(this.connection, this.platform, this.config);
    const comparator = new SchemaComparator(this.platform);
    const diffUp = comparator.compare(fromSchema, toSchema);
    const diffDown = comparator.compare(toSchema, fromSchema);

    return {
      up: await this.diffToSQL(diffUp, options),
      down: this.platform.supportsDownMigrations() ? await this.diffToSQL(diffDown, options) : '',
    };
  }

  async diffToSQL(schemaDiff: SchemaDifference, options: { wrap?: boolean; safe?: boolean; dropTables?: boolean }): Promise<string> {
    let ret = '';

    if (this.platform.supportsSchemas()) {
      for (const newNamespace of schemaDiff.newNamespaces) {
        ret += await this.dump(this.knex.schema.createSchema(newNamespace));
      }
    }

    if (!options.safe) {
      for (const orphanedForeignKey of schemaDiff.orphanedForeignKeys) {
        ret += await this.dump(this.knex.schema.alterTable(orphanedForeignKey.localTableName, table => table.dropForeign(orphanedForeignKey.columnNames, orphanedForeignKey.constraintName)));
      }
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.createTable(newTable));
    }

    for (const newTable of Object.values(schemaDiff.newTables)) {
      ret += await this.dump(this.knex.schema.alterTable(newTable.getShortestName(), table => this.createForeignKeys(table, newTable)));
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

  private createForeignKey(table: Knex.CreateTableBuilder, foreignKey: ForeignKey) {
    const builder = table
      .foreign(foreignKey.columnNames, foreignKey.constraintName)
      .references(foreignKey.referencedColumnNames)
      .inTable(foreignKey.referencedTableName)
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

    ret.push(this.knex.schema.alterTable(diff.name, table => {
      for (const foreignKey of Object.values(diff.removedForeignKeys)) {
        table.dropForeign(foreignKey.columnNames, foreignKey.constraintName);
      }

      for (const foreignKey of Object.values(diff.changedForeignKeys)) {
        table.dropForeign(foreignKey.columnNames, foreignKey.constraintName);
      }
    }));

    return ret;
  }

  private alterTable(diff: TableDifference, safe: boolean): Knex.SchemaBuilder[] {
    const ret: Knex.SchemaBuilder[] = [];

    ret.push(this.knex.schema.alterTable(diff.name, table => {
      for (const index of Object.values(diff.removedIndexes)) {
        this.dropIndex(table, index);
      }

      for (const index of Object.values(diff.changedIndexes)) {
        this.dropIndex(table, index);
      }

      for (const column of Object.values(diff.addedColumns)) {
        const col = this.helper.createTableColumn(table, column, diff.fromTable);
        this.configureColumn(column, col);
        const foreignKey = Object.values(diff.addedForeignKeys).find(fk => fk.columnNames.length === 1 && fk.columnNames[0] === column.name);

        if (foreignKey) {
          delete diff.addedForeignKeys[foreignKey.constraintName];
          col.references(foreignKey.referencedColumnNames[0])
            .inTable(foreignKey.referencedTableName)
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
        this.configureColumn(column, col, changedProperties);
      }

      for (const { column } of Object.values(diff.changedColumns).filter(diff => diff.changedProperties.has('autoincrement'))) {
        this.helper.pushTableQuery(table, this.helper.getAlterColumnAutoincrement(diff.name, column));
      }

      for (const { column } of Object.values(diff.changedColumns).filter(diff => diff.changedProperties.has('comment'))) {
        this.helper.pushTableQuery(table, this.helper.getChangeColumnCommentSQL(diff.name, column));
      }

      for (const [oldColumnName, column] of Object.entries(diff.renamedColumns)) {
        this.helper.pushTableQuery(table, this.helper.getRenameColumnSQL(diff.name, oldColumnName, column));
      }

      for (const foreignKey of Object.values(diff.addedForeignKeys)) {
        this.createForeignKey(table, foreignKey);
      }

      for (const foreignKey of Object.values(diff.changedForeignKeys)) {
        this.createForeignKey(table, foreignKey);
      }

      for (const index of Object.values(diff.addedIndexes)) {
        this.createIndex(table, index, diff.name);
      }

      for (const index of Object.values(diff.changedIndexes)) {
        this.createIndex(table, index, diff.name, true);
      }

      for (const [oldIndexName, index] of Object.entries(diff.renamedIndexes)) {
        if (index.unique) {
          this.dropIndex(table, index, oldIndexName);
          this.createIndex(table, index, diff.name);
        } else {
          this.helper.pushTableQuery(table, this.helper.getRenameIndexSQL(diff.name, index, oldIndexName));
        }
      }

      if ('changedComment' in diff) {
        table.comment(diff.changedComment ?? '');
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

  async dropDatabase(name: string): Promise<void> {
    this.config.set('dbName', this.helper.getManagementDbName());
    await this.driver.reconnect();
    await this.driver.execute(this.helper.getDropDatabaseSQL('' + this.knex.ref(name)));
  }

  async execute(sql: string, options: { wrap?: boolean } = {}) {
    options.wrap = options.wrap ?? false;
    const lines = this.wrapSchema(sql, options).split('\n').filter(i => i.trim());

    for (const line of lines) {
      await this.driver.execute(line);
    }
  }

  private wrapSchema(sql: string, options: { wrap?: boolean } = {}): string {
    options.wrap = options.wrap ?? true;

    if (!options.wrap) {
      return sql;
    }

    let ret = this.helper.getSchemaBeginning(this.config.get('charset'));
    ret += sql;
    ret += this.helper.getSchemaEnd();

    return ret;
  }

  private createTable(tableDef: DatabaseTable): Knex.SchemaBuilder {
    return this.knex.schema.createTable(tableDef.getShortestName(), table => {
      tableDef.getColumns().forEach(column => {
        const col = this.helper.createTableColumn(table, column, tableDef);
        this.configureColumn(column, col);
      });

      for (const index of tableDef.getIndexes()) {
        this.createIndex(table, index, tableDef.name, !tableDef.getColumns().some(c => c.autoincrement));
      }

      if (tableDef.comment) {
        table.comment(tableDef.comment);
      }

      if (!this.helper.supportsSchemaConstraints()) {
        for (const fk of Object.values(tableDef.getForeignKeys())) {
          this.createForeignKey(table, fk);
        }
      }

      this.helper.finalizeTable(table, this.config.get('charset'), this.config.get('collate'));
    });
  }

  private createIndex(table: Knex.CreateTableBuilder, index: Index, tableName: string, createPrimary = false) {
    if (index.primary && !createPrimary) {
      return;
    }

    if (index.primary) {
      const keyName = tableName.includes('.') ? tableName.split('.').pop()! + '_pkey' : undefined;
      table.primary(index.columnNames, keyName);
    } else if (index.unique) {
      table.unique(index.columnNames, index.keyName);
    } else if (index.expression) {
      this.helper.pushTableQuery(table, index.expression);
    } else {
      table.index(index.columnNames, index.keyName, index.type);
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

  private dropTable(name: string, schema?: string): Knex.SchemaBuilder {
    let builder = this.knex.schema.dropTableIfExists(name);

    if (schema) {
      builder.withSchema(schema);
    }

    if (this.platform.usesCascadeStatement()) {
      builder = this.knex.schema.raw(builder.toQuery() + ' cascade');
    }

    return builder;
  }

  private configureColumn<T>(column: Column, col: Knex.ColumnBuilder, changedProperties?: Set<string>) {
    return this.helper.configureColumn(column, col, this.knex, changedProperties);
  }

  private createForeignKeys(table: Knex.CreateTableBuilder, tableDef: DatabaseTable): void {
    if (!this.helper.supportsSchemaConstraints()) {
      return;
    }

    for (const fk of Object.values(tableDef.getForeignKeys())) {
      this.createForeignKey(table, fk);
    }
  }

  private getOrderedMetadata(): EntityMetadata[] {
    const metadata = Object.values(this.metadata.getAll()).filter(meta => {
      const isRootEntity = meta.root.className === meta.className;
      return isRootEntity && !meta.embeddable;
    });
    const calc = new CommitOrderCalculator();
    metadata.forEach(meta => calc.addNode(meta.root.className));
    let meta = metadata.pop();

    while (meta) {
      for (const prop of meta.props) {
        calc.discoverProperty(prop, meta.root.className);
      }

      meta = metadata.pop();
    }

    return calc.sort().map(cls => this.metadata.find(cls)!);
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

}
