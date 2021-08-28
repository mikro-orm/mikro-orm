import { Configuration, Dictionary, EntityMetadata, EntityProperty, ReferenceType } from '@mikro-orm/core';
import { DatabaseTable } from './DatabaseTable';
import { AbstractSqlConnection } from '../AbstractSqlConnection';
import { Table } from '../typings';
import { AbstractSqlPlatform } from '../AbstractSqlPlatform';

/**
 * @internal
 */
export class DatabaseSchema {

  private readonly tables: DatabaseTable[] = [];
  private readonly namespaces: string[] = [];

  constructor(private readonly platform: AbstractSqlPlatform,
              readonly name: string) { }

  addTable(name: string, schema: string | undefined | null): DatabaseTable {
    const namespaceName = schema ?? undefined;
    const table = new DatabaseTable(this.platform, name, namespaceName);
    this.tables.push(table);

    if (namespaceName != null && !table.isInDefaultNamespace(this.name) && !this.hasNamespace(namespaceName)) {
      this.namespaces.push(namespaceName);
    }

    return table;
  }

  getTables(): DatabaseTable[] {
    return this.tables;
  }

  getTable(name: string): DatabaseTable | undefined {
    return this.tables.find(t => t.name === name || `${t.schema}.${t.name}` === name);
  }

  hasTable(name: string) {
    return !!this.getTable(name);
  }

  hasNamespace(namespace: string) {
    return this.namespaces.includes(namespace);
  }

  getNamespaces(): string[] {
    return this.namespaces;
  }

  static async create(connection: AbstractSqlConnection, platform: AbstractSqlPlatform, config: Configuration): Promise<DatabaseSchema> {
    const schema = new DatabaseSchema(platform, config.get('schema'));
    const tables = await connection.execute<Table[]>(platform.getSchemaHelper()!.getListTablesSQL());

    for (const t of tables) {
      if (t.table_name === config.get('migrations').tableName) {
        continue;
      }

      const table = schema.addTable(t.table_name, t.schema_name);
      table.comment = t.table_comment;
      const cols = await platform.getSchemaHelper()!.getColumns(connection, table.name, table.schema);
      const indexes = await platform.getSchemaHelper()!.getIndexes(connection, table.name, table.schema);
      const pks = await platform.getSchemaHelper()!.getPrimaryKeys(connection, indexes, table.name, table.schema);
      const fks = await platform.getSchemaHelper()!.getForeignKeys(connection, table.name, table.schema);
      const enums = await platform.getSchemaHelper()!.getEnumDefinitions(connection, table.name, table.schema);
      table.init(cols, indexes, pks, fks, enums);
    }

    return schema;
  }

  static fromMetadata(metadata: EntityMetadata[], platform: AbstractSqlPlatform, config: Configuration): DatabaseSchema {
    const schema = new DatabaseSchema(platform, config.get('schema'));

    for (const meta of metadata) {
      const table = schema.addTable(meta.collection, meta.schema ?? config.get('schema'));
      table.comment = meta.comment;
      meta.props
        .filter(prop => this.shouldHaveColumn(meta, prop)) // TODO use platform?
        .forEach(prop => table.addColumnFromProperty(prop, meta));
      meta.indexes.forEach(index => table.addIndex(meta, index, 'index'));
      meta.uniques.forEach(index => table.addIndex(meta, index, 'unique'));
      table.addIndex(meta, { properties: meta.props.filter(prop => prop.primary).map(prop => prop.name) }, 'primary');
    }

    return schema;
  }

  private static shouldHaveColumn(meta: EntityMetadata, prop: EntityProperty): boolean {
    if (prop.persist === false || !prop.fieldNames) {
      return false;
    }

    if (meta.pivotTable || (ReferenceType.EMBEDDED && prop.object)) {
      return true;
    }

    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) => prop.embedded ? getRootProperty(meta.properties[prop.embedded[0]]) : prop;
    const rootProp = getRootProperty(prop);

    if (rootProp.reference === ReferenceType.EMBEDDED) {
      return prop === rootProp || !rootProp.object;
    }

    return [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(prop.reference) || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
  }

  toJSON(): Dictionary {
    const { platform, ...rest } = this;
    return rest;
  }

}
