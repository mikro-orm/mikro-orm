import { QueryBuilder as KnexQueryBuilder, Raw, Transaction as KnexTransaction, Value } from 'knex';
import {
  AnyEntity, Collection, Configuration, Constructor, DatabaseDriver, Dictionary, EntityData, EntityManager, EntityManagerType, EntityMetadata, EntityProperty,
  FilterQuery, FindOneOptions, FindOptions, IDatabaseDriver, LockMode, Primary, QueryOrderMap, QueryResult, ReferenceType, Transaction, Utils, PopulateOptions, LoadStrategy,
} from '@mikro-orm/core';
import { AbstractSqlConnection, AbstractSqlPlatform, Field, QueryBuilder } from './index';
import { SqlEntityManager } from './SqlEntityManager';

export abstract class AbstractSqlDriver<C extends AbstractSqlConnection = AbstractSqlConnection> extends DatabaseDriver<C> {

  [EntityManagerType]: SqlEntityManager<this>;

  protected readonly connection: C;
  protected readonly replicas: C[] = [];
  protected readonly platform: AbstractSqlPlatform;

  protected constructor(config: Configuration, platform: AbstractSqlPlatform, connection: Constructor<C>, connector: string[]) {
    super(config, connector);
    this.connection = new connection(this.config);
    this.replicas = this.createReplicas(conf => new connection(this.config, conf, 'read'));
    this.platform = platform;
  }

  getPlatform(): AbstractSqlPlatform {
    return this.platform;
  }

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new SqlEntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOptions<T> = {}, ctx?: Transaction<KnexTransaction>): Promise<T[]> {
    options = { populate: [], orderBy: {}, ...options };
    const meta = this.metadata.find<T>(entityName)!;
    const populate = this.autoJoinOneToOneOwner(meta, options.populate as PopulateOptions<T>[]);
    const joinedProps = this.joinedProps(meta, populate);
    const qb = this.createQueryBuilder<T>(entityName, ctx, !!ctx);
    const fields = this.buildFields(meta, populate, joinedProps, qb, options.fields);
    const pk = meta.primaryKeys[0];

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where } as FilterQuery<T>;
    }

    qb.select(fields)
      .populate(populate)
      .where(where)
      .orderBy(options.orderBy!)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .withSchema(options.schema);

    if (options.limit !== undefined) {
      qb.limit(options.limit, options.offset);
    }

    Utils.asArray(options.flags).forEach(flag => qb.setFlag(flag));
    const result = await this.rethrow(qb.execute('all'));

    if (joinedProps.length > 0) {
      return this.mergeJoinedResult(result, meta);
    }

    return result;
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T>, ctx?: Transaction<KnexTransaction>): Promise<T | null> {
    const opts = { populate: [], ...(options || {}) } as FindOptions<T>;
    const meta = this.metadata.find(entityName)!;
    const populate = this.autoJoinOneToOneOwner(meta, opts.populate as PopulateOptions<T>[]);
    const joinedProps = this.joinedProps(meta, populate);

    if (joinedProps.length === 0) {
      opts.limit = 1;
    }

    const res = await this.find<T>(entityName, where, opts, ctx);

    return res[0] || null;
  }

  mapResult<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[] = [], qb?: QueryBuilder<T>, map: Dictionary = {}): T | null {
    const ret = super.mapResult(result, meta);

    if (!ret) {
      return null;
    }

    if (qb) {
      this.mapJoinedProps<T>(ret, meta, populate, qb, ret, map);
    }

    return ret as T;
  }

  private mapJoinedProps<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], qb: QueryBuilder<T>, root: EntityData<T>, map: Dictionary, parentJoinPath?: string) {
    const joinedProps = this.joinedProps(meta, populate);

    joinedProps.forEach(p => {
      const relation = meta.properties[p.field as keyof T & string];
      const meta2 = this.metadata.find(relation.type)!;
      const path = parentJoinPath ? `${parentJoinPath}.${relation.name}` : `${meta.name}.${relation.name}`;
      const relationAlias = qb.getAliasForJoinPath(path);
      const relationPojo = {};

      // If the primary key value for the relation is null, we know we haven't joined to anything
      // and therefore we don't return any record (since all values would be null)
      const hasPK = meta2.primaryKeys.every(pk => meta2.properties[pk].fieldNames.every(name => {
        return Utils.isDefined(root![`${relationAlias}_${name}`], true);
      }));

      if (!hasPK) {
        return;
      }

      Object.values(meta2.properties)
        .filter(prop => this.shouldHaveColumn(prop, populate))
        .forEach(prop => {
          if (prop.fieldNames.length > 1) { // composite keys
            relationPojo[prop.name] = prop.fieldNames.map(name => root![`${relationAlias}_${name}`]);
            prop.fieldNames.map(name => delete root![`${relationAlias}_${name}`]);
          } else {
            const alias = `${relationAlias}_${prop.fieldNames[0]}`;
            relationPojo[prop.name] = root![alias];
            delete root![alias];
          }
        });

      const key = `${meta.name}-${(Utils.getCompositeKeyHash(result as T, meta))}`;

      if (map[key]) {
        result[relation.name] = map[key][relation.name];
      } else {
        map[key] = result;
        result[relation.name] = result[relation.name] || [];
      }

      if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(relation.reference)) {
        this.appendToCollection(meta2, result[relation.name], relationPojo);
      } else {
        result[relation.name] = relationPojo;
      }

      const populateChildren = p.children || [];
      this.mapJoinedProps(relationPojo, meta2, populateChildren, qb, root, map, path);
    });
  }

  private appendToCollection<T extends AnyEntity<T>>(meta: EntityMetadata<T>, collection: EntityData<T>[], relationPojo: EntityData<T>): void {
    if (collection.length === 0) {
      return void collection.push(relationPojo);
    }

    const last = collection[collection.length - 1];
    const pk1 = Utils.getCompositeKeyHash(last as T, meta);
    const pk2 = Utils.getCompositeKeyHash(relationPojo as T, meta);

    if (pk1 !== pk2) {
      collection.push(relationPojo);
    }
  }

  async count(entityName: string, where: any, ctx?: Transaction<KnexTransaction>): Promise<number> {
    const pks = this.metadata.find(entityName)!.primaryKeys;
    const qb = this.createQueryBuilder(entityName, ctx, !!ctx)
      .count(pks, true)
      .where(where);
    const res = await this.rethrow(qb.execute('get', false));

    return +res.count;
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const meta = this.metadata.find<T>(entityName);
    const collections = this.extractManyToMany(entityName, data);
    const pks = this.getPrimaryKeyFields(entityName);
    const qb = this.createQueryBuilder(entityName, ctx, true);
    const res = await this.rethrow(qb.insert(data).execute('run', false));
    res.row = res.row || {};
    let pk: any;

    if (pks.length > 1) { // owner has composite pk
      pk = Utils.getPrimaryKeyCond(data as T, pks);
    } else {
      res.insertId = data[pks[0]] || res.insertId || res.row[pks[0]];
      pk = [res.insertId];
    }

    await this.processManyToMany<T>(meta, pk, collections, false, ctx);

    return res;
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>[], ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const meta = this.metadata.find<T>(entityName);
    const collections = data.map(d => this.extractManyToMany(entityName, d));
    const pks = this.getPrimaryKeyFields(entityName);
    const qb = this.createQueryBuilder(entityName, ctx, true);
    const res = await this.rethrow(qb.insert(data).execute('run', false));
    let pk: any[];

    /* istanbul ignore next  */
    if (pks.length > 1) { // owner has composite pk
      pk = data.map(d => Utils.getPrimaryKeyCond(d as T, pks));
    } else {
      pk = data.map((d, i) => d[pks[0]] ?? res.rows[i]?.[pks[0]]).map(d => [d]);
      res.insertId = res.insertId || res.row[pks[0]];
    }

    for (let i = 0; i < collections.length; i++) {
      await this.processManyToMany<T>(meta, pk[i], collections[i], false, ctx);
    }

    return res;
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const meta = this.metadata.find<T>(entityName);
    const pks = this.getPrimaryKeyFields(entityName);
    const collections = this.extractManyToMany(entityName, data);
    let res: QueryResult = { affectedRows: 0, insertId: 0, row: {} };

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where } as FilterQuery<T>;
    }

    if (Object.keys(data).length > 0) {
      const qb = this.createQueryBuilder<T>(entityName, ctx, true)
        .update(data)
        .where(where);

      res = await this.rethrow(qb.execute('run', false));
    }

    const pk = pks.map(pk => Utils.extractPK<T>(data[pk] || where, meta)!);
    await this.processManyToMany<T>(meta, pk, collections, true, ctx);

    return res;
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T> | string | any, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const pks = this.getPrimaryKeyFields(entityName);

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where };
    }

    const qb = this.createQueryBuilder(entityName, ctx, true).delete(where);

    return this.rethrow(qb.execute('run', false));
  }

  async syncCollection<T extends AnyEntity<T>, O extends AnyEntity<O>>(coll: Collection<T, O>, ctx?: Transaction): Promise<void> {
    const wrapped = coll.owner.__helper!;
    const meta = wrapped.__meta;
    const pks = wrapped.__primaryKeys;
    const snap = coll.getSnapshot();
    const includes = <T>(arr: T[], item: T) => !!arr.find(i => Utils.equals(i, item));
    const snapshot = snap ? snap.map(item => item.__helper!.__primaryKeys) : [];
    const current = coll.getItems(false).map(item => item.__helper!.__primaryKeys);
    const deleteDiff = snap ? snapshot.filter(item => !includes(current, item)) : true;
    const insertDiff = current.filter(item => !includes(snapshot, item));
    const target = snapshot.filter(item => includes(current, item)).concat(...insertDiff);
    const equals = Utils.equals(current, target);

    // wrong order if we just delete and insert to the end (only owning sides can have fixed order)
    if (coll.property.owner && coll.property.fixedOrder && !equals && Array.isArray(deleteDiff)) {
      deleteDiff.length = insertDiff.length = 0;
      deleteDiff.push(...snapshot);
      insertDiff.push(...current);
    }

    if (coll.property.reference === ReferenceType.ONE_TO_MANY) {
      const cols = coll.property.referencedColumnNames;
      const qb = this.createQueryBuilder(coll.property.type, ctx, true)
        .update({ [coll.property.mappedBy]: pks })
        .getKnexQuery()
        .whereIn(cols, insertDiff as string[][]);

      return this.rethrow(qb);
    }

    return this.rethrow(this.updateCollectionDiff<T, O>(meta, coll.property, pks, deleteDiff, insertDiff, ctx));
  }

  async loadFromPivotTable<T extends AnyEntity<T>, O extends AnyEntity<O>>(prop: EntityProperty, owners: Primary<O>[][], where: FilterQuery<T> = {}, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Dictionary<T[]>> {
    const pivotProp2 = this.getPivotInverseProperty(prop);
    const ownerMeta = this.metadata.find(pivotProp2.type)!;
    const targetMeta = this.metadata.find(prop.type)!;
    const cond = { [`${prop.pivotTable}.${pivotProp2.name}`]: { $in: ownerMeta.compositePK ? owners : owners.map(o => o[0]) } };

    if (!Utils.isEmpty(where) && Object.keys(where as Dictionary).every(k => Utils.isOperator(k, false))) {
      where = cond;
    } else {
      where = { ...(where as Dictionary), ...cond };
    }

    orderBy = this.getPivotOrderBy(prop, orderBy);
    const qb = this.createQueryBuilder<T>(prop.type, ctx, !!ctx);
    const populate = this.autoJoinOneToOneOwner(targetMeta, [{
      field: prop.pivotTable,
    }]);
    qb.select('*').populate(populate).where(where).orderBy(orderBy!);
    const items = owners.length ? await this.rethrow(qb.execute('all')) : [];

    const map: Dictionary<T[]> = {};
    owners.forEach(owner => map['' + Utils.getPrimaryKeyHash(owner as string[])] = []);
    items.forEach((item: any) => {
      const key = Utils.getPrimaryKeyHash(prop.joinColumns.map(col => item[col]));
      map[key].push(item);
      prop.joinColumns.forEach(col => delete item[col]);
      prop.inverseJoinColumns.forEach(col => delete item[col]);
    });

    return map;
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | KnexQueryBuilder | Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction): Promise<T> {
    return this.rethrow(this.connection.execute(queryOrKnex, params, method, ctx));
  }

  /**
   * 1:1 owner side needs to be marked for population so QB auto-joins the owner id
   */
  protected autoJoinOneToOneOwner<T>(meta: EntityMetadata, populate: PopulateOptions<T>[]): PopulateOptions<T>[] {
    if (!this.config.get('autoJoinOneToOneOwner')) {
      return populate;
    }

    const relationsToPopulate = populate.map(({ field }) => field);
    const toPopulate: PopulateOptions<T>[] = Object.values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name))
      .map(prop => ({ field: prop.name, strategy: prop.strategy }));

    return [...populate, ...toPopulate];
  }

  protected joinedProps<T>(meta: EntityMetadata, populate: PopulateOptions<T>[]): PopulateOptions<T>[] {
    return populate.filter(p => {
      const prop = meta.properties[p.field] || {};
      return (p.strategy || prop.strategy) === LoadStrategy.JOINED && prop.reference !== ReferenceType.SCALAR;
    });
  }

  protected mergeJoinedResult<T extends AnyEntity<T>>(rawResults: Dictionary[], meta: EntityMetadata<T>): T[] {
    // group by the root entity primary key first
    const res = rawResults.reduce((result, item) => {
      const pk = Utils.getCompositeKeyHash<T>(item as T, meta);
      result[pk] = result[pk] || [];
      result[pk].push(item);

      return result;
    }, {}) as Dictionary<any[]>;

    return Object.values(res).map((rows: Dictionary[]) => rows[0]) as T[];
  }

  protected getFieldsForJoinedLoad<T extends AnyEntity<T>>(qb: QueryBuilder<T>, meta: EntityMetadata, populate: PopulateOptions<T>[] = [], parentTableAlias?: string, parentJoinPath?: string): Field<T>[] {
    const fields: Field<T>[] = [];
    const joinedProps = this.joinedProps(meta, populate);

    // alias all fields in the primary table
    Object.values<EntityProperty<T>>(meta.properties)
      .filter(prop => this.shouldHaveColumn(prop, populate))
      .forEach(prop => fields.push(...this.mapPropToFieldNames(qb, prop, parentTableAlias)));

    joinedProps.forEach(relation => {
      const prop = meta.properties[relation.field];
      const meta2 = this.metadata.find(prop.type)!;
      const tableAlias = qb.getNextAlias(prop.name);
      const field = parentTableAlias ? `${parentTableAlias}.${prop.name}` : prop.name;
      const path = parentJoinPath ? `${parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;
      qb.join(field, tableAlias, {}, 'leftJoin', path);
      fields.push(...this.getFieldsForJoinedLoad(qb, meta2, relation.children, tableAlias, path));
    });

    return fields;
  }

  protected mapPropToFieldNames<T extends AnyEntity<T>>(qb: QueryBuilder<T>, prop: EntityProperty<T>, tableAlias?: string): Field<T>[] {
    if (prop.formula) {
      const alias = qb.ref(tableAlias ?? qb.alias).toString();
      const aliased = qb.ref(tableAlias ? `${tableAlias}_${prop.fieldNames[0]}` : prop.fieldNames[0]).toString();

      return [`${prop.formula!(alias)} as ${aliased}`];
    }

    if (tableAlias) {
      return prop.fieldNames.map(fieldName => qb.ref(fieldName).withSchema(tableAlias).as(`${tableAlias}_${fieldName}`));
    }

    return prop.fieldNames;
  }

  protected createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<KnexTransaction>, write?: boolean): QueryBuilder<T> {
    return new QueryBuilder(entityName, this.metadata, this, ctx, undefined, write ? 'write' : 'read');
  }

  protected extractManyToMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>): EntityData<T> {
    if (!this.metadata.has(entityName)) {
      return {};
    }

    const props = this.metadata.find(entityName)!.properties;
    const ret: EntityData<T> = {};

    for (const k of Object.keys(data)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY) {
        ret[k as keyof T] = data[k].map((item: Primary<T>) => Utils.asArray(item));
        delete data[k];
      }
    }

    return ret;
  }

  protected async processManyToMany<T extends AnyEntity<T>>(meta: EntityMetadata<T> | undefined, pks: Primary<T>[], collections: EntityData<T>, clear: boolean, ctx?: Transaction<KnexTransaction>) {
    if (!meta) {
      return;
    }

    const props = meta.properties;

    for (const k of Object.keys(collections)) {
      await this.rethrow(this.updateCollectionDiff(meta, props[k], pks, clear, collections[k], ctx));
    }
  }

  protected async updateCollectionDiff<T extends AnyEntity<T>, O extends AnyEntity<O>>(meta: EntityMetadata<O>, prop: EntityProperty<T>, pks: Primary<O>[], deleteDiff: Primary<T>[][] | boolean, insertDiff: Primary<T>[][], ctx?: Transaction): Promise<void> {
    const meta2 = this.metadata.find<T>(prop.type)!;

    if (!deleteDiff) {
      deleteDiff = [];
    }

    if (deleteDiff === true || deleteDiff.length > 0) {
      const qb1 = this.createQueryBuilder(prop.pivotTable, ctx, true);
      const knex = qb1.getKnex();

      if (Array.isArray(deleteDiff)) {
        knex.whereIn(prop.inverseJoinColumns, deleteDiff as Value[][]);
      }

      meta2.primaryKeys.forEach((pk, idx) => knex.andWhere(prop.joinColumns[idx], pks[idx] as Value[][]));
      await this.execute(knex.delete());
    }

    const items = insertDiff.map(item => {
      const cond = {} as Dictionary<Primary<T | O>>;
      prop.joinColumns.forEach((joinColumn, idx) => cond[joinColumn] = pks[idx]);
      prop.inverseJoinColumns.forEach((inverseJoinColumn, idx) => cond[inverseJoinColumn] = item[idx]);

      return cond;
    });

    if (this.platform.allowsMultiInsert()) {
      const qb2 = this.createQueryBuilder(prop.pivotTable, ctx, true);
      await this.execute(qb2.getKnex().insert(items));
    } else {
      await Utils.runSerial(items, item => this.createQueryBuilder(prop.pivotTable, ctx, true).insert(item).execute('run', false));
    }
  }

  async lockPessimistic<T extends AnyEntity<T>>(entity: T, mode: LockMode, ctx?: Transaction): Promise<void> {
    const qb = this.createQueryBuilder(entity.constructor.name, ctx);
    const meta = entity.__helper!.__meta;
    const cond = Utils.getPrimaryKeyCond(entity, meta.primaryKeys);
    qb.select('1').where(cond!).setLockMode(mode);
    await this.rethrow(qb.execute());
  }

  protected buildFields<T extends AnyEntity<T>>(meta: EntityMetadata<T>, populate: PopulateOptions<T>[], joinedProps: PopulateOptions<T>[], qb: QueryBuilder<T>, fields?: Field<T>[]): Field<T>[] {
    const lazyProps = Object.values<EntityProperty<T>>(meta.properties).filter(prop => prop.lazy && !populate.some(p => p.field === prop.name || p.all));
    const hasExplicitFields = !!fields;

    if (fields) {
      fields.unshift(...meta.primaryKeys.filter(pk => !fields!.includes(pk)));
    } else if (joinedProps.length > 0) {
      fields = this.getFieldsForJoinedLoad(qb, meta, populate);
    } else if (lazyProps.length > 0) {
      const props = Object.values<EntityProperty<T>>(meta.properties).filter(prop => this.shouldHaveColumn(prop, populate, false));
      fields = Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames));
    }

    if (fields && !hasExplicitFields) {
      Object.values<EntityProperty<T>>(meta.properties)
        .filter(prop => prop.formula)
        .forEach(prop => {
          const alias = qb.ref(qb.alias).toString();
          const aliased = qb.ref(prop.fieldNames[0]).toString();
          fields!.push(`${prop.formula!(alias)} as ${aliased}`);
        });
    }

    return fields || ['*'];
  }

}
