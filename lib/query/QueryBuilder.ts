import { QueryBuilder as KnexQueryBuilder, Raw, Transaction } from 'knex';
import { Utils, ValidationError } from '../utils';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { SmartQueryHelper } from './SmartQueryHelper';
import { EntityMetadata, EntityProperty } from '../decorators';
import { ReferenceType } from '../entity';
import { QueryFlag, QueryOrderMap, QueryType } from './enums';
import { LockMode } from '../unit-of-work';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';
import { IDatabaseDriver } from '../drivers';

/**
 * SQL query builder
 */
export class QueryBuilder {

  type: QueryType;

  private aliasCounter = 1;
  private flags: QueryFlag[] = [];
  private finalized = false;
  private _fields: string[];
  private _populate: string[] = [];
  private _populateMap: Record<string, string> = {};
  private _joins: Record<string, JoinOptions> = {};
  private _aliasMap: Record<string, string> = {};
  private _cond: Record<string, any> = {};
  private _data: Record<string, any>;
  private _orderBy: QueryOrderMap = {};
  private _groupBy: string[] = [];
  private _having: Record<string, any> = {};
  private _limit: number;
  private _offset: number;
  private lockMode?: LockMode;
  private readonly connection = this.driver.getConnection() as AbstractSqlConnection;
  private readonly platform = this.driver.getPlatform();
  private readonly knex = this.connection.getKnex();
  private readonly helper = new QueryBuilderHelper(this.entityName, this.alias, this._aliasMap, this.metadata, this.knex, this.platform);

  constructor(private readonly entityName: string,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly driver: IDatabaseDriver,
              private readonly context?: Transaction,
              readonly alias = `e0`) { }

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
    this._fields = [field || this.metadata[this.entityName].primaryKey];

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT);
  }

  join(field: string, alias: string, type: 'leftJoin' | 'innerJoin' = 'innerJoin'): this {
    const [fromAlias, fromField] = this.helper.splitField(field);
    const entityName = this._aliasMap[fromAlias];
    const prop = this.metadata[entityName].properties[fromField];
    this._aliasMap[alias] = prop.type;

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this._joins[prop.name] = this.helper.joinOneToReference(prop, fromAlias, alias, type);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
      const pivotAlias = `e${this.aliasCounter++}`;
      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type);
      this._fields.push(`${pivotAlias}.${prop.name}`);
      Object.assign(this._joins, joins);
    } else if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this._joins[prop.name] = this.helper.joinOneToReference(prop, fromAlias, alias, type);
    } else { // MANY_TO_ONE
      this._joins[prop.name] = this.helper.joinManyToOneReference(prop, fromAlias, alias, type);
    }

    return this;
  }

  leftJoin(field: string, alias: string): this {
    return this.join(field, alias, 'leftJoin');
  }

  where(cond: Record<string, any>, operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this;
  where(cond: string, params?: any[], operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this;
  where(cond: Record<string, any> | string, params?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS | any[], operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this {
    cond = SmartQueryHelper.processWhere(cond, this.entityName);

    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
      operator = operator || '$and';
    }

    const op = operator || params as keyof typeof QueryBuilderHelper.GROUP_OPERATORS;
    const topLevel = !op || Object.keys(this._cond).length === 0;

    if (topLevel) {
      this._cond = this.processWhere(cond);
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(this.processWhere(cond));
    } else {
      const cond1 = [this._cond, this.processWhere(cond)];
      this._cond = { [op]: cond1 };
    }

    return this;
  }

  andWhere(cond: Record<string, any>): this;
  andWhere(cond: string, params?: any[]): this;
  andWhere(cond: Record<string, any> | string, params?: any[]): this {
    return this.where(cond as string, params, '$and');
  }

  orWhere(cond: Record<string, any>): this;
  orWhere(cond: string, params?: any[]): this;
  orWhere(cond: Record<string, any> | string, params?: any[]): this {
    return this.where(cond as string, params, '$or');
  }

  orderBy(orderBy: QueryOrderMap): this {
    orderBy = Object.assign({}, orderBy); // copy first

    Object.keys(orderBy).forEach(field => {
      if (!this.metadata[this.entityName] || !this.metadata[this.entityName].properties[field]) {
        return;
      }

      const prop = this.metadata[this.entityName].properties[field];
      Utils.renameKey(orderBy, field, prop.fieldName);
    });

    this._orderBy = orderBy;

    return this;
  }

  groupBy(fields: string | string[]): this {
    this._groupBy = Utils.asArray(fields);
    return this;
  }

  having(cond: Record<string, any> | string, params?: any[]): this {
    if (Utils.isString(cond)) {
      cond = { [`(${cond})`]: Utils.asArray(params) };
    }

    this._having = this.processWhere(cond);
    return this;
  }

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
    Utils.runIfNotEmpty(() => qb.orderBy(this.helper.getQueryOrder(this.type, this._orderBy, this._populateMap)), this._orderBy);
    Utils.runIfNotEmpty(() => qb.limit(this._limit), this._limit);
    Utils.runIfNotEmpty(() => qb.offset(this._offset), this._offset);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      return this.knex.raw(qb.toSQL().toNative().sql + ' cascade') as any;
    }

    this.helper.getLockSQL(qb, this.lockMode);
    this.helper.finalize(this.type, qb, this.metadata[this.entityName]);

    return qb;
  }

  getQuery(): string {
    return this.getKnexQuery().toSQL().toNative().sql;
  }

  getParams(): any[] {
    return this.getKnexQuery().toSQL().toNative().bindings;
  }

  async execute(method: 'all' | 'get' | 'run' = 'all', mapResults = true): Promise<any> {
    const res = await this.connection.execute(this.getKnexQuery(), [], method);

    if (!mapResults) {
      return res;
    }

    if (method === 'all' && Array.isArray(res)) {
      return res.map((r: any) => this.driver.mapResult(r, this.metadata[this.entityName]));
    }

    return this.driver.mapResult(res, this.metadata[this.entityName]);
  }

  clone(): QueryBuilder {
    const qb = new QueryBuilder(this.entityName, this.metadata, this.driver, this.context, this.alias);
    Object.assign(qb, this);

    // clone array/object properties
    const properties = ['flags', '_fields', '_populate', '_populateMap', '_joins', '_aliasMap', '_cond', '_data', '_orderBy'];
    properties.forEach(prop => (qb as any)[prop] = Utils.copy(this[prop as keyof this]));
    qb.finalized = false;

    return qb;
  }

  private prepareFields(fields: string[]): (string | Raw)[] {
    const ret: string[] = [];

    fields.forEach(f => {
      if (this._joins[f]) {
        return ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]) as string[]);
      }

      ret.push(this.helper.mapper(this.type, f) as string);
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

  private processWhere(cond: any): any {
    cond = Object.assign({}, cond); // copy first

    Object.keys(cond).forEach(field => {
      this.helper.replaceEmptyInConditions(cond, field);

      if (!this.metadata[this.entityName] || !this.metadata[this.entityName].properties[field]) {
        return;
      }

      const prop = this.metadata[this.entityName].properties[field];

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        this.processManyToMany(prop, cond);
      } else if (prop.reference === ReferenceType.ONE_TO_MANY) {
        this.processOneToMany(prop, cond);
      } else if (prop.reference === ReferenceType.ONE_TO_ONE) {
        this.processOneToOne(prop, cond);
      } else {
        Utils.renameKey(cond, field, prop.fieldName);
      }
    });

    return cond;
  }

  private processOneToOne(prop: EntityProperty, cond: any): void {
    if (prop.owner) {
      return Utils.renameKey(cond, prop.name, prop.fieldName);
    }

    this._fields.push(prop.name);
    const alias2 = `e${this.aliasCounter++}`;
    this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, alias2, 'leftJoin');
    const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
    Utils.renameKey(cond, prop.name, `${alias2}.${prop2.referenceColumnName}`);
  }

  private processManyToMany(prop: EntityProperty, cond: any): void {
    const alias1 = `e${this.aliasCounter++}`;
    const join = {
      type: 'leftJoin',
      alias: alias1,
      ownerAlias: this.alias,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop.inverseJoinColumn,
      primaryKey: prop.referenceColumnName,
    } as JoinOptions;

    if (prop.owner) {
      this._joins[prop.name] = Object.assign(join, { table: prop.pivotTable });
    } else {
      const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
      this._joins[prop.name] = Object.assign(join, { table: prop2.pivotTable });
    }

    this._fields.push(prop.name);
    Utils.renameKey(cond, prop.name, `${alias1}.${prop.inverseJoinColumn}`);
  }

  private processOneToMany(prop: EntityProperty, cond: any): void {
    const alias2 = `e${this.aliasCounter++}`;
    this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, alias2, 'leftJoin');
    Utils.renameKey(cond, prop.name, `${alias2}.${prop.referenceColumnName}`);
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.type = type;
    this._aliasMap[this.alias] = this.entityName;

    if (data) {
      this._data = this.helper.processData(data);
    }

    if (cond) {
      this._cond = this.processWhere(cond);
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
        qb[m](this.helper.mapper(this.type, this._fields[0], undefined, 'count'));
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
      if (this._joins[field]) {
        return this._populateMap[field] = this._joins[field].alias;
      }

      if (this.metadata[field]) { // pivot table entity
        const prop = this.metadata[field].properties[this.entityName];
        this._joins[field] = this.helper.joinPivotTable(field, prop, this.alias, `e${this.aliasCounter++}`, 'leftJoin');
        this._populateMap[field] = this._joins[field].alias;
      } else if (this.helper.isOneToOneInverse(field)) {
        const prop = this.metadata[this.entityName].properties[field];
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
  type: 'leftJoin' | 'innerJoin';
  alias: string;
  ownerAlias: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  primaryKey?: string;
  prop: EntityProperty;
}
