import { inspect } from 'util';
import type { Knex } from 'knex';
import {
  type AnyEntity,
  type ConnectionType,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type FilterQuery,
  type FlatQueryOrderMap,
  type FlushMode,
  type GroupOperator,
  helper,
  LoadStrategy,
  LockMode,
  type LoggingOptions,
  type MetadataStorage,
  type ObjectQuery,
  PopulateHint,
  type PopulateOptions,
  type QBFilterQuery,
  type QBQueryOrderMap,
  QueryFlag,
  QueryHelper,
  type QueryOrderMap,
  type QueryResult,
  raw,
  RawQueryFragment,
  Reference,
  ReferenceKind,
  type RequiredEntityData,
  serialize,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { JoinType, QueryType } from './enums';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import { type Alias, QueryBuilderHelper } from './QueryBuilderHelper';
import type { SqlEntityManager } from '../SqlEntityManager';
import { CriteriaNodeFactory } from './CriteriaNodeFactory';
import type { Field, ICriteriaNodeProcessOptions, JoinOptions } from '../typings';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';

export interface ExecuteOptions {
  mapResults?: boolean;
  mergeResults?: boolean;
}

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
export class QueryBuilder<T extends object = AnyEntity> {

  get mainAlias(): Alias<T> {
    this.ensureFromClause();
    return this._mainAlias!;
  }

  get alias(): string {
    return this.mainAlias.aliasName;
  }

  get helper(): QueryBuilderHelper {
    this.ensureFromClause();
    return this._helper!;
  }

  /** @internal */
  type?: QueryType;
  /** @internal */
  _fields?: Field<T>[];
  /** @internal */
  _populate: PopulateOptions<T>[] = [];
  /** @internal */
  _populateWhere?: ObjectQuery<T> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  __populateWhere?: ObjectQuery<T> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  _populateMap: Dictionary<string> = {};
  /** @internal */
  readonly rawFragments = new Set<string>();

  protected aliasCounter = 0;
  protected flags: Set<QueryFlag> = new Set([QueryFlag.CONVERT_CUSTOM_TYPES]);
  protected finalized = false;
  protected _joins: Dictionary<JoinOptions> = {};
  protected _explicitAlias = false;
  protected _schema?: string;
  protected _cond: Dictionary = {};
  protected _data!: Dictionary;
  protected _orderBy: QueryOrderMap<T>[] = [];
  protected _groupBy: Field<T>[] = [];
  protected _having: Dictionary = {};
  protected _returning?: Field<T>[];
  protected _onConflict?: { fields: string[]; ignore?: boolean; merge?: EntityData<T> | Field<T>[]; where?: QBFilterQuery<T> }[];
  protected _limit?: number;
  protected _offset?: number;
  protected _distinctOn?: string[];
  protected _joinedProps = new Map<string, PopulateOptions<any>>();
  protected _cache?: boolean | number | [string, number];
  protected _indexHint?: string;
  protected _comments: string[] = [];
  protected _hintComments: string[] = [];
  protected flushMode?: FlushMode;
  protected lockMode?: LockMode;
  protected lockTables?: string[];
  protected subQueries: Dictionary<string> = {};
  protected _mainAlias?: Alias<T>;
  protected _aliases: Dictionary<Alias<any>> = {};
  protected _helper?: QueryBuilderHelper;
  protected _query?: { sql?: string; _sql?: Knex.Sql; params?: readonly unknown[]; qb: Knex.QueryBuilder<T> };
  protected readonly platform: AbstractSqlPlatform;
  protected readonly knex: Knex;

  /**
   * @internal
   */
  constructor(entityName: EntityName<T> | QueryBuilder<T>,
              protected readonly metadata: MetadataStorage,
              protected readonly driver: AbstractSqlDriver,
              protected readonly context?: Knex.Transaction,
              alias?: string,
              protected connectionType?: ConnectionType,
              protected em?: SqlEntityManager,
              protected loggerContext?: LoggingOptions & Dictionary) {
    this.platform = this.driver.getPlatform();
    this.knex = this.driver.getConnection(this.connectionType).getKnex();

    if (alias) {
      this.aliasCounter++;
      this._explicitAlias = true;
    }

    // @ts-expect-error union type does not match the overloaded method signature
    this.from(entityName, alias);
  }

  select(fields: Field<T> | Field<T>[], distinct = false): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._fields = Utils.asArray(fields);

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT) as SelectQueryBuilder<T>;
  }

  addSelect(fields: Field<T> | Field<T>[]): SelectQueryBuilder<T> {
    this.ensureNotFinalized();

    if (this.type && this.type !== QueryType.SELECT) {
      return this as SelectQueryBuilder<T>;
    }

    return this.select([...Utils.asArray(this._fields), ...Utils.asArray(fields)]);
  }

  distinct(): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    return this.setFlag(QueryFlag.DISTINCT) as SelectQueryBuilder<T>;
  }

  /** postgres only */
  distinctOn(fields: string | string[]): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._distinctOn = Utils.asArray(fields);
    return this as SelectQueryBuilder<T>;
  }

  insert(data: RequiredEntityData<T> | RequiredEntityData<T>[]): InsertQueryBuilder<T> {
    return this.init(QueryType.INSERT, data) as InsertQueryBuilder<T>;
  }

  update(data: EntityData<T>): UpdateQueryBuilder<T> {
    return this.init(QueryType.UPDATE, data) as UpdateQueryBuilder<T>;
  }

  delete(cond?: QBFilterQuery): DeleteQueryBuilder<T> {
    return this.init(QueryType.DELETE, undefined, cond) as DeleteQueryBuilder<T>;
  }

  truncate(): TruncateQueryBuilder<T> {
    return this.init(QueryType.TRUNCATE) as TruncateQueryBuilder<T>;
  }

  count(field?: string | string[], distinct = false): CountQueryBuilder<T> {
    if (field) {
      this._fields = Utils.asArray(field);
    } else if (this.hasToManyJoins()) {
      this._fields = this.mainAlias.metadata!.primaryKeys;
    } else {
      this._fields = [raw('*')];
    }

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT) as CountQueryBuilder<T>;
  }

  join(field: string | Knex.QueryBuilder | QueryBuilder<any>, alias: string, cond: QBFilterQuery = {}, type = JoinType.innerJoin, path?: string, schema?: string): this {
    this.joinReference(field, alias, cond, type, path, schema);
    return this;
  }

  innerJoin(field: string | Knex.QueryBuilder | QueryBuilder<any>, alias: string, cond: QBFilterQuery = {}, schema?: string): this {
    this.join(field, alias, cond, JoinType.innerJoin, undefined, schema);
    return this;
  }

  innerJoinLateral(field: string | Knex.QueryBuilder | QueryBuilder<any>, alias: string, cond: QBFilterQuery = {}, schema?: string): this {
    this.join(field, alias, cond, JoinType.innerJoinLateral, undefined, schema);
    return this;
  }

  leftJoin(field: string | Knex.QueryBuilder | QueryBuilder<any>, alias: string, cond: QBFilterQuery = {}, schema?: string): this {
    return this.join(field, alias, cond, JoinType.leftJoin, undefined, schema);
  }

  leftJoinLateral(field: string | Knex.QueryBuilder | QueryBuilder<any>, alias: string, cond: QBFilterQuery = {}, schema?: string): this {
    return this.join(field, alias, cond, JoinType.leftJoinLateral, undefined, schema);
  }

  joinAndSelect(field: string | [field: string, qb: Knex.QueryBuilder | QueryBuilder<any>], alias: string, cond: QBFilterQuery = {}, type = JoinType.innerJoin, path?: string, fields?: string[], schema?: string): SelectQueryBuilder<T> {
    if (!this.type) {
      this.select('*');
    }

    let subquery: string | undefined;

    if (Array.isArray(field)) {
      subquery = field[1] instanceof QueryBuilder ? field[1].getFormattedQuery() : field[1].toString();
      field = field[0];
    }

    const prop = this.joinReference(field, alias, cond, type, path, schema, subquery);
    const [fromAlias] = this.helper.splitField(field as EntityKey<T>);

    if (subquery) {
      this._joins[`${fromAlias}.${prop.name}#${alias}`].subquery = subquery;
    }

    const populate = this._joinedProps.get(fromAlias);
    const item = { field: prop.name, strategy: LoadStrategy.JOINED, children: [] };

    if (populate) {
      populate.children!.push(item);
    } else { // root entity
      this._populate.push(item);
    }

    this._joinedProps.set(alias, item);
    this.addSelect(this.getFieldsForJoinedLoad(prop, alias, fields));

    return this as SelectQueryBuilder<T>;
  }

  leftJoinAndSelect(field: string | [field: string, qb: Knex.QueryBuilder | QueryBuilder<any>], alias: string, cond: QBFilterQuery = {}, fields?: string[], schema?: string): SelectQueryBuilder<T> {
    return this.joinAndSelect(field, alias, cond, JoinType.leftJoin, undefined, fields, schema);
  }

  leftJoinLateralAndSelect(field: string | [field: string, qb: Knex.QueryBuilder | QueryBuilder<any>], alias: string, cond: QBFilterQuery = {}, fields?: string[], schema?: string): SelectQueryBuilder<T> {
    return this.joinAndSelect(field, alias, cond, JoinType.leftJoinLateral, undefined, fields, schema);
  }

  innerJoinAndSelect(field: string | [field: string, qb: Knex.QueryBuilder | QueryBuilder<any>], alias: string, cond: QBFilterQuery = {}, fields?: string[], schema?: string): SelectQueryBuilder<T> {
    return this.joinAndSelect(field, alias, cond, JoinType.innerJoin, undefined, fields, schema);
  }

  innerJoinLateralAndSelect(field: string | [field: string, qb: Knex.QueryBuilder | QueryBuilder<any>], alias: string, cond: QBFilterQuery = {}, fields?: string[], schema?: string): SelectQueryBuilder<T> {
    return this.joinAndSelect(field, alias, cond, JoinType.innerJoinLateral, undefined, fields, schema);
  }

  protected getFieldsForJoinedLoad(prop: EntityProperty<T>, alias: string, explicitFields?: string[]): Field<T>[] {
    const fields: Field<T>[] = [];
    const populate: PopulateOptions<T>[] = [];
    const joinKey = Object.keys(this._joins).find(join => join.endsWith(`#${alias}`));

    if (joinKey) {
      const path = this._joins[joinKey].path!.split('.').slice(1);
      let children = this._populate;

      for (let i = 0; i < path.length; i++) {
        const child = children.filter(hint => {
          const [propName] = hint.field.split(':', 2) as [EntityKey<T>];
          return propName === path[i];
        });

        children = child.flatMap(c => c.children) as any;
      }

      populate.push(...children);
    }

    prop.targetMeta!.props
      .filter(prop => explicitFields ? explicitFields.includes(prop.name) || prop.primary : this.platform.shouldHaveColumn(prop, populate))
      .forEach(prop => fields.push(...this.driver.mapPropToFieldNames<T>(this, prop, alias)));

    return fields;
  }

  withSubQuery(subQuery: Knex.QueryBuilder, alias: string): this {
    this.ensureNotFinalized();
    this.subQueries[alias] = subQuery.toString();
    return this;
  }

  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  where(cond: QBFilterQuery<T> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this {
    this.ensureNotFinalized();
    const rawField = RawQueryFragment.getKnownFragment(cond as string);

    if (rawField) {
      const sql = this.platform.formatQuery(rawField.sql, rawField.params);
      cond = { [raw(`(${sql})`)]: Utils.asArray(params) };
      operator ??= '$and';
    } else if (Utils.isString(cond)) {
      cond = { [raw(`(${cond})`, Utils.asArray(params))]: [] };
      operator ??= '$and';
    } else {
      cond = QueryHelper.processWhere({
        where: cond as FilterQuery<T>,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: !this.type || [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES),
      }) as FilterQuery<T>;
    }

    const op = operator || params as keyof typeof GroupOperator;
    const topLevel = !op || !Utils.hasObjectKeys(this._cond);
    const criteriaNode = CriteriaNodeFactory.createNode<T>(this.metadata, this.mainAlias.entityName, cond);
    const ignoreBranching = this.__populateWhere === 'infer';

    if ([QueryType.UPDATE, QueryType.DELETE].includes(this.type!) && criteriaNode.willAutoJoin(this, undefined, { ignoreBranching })) {
      // use sub-query to support joining
      this.setFlag(this.type === QueryType.UPDATE ? QueryFlag.UPDATE_SUB_QUERY : QueryFlag.DELETE_SUB_QUERY);
      this.select(this.mainAlias.metadata!.primaryKeys, true);
    }

    if (topLevel) {
      this._cond = criteriaNode.process(this, { ignoreBranching });
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(criteriaNode.process(this, { ignoreBranching }));
    } else {
      const cond1 = [this._cond, criteriaNode.process(this, { ignoreBranching })];
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

  orderBy(orderBy: QBQueryOrderMap<T> | QBQueryOrderMap<T>[]): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._orderBy = [];
    Utils.asArray<QBQueryOrderMap<T>>(orderBy).forEach(o => {
      const processed = QueryHelper.processWhere({
        where: o as Dictionary,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: !this.type || [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: false,
        type: 'orderBy',
      })!;
      this._orderBy.push(CriteriaNodeFactory.createNode<T>(this.metadata, this.mainAlias.entityName, processed).process(this, { matchPopulateJoins: true }));
    });

    return this as SelectQueryBuilder<T>;
  }

  groupBy(fields: (string | keyof T) | readonly (string | keyof T)[]): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._groupBy = Utils.asArray(fields);

    return this as SelectQueryBuilder<T>;
  }

  having(cond: QBFilterQuery | string = {}, params?: any[]): SelectQueryBuilder<T> {
    this.ensureNotFinalized();

    if (Utils.isString(cond)) {
      cond = { [raw(`(${cond})`, params)]: [] };
    }

    this._having = CriteriaNodeFactory.createNode<T>(this.metadata, this.mainAlias.entityName, cond).process(this);

    return this as SelectQueryBuilder<T>;
  }

  onConflict(fields: Field<T> | Field<T>[] = []): InsertQueryBuilder<T> {
    const meta = this.mainAlias.metadata as EntityMetadata<T>;
    this.ensureNotFinalized();
    this._onConflict ??= [];
    this._onConflict.push({
      fields: Utils.asArray(fields).flatMap(f => {
        const key = f.toString() as EntityKey<T>;
        /* istanbul ignore next */
        return meta.properties[key]?.fieldNames ?? [key];
      }),
    });
    return this as InsertQueryBuilder<T>;
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

    if (Array.isArray(data) && data.length === 0) {
      return this.ignore();
    }

    this._onConflict[this._onConflict.length - 1].merge = data;
    return this;
  }

  returning(fields?: Field<T> | Field<T>[]): this {
    this._returning = Utils.asArray(fields);
    return this;
  }

  /**
   * @internal
   */
  populate(populate: PopulateOptions<T>[], populateWhere?: ObjectQuery<T> | PopulateHint | `${PopulateHint}`): this {
    this.ensureNotFinalized();
    this._populate = populate;
    this._populateWhere = populateWhere;

    return this;
  }

  limit(limit?: number, offset = 0): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this as SelectQueryBuilder<T>;
  }

  offset(offset?: number): SelectQueryBuilder<T> {
    this.ensureNotFinalized();
    this._offset = offset;
    return this as SelectQueryBuilder<T>;
  }

  withSchema(schema?: string): this {
    this.ensureNotFinalized();
    this._schema = schema;

    return this;
  }

  setLockMode(mode?: LockMode, tables?: string[]): this {
    this.ensureNotFinalized();

    if (mode != null && mode !== LockMode.OPTIMISTIC && !this.context) {
      throw ValidationError.transactionRequired();
    }

    this.lockMode = mode;
    this.lockTables = tables;

    return this;
  }

  setFlushMode(flushMode?: FlushMode): this {
    this.ensureNotFinalized();
    this.flushMode = flushMode;
    return this;
  }

  setFlag(flag: QueryFlag): this {
    this.ensureNotFinalized();
    this.flags.add(flag);
    return this;
  }

  unsetFlag(flag: QueryFlag): this {
    this.ensureNotFinalized();
    this.flags.delete(flag);
    return this;
  }

  hasFlag(flag: QueryFlag): boolean {
    return this.flags.has(flag);
  }

  cache(config: boolean | number | [string, number] = true): this {
    this.ensureNotFinalized();
    this._cache = config;
    return this;
  }

  /**
   * Adds index hint to the FROM clause.
   */
  indexHint(sql: string): this {
    this.ensureNotFinalized();
    this._indexHint = sql;
    return this;
  }

  /**
   * Prepend comment to the sql query using the syntax `/* ... *&#8205;/`. Some characters are forbidden such as `/*, *&#8205;/` and `?`.
   */
  comment(comment: string | string[]): this {
    this.ensureNotFinalized();
    this._comments.push(...Utils.asArray(comment));
    return this;
  }

  /**
   * Add hints to the query using comment-like syntax `/*+ ... *&#8205;/`. MySQL and Oracle use this syntax for optimizer hints.
   * Also various DB proxies and routers use this syntax to pass hints to alter their behavior. In other dialects the hints
   * are ignored as simple comments.
   */
  hintComment(comment: string | string[]): this {
    this.ensureNotFinalized();
    this._hintComments.push(...Utils.asArray(comment));
    return this;
  }

  /**
   * Specifies FROM which entity's table select/update/delete will be executed, removing all previously set FROM-s.
   * Allows setting a main string alias of the selection data.
   */
  from<T extends AnyEntity<T> = AnyEntity>(target: QueryBuilder<T>, aliasName?: string): SelectQueryBuilder<T>;
  from<T extends AnyEntity<T> = AnyEntity>(target: EntityName<T>): SelectQueryBuilder<T>;
  from<T extends AnyEntity<T> = AnyEntity>(target: EntityName<T> | QueryBuilder<T>, aliasName?: string): SelectQueryBuilder<T> {
    this.ensureNotFinalized();

    if (target instanceof QueryBuilder) {
      this.fromSubQuery(target, aliasName);
    } else  {
      const entityName = Utils.className(target);

      if (aliasName && this._mainAlias && entityName !== this._mainAlias.aliasName) {
        throw new Error(`Cannot override the alias to '${aliasName}' since a query already contains references to '${this._mainAlias.aliasName}'`);
      }

      this.fromEntityName(entityName, aliasName);
    }

    return this as unknown as SelectQueryBuilder<T>;
  }

  getKnexQuery(processVirtualEntity = true): Knex.QueryBuilder {
    if (this._query?.qb) {
      return this._query.qb;
    }

    this._query = {} as any;
    this.finalize();
    const qb = this.getQueryBase(processVirtualEntity);
    const type = this.type ?? QueryType.SELECT;
    (qb as Dictionary).__raw = true; // tag it as there is now way to check via `instanceof`

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(type, this._cond, qb), this._cond && !this._onConflict);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy, 'groupBy')), this._groupBy);
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(type, this._having, qb, undefined, 'having'), this._having);
    Utils.runIfNotEmpty(() => {
      const queryOrder = this.helper.getQueryOrder(type, this._orderBy as FlatQueryOrderMap[], this._populateMap);

      if (queryOrder.length > 0) {
        const sql = Utils.unique(queryOrder).join(', ');
        qb.orderByRaw(sql);
        return;
      }
    }, this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit!), this._limit != null);
    Utils.runIfNotEmpty(() => qb.offset(this._offset!), this._offset);
    Utils.runIfNotEmpty(() => this._comments.forEach(comment => qb.comment(comment)), this._comments);
    Utils.runIfNotEmpty(() => this._hintComments.forEach(comment => qb.hintComment(comment)), this._hintComments);
    Utils.runIfNotEmpty(() => this.helper.appendOnConflictClause(type, this._onConflict!, qb), this._onConflict);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      return this._query!.qb = this.knex.raw(qb.toSQL().toNative().sql + ' cascade') as any;
    }

    if (this.lockMode) {
      this.helper.getLockSQL(qb, this.lockMode, this.lockTables);
    }

    this.helper.finalize(type, qb, this.mainAlias.metadata, this._data, this._returning);
    this.clearRawFragmentsCache();

    return this._query!.qb = qb;
  }

  /**
   * @internal
   */
  clearRawFragmentsCache(): void {
    this.rawFragments.forEach(key => RawQueryFragment.remove(key));
    this.rawFragments.clear();
  }

  /**
   * Returns the query with parameters as wildcards.
   */
  getQuery(): string {
    return this.toQuery().sql;
  }

  toQuery(): { sql: string; _sql: Knex.Sql; params: readonly unknown[] } {
    if (this._query?.sql) {
      return { sql: this._query.sql, _sql: this._query._sql!, params: this._query.params! };
    }

    const sql = this.getKnexQuery().toSQL();
    const query = sql.toNative();

    this._query!.sql = query.sql;
    this._query!._sql = sql;
    this._query!.params = query.bindings ?? [];

    return { sql: this._query!.sql, _sql: this._query!._sql, params: this._query!.params };
  }

  /**
   * Returns the list of all parameters for this query.
   */
  getParams(): readonly Knex.Value[] {
    return this.toQuery().params as Knex.Value[];
  }

  /**
   * Returns raw interpolated query string with all the parameters inlined.
   */
  getFormattedQuery(): string {
    const query = this.toQuery()._sql;
    return this.platform.formatQuery(query.sql, query.bindings);
  }

  /**
   * @internal
   */
  getAliasForJoinPath(path?: string | JoinOptions, options?: ICriteriaNodeProcessOptions): string | undefined {
    if (!path || path === this.mainAlias.entityName) {
      return this.mainAlias.aliasName;
    }

    const join = typeof path === 'string' ? this.getJoinForPath(path, options) : path;

    if (join?.path?.endsWith('[pivot]')) {
      return join.alias;
    }

    return join?.inverseAlias || join?.alias;
  }

  /**
   * @internal
   */
  getJoinForPath(path: string, options?: ICriteriaNodeProcessOptions): JoinOptions | undefined {
    const joins = Object.values(this._joins);

    if (joins.length === 0) {
      return undefined;
    }

    let join = joins.find(j => j.path === path);

    if (options?.preferNoBranch) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]|\[populate]/g, '') === path.replace(/\[\d+]|\[populate]/g, '');
      });
    }

    if (!join && options?.ignoreBranching) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]/g, '') === path.replace(/\[\d+]/g, '');
      });
    }

    if (!join && options?.matchPopulateJoins && options?.ignoreBranching) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]|\[populate]/g, '') === path.replace(/\[\d+]|\[populate]/g, '');
      });
    }

    if (!join && options?.matchPopulateJoins) {
      join = joins.find(j => {
        return j.path?.replace(/\[populate]/g, '') === path.replace(/\[populate]/g, '');
      });
    }

    return join;
  }

  /**
   * @internal
   */
  getNextAlias(entityName = 'e'): string {
    return this.driver.config.getNamingStrategy().aliasName(entityName, this.aliasCounter++);
  }

  /**
   * @internal
   */
  getAliasMap(): Dictionary<string> {
    return Object.fromEntries(Object.entries(this._aliases).map(([key, value]: [string, Alias<any>]) => [key, value.entityName]));
  }

  /**
   * Executes this QB and returns the raw results, mapped to the property names (unless disabled via last parameter).
   * Use `method` to specify what kind of result you want to get (array/single/meta).
   */
  async execute<U = any>(method: 'all' | 'get' | 'run' = 'all', options?: ExecuteOptions | boolean): Promise<U> {
    options = typeof options === 'boolean' ? { mapResults: options } : (options ?? {});
    options.mergeResults ??= true;
    options.mapResults ??= true;

    if (!this.connectionType && method !== 'run' && [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE, QueryType.TRUNCATE].includes(this.type ?? QueryType.SELECT)) {
      this.connectionType = 'write';
    }

    if (!this.finalized && method === 'get' && this.type === QueryType.SELECT) {
      this.limit(1);
    }

    const query = this.toQuery()._sql;
    const cached = await this.em?.tryCache<T, U>(this.mainAlias.entityName, this._cache, ['qb.execute', query.sql, query.bindings, method]);

    if (cached?.data) {
      return cached.data;
    }

    const write = method === 'run' || !this.platform.getConfig().get('preferReadReplicas');
    const type = this.connectionType || (write ? 'write' : 'read');
    const loggerContext = { id: this.em?.id, ...this.loggerContext };
    const res = await this.driver.getConnection(type).execute(query.sql, query.bindings as any[], method, this.context, loggerContext);
    const meta = this.mainAlias.metadata;

    if (!options.mapResults || !meta) {
      await this.em?.storeCache(this._cache, cached!, res);
      return res as unknown as U;
    }

    if (method === 'run') {
      return res as U;
    }

    const joinedProps = this.driver.joinedProps(meta, this._populate);
    let mapped: EntityData<T>[];

    if (Array.isArray(res)) {
      const map: Dictionary = {};
      mapped = res.map(r => this.driver.mapResult<T>(r as T, meta, this._populate, this, map)!);

      if (options.mergeResults && joinedProps.length > 0) {
        mapped = this.driver.mergeJoinedResult(mapped, this.mainAlias.metadata!, joinedProps);
      }
    } else {
      mapped = [this.driver.mapResult<T>(res, meta, joinedProps, this)!];
    }

    await this.em?.storeCache(this._cache, cached!, mapped);

    if (method === 'get') {
      return mapped[0] as U;
    }

    return mapped as U;
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
  async getResultList(limit?: number): Promise<T[]> {
    await this.em!.tryFlush(this.mainAlias.entityName, { flushMode: this.flushMode });
    const res = await this.execute<EntityData<T>[]>('all', true);
    const entities: T[] = [];

    function propagatePopulateHint<U extends object>(entity: U, hint: PopulateOptions<U>[]) {
      helper(entity).__serializationContext.populate ??= hint;
      hint.forEach(hint => {
        const [propName] = hint.field.split(':', 2) as [EntityKey<T>];
        const value = Reference.unwrapReference(entity[propName] as object);

        if (Utils.isEntity<U>(value)) {
          helper(value).populated();
          propagatePopulateHint<any>(value, hint.children ?? []);
        } else if (Utils.isCollection(value)) {
          value.populated();
          value.getItems(false).forEach(item => propagatePopulateHint<any>(item, hint.children ?? []));
        }
      });
    }

    for (const r of res) {
      const entity = this.em!.map<T>(this.mainAlias.entityName, r, { schema: this._schema });
      propagatePopulateHint(entity, this._populate);
      entities.push(entity);

      if (limit != null && --limit === 0) {
        break;
      }
    }

    return Utils.unique(entities);
  }

  /**
   * Executes the query, returning the first result or null
   */
  async getSingleResult(): Promise<T | null> {
    if (!this.finalized) {
      this.limit(1);
    }

    const [res] = await this.getResultList(1);
    return res || null;
  }

  /**
   * Executes count query (without offset and limit), returning total count of results
   */
  async getCount(field?: string | string[], distinct?: boolean): Promise<number> {
    let res: { count: number };

    if (this.type === QueryType.COUNT) {
      res = await this.execute<{ count: number }>('get', false);
    } else {
      const qb = this.type === undefined ? this : this.clone();
      qb.count(field, distinct ?? qb.hasToManyJoins()).limit(undefined).offset(undefined).orderBy([]);
      res = await qb.execute<{ count: number }>('get', false);
    }

    return res ? +res.count : 0;
  }

  /**
   * Executes the query, returning both array of results and total count query (without offset and limit).
   */
  async getResultAndCount(): Promise<[T[], number]> {
    return [
      await this.clone().getResultList(),
      await this.clone().getCount(),
    ];
  }

  /**
   * Provides promise-like interface so we can await the QB instance.
   */
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<T[] | number | QueryResult<T>> {
    let type = this.type ?? QueryType.SELECT;

    if (this.flags.has(QueryFlag.UPDATE_SUB_QUERY) || this.flags.has(QueryFlag.DELETE_SUB_QUERY)) {
      type = QueryType.UPDATE;
    }

    switch (type) {
      case QueryType.INSERT:
      case QueryType.UPDATE:
      case QueryType.DELETE:
      case QueryType.TRUNCATE:
        return this.execute('run').then(onfulfilled, onrejected) as any;
      case QueryType.COUNT:
        return this.getCount().then(onfulfilled, onrejected) as any;
      case QueryType.SELECT: return this.getResultList().then(onfulfilled, onrejected) as any;
    }
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
      alias = meta?.properties[f]?.fieldNames[0] ?? alias;
    }

    const ret = qb.as(alias);

    // tag the instance, so it is possible to detect it easily
    Object.defineProperty(ret, '__as', { enumerable: false, value: alias });

    return ret;
  }

  clone(reset?: boolean | string[]): QueryBuilder<T> {
    const qb = new QueryBuilder<T>(this.mainAlias.entityName, this.metadata, this.driver, this.context, this.mainAlias.aliasName, this.connectionType, this.em);

    if (reset === true) {
      return qb;
    }

    reset = reset || [];

    // clone array/object properties
    const properties = [
      'flags', '_populate', '_populateWhere', '__populateWhere', '_populateMap', '_joins', '_joinedProps', '_cond', '_data', '_orderBy',
      '_schema', '_indexHint', '_cache', 'subQueries', 'lockMode', 'lockTables', '_groupBy', '_having', '_returning',
      '_comments', '_hintComments', 'rawFragments', 'aliasCounter',
    ];

    RawQueryFragment.cloneRegistry = this.rawFragments;

    for (const prop of Object.keys(this)) {
      if (reset.includes(prop) || prop === '_helper') {
        continue;
      }

      (qb as any)[prop] = properties.includes(prop) ? Utils.copy(this[prop as keyof this]) : this[prop as keyof this];
    }

    delete RawQueryFragment.cloneRegistry;

    /* istanbul ignore else */
    if (this._fields && !reset.includes('_fields')) {
      qb._fields = [...this._fields];
    }

    qb._aliases = { ...this._aliases };
    (qb._helper as Dictionary).aliasMap = qb._aliases;
    qb.finalized = false;

    return qb;
  }

  getKnex(processVirtualEntity = true): Knex.QueryBuilder {
    const qb = this.knex.queryBuilder();
    const { subQuery, aliasName, entityName, metadata } = this.mainAlias;
    const ref = subQuery ? subQuery : this.knex.ref(this.helper.getTableName(entityName));

    if (this.finalized && (this._explicitAlias || this.helper.isTableNameAliasRequired(this.type))) {
      ref.as(aliasName);
    }

    const schema = this.getSchema(this.mainAlias);

    if (schema) {
      ref.withSchema(schema);
    }

    if (metadata?.virtual && processVirtualEntity) {
      qb.fromRaw(this.fromVirtual(metadata));
    } else {
      qb.from(ref);
    }

    if (this.context) {
      qb.transacting(this.context);
    }

    return qb;
  }

  /**
   * Sets logger context for this query builder.
   */
  setLoggerContext(context: LoggingOptions & Dictionary): void {
    this.loggerContext = context as LoggingOptions;
  }

  /**
   * Gets logger context for this query builder.
   */
  getLoggerContext<T extends Dictionary & LoggingOptions = Dictionary>(): T {
    this.loggerContext ??= {};
    return this.loggerContext as T;
  }

  private fromVirtual<T extends object>(meta: EntityMetadata<T>): string {
    if (typeof meta.expression === 'string') {
      return `(${meta.expression}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    const res = meta.expression!(this.em, this._cond as any, {});

    if (typeof res === 'string') {
      return `(${res}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    if (res instanceof QueryBuilder) {
      return `(${res.getFormattedQuery()}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    if (Utils.isObject<Knex.QueryBuilder | Knex.Raw>(res)) {
      const { sql, bindings } = res.toSQL();
      const query = this.platform.formatQuery(sql, bindings);
      return `(${query}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    /* istanbul ignore next */
    return res as unknown as string;
  }

  private joinReference(field: string | Knex.QueryBuilder | QueryBuilder, alias: string, cond: Dictionary, type: JoinType, path?: string, schema?: string, subquery?: string): EntityProperty<T> {
    this.ensureNotFinalized();

    if (typeof field === 'object') {
      const prop = {
        name: '__subquery__',
        kind: ReferenceKind.MANY_TO_ONE,
      } as EntityProperty;

      if (field instanceof QueryBuilder) {
        prop.type = field.mainAlias.entityName;
        prop.targetMeta = field.mainAlias.metadata!;
        field = field.getKnexQuery();
      }

      this._joins[`${this.alias}.${prop.name}#${alias}`] = {
        prop,
        alias,
        type,
        cond,
        schema,
        subquery: field.toString(),
        ownerAlias: this.alias,
      } as any;

      return prop;
    }

    if (!subquery && type.includes('lateral')) {
      throw new Error(`Lateral join can be used only with a sub-query.`);
    }

    const [fromAlias, fromField] = this.helper.splitField(field as EntityKey<T>);
    const q = (str: string) => `'${str}'`;

    if (!this._aliases[fromAlias]) {
      throw new Error(`Trying to join ${q(fromField)} with alias ${q(fromAlias)}, but ${q(fromAlias)} is not a known alias. Available aliases are: ${Object.keys(this._aliases).map(q).join(', ')}.`);
    }

    const entityName = this._aliases[fromAlias].entityName;
    const meta = this.metadata.get(entityName);
    const prop = meta.properties[fromField];

    if (!prop) {
      throw new Error(`Trying to join ${q(field)}, but ${q(fromField)} is not a defined relation on ${meta.className}.`);
    }

    this.createAlias(prop.type, alias);
    cond = QueryHelper.processWhere({
      where: cond,
      entityName: this.mainAlias.entityName,
      metadata: this.metadata,
      platform: this.platform,
      aliasMap: this.getAliasMap(),
      aliased: !this.type || [QueryType.SELECT, QueryType.COUNT].includes(this.type),
    })!;
    let aliasedName = `${fromAlias}.${prop.name}#${alias}`;
    path ??= `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? entityName)}.${prop.name}`;

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond, schema);
    } else if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      let pivotAlias = alias;

      if (type !== JoinType.pivotJoin) {
        const oldPivotAlias = this.getAliasForJoinPath(path + '[pivot]');
        pivotAlias = oldPivotAlias ?? this.getNextAlias(prop.pivotEntity);
        aliasedName = `${fromAlias}.${prop.name}#${pivotAlias}`;
      }

      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type, cond, path, schema);

      Object.assign(this._joins, joins);
      this.createAlias(prop.pivotEntity, pivotAlias);
    } else if (prop.kind === ReferenceKind.ONE_TO_ONE) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond, schema);
    } else { // MANY_TO_ONE
      this._joins[aliasedName] = this.helper.joinManyToOneReference(prop, fromAlias, alias, type, cond, schema);
    }

    if (!this._joins[aliasedName].path && path) {
      this._joins[aliasedName].path = path;
    }

    return prop;
  }

  protected prepareFields<T, U extends string | Knex.Raw>(fields: Field<T>[], type: 'where' | 'groupBy' | 'sub-query' = 'where'): U[] {
    const ret: Field<T>[] = [];
    const getFieldName = (name: string) => {
      if (type === 'groupBy') {
        return this.helper.mapper(name, this.type, undefined, null);
      }

      return this.helper.mapper(name, this.type);
    };

    fields.forEach(field => {
      const rawField = RawQueryFragment.getKnownFragment(field as string);

      if (rawField) {
        const sql = this.platform.formatQuery(rawField.sql, rawField.params);
        ret.push(this.knex.raw(sql) as Field<T>);
        return;
      }

      if (!Utils.isString(field)) {
        ret.push(field);
        return;
      }

      const join = Object.keys(this._joins).find(k => field === k.substring(0, k.indexOf('#')))!;

      if (join && type === 'where') {
        ret.push(...this.helper.mapJoinColumns(this.type ?? QueryType.SELECT, this._joins[join]) as string[]);
        return;
      }

      const [a, f] = this.helper.splitField(field as EntityKey<T>);
      const prop = this.helper.getProperty(f, a);

      /* istanbul ignore next */
      if (prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
        return;
      }

      if (prop?.persist === false && !prop.embedded && !prop.formula && type === 'where') {
        return;
      }

      if (prop?.embedded) {
        const name = prop.embeddedPath?.join('.') ?? prop.fieldNames[0];
        const aliased = this._aliases[a] ? `${a}.${name}` : name;
        ret.push(getFieldName(aliased));
        return;
      }

      if (prop?.kind === ReferenceKind.EMBEDDED) {
        if (prop.object) {
          ret.push(getFieldName(prop.fieldNames[0]));
        } else {
          const nest = (prop: EntityProperty): void => {
            for (const childProp of Object.values(prop.embeddedProps)) {
              if (childProp.fieldNames && (childProp.kind !== ReferenceKind.EMBEDDED || childProp.object) && childProp.persist !== false) {
                ret.push(getFieldName(childProp.fieldNames[0]));
              } else {
                nest(childProp);
              }
            }
          };
          nest(prop);
        }
        return;
      }

      if (prop && prop.fieldNames.length > 1) {
        ret.push(...prop.fieldNames.map(f => getFieldName(f)));
        return;
      }

      ret.push(getFieldName(field));
    });

    const meta = this.mainAlias.metadata;
    /* istanbul ignore next */
    const requiresSQLConversion = meta?.props.filter(p => p.hasConvertToJSValueSQL && p.persist !== false) ?? [];

    if (this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES) && (fields.includes('*') || fields.includes(`${this.mainAlias.aliasName}.*`)) && requiresSQLConversion.length > 0) {
      for (const p of requiresSQLConversion) {
        ret.push(this.helper.mapper(p.name, this.type));
      }
    }

    for (const f of Object.keys(this._populateMap)) {
      if (type === 'where' && this._joins[f]) {
        const cols = this.helper.mapJoinColumns(this.type ?? QueryType.SELECT, this._joins[f]);

        for (const col of cols) {
          ret.push(col as string);
        }
      }
    }

    return Utils.unique(ret) as U[];
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.ensureNotFinalized();
    this.type = type;

    if ([QueryType.UPDATE, QueryType.DELETE].includes(type) && Utils.hasObjectKeys(this._cond)) {
      throw new Error(`You are trying to call \`qb.where().${type.toLowerCase()}()\`. Calling \`qb.${type.toLowerCase()}()\` before \`qb.where()\` is required.`);
    }

    if (!this.helper.isTableNameAliasRequired(type)) {
      delete this._fields;
    }

    if (data) {
      if (Utils.isEntity(data)) {
        data = this.em?.getComparator().prepareEntity(data as T) ?? serialize(data as T);
      }

      this._data = this.helper.processData(data, this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES), false);
    }

    if (cond) {
      this.where(cond);
    }

    return this;
  }

  private getQueryBase(processVirtualEntity: boolean): Knex.QueryBuilder {
    const qb = this.getKnex(processVirtualEntity);
    const schema = this.getSchema(this.mainAlias);
    // Joined tables doesn't need to belong to the same schema as the main table
    const joinSchema = this._schema ?? this.em?.schema ?? schema;

    if (schema) {
      qb.withSchema(schema);
    }

    if (this._indexHint) {
      const alias = this.helper.isTableNameAliasRequired(this.type) ? ` as ${this.platform.quoteIdentifier(this.mainAlias.aliasName)}` : '';
      const schemaQuoted = schema ? this.platform.quoteIdentifier(schema) + '.' : '';
      const tableName = schemaQuoted + this.platform.quoteIdentifier(this.helper.getTableName(this.mainAlias.entityName)) + alias;
      qb.from(this.knex.raw(`${tableName} ${this._indexHint}`));
    }

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields!));

        if (this._distinctOn) {
          qb.distinctOn(this._distinctOn as string[]);
        } else if (this.flags.has(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins, joinSchema);
        break;
      case QueryType.COUNT: {
        const m = this.flags.has(QueryFlag.DISTINCT) ? 'countDistinct' : 'count';
        qb[m]({ count: this._fields!.map(f => this.helper.mapper(f as string, this.type)) });
        this.helper.processJoins(qb, this._joins, joinSchema);
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

  private applyDiscriminatorCondition(): void {
    const meta = this.mainAlias.metadata;

    if (!meta?.discriminatorValue) {
      return;
    }

    const types = Object.values(meta.root.discriminatorMap!).map(cls => this.metadata.find(cls)!);
    const children: EntityMetadata[] = [];
    const lookUpChildren = (ret: EntityMetadata[], type: string) => {
      const children = types.filter(meta2 => meta2.extends === type);
      children.forEach(m => lookUpChildren(ret, m.className));
      ret.push(...children.filter(c => c.discriminatorValue));

      return children;
    };
    lookUpChildren(children, meta.className);
    this.andWhere({
      [meta.root.discriminatorColumn!]: children.length > 0 ? { $in: [meta.discriminatorValue, ...children.map(c => c.discriminatorValue)] } : meta.discriminatorValue,
    });
  }

  private finalize(): void {
    if (this.finalized) {
      return;
    }

    if (!this.type) {
      this.select('*');
    }

    const meta = this.mainAlias.metadata as EntityMetadata<T>;
    this.applyDiscriminatorCondition();

    if (meta && this.flags.has(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)) {
      const relationsToPopulate = this._populate.map(({ field }) => field);
      meta.relations
        .filter(prop => prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name) && !relationsToPopulate.includes(`${prop.name}:ref` as any))
        .map(prop => ({ field: `${prop.name}:ref` as any }))
        .forEach(item => this._populate.push(item));
    }

    this._populate.forEach(({ field }) => {
      const [fromAlias, fromField] = this.helper.splitField(field);
      const aliasedField = `${fromAlias}.${fromField}`;
      const join = Object.keys(this._joins).find(k => `${aliasedField}#${this._joins[k].alias}` === k);

      if (join && this._joins[join] && this.helper.isOneToOneInverse(fromField)) {
        this._populateMap[join] = this._joins[join].alias;
        return;
      }

      if (meta && this.helper.isOneToOneInverse(fromField)) {
        const prop = meta.properties[fromField as EntityKey<T>];
        const alias = this.getNextAlias(prop.pivotEntity ?? prop.type);
        const aliasedName = `${fromAlias}.${prop.name}#${alias}`;
        this._joins[aliasedName] = this.helper.joinOneToReference(prop, this.mainAlias.aliasName, alias, JoinType.leftJoin);
        this._joins[aliasedName].path = `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? meta.className)}.${prop.name}`;
        this._populateMap[aliasedName] = this._joins[aliasedName].alias;
      }
    });

    if (meta && (this._fields?.includes('*') || this._fields?.includes(`${this.mainAlias.aliasName}.*`))) {
      meta.props
        .filter(prop => prop.formula && (!prop.lazy || this.flags.has(QueryFlag.INCLUDE_LAZY_FORMULAS)))
        .map(prop => {
          const alias = this.knex.ref(this.mainAlias.aliasName).toString();
          const aliased = this.knex.ref(prop.fieldNames[0]).toString();
          return `${prop.formula!(alias)} as ${aliased}`;
        })
        .filter(field => !this._fields!.some(f => {
          if (f instanceof RawQueryFragment) {
            return f.sql === field && f.params.length === 0;
          }

          return f === field;
        }))
        .forEach(field => this._fields!.push(raw(field)));
    }

    this.processPopulateWhere();

    QueryHelper.processObjectParams(this._data);
    QueryHelper.processObjectParams(this._cond);
    QueryHelper.processObjectParams(this._having);

    // automatically enable paginate flag when we detect to-many joins, but only if there is no `group by` clause
    if (!this.flags.has(QueryFlag.DISABLE_PAGINATE) && this._groupBy.length === 0 && this.hasToManyJoins()) {
      this.flags.add(QueryFlag.PAGINATE);
    }

    if (meta && this.flags.has(QueryFlag.PAGINATE) && (this._limit! > 0 || this._offset! > 0)) {
      this.wrapPaginateSubQuery(meta);
    }

    if (meta && (this.flags.has(QueryFlag.UPDATE_SUB_QUERY) || this.flags.has(QueryFlag.DELETE_SUB_QUERY))) {
      this.wrapModifySubQuery(meta);
    }

    this.finalized = true;
  }

  private processPopulateWhere() {
    if (this._populateWhere == null || this._populateWhere === PopulateHint.ALL) {
      return;
    }

    const joins = Object.values(this._joins);
    joins.forEach(join => {
      join.cond_ = join.cond;
      join.cond = {};
    });

    const replaceOnConditions = (cond: Dictionary, op?: string) => {
      Object.keys(cond).forEach(k => {
        if (Utils.isOperator(k)) {
          if (Array.isArray(cond[k])) {
            return cond[k].forEach((c: Dictionary) => replaceOnConditions(c, k));
          }

          /* istanbul ignore next */
          return replaceOnConditions(cond[k], k);
        }

        const [alias] = this.helper.splitField(k as EntityKey<T>);
        const join = joins.find(j => j.alias === alias);

        if (join) {
          if (join.cond[k]) {
            join.cond = { [op ?? '$and']: [join.cond, { [k]: cond[k] }] };
          } else if (op === '$or') {
            join.cond.$or ??= [];
            join.cond.$or.push({ [k]: cond[k] });
          } else {
            join.cond = { ...join.cond, [k]: cond[k] };
          }
        }
      });
    };

    if (typeof this._populateWhere === 'object') {
      const cond = CriteriaNodeFactory
          .createNode<T>(this.metadata, this.mainAlias.entityName, this._populateWhere)
          .process(this, { matchPopulateJoins: true, ignoreBranching: true, preferNoBranch: true });
      replaceOnConditions(cond);
    }
  }

  private hasToManyJoins(): boolean {
    return Object.values(this._joins).some(join => {
      return [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(join.prop.kind);
    });
  }

  protected wrapPaginateSubQuery(meta: EntityMetadata): void {
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query') as string[];
    const subQuery = this.clone(['_orderBy', '_fields']).select(pks).groupBy(pks).limit(this._limit!);
    // revert the on conditions added via populateWhere, we want to apply those only once
    Object.values(subQuery._joins).forEach(join => join.cond = join.cond_ ?? {});

    if (this._offset) {
      subQuery.offset(this._offset);
    }

    const addToSelect = [];

    if (this._orderBy.length > 0) {
      const orderBy = [];

      for (const orderMap of this._orderBy) {
        for (const [field, direction] of Object.entries(orderMap)) {
          if (RawQueryFragment.isKnownFragment(field)) {
            const rawField = RawQueryFragment.getKnownFragment(field, false)!;
            this.rawFragments.add(field);
            orderBy.push({ [rawField.clone() as any]: direction });
            continue;
          }

          const [a, f] = this.helper.splitField(field as EntityKey<T>);
          const prop = this.helper.getProperty(f, a);
          const type = this.platform.castColumn(prop);
          const fieldName = this.helper.mapper(field, this.type, undefined, null);

          if (!prop?.persist && !prop?.formula && !pks.includes(fieldName)) {
            addToSelect.push(fieldName);
          }

          const key = raw(`min(${this.knex.ref(fieldName)}${type})`);
          orderBy.push({ [key]: direction });
        }
      }

      subQuery.orderBy(orderBy);
    }

    subQuery.finalized = true;
    const knexQuery = subQuery.as(this.mainAlias.aliasName).clearSelect().select(pks);

    if (addToSelect.length > 0) {
      addToSelect.forEach(prop => {
        const field = this._fields!.find(field => {
          if (typeof field === 'object' && field && '__as' in field) {
            return field.__as === prop;
          }

          if (field instanceof RawQueryFragment) {
            // not perfect, but should work most of the time, ideally we should check only the alias (`... as alias`)
            return field.sql.includes(prop);
          }

          return false;
        });

        if (field instanceof RawQueryFragment) {
          knexQuery.select(this.platform.formatQuery(field.sql, field.params));
        } else if (field) {
          knexQuery.select(field as string);
        }
      });
    }

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.getKnex().select(pks).from(knexQuery);
    (subSubQuery as Dictionary).__raw = true; // tag it as there is now way to check via `instanceof`
    this._limit = undefined;
    this._offset = undefined;

    // remove joins that are not used for population or ordering to improve performance
    const populate = new Set<string>();
    const orderByAliases = this._orderBy
      .flatMap(hint => Object.keys(hint))
      .map(k => k.split('.')[0]);

    function addPath(hints: PopulateOptions<any>[], prefix = '') {
      for (const hint of hints) {
        const field = hint.field.split(':')[0];
        populate.add((prefix ? prefix + '.' : '') + field);

        if (hint.children) {
          addPath(hint.children, (prefix ? prefix + '.' : '') + field);
        }
      }
    }

    addPath(this._populate);

    for (const [key, join] of Object.entries(this._joins)) {
      const path = join.path?.replace(/\[populate]|\[pivot]|:ref/g, '').replace(new RegExp(`^${meta.className}.`), '');

      if (!populate.has(path ?? '') && !orderByAliases.includes(join.alias)) {
        delete this._joins[key];
      }
    }

    this.select(this._fields!).where({ [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubQuery } });
  }

  private wrapModifySubQuery(meta: EntityMetadata): void {
    const subQuery = this.clone();
    subQuery.finalized = true;

    // wrap one more time to get around MySQL limitations
    // https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
    const subSubQuery = this.getKnex().select(this.prepareFields(meta.primaryKeys)).from(subQuery.as(this.mainAlias.aliasName));
    const method = this.flags.has(QueryFlag.UPDATE_SUB_QUERY) ? 'update' : 'delete';
    this._cond = {}; // otherwise we would trigger validation error

    this[method](this._data as EntityData<T>).where({
      [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: subSubQuery },
    });
  }

  private getSchema(alias: Alias<any>): string | undefined {
    const { metadata } = alias;
    const metaSchema = metadata?.schema && metadata.schema !== '*' ? metadata.schema : undefined;
    return this._schema ?? metaSchema ?? this.em?.schema ?? this.em?.config.get('schema');
  }

  private createAlias<U = unknown>(entityName: string, aliasName: string, subQuery?: Knex.QueryBuilder): Alias<U> {
    const metadata = this.metadata.find(entityName)!;
    const alias = { aliasName, entityName, metadata, subQuery };
    this._aliases[aliasName] = alias;
    return alias;
  }

  private createMainAlias(entityName: string, aliasName: string, subQuery?: Knex.QueryBuilder): Alias<T> {
    this._mainAlias = this.createAlias(entityName, aliasName, subQuery);
    this._helper = this.createQueryBuilderHelper();
    return this._mainAlias;
  }

  private fromSubQuery<T extends AnyEntity<T> = AnyEntity>(target: QueryBuilder<T>, aliasName?: string): void {
    const subQuery = target.getKnexQuery();
    const { entityName } = target.mainAlias;
    aliasName ??= this.getNextAlias(entityName);

    this.createMainAlias(entityName, aliasName, subQuery);
  }

  private fromEntityName(entityName: string, aliasName?: string): void {
    aliasName ??= this._mainAlias?.aliasName ?? this.getNextAlias(entityName);

    this.createMainAlias(entityName, aliasName);
  }

  private createQueryBuilderHelper(): QueryBuilderHelper {
    return new QueryBuilderHelper(this.mainAlias.entityName, this.mainAlias.aliasName, this._aliases, this.subQueries, this.knex, this.driver);
  }

  private ensureFromClause(): void {
    /* istanbul ignore next */
    if (!this._mainAlias) {
      throw new Error(`Cannot proceed to build a query because the main alias is not set.`);
    }
  }

  private ensureNotFinalized(): void {
    if (this.finalized) {
      throw new Error('This QueryBuilder instance is already finalized, clone it first if you want to modify it.');
    }
  }

  /* istanbul ignore next */
  /** @ignore */
  [inspect.custom](depth: number) {
    const object = { ...this } as Dictionary;
    const hidden = ['metadata', 'driver', 'context', 'platform', 'knex', 'type'];
    Object.keys(object).filter(k => k.startsWith('_')).forEach(k => delete object[k]);
    Object.keys(object).filter(k => object[k] == null).forEach(k => delete object[k]);
    hidden.forEach(k => delete object[k]);
    let prefix = this.type ? this.type.substring(0, 1) + this.type.toLowerCase().substring(1) : '';

    if (this._data) {
      object.data = this._data;
    }

    if (this._schema) {
      object.schema = this._schema;
    }

    if (!Utils.isEmpty(this._cond)) {
      object.where = this._cond;
    }

    if (this._onConflict?.[0]) {
      prefix = 'Upsert';
      object.onConflict = this._onConflict[0];
    }

    if (!Utils.isEmpty(this._orderBy)) {
      object.orderBy = this._orderBy;
    }

    const name = this._mainAlias ? `${prefix}QueryBuilder<${this._mainAlias?.entityName}>` : 'QueryBuilder';
    const ret = inspect(object, { depth });

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

export interface RunQueryBuilder<T extends object> extends Omit<QueryBuilder<T>, 'getResult' | 'getSingleResult' | 'getResultList' | 'where'> {
  where(cond: QBFilterQuery<T> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this;
  execute<U = QueryResult<T>>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<U>;
  then<TResult1 = QueryResult<T>, TResult2 = never>(onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<QueryResult<T>>;
}

export interface SelectQueryBuilder<T extends object> extends QueryBuilder<T> {
  execute<U = T[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<U>;
  execute<U = T[]>(method: 'all', mapResults?: boolean): Promise<U>;
  execute<U = T>(method: 'get', mapResults?: boolean): Promise<U>;
  execute<U = QueryResult<T>>(method: 'run', mapResults?: boolean): Promise<U>;
  then<TResult1 = T[], TResult2 = never>(onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<T[]>;
}

export interface CountQueryBuilder<T extends object> extends QueryBuilder<T> {
  execute<U = { count: number }[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<U>;
  execute<U = { count: number }[]>(method: 'all', mapResults?: boolean): Promise<U>;
  execute<U = { count: number }>(method: 'get', mapResults?: boolean): Promise<U>;
  execute<U = QueryResult<{ count: number }>>(method: 'run', mapResults?: boolean): Promise<U>;
  then<TResult1 = number, TResult2 = never>(onfulfilled?: ((value: number) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<number>;
}

export interface InsertQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface UpdateQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface DeleteQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface TruncateQueryBuilder<T extends object> extends RunQueryBuilder<T> {}
