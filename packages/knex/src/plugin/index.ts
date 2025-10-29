import type { EntityMetadata, MetadataStorage } from '@mikro-orm/core';
import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely';
import { NamingStrategyTransformer } from './transformer.js';

export interface MikroPluginOptions {
  tableNamingStrategy?: 'table' | 'entity';
  columnNamingStrategy?: 'column' | 'property';
  processOnCreateHooks?: boolean;
  processOnUpdateHooks?: boolean;
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

