import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
  SelectQueryNode as SelectQueryNodeClass,
  InsertQueryNode as InsertQueryNodeClass,
  UpdateQueryNode as UpdateQueryNodeClass,
  DeleteQueryNode as DeleteQueryNodeClass,
} from 'kysely';
import { MikroTransformer } from './transformer.js';
import type { SqlEntityManager } from '../SqlEntityManager.js';
import type { EntityMetadata } from '@mikro-orm/core';

/**
 * Cache for query transformation data
 * Stores the query node and metadata about tables/aliases
 */
interface QueryTransformCache {
  entityMap: Map<string, EntityMetadata>;
}

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

  protected static queryNodeCache = new WeakMap<any, QueryTransformCache>();

  protected readonly transformer: MikroTransformer;

  constructor(
    protected readonly em: SqlEntityManager,
    protected readonly options: MikroPluginOptions = {},
  ) {
    this.transformer = new MikroTransformer(em, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    this.transformer.reset();

    const result = this.transformer.transformNode(args.node, args.queryId);

    // Cache the entity map if it is one we can process (for use in transformResult)
    if (
      SelectQueryNodeClass.is(args.node) ||
      InsertQueryNodeClass.is(args.node) ||
      UpdateQueryNodeClass.is(args.node) ||
      DeleteQueryNodeClass.is(args.node)
    ) {
      MikroPlugin.queryNodeCache.set(args.queryId, { entityMap: this.transformer.getOutputEntityMap() });
    }

    return result;
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    // Only transform results if columnNamingStrategy is 'property' or convertValues is true
    if (this.options.columnNamingStrategy !== 'property' && !this.options.convertValues) {
      return args.result;
    }

    // Retrieve the cached query node and metadata
    const cache = MikroPlugin.queryNodeCache.get(args.queryId);
    if (!cache) {
      return args.result;
    }

    // Transform the result rows using the transformer
    const transformedRows = this.transformer.transformResult(
      (args.result.rows as any) ?? [],
      cache.entityMap,
    );

    return {
      ...args.result,
      rows: transformedRows ?? [],
    };
  }

}
