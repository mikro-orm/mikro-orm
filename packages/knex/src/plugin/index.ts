import type { MetadataStorage } from '@mikro-orm/core';
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

  constructor(protected readonly metadata: MetadataStorage, protected readonly options: MikroPluginOptions = {}) {
    this.transformer = new MikroTransformer(metadata, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.transformer.transformNode(args.node, args.queryId);
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }

}

