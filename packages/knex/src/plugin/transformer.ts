import type { EntityMetadata, MetadataStorage } from '@mikro-orm/core';
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
  ReferenceNode as ReferenceNodeClass,
  SchemableIdentifierNode,
  TableNode as TableNodeClass,
} from 'kysely';
import type { MikroPluginOptions } from './index.js';

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
    protected readonly options: Pick<MikroPluginOptions, 'columnNamingStrategy' | 'tableNamingStrategy'> = {},
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
      if (node.into) {
        const tableName = this.getTableName(node.into);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            currentContext.set(meta.tableName, meta);
          }
        }
      }
      return super.transformInsertQuery(node, queryId);
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
      if (node.table && TableNodeClass.is(node.table)) {
        const tableName = this.getTableName(node.table as TableNode);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
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

      return super.transformUpdateQuery(node, queryId);
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

}
