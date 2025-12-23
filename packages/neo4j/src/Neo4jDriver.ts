import crypto from 'node:crypto';
import { type Dictionary,
  DatabaseDriver,
  EntityManagerType,
  type Configuration,
  type CountOptions,
  type DeleteOptions,
  type DriverMethodOptions,
  type EntityData,
  type EntityDictionary,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type FindOneOptions,
  type FindOptions,
  type IDatabaseDriver,
  type NativeInsertUpdateManyOptions,
  type NativeInsertUpdateOptions,
  type QueryResult,
  type FilterQuery,
  type QueryOrderMap,
  type Transaction,
  ReferenceKind,
  type AnyEntity,
  Collection  } from '@mikro-orm/core';
import { Neo4jConnection } from './Neo4jConnection';
import { Neo4jPlatform } from './Neo4jPlatform';
import { Neo4jEntityManager } from './Neo4jEntityManager';
import { Neo4jCypherBuilder } from './Neo4jCypherBuilder';
import { getRelationshipMetadata } from './decorators';
import Cypher from '@neo4j/cypher-builder';

interface Neo4jQueryOptions<T> {
  where?: FilterQuery<T>;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  limit?: number;
  offset?: number;
  fields?: string[];
}

export class Neo4jDriver extends DatabaseDriver<Neo4jConnection> {

  override [EntityManagerType]!: Neo4jEntityManager<this>;

  protected override readonly connection = new Neo4jConnection(this.config);
  protected override readonly platform = new Neo4jPlatform();

  constructor(config: Configuration) {
    super(config, ['neo4j-driver']);
  }

  override createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new Neo4jEntityManager(this.config, this, this.metadata, useContext) as unknown as D[typeof EntityManagerType];
  }

  override async find<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P, F, E> = {}): Promise<EntityData<T>[]> {
    const meta = this.metadata.find<T>(entityName)!;

    // Virtual entities use expression-based queries
    if (meta.virtual) {
      return this.findVirtual(entityName, where, options);
    }

    // Relationship entities require special handling
    if (Neo4jCypherBuilder.isRelationshipEntity(meta)) {
      return this.findRelationshipEntity(meta, where, options);
    }

    const populate = this.normalizePopulate(options.populate);
    const query = this.buildMatchWithPopulate(meta, { where, orderBy: options.orderBy as any, limit: options.limit, offset: options.offset }, populate);
    const res = await this.connection.executeRaw(query.cypher, query.params, options.ctx);
    return res.records.map((r: any) => this.hydrateWithRelations(meta, r, populate));
  }

  override async findOne<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T, P, F, E> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    const meta = this.metadata.find<T>(entityName)!;

    // Relationship entities require special handling
    if (Neo4jCypherBuilder.isRelationshipEntity(meta)) {
      const results = await this.findRelationshipEntity(meta, where, { ...options, limit: 1 });
      return results[0] || null;
    }

    const populate = this.normalizePopulate(options.populate);
    const query = this.buildMatchWithPopulate(meta, { where, orderBy: options.orderBy as any, limit: 1 }, populate);
    const res = await this.connection.executeRaw(query.cypher, query.params, options.ctx);
    const record = res.records[0];
    if (!record) {
      return null;
    }
    return this.hydrateWithRelations(meta, record, populate);
  }

  override async count<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T> = {}): Promise<number> {
    const meta = this.metadata.find<T>(entityName)!;
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const pattern = new Cypher.Pattern(node, { labels });
    let query: any = new Cypher.Match(pattern);

    // Apply WHERE
    if (where && Object.keys(where).length > 0) {
      const whereClauses = this.buildWhereClauses(node, where);
      if (whereClauses.length > 0) {
        query = query.where(Cypher.and(...whereClauses));
      }
    }

    // Return count
    query = query.return([Cypher.count(node), 'total']);
    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    const rec = res.records[0];
    const total = rec?.get('total');
    return total?.toNumber ? total.toNumber() : Number(total ?? 0);
  }

  override async nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find<T>(entityName)!;

    // Check if this is a relationship entity (pivot entity with @RelationshipProperties)
    if (Neo4jCypherBuilder.isRelationshipEntity(meta)) {
      return this.insertRelationshipEntity(meta, data, options);
    }

    const payload = this.preparePayload(meta, data);
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const props: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload.nodeProps)) {
      props[key] = new Cypher.Param(value);
    }
    const pattern = new Cypher.Pattern(node, { labels, properties: props });
    const query = new Cypher.Create(pattern).return(node);
    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    // Get the node from the first key in the record (cypher-builder auto-generates names like 'this0')
    const resultNode = res.records[0].get(res.records[0].keys[0]);
    if (payload.relations.length) {
      await this.persistRelations(meta, resultNode.properties.id, payload.relations, options.ctx);
    }
    return this.transformResult(meta, resultNode.properties as EntityData<T>);
  }

  override async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    const rows: EntityData<T>[] = [];
    for (const row of data) {
      const res = await this.nativeInsert(entityName, row, options);
      rows.push(res as EntityData<T>);
    }
    return { affectedRows: rows.length, insertId: (rows[0] as any)?.id ?? 0, rows: rows as any[] } as QueryResult<T>;
  }

  override async nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find<T>(entityName)!;
    const payload = this.preparePayload(meta, data, true);
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const pattern = new Cypher.Pattern(node, { labels });
    let query: any = new Cypher.Match(pattern);

    const whereClauses = this.buildWhereClauses(node, where);
    if (whereClauses.length > 0) {
      query = query.where(Cypher.and(...whereClauses));
    }

    // Set individual properties to avoid overwriting the entire node
    if (Object.keys(payload.nodeProps).length > 0) {
      const setters = Object.entries(payload.nodeProps).map(([key, value]) =>
        [node.property(key), new Cypher.Param(value)],
      );
      query = query.set(...setters);
    }

    query = query.return(node);
    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    // Get the node from the first key in the record
    const resultNode = res.records[0]?.get(res.records[0]?.keys[0]);
    if (resultNode && payload.relations.length) {
      const idValue = this.convertNeo4jValue(resultNode.properties?.id);
      await this.persistRelations(meta, idValue, payload.relations, options.ctx, true);
    }
    return resultNode ? this.transformResult(meta, resultNode.properties as EntityData<T>) : { affectedRows: 0 } as any;
  }

  override async nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    const rows: EntityData<T>[] = [];
    for (let i = 0; i < where.length; i++) {
      const res = await this.nativeUpdate(entityName, where[i], data[i], options);
      if ((res as any)?.affectedRows !== 0) {
        rows.push(res as EntityData<T>);
      }
    }
    return { affectedRows: rows.length, insertId: 0 as any, rows: rows as any[] } as QueryResult<T>;
  }

  override async nativeDelete<T extends object>(entityName: string, where: FilterQuery<T>, options: DeleteOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find<T>(entityName)!;
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const pattern = new Cypher.Pattern(node, { labels });
    let query: any = new Cypher.Match(pattern);

    const whereClauses = this.buildWhereClauses(node, where);
    if (whereClauses.length > 0) {
      query = query.where(Cypher.and(...whereClauses));
    }

    query = query.detachDelete(node).return(Cypher.count(node));
    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    // Get the count from the first key in the record
    const total = res.records[0]?.get(res.records[0]?.keys[0]);
    return { affectedRows: total?.toNumber ? total.toNumber() : Number(total ?? 0) } as any;
  }

  override async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    const meta = this.metadata.find(entityName)!;
    const cypher = pipeline.join('\n');
    const res = await this.connection.executeRaw(cypher, {});
    return res.records.map((r: any) => this.convertNeo4jRecord(r.toObject()));
  }

  override async findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any, any, any>): Promise<EntityData<T>[]> {
    const meta = this.metadata.find<T>(entityName);
    if (!meta?.expression) {
      throw new Error(`Virtual entity ${entityName} is missing expression`);
    }

    const exprResult = typeof meta.expression === 'function'
      ? meta.expression(this.createEntityManager(), where as any, options as any)
      : meta.expression;

    const { cypher, params = {} } = typeof exprResult === 'string'
      ? { cypher: exprResult, params: {} }
      : (exprResult as { cypher: string; params?: Dictionary });
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    return res.records.map((r: any) => {
      const obj = r.get ? r.get('node') : r.toObject();
      const converted = this.convertNeo4jRecord(obj);
      return this.mapResult(converted, meta) as EntityData<T>;
    });
  }

  override async connect(): Promise<Neo4jConnection> {
    return super.connect();
  }

  override async reconnect(): Promise<Neo4jConnection> {
    return super.reconnect();
  }

  override async close(force?: boolean): Promise<void> {
    await super.close(force);
  }

  override getPlatform(): Neo4jPlatform {
    return this.platform as Neo4jPlatform;
  }

  override async syncCollections<T extends object, O extends object>(collections: Iterable<any>, options?: DriverMethodOptions): Promise<void> {
    // handled via nativeUpdate when collection owners change; nothing here for MVP
    return super.syncCollections(collections, options);
  }

  private async findRelationshipEntity<T extends object>(
    meta: EntityMetadata<T>,
    where: FilterQuery<T>,
    options: any,
  ): Promise<EntityData<T>[]> {
    const relType = Neo4jCypherBuilder.getRelationshipEntityType(meta);
    const [sourceProp, targetProp] = Neo4jCypherBuilder.getRelationshipEntityEnds(meta);

    const sourceLabels = sourceProp.targetMeta ? Neo4jCypherBuilder.getNodeLabels(sourceProp.targetMeta) : [sourceProp.type];
    const targetLabels = targetProp.targetMeta ? Neo4jCypherBuilder.getNodeLabels(targetProp.targetMeta) : [targetProp.type];

    const sourceNode = new Cypher.Node();
    const targetNode = new Cypher.Node();
    const rel = new Cypher.Relationship();

    const pattern = new Cypher.Pattern(sourceNode, { labels: sourceLabels })
      .related(rel, { type: relType })
      .to(targetNode, { labels: targetLabels });

    let query: any = new Cypher.Match(pattern);

    // Build WHERE clause for relationship properties
    if (where && Object.keys(where).length > 0) {
      const whereClauses = this.buildRelationshipWhereClauses(rel, where);
      if (whereClauses.length > 0) {
        query = query.where(Cypher.and(...whereClauses));
      }
    }

    // Handle populate
    const populate = this.normalizePopulate(options.populate);
    const shouldPopulateSource = populate?.includes(sourceProp.name);
    const shouldPopulateTarget = populate?.includes(targetProp.name);

    // Always return relationship and both nodes (for references)
    // When not populated, we'll extract just the ID to create a reference
    query = query.return(rel, sourceNode, targetNode);

    // Apply ORDER BY
    if (options.orderBy) {
      const orderClauses = this.buildRelationshipOrderClauses(rel, options.orderBy as any);
      if (orderClauses.length > 0) {
        query = query.orderBy(...orderClauses);
      }
    }

    // Apply SKIP and LIMIT
    if (options.offset != null) {
      query = query.skip(new Cypher.Param(options.offset));
    }
    if (options.limit != null) {
      query = query.limit(new Cypher.Param(options.limit));
    }

    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);

    return res.records.map((record: any) => {
      const relData = record.get(record.keys[0]);
      const sourceData = record.get(record.keys[1]);
      const targetData = record.get(record.keys[2]);

      const result: any = this.convertNeo4jRecord(relData.properties);

      // Add source node - either fully populated or just ID reference
      if (shouldPopulateSource && sourceData) {
        result[sourceProp.name] = this.mapResult(this.convertNeo4jRecord(sourceData.properties), sourceProp.targetMeta!) as any;
      } else if (sourceData) {
        // Create reference with just the ID
        const sourcePK = sourceProp.targetMeta!.getPrimaryProps()[0];
        const sourceProps = this.convertNeo4jRecord(sourceData.properties);
        result[sourceProp.name] = sourceProps[sourcePK.name];
      }

      // Add target node - either fully populated or just ID reference
      if (shouldPopulateTarget && targetData) {
        result[targetProp.name] = this.mapResult(this.convertNeo4jRecord(targetData.properties), targetProp.targetMeta!) as any;
      } else if (targetData) {
        // Create reference with just the ID
        const targetPK = targetProp.targetMeta!.getPrimaryProps()[0];
        const targetProps = this.convertNeo4jRecord(targetData.properties);
        result[targetProp.name] = targetProps[targetPK.name];
      }

      return this.mapResult(result as EntityDictionary<T>, meta) as EntityData<T>;
    });
  }

  private mapRecord<T extends object>(meta: EntityMetadata<T>, node: any): EntityData<T> {
    if (!node) {
      return null as any;
    }
    const props = node.properties ?? node;
    // Convert Neo4j types before mapping
    const converted = this.convertNeo4jRecord(props);
    return this.mapResult(converted, meta) as EntityData<T>;
  }

  private buildMatch<T extends object>(meta: EntityMetadata<T>, options: Neo4jQueryOptions<T>): { cypher: string; params: Dictionary } {
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const pattern = new Cypher.Pattern(node, { labels });
    // Return node with an alias so we can retrieve it later
    let query: any = new Cypher.Match(pattern).return([node, 'node']);

    // Apply WHERE
    if (options.where && Object.keys(options.where).length > 0) {
      const whereClauses = this.buildWhereClauses(node, options.where);
      if (whereClauses.length > 0) {
        query = query.where(Cypher.and(...whereClauses));
      }
    }

    // Apply ORDER BY
    if (options.orderBy) {
      const orderClauses = this.buildOrderClauses(node, options.orderBy);
      for (const orderClause of orderClauses) {
        query = query.orderBy(orderClause);
      }
    }

    // Apply SKIP and LIMIT
    if (options.offset != null) {
      query = query.skip(Math.floor(options.offset));
    }
    if (options.limit != null) {
      query = query.limit(Math.floor(options.limit));
    }

    const { cypher, params } = query.build();
    return { cypher, params };
  }

  private buildMatchWithPopulate<T extends object>(meta: EntityMetadata<T>, options: Neo4jQueryOptions<T>, populate?: readonly string[]): { cypher: string; params: Dictionary } {
    const labels = Neo4jCypherBuilder.getNodeLabels(meta);
    const node = new Cypher.Node();
    const pattern = new Cypher.Pattern(node, { labels });
    let query: any = new Cypher.Match(pattern);

    // Apply WHERE
    if (options.where && Object.keys(options.where).length > 0) {
      const whereClauses = this.buildWhereClauses(node, options.where);
      if (whereClauses.length > 0) {
        query = query.where(Cypher.and(...whereClauses));
      }
    }

    // Return node with 'node' alias for consistent retrieval
    const returnVars: any[] = [[node, 'node']];

    // Add OPTIONAL MATCH for each populated relationship
    if (populate && populate.length > 0) {
      for (const fieldName of populate) {
        const prop = meta.properties[fieldName as keyof typeof meta.properties];
        if (!prop) { continue; }

        const relType = Neo4jCypherBuilder.getRelationshipType(meta, prop);
        const direction = Neo4jCypherBuilder.getRelationshipDirection(meta.class, fieldName);

        if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE) {
          const targetLabels = prop.targetMeta ? Neo4jCypherBuilder.getNodeLabels(prop.targetMeta) : [prop.type];
          const targetNode = new Cypher.Node();
          const rel = new Cypher.Relationship();

          let relPattern;
          if (direction === 'OUT') {
            relPattern = new Cypher.Pattern(node).related(rel, { type: relType, direction: 'right' }).to(targetNode, { labels: targetLabels });
          } else if (direction === 'IN') {
            relPattern = new Cypher.Pattern(targetNode, { labels: targetLabels }).related(rel, { type: relType, direction: 'right' }).to(node);
          } else {
            relPattern = new Cypher.Pattern(node).related(rel, { type: relType }).to(targetNode, { labels: targetLabels });
          }

          query = query.optionalMatch(relPattern);
          // Return with alias matching what hydrateWithRelations expects
          returnVars.push([targetNode, `rel_${fieldName}`]);
        } else if (prop.kind === ReferenceKind.MANY_TO_MANY) {
          const targetLabels = prop.targetMeta ? Neo4jCypherBuilder.getNodeLabels(prop.targetMeta) : [prop.type];
          const targetNode = new Cypher.Node();
          const rel = new Cypher.Relationship();

          let relPattern;
          if (direction === 'OUT') {
            relPattern = new Cypher.Pattern(node).related(rel, { type: relType, direction: 'right' }).to(targetNode, { labels: targetLabels });
          } else if (direction === 'IN') {
            relPattern = new Cypher.Pattern(targetNode, { labels: targetLabels }).related(rel, { type: relType, direction: 'right' }).to(node);
          } else {
            relPattern = new Cypher.Pattern(node).related(rel, { type: relType }).to(targetNode, { labels: targetLabels });
          }

          query = query.optionalMatch(relPattern);

          if (prop.pivotEntity) {
            // With pivot: collect both target and relationship with alias
            returnVars.push([Cypher.collect(targetNode), `rel_${fieldName}`]);
            returnVars.push([Cypher.collect(rel), `relProps_${fieldName}`]);
          } else {
            // Without pivot: collect nodes with alias
            returnVars.push([Cypher.collect(targetNode), `rel_${fieldName}`]);
          }
        }
      }
    }

    query = query.return(...returnVars);

    // Apply ORDER BY
    if (options.orderBy) {
      const orderClauses = this.buildOrderClauses(node, options.orderBy);
      for (const orderClause of orderClauses) {
        query = query.orderBy(orderClause);
      }
    }

    // Apply SKIP and LIMIT
    if (options.offset != null) {
      query = query.skip(Math.floor(options.offset));
    }
    if (options.limit != null) {
      query = query.limit(Math.floor(options.limit));
    }

    const { cypher, params } = query.build();
    return { cypher, params };
  }

  private normalizePopulate(populate: any): string[] | undefined {
    if (!populate) {
      return undefined;
    }
    if (Array.isArray(populate)) {
      // Can be array of strings OR array of PopulateOptions objects
      return populate.map((p: any) => typeof p === 'string' ? p : p.field);
    }
    if (typeof populate === 'boolean') {
      return undefined; // true means populate all, but we'll skip for now
    }
    return undefined;
  }

  private hydrateWithRelations<T extends object>(meta: EntityMetadata<T>, record: any, populate?: readonly string[]): EntityData<T> {
    const node = record.get('node');
    const result = this.mapRecord(meta, node);

    if (populate && populate.length > 0) {
      for (const fieldName of populate) {
        const prop = meta.properties[fieldName as keyof typeof meta.properties];
        if (prop && (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE)) {
          try {
            const relAlias = `rel_${fieldName}`;
            const relNode = record.get(relAlias);
            if (relNode?.properties) {
              (result as any)[fieldName] = this.mapRecord(prop.targetMeta!, relNode);
            }
          } catch (e) {
            // Relation not found, leave as undefined
          }
        } else if (prop && prop.kind === ReferenceKind.MANY_TO_MANY) {
          try {
            const relAlias = `rel_${fieldName}`;
            const relData = record.get(relAlias);

            if (Array.isArray(relData) && relData.length > 0) {
              // Check if this uses pivot entity (relationship properties)
              if (prop.pivotEntity && relData[0]?.node) {
                // With pivot entity: array of {node: targetNode, rel: relationship}
                // We need to hydrate target entities, pivot entity support would require
                // additional work to merge relationship properties
                (result as any)[fieldName] = relData
                  .filter((item: any) => item?.node?.properties)
                  .map((item: any) => this.mapRecord(prop.targetMeta!, item.node));
              } else {
                // Without pivot entity: array of nodes
                (result as any)[fieldName] = relData
                  .filter((n: any) => n?.properties)
                  .map((n: any) => this.mapRecord(prop.targetMeta!, n));
              }
            } else {
              (result as any)[fieldName] = [];
            }
          } catch (e) {
            // Relation not found, leave as empty array
            (result as any)[fieldName] = [];
          }
        }
      }
    }

    return result;
  }


  private buildWhereClauses<T extends object>(node: Cypher.Node, where: FilterQuery<T>): Cypher.Predicate[] {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      return [];
    }

    const clauses: Cypher.Predicate[] = [];
    Object.entries(where as Dictionary).forEach(([key, value]) => {
      if (key === '$and' && Array.isArray(value)) {
        const nested = value.flatMap(v => this.buildWhereClauses(node, v as FilterQuery<T>));
        if (nested.length > 0) {
          const andClause = Cypher.and(...nested);
          if (andClause) {
            clauses.push(andClause);
          }
        }
        return;
      }
      if (key === '$or' && Array.isArray(value)) {
        const nested = value.flatMap(v => this.buildWhereClauses(node, v as FilterQuery<T>));
        if (nested.length > 0) {
          const orClause = Cypher.or(...nested);
          if (orClause) {
            clauses.push(orClause);
          }
        }
        return;
      }
      clauses.push(Cypher.eq(node.property(key), new Cypher.Param(value)));
    });

    return clauses;
  }

  private buildRelationshipWhereClauses<T extends object>(rel: Cypher.Relationship, where: FilterQuery<T>): Cypher.Predicate[] {
    const clauses: Cypher.Predicate[] = [];

    Object.entries(where).forEach(([key, value]) => {
      if (key === '$and' && Array.isArray(value)) {
        const nested = value.flatMap(v => this.buildRelationshipWhereClauses(rel, v as FilterQuery<T>));
        if (nested.length > 0) {
          const andClause = Cypher.and(...nested);
          if (andClause) {
            clauses.push(andClause);
          }
        }
        return;
      }
      if (key === '$or' && Array.isArray(value)) {
        const nested = value.flatMap(v => this.buildRelationshipWhereClauses(rel, v as FilterQuery<T>));
        if (nested.length > 0) {
          const orClause = Cypher.or(...nested);
          if (orClause) {
            clauses.push(orClause);
          }
        }
        return;
      }

      // Handle operators
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([op, opValue]) => {
          const prop = rel.property(key);
          switch (op) {
            case '$eq':
              clauses.push(Cypher.eq(prop, new Cypher.Param(opValue)));
              break;
            case '$ne':
              clauses.push(Cypher.neq(prop, new Cypher.Param(opValue)));
              break;
            case '$gt':
              clauses.push(Cypher.gt(prop, new Cypher.Param(opValue)));
              break;
            case '$gte':
              clauses.push(Cypher.gte(prop, new Cypher.Param(opValue)));
              break;
            case '$lt':
              clauses.push(Cypher.lt(prop, new Cypher.Param(opValue)));
              break;
            case '$lte':
              clauses.push(Cypher.lte(prop, new Cypher.Param(opValue)));
              break;
            default:
              clauses.push(Cypher.eq(prop, new Cypher.Param(opValue)));
          }
        });
      } else {
        clauses.push(Cypher.eq(rel.property(key), new Cypher.Param(value)));
      }
    });

    return clauses;
  }

  private buildRelationshipOrderClauses<T extends object>(rel: Cypher.Relationship, orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[]): any[] {
    if (!orderBy || (Array.isArray(orderBy) && orderBy.length === 0)) {
      return [];
    }
    const parts: any[] = [];
    const arr = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const item of arr) {
      Object.entries(item).forEach(([key, dir]) => {
        const direction = dir === 'ASC' || dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
        parts.push([rel.property(key as string), direction]);
      });
    }
    return parts;
  }

  private buildOrderClauses<T extends object>(node: Cypher.Node, orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[]): any[] {
    if (!orderBy || (Array.isArray(orderBy) && orderBy.length === 0)) {
      return [];
    }
    const parts: any[] = [];
    const arr = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const ob of arr) {
      Object.entries(ob as Dictionary).forEach(([field, dir]) => {
        const prop = node.property(field);
        // Create proper tuple for orderBy clause
        const sortItem = String(dir).toUpperCase() === 'DESC'
          ? ([prop, 'DESC'] as [any, 'DESC'])
          : ([prop, 'ASC'] as [any, 'ASC']);
        parts.push(sortItem);
      });
    }
    return parts;
  }

  private preparePayload<T extends object>(meta: EntityMetadata<T>, data: EntityDictionary<T>, partial = false): { nodeProps: Dictionary; relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; type: string; value: unknown }[] } {
    const nodeProps: Dictionary = {};
    const relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; type: string; value: unknown }[] = [];

    const pk = meta.getPrimaryProps()[0];
    const id = (data as Dictionary)[pk.name] ?? crypto.randomUUID();
    // Only include primary key for inserts, not updates
    if (!partial) {
      nodeProps[pk.name] = id;
    }

    const props = Object.values(meta.properties) as EntityProperty<T>[];
    for (const prop of props) {
      if (prop.primary) {
        continue;
      }

      if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE) {
        const val = (data as Dictionary)[prop.name];
        if (val !== undefined) {
          nodeProps[prop.name] = typeof val === 'object' && val !== null ? (val as any)[prop.targetMeta!.primaryKeys[0]] ?? val : val;
          // Get relationship metadata from WeakMap or fallback to custom property
          const relMetadata = getRelationshipMetadata(meta.class, prop.name);
          const relationship = relMetadata ?? (prop as any).custom?.relationship as { type?: string; direction?: 'IN' | 'OUT' } | undefined;
          const relType = relationship?.type ?? prop.name.toUpperCase();
          relations.push({ prop, target: prop.type, direction: relationship?.direction ?? 'OUT', type: relType, value: nodeProps[prop.name] });
        }
        continue;
      }

      if (prop.kind === ReferenceKind.MANY_TO_MANY) {
        const val = (data as Dictionary)[prop.name];
        // Handle both arrays and Collections
        const items = val instanceof Collection ? val.getItems() : (Array.isArray(val) ? val : []);
        if (items.length > 0) {
          // Get relationship metadata from WeakMap or fallback to custom property
          const relMetadata = getRelationshipMetadata(meta.class, prop.name);
          const relationship = relMetadata ?? (prop as any).custom?.relationship as { type?: string; direction?: 'IN' | 'OUT' } | undefined;
          const relType = relationship?.type ?? prop.name.toUpperCase();
          items.forEach((item: any) => {
            const idVal = typeof item === 'object' && item !== null ? item[prop.targetMeta!.primaryKeys[0]] ?? item : item;
            relations.push({ prop, target: prop.type, direction: relationship?.direction ?? 'OUT', type: relType, value: idVal });
          });
        }
        continue;
      }

      const val = (data as Dictionary)[prop.name];
      if (val !== undefined) {
        nodeProps[prop.name] = val;
      }
    }

    return { nodeProps, relations };
  }

  private async insertRelationshipEntity<T extends object>(meta: EntityMetadata<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>> {
    // A relationship entity connects two nodes and stores properties on the relationship
    const [sourceProp, targetProp] = Neo4jCypherBuilder.getRelationshipEntityEnds(meta);
    const sourceId = (data as any)[sourceProp.name]?.[sourceProp.targetMeta!.primaryKeys[0]] ?? (data as any)[sourceProp.name];
    const targetId = (data as any)[targetProp.name]?.[targetProp.targetMeta!.primaryKeys[0]] ?? (data as any)[targetProp.name];

    if (!sourceId || !targetId) {
      throw new Error(`Relationship entity ${meta.className} must have both source and target set`);
    }

    // Get relationship type from metadata or decorator
    const relType = Neo4jCypherBuilder.getRelationshipEntityType(meta);

    // Get relationship properties (all properties except the ManyToOne refs and primary key)
    const relProps: Dictionary = {};
    const pk = meta.getPrimaryProps()[0];
    const id = (data as Dictionary)[pk.name] ?? crypto.randomUUID();
    relProps[pk.name] = id;

    const props = Object.values(meta.properties) as EntityProperty<T>[];
    for (const prop of props) {
      if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.primary) {
        continue;
      }
      let val = (data as Dictionary)[prop.name];
      if (val !== undefined) {
        // If the property is an array type but val is a string, split it
        if (prop.type === 'ArrayType' && typeof val === 'string') {
          val = val.split(',');
        }
        relProps[prop.name] = val;
      }
    }

    // Create the relationship with properties using Pattern API
    const sourceLabels = sourceProp.targetMeta ? Neo4jCypherBuilder.getNodeLabels(sourceProp.targetMeta) : [sourceProp.type];
    const targetLabels = targetProp.targetMeta ? Neo4jCypherBuilder.getNodeLabels(targetProp.targetMeta) : [targetProp.type];

    const aNode = new Cypher.Node();
    const bNode = new Cypher.Node();
    const rel = new Cypher.Relationship();

    const aPattern = new Cypher.Pattern(aNode, { labels: sourceLabels });
    const bPattern = new Cypher.Pattern(bNode, { labels: targetLabels });

    // Match both nodes with combined WHERE clause
    let matchQuery: any = new Cypher.Match(aPattern);
    matchQuery = matchQuery.match(bPattern);
    matchQuery = matchQuery.where(Cypher.and(
      Cypher.eq(aNode.property('id'), new Cypher.Param(sourceId)),
      Cypher.eq(bNode.property('id'), new Cypher.Param(targetId)),
    ));

    const mergePattern = new Cypher.Pattern(aNode).related(rel, { type: relType }).to(bNode);

    const query = matchQuery
      .merge(mergePattern)
      .set([rel, new Cypher.Param(relProps)])
      .return(rel);

    const { cypher, params } = query.build();
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    // Get the relationship from the first key in the record
    const resultRel = res.records[0]?.get(res.records[0]?.keys[0]);

    if (!resultRel) {
      return { affectedRows: 0 } as any;
    }

    // Return the relationship properties as the result
    return this.transformResult(meta, { ...relProps, ...data } as EntityData<T>);
  }

  private async persistRelations<T extends object>(sourceMeta: EntityMetadata<T>, sourceId: string, relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; type: string; value: unknown }[], ctx?: Transaction, replace = false): Promise<void> {
    if (!relations.length) { return; }

    for (let i = 0; i < relations.length; i++) {
      const rel = relations[i];
      const type = rel.type;
      const sourceLabels = Neo4jCypherBuilder.getNodeLabels(sourceMeta);
      const targetLabels = rel.prop.targetMeta ? Neo4jCypherBuilder.getNodeLabels(rel.prop.targetMeta) : [rel.prop.type];
      const relDir = rel.direction ?? 'OUT';

      // Create/merge new relationship
      const aNode = new Cypher.Node();
      const bNode = new Cypher.Node();
      const newRel = new Cypher.Relationship();

      const aPattern = new Cypher.Pattern(aNode, { labels: sourceLabels });
      const bPattern = new Cypher.Pattern(bNode, { labels: targetLabels });
      const mergePattern = relDir === 'OUT'
        ? new Cypher.Pattern(aNode).related(newRel, { type }).to(bNode)
        : new Cypher.Pattern(bNode).related(newRel, { type }).to(aNode);

      // Build query: MATCH (a) MATCH (b:Label) WHERE a.id=$p1 AND b.id=$p2 MERGE (a)-[r:TYPE]->(b)
      const sourceIdParam = new Cypher.Param(sourceId);
      const targetIdParam = new Cypher.Param(rel.value);

      let createQuery: any = new Cypher.Match(aPattern);
      createQuery = createQuery.match(bPattern);
      createQuery = createQuery.where(Cypher.and(
        Cypher.eq(aNode.property('id'), sourceIdParam),
        Cypher.eq(bNode.property('id'), targetIdParam),
      ));
      createQuery = createQuery.merge(mergePattern).return(newRel);

      const { cypher: createCypher, params: createParams } = createQuery.build();
      await this.connection.executeRaw(createCypher, createParams, ctx);
    }
  }


  private convertNeo4jValue(value: any): any {
    // Convert Neo4j Integer objects to JavaScript numbers
    if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
      return value.toNumber ? value.toNumber() : Number(value.low);
    }
    return value;
  }

  private convertNeo4jRecord(record: any): any {
    const result: any = {};
    for (const key in record) {
      result[key] = this.convertNeo4jValue(record[key]);
    }
    return result;
  }

  private transformResult<T extends object>(meta: EntityMetadata<T>, node: any): QueryResult<T> {
    return this.mapResult(node as EntityDictionary<T>, meta) as unknown as QueryResult<T>;
  }

}
