import { Transaction as KnexTransaction } from 'knex';
import { AnyEntity, Constructor, Dictionary, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary } from '../typings';
import { DatabaseDriver } from './DatabaseDriver';
import { QueryResult, Transaction } from '../connections';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';
import { Collection, ReferenceType, wrap } from '../entity';
import { QueryBuilder, QueryBuilderHelper, QueryOrderMap } from '../query';
import { Configuration, Utils } from '../utils';
import { Platform } from '../platforms';
import { FindOneOptions, FindOptions } from './IDatabaseDriver';

export abstract class AbstractSqlDriver<C extends AbstractSqlConnection = AbstractSqlConnection> extends DatabaseDriver<C> {

  protected readonly connection: C;
  protected readonly replicas: C[] = [];
  protected readonly platform: Platform;

  protected constructor(config: Configuration, platform: Platform, connection: Constructor<C>, connector: string[]) {
    super(config, connector);
    this.connection = new connection(this.config);
    this.replicas = this.createReplicas(conf => new connection(this.config, conf, 'read'));
    this.platform = platform;
  }

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOptions, ctx?: Transaction<KnexTransaction>): Promise<T[]> {
    const meta = this.metadata.get(entityName);
    options = { populate: [], orderBy: {}, ...(options || {}) };
    options.populate = this.autoJoinOneToOneOwner(meta, options.populate as string[]);

    if (options.fields && !options.fields.includes(meta.primaryKey)) {
      options.fields.unshift(meta.primaryKey);
    }

    const qb = this.createQueryBuilder(entityName, ctx, !!ctx);
    qb.select(options.fields || '*').populate(options.populate).where(where as Dictionary).orderBy(options.orderBy!).withSchema(options.schema);

    if (options.limit !== undefined) {
      qb.limit(options.limit, options.offset);
    }

    return qb.execute('all');
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions, ctx?: Transaction<KnexTransaction>): Promise<T | null> {
    options = { populate: [], orderBy: {}, ...(options || {}) };
    const meta = this.metadata.get(entityName);
    options.populate = this.autoJoinOneToOneOwner(meta, options.populate as string[]);
    const pk = meta.primaryKey;

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where } as FilterQuery<T>;
    }

    if (options.fields && !options.fields.includes(pk)) {
      options.fields.unshift(pk);
    }

    return this.createQueryBuilder(entityName, ctx, !!ctx)
      .select(options.fields || '*')
      .populate(options.populate)
      .where(where as Dictionary)
      .orderBy(options.orderBy!)
      .limit(1)
      .setLockMode(options.lockMode)
      .withSchema(options.schema)
      .execute('get');
  }

  async count(entityName: string, where: any, ctx?: Transaction<KnexTransaction>): Promise<number> {
    const qb = this.createQueryBuilder(entityName, ctx, !!ctx);
    const pk = this.metadata.get(entityName).primaryKey;
    const res = await qb.count(pk, true).where(where).execute('get', false);

    return +res.count;
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const collections = this.extractManyToMany(entityName, data);
    const pk = this.getPrimaryKeyField(entityName);
    const qb = this.createQueryBuilder(entityName, ctx, true);
    const res = await qb.insert(data).execute('run', false);
    res.row = res.row || {};
    res.insertId = data[pk] || res.insertId || res.row[pk];
    await this.processManyToMany(entityName, res.insertId, collections, false, ctx);

    return res;
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    const pk = this.getPrimaryKeyField(entityName);

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where } as FilterQuery<T>;
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: QueryResult = { affectedRows: 0, insertId: 0, row: {} };

    if (Object.keys(data).length) {
      const qb = this.createQueryBuilder(entityName, ctx, true);
      res = await qb.update(data).where(where as Dictionary).execute('run', false);
    }

    await this.processManyToMany(entityName, Utils.extractPK(data[pk] || where, this.metadata.get(entityName, false, false))!, collections, true, ctx);

    return res;
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T> | string | any, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      const pk = this.getPrimaryKeyField(entityName);
      where = { [pk]: where };
    }

    return this.createQueryBuilder(entityName, ctx, true).delete(where).execute('run', false);
  }

  async syncCollection<T extends AnyEntity<T>>(coll: Collection<T>, ctx?: Transaction): Promise<void> {
    const pk = wrap(coll.owner).__primaryKey;
    const snapshot = coll.getSnapshot().map(item => wrap(item).__primaryKey);
    const current = coll.getItems().map(item => wrap(item).__primaryKey);
    const deleteDiff = snapshot.filter(item => !current.includes(item));
    const insertDiff = current.filter(item => !snapshot.includes(item));
    const target = snapshot.filter(item => current.includes(item)).concat(...insertDiff);
    const equals = Utils.equals(current, target);

    // wrong order if we just delete and insert to the end
    if (coll.property.fixedOrder && !equals) {
      deleteDiff.length = insertDiff.length = 0;
      deleteDiff.push(...snapshot);
      insertDiff.push(...current);
    }

    await this.updateCollectionDiff(coll.property, pk, deleteDiff, insertDiff, ctx);
  }

  async loadFromPivotTable<T extends AnyEntity<T>>(prop: EntityProperty, owners: Primary<T>[], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Dictionary<T[]>> {
    const pivotProp2 = this.getPivotInverseProperty(prop);
    const meta = this.metadata.get(prop.type);

    if (!Utils.isEmpty(where) && Object.keys(where as Dictionary).every(k => QueryBuilderHelper.isOperator(k, false))) {
      where = { [`${prop.pivotTable}.${pivotProp2.name}`]: { $in: owners } };
    } else {
      where = { ...where, [`${prop.pivotTable}.${pivotProp2.name}`]: { $in: owners } };
    }

    orderBy = this.getPivotOrderBy(prop, orderBy);
    const qb = this.createQueryBuilder(prop.type, ctx, !!ctx);
    const populate = this.autoJoinOneToOneOwner(meta, [prop.pivotTable]);
    qb.select('*').populate(populate).where(where as Dictionary).orderBy(orderBy);
    const items = owners.length ? await qb.execute('all') : [];
    const fk1 = prop.joinColumn;
    const fk2 = prop.inverseJoinColumn;

    const map: Dictionary<T[]> = {};
    owners.forEach(owner => map['' + owner] = []);
    items.forEach((item: any) => {
      map[item[fk1]].push(item);
      delete item[fk1];
      delete item[fk2];
    });

    return map;
  }

  /**
   * 1:1 owner side needs to be marked for population so QB auto-joins the owner id
   */
  protected autoJoinOneToOneOwner(meta: EntityMetadata, populate: string[]): string[] {
    if (!this.config.get('autoJoinOneToOneOwner')) {
      return populate;
    }

    const toPopulate = Object.values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && !populate.includes(prop.name))
      .map(prop => prop.name);

    return [...populate, ...toPopulate];
  }

  protected createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<KnexTransaction>, write?: boolean): QueryBuilder<T> {
    return new QueryBuilder(entityName, this.metadata, this, ctx, undefined, write ? 'write' : 'read');
  }

  protected extractManyToMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>): EntityData<T> {
    if (!this.metadata.get(entityName, false, false)) {
      return {};
    }

    const props = this.metadata.get(entityName).properties;
    const ret: EntityData<T> = {};

    for (const k of Object.keys(data)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY) {
        ret[k as keyof T] = data[k];
        delete data[k];
      }
    }

    return ret;
  }

  protected async processManyToMany<T extends AnyEntity<T>>(entityName: string, pk: Primary<T>, collections: EntityData<T>, clear: boolean, ctx?: Transaction<KnexTransaction>) {
    if (!this.metadata.get(entityName, false, false)) {
      return;
    }

    const props = this.metadata.get(entityName).properties;

    for (const k of Object.keys(collections)) {
      await this.updateCollectionDiff(props[k], pk, clear, collections[k], ctx);
    }
  }

  protected async updateCollectionDiff<T extends AnyEntity<T>>(prop: EntityProperty<T>, pk: Primary<T>, deleteDiff: Primary<T>[] | boolean, insertDiff: Primary<T>[], ctx?: Transaction): Promise<void> {
    if (!deleteDiff) {
      deleteDiff = [];
    }

    if (deleteDiff === true || deleteDiff.length > 0) {
      const qb1 = this.createQueryBuilder(prop.pivotTable, ctx, true);
      const knex = qb1.getKnex();

      if (Array.isArray(deleteDiff)) {
        knex.whereIn(prop.inverseJoinColumn, deleteDiff);
      }

      knex.andWhere(prop.joinColumn, pk).delete();
      await this.connection.execute(knex);
    }

    const items = insertDiff.map(item => ({ [prop.joinColumn]: pk, [prop.inverseJoinColumn]: item }));

    if (this.platform.allowsMultiInsert()) {
      const qb2 = this.createQueryBuilder(prop.pivotTable, ctx, true);
      await this.connection.execute(qb2.getKnex().insert(items));
    } else {
      await Utils.runSerial(items, item => this.createQueryBuilder(prop.pivotTable, ctx, true).insert(item).execute('run', false));
    }
  }

}
