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
type  AnyEntity  } from '@mikro-orm/core';
import { Neo4jConnection } from './Neo4jConnection';
import { Neo4jPlatform } from './Neo4jPlatform';
import { Neo4jEntityManager } from './Neo4jEntityManager';
import { getRelationshipMetadata } from './decorators';

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

    const populate = this.normalizePopulate(options.populate);
    const query = this.buildMatchWithPopulate(meta, { where, orderBy: options.orderBy as any, limit: options.limit, offset: options.offset }, populate);
    const res = await this.connection.executeRaw(query.cypher, query.params, options.ctx);
    return res.records.map((r: any) => this.hydrateWithRelations(meta, r, populate));
  }

  override async findOne<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T, P, F, E> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    const meta = this.metadata.find<T>(entityName)!;
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
    const query = this.buildMatch(meta, { where });
    const cypher = query.cypher.replace('RETURN node', 'RETURN count(node) as total');
    const res = await this.connection.executeRaw(cypher, query.params, options.ctx);
    const rec = res.records[0];
    return rec?.get('total').toNumber ? rec.get('total').toNumber() : Number(rec?.get('total') ?? 0);
  }

  override async nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find<T>(entityName)!;

    // Check if this is a relationship entity (pivot entity with @RelationshipProperties)
    if ((meta as any).neo4jRelationshipEntity) {
      return this.insertRelationshipEntity(meta, data, options);
    }

    const payload = this.preparePayload(meta, data);
    const props = this.formatProps(payload.nodeProps);
    const labels = this.getNodeLabels(meta);
    const cypher = `CREATE (node${labels} ${props}) RETURN node`;
    const res = await this.connection.executeRaw(cypher, payload.params, options.ctx);
    const node = res.records[0].get('node');
    if (payload.relations.length) {
      await this.persistRelations(node.properties.id, payload.relations, options.ctx);
    }
    return this.transformResult(meta, node.properties as EntityData<T>);
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
    const whereQuery = this.buildWhere(where);
    const labels = this.getNodeLabels(meta);
    const cypher = `MATCH (node${labels}) ${whereQuery.where} SET node += $props RETURN node`;
    const params = { ...whereQuery.params, props: payload.nodeProps };
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    const node = res.records[0]?.get('node');
    if (node && payload.relations.length) {
      await this.persistRelations(node.properties.id, payload.relations, options.ctx, true);
    }
    return node ? this.transformResult(meta, node.properties as EntityData<T>) : { affectedRows: 0 } as any;
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
    const whereQuery = this.buildWhere(where);
    const labels = this.getNodeLabels(meta);
    const cypher = `MATCH (node${labels}) ${whereQuery.where} DETACH DELETE node RETURN count(*) as total`;
    const res = await this.connection.executeRaw(cypher, whereQuery.params, options.ctx);
    const total = res.records[0]?.get('total');
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

  private mapRecord<T extends object>(meta: EntityMetadata<T>, node: any): EntityData<T> {
    if (!node) {
      return null as any;
    }
    const props = node.properties ?? node;
    return this.mapResult(props, meta) as EntityData<T>;
  }

  private buildMatch<T extends object>(meta: EntityMetadata<T>, options: Neo4jQueryOptions<T>): { cypher: string; params: Dictionary } {
    const where = this.buildWhere(options.where ?? {});
    const order = this.buildOrderBy(options.orderBy);
    const limit = options.limit ? 'LIMIT $limit' : '';
    const offset = options.offset ? 'SKIP $offset' : '';
    const params: Dictionary = { ...where.params };
    // Neo4j requires limit and offset to be integers, not floats
    if (options.limit != null) { params.limit = Math.floor(options.limit); }
    if (options.offset != null) { params.offset = Math.floor(options.offset); }
    const labels = this.getNodeLabels(meta);
    const cypher = `MATCH (node${labels}) ${where.where} RETURN node ${order} ${offset} ${limit}`.trim();
    return { cypher, params };
  }

  private buildMatchWithPopulate<T extends object>(meta: EntityMetadata<T>, options: Neo4jQueryOptions<T>, populate?: readonly string[]): { cypher: string; params: Dictionary } {
    const where = this.buildWhere(options.where ?? {});
    const order = this.buildOrderBy(options.orderBy);
    const limit = options.limit ? 'LIMIT $limit' : '';
    const offset = options.offset ? 'SKIP $offset' : '';
    const params: Dictionary = { ...where.params };
    if (options.limit != null) { params.limit = Math.floor(options.limit); }
    if (options.offset != null) { params.offset = Math.floor(options.offset); }

    const labels = this.getNodeLabels(meta);
    let cypher = `MATCH (node${labels}) ${where.where}`.trim();
    const returnParts = ['node'];

    // Add OPTIONAL MATCH for each populated relationship
    if (populate && populate.length > 0) {
      for (const fieldName of populate) {
        const prop = meta.properties[fieldName as keyof typeof meta.properties];

        // Get relationship metadata from WeakMap
        const relMetadata = getRelationshipMetadata(meta.class, fieldName);
        const relType = relMetadata?.type ?? (prop as any).custom?.relationship?.type ?? fieldName.toUpperCase();
        const direction = relMetadata?.direction ?? (prop as any).custom?.relationship?.direction ?? 'OUT';

        if (prop && (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE)) {
          const targetLabel = prop.targetMeta?.collection ?? prop.type;
          const relAlias = `rel_${fieldName}`;
          const arrow = direction === 'OUT' ? '->' : direction === 'IN' ? '<-' : '-';
          cypher += ` OPTIONAL MATCH (node)${arrow === '<-' ? '<' : ''}-[:${relType}]-${arrow === '->' ? '>' : ''}(${relAlias}:${targetLabel})`;
          returnParts.push(relAlias);
        } else if (prop && prop.kind === ReferenceKind.MANY_TO_MANY) {
          const targetLabel = prop.targetMeta?.collection ?? prop.type;
          const relAlias = `rel_${fieldName}`;
          const relVarAlias = `r_${fieldName}`;
          const arrow = direction === 'OUT' ? '->' : direction === 'IN' ? '<-' : '-';

          // Check if this M:N uses a pivot entity (relationship properties)
          if (prop.pivotEntity) {
            // With pivot entity, we need to capture both the target node AND the relationship
            // For Actor -> Movie via ActedIn: (node)-[r:ACTED_IN]->(target)
            // The relationship 'r' contains the pivot entity properties (roles, etc.)
            cypher += ` OPTIONAL MATCH (node)${arrow === '<-' ? '<' : ''}-[${relVarAlias}:${relType}]-${arrow === '->' ? '>' : ''}(${relAlias}:${targetLabel})`;
            // Return both the target nodes and the relationships as collections
            returnParts.push(`collect({node: ${relAlias}, rel: ${relVarAlias}}) as ${relAlias}`);
          } else {
            // Without pivot entity, standard M:N
            cypher += ` OPTIONAL MATCH (node)${arrow === '<-' ? '<' : ''}-[:${relType}]-${arrow === '->' ? '>' : ''}(${relAlias}:${targetLabel})`;
            returnParts.push(`collect(${relAlias}) as ${relAlias}`);
          }
        }
      }
    }

    cypher = `${cypher} RETURN ${returnParts.join(', ')} ${order} ${offset} ${limit}`.trim();
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

  private paramCounter = 0;

  private buildWhere<T extends object>(where: FilterQuery<T>, resetCounter = true): { where: string; params: Dictionary } {
    if (resetCounter) {
      this.paramCounter = 0;
    }

    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      return { where: '', params: {} };
    }

    const clauses: string[] = [];
    const params: Dictionary = {};
    Object.entries(where as Dictionary).forEach(([key, value]) => {
      if (key === '$and' && Array.isArray(value)) {
        const nested = value.map(v => this.buildWhere(v as FilterQuery<T>, false));
        const innerClauses = nested.map(n => n.where.replace(/^WHERE\s+/, '')).filter(Boolean);
        if (innerClauses.length > 0) {
          clauses.push('(' + innerClauses.join(' AND ') + ')');
        }
        Object.assign(params, ...nested.map(n => n.params));
        return;
      }
      if (key === '$or' && Array.isArray(value)) {
        const nested = value.map(v => this.buildWhere(v as FilterQuery<T>, false));
        const innerClauses = nested.map(n => n.where.replace(/^WHERE\s+/, '')).filter(Boolean);
        if (innerClauses.length > 0) {
          clauses.push('(' + innerClauses.join(' OR ') + ')');
        }
        Object.assign(params, ...nested.map(n => n.params));
        return;
      }
      const paramKey = `w_${this.paramCounter++}`;
      clauses.push(`node.${key} = $${paramKey}`);
      params[paramKey] = value;
    });

    return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
  }

  private buildOrderBy<T extends object>(orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[]): string {
    if (!orderBy || (Array.isArray(orderBy) && orderBy.length === 0)) {
      return '';
    }
    const parts: string[] = [];
    const arr = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const ob of arr) {
      Object.entries(ob as Dictionary).forEach(([field, dir]) => {
        parts.push(`node.${field} ${String(dir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`);
      });
    }
    return parts.length ? 'ORDER BY ' + parts.join(', ') : '';
  }

  private preparePayload<T extends object>(meta: EntityMetadata<T>, data: EntityDictionary<T>, partial = false): { nodeProps: Dictionary; relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; type: string; value: unknown }[]; params: Dictionary } {
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
        if (Array.isArray(val)) {
          // Get relationship metadata from WeakMap or fallback to custom property
          const relMetadata = getRelationshipMetadata(meta.class, prop.name);
          const relationship = relMetadata ?? (prop as any).custom?.relationship as { type?: string; direction?: 'IN' | 'OUT' } | undefined;
          const relType = relationship?.type ?? prop.name.toUpperCase();
          val.forEach((item: any) => {
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

    return { nodeProps, relations, params: { props: nodeProps } };
  }

  private async insertRelationshipEntity<T extends object>(meta: EntityMetadata<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>> {
    // A relationship entity connects two nodes and stores properties on the relationship
    // Find the two @ManyToOne properties (source and target nodes)
    const props = Object.values(meta.properties) as EntityProperty<T>[];
    const manyToOneProps = props.filter(p => p.kind === ReferenceKind.MANY_TO_ONE);

    if (manyToOneProps.length !== 2) {
      throw new Error(`Relationship entity ${meta.className} must have exactly 2 @ManyToOne properties`);
    }

    const [sourceProp, targetProp] = manyToOneProps;
    const sourceId = (data as any)[sourceProp.name]?.[sourceProp.targetMeta!.primaryKeys[0]] ?? (data as any)[sourceProp.name];
    const targetId = (data as any)[targetProp.name]?.[targetProp.targetMeta!.primaryKeys[0]] ?? (data as any)[targetProp.name];

    if (!sourceId || !targetId) {
      throw new Error(`Relationship entity ${meta.className} must have both source and target set`);
    }

    // Get relationship type from metadata or decorator
    const relType = (meta as any).neo4jRelationshipType ?? meta.className.toUpperCase();

    // Get relationship properties (all properties except the ManyToOne refs and primary key)
    const relProps: Dictionary = {};
    const pk = meta.getPrimaryProps()[0];
    const id = (data as Dictionary)[pk.name] ?? crypto.randomUUID();
    relProps[pk.name] = id;

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

    // Create the relationship with properties
    const sourceLabel = sourceProp.targetMeta?.collection ?? sourceProp.type;
    const targetLabel = targetProp.targetMeta?.collection ?? targetProp.type;

    // For relationship properties, we need to use SET instead of inline properties
    // to properly handle arrays and other complex types
    const cypher = `
      MATCH (a:${sourceLabel} {id: $sourceId}), (b:${targetLabel} {id: $targetId})
      MERGE (a)-[r:${relType}]->(b)
      SET r = $props
      RETURN r
    `.trim();

    // Pass properties as a single object parameter
    const params: Dictionary = { sourceId, targetId, props: relProps };
    const res = await this.connection.executeRaw(cypher, params, options.ctx);
    const rel = res.records[0]?.get('r');

    if (!rel) {
      return { affectedRows: 0 } as any;
    }

    // Return the relationship properties as the result
    return this.transformResult(meta, { ...relProps, ...data } as EntityData<T>);
  }

  private async persistRelations<T extends object>(sourceId: string, relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; type: string; value: unknown }[], ctx?: Transaction, replace = false): Promise<void> {
    if (!relations.length) { return; }

    for (const rel of relations) {
      const type = rel.type;
      const targetLabel = rel.prop.targetMeta?.collection ?? rel.prop.type;
      const relDir = rel.direction ?? 'OUT';
      const base = relDir === 'OUT'
        ? 'MATCH (a {id: $aId}), (b:' + targetLabel + ' {id: $bId})'
        : 'MATCH (b {id: $aId}), (a:' + targetLabel + ' {id: $bId})';

      // Delete existing relationship if replace=true (use separate variable name 'r1')
      if (replace) {
        const deleteCypher = `${base} OPTIONAL MATCH (a)-[r1:${type}]->(b) DELETE r1`;
        await this.connection.executeRaw(deleteCypher, { aId: sourceId, bId: rel.value }, ctx);
      }

      // Create/merge new relationship
      const createCypher = `${base} MERGE ${relDir === 'OUT' ? '(a)-[r:' + type + ']->(b)' : '(a)<-[r:' + type + ']-(b)'}`;
      await this.connection.executeRaw(createCypher, { aId: sourceId, bId: rel.value }, ctx);
    }
  }

  private formatProps(props: Dictionary): string {
    const keys = Object.keys(props);
    const assignments = keys.map(k => `${k}: $props.${k}`);
    return `{ ${assignments.join(', ')} }`;
  }

  private getNodeLabels<T extends object>(meta: EntityMetadata<T>): string {
    const labels = [meta.collection];
    const additionalLabels = (meta as any).neo4jLabels;
    if (additionalLabels && Array.isArray(additionalLabels)) {
      labels.push(...additionalLabels);
    }
    return ':' + labels.join(':');
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
