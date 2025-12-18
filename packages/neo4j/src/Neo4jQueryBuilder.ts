import * as Cypher from '@neo4j/cypher-builder';
import type { EntityName, EntityClass } from '@mikro-orm/core';
import type { Neo4jEntityManager } from './Neo4jEntityManager';
import { Neo4jCypherBuilder } from './Neo4jCypherBuilder';

export interface QueryBuilderResult<T = any> {
  cypher: string;
  params: Record<string, any>;
  execute?: () => Promise<T[]>;
}

export interface RelationshipOptions {
  direction?: 'left' | 'right' | 'undirected';
  targetLabel?: string;
  targetLabels?: string[];
  /** Target entity class - will extract labels from @Node decorator */
  targetEntity?: EntityClass<any>;
  properties?: Record<string, any>;
  variable?: Cypher.Relationship;
  length?: number | { min?: number; max?: number } | '*';
}

export interface CallOptions {
  importVariables?: '*' | (Cypher.Node | Cypher.Variable)[];
  inTransactions?:
    | boolean
    | {
        ofRows?: number;
        concurrentTransactions?: number;
        onError?: 'continue' | 'break' | 'fail';
        retry?: boolean | number;
      };
}

/**
 * Neo4jQueryBuilder provides a fluent API for building Cypher queries programmatically.
 * It wraps Neo4j's official @neo4j/cypher-builder library and integrates with MikroORM's entity system.
 *
 * Supports advanced features:
 * - Complex relationship patterns with properties
 * - Variable-length relationships
 * - CALL subqueries with transaction control
 * - EXISTS and COUNT subqueries
 * - Pattern composition
 * - WITH clause for query chaining
 *
 * @example
 * ```typescript
 * const qb = em.createQueryBuilder<Movie>('Movie');
 * const { cypher, params } = qb
 *   .match()
 *   .where('title', 'The Matrix')
 *   .return(['title', 'released'])
 *   .build();
 *
 * const movies = await qb
 *   .match()
 *   .where('title', 'The Matrix')
 *   .execute();
 * ```
 */
export class Neo4jQueryBuilder<T = any> {

  private node: Cypher.Node;
  private _pattern?: Cypher.Pattern;
  private clause?: any;
  private readonly em?: Neo4jEntityManager;
  private readonly entityName?: EntityName<T>;
  private readonly labels?: string[];

  // Store query parts separately for flexible composition
  private clauseType?: 'match' | 'create' | 'merge';
  private wherePredicates: any[] = [];
  private returnProperties?: string[] | null;
  private orderByItems: { property: string; direction: 'ASC' | 'DESC' }[] = [];
  private limitValue?: number;
  private skipValue?: number;
  private setOperations: Record<string, any> = {};
  private deleteOperation?: { detach: boolean };

  constructor(entityName?: EntityName<T>, em?: Neo4jEntityManager) {
    this.entityName = entityName;
    this.em = em;
    this.node = new Cypher.Node();

    // Extract labels from entity name if provided
    if (entityName) {
      const labelString =
        typeof entityName === 'string'
          ? entityName
          : (entityName.name as string);
      this.labels = [labelString];
    }
  }

  /**
   * Creates a MATCH clause to find nodes in the graph.
   *
   * @example
   * ```typescript
   * qb.match() // MATCH (this0:Movie)
   * ```
   */
  match(): this {
    this.clauseType = 'match';
    this._pattern = new Cypher.Pattern(this.node, {
      labels: this.labels,
    });
    this.clause = new Cypher.Match(this._pattern);
    return this;
  }

  /**
   * Creates a CREATE clause to create new nodes in the graph.
   *
   * @param properties - Optional properties for the node
   * @example
   * ```typescript
   * qb.create({ title: 'Inception', released: 2010 })
   * ```
   */
  create(properties?: Record<string, any>): this {
    this.clauseType = 'create';
    const nodeOptions: any = { labels: this.labels };
    if (properties) {
      nodeOptions.properties = this.convertPropertiesToParams(properties);
    }
    this._pattern = new Cypher.Pattern(this.node, nodeOptions);
    this.clause = new Cypher.Create(this._pattern);
    return this;
  }

  /**
   * Creates a MERGE clause to ensure a node exists (create if it doesn't).
   *
   * @param properties - Optional properties for the node
   * @example
   * ```typescript
   * qb.merge({ title: 'The Matrix' })
   * ```
   */
  merge(properties?: Record<string, any>): this {
    this.clauseType = 'merge';
    const nodeOptions: any = { labels: this.labels };
    if (properties) {
      nodeOptions.properties = this.convertPropertiesToParams(properties);
    }
    this._pattern = new Cypher.Pattern(this.node, nodeOptions);
    this.clause = new Cypher.Merge(this._pattern);
    return this;
  }

  /**
   * Adds a WHERE clause to filter results.
   *
   * @param propertyOrPredicate - Property name or Cypher predicate
   * @param value - Value to compare (if propertyOrPredicate is a string)
   * @example
   * ```typescript
   * qb.match().where('title', 'The Matrix')
   * // or with custom predicate
   * const titleProp = node.property('title');
   * qb.match().where(Cypher.eq(titleProp, new Cypher.Param('The Matrix')))
   * ```
   */
  where(propertyOrPredicate: string | any, value?: any): this {
    if (!this.clauseType) {
      throw new Error(
        'Cannot add WHERE clause without a MATCH, CREATE, or MERGE clause',
      );
    }

    let predicate: any;
    if (typeof propertyOrPredicate === 'string') {
      const prop = this.node.property(propertyOrPredicate);
      predicate = Cypher.eq(prop, new Cypher.Param(value));
    } else {
      predicate = propertyOrPredicate;
    }

    this.wherePredicates.push(predicate);
    return this;
  }

  /**
   * Adds an AND condition to the WHERE clause.
   *
   * @param propertyOrPredicate - Property name or Cypher predicate
   * @param value - Value to compare (if propertyOrPredicate is a string)
   * @example
   * ```typescript
   * qb.match().where('title', 'The Matrix').and('released', 1999)
   * ```
   */
  and(propertyOrPredicate: string | any, value?: any): this {
    if (this.wherePredicates.length === 0) {
      throw new Error('Cannot add AND clause without a WHERE clause');
    }

    let predicate: any;
    if (typeof propertyOrPredicate === 'string') {
      const prop = this.node.property(propertyOrPredicate);
      predicate = Cypher.eq(prop, new Cypher.Param(value));
    } else {
      predicate = propertyOrPredicate;
    }

    this.wherePredicates.push(predicate);
    return this;
  }

  /**
   * Adds an OR condition to the WHERE clause using Cypher.or.
   *
   * @param predicates - Array of predicates to combine with OR
   * @example
   * ```typescript
   * const title1 = Cypher.eq(node.property('title'), new Cypher.Param('The Matrix'));
   * const title2 = Cypher.eq(node.property('title'), new Cypher.Param('Inception'));
   * qb.match().where(Cypher.or(title1, title2))
   * ```
   */
  or(...predicates: any[]): this {
    if (!this.clauseType) {
      throw new Error('Cannot add OR clause without a WHERE clause');
    }

    const orPredicate = Cypher.or(...predicates);
    this.wherePredicates.push(orPredicate);
    return this;
  }

  /**
   * Adds a RETURN clause to specify what to return.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param properties - Property names to return, or node itself if empty
   * @example
   * ```typescript
   * qb.match().return(['title', 'released'])
   * qb.match().return() // returns the entire node
   * ```
   */
  return(properties?: string[] | string): this {
    if (!this.clauseType) {
      throw new Error('Cannot add RETURN clause without a query clause');
    }

    if (!properties) {
      this.returnProperties = null; // null means return entire node
    } else {
      this.returnProperties = Array.isArray(properties)
        ? properties
        : [properties];
    }

    return this;
  }

  /**
   * Adds an ORDER BY clause.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param property - Property to order by
   * @param direction - Sort direction ('ASC' or 'DESC')
   * @example
   * ```typescript
   * qb.match().orderBy('released', 'DESC').return()
   * // or
   * qb.match().return().orderBy('released', 'DESC')
   * ```
   */
  orderBy(property: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (!this.clauseType) {
      throw new Error('Cannot add ORDER BY clause without a query clause');
    }

    this.orderByItems.push({ property, direction });
    return this;
  }

  /**
   * Adds a LIMIT clause.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param limit - Maximum number of results
   * @example
   * ```typescript
   * qb.match().limit(10)
   * ```
   */
  limit(limit: number): this {
    if (!this.clauseType) {
      throw new Error('Cannot add LIMIT clause without a query clause');
    }

    this.limitValue = limit;
    return this;
  }

  /**
   * Adds a SKIP clause.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param skip - Number of results to skip
   * @example
   * ```typescript
   * qb.match().skip(20).limit(10) // pagination
   * ```
   */
  skip(skip: number): this {
    if (!this.clauseType) {
      throw new Error('Cannot add SKIP clause without a query clause');
    }

    this.skipValue = skip;
    return this;
  }

  /**
   * Adds a DELETE clause to delete nodes or relationships.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param detach - Whether to detach relationships before deleting (default: true)
   * @example
   * ```typescript
   * qb.match().where('title', 'OldMovie').delete()
   * ```
   */
  delete(detach = true): this {
    if (!this.clauseType) {
      throw new Error('Cannot add DELETE clause without a query clause');
    }

    this.deleteOperation = { detach };
    return this;
  }

  /**
   * Adds a SET clause to update node properties.
   * Can be called in any order - will be applied correctly during build().
   *
   * @param properties - Properties to set
   * @example
   * ```typescript
   * qb.match().where('title', 'The Matrix').set({ tagline: 'Welcome to the Real World' })
   * ```
   */
  set(properties: Record<string, any>): this {
    if (!this.clauseType) {
      throw new Error('Cannot add SET clause without a query clause');
    }

    // Store SET operations to apply during build
    Object.assign(this.setOperations, properties);
    return this;
  }

  /**
   * Creates a relationship pattern for matching or creating relationships.
   * Supports advanced features like properties, variable length, and custom variables.
   *
   * @param relationshipTypeOrProperty - The relationship type string (e.g., 'ACTED_IN') or property name when using entity-based approach
   * @param optionsOrDirection - Configuration options object or legacy direction string
   * @param targetLabelOrEntity - (Legacy) Target node label when using old signature, or target entity class
   * @param relationshipAlias - (Legacy) Relationship alias when using old signature
   * @example
   * ```typescript
   * // Entity-based (extracts metadata from decorators)
   * qb.match().related(Movie, 'actors') // Uses @Rel/@RelMany metadata
   *
   * // With entity class in options
   * qb.match().related('ACTED_IN', { targetEntity: Person, direction: 'left' })
   *
   * // Traditional - Basic relationship
   * qb.match().related('ACTED_IN', { direction: 'left', targetLabel: 'Person' })
   *
   * // Legacy signature
   * qb.match().related('ACTED_IN', 'left', 'Person')
   *
   * // With properties
   * qb.match().related('ACTED_IN', {
   *   direction: 'left',
   *   targetLabel: 'Person',
   *   properties: { since: 2020 }
   * })
   *
   * // With variable length
   * qb.match().related('KNOWS', { length: { min: 1, max: 3 } })
   *
   * // Any length
   * qb.match().related('KNOWS', { length: '*' })
   * ```
   */
  related(
    relationshipTypeOrProperty: string | EntityClass<any>,
    optionsOrDirection?:
      | RelationshipOptions
      | 'left'
      | 'right'
      | 'none'
      | string,
    targetLabelOrEntity?: string | EntityClass<any>,
    relationshipAlias?: string,
  ): this {
    if (!this._pattern) {
      this._pattern = new Cypher.Pattern(this.node, { labels: this.labels });
    }

    let relationshipType: string;
    let opts: RelationshipOptions;

    // Handle entity-based signature: related(EntityClass, 'propertyName')
    if (typeof relationshipTypeOrProperty === 'function') {
      const sourceEntity = relationshipTypeOrProperty;
      const propertyName = optionsOrDirection as string;

      // Extract relationship type and direction from decorator metadata
      const relType = this.getRelationshipType(sourceEntity, propertyName, false);
      if (!relType) {
        throw new Error(
          `No @Rel or @RelMany decorator found on ${sourceEntity.name}.${propertyName}. ` +
            `Please use @Rel() or @RelMany() decorator to specify relationship metadata.`,
        );
      }
      relationshipType = relType;

      const direction = this.getRelationshipDirection(
        sourceEntity,
        propertyName,
      );

      // Get target entity from metadata if available
      let targetEntity: EntityClass<any> | undefined;
      if (this.em && typeof targetLabelOrEntity !== 'string') {
        const meta = this.em.getMetadata().find(sourceEntity as any);
        const prop = meta?.properties[propertyName];
        if (prop?.targetMeta) {
          targetEntity = prop.targetMeta.class as EntityClass<any>;
        }
      }

      opts = {
        direction,
        targetEntity:
          targetLabelOrEntity && typeof targetLabelOrEntity !== 'string'
            ? (targetLabelOrEntity as EntityClass<any>)
            : targetEntity,
      };
      // Handle legacy signature: related(type, direction, targetLabel, alias)
    } else if (
      typeof optionsOrDirection === 'string' &&
      (optionsOrDirection === 'left' ||
        optionsOrDirection === 'right' ||
        optionsOrDirection === 'none')
    ) {
      relationshipType = relationshipTypeOrProperty;
      opts = {
        direction:
          optionsOrDirection === 'none' ? 'undirected' : optionsOrDirection,
        targetLabel:
          typeof targetLabelOrEntity === 'string'
            ? targetLabelOrEntity
            : undefined,
        targetEntity:
          typeof targetLabelOrEntity !== 'string'
            ? (targetLabelOrEntity as EntityClass<any>)
            : undefined,
      };
      // Handle new signature: related('ACTED_IN', { options })
    } else {
      relationshipType = relationshipTypeOrProperty as string;
      opts = (optionsOrDirection as RelationshipOptions) || {};
    }

    const direction = opts.direction || 'right';

    const relationship = opts.variable || new Cypher.Relationship();
    const relationshipOptions: any = { type: relationshipType, direction };

    if (opts.properties) {
      relationshipOptions.properties = this.convertPropertiesToParams(
        opts.properties,
      );
    }

    if (opts.length !== undefined) {
      relationshipOptions.length = opts.length;
    }

    // Extract target labels from entity class if provided
    let targetLabels: string[] | undefined;
    if (opts.targetEntity) {
      targetLabels = this.getEntityLabels(opts.targetEntity);
    } else {
      targetLabels =
        opts.targetLabels ||
        (opts.targetLabel ? [opts.targetLabel] : undefined);
    }

    const targetNode = new Cypher.Node();

    this._pattern = this._pattern
      .related(relationship, relationshipOptions)
      .to(targetNode, targetLabels ? { labels: targetLabels } : undefined);

    // Rebuild the clause with the new pattern
    if (this.clauseType === 'match') {
      this.clause = new Cypher.Match(this._pattern);
    } else if (this.clauseType === 'create') {
      this.clause = new Cypher.Create(this._pattern);
    } else if (this.clauseType === 'merge') {
      this.clause = new Cypher.Merge(this._pattern);
    }

    return this;
  }

  /**
   * Creates a pattern with explicit control over nodes and relationships.
   * Use this for complex patterns with multiple steps or custom node/relationship variables.
   *
   * @param callback - Function that receives Cypher builder and current node, returns Pattern
   * @example
   * ```typescript
   * qb.match().pattern((Cypher, node) => {
   *   const person = new Cypher.Node();
   *   const actedIn = new Cypher.Relationship();
   *   return new Cypher.Pattern(node, { labels: ['Movie'] })
   *     .related(actedIn, { type: 'ACTED_IN', direction: 'left' })
   *     .to(person, { labels: ['Person'] });
   * })
   * ```
   */
  pattern(
    callback: (cypher: typeof Cypher, node: Cypher.Node) => Cypher.Pattern,
  ): this {
    if (!this.clauseType) {
      throw new Error(
        'pattern() must be called after match(), create(), or merge()',
      );
    }

    this._pattern = callback(Cypher, this.node);

    // Update the clause with the new pattern
    if (this.clauseType === 'match') {
      this.clause = new Cypher.Match(this._pattern);
    } else if (this.clauseType === 'create') {
      this.clause = new Cypher.Create(this._pattern);
    } else if (this.clauseType === 'merge') {
      this.clause = new Cypher.Merge(this._pattern);
    }

    return this;
  }

  /**
   * Adds a WITH clause to pass variables between query parts.
   * Used for query chaining and complex multi-part queries.
   *
   * @param variables - Variables or expressions to pass forward
   * @example
   * ```typescript
   * const node = qb.getNode();
   * qb.match()
   *   .where('title', 'The Matrix')
   *   .with([node.property('title'), 'movieTitle'])
   *   .return(['movieTitle'])
   * ```
   */
  with(variables: (string | Cypher.Property | [any, string])[]): this {
    if (!this.clause) {
      throw new Error('with() must be called after a clause');
    }

    const withItems: any[] = [];
    for (const v of variables) {
      if (Array.isArray(v)) {
        withItems.push(v); // [expression, alias]
      } else if (typeof v === 'string') {
        // If it's a property name, get it from the node
        withItems.push(this.node.property(v));
      } else {
        withItems.push(v);
      }
    }

    this.clause = this.clause.with(...withItems);
    return this;
  }

  /**
   * Creates a CALL subquery for executing subqueries.
   * Supports transaction control, variable import, and chaining.
   *
   * @param subquery - The subquery to execute (QueryBuilder or Cypher clause)
   * @param options - Subquery options (import variables, transaction settings)
   * @example
   * ```typescript
   * // Basic subquery
   * const subQb = em.createQueryBuilder<Person>('Person')
   *   .match()
   *   .where('age', 25)
   *   .return(['name']);
   *
   * qb.call(subQb)
   *   .return(['name'])
   *
   * // With imported variables
   * qb.call(subQb, { importVariables: '*' })
   *
   * // With transaction control
   * qb.call(subQb, {
   *   inTransactions: {
   *     ofRows: 1000,
   *     concurrentTransactions: 4,
   *     onError: 'continue'
   *   }
   * })
   * ```
   */
  call(subquery: Neo4jQueryBuilder<any> | any, options?: CallOptions): this {
    const opts = options || {};

    let subClause: any;
    if (subquery instanceof Neo4jQueryBuilder) {
      // Build the subquery to get its clause
      subquery.build(); // This builds and stores the clause
      subClause = subquery.clause;
    } else {
      subClause = subquery;
    }

    const importVars = opts.importVariables;
    let callClause: any;

    if (importVars) {
      callClause = new Cypher.Call(subClause, importVars);
    } else {
      callClause = new Cypher.Call(subClause);
    }

    // Handle inTransactions option
    if (opts.inTransactions) {
      if (typeof opts.inTransactions === 'boolean') {
        callClause = callClause.inTransactions();
      } else {
        callClause = callClause.inTransactions(opts.inTransactions);
      }
    }

    if (this.clause) {
      // Chain with existing clause
      this.clause = this.clause.concat(callClause);
    } else {
      this.clause = callClause;
      this.clauseType = 'match'; // Set a type so other methods work
    }

    return this;
  }

  /**
   * Creates an EXISTS subquery predicate for checking pattern existence.
   * Returns a predicate that can be used in WHERE clauses.
   *
   * @param pattern - The pattern or query to check for existence
   * @returns Cypher EXISTS predicate
   * @example
   * ```typescript
   * const Cypher = qb.getCypher();
   * const actorNode = qb.getNode();
   *
   * // Check if actor has acted in any movie
   * const existsPattern = new Cypher.Pattern(actorNode)
   *   .related(new Cypher.Relationship({ type: 'ACTED_IN' }))
   *   .to(new Cypher.Node({ labels: ['Movie'] }));
   *
   * qb.match()
   *   .where(qb.exists(existsPattern))
   *   .return(['name'])
   * ```
   */
  exists(pattern: any): any {
    return new Cypher.Exists(pattern);
  }

  /**
   * Creates a COUNT subquery for counting matching patterns.
   *
   * @param pattern - The pattern to count
   * @returns Cypher COUNT expression
   * @example
   * ```typescript
   * const Cypher = qb.getCypher();
   * const actorNode = qb.getNode();
   *
   * // Count movies an actor has been in
   * const countPattern = new Cypher.Pattern(actorNode)
   *   .related(new Cypher.Relationship({ type: 'ACTED_IN' }))
   *   .to(new Cypher.Node({ labels: ['Movie'] }));
   *
   * const count = qb.count(countPattern);
   * qb.match().where(Cypher.gt(count, new Cypher.Param(5)))
   * ```
   */
  count(pattern: any): any {
    return new Cypher.Count(pattern);
  }

  /**
   * Access the underlying Cypher node for advanced operations.
   * Useful for building custom predicates and expressions.
   *
   * @example
   * ```typescript
   * const node = qb.getNode();
   * const titleProp = node.property('title');
   * qb.match().where(Cypher.contains(titleProp, new Cypher.Param('Matrix')))
   * ```
   */
  getNode(): Cypher.Node {
    return this.node;
  }

  /**
   * Access the raw Cypher builder for advanced usage.
   * Provides access to all Cypher builder classes and functions.
   *
   * @example
   * ```typescript
   * const Cypher = qb.getCypher();
   * const customPattern = new Cypher.Pattern(node)...
   * ```
   */
  getCypher() {
    return Cypher;
  }

  /**
   * Builds the Cypher query and returns the query string and parameters.
   * Assembles all query parts in the correct order regardless of call order.
   *
   * @returns Object with cypher string, params object, and optional execute function
   * @example
   * ```typescript
   * const { cypher, params } = qb.match().where('title', 'The Matrix').build();
   * console.log(cypher); // MATCH (this0:Movie) WHERE this0.title = $param0 RETURN this0
   * console.log(params); // { param0: 'The Matrix' }
   * ```
   */
  build(): QueryBuilderResult<T> {
    if (!this.clauseType) {
      throw new Error('Cannot build query without any clauses');
    }

    // Start with the base clause (MATCH, CREATE, or MERGE)
    let clause = this.clause;

    // Apply WHERE predicates if any
    if (this.wherePredicates.length > 0) {
      // Combine all predicates with AND
      let combinedPredicate = this.wherePredicates[0];
      for (let i = 1; i < this.wherePredicates.length; i++) {
        combinedPredicate = Cypher.and(
          combinedPredicate,
          this.wherePredicates[i],
        );
      }
      clause = clause.where(combinedPredicate);
    }

    // Apply SET operations if any
    if (Object.keys(this.setOperations).length > 0) {
      for (const [key, value] of Object.entries(this.setOperations)) {
        const prop = this.node.property(key);
        clause = clause.set([prop, new Cypher.Param(value)]);
      }
    }

    // Apply DELETE if specified
    if (this.deleteOperation) {
      if (this.deleteOperation.detach) {
        clause = clause.detachDelete(this.node);
      } else {
        clause = clause.delete(this.node);
      }
    }

    // Apply RETURN clause
    // RETURN must come before ORDER BY, SKIP, and LIMIT in Cypher
    if (this.returnProperties !== undefined) {
      if (this.returnProperties === null) {
        clause = clause.return(this.node);
      } else {
        const returnExpressions = this.returnProperties.map(prop => [
          this.node.property(prop),
          prop,
        ]);
        clause = clause.return(...returnExpressions);
      }
    } else if (
      this.orderByItems.length > 0 ||
      this.limitValue !== undefined ||
      this.skipValue !== undefined
    ) {
      // If ORDER BY, LIMIT, or SKIP is used without explicit RETURN, add default RETURN
      clause = clause.return(this.node);
    }

    // Apply ORDER BY clauses
    for (const { property, direction } of this.orderByItems) {
      const prop = this.node.property(property);
      const sortItem =
        direction === 'DESC'
          ? ([prop, 'DESC'] as [any, 'DESC'])
          : ([prop, 'ASC'] as [any, 'ASC']);
      clause = clause.orderBy(sortItem);
    }

    // Apply SKIP
    if (this.skipValue !== undefined) {
      clause = clause.skip(this.skipValue);
    }

    // Apply LIMIT
    if (this.limitValue !== undefined) {
      clause = clause.limit(this.limitValue);
    }

    const { cypher, params } = clause.build();

    const result: QueryBuilderResult<T> = { cypher, params };

    // Add execute method if we have an entity manager
    if (this.em) {
      result.execute = async () => {
        return this.em!.getConnection().execute<T[]>(cypher, params);
      };
    }

    return result;
  }

  /**
   * Builds and executes the query, returning the results.
   * Requires an EntityManager to be provided during construction.
   *
   * @returns Promise with query results
   * @example
   * ```typescript
   * const movies = await qb.match().where('title', 'The Matrix').execute();
   * ```
   */
  async execute(): Promise<T[]> {
    const { cypher, params } = this.build();

    if (!this.em) {
      throw new Error(
        'Cannot execute query without an EntityManager. Use build() and execute manually.',
      );
    }

    // Use the EntityManager's run method which properly converts Neo4j types
    return (this.em as any).run(cypher, params) as Promise<T[]>;
  }

  /**
   * Builds and executes the query, returning all matching results.
   * Alias for execute() with more intuitive naming.
   * Requires an EntityManager to be provided during construction.
   *
   * @returns Promise with array of query results
   * @example
   * ```typescript
   * const movies = await qb.match().where('released', 1999).getMany();
   * ```
   */
  async getMany(): Promise<T[]> {
    return this.execute();
  }

  /**
   * Builds and executes the query, returning the first result or null.
   * Automatically adds LIMIT 1 to the query.
   * Requires an EntityManager to be provided during construction.
   *
   * @returns Promise with single result or null if not found
   * @example
   * ```typescript
   * const movie = await qb.match().where('title', 'The Matrix').getOne();
   * ```
   */
  async getOne(): Promise<T | null> {
    if (!this.em) {
      throw new Error(
        'Cannot execute query without an EntityManager. Use build() and execute manually.',
      );
    }

    // Ensure we only fetch one result
    this.limit(1);

    const { cypher, params } = this.build();
    const result = await (this.em as any).run(cypher, params) as T[];
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Converts properties object to Cypher parameters.
   */
  private convertPropertiesToParams(
    properties: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      result[key] = new Cypher.Param(value);
    }
    return result;
  }

  /**
   * Extracts node labels from entity class or entity name.
   * Checks metadata for neo4jLabels (multiple labels) and collection name.
   */
  private getEntityLabels(
    entity: EntityName<any> | EntityClass<any>,
  ): string[] {
    if (!this.em) {
      // If no EntityManager, try to get string name
      if (typeof entity === 'string') {
        return [entity];
      }
      // If entity class, use its name
      const name =
        typeof entity === 'function' ? entity.name : (entity as any).name;
      return [name];
    }

    // Get metadata through EntityManager
    const meta = this.em.getMetadata().find(entity as any);
    if (!meta) {
      if (typeof entity === 'string') {
        return [entity];
      }
      const name =
        typeof entity === 'function' ? entity.name : (entity as any).name;
      return [name];
    }

    return Neo4jCypherBuilder.getNodeLabels(meta);
  }

  /**
   * Extracts relationship type from entity property using @Rel or @RelMany metadata.
   * Falls back to uppercase relationship name if no metadata found.
   */
  private getRelationshipType(
    sourceEntity: EntityClass<any>,
    propertyName: string,
    allowFallback = true,
  ): string | undefined {
    return Neo4jCypherBuilder.getRelationshipType(sourceEntity, propertyName, allowFallback);
  }

  /**
   * Extracts relationship direction from entity property using @Rel or @RelMany metadata.
   */
  private getRelationshipDirection(
    sourceEntity: EntityClass<any>,
    propertyName: string,
  ): 'left' | 'right' | 'undirected' | undefined {
    const direction = Neo4jCypherBuilder.getRelationshipDirection(sourceEntity, propertyName);
    if (!direction) {
      return undefined;
    }
    return direction === 'IN' ? 'left' : 'right';
  }

}
