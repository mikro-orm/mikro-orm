import { Utils } from '../utils';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { EntityMetadata, EntityProperty } from '../decorators';
import { ReferenceType } from '../entity';
import { QueryFlag, QueryOrder, QueryType } from './enums';
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
  private _orderBy: Record<string, QueryOrder>;
  private _limit: number;
  private _offset: number;
  private readonly connection = this.driver.getConnection();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = new QueryBuilderHelper(this.entityName, this.alias, this.metadata, this.platform);

  constructor(private readonly entityName: string,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly driver: IDatabaseDriver,
              readonly alias = `e0`) { }

  select(fields: string | string[]): this {
    this._fields = Array.isArray(fields) ? fields : [fields];
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
    this.select(field || this.metadata[this.entityName].primaryKey);
    this.flags.push(QueryFlag.COUNT);

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

    return this;
  }

  join(field: string, alias: string, type: 'left' | 'inner' = 'inner'): this {
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
    return this.join(field, alias, 'left');
  }

  where(cond: any, operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this {
    if (!operator || Object.keys(this._cond).length === 0) {
      this._cond = this.processWhere(cond);
    } else if (Array.isArray(this._cond[operator])) {
      this._cond[operator].push(this.processWhere(cond));
    } else {
      this._cond = { [operator]: [this._cond, this.processWhere(cond)] };
    }

    return this;
  }

  andWhere(cond: any): this {
    return this.where(cond, '$and');
  }

  orWhere(cond: any): this {
    return this.where(cond, '$or');
  }

  orderBy(orderBy: Record<string, QueryOrder>): this {
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

  getQuery(): string {
    this.finalize();
    let sql = this.getQueryBase();

    if (this._cond && Object.keys(this._cond).length > 0) {
      sql += ' WHERE ' + this.helper.getQueryCondition(this.type, this._cond).join(' AND ');
    }

    if (this._orderBy && Object.keys(this._orderBy).length > 0) {
      sql += ' ORDER BY ' + this.helper.getQueryOrder(this.type, this._orderBy, this._populateMap).join(', ');
    }

    sql += this.helper.getQueryPagination(this._limit, this._offset);

    if (this.type === QueryType.TRUNCATE && this.platform.usesCascadeStatement()) {
      sql += ' CASCADE';
    }

    return this.helper.finalize(this.type, sql, this.metadata[this.entityName]);
  }

  getParams(): any[] {
    this.finalize();
    let ret: any[] = [];

    if (this.type === QueryType.INSERT && this._data) {
      ret = Object.values(this._data);
    } else if (this.type === QueryType.UPDATE) {
      ret = Object.values(this._data);
    }

    if (this._cond) {
      ret = ret.concat(this.helper.getWhereParams(this._cond));
    }

    if (this._limit) {
      ret.push(this._limit);
    }

    if (this._offset) {
      ret.push(this._offset);
    }

    return ret;
  }

  async execute(method: 'all' | 'get' | 'run' = 'all', mapResults = true): Promise<any> {
    const res = await this.connection.execute(this.getQuery(), this.getParams(), method);

    if (!mapResults) {
      return res;
    }

    if (method === 'all' && Array.isArray(res)) {
      return res.map((r: any) => this.driver.mapResult(r, this.metadata[this.entityName]));
    }

    return this.driver.mapResult(res, this.metadata[this.entityName]);
  }

  private prepareFields(fields: string[], glue = ', '): string {
    const ret: string[] = [];

    fields.forEach(f => {
      if (this._joins[f]) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]));
        return;
      }

      const prop = this.metadata[this.entityName].properties[f];
      ret.push(this.helper.mapper(this.type, prop ? prop.fieldName : f));
    });

    Object.keys(this._populateMap).forEach(f => {
      if (!fields.includes(f)) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]));
      }

      if (this._joins[f].prop.reference !== ReferenceType.ONE_TO_ONE) {
        Utils.renameKey(this._cond, this._joins[f].inverseJoinColumn!, `${this._joins[f].alias}.${this._joins[f].inverseJoinColumn!}`);
      }
    });

    if (this.flags.includes(QueryFlag.COUNT)) {
      if (this.flags.includes(QueryFlag.DISTINCT)) {
        return `COUNT(DISTINCT ${ret[0]}) AS ${this.helper.wrap('count')}`;
      }

      return `COUNT(${ret[0]}) AS ${this.helper.wrap('count')}`;
    }

    return ret.join(glue);
  }

  private processWhere(cond: any): any {
    cond = Object.assign({}, cond); // copy first

    Object.keys(cond).forEach(field => {
      this.helper.replaceEmptyInConditions(cond, field);

      if (!this.metadata[this.entityName] || !this.metadata[this.entityName].properties[field]) {
        return;
      }

      const prop = this.metadata[this.entityName].properties[field];

      if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
        this.processCollection(prop, cond);
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
    this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, alias2, 'left');
    const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
    Utils.renameKey(cond, prop.name, `${alias2}.${prop2.referenceColumnName}`);
  }

  private processCollection(prop: EntityProperty, cond: any): void {
    if (prop.reference === ReferenceType.MANY_TO_MANY) {
      const alias1 = `e${this.aliasCounter++}`;
      const join = {
        type: 'left',
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
    } else if (prop.reference === ReferenceType.ONE_TO_MANY) {
      const alias2 = `e${this.aliasCounter++}`;
      this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, alias2, 'left');
      Utils.renameKey(cond, prop.name, `${alias2}.${prop.referenceColumnName}`);
    }
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

  private getQueryBase(): string {
    let sql = this.type + ' ';

    switch (this.type) {
      case QueryType.SELECT:
        sql += this.prepareFields(this._fields);
        sql += ` FROM ${this.helper.getTableName(this.entityName, true)} AS ${this.helper.wrap(this.alias)}`;
        sql += this.helper.processJoins(this._joins);
        break;
      case QueryType.INSERT:
        sql += `INTO ${this.helper.getTableName(this.entityName, true)}`;
        sql += ' (' + Object.keys(this._data).map(k => this.helper.wrap(k)).join(', ') + ')';
        sql += ' VALUES (' + Object.keys(this._data).map(() => '?').join(', ') + ')';
        break;
      case QueryType.UPDATE:
        sql += this.helper.getTableName(this.entityName, true);
        sql += ' SET ' + Object.keys(this._data).map(k => this.helper.wrap(k) + ' = ?').join(', ');
        break;
      case QueryType.DELETE:
        sql += 'FROM ' + this.helper.getTableName(this.entityName, true);
        break;
      case QueryType.TRUNCATE:
        sql += 'TABLE ' + this.helper.getTableName(this.entityName, true);
        break;
    }

    return sql;
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
        this._joins[field] = this.helper.joinPivotTable(field, prop, this.alias, `e${this.aliasCounter++}`, 'left');
        this._populateMap[field] = this._joins[field].alias;
      } else if (this.helper.isOneToOneInverse(field)) {
        const prop = this.metadata[this.entityName].properties[field];
        this._joins[prop.name] = this.helper.joinOneToReference(prop, this.alias, `e${this.aliasCounter++}`, 'left');
        this._populateMap[field] = this._joins[field].alias;
      }
    });

    this.finalized = true;
  }

}

export interface JoinOptions {
  table: string;
  type: 'left' | 'inner';
  alias: string;
  ownerAlias: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  primaryKey?: string;
  prop: EntityProperty;
}
