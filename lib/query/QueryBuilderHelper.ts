import { Utils } from '../utils';
import { EntityMetadata } from '../decorators';
import { QueryOrder, QueryType } from './enums';

export class QueryBuilderHelper {

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly metadata: Record<string, EntityMetadata>) { }

  getWhereParams(conditions: Record<string, any>): any[] {
    const ret: any[] = [];

    Object.values(conditions).forEach(cond => {
      if (Utils.isObject(cond) && cond.$in) {
        return ret.push(...cond.$in);
      } else if (cond instanceof RegExp) {
        return ret.push(this.getRegExpParam(cond));
      }

      ret.push(cond);
    });

    return ret;
  }

  wrap(field: string) {
    if (field === '*') {
      return field;
    }

    return '`' + field + '`';
  }

  mapper(type: QueryType, field: string, value: any = null): string {
    let ret = this.wrap(field);

    if (field.match(/`?\w{2}`?\./)) {
      const [a, f] = field.split('.');
      ret = this.wrap(a) + '.' + this.wrap(f);
    }

    if (value) {
      ret += this.processValue(value);
    }

    if (type !== QueryType.SELECT || ret.match(/`?\w{2}`?\./)) {
      return ret;
    }

    return this.wrap(this.alias) + '.' + ret;
  }

  processData(data: any): any {
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

  processJoins(leftJoins: Record<string, [string, string, string, string]>): string {
    return Object.values(leftJoins).map(([table, alias, column]) => {
      return ` LEFT JOIN \`${table}\` AS \`${alias}\` ON \`${this.alias}\`.\`id\` = \`${alias}\`.\`${column}\``;
    }).join('');
  }

  mapJoinColumns(type: QueryType, join: [string, string, string, string]): string[] {
    return [
      this.mapper(type, `${join[1]}.${join[2]}`),
      this.mapper(type, `${join[1]}.${join[3]}`),
    ];
  }

  getTableName(entityName: string): string {
    return this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
  }

  getRegExpParam(re: RegExp): string {
    const value = re.source
      .replace(/\.\*/g, '%') // .* -> %
      .replace(/\./g, '_')   // .  -> _
      .replace(/\\_/g, '.')  // \. -> .
      .replace(/^\^/g, '')   // remove ^ from start
      .replace(/\$$/g, '');  // remove $ from end

    if (re.source.startsWith('^') && re.source.endsWith('$')) {
      return value;
    }

    if (re.source.startsWith('^')) {
      return value + '%';
    }

    if (re.source.endsWith('$')) {
      return '%' + value;
    }

    return `%${value}%`;
  }

  getQueryCondition(type: QueryType, cond: any): string[] {
    return Object.keys(cond).map(k => this.mapper(type, k, cond[k]));
  }

  getQueryOrder(type: QueryType, orderBy: Record<string, QueryOrder>, populate: Record<string, string>): string[] {
    return Object.keys(orderBy).map(k => {
      let alias = this.alias;
      let field = k;

      if (k.includes('.')) {
        [alias, field] = k.split('.');
      }

      alias = populate[alias] || alias;

      return this.mapper(type, `${alias}.${field}`) + ' ' + QueryOrder[orderBy[k]];
    });
  }

  getQueryPagination(limit?: number, offset?: number): string {
    let pagination = '';

    if (limit) {
      pagination += ' LIMIT ?';
    }

    if (offset) {
      pagination += ' OFFSET ?';
    }

    return pagination;
  }

  private processValue(value: any): string | undefined {
    if (value && Utils.isObject(value) && value.$in) {
      return ` IN (${Object.keys(value.$in).map(() => '?').join(', ')})`;
    }

    if (value instanceof RegExp) {
      return ' LIKE ?';
    }

    if (value) {
      return ' = ?';
    }
  }

}
