import { ReferenceKind, type Configuration, type Dictionary, type EntityMetadata, type EntityProperty } from '@mikro-orm/core';
import { DatabaseTable } from './DatabaseTable';
import type { AbstractSqlConnection } from '../AbstractSqlConnection';
import type { Table } from '../typings';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';

/**
 * @internal
 */
export class DatabaseSchema {

  private tables: DatabaseTable[] = [];
  private namespaces = new Set<string>();
  private nativeEnums: Dictionary<unknown[]> = {}; // for postgres

  constructor(private readonly platform: AbstractSqlPlatform,
              readonly name: string) { }

  addTable(name: string, schema: string | undefined | null, comment?: string): DatabaseTable {
    const namespaceName = schema ?? this.name;
    const table = new DatabaseTable(this.platform, name, namespaceName);
    table.nativeEnums = this.nativeEnums;
    table.comment = comment;
    this.tables.push(table);

    if (namespaceName != null) {
      this.namespaces.add(namespaceName);
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

  setNativeEnums(nativeEnums: Dictionary<unknown[]>): void {
    this.nativeEnums = nativeEnums;
    this.tables.forEach(t => t.nativeEnums = nativeEnums);
  }

  getNativeEnums(): Dictionary<unknown[]> {
    return this.nativeEnums;
  }

  hasNamespace(namespace: string) {
    return this.namespaces.has(namespace);
  }

  getNamespaces(): string[] {
    return [...this.namespaces];
  }

  static async create(connection: AbstractSqlConnection, platform: AbstractSqlPlatform, config: Configuration, schemaName?: string, schemas?: string[]): Promise<DatabaseSchema> {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema') ?? platform.getDefaultSchemaName());
    const allTables = await connection.execute<Table[]>(platform.getSchemaHelper()!.getListTablesSQL());
    const parts = config.get('migrations').tableName!.split('.');
    const migrationsTableName = parts[1] ?? parts[0];
    const migrationsSchemaName = parts.length > 1 ? parts[0] : config.get('schema', platform.getDefaultSchemaName());
    const tables = allTables.filter(t => t.table_name !== migrationsTableName || (t.schema_name && t.schema_name !== migrationsSchemaName));
    await platform.getSchemaHelper()!.loadInformationSchema(schema, connection, tables, schemas && schemas.length > 0 ? schemas : undefined);

    return schema;
  }

  static fromMetadata(metadata: EntityMetadata[], platform: AbstractSqlPlatform, config: Configuration, schemaName?: string): DatabaseSchema {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema'));
    const nativeEnums: Dictionary<unknown[]> = {};

    for (const meta of metadata) {
      meta.props
        .filter(prop => prop.nativeEnumName)
        .forEach(prop => nativeEnums[prop.nativeEnumName!] = prop.items?.map(val => '' + val) ?? []);
    }

    schema.setNativeEnums(nativeEnums);

    for (const meta of metadata) {
      const table = schema.addTable(meta.collection, this.getSchemaName(meta, config, schemaName));
      table.comment = meta.comment;
      meta.props
        .filter(prop => this.shouldHaveColumn(meta, prop))
        .forEach(prop => table.addColumnFromProperty(prop, meta));
      meta.indexes.forEach(index => table.addIndex(meta, index, 'index'));
      meta.uniques.forEach(index => table.addIndex(meta, index, 'unique'));
      table.addIndex(meta, { properties: meta.props.filter(prop => prop.primary).map(prop => prop.name) }, 'primary');
      meta.checks.forEach(check => {
        const columnName = check.property ? meta.properties[check.property].fieldNames[0] : undefined;
        table.addCheck({
          name: check.name!,
          expression: check.expression as string,
          definition: `check ((${check.expression}))`,
          columnName,
        });
      });
    }

    return schema;
  }

  private static getSchemaName(meta: EntityMetadata, config: Configuration, schema?: string): string | undefined {
    return (meta.schema === '*' ? schema : meta.schema) ?? config.get('schema');
  }

  private static shouldHaveColumn(meta: EntityMetadata, prop: EntityProperty): boolean {
    if (prop.persist === false || !prop.fieldNames) {
      return false;
    }

    if (meta.pivotTable || (ReferenceKind.EMBEDDED && prop.object)) {
      return true;
    }

    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) => prop.embedded ? getRootProperty(meta.properties[prop.embedded[0]]) : prop;
    const rootProp = getRootProperty(prop);

    if (rootProp.kind === ReferenceKind.EMBEDDED) {
      return prop === rootProp || !rootProp.object;
    }

    return [ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE].includes(prop.kind) || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner);
  }

  toJSON(): Dictionary {
    const { platform, namespaces, ...rest } = this;
    return { namespaces: [...namespaces], ...rest };
  }

  prune(schema: string | undefined, wildcardSchemaTables: string[]): void {
    const hasWildcardSchema = wildcardSchemaTables.length > 0;
    this.tables = this.tables.filter(table => {
      return (!schema && !hasWildcardSchema)                        // no schema specified and we don't have any multi-schema entity
        || table.schema === schema                                  // specified schema matches the table's one
        || (!schema && !wildcardSchemaTables.includes(table.name)); // no schema specified and the table has fixed one provided
    });
    // remove namespaces of ignored tables
    this.namespaces.forEach(ns => !this.tables.find(t => t.schema === ns) && this.namespaces.delete(ns));
  }

}
