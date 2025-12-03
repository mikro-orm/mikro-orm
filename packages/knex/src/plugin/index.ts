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
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';

export interface MikroPluginOptions {
  /**
   * Use database table names ('table') or entity names ('entity') in queries.
   *
   * @default 'table'
   */
  tableNamingStrategy?: 'table' | 'entity';
  /**
   * Use database column names ('column') or property names ('property') in queries.
   *
   * @default 'column'
   */
  columnNamingStrategy?: 'column' | 'property';
  /**
   * Automatically process entity `onCreate` hooks in INSERT queries.
   *
   * @default false
   */
  processOnCreateHooks?: boolean;
  /**
   * Automatically process entity `onUpdate` hooks in UPDATE queries.
   *
   * @default false
   */
  processOnUpdateHooks?: boolean;
  /**
   * Convert JavaScript values to database-compatible values (e.g., Date to timestamp, custom types).
   *
   * @default false
   */
  convertValues?: boolean;
}


export class MikroPlugin implements KyselyPlugin {

  protected readonly transformer: MikroTransformer;

  constructor(
    protected readonly metadata: MetadataStorage,
    protected readonly platform: AbstractSqlPlatform,
    protected readonly options: MikroPluginOptions = {},
  ) {
    this.transformer = new MikroTransformer(metadata, platform, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.transformer.transformNode(args.node, args.queryId);
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }

}
