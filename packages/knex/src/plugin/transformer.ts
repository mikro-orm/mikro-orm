import type { EntityMetadata, MetadataStorage } from '@mikro-orm/core';
import {
  type DeleteQueryNode,
  type IdentifierNode,
  type InsertQueryNode,
  type MergeQueryNode,
  type QueryId,
  type ReferenceNode,
  type SelectQueryNode,
  type TableNode,
  type UpdateQueryNode,
  AliasNode,
  ColumnNode,
  ColumnUpdateNode,
  OperationNodeTransformer,
  ReferenceNode as ReferenceNodeClass,
  SchemableIdentifierNode,
  TableNode as TableNodeClass,
} from 'kysely';
import type { MikroPluginOptions } from '.';

export class MikroTransformer extends OperationNodeTransformer {

  protected currentEntityContext: Map<string, EntityMetadata | undefined> = new Map();

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
    const oldContext = this.currentEntityContext;
    try {
      this.currentEntityContext = this.buildTableAliasMap(node);
      node = super.transformSelectQuery(node, queryId);
      return node;
    } finally {
      this.currentEntityContext = oldContext;
    }
  }

  protected override transformInsertQuery(
    node: InsertQueryNode,
    queryId?: QueryId,
  ): InsertQueryNode {
    const oldContext = this.currentEntityContext;
    try {
      this.currentEntityContext = new Map();
      if (node.into) {
        const tableName = this.getTableName(node.into);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            this.currentEntityContext.set(meta.tableName, meta);
          }
        }
      }
      node = super.transformInsertQuery(node, queryId);
      return node;
    } finally {
      this.currentEntityContext = oldContext;
    }
  }

  protected override transformUpdateQuery(
    node: UpdateQueryNode,
    queryId?: QueryId,
  ): UpdateQueryNode {
    const oldContext = this.currentEntityContext;
    try {
      this.currentEntityContext = new Map();
      if (node.table && TableNodeClass.is(node.table)) {
        const tableName = this.getTableName(node.table as TableNode);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          if (meta) {
            this.currentEntityContext.set(meta.tableName, meta);
          }
        }
      }
      node = super.transformUpdateQuery(node, queryId);
      return node;
    } finally {
      this.currentEntityContext = oldContext;
    }
  }

  protected override transformDeleteQuery(
    node: DeleteQueryNode,
    queryId?: QueryId,
  ): DeleteQueryNode {
    const oldContext = this.currentEntityContext;
    try {
      this.currentEntityContext = new Map();
      const froms = node.from?.froms;
      if (froms && froms.length > 0) {
        const firstFrom: TableNode | undefined = froms[0] as TableNode | undefined;
        if (firstFrom && TableNodeClass.is(firstFrom)) {
          const tableName = this.getTableName(firstFrom);
          if (tableName) {
            const meta = this.findEntityMetadata(tableName);
            if (meta) {
              this.currentEntityContext.set(meta.tableName, meta);
            }
          }
        }
      }
      node = super.transformDeleteQuery(node, queryId);
      return node;
    } finally {
      this.currentEntityContext = oldContext;
    }
  }

  protected override transformMergeQuery(
    node: MergeQueryNode,
    queryId?: QueryId,
  ): MergeQueryNode {
    const oldContext = this.currentEntityContext;
    try {
      this.currentEntityContext = new Map();
      node = super.transformMergeQuery(node, queryId);
      return node;
    } finally {
      this.currentEntityContext = oldContext;
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
      const ownerMeta = this.findOwnerEntityMeta();

      if (ownerMeta) {
        const prop = ownerMeta.properties[node.name];
        // Use fieldNames if available (newer MikroORM), otherwise use a computed name
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
   * Find owner entity metadata for the current identifier context.
   * This handles both aliased and non-aliased table references.
   */
  protected findOwnerEntityMeta(): EntityMetadata | undefined {
    // Check if current column has a table reference (e.g., u.firstName)
    const reference = this.nodeStack.find(it => ReferenceNodeClass.is(it)) as ReferenceNode | undefined;

    if (reference?.table && TableNodeClass.is(reference.table)) {
      const tableName = this.getTableName(reference.table);
      if (tableName) {
        // For aliased references like "u.firstName", we need to find the actual table name
        const meta = this.currentEntityContext.get(tableName);
        if (meta) {
          return meta;
        }
      }
    }

    // If no explicit table reference, use the first entity in current context (for single-table queries)
    for (const meta of this.currentEntityContext.values()) {
      if (meta) {
        return meta;
      }
    }

    return undefined;
  }

  /**
   * Build a map from table alias/name to EntityMetadata from a SELECT query.
   */
  protected buildTableAliasMap(node: SelectQueryNode): Map<string, EntityMetadata | undefined> {
    const map = new Map<string, EntityMetadata | undefined>();

    const froms = node.from?.froms;
    if (!froms) {
      return map;
    }

    for (const from of froms) {
      if (AliasNode.is(from)) {
        if (TableNodeClass.is(from.node)) {
          const tableName = this.getTableName(from.node);
          if (tableName && from.alias) {
            const meta = this.findEntityMetadata(tableName);
            const aliasNode = from.alias;
            if (typeof aliasNode === 'object' && 'name' in aliasNode) {
              const aliasName = (aliasNode as IdentifierNode).name;
              map.set(aliasName, meta);
            }
          }
        }
      } else if (TableNodeClass.is(from)) {
        const tableName = this.getTableName(from);
        if (tableName) {
          const meta = this.findEntityMetadata(tableName);
          map.set(tableName, meta);
        }
      }
    }

    // TODO: Handle JOINs if needed
    return map;
  }

  /**
   * Extract table name from a TableNode.
   */
  protected getTableName(node: TableNode | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    // Check if it's a TableNode directly
    if (TableNodeClass.is(node)) {
      if (SchemableIdentifierNode.is(node.table)) {
        const identifier = node.table.identifier;
        if (typeof identifier === 'object' && 'name' in identifier) {
          return (identifier as IdentifierNode).name;
        }
      }
      return undefined;
    }

    return undefined;
  }

  /**
   * Find entity metadata by table name or entity name.
   * First tries to find by entity name, then by table name.
   */
  protected findEntityMetadata(name: string): EntityMetadata | undefined {
    try {
      // Try to find by entity name first
      const byEntity = this.metadata.find(name);
      if (byEntity) {
        return byEntity;
      }
    } catch {
      // Continue to try by table name
    }

    try {
      // Try to find by table name using the overloaded find method
      const allMetadata = Array.from(this.metadata);
      const byTable = allMetadata.find(m => m.tableName === name);
      if (byTable) {
        return byTable;
      }
    } catch {
      // Entity not found
    }

    return undefined;
  }

}
