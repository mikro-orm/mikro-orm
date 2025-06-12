import { inspect } from 'node:util';
import {
  type AnyEntity,
  type ConnectionType,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityManager,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type ExpandProperty,
  type FilterQuery,
  type FlatQueryOrderMap,
  type FlushMode,
  type GroupOperator,
  helper,
  isRaw,
  type Loaded,
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
  type Transaction,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { JoinType, QueryType } from './enums.js';
import type { AbstractSqlDriver } from '../AbstractSqlDriver.js';
import { type Alias, type OnConflictClause, QueryBuilderHelper } from './QueryBuilderHelper.js';
import type { SqlEntityManager } from '../SqlEntityManager.js';
import { CriteriaNodeFactory } from './CriteriaNodeFactory.js';
import type { Field, ICriteriaNodeProcessOptions, JoinOptions } from '../typings.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import { NativeQueryBuilder } from './NativeQueryBuilder.js';

export interface ExecuteOptions {
  mapResults?: boolean;
  mergeResults?: boolean;
}

type AnyString = string & {};
type Compute<T> = { [K in keyof T]: T[K] } & {};
type IsNever<T, True = true, False = false> = [T] extends [never] ? True : False;
type GetAlias<T extends string> = T extends `${infer A}.${string}` ? A : never;
type GetPropName<T extends string> = T extends `${string}.${infer P}` ? P : T;
type AppendToHint<Parent extends string, Child extends string> = `${Parent}.${Child}`;
type AddToContext<Type extends object, Context, Field extends string, Alias extends string, Select extends boolean> = { [K in Alias]: [GetPath<Context, Field>, K, ExpandProperty<Type[GetPropName<Field> & keyof Type]>, Select] };

type GetPath<Context, Field extends string> = GetAlias<Field> extends infer Alias
  ? IsNever<Alias> extends true
    ? GetPropName<Field>
    : Alias extends keyof Context
      ? Context[Alias] extends [infer Path, ...any[]]
        ? AppendToHint<Path & string, GetPropName<Field>>
        : GetPropName<Field>
      : GetPropName<Field>
  : GetPropName<Field>;

type GetType<Type extends object, Context, Field extends string> = GetAlias<Field> extends infer Alias
  ? IsNever<Alias> extends true
    ? Type
    : Alias extends keyof Context
      ? Context[Alias] extends [string, string, infer PropType]
        ? PropType & object
        : Type
      : Type
  : Type;

type AddToHint<RootAlias, Context, Field extends string, Select extends boolean = false> = Select extends true
  ? GetAlias<Field> extends infer Alias
    ? IsNever<Alias> extends true
      ? GetPropName<Field>
      : Alias extends RootAlias
        ? GetPropName<Field>
        : Alias extends keyof Context
          ? Context[Alias] extends [infer Path, ...any[]]
            ? AppendToHint<Path & string, GetPropName<Field>>
            : GetPropName<Field>
          : GetPropName<Field>
    : GetPropName<Field>
  : never;

export type ModifyHint<RootAlias, Context, Hint extends string, Field extends string, Select extends boolean = false> = Hint | AddToHint<RootAlias, Context, Field, Select>;

export type ModifyContext<Entity extends object, Context, Field extends string, Alias extends string, Select extends boolean = false> = Compute<IsNever<Context> extends true
  ? AddToContext<GetType<Entity, object, Field>, object, Field, Alias, Select>
  : Context & AddToContext<GetType<Entity, Context, Field>, Context, Field, Alias, Select>>;

type EntityRelations<T> = EntityKey<T, true>;
type AddAliasesFromContext<Context> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, infer Type, any]
      ? `${Alias & string}.${EntityRelations<Type & {}>}`
      : never
    : never
  : never;

// TODO(v7): remove the `AnyString` and force people to keep the context on type level (either fluent interface or reassigning the QB)?
export type QBField<Entity, RootAlias extends string, Context> = (EntityRelations<Entity> | `${RootAlias}.${EntityRelations<Entity>}` | AddAliasesFromContext<Context>) & {} | AnyString;

type EntityKeyOrString<Entity extends object = AnyEntity> = AnyString | keyof Entity;

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
export class QueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> {

  get mainAlias(): Alias<Entity> {
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

  get type(): QueryType {
    return this._type ?? QueryType.SELECT;
  }

  /** @internal */
  declare _type?: QueryType;
  /** @internal */
  declare _fields?: Field<Entity>[];
  /** @internal */
  _populate: PopulateOptions<Entity>[] = [];
  /** @internal */
  declare _populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  declare _populateFilter?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  declare __populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  _populateMap: Dictionary<string> = {};
  /** @internal */
  readonly rawFragments = new Set<string>();

  protected aliasCounter = 0;
  protected flags: Set<QueryFlag> = new Set([QueryFlag.CONVERT_CUSTOM_TYPES]);
  protected finalized = false;
  protected populateHintFinalized = false;
  protected _joins: Dictionary<JoinOptions> = {};
  protected _explicitAlias = false;
  protected _schema?: string;
  protected _cond: Dictionary = {};
  protected _data!: Dictionary;
  protected _orderBy: QueryOrderMap<Entity>[] = [];
  protected _groupBy: Field<Entity>[] = [];
  protected _having: Dictionary = {};
  protected _returning?: Field<Entity>[];
  protected _onConflict?: OnConflictClause<Entity>[];
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
  protected _mainAlias?: Alias<Entity>;
  protected _aliases: Dictionary<Alias<any>> = {};
  protected _helper?: QueryBuilderHelper;
  protected _query?: { sql?: string; params?: readonly unknown[]; qb: NativeQueryBuilder };
  protected readonly platform: AbstractSqlPlatform;

  /**
   * @internal
   */
  constructor(
    entityName: EntityName<Entity> | QueryBuilder<Entity, any, any>,
    protected readonly metadata: MetadataStorage,
    protected readonly driver: AbstractSqlDriver,
    protected readonly context?: Transaction,
    alias?: string,
    protected connectionType?: ConnectionType,
    protected em?: SqlEntityManager,
    protected loggerContext?: LoggingOptions & Dictionary,
  ) {
    this.platform = this.driver.getPlatform();

    if (alias) {
      this.aliasCounter++;
      this._explicitAlias = true;
    }

    // @ts-expect-error union type does not match the overloaded method signature
    this.from(entityName, alias);
  }

  select(fields: Field<Entity> | Field<Entity>[], distinct = false): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._fields = Utils.asArray(fields);

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT) as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  addSelect(fields: Field<Entity> | Field<Entity>[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();

    if (this._type && this._type !== QueryType.SELECT) {
      return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
    }

    return this.select([...Utils.asArray(this._fields), ...Utils.asArray(fields)]);
  }

  distinct(): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    return this.setFlag(QueryFlag.DISTINCT) as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  /** postgres only */
  distinctOn(fields: EntityKeyOrString<Entity> | EntityKeyOrString<Entity>[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._distinctOn = Utils.asArray(fields) as string[];
    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  insert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]): InsertQueryBuilder<Entity> {
    return this.init(QueryType.INSERT, data) as InsertQueryBuilder<Entity>;
  }

  update(data: EntityData<Entity>): UpdateQueryBuilder<Entity> {
    return this.init(QueryType.UPDATE, data) as UpdateQueryBuilder<Entity>;
  }

  delete(cond?: QBFilterQuery): DeleteQueryBuilder<Entity> {
    return this.init(QueryType.DELETE, undefined, cond) as DeleteQueryBuilder<Entity>;
  }

  truncate(): TruncateQueryBuilder<Entity> {
    return this.init(QueryType.TRUNCATE) as TruncateQueryBuilder<Entity>;
  }

  count(field?: EntityKeyOrString<Entity> | EntityKeyOrString<Entity>[], distinct = false): CountQueryBuilder<Entity> {
    if (field) {
      this._fields = Utils.asArray(field);
    } else if (distinct || this.hasToManyJoins()) {
      this._fields = this.mainAlias.metadata!.primaryKeys;
    } else {
      this._fields = [raw('*')];
    }

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT) as CountQueryBuilder<Entity>;
  }

  join<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: QBFilterQuery = {},
    type = JoinType.innerJoin,
    path?: string,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>> {
    this.joinReference(field, alias, cond, type, path, schema);
    return this as any;
  }

  innerJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: QBFilterQuery = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>> {
    this.join(field, alias, cond, JoinType.innerJoin, undefined, schema);
    return this as any;
  }

  innerJoinLateral(field: RawQueryFragment | QueryBuilder<any>, alias: string, cond: QBFilterQuery, schema?: string): this {
    this.join(field, alias, cond, JoinType.innerJoinLateral, undefined, schema);
    return this;
  }

  leftJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: QBFilterQuery = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>> {
    return this.join(field, alias, cond, JoinType.leftJoin, undefined, schema);
  }

  leftJoinLateral(field: RawQueryFragment | QueryBuilder<any>, alias: string, cond: QBFilterQuery, schema?: string): this {
    return this.join(field, alias, cond, JoinType.leftJoinLateral, undefined, schema) as any;
  }

  joinAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | [field: Field, qb: RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: QBFilterQuery = {},
    type = JoinType.innerJoin,
    path?: string,
    fields?: string[],
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field, true> & {}, ModifyContext<Entity, Context, Field, Alias, true>> {
    if (!this._type) {
      this.select('*');
    }

    let subquery: string | undefined;

    if (Array.isArray(field)) {
      const rawFragment = field[1] instanceof QueryBuilder ? field[1].toRaw() : field[1];
      subquery = this.platform.formatQuery(rawFragment.sql, rawFragment.params);
      field = field[0];
    }

    const prop = this.joinReference(field, alias, cond, type, path, schema, subquery);
    const [fromAlias] = this.helper.splitField(field as EntityKey<Entity>);

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

    return this as any;
  }

  leftJoinAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | [field: Field, qb: RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: QBFilterQuery = {},
    fields?: string[],
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field, true> & {}, ModifyContext<Entity, Context, Field, Alias, true>> {
    return this.joinAndSelect(field, alias, cond, JoinType.leftJoin, undefined, fields, schema);
  }

  leftJoinLateralAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: [field: Field, qb: RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: QBFilterQuery = {},
    fields?: string[],
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field, true> & {}, ModifyContext<Entity, Context, Field, Alias, true>> {
    return this.joinAndSelect(field, alias, cond, JoinType.leftJoinLateral, undefined, fields, schema);
  }

  innerJoinAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | [field: Field, qb: RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: QBFilterQuery = {},
    fields?: string[],
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field, true> & {}, ModifyContext<Entity, Context, Field, Alias, true>> {
    return this.joinAndSelect(field, alias, cond, JoinType.innerJoin, undefined, fields, schema);
  }

  innerJoinLateralAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: [field: Field, qb: RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: QBFilterQuery = {},
    fields?: string[],
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field, true> & {}, ModifyContext<Entity, Context, Field, Alias, true>> {
    return this.joinAndSelect(field, alias, cond, JoinType.innerJoinLateral, undefined, fields, schema);
  }

  protected getFieldsForJoinedLoad(prop: EntityProperty<Entity>, alias: string, explicitFields?: string[]): Field<Entity>[] {
    const fields: Field<Entity>[] = [];
    const populate: PopulateOptions<Entity>[] = [];
    const joinKey = Object.keys(this._joins).find(join => join.endsWith(`#${alias}`));

    if (joinKey) {
      const path = this._joins[joinKey].path!.split('.').slice(1);
      let children = this._populate;

      for (let i = 0; i < path.length; i++) {
        const child = children.filter(hint => {
          const [propName] = hint.field.split(':', 2) as [EntityKey<Entity>];
          return propName === path[i];
        });

        children = child.flatMap(c => c.children) as any;
      }

      populate.push(...children);
    }

    for (const p of prop.targetMeta!.getPrimaryProps()) {
      fields.push(...this.driver.mapPropToFieldNames<Entity>(this, p, alias));
    }

    if (explicitFields) {
      for (const field of explicitFields) {
        const [a, f] = this.helper.splitField(field as EntityKey<Entity>);
        const p = prop.targetMeta!.properties[f];

        if (p) {
          fields.push(...this.driver.mapPropToFieldNames<Entity>(this, p, alias));
        } else {
          fields.push(`${a}.${f} as ${a}__${f}`);
        }
      }
    }

    prop.targetMeta!.props
      .filter(prop => {
        if (!explicitFields) {
          return this.platform.shouldHaveColumn(prop, populate);
        }

        return prop.primary && !explicitFields.includes(prop.name) && !explicitFields.includes(`${alias}.${prop.name}`);
      })
      .forEach(prop => fields.push(...this.driver.mapPropToFieldNames<Entity>(this, prop, alias)));

    return fields;
  }

  /**
   * Apply filters to the QB where condition.
   */
  async applyFilters(filterOptions: Dictionary<boolean | Dictionary> | string[] | boolean = {}): Promise<void> {
    /* v8 ignore next 3 */
    if (!this.em) {
      throw new Error('Cannot apply filters, this QueryBuilder is not attached to an EntityManager');
    }

    const cond = await this.em.applyFilters(this.mainAlias.entityName, {}, filterOptions, 'read');
    this.andWhere(cond!);
  }

  private readonly autoJoinedPaths: string[] = [];

  /**
   * @internal
   */
  scheduleFilterCheck(path: string): void {
    this.autoJoinedPaths.push(path);
  }

  /**
   * @internal
   */
  async applyJoinedFilters(em: EntityManager, filterOptions: Dictionary<boolean | Dictionary> | string[] | boolean = {}): Promise<void> {
    for (const path of this.autoJoinedPaths) {
      const join = this.getJoinForPath(path)!;

      if (join.type === JoinType.pivotJoin) {
        continue;
      }

      const cond = await em.applyFilters(join.prop.type, join.cond, filterOptions, 'read');

      if (Utils.hasObjectKeys(cond)) {
        // remove nested filters, we only care about scalars here, nesting would require another join branch
        for (const key of Object.keys(cond)) {
          if (Utils.isPlainObject(cond[key]) && Object.keys(cond[key]).every(k => !(Utils.isOperator(k) && !['$some', '$none', '$every'].includes(k)))) {
            delete cond[key];
          }
        }

        if (Utils.hasObjectKeys(join.cond)) {
          /* istanbul ignore next */
          join.cond = { $and: [join.cond, cond] };
        } else {
          join.cond = { ...cond };
        }
      }
    }
  }

  withSubQuery(subQuery: RawQueryFragment | NativeQueryBuilder, alias: string): this {
    this.ensureNotFinalized();

    if (subQuery instanceof RawQueryFragment) {
      this.subQueries[alias] = this.platform.formatQuery(subQuery.sql, subQuery.params);
    } else {
      this.subQueries[alias] = subQuery.toString();
    }

    return this;
  }

  where(cond: QBFilterQuery<Entity>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  where(cond: QBFilterQuery<Entity> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this {
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
        where: cond as FilterQuery<Entity>,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES),
      }) as FilterQuery<Entity>;
    }

    const op = operator || params as keyof typeof GroupOperator;
    const topLevel = !op || !Utils.hasObjectKeys(this._cond);
    const criteriaNode = CriteriaNodeFactory.createNode<Entity>(this.metadata, this.mainAlias.entityName, cond);
    const ignoreBranching = this.__populateWhere === 'infer';

    if ([QueryType.UPDATE, QueryType.DELETE].includes(this.type) && criteriaNode.willAutoJoin(this, undefined, { ignoreBranching })) {
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
      this._onConflict[this._onConflict.length - 1].where = this.helper.processOnConflictCondition(this._cond, this._schema);
      this._cond = {};
    }

    return this;
  }

  andWhere(cond: QBFilterQuery<Entity>): this;
  andWhere(cond: string, params?: any[]): this;
  andWhere(cond: QBFilterQuery<Entity> | string, params?: any[]): this {
    return this.where(cond as string, params, '$and');
  }

  orWhere(cond: QBFilterQuery<Entity>): this;
  orWhere(cond: string, params?: any[]): this;
  orWhere(cond: QBFilterQuery<Entity> | string, params?: any[]): this {
    return this.where(cond as string, params, '$or');
  }

  orderBy(orderBy: QBQueryOrderMap<Entity> | QBQueryOrderMap<Entity>[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._orderBy = [];
    Utils.asArray<QBQueryOrderMap<Entity>>(orderBy).forEach(o => {
      const processed = QueryHelper.processWhere({
        where: o as Dictionary,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: false,
        type: 'orderBy',
      })!;
      this._orderBy.push(CriteriaNodeFactory.createNode<Entity>(this.metadata, this.mainAlias.entityName, processed).process(this, { matchPopulateJoins: true, type: 'orderBy' }));
    });

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  groupBy(fields: EntityKeyOrString<Entity> | readonly EntityKeyOrString<Entity>[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._groupBy = Utils.asArray(fields);

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  having(cond: QBFilterQuery | string = {}, params?: any[], operator?: keyof typeof GroupOperator): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();

    if (Utils.isString(cond)) {
      cond = { [raw(`(${cond})`, params)]: [] };
    }

    cond = CriteriaNodeFactory.createNode<Entity>(this.metadata, this.mainAlias.entityName, cond).process(this);

    if (!this._having || !operator) {
      this._having = cond as QBFilterQuery<Entity>;
    } else {
      const cond1 = [this._having, cond];
      this._having = { [operator]: cond1 };
    }

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  andHaving(cond?: QBFilterQuery | string, params?: any[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    return this.having(cond, params, '$and');
  }

  orHaving(cond?: QBFilterQuery | string, params?: any[]): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    return this.having(cond, params, '$or');
  }

  onConflict(fields: Field<Entity> | Field<Entity>[] = []): InsertQueryBuilder<Entity> {
    const meta = this.mainAlias.metadata as EntityMetadata<Entity>;
    this.ensureNotFinalized();
    this._onConflict ??= [];
    this._onConflict.push({
      fields: isRaw(fields)
        ? fields
        : Utils.asArray(fields).flatMap(f => {
          const key = f.toString() as EntityKey<Entity>;
          /* v8 ignore next */
          return meta.properties[key]?.fieldNames ?? [key];
        }),
    });
    return this as InsertQueryBuilder<Entity>;
  }

  ignore(): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.ignore()`');
    }

    this._onConflict[this._onConflict.length - 1].ignore = true;
    return this;
  }

  merge(data?: EntityData<Entity> | Field<Entity>[]): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.merge()`');
    }

    if (Array.isArray(data) && data.length === 0) {
      return this.ignore();
    }

    this._onConflict[this._onConflict.length - 1].merge = data;
    return this;
  }

  returning(fields?: Field<Entity> | Field<Entity>[]): this {
    this._returning = Utils.asArray(fields);
    return this;
  }

  /**
   * @internal
   */
  populate(
    populate: PopulateOptions<Entity>[],
    populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`,
    populateFilter?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`,
  ): this {
    this.ensureNotFinalized();
    this._populate = populate;
    this._populateWhere = populateWhere;
    this._populateFilter = populateFilter;

    return this;
  }

  limit(limit?: number, offset = 0): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  offset(offset?: number): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
    this.ensureNotFinalized();
    this._offset = offset;
    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
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
  from<Entity extends AnyEntity<Entity> = AnyEntity>(target: QueryBuilder<Entity>, aliasName?: string): SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  from<Entity extends AnyEntity<Entity> = AnyEntity>(target: EntityName<Entity>): SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  from<Entity extends AnyEntity<Entity> = AnyEntity>(target: EntityName<Entity> | QueryBuilder<Entity>, aliasName?: string): SelectQueryBuilder<Entity, RootAlias, Hint, Context> {
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

    return this as unknown as SelectQueryBuilder<Entity, RootAlias, Hint, Context>;
  }

  getNativeQuery(processVirtualEntity = true): NativeQueryBuilder {
    if (this._query?.qb) {
      return this._query.qb;
    }

    this._query = {} as any;
    this.finalize();
    const qb = this.getQueryBase(processVirtualEntity);

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._cond, qb), this._cond && !this._onConflict);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy, 'groupBy')), this._groupBy);
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._having, qb, undefined, 'having'), this._having);
    Utils.runIfNotEmpty(() => {
      const queryOrder = this.helper.getQueryOrder(this.type, this._orderBy as FlatQueryOrderMap[], this._populateMap);

      if (queryOrder.length > 0) {
        const sql = Utils.unique(queryOrder).join(', ');
        qb.orderBy(sql);
        return;
      }
    }, this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit!), this._limit != null);
    Utils.runIfNotEmpty(() => qb.offset(this._offset!), this._offset);
    Utils.runIfNotEmpty(() => qb.comment(this._comments), this._comments);
    Utils.runIfNotEmpty(() => qb.hintComment(this._hintComments), this._hintComments);
    Utils.runIfNotEmpty(() => this.helper.appendOnConflictClause(QueryType.UPSERT, this._onConflict!, qb), this._onConflict);

    if (this.lockMode) {
      this.helper.getLockSQL(qb, this.lockMode, this.lockTables);
    }

    this.processReturningStatement(qb, this.mainAlias.metadata, this._data, this._returning);
    this.clearRawFragmentsCache();

    return this._query!.qb = qb;
  }

  protected processReturningStatement(qb: NativeQueryBuilder, meta?: EntityMetadata, data?: Dictionary, returning?: Field<any>[]): void {
    const usesReturningStatement = this.platform.usesReturningStatement() || this.platform.usesOutputStatement();

    if (!meta || !data || !usesReturningStatement) {
      return;
    }

    const arr = Utils.asArray(data);

    // always respect explicit returning hint
    if (returning && returning.length > 0) {
      qb.returning(returning.map(field => this.helper.mapper(field as string, this.type)));

      return;
    }

    if (this.type === QueryType.INSERT) {
      const returningProps = meta.hydrateProps
        .filter(prop => prop.returning || (prop.persist !== false && ((prop.primary && prop.autoincrement) || prop.defaultRaw)))
        .filter(prop => prop.primary || !(prop.fieldNames[0] in arr[0]));

      if (returningProps.length > 0) {
        qb.returning(Utils.flatten(returningProps.map(prop => prop.fieldNames)));
      }

      return;
    }

    if (this.type === QueryType.UPDATE) {
      const returningProps = meta.hydrateProps.filter(prop => prop.fieldNames && isRaw(arr[0][prop.fieldNames[0]]));

      if (returningProps.length > 0) {
        qb.returning(returningProps.flatMap(prop => {
          if (prop.hasConvertToJSValueSQL) {
            const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
            const sql = prop.customType!.convertToJSValueSQL!(aliased, this.platform) + ' as ' + this.platform.quoteIdentifier(prop.fieldNames[0]);
            return [raw(sql)];
          }
          return prop.fieldNames;
        }) as any);
      }
    }
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

  /**
   * Returns raw fragment representation of this QueryBuilder.
   */
  toRaw(): RawQueryFragment {
    const { sql, params } = this.toQuery();
    return raw(sql, params);
  }

  toQuery(): { sql: string; params: readonly unknown[] } {
    if (this._query?.sql) {
      return { sql: this._query.sql, params: this._query.params! };
    }

    const query = this.getNativeQuery().compile();
    this._query!.sql = query.sql;
    this._query!.params = query.params;

    return { sql: this._query!.sql, params: this._query!.params };
  }

  /**
   * Returns the list of all parameters for this query.
   */
  getParams(): readonly unknown[] {
    return this.toQuery().params;
  }

  /**
   * Returns raw interpolated query string with all the parameters inlined.
   */
  getFormattedQuery(): string {
    const query = this.toQuery();
    return this.platform.formatQuery(query.sql, query.params);
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
  async execute<U = any>(method?: 'all' | 'get' | 'run', options?: ExecuteOptions | boolean): Promise<U> {
    options = typeof options === 'boolean' ? { mapResults: options } : (options ?? {});
    options.mergeResults ??= true;
    options.mapResults ??= true;
    const isRunType = [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE, QueryType.TRUNCATE].includes(this.type);
    method ??= isRunType ? 'run' : 'all';

    if (!this.connectionType && isRunType) {
      this.connectionType = 'write';
    }

    if (!this.finalized && method === 'get' && this.type === QueryType.SELECT) {
      this.limit(1);
    }

    const query = this.toQuery();
    const cached = await this.em?.tryCache<Entity, U>(this.mainAlias.entityName, this._cache, ['qb.execute', query.sql, query.params, method]);

    if (cached?.data !== undefined) {
      return cached.data as unknown as U;
    }

    const write = method === 'run' || !this.platform.getConfig().get('preferReadReplicas');
    const type = this.connectionType || (write ? 'write' : 'read');
    const loggerContext = { id: this.em?.id, ...this.loggerContext };
    const res = await this.driver.getConnection(type).execute(query.sql, query.params, method, this.context, loggerContext);
    const meta = this.mainAlias.metadata;

    if (!options.mapResults || !meta) {
      await this.em?.storeCache(this._cache, cached!, res);
      return res as unknown as U;
    }

    if (method === 'run') {
      return res as U;
    }

    const joinedProps = this.driver.joinedProps(meta, this._populate);
    let mapped: EntityData<Entity>[];

    if (Array.isArray(res)) {
      const map: Dictionary = {};
      mapped = res.map(r => this.driver.mapResult<Entity>(r as Entity, meta, this._populate, this, map)!);

      if (options.mergeResults && joinedProps.length > 0) {
        mapped = this.driver.mergeJoinedResult(mapped, this.mainAlias.metadata!, joinedProps);
      }
    } else {
      mapped = [this.driver.mapResult<Entity>(res, meta, joinedProps, this)!];
    }

    if (method === 'get') {
      await this.em?.storeCache(this._cache, cached!, mapped[0]);
      return mapped[0] as U;
    }

    await this.em?.storeCache(this._cache, cached!, mapped);

    return mapped as U;
  }

  /**
   * Alias for `qb.getResultList()`
   */
  async getResult(): Promise<Loaded<Entity, Hint>[]> {
    return this.getResultList();
  }

  /**
   * Executes the query, returning array of results
   */
  async getResultList(limit?: number): Promise<Loaded<Entity, Hint>[]> {
    await this.em!.tryFlush(this.mainAlias.entityName, { flushMode: this.flushMode });
    const res = await this.execute<EntityData<Entity>[]>('all', true);
    const entities: Loaded<Entity, Hint>[] = [];

    function propagatePopulateHint<U extends object>(entity: U, hint: PopulateOptions<U>[]) {
      helper(entity).__serializationContext.populate = hint.concat(helper(entity).__serializationContext.populate ?? []);
      hint.forEach(hint => {
        const [propName] = hint.field.split(':', 2) as [EntityKey<Entity>];
        const value = Reference.unwrapReference(entity[propName as never] as object);

        if (Utils.isEntity<U>(value)) {
          propagatePopulateHint<any>(value, hint.children ?? []);
        } else if (Utils.isCollection(value)) {
          value.populated();
          value.getItems(false).forEach(item => propagatePopulateHint<any>(item, hint.children ?? []));
        }
      });
    }

    for (const r of res) {
      const entity = this.em!.map<Entity>(this.mainAlias.entityName, r, { schema: this._schema }) as Loaded<Entity, Hint>;
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
  async getSingleResult(): Promise<Entity | null> {
    if (!this.finalized) {
      this.limit(1);
    }

    const [res] = await this.getResultList(1);
    return res || null;
  }

  /**
   * Executes count query (without offset and limit), returning total count of results
   */
  async getCount(field?: EntityKeyOrString<Entity> | EntityKeyOrString<Entity>[], distinct?: boolean): Promise<number> {
    let res: { count: number };

    if (this.type === QueryType.COUNT) {
      res = await this.execute<{ count: number }>('get', false);
    } else {
      const qb = this._type === undefined ? this : this.clone();
      qb.processPopulateHint(); // needs to happen sooner so `qb.hasToManyJoins()` reports correctly
      qb.count(field, distinct ?? qb.hasToManyJoins()).limit(undefined).offset(undefined).orderBy([]);
      res = await qb.execute<{ count: number }>('get', false);
    }

    return res ? +res.count : 0;
  }

  /**
   * Executes the query, returning both array of results and total count query (without offset and limit).
   */
  async getResultAndCount(): Promise<[Entity[], number]> {
    return [
      await this.clone().getResultList(),
      await this.clone().getCount(),
    ];
  }

  /**
   * Returns native query builder instance with sub-query aliased with given alias.
   * You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata
   */
  as(alias: string): NativeQueryBuilder {
    const qb = this.getNativeQuery();

    if (alias.includes('.')) {
      const [a, f] = alias.split('.');
      const meta = this.metadata.find(a);
      /* v8 ignore next */
      alias = meta?.properties[f]?.fieldNames[0] ?? alias;
    }

    qb.as(alias);

    // tag the instance, so it is possible to detect it easily
    Object.defineProperty(qb, '__as', { enumerable: false, value: alias });

    return qb;
  }

  clone(reset?: boolean | string[]): QueryBuilder<Entity> {
    const qb = new QueryBuilder<Entity>(this.mainAlias.entityName, this.metadata, this.driver, this.context, this.mainAlias.aliasName, this.connectionType, this.em);

    if (reset === true) {
      return qb;
    }

    reset = reset || [];

    // clone array/object properties
    const properties = [
      'flags', '_populate', '_populateWhere', '_populateFilter', '__populateWhere', '_populateMap', '_joins', '_joinedProps', '_cond', '_data', '_orderBy',
      '_schema', '_indexHint', '_cache', 'subQueries', 'lockMode', 'lockTables', '_groupBy', '_having', '_returning',
      '_comments', '_hintComments', 'rawFragments', 'aliasCounter',
    ];

    RawQueryFragment.cloneRegistry = this.rawFragments;

    for (const prop of Object.keys(this)) {
      if (reset.includes(prop) || ['_helper', '_query'].includes(prop)) {
        continue;
      }

      (qb as any)[prop] = properties.includes(prop) ? Utils.copy(this[prop as keyof this]) : this[prop as keyof this];
    }

    delete RawQueryFragment.cloneRegistry;

    /* v8 ignore next 3 */
    if (this._fields && !reset.includes('_fields')) {
      qb._fields = [...this._fields];
    }

    qb._aliases = { ...this._aliases };
    (qb._helper as Dictionary).aliasMap = qb._aliases;
    qb.finalized = false;

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

    if (res instanceof RawQueryFragment) {
      const query = this.platform.formatQuery(res.sql, res.params);
      return `(${query}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    /* v8 ignore next */
    return res as unknown as string;
  }

  private joinReference(field: string | RawQueryFragment | NativeQueryBuilder | QueryBuilder, alias: string, cond: Dictionary, type: JoinType, path?: string, schema?: string, subquery?: string): EntityProperty<Entity> {
    this.ensureNotFinalized();

    if (typeof field === 'object') {
      const prop = {
        name: '__subquery__',
        kind: ReferenceKind.MANY_TO_ONE,
      } as EntityProperty;

      if (field instanceof QueryBuilder) {
        prop.type = field.mainAlias.entityName;
        prop.targetMeta = field.mainAlias.metadata!;
        field = field.getNativeQuery();
      }

      if (field instanceof RawQueryFragment) {
        field = this.platform.formatQuery(field.sql, field.params);
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

    const [fromAlias, fromField] = this.helper.splitField(field as EntityKey<Entity>);
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
      aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
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

  protected prepareFields<T>(fields: Field<T>[], type: 'where' | 'groupBy' | 'sub-query' = 'where'): (string | RawQueryFragment)[] {
    const ret: Field<T>[] = [];
    const getFieldName = (name: string) => {
      return this.helper.mapper(name, this.type, undefined, type === 'groupBy' ? null : undefined);
    };

    fields.forEach(field => {
      const rawField = RawQueryFragment.getKnownFragment(field as string, false);

      if (rawField) {
        ret.push(rawField);
        return;
      }

      if (!Utils.isString(field)) {
        ret.push(field);
        return;
      }

      const join = Object.keys(this._joins).find(k => field === k.substring(0, k.indexOf('#')))!;

      if (join && type === 'where') {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[join]) as string[]);
        return;
      }

      const [a, f] = this.helper.splitField(field as EntityKey<T>);
      const prop = this.helper.getProperty(f, a);

      /* v8 ignore next 3 */
      if (prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
        return;
      }

      if (prop?.persist === false && !prop.embedded && !prop.formula && type === 'where') {
        return;
      }

      if (prop?.embedded || (prop?.kind === ReferenceKind.EMBEDDED && prop.object)) {
        const name = prop.embeddedPath?.join('.') ?? prop.fieldNames[0];
        const aliased = this._aliases[a] ? `${a}.${name}` : name;
        ret.push(getFieldName(aliased));
        return;
      }

      if (prop?.kind === ReferenceKind.EMBEDDED) {
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
        return;
      }

      if (prop && prop.fieldNames.length > 1) {
        ret.push(...prop.fieldNames.map(f => getFieldName(f)));
        return;
      }

      ret.push(getFieldName(field));
    });

    const meta = this.mainAlias.metadata;
    /* v8 ignore next */
    const requiresSQLConversion = meta?.props.filter(p => p.hasConvertToJSValueSQL && p.persist !== false) ?? [];

    if (this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES) && (fields.includes('*') || fields.includes(`${this.mainAlias.aliasName}.*`)) && requiresSQLConversion.length > 0) {
      for (const p of requiresSQLConversion) {
        ret.push(this.helper.mapper(p.name, this.type));
      }
    }

    for (const f of Object.keys(this._populateMap)) {
      if (type === 'where' && this._joins[f]) {
        const cols = this.helper.mapJoinColumns(this.type, this._joins[f]);

        for (const col of cols) {
          ret.push(col as string);
        }
      }
    }

    return Utils.unique(ret) as string[];
  }

  protected init(type: QueryType, data?: any, cond?: any): this {
    this.ensureNotFinalized();
    this._type = type;

    if ([QueryType.UPDATE, QueryType.DELETE].includes(type) && Utils.hasObjectKeys(this._cond)) {
      throw new Error(`You are trying to call \`qb.where().${type.toLowerCase()}()\`. Calling \`qb.${type.toLowerCase()}()\` before \`qb.where()\` is required.`);
    }

    if (!this.helper.isTableNameAliasRequired(type)) {
      delete this._fields;
    }

    if (data) {
      if (Utils.isEntity(data)) {
        data = this.em?.getComparator().prepareEntity(data as Entity) ?? serialize(data as Entity);
      }

      this._data = this.helper.processData(data, this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES), false);
    }

    if (cond) {
      this.where(cond);
    }

    return this;
  }

  private getQueryBase(processVirtualEntity: boolean): NativeQueryBuilder {
    const qb = this.platform.createNativeQueryBuilder().setFlags(this.flags);
    const { subQuery, aliasName, entityName, metadata } = this.mainAlias;
    const requiresAlias = this.finalized && (this._explicitAlias || this.helper.isTableNameAliasRequired(this.type));
    const alias = requiresAlias ? aliasName : undefined;
    const schema = this.getSchema(this.mainAlias);
    const tableName = subQuery ? subQuery.as(aliasName) : this.helper.getTableName(entityName);
    const joinSchema = this._schema ?? this.em?.schema ?? schema;

    if (metadata?.virtual && processVirtualEntity) {
      qb.from(raw(this.fromVirtual(metadata)), { indexHint: this._indexHint });
    } else {
      qb.from(tableName, {
        schema,
        alias,
        indexHint: this._indexHint,
      });
    }

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields!));

        if (this._distinctOn) {
          qb.distinctOn(this.prepareFields(this._distinctOn) as string[]);
        } else if (this.flags.has(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins, joinSchema);
        break;
      case QueryType.COUNT: {
        const fields = this._fields!.map(f => this.helper.mapper(f as string, this.type));
        qb.count(fields, this.flags.has(QueryFlag.DISTINCT));
        this.helper.processJoins(qb, this._joins, joinSchema);
        break;
      }
      case QueryType.INSERT:
        qb.insert(this._data);
        break;
      case QueryType.UPDATE:
        qb.update(this._data);
        this.helper.processJoins(qb, this._joins, joinSchema);
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

    if (!this._type) {
      this.select('*');
    }

    const meta = this.mainAlias.metadata as EntityMetadata<Entity>;
    this.applyDiscriminatorCondition();
    this.processPopulateHint();

    if (meta && (this._fields?.includes('*') || this._fields?.includes(`${this.mainAlias.aliasName}.*`))) {
      meta.props
        .filter(prop => prop.formula && (!prop.lazy || this.flags.has(QueryFlag.INCLUDE_LAZY_FORMULAS)))
        .map(prop => {
          const alias = this.platform.quoteIdentifier(this.mainAlias.aliasName);
          const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
          let key = prop.formula!(alias);

          if (isRaw(key)) {
            key = this.platform.formatQuery(key.sql, key.params);
          }

          return `${key} as ${aliased}`;
        })
        .filter(field => !this._fields!.some(f => {
          if (f instanceof RawQueryFragment) {
            return f.sql === field && f.params.length === 0;
          }

          return f === field;
        }))
        .forEach(field => this._fields!.push(raw(field)));
    }

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

  /** @internal */
  processPopulateHint(): void {
    if (this.populateHintFinalized) {
      return;
    }

    const meta = this.mainAlias.metadata as EntityMetadata<Entity>;

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
        const prop = meta.properties[fromField as EntityKey<Entity>];
        const alias = this.getNextAlias(prop.pivotEntity ?? prop.type);
        const aliasedName = `${fromAlias}.${prop.name}#${alias}`;
        this._joins[aliasedName] = this.helper.joinOneToReference(prop, this.mainAlias.aliasName, alias, JoinType.leftJoin);
        this._joins[aliasedName].path = `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? meta.className)}.${prop.name}`;
        this._populateMap[aliasedName] = this._joins[aliasedName].alias;
        this.createAlias(prop.type, alias);
      }
    });

    this.processPopulateWhere(false);
    this.processPopulateWhere(true);
    this.populateHintFinalized = true;
  }

  private processPopulateWhere(filter: boolean) {
    const key = filter ? '_populateFilter' : '_populateWhere';

    if (this[key] == null || this[key] === PopulateHint.ALL) {
      return;
    }

    let joins = Object.values(this._joins);

    for (const join of joins) {
      join.cond_ ??= join.cond;
      join.cond = { ...join.cond };
    }

    if (typeof this[key] === 'object') {
      const cond = CriteriaNodeFactory
        .createNode<Entity>(this.metadata, this.mainAlias.entityName, this[key])
        .process(this, { matchPopulateJoins: true, ignoreBranching: true, preferNoBranch: true });
      // there might be new joins created by processing the `populateWhere` object
      joins = Object.values(this._joins);
      this.mergeOnConditions(joins, cond, filter);
    }
  }

  private mergeOnConditions(joins: JoinOptions[], cond: Dictionary, filter: boolean, op?: string) {
    for (const k of Object.keys(cond)) {
      if (Utils.isOperator(k)) {
        if (Array.isArray(cond[k])) {
          cond[k].forEach((c: Dictionary) => this.mergeOnConditions(joins, c, filter, k));
        }

        /* v8 ignore next */
        this.mergeOnConditions(joins, cond[k], filter, k);
      }

      const [alias] = this.helper.splitField(k as EntityKey<Entity>);
      const join = joins.find(j => j.alias === alias);

      if (join) {
        const parentJoin = joins.find(j => j.alias === join.ownerAlias);

        // https://stackoverflow.com/a/56815807/3665878
        if (parentJoin && !filter) {
          const nested = (parentJoin!.nested ??= new Set());
          join.type = join.type === JoinType.innerJoin || ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(parentJoin.prop.kind))
            ? JoinType.nestedInnerJoin
            : JoinType.nestedLeftJoin;
          nested.add(join);
        }

        if (join.cond[k]) {
          /* v8 ignore next */
          join.cond = { [op ?? '$and']: [join.cond, { [k]: cond[k] }] };
        } else if (op === '$or') {
          join.cond.$or ??= [];
          join.cond.$or.push({ [k]: cond[k] });
        } else {
          join.cond = { ...join.cond, [k]: cond[k] };
        }
      }
    }
  }

  private hasToManyJoins(): boolean {
    return Object.values(this._joins).some(join => {
      return [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(join.prop.kind);
    });
  }

  protected wrapPaginateSubQuery(meta: EntityMetadata): void {
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query') as string[];
    const subQuery = this.clone(['_orderBy', '_fields', 'lockMode', 'lockTableAliases']).select(pks).groupBy(pks).limit(this._limit!);

    // revert the on conditions added via populateWhere, we want to apply those only once
    for (const join of Object.values(subQuery._joins)) {
      if (join.cond_) {
        join.cond = join.cond_;
      }
    }

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

          const [a, f] = this.helper.splitField(field as EntityKey<Entity>);
          const prop = this.helper.getProperty(f, a);
          const type = this.platform.castColumn(prop);
          const fieldName = this.helper.mapper(field, this.type, undefined, null);

          if (!prop?.persist && !prop?.formula && !prop?.hasConvertToJSValueSQL && !pks.includes(fieldName)) {
            addToSelect.push(fieldName);
          }

          const quoted = this.platform.quoteIdentifier(fieldName);
          const key = raw(`min(${quoted}${type})`);
          orderBy.push({ [key]: direction });
        }
      }

      subQuery.orderBy(orderBy);
    }

    subQuery.finalized = true;
    const innerQuery = subQuery.as(this.mainAlias.aliasName).clear('select').select(pks);

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

        /* v8 ignore next 3 */
        if (field instanceof RawQueryFragment) {
          innerQuery.select(field);
        } else if (field instanceof NativeQueryBuilder) {
          innerQuery.select(field.toRaw());
        } else if (field) {
          innerQuery.select(field as string);
        }
      });
    }

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.platform.createNativeQueryBuilder();
    subSubQuery.select(pks).from(innerQuery);
    this._limit = undefined;
    this._offset = undefined;

    if (!this._fields!.some(f => RawQueryFragment.isKnownFragment(f as string))) {
      this.pruneExtraJoins(meta);
    }

    const { sql, params } = subSubQuery.compile();
    this.select(this._fields!).where({ [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: raw(sql, params) } });
  }

  private pruneExtraJoins(meta: EntityMetadata) {
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
    const joins = Object.entries(this._joins);
    const rootAlias = this.alias;

    function addParentAlias(alias: string) {
      const join = joins.find(j => j[1].alias === alias);

      if (join && join[1].ownerAlias !== rootAlias) {
        orderByAliases.push(join[1].ownerAlias);
        addParentAlias(join[1].ownerAlias);
      }
    }

    for (const orderByAlias of orderByAliases) {
      addParentAlias(orderByAlias);
    }

    for (const [key, join] of joins) {
      const path = join.path?.replace(/\[populate]|\[pivot]|:ref/g, '').replace(new RegExp(`^${meta.className}.`), '');

      if (!populate.has(path ?? '') && !orderByAliases.includes(join.alias)) {
        delete this._joins[key];
      }
    }
  }

  private wrapModifySubQuery(meta: EntityMetadata): void {
    const subQuery = this.clone();
    subQuery.finalized = true;

    // wrap one more time to get around MySQL limitations
    // https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
    const subSubQuery = this.platform.createNativeQueryBuilder();
    const method = this.flags.has(QueryFlag.UPDATE_SUB_QUERY) ? 'update' : 'delete';
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query') as string[];
    this._cond = {}; // otherwise we would trigger validation error
    this._joins = {}; // included in the subquery
    subSubQuery.select(pks).from(subQuery.as(this.mainAlias.aliasName));

    const { sql, params } = subSubQuery.compile();
    this[method](this._data as EntityData<Entity>).where({
      [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: raw(sql, params) },
    });
  }

  private getSchema(alias: Alias<any>): string | undefined {
    const { metadata } = alias;
    const metaSchema = metadata?.schema && metadata.schema !== '*' ? metadata.schema : undefined;
    const schema = this._schema ?? metaSchema ?? this.em?.schema ?? this.em?.config.getSchema(true);

    if (schema === this.platform.getDefaultSchemaName()) {
      return undefined;
    }

    return schema;
  }

  private createAlias<U = unknown>(entityName: string, aliasName: string, subQuery?: NativeQueryBuilder): Alias<U> {
    const metadata = this.metadata.find(entityName)!;
    const alias = { aliasName, entityName, metadata, subQuery };
    this._aliases[aliasName] = alias;
    return alias;
  }

  private createMainAlias(entityName: string, aliasName: string, subQuery?: NativeQueryBuilder): Alias<Entity> {
    this._mainAlias = this.createAlias(entityName, aliasName, subQuery);
    this._helper = this.createQueryBuilderHelper();
    return this._mainAlias;
  }

  private fromSubQuery<T extends AnyEntity<T> = AnyEntity>(target: QueryBuilder<T>, aliasName?: string): void {
    const subQuery = target.getNativeQuery();
    const { entityName } = target.mainAlias;
    aliasName ??= this.getNextAlias(entityName);

    this.createMainAlias(entityName, aliasName, subQuery);
  }

  private fromEntityName(entityName: string, aliasName?: string): void {
    aliasName ??= this._mainAlias?.aliasName ?? this.getNextAlias(entityName);

    this.createMainAlias(entityName, aliasName);
  }

  private createQueryBuilderHelper(): QueryBuilderHelper {
    return new QueryBuilderHelper(this.mainAlias.entityName, this.mainAlias.aliasName, this._aliases, this.subQueries, this.driver);
  }

  private ensureFromClause(): void {
    /* v8 ignore next 3 */
    if (!this._mainAlias) {
      throw new Error(`Cannot proceed to build a query because the main alias is not set.`);
    }
  }

  private ensureNotFinalized(): void {
    if (this.finalized) {
      throw new Error('This QueryBuilder instance is already finalized, clone it first if you want to modify it.');
    }
  }

  /* v8 ignore start */
  /** @ignore */
  [inspect.custom](depth = 2) {
    const object = { ...this } as Dictionary;
    const hidden = ['metadata', 'driver', 'context', 'platform', 'type'];
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
  /* v8 ignore stop */

}

export interface RunQueryBuilder<Entity extends object> extends Omit<QueryBuilder<Entity, any, any>, 'getResult' | 'getSingleResult' | 'getResultList' | 'where'> {
  where(cond: QBFilterQuery<Entity> | string, params?: keyof typeof GroupOperator | any[], operator?: keyof typeof GroupOperator): this;
  execute<Result = QueryResult<Entity>>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
}

export interface SelectQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> extends QueryBuilder<Entity, RootAlias, Hint, Context> {
  execute<Result = Entity[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
  execute<Result = Entity[]>(method: 'all', mapResults?: boolean): Promise<Result>;
  execute<Result = Entity>(method: 'get', mapResults?: boolean): Promise<Result>;
  execute<Result = QueryResult<Entity>>(method: 'run', mapResults?: boolean): Promise<Result>;
}

export interface CountQueryBuilder<Entity extends object> extends QueryBuilder<Entity, any, any> {
  execute<Result = { count: number }[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
  execute<Result = { count: number }[]>(method: 'all', mapResults?: boolean): Promise<Result>;
  execute<Result = { count: number }>(method: 'get', mapResults?: boolean): Promise<Result>;
  execute<Result = QueryResult<{ count: number }>>(method: 'run', mapResults?: boolean): Promise<Result>;
}

export interface InsertQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface UpdateQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface DeleteQueryBuilder<T extends object> extends RunQueryBuilder<T> {}

export interface TruncateQueryBuilder<T extends object> extends RunQueryBuilder<T> {}
