import type { EntityMetadata, EntityProperty } from '@mikro-orm/core';
import { type ColumnNode, type QueryId, OperationNodeTransformer, TableNode } from 'kysely';
import type { MikroPluginOptions } from '.';

export class NamingStrategyTransformer extends OperationNodeTransformer {

  constructor(protected readonly entityMap: Map<string, EntityMetadata>, protected readonly options: Pick<MikroPluginOptions, 'columnNamingStrategy' | 'tableNamingStrategy'> = {}) {
    super();
  }

  get currentEntity(): EntityMetadata | undefined {
    return undefined;
  }

  get currentProperty(): EntityProperty | undefined {
    for (let i = this.nodeStack.length - 1; i >= 0; i--) {
      const node = this.nodeStack[i];
      if (TableNode.is(node)) {
        return node.table.identifier.name as any;
      }
    }
    return undefined;
  }

  protected override transformColumn(
    node: ColumnNode,
    queryId: QueryId,
  ): ColumnNode {
    node = super.transformColumn(node, queryId);

    const entityName = this.currentEntity?.className ?? '?';
    const propertyName = this.currentProperty?.name ?? '?';
    // eslint-disable-next-line no-console
    console.log(`[${queryId.queryId}] column: ${entityName}.${propertyName}`);
    // console.dir(this.nodeStack, { depth: null });
    return node;
  }

  protected override transformTable(
    node: TableNode,
    queryId: QueryId,
  ): TableNode {
    node = super.transformTable(node, queryId);
    const entityName = this.currentEntity?.className ?? '?';
    // eslint-disable-next-line no-console
    console.log(`[${queryId.queryId}] table: ${entityName}`);
    // eslint-disable-next-line no-console
    console.dir(this.nodeStack, { depth: null });
    return node;
  }

}
