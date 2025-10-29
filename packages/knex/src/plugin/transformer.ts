import type { MetadataStorage } from '@mikro-orm/core';
import { type DeleteQueryNode, type MergeQueryNode, type UpdateQueryNode, type InsertQueryNode, type SelectQueryNode, type TableNode, type IdentifierNode, type ColumnNode, type QueryId, OperationNodeTransformer } from 'kysely';
import type { MikroPluginOptions } from '.';

export class MikroTransformer extends OperationNodeTransformer {

  constructor(protected readonly metadata: MetadataStorage, protected readonly options: Pick<MikroPluginOptions, 'columnNamingStrategy' | 'tableNamingStrategy'> = {}) {
    super();
  }

  protected override transformSelectQuery(node: SelectQueryNode, queryId: QueryId): SelectQueryNode {
    return super.transformSelectQuery(node, queryId);
  }

  protected override transformInsertQuery(node: InsertQueryNode, queryId?: QueryId): InsertQueryNode {
    return super.transformInsertQuery(node, queryId);
  }

  protected override transformUpdateQuery(node: UpdateQueryNode, queryId?: QueryId): UpdateQueryNode {
    return super.transformUpdateQuery(node, queryId);
  }

  protected override transformDeleteQuery(node: DeleteQueryNode, queryId?: QueryId): DeleteQueryNode {
    return super.transformDeleteQuery(node, queryId);
  }

  protected override transformMergeQuery(node: MergeQueryNode, queryId?: QueryId): MergeQueryNode {
    return super.transformMergeQuery(node, queryId);
  }

  protected override transformColumn(
    node: ColumnNode,
    queryId: QueryId,
  ): ColumnNode {
    return super.transformColumn(node, queryId);
  }

  protected override transformTable(
    node: TableNode,
    queryId: QueryId,
  ): TableNode {
    return super.transformTable(node, queryId);
  }

  protected override transformIdentifier(
    node: IdentifierNode,
    queryId: QueryId,
  ): IdentifierNode {
    // eslint-disable-next-line no-console
    console.log('transformIdentifier', queryId, node);
    // eslint-disable-next-line no-console
    console.dir(this.nodeStack, { depth: null });
    return super.transformIdentifier(node, queryId);
  }

}
