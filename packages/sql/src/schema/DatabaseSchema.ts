import {
  ReferenceKind,
  type Configuration,
  type Dictionary,
  type EntityMetadata,
  type EntityProperty,
  type RoutineMetadata,
  type Transaction,
  isRaw,
} from '@mikro-orm/core';
import { DatabaseTable } from './DatabaseTable.js';
import type { AbstractSqlConnection } from '../AbstractSqlConnection.js';
import type { DatabaseView, SqlRoutineDef } from '../typings.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import { getTablePartitioning } from './partitioning.js';

/**
 * @internal
 */
export class DatabaseSchema {
  #tables: DatabaseTable[] = [];
  #views: DatabaseView[] = [];
  #routines: SqlRoutineDef[] = [];
  #namespaces = new Set<string>();
  #nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }> = {}; // for postgres
  readonly #platform: AbstractSqlPlatform;

  constructor(
    platform: AbstractSqlPlatform,
    readonly name: string,
  ) {
    this.#platform = platform;
  }

  addTable(name: string, schema: string | undefined | null, comment?: string): DatabaseTable {
    const namespaceName = schema ?? this.name;
    const table = new DatabaseTable(this.#platform, name, namespaceName);
    table.nativeEnums = this.#nativeEnums;
    table.comment = comment;
    this.#tables.push(table);

    if (namespaceName != null) {
      this.#namespaces.add(namespaceName);
    }

    return table;
  }

  getTables(): DatabaseTable[] {
    return this.#tables;
  }

  /** @internal */
  setTables(tables: DatabaseTable[]): void {
    this.#tables = tables;
  }

  /** @internal */
  setNamespaces(namespaces: Set<string>): void {
    this.#namespaces = namespaces;
  }

  getTable(name: string): DatabaseTable | undefined {
    return this.#tables.find(t => t.name === name || `${t.schema}.${t.name}` === name);
  }

  hasTable(name: string): boolean {
    return !!this.getTable(name);
  }

  addView(
    name: string,
    schema: string | undefined | null,
    definition: string,
    materialized?: boolean,
    withData?: boolean,
  ): DatabaseView {
    const namespaceName = schema ?? this.name;
    const view: DatabaseView = { name, schema: namespaceName, definition, materialized, withData };
    this.#views.push(view);

    if (namespaceName != null) {
      this.#namespaces.add(namespaceName);
    }

    return view;
  }

  getViews(): DatabaseView[] {
    return this.#views;
  }

  /** @internal */
  setViews(views: DatabaseView[]): void {
    this.#views = views;
  }

  getView(name: string): DatabaseView | undefined {
    return this.#views.find(v => v.name === name || `${v.schema}.${v.name}` === name);
  }

  hasView(name: string): boolean {
    return !!this.getView(name);
  }

  /** Adds a stored routine definition to the schema snapshot. */
  addRoutine(routine: SqlRoutineDef): SqlRoutineDef {
    this.#routines.push(routine);

    if (routine.schema != null) {
      this.#namespaces.add(routine.schema);
    }

    return routine;
  }

  /** Returns all stored routines tracked by this schema. */
  getRoutines(): SqlRoutineDef[] {
    return this.#routines;
  }

  /** @internal */
  setRoutines(routines: SqlRoutineDef[]): void {
    this.#routines = routines;
  }

  /** Looks up a stored routine by name (or schema-qualified name). */
  getRoutine(name: string, schema?: string): SqlRoutineDef | undefined {
    return this.#routines.find(r => {
      if (schema != null && r.schema !== schema) {
        return false;
      }

      return r.name === name || (r.schema && `${r.schema}.${r.name}` === name);
    });
  }

  hasRoutine(name: string, schema?: string): boolean {
    return !!this.getRoutine(name, schema);
  }

  setNativeEnums(nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }>): void {
    this.#nativeEnums = nativeEnums;

    for (const nativeEnum of Object.values(nativeEnums)) {
      if (nativeEnum.schema && nativeEnum.schema !== '*') {
        this.#namespaces.add(nativeEnum.schema);
      }
    }
  }

  getNativeEnums(): Dictionary<{ name: string; schema?: string; items: string[] }> {
    return this.#nativeEnums;
  }

  getNativeEnum(name: string): { name: string; schema?: string; items: string[] } {
    return this.#nativeEnums[name];
  }

  hasNamespace(namespace: string): boolean {
    return this.#namespaces.has(namespace);
  }

  hasNativeEnum(name: string): boolean {
    return name in this.#nativeEnums;
  }

  getNamespaces(): string[] {
    return [...this.#namespaces];
  }

  static async create(
    connection: AbstractSqlConnection,
    platform: AbstractSqlPlatform,
    config: Configuration,
    schemaName?: string,
    schemas?: string[],
    takeTables?: (string | RegExp)[],
    skipTables?: (string | RegExp)[],
    skipViews?: (string | RegExp)[],
    ctx?: Transaction,
  ): Promise<DatabaseSchema> {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema') ?? platform.getDefaultSchemaName());
    const allTables = await platform.getSchemaHelper()!.getAllTables(connection, schemas, ctx);
    const parts = config.get('migrations').tableName!.split('.');
    const migrationsTableName = parts[1] ?? parts[0];
    const migrationsSchemaName = parts.length > 1 ? parts[0] : config.get('schema', platform.getDefaultSchemaName());
    const tables = allTables.filter(
      t =>
        this.isTableNameAllowed(t.table_name, takeTables, skipTables) &&
        (t.table_name !== migrationsTableName || (t.schema_name && t.schema_name !== migrationsSchemaName)),
    );
    await platform
      .getSchemaHelper()!
      .loadInformationSchema(schema, connection, tables, schemas && schemas.length > 0 ? schemas : undefined, ctx);

    // Load views from database
    await platform.getSchemaHelper()!.loadViews(schema, connection, schemaName, ctx);

    // Load materialized views (PostgreSQL only)
    if (platform.supportsMaterializedViews()) {
      await platform.getSchemaHelper()!.loadMaterializedViews(schema, connection, schemaName, ctx);
    }

    // Filter out skipped views
    if (skipViews && skipViews.length > 0) {
      schema.#views = schema.#views.filter(v => this.isNameAllowed(v.name, skipViews));
    }

    return schema;
  }

  /**
   * Loads stored routines (procedures/functions) from the database into this schema snapshot.
   * Called separately from `create()` so the comparator only pays for routine introspection
   * when the user actually defined routines in metadata. SQLite/libSQL helpers return [] which
   * is the silent-skip path.
   */
  async loadRoutines(
    connection: AbstractSqlConnection,
    platform: AbstractSqlPlatform,
    schemas?: string[],
  ): Promise<void> {
    this.#routines = await platform.getSchemaHelper()!.getAllRoutines(connection, schemas ?? []);
  }

  static fromMetadata(
    metadata: EntityMetadata[],
    platform: AbstractSqlPlatform,
    config: Configuration,
    schemaName?: string,
    em?: any,
  ): DatabaseSchema {
    const schema = new DatabaseSchema(platform, schemaName ?? config.get('schema'));
    const nativeEnums: Dictionary<{ name: string; schema?: string; items: string[] }> = {};
    const skipColumns = config.get('schemaGenerator').skipColumns || {};

    for (const meta of metadata) {
      // Skip view entities when collecting native enums
      if (meta.view) {
        continue;
      }

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
      // Handle view entities separately
      if (meta.view) {
        const viewDefinition = this.getViewDefinition(meta, em, platform);
        if (viewDefinition) {
          const view = schema.addView(
            meta.collection,
            this.getSchemaName(meta, config, schemaName),
            viewDefinition,
            meta.materialized,
            meta.withData,
          );

          if (meta.materialized) {
            // Use a DatabaseTable to resolve property names → field names for indexes.
            // addIndex only needs meta + table name, not actual columns.
            const indexTable = new DatabaseTable(
              platform,
              meta.collection,
              this.getSchemaName(meta, config, schemaName),
            );
            meta.indexes.forEach(index => indexTable.addIndex(meta, index, 'index'));
            meta.uniques.forEach(index => indexTable.addIndex(meta, index, 'unique'));
            const pkProps = meta.props.filter(prop => prop.primary);
            indexTable.addIndex(meta, { properties: pkProps.map(prop => prop.name) }, 'primary');

            // Materialized views don't have primary keys or constraints in the DB,
            // convert to match what PostgreSQL stores.
            view.indexes = indexTable.getIndexes().map(idx => {
              if (idx.primary) {
                return { ...idx, primary: false, unique: true, constraint: false };
              }
              if (idx.constraint) {
                return { ...idx, constraint: false };
              }
              return idx;
            });
          }
        }
        continue;
      }

      const table = schema.addTable(meta.collection, this.getSchemaName(meta, config, schemaName));
      table.comment = meta.comment;

      if (meta.partitionBy) {
        table.setPartitioning(
          getTablePartitioning(meta, this.getSchemaName(meta, config, schemaName), id => platform.quoteIdentifier(id)),
        );
      }

      // For TPT child entities, only use ownProps (properties defined in this entity only)
      // For all other entities (including TPT root), use all props
      const propsToProcess =
        meta.inheritanceType === 'tpt' && meta.tptParent && meta.ownProps ? meta.ownProps : meta.props;

      for (const prop of propsToProcess) {
        if (!this.shouldHaveColumn(meta, prop, skipColumns)) {
          continue;
        }

        table.addColumnFromProperty(prop, meta, config);
      }

      // For TPT child entities, always include the PK columns (they form the FK to parent)
      if (meta.inheritanceType === 'tpt' && meta.tptParent) {
        const pkProps = meta.primaryKeys.map(pk => meta.properties[pk]);
        for (const pkProp of pkProps) {
          // Only add if not already added (it might be in ownProps if defined in this entity)
          if (!propsToProcess.includes(pkProp)) {
            table.addColumnFromProperty(pkProp, meta, config);
          }

          // Child PK must not be autoincrement — it references the parent PK via FK
          for (const field of pkProp.fieldNames) {
            const col = table.getColumn(field);

            if (col) {
              col.autoincrement = false;
            }
          }
        }

        // Add FK from child PK to parent PK with ON DELETE CASCADE
        this.addTPTForeignKey(table, meta, config, platform);
      }

      meta.indexes.forEach(index => table.addIndex(meta, index, 'index'));
      meta.uniques.forEach(index => table.addIndex(meta, index, 'unique'));

      // For TPT child entities, the PK is also defined here
      const pkPropsForIndex =
        meta.inheritanceType === 'tpt' && meta.tptParent
          ? meta.primaryKeys.map(pk => meta.properties[pk])
          : meta.props.filter(prop => prop.primary);
      table.addIndex(meta, { properties: pkPropsForIndex.map(prop => prop.name) }, 'primary');

      for (const check of meta.checks) {
        const columnName = check.property ? meta.properties[check.property].fieldNames[0] : undefined;
        const expression = isRaw(check.expression)
          ? platform.formatQuery(check.expression.sql, check.expression.params)
          : (check.expression as string);

        table.addCheck({
          name: check.name!,
          expression,
          definition: `check (${expression})`,
          columnName,
        });
      }

      for (const trigger of meta.triggers) {
        const body = isRaw(trigger.body)
          ? platform.formatQuery(trigger.body.sql, trigger.body.params)
          : (trigger.body as string | undefined);

        table.addTrigger({
          name: trigger.name!,
          timing: trigger.timing,
          events: trigger.events,
          forEach: trigger.forEach ?? 'row',
          body: body ?? '',
          when: trigger.when,
          expression: trigger.expression,
        });
      }
    }

    return schema;
  }

  /**
   * Populates this schema with routine entries derived from routine metadata. Called separately
   * from {@link fromMetadata} so the comparator only walks routines when the user actually
   * defined them.
   */
  addRoutinesFromMetadata(routines: RoutineMetadata[], platform: AbstractSqlPlatform, em?: any): void {
    const resolveBody = (raw: unknown): string | undefined => {
      if (raw == null) {
        return undefined;
      }

      if (typeof raw === 'string') {
        return raw;
      }

      if (isRaw(raw)) {
        return platform.formatQuery(raw.sql, raw.params);
      }

      return undefined;
    };

    const helper = platform.getSchemaHelper();

    for (const routineMeta of routines) {
      const paramMap =
        helper && routineMeta.params.length > 0
          ? routineMeta.params.reduce(
              (o, p) => {
                o[p.name as string] = helper.routineParamReference(p.name as string);
                return o;
              },
              {} as Record<string, string>,
            )
          : routineMeta.createParamMappingObject();
      const evaluated =
        typeof routineMeta.body === 'function' ? routineMeta.body(paramMap as any, em) : routineMeta.body;
      const body = resolveBody(evaluated);

      const returns =
        routineMeta.returns && 'runtimeType' in routineMeta.returns
          ? {
              type: (routineMeta.returns.columnType ?? routineMeta.returns.runtimeType) as string,
              runtimeType: routineMeta.returns.runtimeType,
              nullable: routineMeta.returns.nullable,
            }
          : undefined;

      this.addRoutine({
        name: routineMeta.routineName,
        // Only attach schema when explicitly declared or when the platform actually scopes
        // routines per schema. MySQL has no schema namespace for routines, so leave undefined
        // to align with the introspection side.
        schema: routineMeta.schema ?? (platform.getDefaultSchemaName() != null ? this.name : undefined),
        type: routineMeta.type,
        language: routineMeta.language,
        comment: routineMeta.comment,
        security: routineMeta.security,
        definer: routineMeta.definer,
        deterministic: routineMeta.deterministic,
        dataAccess: routineMeta.dataAccess,
        body,
        expression: routineMeta.expression,
        ignoreSchemaChanges: routineMeta.ignoreSchemaChanges,
        params: routineMeta.params.map(p => ({
          name: p.name as string,
          type: DatabaseSchema.resolveRoutineColumnType(p.type as string, platform),
          direction: p.direction,
          nullable: p.nullable,
          defaultRaw: p.defaultRaw,
        })),
        returns,
      });
    }
  }

  /**
   * Resolves a user-supplied routine param type (e.g. `'string'`, `'int'`, or a literal SQL type
   * like `'varchar(255)'`) to a platform-specific column type. If the user already supplied a SQL
   * type literal it's passed through; common aliases ('string', 'number', etc.) are mapped via
   * the platform's type system.
   */
  private static resolveRoutineColumnType(type: string, platform: AbstractSqlPlatform): string {
    const lower = type.toLowerCase();
    const aliases: Record<string, string> = {
      string: 'string',
      number: 'integer',
      bigint: 'bigint',
      boolean: 'boolean',
      date: 'datetime',
      buffer: 'blob',
    };

    const mappedKey = aliases[lower];

    if (!mappedKey) {
      return type;
    }

    try {
      const t = platform.getMappedType(mappedKey);
      return t.getColumnType({ type: mappedKey, length: undefined } as any, platform);
    } catch {
      return type;
    }
  }

  private static getViewDefinition(meta: EntityMetadata, em: any, platform: AbstractSqlPlatform): string | undefined {
    if (typeof meta.expression === 'string') {
      return meta.expression;
    }

    // Expression is a function, need to evaluate it
    /* v8 ignore next */
    if (!em) {
      return undefined;
    }

    const result = meta.expression!(em, {}, {}) as any;

    // Async expressions are not supported for view entities
    if (result && typeof result.then === 'function') {
      throw new Error(
        `View entity ${meta.className} expression returned a Promise. Async expressions are not supported for view entities.`,
      );
    }

    /* v8 ignore next */
    if (typeof result === 'string') {
      return result;
    }

    /* v8 ignore next */
    if (isRaw(result)) {
      return platform.formatQuery(result.sql, result.params);
    }

    // Check if it's a QueryBuilder (has getFormattedQuery method)
    if (result && typeof result.getFormattedQuery === 'function') {
      return result.getFormattedQuery();
    }

    /* v8 ignore next - fallback for unknown result types */
    return undefined;
  }

  private static getSchemaName(meta: EntityMetadata, config: Configuration, schema?: string): string | undefined {
    return (meta.schema === '*' ? schema : meta.schema) ?? config.get('schema');
  }

  /**
   * Add a foreign key from a TPT child entity's PK to its parent entity's PK.
   * This FK uses ON DELETE CASCADE to ensure child rows are deleted when parent is deleted.
   */
  private static addTPTForeignKey(
    table: DatabaseTable,
    meta: EntityMetadata,
    config: Configuration,
    platform: AbstractSqlPlatform,
  ): void {
    const parent = meta.tptParent!;
    const pkColumnNames = meta.primaryKeys.flatMap(pk => meta.properties[pk].fieldNames);
    const parentPkColumnNames = parent.primaryKeys.flatMap(pk => parent.properties[pk].fieldNames);

    // Determine the parent table name with schema
    const parentSchema =
      parent.schema === '*' ? undefined : (parent.schema ?? config.get('schema', platform.getDefaultSchemaName()));
    const parentTableName = parentSchema ? `${parentSchema}.${parent.tableName}` : parent.tableName;

    // Create FK constraint name
    const constraintName = platform.getIndexName(table.name, pkColumnNames, 'foreign');

    // Add the foreign key to the table
    const fks = table.getForeignKeys();
    fks[constraintName] = {
      constraintName,
      columnNames: pkColumnNames,
      localTableName: table.getShortestName(false),
      referencedColumnNames: parentPkColumnNames,
      referencedTableName: parentTableName,
      deleteRule: 'cascade', // TPT always uses cascade delete
      updateRule: 'cascade', // TPT always uses cascade update
    };
  }

  private static matchName(name: string, nameToMatch: string | RegExp) {
    return typeof nameToMatch === 'string'
      ? name.toLocaleLowerCase() === nameToMatch.toLocaleLowerCase()
      : nameToMatch.test(name);
  }

  private static isNameAllowed(name: string, skipNames?: (string | RegExp)[]) {
    return !(skipNames?.some(pattern => this.matchName(name, pattern)) ?? false);
  }

  private static isTableNameAllowed(
    tableName: string,
    takeTables?: (string | RegExp)[],
    skipTables?: (string | RegExp)[],
  ) {
    return (
      (takeTables?.some(tableNameToMatch => this.matchName(tableName, tableNameToMatch)) ?? true) &&
      this.isNameAllowed(tableName, skipTables)
    );
  }

  private static shouldHaveColumn(
    meta: EntityMetadata,
    prop: EntityProperty,
    skipColumns?: Dictionary<(string | RegExp)[]>,
  ): boolean {
    if (prop.persist === false || (prop.columnTypes?.length ?? 0) === 0) {
      return false;
    }

    // Check if column should be skipped
    if (skipColumns) {
      const tableName = meta.tableName;
      const tableSchema = meta.schema;
      const fullTableName = tableSchema ? `${tableSchema}.${tableName}` : tableName;

      // Check for skipColumns by table name or fully qualified table name
      const columnsToSkip = skipColumns[tableName] || skipColumns[fullTableName];
      if (columnsToSkip) {
        for (const fieldName of prop.fieldNames) {
          if (columnsToSkip.some(pattern => this.matchName(fieldName, pattern))) {
            return false;
          }
        }
      }
    }

    if (prop.kind === ReferenceKind.EMBEDDED && prop.object) {
      return true;
    }

    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) =>
      prop.embedded ? getRootProperty(meta.properties[prop.embedded[0]]) : prop;
    const rootProp = getRootProperty(prop);

    if (rootProp.kind === ReferenceKind.EMBEDDED) {
      return prop === rootProp || !rootProp.object;
    }

    return (
      [ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE].includes(prop.kind) ||
      (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner)
    );
  }

  toJSON(): Dictionary {
    // locale-independent comparison so the snapshot is stable across machines
    const byString = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    const tableKey = (t: { schema?: string; name: string }) => `${t.schema ?? ''}.${t.name}`;
    const byTable = (a: { schema?: string; name: string }, b: { schema?: string; name: string }) =>
      byString(tableKey(a), tableKey(b));

    return {
      name: this.name,
      namespaces: [...this.#namespaces].sort(),
      tables: [...this.#tables].sort(byTable),
      views: [...this.#views].sort(byTable),
      nativeEnums: Object.fromEntries(Object.entries(this.#nativeEnums).sort(([a], [b]) => byString(a, b))),
    };
  }

  prune(schema: string | undefined, wildcardSchemaTables: string[]): void {
    const hasWildcardSchema = wildcardSchemaTables.length > 0;
    this.#tables = this.#tables.filter(table => {
      return (
        (!schema && !hasWildcardSchema) || // no schema specified and we don't have any multi-schema entity
        table.schema === schema || // specified schema matches the table's one
        (!schema && !wildcardSchemaTables.includes(table.name))
      ); // no schema specified and the table has fixed one provided
    });

    this.#views = this.#views.filter(view => {
      /* v8 ignore next */
      return (
        (!schema && !hasWildcardSchema) ||
        view.schema === schema ||
        (!schema && !wildcardSchemaTables.includes(view.name))
      );
    });

    // remove namespaces of ignored tables and views
    for (const ns of this.#namespaces) {
      if (
        !this.#tables.some(t => t.schema === ns) &&
        !this.#views.some(v => v.schema === ns) &&
        !Object.values(this.#nativeEnums).some(e => e.schema === ns)
      ) {
        this.#namespaces.delete(ns);
      }
    }
  }
}
