import { ColumnBuilder, TableBuilder } from 'knex';
import { AbstractSqlDriver, Cascade, ReferenceType, Utils } from '..';
import { EntityMetadata, EntityProperty } from '../decorators';
import { Platform } from '../platforms';

export class SchemaGenerator {

  private readonly platform: Platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper();
  private readonly knex = this.driver.getConnection().getKnex();

  constructor(private readonly driver: AbstractSqlDriver,
              private readonly metadata: Record<string, EntityMetadata>) { }

  generate(): string {
    let ret = this.helper.getSchemaBeginning();

    Object.values(this.metadata).forEach(meta => ret += this.knex.schema.dropTableIfExists(meta.collection).toQuery() + ';\n');
    ret += '\n';
    Object.values(this.metadata).forEach(meta => ret += this.createTable(meta));
    Object.values(this.metadata).forEach(meta => {
      const alter = this.knex.schema.alterTable(meta.collection, table => this.createForeignKeys(table, meta)).toQuery();
      ret += alter ? alter + ';\n\n' : '';
    });

    ret += this.helper.getSchemaEnd();

    return ret;
  }

  private createTable(meta: EntityMetadata): string {
    return this.knex.schema.createTable(meta.collection, table => {
      Object
        .values(meta.properties)
        .filter(prop => this.shouldHaveColumn(prop))
        .forEach(prop => this.createTableColumn(table, prop));
      this.helper.finalizeTable(table);
    }).toQuery() + ';\n\n';
  }

  private shouldHaveColumn(prop: EntityProperty): boolean {
    if (prop.persist === false) {
      return false;
    }

    if (prop.reference === ReferenceType.SCALAR) {
      return true;
    }

    if (!this.helper.supportsSchemaConstraints()) {
      return false;
    }

    return prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
  }

  private createTableColumn(table: TableBuilder, prop: EntityProperty, alter = false): ColumnBuilder {
    if (prop.primary && prop.type === 'number') {
      return table.increments(prop.fieldName);
    }

    const type = this.type(prop);
    const col = table.specificType(prop.fieldName, type);
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
      const meta2 = this.metadata[prop.type];
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
    const meta2 = this.metadata[prop.type];
    const pk2 = meta2.properties[meta2.primaryKey];
    col.references(pk2.fieldName).inTable(meta2.collection);
    const cascade = prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL);
    col.onDelete(cascade ? 'cascade' : 'set null');

    if (prop.cascade.includes(Cascade.PERSIST) || prop.cascade.includes(Cascade.ALL)) {
      col.onUpdate('cascade');
    }
  }

  private type(prop: EntityProperty): string {
    if (prop.reference === ReferenceType.SCALAR) {
      return this.helper.getTypeDefinition(prop);
    }

    const meta = this.metadata[prop.type];
    return this.helper.getTypeDefinition(meta.properties[meta.primaryKey]);
  }

}
