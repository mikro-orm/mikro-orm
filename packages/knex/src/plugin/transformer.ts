import { type EntityMetadata, type EntityProperty, type MetadataStorage, ReferenceKind, isRaw } from '@mikro-orm/core';
import {
  type CommonTableExpressionNameNode,
  type DeleteQueryNode,
  type IdentifierNode,
  type InsertQueryNode,
  type JoinNode,
  type MergeQueryNode,
  type QueryId,
  type ReferenceNode,
  type SelectQueryNode,
  type TableNode,
  type UpdateQueryNode,
  type WithNode,
  AliasNode,
  ColumnNode,
  ColumnUpdateNode,
  OperationNodeTransformer,
  PrimitiveValueListNode,
  ReferenceNode as ReferenceNodeClass,
  SchemableIdentifierNode,
  TableNode as TableNodeClass,
  ValueListNode,
  ValueNode,
  ValuesNode,
} from 'kysely';
import type { MikroPluginOptions } from './index.js';
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

  constructor(
    protected readonly metadata: MetadataStorage,
    protected readonly platform: AbstractSqlPlatform,
    protected readonly options: Pick<MikroPluginOptions, 'columnNamingStrategy' | 'tableNamingStrategy' | 'convertValues'> = {},
  ) {
    super();
  }

  protected override transformSelectQuery(
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

  protected override transformInsertQuery(
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
          }
        }
      }
      const nodeWithConvertedValues = this.options.convertValues && entityMeta
        ? this.processInsertValues(node, entityMeta)
        : node;
      return super.transformInsertQuery(nodeWithConvertedValues, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  protected override transformUpdateQuery(
    node: UpdateQueryNode,
    queryId?: QueryId,
  ): UpdateQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      let entityMeta: EntityMetadata | undefined;
      if (node.table && TableNodeClass.is(node.table)) {
        const tableName = this.getTableName(node.table as TableNode);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            entityMeta = meta;
            currentContext.set(meta.tableName, meta);
          }
        }
      }

      // Also process JOINs in UPDATE queries
      if (node.joins) {
        for (const join of node.joins) {
          this.processJoinNode(join, currentContext);
        }
      }

      const nodeWithConvertedValues = this.options.convertValues && entityMeta
        ? this.processUpdateValues(node, entityMeta)
        : node;
      return super.transformUpdateQuery(nodeWithConvertedValues, queryId);
    } finally {
      this.contextStack.pop();
    }
  }

  protected override transformDeleteQuery(
    node: DeleteQueryNode,
    queryId?: QueryId,
  ): DeleteQueryNode {
    const currentContext = new Map<string, EntityMetadata | undefined>();
    this.contextStack.push(currentContext);

    try {
      const froms = node.from?.froms;
      if (froms && froms.length > 0) {
        const firstFrom = froms[0];
        if (TableNodeClass.is(firstFrom)) {
          const tableName = this.getTableName(firstFrom as TableNode);
          if (tableName) {
            const meta = this.findEntityMetadata(tableName);
            if (meta) {
              currentContext.set(meta.tableName, meta);
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

  protected override transformMergeQuery(
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

  protected override transformIdentifier(
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
    if (this.options.columnNamingStrategy === 'property' && parent && (ColumnNode.is(parent) || ColumnUpdateNode.is(parent))) {
      const ownerMeta = this.findOwnerEntityInContext();

      if (ownerMeta) {
        const prop = ownerMeta.properties[node.name];
        const fieldName = (prop as any)?.fieldName || (prop as any)?.fieldNames?.[0];
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
  protected  findOwnerEntityInContext(): EntityMetadata | undefined {
    // Check if current column has a table reference (e.g., u.firstName)
    const reference = this.nodeStack.find(it => ReferenceNodeClass.is(it)) as ReferenceNode | undefined;

    if (reference?.table && TableNodeClass.is(reference.table)) {
      const tableName = this.getTableName(reference.table);
      if (tableName) {
        // First, check in subquery alias map (for CTE/subquery columns)
        if (this.subqueryAliasMap.has(tableName)) {
          return this.subqueryAliasMap.get(tableName);
        }

        // Search in context stack from current scope to parent scopes
        const meta = this.lookupInContextStack(tableName);
        if (meta) {
          return meta;
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

  protected processInsertValues(node: InsertQueryNode, meta: EntityMetadata): InsertQueryNode {
    if (!node.columns?.length || !node.values || !ValuesNode.is(node.values)) {
      return node;
    }

    const columnProps = this.mapColumnsToProperties(node.columns, meta);
    let changed = false;

    const convertedRows = node.values.values.map(row => {
      if (ValueListNode.is(row)) {
        const converted = this.convertValueListRow(row, columnProps);
        if (converted !== row) {
          changed = true;
        }
        return converted;
      }

      if (PrimitiveValueListNode.is(row)) {
        const converted = this.convertPrimitiveValueListRow(row, columnProps);
        if (converted !== row) {
          changed = true;
        }
        return converted;
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

  protected processUpdateValues(node: UpdateQueryNode, meta: EntityMetadata): UpdateQueryNode {
    if (!node.updates?.length) {
      return node;
    }

    let changed = false;

    const convertedUpdates = node.updates.map(updateNode => {
      const columnName = ColumnNode.is(updateNode.column)
        ? this.normalizeColumnName(updateNode.column.column)
        : undefined;
      const property = this.findProperty(meta, columnName);

      if (ValueNode.is(updateNode.value)) {
        const convertedValue = this.convertScalarValue(property, updateNode.value.value);
        if (convertedValue !== updateNode.value.value) {
          changed = true;
          const newValueNode = updateNode.value.immediate
            ? ValueNode.createImmediate(convertedValue)
            : ValueNode.create(convertedValue);
          return {
            ...updateNode,
            value: newValueNode,
          };
        }
      }

      return updateNode;
    });

    if (!changed) {
      return node;
    }

    return {
      ...node,
      updates: convertedUpdates,
    };
  }

  protected mapColumnsToProperties(columns: readonly ColumnNode[], meta: EntityMetadata): (EntityProperty | undefined)[] {
    return columns.map(column => {
      const columnName = this.normalizeColumnName(column.column);
      return this.findProperty(meta, columnName);
    });
  }

  protected normalizeColumnName(identifier: IdentifierNode): string {
    const name = identifier.name;
    if (!name.includes('.')) {
      return name;
    }

    const parts = name.split('.');
    return parts[parts.length - 1] ?? name;
  }

  protected findProperty(meta: EntityMetadata | undefined, columnName?: string): EntityProperty | undefined {
    if (!meta || !columnName) {
      return undefined;
    }

    if (meta.properties[columnName]) {
      return meta.properties[columnName];
    }

    return meta.props.find(prop => prop.fieldNames?.includes(columnName));
  }

  protected convertValueListRow(row: ValueListNode, columnProps: (EntityProperty | undefined)[]): ValueListNode {
    if (row.values.length !== columnProps.length) {
      return row;
    }

    let changed = false;
    const convertedValues = row.values.map((valueNode, idx) => {
      if (!ValueNode.is(valueNode)) {
        return valueNode;
      }

      const converted = this.convertScalarValue(columnProps[idx], valueNode.value);
      if (converted !== valueNode.value) {
        changed = true;
        return valueNode.immediate ? ValueNode.createImmediate(converted) : ValueNode.create(converted);
      }

      return valueNode;
    });

    if (!changed) {
      return row;
    }

    return ValueListNode.create(convertedValues);
  }

  protected convertPrimitiveValueListRow(row: PrimitiveValueListNode, columnProps: (EntityProperty | undefined)[]): PrimitiveValueListNode {
    if (row.values.length !== columnProps.length) {
      return row;
    }

    let changed = false;
    const convertedValues = row.values.map((value, idx) => {
      const converted = this.convertScalarValue(columnProps[idx], value);
      if (converted !== value) {
        changed = true;
      }
      return converted;
    });

    if (!changed) {
      return row;
    }

    return PrimitiveValueListNode.create(convertedValues);
  }

  protected convertScalarValue(prop: EntityProperty | undefined, value: unknown): unknown {
    if (value == null) {
      return value;
    }

    if (typeof value === 'object') {
      if (isRaw(value)) {
        return value;
      }

      if ('kind' in (value as Record<string, unknown>)) {
        return value;
      }
    }

    if (prop?.customType && !isRaw(value)) {
      return prop.customType.convertToDatabaseValue(value, this.platform, { fromQuery: true, key: prop.name, mode: 'query' });
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
  protected lookupInContextStack(tableNameOrAlias: string): EntityMetadata | undefined {
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
  protected processWithNode(
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
          }
        }
      }
    }
  }

  /**
   * Extract CTE name from CommonTableExpressionNameNode
   */
  protected getCTEName(
    nameNode: CommonTableExpressionNameNode,
  ): string | undefined {
    if (TableNodeClass.is(nameNode.table)) {
      return this.getTableName(nameNode.table);
    }
    return undefined;
  }

  /**
   * Process a FROM item (can be TableNode or AliasNode)
   */
   protected processFromItem(
    from: any, // OperationNode type - can be TableNode, AliasNode, or SelectQueryNode
    context: Map<string, EntityMetadata | undefined>,
  ): void {
    if (AliasNode.is(from)) {
      if (TableNodeClass.is(from.node)) {
        // Regular table with alias
        const tableName = this.getTableName(from.node);
        if (tableName && from.alias) {
          const meta = this.findEntityMetadata(tableName);
          const aliasName = this.extractAliasName(from.alias);
          if (aliasName) {
            context.set(aliasName, meta);
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
    } else if (TableNodeClass.is(from)) {
      // Table without alias
      const tableName = this.getTableName(from);
      if (tableName) {
        const meta = this.findEntityMetadata(tableName);
        context.set(tableName, meta);
      }
    }
  }

  /**
   * Process a JOIN node
   */
  protected processJoinNode(
    join: JoinNode,
    context: Map<string, EntityMetadata | undefined>,
  ): void {
    const joinTable = join.table;

    if (AliasNode.is(joinTable)) {
      if (TableNodeClass.is(joinTable.node)) {
        // Regular table with alias in JOIN
        const tableName = this.getTableName(joinTable.node);
        if (tableName && joinTable.alias) {
          const meta = this.findEntityMetadata(tableName);
          const aliasName = this.extractAliasName(joinTable.alias);
          if (aliasName) {
            context.set(aliasName, meta);
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
    } else if (TableNodeClass.is(joinTable)) {
      // Table without alias in JOIN
      const tableName = this.getTableName(joinTable);
      if (tableName) {
        const meta = this.findEntityMetadata(tableName);
        context.set(tableName, meta);
      }
    }
  }

  /**
   * Extract the primary source table from a SELECT query
   * This helps resolve columns from subqueries to their original entity tables
   */
  protected extractSourceTableFromSelectQuery(selectQuery: SelectQueryNode): EntityMetadata | undefined {
    if (!selectQuery.from?.froms || selectQuery.from.froms.length === 0) {
      return undefined;
    }

    // Get the first FROM table
    const firstFrom = selectQuery.from.froms[0];
    let sourceTable: TableNode | undefined;

    if (AliasNode.is(firstFrom) && TableNodeClass.is(firstFrom.node)) {
      sourceTable = firstFrom.node;
    } else if (TableNodeClass.is(firstFrom)) {
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
  protected extractAliasName(alias: any): string | undefined {
    if (typeof alias === 'object' && 'name' in alias) {
      return (alias as IdentifierNode).name;
    }
    return undefined;
  }

  /**
   * Extract table name from a TableNode
   */
  protected getTableName(node: TableNode | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    if (TableNodeClass.is(node) && SchemableIdentifierNode.is(node.table)) {
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
  protected findEntityMetadata(name: string): EntityMetadata | undefined {
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
   * Extract the primary table metadata from a SELECT query at the top level
   * This is called in transformQuery to determine the main entity being queried
   * Supports CTE resolution by recursively inspecting WITH clauses
   */
  extractPrimaryTableFromQuery(selectNode: SelectQueryNode): EntityMetadata | undefined {
    if (!selectNode.from?.froms || selectNode.from.froms.length === 0) {
      return undefined;
    }

    // Get the first FROM table or CTE reference
    const firstFrom = selectNode.from.froms[0];
    let sourceTableName: string | undefined;

    if (AliasNode.is(firstFrom) && TableNodeClass.is(firstFrom.node)) {
      sourceTableName = this.getTableName(firstFrom.node);
    } else if (TableNodeClass.is(firstFrom)) {
      sourceTableName = this.getTableName(firstFrom);
    }

    if (!sourceTableName) {
      return undefined;
    }

    // 1. Try to find entity metadata directly
    const meta = this.findEntityMetadata(sourceTableName);
    if (meta) {
      return meta;
    }

    // 2. Try to resolve CTEs
    if (selectNode.with) {
      for (const cte of selectNode.with.expressions) {
        // Check if this CTE matches the table name
        const cteName = this.getCTEName(cte.name);
        if (cteName === sourceTableName && cte.expression?.kind === 'SelectQueryNode') {
          // Recursively resolve the CTE source
          // Prevent infinite recursion for recursive CTEs by checking if the source table is the same as CTE name
          // (Simple cycle detection)
          const cteSelect = cte.expression as SelectQueryNode;
          const cteSourceMeta = this.extractPrimaryTableFromQuery(cteSelect);
          if (cteSourceMeta) {
            return cteSourceMeta;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Build a map of all entities involved in the query (from FROM, JOINs, WITHs)
   */
  protected buildEntityMapFromQuery(node: SelectQueryNode | InsertQueryNode | UpdateQueryNode | DeleteQueryNode): Map<string, EntityMetadata> {
    const entityMap = new Map<string, EntityMetadata>();

    // 1. Process WITH (CTEs)
    // We need to resolve CTEs to their source entities to map their columns
    if (node.with) {
      for (const cte of node.with.expressions) {
        const cteName = this.getCTEName(cte.name);
        if (cteName && cte.expression?.kind === 'SelectQueryNode') {
          const meta = this.extractPrimaryTableFromQuery(cte.expression as SelectQueryNode);
          if (meta) {
            entityMap.set(cteName, meta);
          }
        }
      }
    }

    // Helper to process a table node (TableNode or AliasNode)
    const processNode = (n: any) => {
      let tableName: string | undefined;
      let alias: string | undefined;
      let meta: EntityMetadata | undefined;

      if (AliasNode.is(n)) {
        alias = this.extractAliasName(n.alias);
        if (TableNodeClass.is(n.node)) {
          tableName = this.getTableName(n.node);
        } else if (n.node?.kind === 'SelectQueryNode') {
           // Subquery with alias
           // Try to extract metadata from subquery
           meta = this.extractPrimaryTableFromQuery(n.node as SelectQueryNode);
        }
      } else if (TableNodeClass.is(n)) {
        tableName = this.getTableName(n);
      }

      if (tableName) {
        // Check if table name refers to a CTE
        if (entityMap.has(tableName)) {
          meta = entityMap.get(tableName);
        } else {
          meta = this.findEntityMetadata(tableName);
        }
      }

      if (meta) {
        if (alias) {
          entityMap.set(alias, meta);
        }
        if (tableName) {
          entityMap.set(tableName, meta);
        }
      }
    };

    // 2. Process main table(s)
    if (this.isSelectQueryNode(node) && node.from?.froms) {
      node.from.froms.forEach(processNode);
    } else if (this.isInsertQueryNode(node) && node.into) {
      processNode(node.into);
    } else if (this.isUpdateQueryNode(node) && node.table) {
      processNode(node.table);
    } else if (this.isDeleteQueryNode(node) && node.from?.froms) {
      node.from.froms.forEach(processNode);
    }

    // 3. Process JOINs
    if ((this.isSelectQueryNode(node) || this.isUpdateQueryNode(node) || this.isDeleteQueryNode(node)) && node.joins) {
      node.joins.forEach(join => processNode(join.table));
    }

    return entityMap;
  }

  protected isSelectQueryNode(node: any): node is SelectQueryNode {
    return node.kind === 'SelectQueryNode';
  }

  protected isInsertQueryNode(node: any): node is InsertQueryNode {
    return node.kind === 'InsertQueryNode';
  }

  protected isUpdateQueryNode(node: any): node is UpdateQueryNode {
    return node.kind === 'UpdateQueryNode';
  }

  protected isDeleteQueryNode(node: any): node is DeleteQueryNode {
    return node.kind === 'DeleteQueryNode';
  }

  /**
   * Transform result rows by mapping database column names to property names
   * This is called for SELECT queries when columnNamingStrategy is 'property'
   */
  transformResult(
    rows: Record<string, any>[] | undefined,
    node: SelectQueryNode | InsertQueryNode | UpdateQueryNode | DeleteQueryNode | undefined,
  ): Record<string, any>[] | undefined {
    // Only transform if columnNamingStrategy is 'property' and we have data
    if (this.options.columnNamingStrategy !== 'property' || !rows || rows.length === 0 || !node) {
      return rows;
    }

    // Build a global map of all involved entities
    const entityMap = this.buildEntityMapFromQuery(node);

    // If no entities found (e.g. raw query without known tables), return rows as is
    if (entityMap.size === 0) {
      return rows;
    }
    // ... rest of function

    // Build a global mapping from database field names to property names
    const fieldToPropertyMap = this.buildGlobalFieldMap(entityMap);
    const relationFieldMap = this.buildGlobalRelationFieldMap(entityMap);

    // Transform each row
    return rows.map(row => this.transformRow(row, fieldToPropertyMap, relationFieldMap));
  }

  protected buildGlobalFieldMap(entityMap: Map<string, EntityMetadata>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const meta of entityMap.values()) {
      Object.assign(map, this.buildFieldToPropertyMap(meta));
    }
    return map;
  }

  protected buildGlobalRelationFieldMap(entityMap: Map<string, EntityMetadata>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const meta of entityMap.values()) {
      Object.assign(map, this.buildRelationFieldMap(meta));
    }
    return map;
  }

  /**
   * Build a mapping from database field names to property names
   * Format: { 'field_name': 'propertyName' }
   */
  protected buildFieldToPropertyMap(meta: EntityMetadata): Record<string, string> {
    const map: Record<string, string> = {};

    for (const prop of meta.props) {
      if (prop.fieldNames && prop.fieldNames.length > 0) {
        const fieldName = prop.fieldNames[0];
        map[fieldName] = prop.name;
      }
    }

    return map;
  }

  /**
   * Build a mapping for relation fields
   * For ManyToOne relations, we need to map from the foreign key field to the relation property
   * Format: { 'foreign_key_field': 'relationPropertyName' }
   */
  protected buildRelationFieldMap(meta: EntityMetadata): Record<string, string> {
    const map: Record<string, string> = {};

    for (const prop of meta.props) {
      // For ManyToOne/OneToOne relations, find the foreign key field
      if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE) {
        if (prop.fieldNames && prop.fieldNames.length > 0) {
          const fieldName = prop.fieldNames[0];
          map[fieldName] = prop.name;
        }
      }
    }

    return map;
  }

  /**
   * Transform a single row by mapping column names to property names
   */
  protected transformRow(
    row: Record<string, any>,
    fieldToPropertyMap: Record<string, string>,
    relationFieldMap: Record<string, string>,
  ): Record<string, any> {
    const transformed: Record<string, any> = { ...row };

    // First pass: map regular fields from fieldName to propertyName
    for (const [fieldName, propertyName] of Object.entries(fieldToPropertyMap)) {
      if (fieldName in transformed && !(propertyName in transformed)) {
        // Only rename if the property name doesn't already exist (avoid overwrites)
        transformed[propertyName] = transformed[fieldName];
        delete transformed[fieldName];
      }
    }

    // Second pass: handle relation fields
    // For foreign key fields, optionally move them to relation property name
    // But only if user didn't explicitly alias or select both
    for (const [fieldName, relationPropertyName] of Object.entries(relationFieldMap)) {
      if (fieldName in transformed && !(relationPropertyName in transformed)) {
        // Move the foreign key value to the relation property name
        transformed[relationPropertyName] = transformed[fieldName];
        delete transformed[fieldName];
      }
    }

    return transformed;
  }

}
