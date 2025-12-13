import {
  type Dictionary,
  type EntityMetadata,
  type EntityProperty,
  type MetadataStorage,
  ReferenceKind,
  isRaw,
} from '@mikro-orm/core';
import {
  type CommonTableExpressionNameNode,
  type DeleteQueryNode,
  type IdentifierNode,
  type InsertQueryNode,
  type JoinNode,
  type MergeQueryNode,
  type QueryId,
  type SelectQueryNode,
  type UpdateQueryNode,
  type WithNode,
  AliasNode,
  ColumnNode,
  ColumnUpdateNode,
  OperationNodeTransformer,
  PrimitiveValueListNode,
  ReferenceNode,
  SchemableIdentifierNode,
  TableNode,
  ValueListNode,
  ValueNode,
  ValuesNode,
} from 'kysely';
import type { MikroKyselyPluginOptions } from './index.js';
import type { SqlEntityManager } from '../SqlEntityManager.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';

export class MikroTransformer extends OperationNodeTransformer {

  /**
   * Context stack to support nested queries (subqueries, CTEs)
   * Each level of query scope has its own Map of table aliases/names to EntityMetadata
   * Top of stack (highest index) is the current scope
   */
  protected readonly contextStack: Map<string, EntityMetadata | undefined>[] = [];

  /**
   * Subquery alias map: maps subquery/CTE alias to its source table metadata
   * Used to resolve columns from subqueries/CTEs to their original table definitions
   */
  protected readonly subqueryAliasMap: Map<string, EntityMetadata | undefined> = new Map();

  protected readonly metadata: MetadataStorage;
  protected readonly platform: AbstractSqlPlatform;

  /**
   * Global map of all entities involved in the query.
   * Populated during AST transformation and used for result transformation.
   */
  protected readonly entityMap = new Map<string, EntityMetadata>();

  constructor(
    protected readonly em: SqlEntityManager,
    protected readonly options: MikroKyselyPluginOptions = {},
  ) {
    super();
    this.metadata = em.getMetadata();
    this.platform = em.getDriver().getPlatform();
  }

  reset(): void {
    this.subqueryAliasMap.clear();
    this.entityMap.clear();
  }

  getOutputEntityMap(): Map<string, EntityMetadata> {
    return this.entityMap;
  }

  override transformSelectQuery(
    node: SelectQueryNode,
    queryId: QueryId,
  ): SelectQueryNode {
    // Push a new context for this query scope (starts with inherited parent context)
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      // Process WITH clause (CTEs) first - they define names available in this scope
      if (node.with) {
        this.processWithNode(node.with, currentContext);
      }

      // Process FROM clause - main tables in this scope
      if (node.from?.froms) {
        for (const from of node.from.froms) {
          this.processFromItem(from, currentContext);
        }
      }

      // Process JOINs - additional tables joined into this scope
      if (node.joins) {
        for (const join of node.joins) {
          this.processJoinNode(join, currentContext);
        }
      }

      return super.transformSelectQuery(node, queryId);
    } finally {
      // Pop the context when exiting this query scope
      this.contextStack.pop();
    }
  }

  override transformInsertQuery(
    node: InsertQueryNode,
    queryId?: QueryId,
  ): InsertQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      let entityMeta: EntityMetadata | undefined;
      if (node.into) {
        const tableName = this.getTableName(node.into);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            entityMeta = meta;
            currentContext.set(meta.tableName, meta);
            this.entityMap.set(meta.tableName, meta);
          }
        }
      }
      const nodeWithHooks = this.options.processOnCreateHooks && entityMeta
        ? this.processOnCreateHooks(node, entityMeta)
        : node;
      const nodeWithConvertedValues = this.options.convertValues && entityMeta
        ? this.processInsertValues(nodeWithHooks, entityMeta)
        : nodeWithHooks;
      // Handle ON CONFLICT clause
      let finalNode = nodeWithConvertedValues;

      if (node.onConflict?.updates && entityMeta) {
        // Create a temporary UpdateQueryNode to reuse processOnUpdateHooks and processUpdateValues
        // We only care about the updates part
        const tempUpdateNode: UpdateQueryNode = {
          kind: 'UpdateQueryNode',
          table: node.into, // Dummy table
          updates: node.onConflict.updates,
        };

        const updatesWithHooks = this.options.processOnUpdateHooks
          ? this.processOnUpdateHooks(tempUpdateNode, entityMeta).updates
          : node.onConflict.updates;

        const tempUpdateNodeWithHooks: UpdateQueryNode = {
           ...tempUpdateNode,
           updates: updatesWithHooks,
        };

        const updatesWithConvertedValues = this.options.convertValues
          ? this.processUpdateValues(tempUpdateNodeWithHooks, entityMeta).updates
          : updatesWithHooks;

        if (updatesWithConvertedValues && updatesWithConvertedValues !== node.onConflict.updates) {
           // Construct the new OnConflictNode with updated values
           finalNode = {
            ...finalNode,
            onConflict: {
              ...node.onConflict,
              updates: updatesWithConvertedValues,
            },
          };
        }
      }

      return super.transformInsertQuery(finalNode, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  override transformUpdateQuery(
    node: UpdateQueryNode,
    queryId?: QueryId,
  ): UpdateQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      let entityMeta: EntityMetadata | undefined;
      if (node.table && TableNode.is(node.table)) {
        const tableName = this.getTableName(node.table as TableNode);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            entityMeta = meta;
            currentContext.set(meta.tableName, meta);
            this.entityMap.set(meta.tableName, meta);
          }
        }
      }

      // Process FROM clause in UPDATE queries (for UPDATE with JOIN)
      if (node.from) {
        for (const fromItem of node.from.froms) {
          this.processFromItem(fromItem, currentContext);
        }
      }

      // Also process JOINs in UPDATE queries
      if (node.joins) {
        for (const join of node.joins) {
          this.processJoinNode(join, currentContext);
        }
      }

      const nodeWithHooks = this.options.processOnUpdateHooks && entityMeta
        ? this.processOnUpdateHooks(node, entityMeta)
        : node;
      const nodeWithConvertedValues = this.options.convertValues && entityMeta
        ? this.processUpdateValues(nodeWithHooks, entityMeta)
        : nodeWithHooks;
      return super.transformUpdateQuery(nodeWithConvertedValues, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  override transformDeleteQuery(
    node: DeleteQueryNode,
    queryId?: QueryId,
  ): DeleteQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      const froms = node.from?.froms;
      if (froms && froms.length > 0) {
        const firstFrom = froms[0];
        if (TableNode.is(firstFrom)) {
          const tableName = this.getTableName(firstFrom as TableNode);
          if (tableName) {
            const meta = this.findEntityMetadata(tableName);
            if (meta) {
              currentContext.set(meta.tableName, meta);
              this.entityMap.set(meta.tableName, meta);
            }
          }
        }
      }

      // Also process JOINs in DELETE queries
      if (node.joins) {
        for (const join of node.joins) {
          this.processJoinNode(join, currentContext);
        }
      }

      return super.transformDeleteQuery(node, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  override transformMergeQuery(
    node: MergeQueryNode,
    queryId?: QueryId,
  ): MergeQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      return super.transformMergeQuery(node, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  override transformIdentifier(
    node: IdentifierNode,
    queryId: QueryId,
  ): IdentifierNode {
    node = super.transformIdentifier(node, queryId);

    const parent = this.nodeStack[this.nodeStack.length - 2];

    // Transform table names when tableNamingStrategy is 'entity'
    if (this.options.tableNamingStrategy === 'entity' && parent && SchemableIdentifierNode.is(parent)) {
      const meta = this.findEntityMetadata(node.name);
      if (meta) {
        return {
          ...node,
          name: meta.tableName,
        };
      }
    }

    // Transform column names when columnNamingStrategy is 'property'
    // Support ColumnNode, ColumnUpdateNode, and ReferenceNode (for JOIN conditions)
    if (this.options.columnNamingStrategy === 'property' && parent && (ColumnNode.is(parent) || ColumnUpdateNode.is(parent) || ReferenceNode.is(parent))) {
      const ownerMeta = this.findOwnerEntityInContext();

      if (ownerMeta) {
        const prop = ownerMeta.properties[node.name];
        const fieldName = prop?.fieldNames?.[0];
        if (fieldName) {
          return {
            ...node,
            name: fieldName,
          };
        }
      }
    }

    return node;
  }

  /**
   * Find owner entity metadata for the current identifier in the context stack.
   * Supports both aliased and non-aliased table references.
   * Searches up the context stack to support correlated subqueries.
   * Also checks subquery/CTE aliases to resolve to their source tables.
   */
  findOwnerEntityInContext(): EntityMetadata | undefined {
    // Check if current column has a table reference (e.g., u.firstName)
    const reference = this.nodeStack.find(it => ReferenceNode.is(it)) as ReferenceNode | undefined;

    if (reference?.table && TableNode.is(reference.table)) {
      const tableName = this.getTableName(reference.table);
      if (tableName) {
        // First, check in subquery alias map (for CTE/subquery columns)
        if (this.subqueryAliasMap.has(tableName)) {
          return this.subqueryAliasMap.get(tableName);
        }

        // Find entity metadata to get the actual table name
        // Context uses table names (meta.tableName) as keys, not entity names
        const entityMeta = this.findEntityMetadata(tableName);
        if (entityMeta) {
          // Search in context stack using the actual table name
          const meta = this.lookupInContextStack(entityMeta.tableName);
          if (meta) {
            return meta;
          }
          // Also try with the entity name (for cases where context uses entity name)
          const metaByEntityName = this.lookupInContextStack(tableName);
          if (metaByEntityName) {
            return metaByEntityName;
          }
        } else {
          // If entity metadata not found, try direct lookup (for CTE/subquery cases)
          const meta = this.lookupInContextStack(tableName);
          if (meta) {
            return meta;
          }
        }
      }
    }

    // If no explicit table reference, use the first entity in current context
    if (this.contextStack.length > 0) {
      const currentContext = this.contextStack[this.contextStack.length - 1];
      for (const [alias, meta] of currentContext.entries()) {
        if (meta) {
          return meta;
        }
        // If the context value is undefined but the alias is in subqueryAliasMap,
        // use the mapped metadata (for CTE/subquery cases)
        if (!meta && this.subqueryAliasMap.has(alias)) {
          const mappedMeta = this.subqueryAliasMap.get(alias);
          if (mappedMeta) {
            return mappedMeta;
          }
        }
      }
    }

    return undefined;
  }

  processOnCreateHooks(node: InsertQueryNode, meta: EntityMetadata): InsertQueryNode {
    if (!node.columns || !node.values || !ValuesNode.is(node.values)) {
      return node;
    }

    const existingProps = new Set<string>();
    for (const col of node.columns) {
      const prop = this.findProperty(meta, this.normalizeColumnName(col.column));
      if (prop) {
        existingProps.add(prop.name);
      }
    }

    const missingProps = meta.props.filter(prop => prop.onCreate && !existingProps.has(prop.name));

    if (missingProps.length === 0) {
      return node;
    }

    const newColumns = [...node.columns];
    for (const prop of missingProps) {
      newColumns.push(ColumnNode.create(prop.name));
    }

    const newRows = node.values.values.map(row => {
      const valuesToAdd = missingProps.map(prop => {
        const val = prop.onCreate!(undefined, this.em);
        return val;
      });

      if (ValueListNode.is(row)) {
        const newValues = [...row.values, ...valuesToAdd.map(v => ValueNode.create(v))];
        return ValueListNode.create(newValues);
      }

      if (PrimitiveValueListNode.is(row)) {
        const newValues = [...row.values, ...valuesToAdd];
        return PrimitiveValueListNode.create(newValues);
      }

      return row;
    });

    return {
      ...node,
      columns: Object.freeze(newColumns),
      values: ValuesNode.create(newRows),
    };
  }

  processOnUpdateHooks(node: UpdateQueryNode, meta: EntityMetadata): UpdateQueryNode {
    if (!node.updates) {
      return node;
    }

    const existingProps = new Set<string>();
    for (const update of node.updates) {
      if (ColumnNode.is(update.column)) {
        const prop = this.findProperty(meta, this.normalizeColumnName(update.column.column));
        if (prop) {
          existingProps.add(prop.name);
        }
      }
    }

    const missingProps = meta.props.filter(prop => prop.onUpdate && !existingProps.has(prop.name));

    if (missingProps.length === 0) {
      return node;
    }

    const newUpdates = [...node.updates];
    for (const prop of missingProps) {
      const val = prop.onUpdate!(undefined, this.em);
      newUpdates.push(ColumnUpdateNode.create(
        ColumnNode.create(prop.name),
        ValueNode.create(val),
      ));
    }

    return {
      ...node,
      updates: Object.freeze(newUpdates),
    };
  }

  processInsertValues(node: InsertQueryNode, meta: EntityMetadata): InsertQueryNode {
    if (!node.columns?.length || !node.values || !ValuesNode.is(node.values)) {
      return node;
    }

    const columnProps = this.mapColumnsToProperties(node.columns, meta);
    const shouldConvert = this.shouldConvertValues();
    let changed = false;

    const convertedRows = node.values.values.map(row => {
      if (ValueListNode.is(row)) {
        if (row.values.length !== columnProps.length) {
          return row;
        }

        const values = row.values.map((valueNode, idx) => {
          if (!ValueNode.is(valueNode)) {
            return valueNode;
          }

          const converted = this.prepareInputValue(columnProps[idx], valueNode.value, shouldConvert);
          if (converted === valueNode.value) {
            return valueNode;
          }

          changed = true;
          return valueNode.immediate ? ValueNode.createImmediate(converted) : ValueNode.create(converted);
        });

        return ValueListNode.create(values);
      }

      if (PrimitiveValueListNode.is(row)) {
        if (row.values.length !== columnProps.length) {
          return row;
        }

        const values = row.values.map((value, idx) => {
          const converted = this.prepareInputValue(columnProps[idx], value, shouldConvert);
          if (converted !== value) {
            changed = true;
          }

          return converted;
        });

        return PrimitiveValueListNode.create(values);
      }

      return row;
    });

    if (!changed) {
      return node;
    }

    return {
      ...node,
      values: ValuesNode.create(convertedRows),
    };
  }

  processUpdateValues(node: UpdateQueryNode, meta: EntityMetadata): UpdateQueryNode {
    if (!node.updates?.length) {
      return node;
    }

    const shouldConvert = this.shouldConvertValues();
    let changed = false;

    const updates = node.updates.map(updateNode => {
      if (!ValueNode.is(updateNode.value)) {
        return updateNode;
      }

      const columnName = ColumnNode.is(updateNode.column)
        ? this.normalizeColumnName(updateNode.column.column)
        : undefined;
      const property = this.findProperty(meta, columnName);
      const converted = this.prepareInputValue(property, updateNode.value.value, shouldConvert);

      if (converted === updateNode.value.value) {
        return updateNode;
      }

      changed = true;
      const newValueNode = updateNode.value.immediate
        ? ValueNode.createImmediate(converted)
        : ValueNode.create(converted);

      return {
        ...updateNode,
        value: newValueNode,
      };
    });

    if (!changed) {
      return node;
    }

    return {
      ...node,
      updates,
    };
  }

  mapColumnsToProperties(columns: readonly ColumnNode[], meta: EntityMetadata): (EntityProperty | undefined)[] {
    return columns.map(column => {
      const columnName = this.normalizeColumnName(column.column);
      return this.findProperty(meta, columnName);
    });
  }

  normalizeColumnName(identifier: IdentifierNode): string {
    const name = identifier.name;
    if (!name.includes('.')) {
      return name;
    }

    const parts = name.split('.');
    return parts[parts.length - 1] ?? name;
  }

  findProperty(meta: EntityMetadata | undefined, columnName?: string): EntityProperty | undefined {
    if (!meta || !columnName) {
      return undefined;
    }

    if (meta.properties[columnName]) {
      return meta.properties[columnName];
    }

    return meta.props.find(prop => prop.fieldNames?.includes(columnName));
  }

  shouldConvertValues(): boolean {
    return !!this.options.convertValues;
  }

  prepareInputValue(prop: EntityProperty | undefined, value: unknown, enabled: boolean): unknown {
    if (!enabled || !prop || value == null) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      if (isRaw(value)) {
        return value;
      }

      if ('kind' in (value as Dictionary)) {
        return value;
      }
    }

    if (prop.customType && !isRaw(value)) {
      return prop.customType.convertToDatabaseValue(value, this.platform, { fromQuery: true, key: prop.name, mode: 'query-data' });
    }

    if (value instanceof Date) {
      return this.platform.processDateProperty(value);
    }

    return value;
  }

  /**
   * Look up a table name/alias in the context stack.
   * Searches from current scope (top of stack) to parent scopes (bottom).
   * This supports correlated subqueries and references to outer query tables.
   */
  lookupInContextStack(tableNameOrAlias: string): EntityMetadata | undefined {
    // Search from top of stack (current scope) to bottom (parent scopes)
    for (let i = this.contextStack.length - 1; i >= 0; i--) {
      const context = this.contextStack[i];
      if (context.has(tableNameOrAlias)) {
        return context.get(tableNameOrAlias);
      }
    }
    return undefined;
  }

  /**
   * Process WITH node (CTE definitions)
   */
  processWithNode(
    withNode: WithNode,
    context: Map<string, EntityMetadata | undefined>,
  ): void {
    for (const cte of withNode.expressions) {
      const cteName = this.getCTEName(cte.name);
      if (cteName) {
        // CTEs are not entities, so map to undefined
        // They will be transformed recursively by transformSelectQuery
        context.set(cteName, undefined);

        // Also try to extract the source table from the CTE's expression
        // This helps resolve columns in subsequent queries that use the CTE
        if (cte.expression?.kind === 'SelectQueryNode') {
          const sourceMeta = this.extractSourceTableFromSelectQuery(cte.expression as SelectQueryNode);
          if (sourceMeta) {
            this.subqueryAliasMap.set(cteName, sourceMeta);
            // Add CTE to entityMap so it can be used for result transformation if needed
            // (though CTEs usually don't appear in result rows directly, but their columns might)
            this.entityMap.set(cteName, sourceMeta);
          }
        }
      }
    }
  }

  /**
   * Extract CTE name from CommonTableExpressionNameNode
   */
  getCTEName(
    nameNode: CommonTableExpressionNameNode,
  ): string | undefined {
    if (TableNode.is(nameNode.table)) {
      return this.getTableName(nameNode.table);
    }
    return undefined;
  }

  /**
   * Process a FROM item (can be TableNode or AliasNode)
   */
  processFromItem(
    from: any, // OperationNode type - can be TableNode, AliasNode, or SelectQueryNode
    context: Map<string, EntityMetadata | undefined>,
  ): void {
    if (AliasNode.is(from)) {
      if (TableNode.is(from.node)) {
        // Regular table with alias
        const tableName = this.getTableName(from.node);
        if (tableName && from.alias) {
          const meta = this.findEntityMetadata(tableName);
          const aliasName = this.extractAliasName(from.alias);
          if (aliasName) {
            context.set(aliasName, meta);
            if (meta) {
              this.entityMap.set(aliasName, meta);
            }
            // Also map the alias in subqueryAliasMap if the table name is a CTE
            if (this.subqueryAliasMap.has(tableName)) {
              this.subqueryAliasMap.set(aliasName, this.subqueryAliasMap.get(tableName));
            }
          }
        }
      } else if (from.node?.kind === 'SelectQueryNode') {
        // Subquery with alias
        const aliasName = this.extractAliasName(from.alias);
        if (aliasName) {
          context.set(aliasName, undefined);
          // Try to extract the source table from the subquery
          const sourceMeta = this.extractSourceTableFromSelectQuery(from.node as SelectQueryNode);
          if (sourceMeta) {
            this.subqueryAliasMap.set(aliasName, sourceMeta);
          }
        }
      } else {
        // Other types with alias
        const aliasName = this.extractAliasName(from.alias);
        if (aliasName) {
          context.set(aliasName, undefined);
        }
      }
    } else if (TableNode.is(from)) {
      // Table without alias
      const tableName = this.getTableName(from);
      if (tableName) {
        const meta = this.findEntityMetadata(tableName);
        context.set(tableName, meta);
        if (meta) {
          this.entityMap.set(tableName, meta);
        }
      }
    }
  }

  /**
   * Process a JOIN node
   */
  processJoinNode(
    join: JoinNode,
    context: Map<string, EntityMetadata | undefined>,
  ): void {
    const joinTable = join.table;

    if (AliasNode.is(joinTable)) {
      if (TableNode.is(joinTable.node)) {
        // Regular table with alias in JOIN
        const tableName = this.getTableName(joinTable.node);
        if (tableName && joinTable.alias) {
          const meta = this.findEntityMetadata(tableName);
          const aliasName = this.extractAliasName(joinTable.alias);
          if (aliasName) {
            context.set(aliasName, meta);
            if (meta) {
              this.entityMap.set(aliasName, meta);
            }
            // Also map the alias in subqueryAliasMap if the table name is a CTE
            if (this.subqueryAliasMap.has(tableName)) {
              this.subqueryAliasMap.set(aliasName, this.subqueryAliasMap.get(tableName));
            }
          }
        }
      } else if (joinTable.node?.kind === 'SelectQueryNode') {
        // Subquery with alias in JOIN
        const aliasName = this.extractAliasName(joinTable.alias);
        if (aliasName) {
          context.set(aliasName, undefined);
          // Try to extract the source table from the subquery
          const sourceMeta = this.extractSourceTableFromSelectQuery(joinTable.node as SelectQueryNode);
          if (sourceMeta) {
            this.subqueryAliasMap.set(aliasName, sourceMeta);
          }
        }
      } else {
        // Other types with alias
        const aliasName = this.extractAliasName(joinTable.alias);
        if (aliasName) {
          context.set(aliasName, undefined);
        }
      }
    } else if (TableNode.is(joinTable)) {
      // Table without alias in JOIN
      const tableName = this.getTableName(joinTable);
      if (tableName) {
        const meta = this.findEntityMetadata(tableName);
        // Use table name (meta.tableName) as key to match transformUpdateQuery behavior
        if (meta) {
          context.set(meta.tableName, meta);
          this.entityMap.set(meta.tableName, meta);
          // Also set with entity name for backward compatibility
          context.set(tableName, meta);
        } else {
          context.set(tableName, undefined);
        }
      }
    }
  }

  /**
   * Extract the primary source table from a SELECT query
   * This helps resolve columns from subqueries to their original entity tables
   */
  extractSourceTableFromSelectQuery(selectQuery: SelectQueryNode): EntityMetadata | undefined {
    if (!selectQuery.from?.froms || selectQuery.from.froms.length === 0) {
      return undefined;
    }

    // Get the first FROM table
    const firstFrom = selectQuery.from.froms[0];
    let sourceTable: TableNode | undefined;

    if (AliasNode.is(firstFrom) && TableNode.is(firstFrom.node)) {
      sourceTable = firstFrom.node;
    } else if (TableNode.is(firstFrom)) {
      sourceTable = firstFrom;
    }

    if (sourceTable) {
      const tableName = this.getTableName(sourceTable);
      if (tableName) {
        return this.findEntityMetadata(tableName);
      }
    }

    return undefined;
  }

  /**
   * Extract alias name from an alias node
   */
  extractAliasName(alias: any): string | undefined {
    if (typeof alias === 'object' && 'name' in alias) {
      return (alias as IdentifierNode).name;
    }
    return undefined;
  }

  /**
   * Extract table name from a TableNode
   */
  getTableName(node: TableNode | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    if (TableNode.is(node) && SchemableIdentifierNode.is(node.table)) {
      const identifier = node.table.identifier;
      if (typeof identifier === 'object' && 'name' in identifier) {
        return (identifier as IdentifierNode).name;
      }
    }

    return undefined;
  }

  /**
   * Find entity metadata by table name or entity name
   */
  findEntityMetadata(name: string): EntityMetadata | undefined {
    const byEntity = this.metadata.find(name);
    if (byEntity) {
      return byEntity;
    }
    const allMetadata = Array.from(this.metadata);
    const byTable = allMetadata.find(m => m.tableName === name);
    if (byTable) {
      return byTable;
    }
    return undefined;
  }

  /**
   * Transform result rows by mapping database column names to property names
   * This is called for SELECT queries when columnNamingStrategy is 'property'
   */
  transformResult(
    rows: Record<string, any>[] | undefined,
    entityMap: Map<string, EntityMetadata>,
  ): Record<string, any>[] | undefined {
    // Only transform if columnNamingStrategy is 'property' or convertValues is true, and we have data
    if ((this.options.columnNamingStrategy !== 'property' && !this.options.convertValues) || !rows || rows.length === 0) {
      return rows;
    }

    // If no entities found (e.g. raw query without known tables), return rows as is
    if (entityMap.size === 0) {
      return rows;
    }

    // Build a global mapping from database field names to property objects
    const fieldToPropertyMap = this.buildGlobalFieldMap(entityMap);
    const relationFieldMap = this.buildGlobalRelationFieldMap(entityMap);

    // Transform each row
    return rows.map(row => this.transformRow(row, fieldToPropertyMap, relationFieldMap));
  }

  buildGlobalFieldMap(entityMap: Map<string, EntityMetadata>): Record<string, EntityProperty> {
    const map: Record<string, EntityProperty> = {};
    for (const [alias, meta] of entityMap.entries()) {
      Object.assign(map, this.buildFieldToPropertyMap(meta, alias));
    }
    return map;
  }

  buildGlobalRelationFieldMap(entityMap: Map<string, EntityMetadata>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [alias, meta] of entityMap.entries()) {
      Object.assign(map, this.buildRelationFieldMap(meta, alias));
    }
    return map;
  }

  /**
   * Build a mapping from database field names to property objects
   * Format: { 'field_name': EntityProperty }
   */
  buildFieldToPropertyMap(meta: EntityMetadata, alias?: string): Record<string, EntityProperty> {
    const map: Record<string, EntityProperty> = {};

    for (const prop of meta.props) {
      if (prop.fieldNames && prop.fieldNames.length > 0) {
        for (const fieldName of prop.fieldNames) {
          if (!(fieldName in map)) {
            map[fieldName] = prop;
          }

          if (alias) {
            const dotted = `${alias}.${fieldName}`;
            if (!(dotted in map)) {
              map[dotted] = prop;
            }

            const underscored = `${alias}_${fieldName}`;
            if (!(underscored in map)) {
              map[underscored] = prop;
            }

            const doubleUnderscored = `${alias}__${fieldName}`;
            if (!(doubleUnderscored in map)) {
              map[doubleUnderscored] = prop;
            }
          }
        }
      }

      if (!(prop.name in map)) {
        map[prop.name] = prop;
      }
    }

    return map;
  }

  /**
   * Build a mapping for relation fields
   * For ManyToOne relations, we need to map from the foreign key field to the relation property
   * Format: { 'foreign_key_field': 'relationPropertyName' }
   */
  buildRelationFieldMap(meta: EntityMetadata, alias?: string): Record<string, string> {
    const map: Record<string, string> = {};

    for (const prop of meta.props) {
      // For ManyToOne/OneToOne relations, find the foreign key field
      if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE) {
        if (prop.fieldNames && prop.fieldNames.length > 0) {
          const fieldName = prop.fieldNames[0];
          map[fieldName] = prop.name;

          if (alias) {
            map[`${alias}.${fieldName}`] = prop.name;
            map[`${alias}_${fieldName}`] = prop.name;
            map[`${alias}__${fieldName}`] = prop.name;
          }
        }
      }
    }

    return map;
  }

  /**
   * Transform a single row by mapping column names to property names
   */
  transformRow(
    row: Record<string, any>,
    fieldToPropertyMap: Record<string, EntityProperty>,
    relationFieldMap: Record<string, string>,
  ): Record<string, any> {
    const transformed: Record<string, any> = { ...row };

    // First pass: map regular fields from fieldName to propertyName and convert values
    for (const [fieldName, prop] of Object.entries(fieldToPropertyMap)) {
      if (!(fieldName in transformed)) {
        continue;
      }

      const converted = this.prepareOutputValue(prop, transformed[fieldName]);

      if (this.options.columnNamingStrategy === 'property' && prop.name !== fieldName) {
        if (!(prop.name in transformed)) {
          transformed[prop.name] = converted;
        } else {
          transformed[prop.name] = converted;
        }

        delete transformed[fieldName];
        continue;
      }

      if (this.options.convertValues) {
        transformed[fieldName] = converted;
      }
    }

    // Second pass: handle relation fields
    // Only run if columnNamingStrategy is 'property', as we don't want to rename FKs otherwise
    if (this.options.columnNamingStrategy === 'property') {
      for (const [fieldName, relationPropertyName] of Object.entries(relationFieldMap)) {
        if (fieldName in transformed && !(relationPropertyName in transformed)) {
          // Move the foreign key value to the relation property name
          transformed[relationPropertyName] = transformed[fieldName];
          delete transformed[fieldName];
        }
      }
    }

    return transformed;
  }

  prepareOutputValue(prop: EntityProperty | undefined, value: unknown): unknown {
    if (!this.options.convertValues || !prop || value == null) {
      return value;
    }

    if (prop.customType) {
      return prop.customType.convertToJSValue(value, this.platform);
    }

    // Aligned with EntityComparator.getResultMapper logic
    if (prop.runtimeType === 'boolean') {
      // Use !! conversion like EntityComparator: value == null ? value : !!value
      return value == null ? value : !!value;
    }

    if (prop.runtimeType === 'Date' && !this.platform.isNumericProperty(prop)) {
      // Aligned with EntityComparator: exclude numeric timestamp properties
      // If already Date instance or null, return as is
      if (value == null || value instanceof Date) {
        return value;
      }

      // Handle timezone like EntityComparator.parseDate
      const tz = this.platform.getTimezone();
      if (!tz || tz === 'local') {
        return this.platform.parseDate(value as string | number);
      }

      // For non-local timezone, check if value already has timezone info
      // Number (timestamp) doesn't need timezone handling, string needs check
      if (typeof value === 'number' || (typeof value === 'string' && (value.includes('+') || value.lastIndexOf('-') > 10 || value.endsWith('Z')))) {
        return this.platform.parseDate(value as string | number);
      }

      // Append timezone if not present (only for string values)
      return this.platform.parseDate((value as string) + tz);
    }

    // For all other runtimeTypes (number, string, bigint, Buffer, object, any, etc.)
    // EntityComparator just assigns directly without conversion
    return value;
  }

}
