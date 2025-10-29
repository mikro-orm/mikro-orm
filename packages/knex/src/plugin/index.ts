import type { EntityMetadata, MetadataStorage } from '@mikro-orm/core';
import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely';
import  { MikroTransformer } from './transformer.js';

export interface MikroPluginOptions {
  tableNamingStrategy?: 'table' | 'entity';
  columnNamingStrategy?: 'column' | 'property';
  processOnCreateHooks?: boolean;
  processOnUpdateHooks?: boolean;
}


export class MikroPlugin implements KyselyPlugin {

  protected readonly transformer: MikroTransformer;
  protected readonly entityMap: Map<string, EntityMetadata>;

  constructor(protected readonly metadata: MetadataStorage, protected readonly options: MikroPluginOptions = {}) {
    this.entityMap = new Map(Object.values(metadata.getAll())
      .map(entity => [options.tableNamingStrategy === 'entity' ? entity.className : entity.tableName, entity]));

    this.transformer = new MikroTransformer(this.entityMap, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.transformer.transformNode(args.node, args.queryId);
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }

}

