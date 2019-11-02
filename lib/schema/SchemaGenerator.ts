import { ColumnBuilder, SchemaBuilder, TableBuilder } from 'knex';
import { AbstractSqlDriver, Cascade, Configuration, DatabaseSchema, IsSame, ReferenceType, Utils } from '..';
import { EntityMetadata, EntityProperty } from '../types';
import { Platform } from '../platforms';
import { MetadataStorage } from '../metadata';
import { Column, DatabaseTable } from './DatabaseTable';

export class SchemaGenerator {

  private readonly platform: Platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();

  constructor(private readonly driver: AbstractSqlDriver,
              private readonly metadata: MetadataStorage,
              private readonly config: Configuration) { }

  async generate(): Promise<string> {
    let ret = await this.getDropSchemaSQL(false);
    ret += await this.getCreateSchemaSQL(false);

    return this.wrapSchema(ret);
  }

  async createSchema(wrap = true): Promise<void> {
    const sql = await this.getCreateSchemaSQL(wrap);
    await this.execute(sql);
  }

  async getCreateSchemaSQL(wrap = true): Promise<string> {
    let ret = '';

    for (const meta of Object.values(this.metadata.getAll())) {
      ret += this.dump(this.createTable(meta));
    }

    for (const meta of Object.values(this.metadata.getAll())) {
      ret += this.dump(this.knex.schema.alterTable(meta.collection, table => this.createForeignKeys(table, meta)));
    }

    return this.wrapSchema(ret, wrap);
  }

  async dropSchema(wrap = true, dropMigrationsTable = false): Promise<void> {
    const sql = await this.getDropSchemaSQL(wrap, dropMigrationsTable);
    await this.execute(sql);
  }

  async getDropSchemaSQL(wrap = true, dropMigrationsTable = false): Promise<string> {
    let ret = '';

    for (const meta of Object.values(this.metadata.getAll())) {
      ret += this.dump(this.dropTable(meta.collection), '\n');
    }

    if (dropMigrationsTable) {
      ret += this.dump(this.dropTable(this.config.get('migrations').tableName!), '\n');
    }

    return this.wrapSchema(ret + '\n', wrap);
  }

  async updateSchema(wrap = true): Promise<void> {
    const sql = await this.getUpdateSchemaSQL(wrap);
    await this.execute(sql);
  }

  async getUpdateSchemaSQL(wrap = true): Promise<string> {
    const schema = await DatabaseSchema.create(this.connection, this.helper, this.config);
    let ret = '';

    for (const meta of Object.values(this.metadata.getAll())) {
      ret += this.getUpdateTableSQL(meta, schema);
    }

    const definedTables = Object.values(this.metadata.getAll()).map(meta => meta.collection);
    const remove = schema.getTables().filter(table => !definedTables.includes(table.name));

    for (const table of remove) {
      ret += this.dump(this.dropTable(table.name));
    }

    return this.wrapSchema(ret, wrap);
  }

  private getUpdateTableSQL(meta: EntityMetadata, schema: DatabaseSchema): string {
    const table = schema.getTable(meta.collection);
    let ret = '';

    if (!table) {
      ret += this.dump(this.createTable(meta));
      ret += this.dump(this.knex.schema.alterTable(meta.collection, table => this.createForeignKeys(table, meta)));

      return ret;
    }

    const sql = this.updateTable(meta, table).map(builder => this.dump(builder));
    ret += sql.join('\n');

    return ret;
  }

  async execute(sql: string) {
    const lines = sql.split('\n').filter(i => i.trim());

    for (const line of lines) {
      await this.connection.getKnex().schema.raw(line);
    }
  }

  private async wrapSchema(sql: string, wrap = true): Promise<string> {
    if (!wrap) {
      return sql;
    }

    let ret = this.helper.getSchemaBeginning();
    ret += sql;
    ret += this.helper.getSchemaEnd();

    return ret;
  }

  private createTable(meta: EntityMetadata): SchemaBuilder {
    return this.knex.schema.createTable(meta.collection, table => {
      Object
        .values(meta.properties)
        .filter(prop => this.shouldHaveColumn(prop))
        .forEach(prop => this.createTableColumn(table, meta, prop));

      if (meta.compositePK) {
        table.primary(meta.primaryKeys.map(prop => meta.properties[prop].fieldName));
      }

      this.helper.finalizeTable(table);
    });
  }

  private updateTable(meta: EntityMetadata, table: DatabaseTable): SchemaBuilder[] {
    const { create, update, remove } = this.computeTableDifference(meta, table);

    if (create.length + update.length + remove.length === 0) {
      return [];
    }

    const rename = this.findRenamedColumns(create, remove);
    const ret: SchemaBuilder[] = [];

    for (const prop of rename) {
      ret.push(this.knex.schema.raw(this.helper.getRenameColumnSQL(table.name, prop.from, prop.to)));
    }

    ret.push(this.knex.schema.alterTable(meta.collection, t => {
      for (const prop of create) {
        this.createTableColumn(t, meta, prop);
      }

      for (const col of update) {
        this.updateTableColumn(t, meta, col.prop, col.column, col.diff);
      }

      for (const column of remove) {
        this.dropTableColumn(t, column);
      }
    }));

    return ret;
  }

  private computeTableDifference(meta: EntityMetadata, table: DatabaseTable): { create: EntityProperty[]; update: { prop: EntityProperty; column: Column; diff: IsSame }[]; remove: Column[] } {
    const props = Object.values(meta.properties).filter(prop => this.shouldHaveColumn(prop, true));
    const columns = table.getColumns();
    const create: EntityProperty[] = [];
    const update: { prop: EntityProperty; column: Column; diff: IsSame }[] = [];
    const remove = columns.filter(col => !props.find(prop => prop.fieldName === col.name));

    for (const prop of props) {
      this.computeColumnDifference(table, create, prop, update);
    }

    return { create, update, remove };
  }

  private computeColumnDifference(table: DatabaseTable, create: EntityProperty[], prop: EntityProperty, update: { prop: EntityProperty; column: Column; diff: IsSame }[]): void {
    const column = table.getColumn(prop.fieldName);

    if (!column) {
      create.push(prop);
      return;
    }

    if (this.helper.supportsColumnAlter() && !this.helper.isSame(prop, column).all) {
      const diff = this.helper.isSame(prop, column);
      update.push({ prop, column, diff });
    }
  }

  private dropTable(name: string): SchemaBuilder {
    let builder = this.knex.schema.dropTableIfExists(name);

    if (this.platform.usesCascadeStatement()) {
      builder = this.knex.schema.raw(builder.toQuery() + ' cascade');
    }

    return builder;
  }

  private shouldHaveColumn(prop: EntityProperty, update = false): boolean {
    if (prop.persist === false) {
      return false;
    }

    if (prop.reference !== ReferenceType.SCALAR && !this.helper.supportsSchemaConstraints() && !update) {
      return false;
    }

    return [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(prop.reference) || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
  }

  private createTableColumn(table: TableBuilder, meta: EntityMetadata, prop: EntityProperty, alter = false): ColumnBuilder {
    if (prop.primary && !meta.compositePK && prop.type === 'number') {
      return table.increments(prop.fieldName);
    }

    const col = table.specificType(prop.fieldName, prop.columnType);
    this.configureColumn(meta, prop, col, alter);

    return col;
  }

  private updateTableColumn(table: TableBuilder, meta: EntityMetadata, prop: EntityProperty, column: Column, diff: IsSame): void {
    const equalDefinition = diff.sameTypes && diff.sameDefault && diff.sameNullable;

    if (column.fk && !diff.sameIndex) {
      table.dropForeign([column.fk.columnName], column.fk.constraintName);
    }

    if (column.fk && !diff.sameIndex && equalDefinition) {
      return this.createForeignKey(table, meta, prop);
    }

    this.createTableColumn(table, meta, prop, true).alter();
  }

  private dropTableColumn(table: TableBuilder, column: Column): void {
    if (column.fk) {
      table.dropForeign([column.fk.columnName], column.fk.constraintName);
    }

    column.indexes.forEach(i => table.dropIndex([i.columnName], i.keyName));
    table.dropColumn(column.name);
  }

  private configureColumn(meta: EntityMetadata, prop: EntityProperty, col: ColumnBuilder, alter: boolean) {
    const nullable = (alter && this.platform.requiresNullableForAlteringColumn()) || prop.nullable!;
    const indexed = prop.reference !== ReferenceType.SCALAR && this.helper.indexForeignKeys();
    const hasDefault = typeof prop.default !== 'undefined'; // support falsy default values like `0`, `false` or empty string

    Utils.runIfNotEmpty(() => col.unique(), prop.unique);
    Utils.runIfNotEmpty(() => col.nullable(), nullable);
    Utils.runIfNotEmpty(() => col.notNullable(), !nullable);
    Utils.runIfNotEmpty(() => col.primary(), prop.primary && !meta.compositePK);
    Utils.runIfNotEmpty(() => col.unsigned(), prop.unsigned);
    Utils.runIfNotEmpty(() => col.index(), indexed);
    Utils.runIfNotEmpty(() => col.defaultTo(this.knex.raw('' + prop.default)), hasDefault);
  }

  private createForeignKeys(table: TableBuilder, meta: EntityMetadata): void {
    Object.values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner))
      .forEach(prop => this.createForeignKey(table, meta, prop));
  }

  private createForeignKey(table: TableBuilder, meta: EntityMetadata, prop: EntityProperty): void {
    if (this.helper.supportsSchemaConstraints()) {
      this.createForeignKeyReference(table.foreign(prop.fieldName) as ColumnBuilder, prop);

      return;
    }

    this.createTableColumn(table, meta, prop, true);

    // knex does not allow adding new columns with FK in sqlite
    // @see https://github.com/knex/knex/issues/3351
    // const col = this.createTableColumn(table, meta, prop, true);
    // this.createForeignKeyReference(col, prop);
  }

  private createForeignKeyReference(col: ColumnBuilder, prop: EntityProperty): void {
    const meta2 = this.metadata.get(prop.type);
    const pk2 = meta2.properties[meta2.primaryKey];
    col.references(pk2.fieldName).inTable(meta2.collection);
    const cascade = prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL);
    col.onDelete(cascade ? 'cascade' : 'set null');

    if (prop.cascade.includes(Cascade.PERSIST) || prop.cascade.includes(Cascade.ALL)) {
      col.onUpdate('cascade');
    }
  }

  private findRenamedColumns(create: EntityProperty[], remove: Column[]): { from: Column; to: EntityProperty }[] {
    const renamed: { from: Column; to: EntityProperty }[] = [];

    for (const prop of create) {
      const match = remove.find(column => {
        const copy = Utils.copy(column);
        copy.name = prop.fieldName;

        return this.helper.isSame(prop, copy).all;
      });

      if (match) {
        renamed.push({ from: match, to: prop });
      }
    }

    renamed.forEach(prop => {
      create.splice(create.indexOf(prop.to), 1);
      remove.splice(remove.indexOf(prop.from), 1);
    });

    return renamed;
  }

  private dump(builder: SchemaBuilder, append = '\n\n'): string {
    const sql = builder.toQuery();
    return sql.length > 0 ? `${sql};${append}` : '';
  }

}
