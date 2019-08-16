import { ColumnBuilder, SchemaBuilder, TableBuilder } from 'knex';
import { AbstractSqlDriver, Cascade, ReferenceType, Utils } from '..';
import { EntityMetadata, EntityProperty } from '../decorators';
import { Platform } from '../platforms';
import { MetadataStorage } from '../metadata';

export interface TableDefinition {
  table_name: string;
  schema_name?: string;
}

export class SchemaGenerator {

  private readonly platform: Platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly knex = this.connection.getKnex();

  constructor(private readonly driver: AbstractSqlDriver,
              private readonly metadata: MetadataStorage) { }

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

  async dropSchema(wrap = true): Promise<void> {
    const sql = await this.getDropSchemaSQL(wrap);
    await this.execute(sql);
  }

  async getDropSchemaSQL(wrap = true): Promise<string> {
    let ret = '';

    for (const meta of Object.values(this.metadata.getAll())) {
      ret += this.dump(this.dropTable(meta.collection), '\n');
    }

    return this.wrapSchema(ret + '\n', wrap);
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
        .forEach(prop => this.createTableColumn(table, prop));
      this.helper.finalizeTable(table);
    });
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

  private createTableColumn(table: TableBuilder, prop: EntityProperty, alter = false): ColumnBuilder {
    if (prop.primary && prop.type === 'number') {
      return table.increments(prop.fieldName);
    }

    const col = table.specificType(prop.fieldName, prop.columnType);
    this.configureColumn(prop, col, alter);

    return col;
  }

  private configureColumn(prop: EntityProperty, col: ColumnBuilder, alter: boolean) {
    const nullable = (alter && this.platform.requiresNullableForAlteringColumn()) || prop.nullable!;
    const indexed = prop.reference !== ReferenceType.SCALAR && this.helper.indexForeignKeys();
    const hasDefault = typeof prop.default !== 'undefined'; // support falsy default values like `0`, `false` or empty string

    Utils.runIfNotEmpty(() => col.unique(), prop.unique);
    Utils.runIfNotEmpty(() => col.nullable(), nullable);
    Utils.runIfNotEmpty(() => col.notNullable(), !nullable);
    Utils.runIfNotEmpty(() => col.primary(), prop.primary);
    Utils.runIfNotEmpty(() => col.unsigned(), this.isUnsigned(prop));
    Utils.runIfNotEmpty(() => col.index(), indexed);
    Utils.runIfNotEmpty(() => col.defaultTo(this.knex.raw('' + prop.default)), hasDefault);
  }

  private isUnsigned(prop: EntityProperty): boolean {
    if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      const meta2 = this.metadata.get(prop.type);
      const pk = meta2.properties[meta2.primaryKey];

      return pk.type === 'number';
    }

    return (prop.primary || prop.unsigned) && prop.type === 'number';
  }

  private createForeignKeys(table: TableBuilder, meta: EntityMetadata): void {
    Object.values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner))
      .forEach(prop => this.createForeignKey(table, prop));
  }

  private createForeignKey(table: TableBuilder, prop: EntityProperty): void {
    if (this.helper.supportsSchemaConstraints()) {
      this.createForeignKeyReference(table.foreign(prop.fieldName) as ColumnBuilder, prop);

      return;
    }

    const col = this.createTableColumn(table, prop, true);
    this.createForeignKeyReference(col, prop);
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

  private dump(builder: SchemaBuilder, append = '\n\n'): string {
    const sql = builder.toQuery();
    return sql.length > 0 ? `${sql};${append}` : '';
  }

}
