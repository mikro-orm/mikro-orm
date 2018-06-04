import { EntityManager } from './EntityManager';

/**
 * @todo support for building complex query with where (and/or), sort, pagination, etc (maybe even aggregation with $lookup)
 */
export class QueryBuilder {

  constructor(private em: EntityManager) { }

}
