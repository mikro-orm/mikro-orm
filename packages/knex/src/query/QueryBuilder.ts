import type { Knex } from 'knex';
import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityMetadata,
  EntityProperty,
  FlatQueryOrderMap,
  GroupOperator,
  MetadataStorage,
  PopulateOptions,
  QBFilterQuery,
  QueryOrderMap,
} from '@mikro-orm/core';
import {
  LoadStrategy,
  LockMode,
  QueryFlag,
  QueryHelper,
  ReferenceType,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { QueryType } from './enums';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import type { SqlEntityManager } from '../SqlEntityManager';
import { CriteriaNodeFactory } from './CriteriaNodeFactory';
import type { Field, JoinOptions } from '../typings';

/**
 * SQL query builder with fluent interface.
 *
 * ```ts
 * const qb = orm.em.createQueryBuilder(Publisher);
 * qb.select('*')
 *   .where({
 *     name: 'test 123',
 *     type: PublisherType.GLOBAL,
 *   })
 *   .orderBy({
 *     name: QueryOrder.DESC,
 *     type: QueryOrder.ASC,
 *   })
 *   .limit(2, 1);
 *
 * const publisher = await qb.getSingleResult();
 * ```
 */
export class QueryBuilder<T extends AnyEntity<T> = AnyEntity> {

  readonly alias: string;

  /** @internal */
  type!: QueryType;
  /** @internal */
  _fields?: Field<T>[];
  /** @internal */
  _populate: PopulateOptions<T>[] = [];
  /** @internal */
  _populateMap: Dictionary<string> = {};

  private aliasCounter = 0;
  private flags: Set<QueryFlag> = new Set([QueryFlag.CONVERT_CUSTOM_TYPES]);
  private finalized = false;
  private _joins: Dictionary<JoinOptions> = {};
  private _aliasMap: Dictionary<string> = {};
  private _schema?: string;
  private _cond: Dictionary = {};
  private _data!: Dictionary;
  private _orderBy: QueryOrderMap<T>[] = [];
  private _groupBy: Field<T>[] = [];
  private _having: Dictionary = {};
  private _onConflict?: { fields: string[]; ignore?: boolean; merge?: EntityData<T> | Field<T>[]; where?: QBFilterQuery<T> }[];
  private _limit?: number;
  private _offset?: number;
  private _joinedProps = new Map<string, PopulateOptions<any>>();
  private _cache?: boolean | number | [string, number];
  private _indexHint?: string;
  private lockMode?: LockMode;
  private lockTables?: string[];
  private subQueries: Dictionary<string> = {};
  private readonly platform = this.driver.getPlatform();
  private readonly knex = this.driver.getConnection(this.connectionType).getKnex();
  private readonly helper: QueryBuilderHelper;

  /**
   * @internal
   */
  constructor(private readonly entityName: string,
              private readonly metadata: MetadataStorage,
              private readonly driver: AbstractSqlDriver,
              private readonly context?: Knex.Transaction,
              alias?: string,
              private connectionType?: 'read' | 'write',
              private readonly em?: SqlEntityManager) {
    if (alias) {
      this.aliasCounter++;
    }

    this.alias = alias ?? this.getNextAlias(this.entityName);
    this._aliasMap[this.alias] = this.entityName;
    this.helper = new QueryBuilderHelper(this.entityName, this.alias, this._aliasMap, this.subQueries, this.metadata, this.knex, this.platform);
  }

  select(fields: Field<T> | Field<T>[], distinct = false): this {
    this._fields = Utils.asArray(fields);

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT);
  }

  addSelect(fields: Field<T> | Field<T>[]): this {
    if (this.type && this.type !== QueryType.SELECT) {
      return this;
    }

    return this.select([...Utils.asArray(this._fields), ...Utils.asArray(fields)]);
  }

  insert(data: EntityData<T> | EntityData<T>[]): this {
    return this.init(QueryType.INSERT, data);
  }

  update(data: EntityData<T>): this {
    return this.init(QueryType.UPDATE, data);
  }

  delete(cond?: QBFilterQuery): this {
    return this.init(QueryType.DELETE, undefined, cond);
  }

  truncate(): this {
    return this.init(QueryType.TRUNCATE);
  }

  count(field?: string | string[], distinct = false): this {
    this._fields = [...(field ? Utils.asArray(field) : this.metadata.find(this.entityName)!.primaryKeys)];

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

  joinAndSelect(field: string, alias: string, cond: QBFilterQuery = {}, type: 'leftJoin' | 'innerJoin' | 'pivotJoin' = 'innerJoin', path?: string): this {
    const prop = this.joinReference(field, alias, cond, type, path);
    this.addSelect(this.getFieldsForJoinedLoad<T>(prop, alias));
    const [fromAlias] = this.helper.splitField(field);
    const populate = this._joinedProps.get(fromAlias);
    const item = { field: prop.name, strategy: LoadStrategy.JOINED, children: [] };

    if (populate) {
      populate.children!.push(item);
    } else { // root entity
      this._populate.push(item);
    }

    this._joinedProps.set(alias, item);

    return this;
  }

  leftJoinAndSelect(field: string, alias: string, cond: QBFilterQuery = {}): this {
    return this.joinAndSelect(field, alias, cond, 'leftJoin');
  }

  protected getFieldsForJoinedLoad<U extends AnyEntity<U>>(prop: EntityProperty<U>, alias: string): Field<U>[] {
    const fields: Field<U>[] = [];
    prop.targetMeta!.props
      .filter(prop => this.platform.shouldHaveColumn(prop, this._populate))
      .forEach(prop => fields.push(...this.driver.mapPropToFieldNames<U>(this as unknown as QueryBuilder<U>, prop, alias)));

    return fields;
  }

  withSubQuery(subQuery: Knex.QueryBuilder, alias: string): this {
    this.subQueries[alias] = subQuery.toString();
    return this;
  }

  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  where(cond: QBFilterQuery<T> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this {
    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
      operator = operator || '$and';
    } else {
      cond = QueryHelper.processWhere(cond, this.entityName, this.metadata, this.platform, this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES))!;
    }

    const op = operator || params as keyof typeof GroupOperator;
    const topLevel = !op || !Utils.hasObjectKeys(this._cond);
    const criteriaNode = CriteriaNodeFactory.createNode(this.metadata, this.entityName, cond);

    if ([QueryType.UPDATE, QueryType.DELETE].includes(this.type) && criteriaNode.willAutoJoin(this)) {
      // use sub-query to support joining
      this.setFlag(this.type === QueryType.UPDATE ? QueryFlag.UPDATE_SUB_QUERY : QueryFlag.DELETE_SUB_QUERY);
      this.select(this.metadata.find(this.entityName)!.primaryKeys, true);
    }

    if (topLevel) {
      this._cond = criteriaNode.process(this);
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(criteriaNode.process(this));
    } else {
      const cond1 = [this._cond, criteriaNode.process(this)];
      this._cond = { [op]: cond1 };
    }

    if (this._onConflict) {
      this._onConflict[this._onConflict.length - 1].where = this._cond;
      this._cond = {};
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

  orderBy(orderBy: QueryOrderMap<unknown> | QueryOrderMap<unknown>[]): this {
    this._orderBy = [];
    Utils.asArray(orderBy).forEach(o => {
      const processed = QueryHelper.processWhere(o as Dictionary, this.entityName, this.metadata, this.platform, false)!;
      this._orderBy.push(CriteriaNodeFactory.createNode(this.metadata, this.entityName, processed).process(this));
    });

    return this;
  }

  groupBy(fields: (string | keyof T) | readonly (string | keyof T)[]): this {
    this._groupBy = Utils.asArray(fields);
    return this;
  }

  having(cond: QBFilterQuery | string = {}, params?: any[]): this {
    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
    }

    this._having = CriteriaNodeFactory.createNode(this.metadata, this.entityName, cond).process(this);
    return this;
  }

  onConflict(fields: string | string[] = []): this {
    this._onConflict = this._onConflict || [];
    this._onConflict.push({ fields: Utils.asArray(fields) });
    return this;
  }

  ignore(): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.ignore()`');
    }

    this._onConflict[this._onConflict.length - 1].ignore = true;
    return this;
  }

  merge(data?: EntityData<T> | Field<T>[]): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.merge()`');
    }

    this._onConflict[this._onConflict.length - 1].merge = data;
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
  ref(field: string) {
    return this.knex.ref(field);
  }

  raw<R = Knex.Raw>(sql: string, bindings: Knex.RawBinding[] | Knex.ValueDict = []): R {
    const raw = this.knex.raw(sql, bindings);
    (raw as Dictionary).__raw = true; // tag it as there is now way to check via `instanceof`

    return raw as unknown as R;
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

  setLockMode(mode?: LockMode, tables?: string[]): this {
    if (mode != null && mode !== LockMode.OPTIMISTIC && !this.context) {
      throw ValidationError.transactionRequired();
    }

    this.lockMode = mode;
    this.lockTables = tables;

    return this;
  }

  setFlag(flag: QueryFlag): this {
    this.flags.add(flag);
    return this;
  }

  unsetFlag(flag: QueryFlag): this {
    this.flags.delete(flag);
    return this;
  }

  cache(config: boolean | number | [string, number] = true): this {
    this._cache = config;
    return this;
  }

  /**
   * Adds index hint to the FROM clause.
   */
  indexHint(sql: string): this {
    this._indexHint = sql;
    return this;
  }

  getKnexQuery(): Knex.QueryBuilder {
    this.finalize();
    const qb = this.getQueryBase();

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._cond, qb), this._cond && !this._onConflict);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy, 'groupBy')), this._groupBy);
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._having, qb, undefined, 'having'), this._having);
    Utils.runIfNotEmpty(() => {
      const queryOrder = this.helper.getQueryOrder(this.type, this._orderBy as FlatQueryOrderMap[], this._populateMap);

      if (queryOrder) {
        return qb.orderByRaw(queryOrder);
      }
    }, this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit!), this._limit);
    Utils.runIfNotEmpty(() => qb.offset(this._offset!), this._offset);
    Utils.runIfNotEmpty(() => this.helper.appendOnConflictClause(this.type, this._onConflict!, qb), this._onConflict);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      return this.knex.raw(qb.toSQL().toNative().sql + ' cascade') as any;
    }

    if (this.lockMode) {
      this.helper.getLockSQL(qb, this.lockMode, this.lockTables);
    }

    this.helper.finalize(this.type, qb, this.metadata.find(this.entityName));

    return qb;
  }

  /**
   * Returns the query with parameters as wildcards.
   */
  getQuery(): string {
    return this.getKnexQuery().toSQL().toNative().sql;
  }

  /**
   * Returns the list of all parameters for this query.
   */
  getParams(): readonly Knex.Value[] {
    return this.getKnexQuery().toSQL().toNative().bindings;
  }

  /**
   * Returns raw interpolated query string with all the parameters inlined.
   */
  getFormattedQuery(): string {
    const query = this.getKnexQuery().toSQL();
    return this.platform.formatQuery(query.sql, query.bindings);
  }

  getAliasForJoinPath(path?: string): string | undefined {
    if (!path || path === this.entityName) {
      return this.alias;
    }

    const join = Object.values(this._joins).find(j => j.path === path);

    if (path.endsWith('[pivot]') && join) {
      return join.alias;
    }

    /* istanbul ignore next */
    return join?.inverseAlias || join?.alias;
  }

  getNextAlias(entityName = 'e'): string {
    return this.driver.config.getNamingStrategy().aliasName(entityName, this.aliasCounter++);
  }

  /**
   * Executes this QB and returns the raw results, mapped to the property names (unless disabled via last parameter).
   * Use `method` to specify what kind of result you want to get (array/single/meta).
   */
  async execute<U = any>(method: 'all' | 'get' | 'run' = 'all', mapResults = true): Promise<U> {
    if (!this.connectionType && method !== 'run' && [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE, QueryType.TRUNCATE].includes(this.type)) {
      this.connectionType = 'write';
    }

    const query = this.getKnexQuery().toSQL();
    const cached = await this.em?.tryCache<T, U>(this.entityName, this._cache, ['qb.execute', query.sql, query.bindings, method]);

    if (cached?.data) {
      return cached.data;
    }

    const type = this.connectionType || (method === 'run' ? 'write' : 'read');
    const res = await this.driver.getConnection(type).execute(query.sql, query.bindings as any[], method, this.context);
    const meta = this.metadata.find(this.entityName);

    if (!mapResults || !meta) {
      await this.em?.storeCache(this._cache, cached!, res);
      return res as unknown as U;
    }

    if (method === 'all' && Array.isArray(res)) {
      const map: Dictionary = {};
      const mapped = res.map(r => this.driver.mapResult(r, meta, this._populate, this, map)) as unknown as U;
      await this.em?.storeCache(this._cache, cached!, mapped);

      return mapped;
    }

    const mapped = this.driver.mapResult(res as unknown as T, meta, this._populate, this) as unknown as U;
    /* istanbul ignore next */
    await this.em?.storeCache(this._cache, cached!, mapped);

    return mapped;
  }

  /**
   * Alias for `qb.getResultList()`
   */
  async getResult(): Promise<T[]> {
    return this.getResultList();
  }

  /**
   * Executes the query, returning array of results
   */
  async getResultList(): Promise<T[]> {
    let res = await this.execute<EntityData<T>[]>('all', true);

    if (this._joinedProps.size > 0) {
      res = this.driver.mergeJoinedResult(res, this.metadata.find(this.entityName)!);
    }

    return res.map(r => this.em!.map<T>(this.entityName, r, { schema: this._schema }));
  }

  /**
   * Executes the query, returning the first result or null
   */
  async getSingleResult(): Promise<T | null> {
    const res = await this.getResultList();
    return res[0] || null;
  }

  /**
   * Executes count query (without offset and limit), returning total count of results
   */
  async getCount(field?: string | string[], distinct = false): Promise<number> {
    const qb = this.clone();
    qb.count(field, distinct).limit(undefined).offset(undefined);
    const res = await qb.execute<{ count: number }>('get', false);

    return res ? +res.count : 0;
  }

  /**
   * Returns knex instance with sub-query aliased with given alias.
   * You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata
   */
  as(alias: string): Knex.QueryBuilder {
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
    const properties = [
      'flags', '_populate', '_populateMap', '_joins', '_joinedProps', '_aliasMap', '_cond', '_data', '_orderBy',
      '_schema', '_indexHint', '_cache', 'subQueries', 'lockMode', 'lockTables',
    ];
    properties.forEach(prop => (qb as any)[prop] = Utils.copy(this[prop as keyof this]));

    /* istanbul ignore else */
    if (this._fields) {
      qb._fields = [...this._fields];
    }

    qb.finalized = false;

    return qb;
  }

  getKnex(): Knex.QueryBuilder {
    const tableName = this.helper.getTableName(this.entityName) + (this.finalized && this.helper.isTableNameAliasRequired(this.type) ? ` as ${this.alias}` : '');
    const qb = this.knex(tableName);

    if (this.context) {
      qb.transacting(this.context);
    }

    return qb;
  }

  private joinReference(field: string, alias: string, cond: Dictionary, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', path?: string): EntityProperty {
    const [fromAlias, fromField] = this.helper.splitField(field);
    const entityName = this._aliasMap[fromAlias];
    const meta = this.metadata.get(entityName);
    const prop = meta.properties[fromField];

    if (!prop) {
      throw new Error(`Trying to join ${field}, but ${fromField} is not a defined relation on ${meta.className}`);
    }

    this._aliasMap[alias] = prop.type;
    cond = QueryHelper.processWhere(cond, this.entityName, this.metadata, this.platform)!;
    const aliasedName = `${fromAlias}.${prop.name}`;
    path = path ?? `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? entityName)}.${prop.name}`;

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
      let pivotAlias = alias;

      if (type !== 'pivotJoin') {
        const oldPivotAlias = this.getAliasForJoinPath(path + '[pivot]');
        pivotAlias = oldPivotAlias ?? this.getNextAlias(prop.pivotTable);
      }

      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type, cond, path);
      Object.assign(this._joins, joins);
      this._aliasMap[pivotAlias] = prop.pivotTable;
    } else if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else { // MANY_TO_ONE
      this._joins[aliasedName] = this.helper.joinManyToOneReference(prop, fromAlias, alias, type, cond);
    }

    if (!this._joins[aliasedName].path && path) {
      this._joins[aliasedName].path = path;
    }

    return prop;
  }

  private prepareFields<T extends AnyEntity<T>, U extends string | Knex.Raw = string | Knex.Raw>(fields: Field<T>[], type: 'where' | 'groupBy' | 'sub-query' = 'where'): U[] {
    const ret: Field<T>[] = [];

    fields.forEach(f => {
      if (!Utils.isString(f)) {
        return ret.push(f);
      }

      if (this._joins[f] && type === 'where') {
        return ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      ret.push(this.helper.mapper(f, this.type) as string);
    });

    const meta = this.metadata.find(this.entityName);
    /* istanbul ignore next */
    const requiresSQLConversion = (meta?.props || []).filter(p => p.customType?.convertToJSValueSQL);

    if (this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES) && (fields.includes('*') || fields.includes(`${this.alias}.*`)) && requiresSQLConversion.length > 0) {
      requiresSQLConversion.forEach(p => ret.push(this.helper.mapper(p.name, this.type)));
    }

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

    return ret as U[];
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.type = type;
    this._aliasMap[this.alias] = this.entityName;

    if (!this.helper.isTableNameAliasRequired(type)) {
      delete this._fields;
    }

    if (data) {
      this._data = this.helper.processData(data, this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES));
    }

    if (cond) {
      this.where(cond);
    }

    return this;
  }

  private getQueryBase(): Knex.QueryBuilder {
    const qb = this.getKnex();
    const meta = this.metadata.find(this.entityName);
    const metaSchema = meta?.schema && meta.schema !== '*' ? meta.schema : undefined;
    const schema = this._schema ?? metaSchema ?? this.em?.config.get('schema');

    if (schema) {
      qb.withSchema(schema);
    }

    if (this._indexHint) {
      const alias = this.helper.isTableNameAliasRequired(this.type) ? ` as ${this.platform.quoteIdentifier(this.alias)}` : '';
      const schemaQuoted = schema ? this.platform.quoteIdentifier(schema) + '.' : '';
      const tableName = schemaQuoted + this.platform.quoteIdentifier(this.helper.getTableName(this.entityName)) + alias;
      qb.from(this.knex.raw(`${tableName} ${this._indexHint}`));
    }

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields!));

        if (this.flags.has(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins, schema);
        break;
      case QueryType.COUNT: {
        const m = this.flags.has(QueryFlag.DISTINCT) ? 'countDistinct' : 'count';
        qb[m]({ count: this._fields!.map(f => this.helper.mapper(f as string, this.type)) });
        this.helper.processJoins(qb, this._joins, schema);
        break;
      }
      case QueryType.INSERT:
        qb.insert(this._data);
        break;
      case QueryType.UPDATE:
        qb.update(this._data);
        this.helper.updateVersionProperty(qb, this._data);
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

    if (!this.type) {
      this.select('*');
    }

    const meta = this.metadata.find(this.entityName);

    if (meta && this.flags.has(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)) {
      const relationsToPopulate = this._populate.map(({ field }) => field);
      meta.relations
        .filter(prop => prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name))
        .map(prop => ({ field: prop.name }))
        .forEach(item => this._populate.push(item));
    }

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
        this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, this.getNextAlias(prop.pivotTable ?? prop.type), 'leftJoin');
        this._populateMap[field] = this._joins[field].alias;
      }
    });

    if (meta && (this._fields?.includes('*') || this._fields?.includes(`${this.alias}.*`))) {
      meta.props
        .filter(prop => prop.formula && (!prop.lazy || this.flags.has(QueryFlag.INCLUDE_LAZY_FORMULAS)))
        .map(prop => {
          const alias = this.knex.ref(this.alias).toString();
          const aliased = this.knex.ref(prop.fieldNames[0]).toString();
          return `${prop.formula!(alias)} as ${aliased}`;
        })
        .filter(field => !this._fields!.includes(field))
        .forEach(field => this.addSelect(field));
    }

    QueryHelper.processObjectParams(this._data);
    QueryHelper.processObjectParams(this._cond);
    QueryHelper.processObjectParams(this._having);
    this.finalized = true;

    if (meta && this.flags.has(QueryFlag.PAGINATE) && this._limit! > 0) {
      this.wrapPaginateSubQuery(meta);
    }

    if (meta && (this.flags.has(QueryFlag.UPDATE_SUB_QUERY) || this.flags.has(QueryFlag.DELETE_SUB_QUERY))) {
      this.wrapModifySubQuery(meta);
    }
  }

  private wrapPaginateSubQuery(meta: EntityMetadata): void {
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query') as string[];
    const subQuery = this.clone().select(pks).groupBy(pks).limit(this._limit!);

    if (this._offset) {
      subQuery.offset(this._offset);
    }

    if (this._orderBy.length > 0) {
      const orderBy = [];
      for (const orderMap of this._orderBy) {
        for (const [field, direction] of Object.entries(orderMap)) {
          orderBy.push({
            [`min(${this.ref(field)})`]: direction,
          });
        }
      }

      subQuery.orderBy(orderBy);
    }

    subQuery.finalized = true;
    const knexQuery = subQuery.as(this.alias).clearSelect().select(pks);

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.getKnex().select(pks).from(knexQuery);
    this._limit = undefined;
    this._offset = undefined;
    this.select(this._fields!).where({ [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubQuery } });
  }

  private wrapModifySubQuery(meta: EntityMetadata): void {
    const subQuery = this.clone();
    subQuery.finalized = true;

    // wrap one more time to get around MySQL limitations
    // https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
    const subSubQuery = this.getKnex().select(this.prepareFields(meta.primaryKeys)).from(subQuery.as(this.alias));
    const method = this.flags.has(QueryFlag.UPDATE_SUB_QUERY) ? 'update' : 'delete';

    this[method](this._data as EntityData<T>).where({
      [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubQuery },
    });
  }

  private autoJoinPivotTable(field: string): void {
    const pivotMeta = this.metadata.find(field)!;
    const owner = pivotMeta.props.find(prop => prop.reference === ReferenceType.MANY_TO_ONE && prop.owner)!;
    const inverse = pivotMeta.props.find(prop => prop.reference === ReferenceType.MANY_TO_ONE && !prop.owner)!;
    const prop = this._cond[pivotMeta.name + '.' + owner.name] || this._orderBy[pivotMeta.name + '.' + owner.name] ? inverse : owner;
    const pivotAlias = this.getNextAlias(pivotMeta.name!);

    this._joins[field] = this.helper.joinPivotTable(field, prop, this.alias, pivotAlias, 'leftJoin');
    Utils.renameKey(this._cond, `${field}.${owner.name}`, Utils.getPrimaryKeyHash(owner.fieldNames.map(fieldName => `${pivotAlias}.${fieldName}`)));
    Utils.renameKey(this._cond, `${field}.${inverse.name}`, Utils.getPrimaryKeyHash(inverse.fieldNames.map(fieldName => `${pivotAlias}.${fieldName}`)));
    this._populateMap[field] = this._joins[field].alias;
  }

}
