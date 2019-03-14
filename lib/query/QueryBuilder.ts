import { Utils } from '../utils';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { EntityMetadata, EntityProperty } from '../decorators';
import { Connection } from '../connections/Connection';
import { ReferenceType } from '../entity';
import { QueryFlag, QueryOrder, QueryType } from './enums';
import { DriverConfig } from '..';

/**
 * SQL query builder
 */
export class QueryBuilder {

  type: QueryType;
  private aliasCounter = 1;
  private flags: QueryFlag[] = [];
  private _fields: string[];
  private _populate: Record<string, string> = {};
  private _leftJoins: Record<string, [string, string, string, string, string]> = {};
  private _cond: Record<string, any>;
  private _data: Record<string, any>;
  private _orderBy: Record<string, QueryOrder>;
  private _limit: number;
  private _offset: number;
  private readonly alias = `e0`;
  private readonly helper = new QueryBuilderHelper(this.entityName, this.alias, this.metadata, this.driverConfig);

  constructor(private readonly entityName: string,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly connection: Connection,
              private readonly driverConfig: DriverConfig) { }

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

  count(field = 'id', distinct = false): this {
    this.select(field);
    this.flags.push(QueryFlag.COUNT);

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

    return this;
  }

  where(cond: any): this {
    this._cond = this.processWhere(cond);
    return this;
  }

  orderBy(orderBy: Record<string, QueryOrder>): this {
    this._orderBy = orderBy;
    return this;
  }

  populate(populate: string[]): this {
    populate.forEach(field => {
      if (this.metadata[field]) {
        const prop = this.metadata[field].properties[this.entityName];
        const alias = `e${this.aliasCounter++}`;
        this._leftJoins[field] = [this.metadata[field].collection, alias, prop.joinColumn, prop.inverseJoinColumn, prop.referenceColumnName];
        this._populate[field] = alias;
      }
    });

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
    let sql = this.getQueryBase();

    if (this._cond && Object.keys(this._cond).length > 0) {
      sql += ' WHERE ' + this.helper.getQueryCondition(this.type, this._cond).join(' AND ');
    }

    if (this._orderBy && Object.keys(this._orderBy).length > 0) {
      sql += ' ORDER BY ' + this.helper.getQueryOrder(this.type, this._orderBy, this._populate).join(', ');
    }

    sql += this.helper.getQueryPagination(this._limit, this._offset);

    return sql;
  }

  getParams(): any[] {
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

  async execute(method?: string): Promise<any> {
    return this.connection.execute(this.getQuery(), this.getParams(), method);
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

    Object.keys(this._populate).forEach(f => {
      ret.push(...this.helper.mapJoinColumns(this.type, this._leftJoins[f]));
      Utils.renameKey(this._cond, this._leftJoins[f][3], `${this._leftJoins[f][1]}.${this._leftJoins[f][3]}`);
    });

    if (this.flags.includes(QueryFlag.COUNT)) {
      if (this.flags.includes(QueryFlag.DISTINCT)) {
        return `COUNT(DISTINCT ${ret[0]}) AS \`count\``;
      }

      return `COUNT(${ret[0]}) AS \`count\``;
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
        this.processCollection(prop, cond, field);
      } else {
        Utils.renameKey(cond, field, prop.fieldName);
      }
    });

    return cond;
  }

  private processCollection(prop: EntityProperty, cond: any, field: string): void {
    if (prop.reference === ReferenceType.MANY_TO_MANY) {
      const alias1 = `e${this.aliasCounter++}`;

      if (prop.owner) {
        this._leftJoins[prop.name] = [prop.pivotTable, alias1, prop.joinColumn, prop.inverseJoinColumn, prop.referenceColumnName];
      } else {
        const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
        this._leftJoins[prop.name] = [prop2.pivotTable, alias1, prop.joinColumn, prop.inverseJoinColumn, prop.referenceColumnName];
      }

      this._fields.push(prop.name);
      Utils.renameKey(cond, field, `${alias1}.${prop.inverseJoinColumn}`);
    } else if (prop.reference === ReferenceType.ONE_TO_MANY) {
      const alias2 = `e${this.aliasCounter++}`;
      const prop2 = this.metadata[prop.type].properties[prop.fk];
      this._leftJoins[prop.name] = [this.helper.getTableName(prop.type), alias2, prop2.fieldName, prop.referenceColumnName, prop.referenceColumnName];
      Utils.renameKey(cond, field, `${alias2}.${prop.referenceColumnName}`);
    }
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

}
