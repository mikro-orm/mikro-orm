import { QueryBuilder as KnexQueryBuilder, Raw, Transaction, Value, Ref } from 'knex';
import {
  AnyEntity, Dictionary, EntityMetadata, EntityProperty, FlatQueryOrderMap, GroupOperator, LockMode, MetadataStorage, QBFilterQuery, QueryFlag,
  QueryOrderMap, ReferenceType, QueryHelper, Utils, ValidationError, PopulateOptions,
} from '@mikro-orm/core';
import { QueryType } from './enums';
import { AbstractSqlDriver, QueryBuilderHelper } from '../index';
import { CriteriaNode } from './internal';
import { SqlEntityManager } from '../SqlEntityManager';

/**
 * SQL query builder
 */
export class QueryBuilder<T extends AnyEntity<T> = AnyEntity> {

  type!: QueryType;
  _fields?: Field[];
  _populate: PopulateOptions<T>[] = [];
  _populateMap: Dictionary<string> = {};

  private aliasCounter = 1;
  private flags: Set<QueryFlag> = new Set();
  private finalized = false;
  private _joins: Dictionary<JoinOptions> = {};
  private _aliasMap: Dictionary<string> = {};
  private _schema?: string;
  private _cond: Dictionary = {};
  private _data!: Dictionary;
  private _orderBy: QueryOrderMap = {};
  private _groupBy: string[] = [];
  private _having: Dictionary = {};
  private _limit?: number;
  private _offset?: number;
  private lockMode?: LockMode;
  private subQueries: Dictionary<string> = {};
  private readonly platform = this.driver.getPlatform();
  private readonly knex = this.driver.getConnection(this.connectionType).getKnex();
  private readonly helper = new QueryBuilderHelper(this.entityName, this.alias, this._aliasMap, this.subQueries, this.metadata, this.knex, this.platform);

  constructor(private readonly entityName: string,
              private readonly metadata: MetadataStorage,
              private readonly driver: AbstractSqlDriver,
              private readonly context?: Transaction,
              readonly alias = `e0`,
              private readonly connectionType?: 'read' | 'write',
              private readonly em?: SqlEntityManager) {
    this.select('*');
  }

  select(fields: Field | Field[], distinct = false): this {
    this._fields = Utils.asArray(fields);

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT);
  }

  addSelect(fields: string | string[]): this {
    return this.select([...Utils.asArray(this._fields), ...Utils.asArray(fields)]);
  }

  insert(data: any): this {
    return this.init(QueryType.INSERT, data);
  }

  update(data: any): this {
    return this.init(QueryType.UPDATE, data);
  }

  delete(cond: QBFilterQuery = {}): this {
    return this.init(QueryType.DELETE, undefined, cond);
  }

  truncate(): this {
    return this.init(QueryType.TRUNCATE);
  }

  count(field?: string | string[], distinct = false): this {
    this._fields = [...(field ? Utils.asArray(field) : this.metadata.get(this.entityName).primaryKeys)];

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT);
  }

  join(field: string, alias: string, cond: QBFilterQuery = {}, type: 'leftJoin' | 'innerJoin' | 'pivotJoin' = 'innerJoin', path?: string): this {
    this.joinReference(field, alias, cond, type, path);
    return this;
  }

  leftJoin(field: string, alias: string, cond: QBFilterQuery = {}): this {
    return this.join(field, alias, cond, 'leftJoin');
  }

  withSubQuery(subQuery: KnexQueryBuilder, alias: string): this {
    this.subQueries[alias] = subQuery.toString();
    return this;
  }

  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  where(cond: QBFilterQuery<T> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this {
    cond = QueryHelper.processWhere(cond as Dictionary, this.entityName, this.metadata)!;

    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
      operator = operator || '$and';
    }

    const op = operator || params as keyof typeof GroupOperator;
    const topLevel = !op || Object.keys(this._cond).length === 0;
    const criteriaNode = CriteriaNode.create(this.metadata, this.entityName, cond);

    if ([QueryType.UPDATE, QueryType.DELETE].includes(this.type) && criteriaNode.willAutoJoin(this)) {
      // use sub-query to support joining
      this.setFlag(this.type === QueryType.UPDATE ? QueryFlag.UPDATE_SUB_QUERY : QueryFlag.DELETE_SUB_QUERY);
      this.select(this.metadata.get(this.entityName).primaryKeys, true);
    }

    if (topLevel) {
      this._cond = criteriaNode.process(this);
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(criteriaNode.process(this));
    } else {
      const cond1 = [this._cond, criteriaNode.process(this)];
      this._cond = { [op]: cond1 };
    }

    return this;
  }

  andWhere(cond: QBFilterQuery<T>): this;
  andWhere(cond: string, params?: any[]): this;
  andWhere(cond: QBFilterQuery<T> | string, params?: any[]): this {
    return this.where(cond as string, params, '$and');
  }

  orWhere(cond: QBFilterQuery<T>): this;
  orWhere(cond: string, params?: any[]): this;
  orWhere(cond: QBFilterQuery<T> | string, params?: any[]): this {
    return this.where(cond as string, params, '$or');
  }

  orderBy(orderBy: QueryOrderMap): this {
    orderBy = QueryHelper.processWhere(orderBy as Dictionary, this.entityName, this.metadata) as QueryOrderMap;
    this._orderBy = CriteriaNode.create(this.metadata, this.entityName, orderBy).process(this);
    return this;
  }

  groupBy(fields: string | string[]): this {
    this._groupBy = Utils.asArray(fields);
    return this;
  }

  having(cond: QBFilterQuery | string = {}, params?: any[]): this {
    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
    }

    this._having = CriteriaNode.create(this.metadata, this.entityName, cond).process(this);
    return this;
  }

  /**
   * @internal
   */
  populate(populate: PopulateOptions<T>[]): this {
    this._populate = populate;

    return this;
  }

  /**
   * @internal
   */
  ref(field: string): Ref<string, string> {
    return this.knex.ref(field);
  }

  raw(sql: string): Raw {
    return this.knex.raw(sql);
  }

  limit(limit?: number, offset = 0): this {
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this;
  }

  offset(offset?: number): this {
    this._offset = offset;
    return this;
  }

  withSchema(schema?: string): this {
    this._schema = schema;

    return this;
  }

  setLockMode(mode?: LockMode): this {
    if ([LockMode.NONE, LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode!) && !this.context) {
      throw ValidationError.transactionRequired();
    }

    this.lockMode = mode;

    return this;
  }

  setFlag(flag: QueryFlag): this {
    this.flags.add(flag);
    return this;
  }

  getKnexQuery(): KnexQueryBuilder {
    this.finalize();
    const qb = this.getQueryBase();

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._cond, qb), this._cond);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy, 'groupBy')), this._groupBy);
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._having, qb, undefined, 'having'), this._having);
    Utils.runIfNotEmpty(() => qb.orderByRaw(this.helper.getQueryOrder(this.type, this._orderBy as FlatQueryOrderMap, this._populateMap)), this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit!), this._limit);
    Utils.runIfNotEmpty(() => qb.offset(this._offset!), this._offset);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      return this.knex.raw(qb.toSQL().toNative().sql + ' cascade') as any;
    }

    this.helper.getLockSQL(qb, this.lockMode);
    this.helper.finalize(this.type, qb, this.metadata.find(this.entityName));

    return qb;
  }

  getQuery(): string {
    return this.getKnexQuery().toSQL().toNative().sql;
  }

  getParams(): readonly Value[] {
    return this.getKnexQuery().toSQL().toNative().bindings;
  }

  getAliasForJoinPath(path: string): string | undefined {
    if (path === this.entityName) {
      return this.alias;
    }

    const join = Object.values(this._joins).find(j => j.path === path);
    /* istanbul ignore next */
    return join?.inverseAlias || join?.alias;
  }

  getNextAlias(prefix = 'e'): string {
    // Take only the first letter of the prefix to keep character counts down since some engines have character limits
    return `${prefix.charAt(0).toLowerCase()}${this.aliasCounter++}`;
  }

  async execute<U = any>(method: 'all' | 'get' | 'run' = 'all', mapResults = true): Promise<U> {
    const type = this.connectionType || (method === 'run' ? 'write' : 'read');
    const res = await this.driver.getConnection(type).execute(this.getKnexQuery(), [], method);
    const meta = this.metadata.find(this.entityName);

    if (!mapResults || !meta) {
      return res as unknown as U;
    }

    if (method === 'all' && Array.isArray(res)) {
      const map: Dictionary = {};
      return res.map(r => this.driver.mapResult(r, meta, this._populate, this, map)) as unknown as U;
    }

    return this.driver.mapResult(res as unknown as T, meta, this._populate, this) as unknown as U;
  }

  async getResult(): Promise<T[]> {
    const res = await this.execute<T[]>('all', true);
    return res.map(r => this.em!.map<T>(this.entityName, r));
  }

  async getSingleResult(): Promise<T | null> {
    const res = await this.getResult();
    return res[0] || null;
  }

  /**
   * Returns knex instance with sub-query aliased with given alias.
   * You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata
   */
  as(alias: string): KnexQueryBuilder {
    const qb = this.getKnexQuery();

    if (alias.includes('.')) {
      const [a, f] = alias.split('.');
      const meta = this.metadata.find(a);
      /* istanbul ignore next */
      alias = meta?.properties[f]?.fieldNames[0] || alias;
    }

    return qb.as(alias);
  }

  clone(): QueryBuilder<T> {
    const qb = new QueryBuilder<T>(this.entityName, this.metadata, this.driver, this.context, this.alias, this.connectionType, this.em);
    Object.assign(qb, this);

    // clone array/object properties
    const properties = ['flags', '_fields', '_populate', '_populateMap', '_joins', '_aliasMap', '_cond', '_data', '_orderBy', '_schema', 'subQueries'];
    properties.forEach(prop => (qb as any)[prop] = Utils.copy(this[prop as keyof this]));
    qb.finalized = false;

    return qb;
  }

  getKnex(): KnexQueryBuilder {
    const tableName = this.helper.getTableName(this.entityName) + (this.finalized && [QueryType.SELECT, QueryType.COUNT].includes(this.type) ? ` as ${this.alias}` : '');
    const qb = this.knex(tableName);

    if (this.context) {
      qb.transacting(this.context);
    }

    return qb;
  }

  private joinReference(field: string, alias: string, cond: Dictionary, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', path?: string): void {
    const [fromAlias, fromField] = this.helper.splitField(field);
    const entityName = this._aliasMap[fromAlias];
    const prop = this.metadata.get(entityName).properties[fromField];
    this._aliasMap[alias] = prop.type;
    cond = QueryHelper.processWhere(cond, this.entityName, this.metadata)!;
    const aliasedName = `${fromAlias}.${prop.name}`;

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
      let pivotAlias = alias;

      if (type !== 'pivotJoin') {
        const oldPivotAlias = this.getAliasForJoinPath(path + '[pivot]');
        pivotAlias = oldPivotAlias ?? `e${this.aliasCounter++}`;
      }

      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type, cond);
      Object.assign(this._joins, joins);
      this._aliasMap[pivotAlias] = prop.pivotTable;
    } else if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else { // MANY_TO_ONE
      this._joins[aliasedName] = this.helper.joinManyToOneReference(prop, fromAlias, alias, type, cond);
    }

    this._joins[aliasedName].path = path;
  }

  private prepareFields<T extends string | Raw = string | Raw>(fields: Field[], type: 'where' | 'groupBy' | 'sub-query' = 'where'): T[] {
    const ret: Field[] = [];

    fields.forEach(f => {
      if (!Utils.isString(f)) {
        return ret.push(f);
      }

      if (this._joins[f] && type === 'where') {
        return ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      ret.push(this.helper.mapper(f, this.type) as string);
    });

    Object.keys(this._populateMap).forEach(f => {
      if (!fields.includes(f) && type === 'where') {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      if (this._joins[f].prop.reference !== ReferenceType.ONE_TO_ONE && this._joins[f].inverseJoinColumns) {
        this._joins[f].inverseJoinColumns!.forEach(inverseJoinColumn => {
          Utils.renameKey(this._cond, inverseJoinColumn, `${this._joins[f].alias}.${inverseJoinColumn!}`);
        });
      }
    });

    return ret as T[];
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.type = type;
    this._aliasMap[this.alias] = this.entityName;

    if (![QueryType.SELECT, QueryType.COUNT].includes(type)) {
      delete this._fields;
    }

    if (data) {
      this._data = this.helper.processData(data);
    }

    if (cond) {
      this.where(cond);
    }

    return this;
  }

  private getQueryBase(): KnexQueryBuilder {
    const qb = this.getKnex();

    if (this._schema) {
      qb.withSchema(this._schema);
    }

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields!));

        if (this.flags.has(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins);
        break;
      case QueryType.COUNT: {
        const m = this.flags.has(QueryFlag.DISTINCT) ? 'countDistinct' : 'count';
        qb[m]({ count: this._fields!.map(f => this.helper.mapper(f as string, this.type)) });
        this.helper.processJoins(qb, this._joins);
        break;
      }
      case QueryType.INSERT:
        qb.insert(this._data);
        break;
      case QueryType.UPDATE:
        qb.update(this._data);
        this.helper.updateVersionProperty(qb);
        break;
      case QueryType.DELETE:
        qb.delete();
        break;
      case QueryType.TRUNCATE:
        qb.truncate();
        break;
    }

    return qb;
  }

  private finalize(): void {
    if (this.finalized) {
      return;
    }

    const meta = this.metadata.find(this.entityName);
    this._populate.forEach(({ field }) => {
      const [fromAlias, fromField] = this.helper.splitField(field);
      const aliasedField = `${fromAlias}.${fromField}`;

      if (this._joins[aliasedField] && this.helper.isOneToOneInverse(field)) {
        return this._populateMap[aliasedField] = this._joins[aliasedField].alias;
      }

      if (this.metadata.find(field)?.pivotTable) { // pivot table entity
        this.autoJoinPivotTable(field);
      } else if (meta && this.helper.isOneToOneInverse(field)) {
        const prop = meta.properties[field];
        this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, `e${this.aliasCounter++}`, 'leftJoin');
        this._populateMap[field] = this._joins[field].alias;
      }
    });

    if (meta && (this._fields?.includes('*') || this._fields?.includes(`${this.alias}.*`))) {
      Object.values(meta.properties)
        .filter(prop => prop.formula)
        .forEach(prop => {
          const alias = this.knex.ref(this.alias).toString();
          const aliased = this.knex.ref(prop.fieldNames[0]).toString();
          this.addSelect(`${prop.formula!(alias)} as ${aliased}`);
        });
    }

    QueryHelper.processParams([this._data, this._cond, this._having]);
    this.finalized = true;

    if (meta && this.flags.has(QueryFlag.PAGINATE) && this._limit! > 0) {
      this.wrapPaginateSubQuery(meta);
    }

    if (meta && (this.flags.has(QueryFlag.UPDATE_SUB_QUERY) || this.flags.has(QueryFlag.DELETE_SUB_QUERY))) {
      this.wrapModifySubQuery(meta);
    }
  }

  private wrapPaginateSubQuery(meta: EntityMetadata): void {
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query');
    const subQuery = this.clone().limit(undefined).offset(undefined);
    subQuery.finalized = true;
    const knexQuery = subQuery.as(this.alias).clearSelect().select(pks);

    // 3 sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.getKnex().select(pks).from(knexQuery).groupBy(pks).limit(this._limit!);

    if (this._offset) {
      subSubQuery.offset(this._offset);
    }

    const subSubSubQuery = this.getKnex().select(pks).from(subSubQuery.as(this.alias));
    this._limit = undefined;
    this._offset = undefined;
    this.select(this._fields!).where({ [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubSubQuery } });
  }

  private wrapModifySubQuery(meta: EntityMetadata): void {
    const subQuery = this.clone();
    subQuery.finalized = true;

    // wrap one more time to get around MySQL limitations
    // https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
    const subSubQuery = this.getKnex().select(this.prepareFields(meta.primaryKeys)).from(subQuery.as(this.alias));
    const method = this.flags.has(QueryFlag.UPDATE_SUB_QUERY) ? 'update' : 'delete';

    this[method](this._data).where({
      [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubQuery },
    });
  }

  private autoJoinPivotTable(field: string): void {
    const pivotMeta = this.metadata.get(field);
    const owner = Object.values(pivotMeta.properties).find(prop => prop.reference === ReferenceType.MANY_TO_ONE && prop.owner)!;
    const inverse = Object.values(pivotMeta.properties).find(prop => prop.reference === ReferenceType.MANY_TO_ONE && !prop.owner)!;
    const prop = this._cond[pivotMeta.name + '.' + owner.name] || this._orderBy[pivotMeta.name + '.' + owner.name] ? inverse : owner;
    const pivotAlias = this.getNextAlias();

    this._joins[field] = this.helper.joinPivotTable(field, prop, this.alias, pivotAlias, 'leftJoin');
    Utils.renameKey(this._cond, `${field}.${owner.name}`, Utils.getPrimaryKeyHash(owner.fieldNames.map(fieldName => `${pivotAlias}.${fieldName}`)));
    Utils.renameKey(this._cond, `${field}.${inverse.name}`, Utils.getPrimaryKeyHash(inverse.fieldNames.map(fieldName => `${pivotAlias}.${fieldName}`)));
    this._populateMap[field] = this._joins[field].alias;
  }

}

type KnexStringRef = Ref<string, {
  [alias: string]: string;
}>;

export type Field = string | KnexStringRef | KnexQueryBuilder;

export interface JoinOptions {
  table: string;
  type: 'leftJoin' | 'innerJoin' | 'pivotJoin';
  alias: string;
  ownerAlias: string;
  inverseAlias?: string;
  joinColumns?: string[];
  inverseJoinColumns?: string[];
  primaryKeys?: string[];
  path?: string;
  prop: EntityProperty;
  cond: Dictionary;
}
