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
  readonly alias = `e0`;

  private aliasCounter = 1;
  private flags: QueryFlag[] = [];
  private finalized = false;
  private _fields: string[];
  private _populate: string[] = [];
  private _populateMap: Record<string, string> = {};
  private _leftJoins: Record<string, JoinOptions> = {};
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
              private readonly driver: IDatabaseDriver) { }

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

  where(cond: any, operator?: keyof typeof QueryBuilderHelper.GROUP_OPERATORS): this {
    if (!operator) {
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
      if (this._leftJoins[f]) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._leftJoins[f]));
        return;
      }

      ret.push(this.helper.mapper(this.type, f));
    });

    Object.keys(this._populateMap).forEach(f => {
      if (!fields.includes(f)) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._leftJoins[f]));
      }

      if (this._leftJoins[f].prop.reference !== ReferenceType.ONE_TO_ONE) {
        Utils.renameKey(this._cond, this._leftJoins[f].inverseJoinColumn!, `${this._leftJoins[f].alias}.${this._leftJoins[f].inverseJoinColumn!}`);
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
    const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
    const alias2 = this.joinOneToReference(prop, prop2);
    Utils.renameKey(cond, prop.name, `${alias2}.${prop2.referenceColumnName}`);
  }

  private processCollection(prop: EntityProperty, cond: any): void {
    if (prop.reference === ReferenceType.MANY_TO_MANY) {
      const alias1 = `e${this.aliasCounter++}`;
      const join = {
        alias: alias1,
        joinColumn: prop.joinColumn,
        inverseJoinColumn: prop.inverseJoinColumn,
        primaryKey: prop.referenceColumnName,
      } as JoinOptions;

      if (prop.owner) {
        this._leftJoins[prop.name] = Object.assign(join, { table: prop.pivotTable });
      } else {
        const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
        this._leftJoins[prop.name] = Object.assign(join, { table: prop2.pivotTable });
      }

      this._fields.push(prop.name);
      Utils.renameKey(cond, prop.name, `${alias1}.${prop.inverseJoinColumn}`);
    } else if (prop.reference === ReferenceType.ONE_TO_MANY) {
      const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
      const alias2 = this.joinOneToReference(prop, prop2);
      Utils.renameKey(cond, prop.name, `${alias2}.${prop.referenceColumnName}`);
    }
  }

  private joinOneToReference(prop: EntityProperty, prop2: EntityProperty): string {
    const alias2 = `e${this.aliasCounter++}`;
    this._leftJoins[prop.name] = {
      table: this.helper.getTableName(prop.type),
      alias: alias2,
      joinColumn: prop2.fieldName,
      inverseJoinColumn: prop2.referenceColumnName,
      primaryKey: prop.referenceColumnName,
      prop,
    };

    return alias2;
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.type = type;

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
        sql += this.helper.processJoins(this._leftJoins);
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
      if (this._leftJoins[field]) {
        return this._populateMap[field] = this._leftJoins[field].alias;
      }

      if (this.metadata[field]) { // pivot table entity
        const prop = this.metadata[field].properties[this.entityName];
        this._leftJoins[field] = {
          table: this.metadata[field].collection,
          alias: `e${this.aliasCounter++}`,
          joinColumn: prop.joinColumn,
          inverseJoinColumn: prop.inverseJoinColumn,
          primaryKey: prop.referenceColumnName,
          prop,
        };
        this._populateMap[field] = this._leftJoins[field].alias;
      } else if (this.helper.isOneToOneInverse(field)) {
        const prop = this.metadata[this.entityName].properties[field];
        const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
        this.joinOneToReference(prop, prop2);
        this._populateMap[field] = this._leftJoins[field].alias;
      }
    });

    this.finalized = true;
  }

}

export interface JoinOptions {
  table: string;
  alias: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  primaryKey?: string;
  prop: EntityProperty;
}
