import type { EntityMetadata, EntityProperty, MetadataStorage } from '@mikro-orm/core';
import {
  TableNode,
  type ColumnNode,
  type QueryId,
  OperationNodeTransformer,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely';

export interface MikroPluginOptions {
  tableNamingStrategy?: 'table' | 'entity';
  columnNamingStrategy?: 'column' | 'property';
  processOnCreateHooks?: boolean;
  processOnUpdateHooks?: boolean;
}

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

export class MikroPlugin implements KyselyPlugin {

  protected readonly namingStrategyTransformer: NamingStrategyTransformer;
  protected readonly entityMap: Map<string, EntityMetadata>;

  constructor(protected readonly metadata: MetadataStorage, protected readonly options: MikroPluginOptions = {}) {
    this.entityMap = new Map(Object.values(metadata.getAll())
      .map(entity => [options.tableNamingStrategy === 'entity' ? entity.className : entity.tableName, entity]));

    this.namingStrategyTransformer = new NamingStrategyTransformer(this.entityMap, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.namingStrategyTransformer.transformNode(args.node, args.queryId);
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }

}

