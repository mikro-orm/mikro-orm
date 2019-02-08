import { Utils } from './utils/Utils';
import { EntityMetadata, ReferenceType } from './decorators/Entity';

/**
 * SQL query builder
 */
export class QueryBuilder {

  type: QueryType;
  private aliasCounter = 1;
  private flags: QueryFlag[] = [];
  private _fields: string[];
  private _populate: { [field: string]: string } = {};
  private _leftJoins: { [field: string]: [string, string, string, string] } = {};
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
    this._fields = Array.isArray(fields) ? fields : [fields];

    return this;
  }

  insert(data: any): QueryBuilder {
    this.type = QueryType.INSERT;
    this._data = this.processData(data);

    return this;
  }

  update(data: any): QueryBuilder {
    this.type = QueryType.UPDATE;
    this._data = this.processData(data);

    return this;
  }

  delete(cond: any = {}): QueryBuilder {
    this.type = QueryType.DELETE;
    this._cond = this.processWhere(cond);

    return this;
  }

  truncate(): QueryBuilder {
    this.type = QueryType.TRUNCATE;
    return this;
  }

  count(field = 'id', distinct = false): QueryBuilder {
    this.select(field);
    this.flags.push(QueryFlag.COUNT);

    if (distinct) {
      this.flags.push(QueryFlag.DISTINCT);
    }

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
    populate.forEach(field => {
      if (this.metadata[field]) {
        const prop = this.metadata[field].properties[this.entityName];
        const alias = `e${this.aliasCounter++}`;
        this._leftJoins[field] = [this.metadata[field].collection, alias, prop.joinColumn, prop.inverseJoinColumn];
        this._populate[field] = alias;
      }
    });

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
      sql += ' ORDER BY ' + Object.keys(this._orderBy).map(k => {
        let alias = this.alias;
        let field = k;

        if (k.includes('.')) {
          [alias, field] = k.split('.');
        }

        alias = this._populate[alias] || alias;

        return this.mapper(`${alias}.${field}`) + ' ' + QueryOrder[this._orderBy[k]];
      }).join(', ');
    }

    if (this._limit) {
      sql += ' LIMIT ?';
    }

    if (this._offset) {
      sql += ' OFFSET ?';
    }

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

  private getWhereParams(): any[] {
    const ret: any[] = [];

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

  private mapper(field: string, value: any = null): string {
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

  private prepareFields(fields: string[], glue = ', '): string {
    const ret: string[] = [];

    fields.forEach(f => {
      if (this._leftJoins[f]) {
        ret.push(this.mapper(`${this._leftJoins[f][1]}.${this._leftJoins[f][2]}`));
        ret.push(this.mapper(`${this._leftJoins[f][1]}.${this._leftJoins[f][3]}`));

        return;
      }

      ret.push(this.mapper(f));

      Object.keys(this._populate).forEach(f => {
        ret.push(this.mapper(`${this._leftJoins[f][1]}.${this._leftJoins[f][2]}`));
        ret.push(this.mapper(`${this._leftJoins[f][1]}.${this._leftJoins[f][3]}`));
        Utils.renameKey(this._cond, this._leftJoins[f][3], `${this._leftJoins[f][1]}.${this._leftJoins[f][3]}`);
      });
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

    Object.keys(cond).forEach(k => {
      if (!this.metadata[this.entityName] || !this.metadata[this.entityName].properties[k]) {
        return;
      }

      const prop = this.metadata[this.entityName].properties[k];

      switch (prop.reference) {
        case ReferenceType.MANY_TO_MANY:
          const alias1 = `e${this.aliasCounter++}`;

          if (prop.owner) {
            this._leftJoins[prop.name] = [prop.pivotTable, alias1, prop.joinColumn, prop.inverseJoinColumn];
          } else {
            const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
            this._leftJoins[prop.name] = [prop2.pivotTable, alias1, prop.joinColumn, prop.inverseJoinColumn];
          }

          this._fields.push(prop.name);
          Utils.renameKey(cond, k, `${alias1}.${prop.inverseJoinColumn}`);
          break;

        case ReferenceType.ONE_TO_MANY:
          const alias2 = `e${this.aliasCounter++}`;
          const prop2 = this.metadata[prop.type].properties[prop.fk];
          this._leftJoins[prop.name] = [this.getTableName(prop.type), alias2, prop2.fieldName, prop.referenceColumnName];
          Utils.renameKey(cond, k, `${alias2}.${prop.referenceColumnName}`);
          break;

        default:
          Utils.renameKey(cond, k, prop.fieldName);
      }
    });

    return cond;
  }

  private processData(data: any): any {
    data = Object.assign({}, data); // copy first

    Object.keys(data).forEach(k => {
      if (this.metadata[this.entityName] && this.metadata[this.entityName].properties[k]) {
        const prop = this.metadata[this.entityName].properties[k];

        if (prop.fieldName) {
          Utils.renameKey(data, k, prop.fieldName);
        }
      }
    });

    return data;
  }

  private processJoins(): string {
    return Object.values(this._leftJoins).map(([table, alias, column]) => {
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
