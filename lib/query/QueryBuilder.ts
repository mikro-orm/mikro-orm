import { QueryBuilder as KnexQueryBuilder, Raw, Transaction } from 'knex';
import { Utils, ValidationError } from '../utils';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { SmartQueryHelper } from './SmartQueryHelper';
import { Dictionary, EntityProperty, AnyEntity } from '../types';
import { ReferenceType } from '../entity';
import { FlatQueryOrderMap, QueryFlag, QueryOrderMap, QueryType } from './enums';
import { LockMode } from '../unit-of-work';
import { AbstractSqlDriver } from '../drivers';
import { MetadataStorage } from '../metadata';
import { CriteriaNode } from './CriteriaNode';

/**
 * SQL query builder
 */
export class QueryBuilder {

  type: QueryType;
  _fields: string[];
  _populate: string[] = [];
  _populateMap: Record<string, string> = {};

  private aliasCounter = 1;
  private flags: QueryFlag[] = [];
  private finalized = false;
  private _joins: Record<string, JoinOptions> = {};
  private _aliasMap: Record<string, string> = {};
  private _cond: Dictionary = {};
  private _data: Dictionary;
  private _orderBy: QueryOrderMap = {};
  private _groupBy: string[] = [];
  private _having: Dictionary = {};
  private _limit: number;
  private _offset: number;
  private lockMode?: LockMode;
  private readonly platform = this.driver.getPlatform();
  private readonly knex = this.driver.getConnection(this.connectionType).getKnex();
  private readonly helper = new QueryBuilderHelper(this.entityName, this.alias, this._aliasMap, this.metadata, this.knex, this.platform);

  constructor(private readonly entityName: string,
              private readonly metadata: MetadataStorage,
              private readonly driver: AbstractSqlDriver,
              private readonly context?: Transaction,
              readonly alias = `e0`,
              private readonly connectionType?: 'read' | 'write') { }

  select(fields: string | string[], distinct = false): this {
    this._fields = Utils.asArray(fields);

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT);
  }

  insert(data: any): this {
    return this.init(QueryType.INSERT, data);
  }

  update(data: any): this {
    return this.init(QueryType.UPDATE, data);
  }

  delete(cond: any = {}): this {
    return this.init(QueryType.DELETE, undefined, cond);
  }

  truncate(): this {
    return this.init(QueryType.TRUNCATE);
  }

  count(field?: string, distinct = false): this {
    this._fields = [field || this.metadata.get(this.entityName).primaryKey];

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT);
  }

  join(field: string, alias: string, cond: Dictionary = {}, type: 'leftJoin' | 'innerJoin' | 'pivotJoin' = 'innerJoin'): this {
    const extraFields = this.joinReference(field, alias, cond, type);
    this._fields.push(...extraFields);

    return this;
  }

  leftJoin(field: string, alias: string, cond: Dictionary = {}): this {
    return this.join(field, alias, cond, 'leftJoin');
  }

  where(cond: Dictionary, operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this; // tslint:disable-next-line:lines-between-class-members
  where(cond: string, params?: any[], operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this; // tslint:disable-next-line:lines-between-class-members
  where(cond: Dictionary | string, params?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS | any[], operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this {
    cond = SmartQueryHelper.processWhere(cond as Dictionary, this.entityName, this.metadata.get(this.entityName, false, false));

    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
      operator = operator || '$and';
    }

    const op = operator || params as keyof typeof QueryBuilderHelper.GROUP_OPERATORS;
    const topLevel = !op || Object.keys(this._cond).length === 0;

    if (topLevel) {
      this._cond = CriteriaNode.create(this.metadata, this.entityName, cond).process(this);
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(CriteriaNode.create(this.metadata, this.entityName, cond).process(this));
    } else {
      const cond1 = [this._cond, CriteriaNode.create(this.metadata, this.entityName, cond).process(this)];
      this._cond = { [op]: cond1 };
    }

    return this;
  }

  andWhere(cond: Dictionary): this; // tslint:disable-next-line:lines-between-class-members
  andWhere(cond: string, params?: any[]): this; // tslint:disable-next-line:lines-between-class-members
  andWhere(cond: Dictionary | string, params?: any[]): this {
    return this.where(cond as string, params, '$and');
  }

  orWhere(cond: Dictionary): this; // tslint:disable-next-line:lines-between-class-members
  orWhere(cond: string, params?: any[]): this; // tslint:disable-next-line:lines-between-class-members
  orWhere(cond: Dictionary | string, params?: any[]): this {
    return this.where(cond as string, params, '$or');
  }

  orderBy(orderBy: QueryOrderMap): this {
    this._orderBy = CriteriaNode.create(this.metadata, this.entityName, orderBy).process(this);
    return this;
  }

  groupBy(fields: string | string[]): this {
    this._groupBy = Utils.asArray(fields);
    return this;
  }

  having(cond: Dictionary | string, params?: any[]): this {
    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
    }

    this._having = CriteriaNode.create(this.metadata, this.entityName, cond).process(this);
    return this;
  }

  /**
   * @internal
   */
  populate(populate: string[]): this {
    this._populate = populate;
    return this;
  }

  limit(limit: number, offset = 0): this {
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this;
  }

  offset(offset: number): this {
    this._offset = offset;
    return this;
  }

  setLockMode(mode?: LockMode): this {
    if ([LockMode.NONE, LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode!) && !this.context) {
      throw ValidationError.transactionRequired();
    }

    this.lockMode = mode;

    return this;
  }

  getKnexQuery(): KnexQueryBuilder {
    this.finalize();
    const qb = this.getQueryBase();

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._cond, qb), this._cond);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy)), this._groupBy);
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._having, qb, undefined, 'having'), this._having);
    Utils.runIfNotEmpty(() => qb.orderBy(this.helper.getQueryOrder(this.type, this._orderBy as FlatQueryOrderMap, this._populateMap)), this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit), this._limit);
    Utils.runIfNotEmpty(() => qb.offset(this._offset), this._offset);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      return this.knex.raw(qb.toSQL().toNative().sql + ' cascade') as any;
    }

    this.helper.getLockSQL(qb, this.lockMode);
    this.helper.finalize(this.type, qb, this.metadata.get(this.entityName, false, false));

    return qb;
  }

  getQuery(): string {
    return this.getKnexQuery().toSQL().toNative().sql;
  }

  getParams(): any[] {
    return this.getKnexQuery().toSQL().toNative().bindings;
  }

  getAliasForEntity(entityName: string, node: CriteriaNode): string | undefined {
    if (node.prop) {
      const join = Object.values(this._joins).find(j => j.prop === node.prop);

      if (!join) {
        return undefined;
      }
    }

    const found = Object.entries(this._aliasMap).find(([, e]) => e === entityName);

    return found ? found[0] : undefined;
  }

  getNextAlias(): string {
    return `e${this.aliasCounter++}`;
  }

  async execute(method: 'all' | 'get' | 'run' = 'all', mapResults = true): Promise<any> {
    const type = this.connectionType || (method === 'run' ? 'write' : 'read');
    const res = await this.driver.getConnection(type).execute(this.getKnexQuery(), [], method);
    const meta = this.metadata.get(this.entityName, false, false);

    if (!mapResults) {
      return res;
    }

    if (method === 'all' && Array.isArray(res)) {
      return res.map(r => this.driver.mapResult(r, meta));
    }

    return this.driver.mapResult<AnyEntity>(res, meta);
  }

  clone(): QueryBuilder {
    const qb = new QueryBuilder(this.entityName, this.metadata, this.driver, this.context, this.alias, this.connectionType);
    Object.assign(qb, this);

    // clone array/object properties
    const properties = ['flags', '_fields', '_populate', '_populateMap', '_joins', '_aliasMap', '_cond', '_data', '_orderBy'];
    properties.forEach(prop => (qb as any)[prop] = Utils.copy(this[prop as keyof this]));
    qb.finalized = false;

    return qb;
  }

  private joinReference(field: string, alias: string, cond: Dictionary, type: 'leftJoin' | 'innerJoin' | 'pivotJoin'): string[] {
    const [fromAlias, fromField] = this.helper.splitField(field);
    const entityName = this._aliasMap[fromAlias];
    const prop = this.metadata.get(entityName).properties[fromField];
    this._aliasMap[alias] = prop.type;
    cond = SmartQueryHelper.processWhere(cond, this.entityName, this.metadata.get(this.entityName));
    const aliasedName = `${fromAlias}.${prop.name}`;
    const ret: string[] = [];

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
      const pivotAlias = type === 'pivotJoin' ? alias : `e${this.aliasCounter++}`;
      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type, cond);
      Object.assign(this._joins, joins);
      this._aliasMap[pivotAlias] = prop.pivotTable;
      ret.push(`${fromAlias}.${prop.name}`);
    } else if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond);
    } else { // MANY_TO_ONE
      this._joins[aliasedName] = this.helper.joinManyToOneReference(prop, fromAlias, alias, type, cond);
    }

    return ret;
  }

  private prepareFields(fields: string[]): (string | Raw)[] {
    const ret: string[] = [];

    fields.forEach(f => {
      if (this._joins[f]) {
        return ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      ret.push(this.helper.mapper(f, this.type) as string);
    });

    Object.keys(this._populateMap).forEach(f => {
      if (!fields.includes(f)) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      if (this._joins[f].prop.reference !== ReferenceType.ONE_TO_ONE) {
        Utils.renameKey(this._cond, this._joins[f].inverseJoinColumn!, `${this._joins[f].alias}.${this._joins[f].inverseJoinColumn!}`);
      }
    });

    return ret;
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.type = type;
    this._aliasMap[this.alias] = this.entityName;

    if (data) {
      this._data = this.helper.processData(data);
    }

    if (cond) {
      this._cond = CriteriaNode.create(this.metadata, this.entityName, cond).process(this);
    }

    return this;
  }

  private getQueryBase(): KnexQueryBuilder {
    const qb = this.createBuilder();

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields));

        if (this.flags.includes(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins);
        break;
      case QueryType.COUNT:
        const m = this.flags.includes(QueryFlag.DISTINCT) ? 'countDistinct' : 'count';
        qb[m](this.helper.mapper(this._fields[0], this.type, undefined, 'count'));
        this.helper.processJoins(qb, this._joins);
        break;
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

  private createBuilder(): KnexQueryBuilder {
    const tableName = this.helper.getTableName(this.entityName) + ([QueryType.SELECT, QueryType.COUNT].includes(this.type) ? ` as ${this.alias}` : '');
    const qb = this.knex(tableName);

    if (this.context) {
      qb.transacting(this.context);
    }

    return qb;
  }

  private finalize(): void {
    if (this.finalized) {
      return;
    }

    this._populate.forEach(field => {
      const [fromAlias, fromField] = this.helper.splitField(field);
      const aliasedField = `${fromAlias}.${fromField}`;

      if (this._joins[aliasedField]) {
        return this._populateMap[aliasedField] = this._joins[aliasedField].alias;
      }

      if (this.metadata.has(field)) { // pivot table entity
        const prop = this.metadata.get(field).properties[this.entityName];
        const prop2 = this.metadata.get(field).properties[prop.mappedBy || prop.inversedBy];
        const pivotAlias = this.getNextAlias();
        this._joins[field] = this.helper.joinPivotTable(field, prop, this.alias, pivotAlias, 'leftJoin');
        Utils.renameKey(this._cond, `${field}.${prop2.name}`, `${pivotAlias}.${prop2.fieldName}`);
        this._populateMap[field] = this._joins[field].alias;
      } else if (this.helper.isOneToOneInverse(field)) {
        const prop = this.metadata.get(this.entityName).properties[field];
        this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, `e${this.aliasCounter++}`, 'leftJoin');
        this._populateMap[field] = this._joins[field].alias;
      }
    });

    SmartQueryHelper.processParams([this._data, this._cond, this._having]);
    this.finalized = true;
  }

}

export interface JoinOptions {
  table: string;
  type: 'leftJoin' | 'innerJoin' | 'pivotJoin';
  alias: string;
  ownerAlias: string;
  inverseAlias?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  primaryKey?: string;
  prop: EntityProperty;
  cond: Dictionary;
}
