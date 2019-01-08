import { Utils } from './Utils';
import { EntityMetadata, ReferenceType } from './BaseEntity';

/**
 * MySQL query builder
 */
export class QueryBuilder {

  private aliasCounter = 1;
  private type: QueryType;
  private flags: QueryFlag[] = [];
  private _fields: string | string[];
  private _populate: string[] = [];
  private _leftJoins: [string, string, string][] = [];
  private _cond: { [k: string]: any };
  private _data: { [k: string]: any };
  private _orderBy: { [p: string]: 1 | -1 };
  private _limit: number;
  private _offset: number;
  private alias = `e0`;

  constructor(private entityName: string,
              private metadata: { [entity: string]: EntityMetadata }) { }

  select(fields: string | string[]): QueryBuilder {
    this.type = QueryType.SELECT;
    this._fields = fields;

    return this;
  }

  insert(data: any): QueryBuilder {
    this.type = QueryType.INSERT;
    this._data = data;

    return this;
  }

  update(data: any): QueryBuilder {
    this.type = QueryType.UPDATE;
    this._data = data;

    return this;
  }

  delete(cond: any): QueryBuilder {
    this.type = QueryType.DELETE;
    this._cond = this.processWhere(cond);

    return this;
  }

  truncate(): QueryBuilder {
    this.type = QueryType.TRUNCATE;
    return this;
  }

  count(field: string = 'id'): QueryBuilder {
    this.select(field);
    this.flags.push(QueryFlag.COUNT);

    return this;
  }

  where(cond: any): QueryBuilder {
    this._cond = this.processWhere(cond);
    return this;
  }

  orderBy(orderBy: { [p: string]: 1 | -1 }): QueryBuilder {
    this._orderBy = orderBy;
    return this;
  }

  populate(populate: string[]): QueryBuilder {
    this._populate = populate;
    return this;
  }

  limit(limit: number, offset = 0): QueryBuilder {
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this;
  }

  offset(offset: number): QueryBuilder {
    this._offset = offset;
    return this;
  }

  getQuery(): string {
    let sql = this.type + ' ';

    switch (this.type) {
      case QueryType.SELECT:
        sql += this.prepareFields(this._fields);
        sql += ` FROM \`${this.getTableName(this.entityName)}\` AS \`${this.alias}\``;
        sql += this.processJoins();
        break;
      case QueryType.INSERT:
        sql += `INTO \`${this.getTableName(this.entityName)}\``;
        sql += ' (' + Object.keys(this._data).map(k => this.wrap(k)).join(', ') + ')';
        sql += ' VALUES (' + Object.keys(this._data).map(() => '?').join(', ') + ')';
        break;
      case QueryType.UPDATE:
        sql += `\`${this.getTableName(this.entityName)}\``;
        sql += ' SET ' + Object.keys(this._data).map(k => this.wrap(k) + ' = ?').join(', ');
        break;
      case QueryType.DELETE:
        sql += `FROM \`${this.getTableName(this.entityName)}\``;
        break;
      case QueryType.TRUNCATE:
        sql += `TABLE \`${this.getTableName(this.entityName)}\``;
        break;
    }

    if (this._cond && Object.keys(this._cond).length > 0) {
      sql += ' WHERE ' + Object.keys(this._cond).map(k => this.mapper(k, this._cond[k])).join(' AND ');
    }

    if (this._orderBy && Object.keys(this._orderBy).length > 0) {
      sql += ' ORDER BY ' + Object.keys(this._orderBy).map(k => this.mapper(k) + ' ' + QueryOrder[this._orderBy[k]]).join(', ');
    }

    if (this._limit) {
      sql += ' LIMIT ?';
    }

    if (this._offset) {
      sql += ' OFFSET ?';
    }

    return sql;
  }

  getParams(): any {
    let ret = [];

    if (this.type === QueryType.INSERT && this._data) {
      ret = Object.values(this._data);
    } else if (this.type === QueryType.UPDATE) {
      ret = Object.values(this._data);
    }

    if (this._cond) {
      ret = ret.concat(this.getWhereParams());
    }

    if (this._limit) {
      ret.push(this._limit);
    }

    if (this._offset) {
      ret.push(this._offset);
    }

    return ret;
  }

  private getWhereParams(): any {
    const ret = [];

    Object.values(this._cond).forEach(cond => {
      if (Utils.isObject(cond) && cond.$in) {
        return ret.push(...cond.$in);
      }

      ret.push(cond);
    });

    return ret;
  }

  private wrap(field: string) {
    if (field === '*') {
      return field;
    }

    return '`' + field + '`';
  }

  private mapper(field: string, value: any = null) {
    let ret = this.wrap(field);

    if (field.match(/`?\w{2}`?\./)) {
      const [a, f] = field.split('.');
      ret = this.wrap(a) + '.' + this.wrap(f);
    }

    if (value && Utils.isObject(value) && value.$in) {
      ret += ` IN (${Object.keys(value.$in).map(() => '?').join(', ')})`;
    } else if (value) {
      ret += ' = ?';
    }

    if (this.type !== QueryType.SELECT || ret.match(/`?\w{2}`?\./)) {
      return ret;
    }

    return this.wrap(this.alias) + '.' + ret;
  }

  private prepareFields(fields: string | string[], glue = ', '): string {
    const ret = Array.isArray(fields) ? fields.map(f => this.mapper(f)).join(glue) : this.mapper(fields);

    if (this.flags.includes(QueryFlag.COUNT)) {
      return `COUNT(${ret}) AS \`count\``;
    }

    return ret;
  }

  private processWhere(cond: any): any {
    Object.keys(cond).forEach(k => {
      if (this.metadata[this.entityName] && this.metadata[this.entityName].properties[k]) {
        const prop = this.metadata[this.entityName].properties[k];

        if (prop.reference === ReferenceType.MANY_TO_MANY) {
          const alias = `e${this.aliasCounter++}`;
          const fk1 = this.getTableName(this.entityName);
          const fk2 = this.getTableName(prop.type);

          if (prop.owner) {
            this._leftJoins.push([prop.pivotTable, alias, fk1]);
            const fk2 = this.getTableName(prop.type);
            Utils.renameKey(cond, k, `${alias}.${fk2}`)
          } else {
            const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
            this._leftJoins.push([prop2.pivotTable, alias, fk1]);
            Utils.renameKey(cond, k, `${alias}.${fk2}`);
          }
        }
      }
    });

    return cond;
  }

  private processJoins(): string {
    return this._leftJoins.map(([table, alias, column]) => {
      return ` LEFT JOIN \`${table}\` AS \`${alias}\` ON \`${this.alias}\`.\`id\` = \`${alias}\`.\`${column}\``;
    }).join('');
  }

  private getTableName(entityName: string): string {
    return this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
  }

}

export enum QueryType {
  TRUNCATE = 'TRUNCATE',
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum QueryFlag {
  COUNT = 'SELECT',
  DISTINCT = 'DISTINCT',
}

export enum QueryOrder {
  ASC = 1,
  DESC = -1,
}
