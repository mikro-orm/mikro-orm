import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type SelectQueryNode,
  type UnknownRow,
  type InsertQueryNode,
  type UpdateQueryNode,
  type DeleteQueryNode,
  SelectQueryNode as SelectQueryNodeClass,
  InsertQueryNode as InsertQueryNodeClass,
  UpdateQueryNode as UpdateQueryNodeClass,
  DeleteQueryNode as DeleteQueryNodeClass,
} from 'kysely';
import  { MikroTransformer } from './transformer.js';
import type { SqlEntityManager } from '../SqlEntityManager.js';

/**
 * Cache for query transformation data
 * Stores the query node and metadata about tables/aliases
 */
interface QueryTransformCache {
  node: SelectQueryNode | InsertQueryNode | UpdateQueryNode | DeleteQueryNode;
}

const queryNodeCache = new WeakMap<any, QueryTransformCache>();

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
    protected readonly em: SqlEntityManager,
    protected readonly options: MikroPluginOptions = {},
  ) {
    this.transformer = new MikroTransformer(em, options);
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    // Cache the query node if it is one we can process (for use in transformResult)
    if (
      SelectQueryNodeClass.is(args.node) ||
      InsertQueryNodeClass.is(args.node) ||
      UpdateQueryNodeClass.is(args.node) ||
      DeleteQueryNodeClass.is(args.node)
    ) {
      queryNodeCache.set(args.queryId, { node: args.node as SelectQueryNode | InsertQueryNode | UpdateQueryNode | DeleteQueryNode });
    }
    return this.transformer.transformNode(args.node, args.queryId);
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    // Only transform results if columnNamingStrategy is 'property' or convertValues is true
    if (this.options.columnNamingStrategy !== 'property' && !this.options.convertValues) {
      return args.result;
    }

    // Retrieve the cached query node and metadata
    const cache = queryNodeCache.get(args.queryId);
    if (!cache) {
      return args.result;
    }

    // Transform the result rows using the transformer
    const transformedRows = this.transformer.transformResult(
      (args.result.rows as any) ?? [],
      cache.node,
    );

    return {
      ...args.result,
      rows: transformedRows ?? [],
    };
  }

}
