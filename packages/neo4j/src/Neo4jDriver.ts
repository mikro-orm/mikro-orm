import crypto from 'node:crypto';
import {
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
  ReferenceKind,
} from '@mikro-orm/core';
import type { AnyEntity } from '@mikro-orm/core';
import { Dictionary } from '@mikro-orm/core';
import { Neo4jConnection } from './Neo4jConnection';
import { Neo4jPlatform } from './Neo4jPlatform';
import { Neo4jEntityManager } from './Neo4jEntityManager';

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
    const query = this.buildMatch(meta, { where, orderBy: options.orderBy as any, limit: options.limit, offset: options.offset });
    const res = await this.connection.execute(query.cypher, query.params);
    return res.records.map((r: any) => this.mapRecord(meta, r.get('node')));
  }

  override async findOne<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T, P, F, E> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    const meta = this.metadata.find<T>(entityName)!;
    const query = this.buildMatch(meta, { where, orderBy: options.orderBy as any, limit: 1 });
    const res = await this.connection.execute(query.cypher, query.params);
    const record = res.records[0];
    if (!record) {
      return null;
    }
    return this.mapRecord(meta, record.get('node'));
  }

  override async count<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T> = {}): Promise<number> {
    const meta = this.metadata.find<T>(entityName)!;
    const query = this.buildMatch(meta, { where });
    const cypher = query.cypher.replace('RETURN node', 'RETURN count(node) as total');
    const res = await this.connection.execute(cypher, query.params);
    const rec = res.records[0];
    return rec?.get('total').toNumber ? rec.get('total').toNumber() : Number(rec?.get('total') ?? 0);
  }

  override async nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find<T>(entityName)!;
    const payload = this.preparePayload(meta, data);
    const props = this.formatProps(payload.nodeProps);
    const cypher = `CREATE (node:${meta.collection} ${props}) RETURN node`;
    const res = await this.connection.execute(cypher, payload.params);
    const node = res.records[0].get('node');
    if (payload.relations.length) {
      await this.persistRelations(node.properties.id, payload.relations);
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
    const cypher = `MATCH (node:${meta.collection}) ${whereQuery.where} SET node += $props RETURN node`;
    const params = { ...whereQuery.params, props: payload.nodeProps };
    const res = await this.connection.execute(cypher, params);
    const node = res.records[0]?.get('node');
    if (node && payload.relations.length) {
      await this.persistRelations(node.properties.id, payload.relations, true);
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
    const cypher = `MATCH (node:${meta.collection}) ${whereQuery.where} DETACH DELETE node RETURN count(*) as total`;
    const res = await this.connection.execute(cypher, whereQuery.params);
    const total = res.records[0]?.get('total');
    return { affectedRows: total?.toNumber ? total.toNumber() : Number(total ?? 0) } as any;
  }

  override async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    const meta = this.metadata.find(entityName)!;
    const cypher = pipeline.join('\n');
    const res = await this.connection.execute(cypher, {});
    return res.records.map((r: any) => this.mapRecord(meta, r.toObject()));
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
    const res = await this.connection.execute(cypher, params);
    return res.records.map((r: any) => this.mapRecord(meta, r.toObject()));
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
    if (options.limit != null) params.limit = options.limit;
    if (options.offset != null) params.offset = options.offset;
    const cypher = `MATCH (node:${meta.collection}) ${where.where} RETURN node ${order} ${offset} ${limit}`.trim();
    return { cypher, params };
  }

  private buildWhere<T extends object>(where: FilterQuery<T>): { where: string; params: Dictionary } {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      return { where: '', params: {} };
    }

    const clauses: string[] = [];
    const params: Dictionary = {};
    Object.entries(where as Dictionary).forEach(([key, value], idx) => {
      const paramKey = `w_${idx}`;
      if (key === '$and' && Array.isArray(value)) {
        const nested = value.map(v => this.buildWhere(v as FilterQuery<T>));
        clauses.push('(' + nested.map(n => n.where.replace(/^WHERE\s+/, '')).join(' AND ') + ')');
        Object.assign(params, ...nested.map(n => n.params));
        return;
      }
      if (key === '$or' && Array.isArray(value)) {
        const nested = value.map(v => this.buildWhere(v as FilterQuery<T>));
        clauses.push('(' + nested.map(n => n.where.replace(/^WHERE\s+/, '')).join(' OR ') + ')');
        Object.assign(params, ...nested.map(n => n.params));
        return;
      }
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

  private preparePayload<T extends object>(meta: EntityMetadata<T>, data: EntityDictionary<T>, partial = false): { nodeProps: Dictionary; relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; value: unknown }[]; params: Dictionary } {
    const nodeProps: Dictionary = {};
    const relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; value: unknown }[] = [];

    const pk = meta.getPrimaryProps()[0];
    const id = (data as Dictionary)[pk.name] ?? crypto.randomUUID();
    nodeProps[pk.name] = id;

    const props = Object.values(meta.properties) as EntityProperty<T>[];
    for (const prop of props) {
      if (prop.primary) {
        continue;
      }

      if (prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE) {
        const val = (data as Dictionary)[prop.name];
        if (val !== undefined) {
          nodeProps[prop.name] = typeof val === 'object' && val !== null ? (val as any)[prop.targetMeta!.primaryKeys[0]] ?? val : val;
          const relationship = (prop as any).custom?.relationship as { type?: string; direction?: 'IN' | 'OUT' } | undefined;
          relations.push({ prop, target: prop.type, direction: relationship?.direction ?? 'OUT', value: nodeProps[prop.name] });
        }
        continue;
      }

      if (prop.kind === ReferenceKind.MANY_TO_MANY) {
        const val = (data as Dictionary)[prop.name];
        if (Array.isArray(val)) {
          const relationship = (prop as any).custom?.relationship as { type?: string; direction?: 'IN' | 'OUT' } | undefined;
          val.forEach((item: any) => {
            const idVal = typeof item === 'object' && item !== null ? item[prop.targetMeta!.primaryKeys[0]] ?? item : item;
            relations.push({ prop, target: prop.type, direction: relationship?.direction ?? 'OUT', value: idVal });
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

  private async persistRelations<T extends object>(sourceId: string, relations: { prop: EntityProperty<T>; target: EntityName<AnyEntity> | string; direction: 'IN' | 'OUT'; value: unknown }[], replace = false): Promise<void> {
    if (!relations.length) return;

    for (const rel of relations) {
      const type = (rel.prop as any).custom?.relationship?.type ?? rel.prop.name.toUpperCase();
      const targetLabel = rel.prop.targetMeta?.collection ?? rel.prop.type;
      const relDir = rel.direction ?? 'OUT';
      const base = relDir === 'OUT'
        ? 'MATCH (a {id: $aId}), (b:' + targetLabel + ' {id: $bId})'
        : 'MATCH (b {id: $aId}), (a:' + targetLabel + ' {id: $bId})';

      const deleteExisting = replace ? `${base} OPTIONAL MATCH (a)-[r:${type}]->(b) DELETE r` : '';
      const create = `${base} MERGE ${relDir === 'OUT' ? '(a)-[r:' + type + ']->(b)' : '(a)<-[r:' + type + ']-(b)'}`;
      const cypher = [deleteExisting, create].filter(Boolean).join('\n');
      await this.connection.execute(cypher, { aId: sourceId, bId: rel.value });
    }
  }

  private formatProps(props: Dictionary): string {
    const keys = Object.keys(props);
    const assignments = keys.map(k => `${k}: $props.${k}`);
    return `{ ${assignments.join(', ')} }`;
  }

  private transformResult<T extends object>(meta: EntityMetadata<T>, node: any): QueryResult<T> {
    return this.mapResult(node as EntityDictionary<T>, meta) as unknown as QueryResult<T>;
  }

}
