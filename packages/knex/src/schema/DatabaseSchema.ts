import { ReferenceKind, type Configuration, type Dictionary, type EntityMetadata, type EntityProperty } from '@mikro-orm/core';
import { DatabaseTable } from './DatabaseTable.js';
import type { AbstractSqlConnection } from '../AbstractSqlConnection.js';
import type { Table } from '../typings.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';

/**
 * @internal
 */
export class DatabaseSchema {

  private tables: DatabaseTable[] = [];
  private namespaces = new Set<string>();
  private nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }> = {}; // for postgres

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

  setNativeEnums(nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }>): void {
    this.nativeEnums = nativeEnums;

    for (const nativeEnum of Object.values(nativeEnums)) {
      if (nativeEnum.schema && nativeEnum.schema !== '*') {
        this.namespaces.add(nativeEnum.schema);
      }
    }
  }

  getNativeEnums(): Dictionary<{ name: string; schema?: string; items: string[] }> {
    return this.nativeEnums;
  }

  getNativeEnum(name: string): { name: string; schema?: string; items: string[] } {
    return this.nativeEnums[name];
  }

  hasNamespace(namespace: string) {
    return this.namespaces.has(namespace);
  }

  hasNativeEnum(name: string) {
    return name in this.nativeEnums;
  }

  getNamespaces(): string[] {
    return [...this.namespaces];
  }

  static async create(connection: AbstractSqlConnection, platform: AbstractSqlPlatform, config: Configuration, schemaName?: string, schemas?: string[], takeTables?: (string | RegExp)[], skipTables?: (string | RegExp)[]): Promise<DatabaseSchema> {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema') ?? platform.getDefaultSchemaName());
    const allTables = await connection.execute<Table[]>(platform.getSchemaHelper()!.getListTablesSQL());
    const parts = config.get('migrations').tableName!.split('.');
    const migrationsTableName = parts[1] ?? parts[0];
    const migrationsSchemaName = parts.length > 1 ? parts[0] : config.get('schema', platform.getDefaultSchemaName());
    const tables = allTables.filter(t => this.isTableNameAllowed(t.table_name, takeTables, skipTables) && (t.table_name !== migrationsTableName || (t.schema_name && t.schema_name !== migrationsSchemaName)));
    await platform.getSchemaHelper()!.loadInformationSchema(schema, connection, tables, schemas && schemas.length > 0 ? schemas : undefined);

    return schema;
  }

  static fromMetadata(metadata: EntityMetadata[], platform: AbstractSqlPlatform, config: Configuration, schemaName?: string): DatabaseSchema {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema'));
    const nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }> = {};

    for (const meta of metadata) {
      for (const prop of meta.props) {
        if (prop.nativeEnumName) {
          let key = prop.nativeEnumName;
          let enumName = prop.nativeEnumName;
          let enumSchema = meta.schema ?? schema.name;

          if (key.includes('.')) {
            const [explicitSchema, ...parts] = prop.nativeEnumName.split('.');
            enumName = parts.join('.');
            key = enumName;
            enumSchema = explicitSchema;
          }

          if (enumSchema && enumSchema !== '*' && enumSchema !== platform.getDefaultSchemaName()) {
            key = enumSchema + '.' + key;
          }

          nativeEnums[key] = {
            name: enumName,
            schema: enumSchema,
            items: prop.items?.map(val => '' + val) ?? [],
          };
        }
      }
    }

    schema.setNativeEnums(nativeEnums);

    for (const meta of metadata) {
      const table = schema.addTable(meta.collection, this.getSchemaName(meta, config, schemaName));
      table.comment = meta.comment;

      for (const prop of meta.props) {
        if (!this.shouldHaveColumn(meta, prop)) {
          continue;
        }

        table.addColumnFromProperty(prop, meta, config);
      }

      meta.indexes.forEach(index => table.addIndex(meta, index, 'index'));
      meta.uniques.forEach(index => table.addIndex(meta, index, 'unique'));
      table.addIndex(meta, { properties: meta.props.filter(prop => prop.primary).map(prop => prop.name) }, 'primary');

      for (const check of meta.checks) {
        const columnName = check.property ? meta.properties[check.property].fieldNames[0] : undefined;
        table.addCheck({
          name: check.name!,
          expression: check.expression as string,
          definition: `check (${check.expression})`,
          columnName,
        });
      }
    }

    return schema;
  }

  private static getSchemaName(meta: EntityMetadata, config: Configuration, schema?: string): string | undefined {
    return (meta.schema === '*' ? schema : meta.schema) ?? config.get('schema');
  }

  private static matchName(name: string, nameToMatch: string | RegExp) {
    return typeof nameToMatch === 'string'
      ? name.toLocaleLowerCase() === nameToMatch.toLocaleLowerCase()
      : nameToMatch.test(name);
  }

  private static isTableNameAllowed(tableName: string, takeTables?: (string | RegExp)[], skipTables?: (string | RegExp)[]) {
    return (
      (takeTables?.some(tableNameToMatch => this.matchName(tableName, tableNameToMatch)) ?? true) &&
      !(skipTables?.some(tableNameToMatch => this.matchName(tableName, tableNameToMatch)) ?? false)
    );
  }

  private static shouldHaveColumn(meta: EntityMetadata, prop: EntityProperty): boolean {
    if (prop.persist === false || (prop.columnTypes?.length ?? 0) === 0) {
      return false;
    }

    if (prop.kind === ReferenceKind.EMBEDDED && prop.object) {
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
    for (const ns of this.namespaces) {
      if (!this.tables.some(t => t.schema === ns) && !Object.values(this.nativeEnums).some(e => e.schema === ns)) {
        this.namespaces.delete(ns);
      }
    }
  }

}
