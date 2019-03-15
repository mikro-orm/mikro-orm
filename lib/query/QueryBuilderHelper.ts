import { Utils } from '../utils';
import { EntityMetadata } from '../decorators';
import { QueryOrder, QueryType } from './enums';
import { Platform } from '../platforms/Platform';

export class QueryBuilderHelper {

  static readonly GROUP_OPERATORS = {
    $and: 'AND',
    $or: 'OR',
  };

  static readonly OPERATORS = {
    $eq: '=',
    $in: 'IN',
    $nin: 'NOT IN',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $ne: '!=',
  };

  private readonly quoteChar = this.platform.getIdentifierQuoteCharacter();

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly platform: Platform) { }

  private getGroupWhereParams(key: string, cond: Record<string, any>): any[] {
    if (key === '$and' || key === '$or') {
      return Utils.flatten(cond.map((sub: any) => this.getWhereParams(sub)));
    } else {
      return this.getWhereParams(cond);
    }
  }

  getWhereParams(conditions: Record<string, any>): any[] {
    const ret: any[] = [];

    Object.entries(conditions).forEach(([key, cond]) => {
      if (['$and', '$or', '$not'].includes(key)) {
        return ret.push(...this.getGroupWhereParams(key, cond));
      }

      // grouped condition for one field
      if (Utils.isObject(cond) && Object.keys(cond).length > 1) {
        const subConditions = Object.entries(cond).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
        return ret.push(...this.getWhereParams({ $and: subConditions }));
      }

      if (Utils.isObject(cond)) {
        const operator = Object.keys(QueryBuilderHelper.OPERATORS).find(op => cond[op])!;

        if (cond[operator]) {
          return ret.push(...(Array.isArray(cond[operator]) ? cond[operator] : [cond[operator]]));
        }
      }

      if (cond instanceof RegExp) {
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

    return this.quoteChar + field + this.quoteChar;
  }

  mapper(type: QueryType, field: string, value?: any): string {
    let ret = this.wrap(field);

    if (this.isQuoted(field)) {
      const [a, f] = field.split('.');
      ret = this.wrap(a) + '.' + this.wrap(f);
    }

    if (typeof value !== 'undefined') {
      ret += this.processValue(value);
    }

    if (type !== QueryType.SELECT || this.isQuoted(ret)) {
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

  processJoins(leftJoins: Record<string, [string, string, string, string, string]>): string {
    return Object.values(leftJoins).map(([table, alias, column, , pk]) => {
      return ` LEFT JOIN ${this.wrap(table)} AS ${this.wrap(alias)} ON ${this.wrap(this.alias)}.${this.wrap(pk)} = ${this.wrap(alias)}.${this.wrap(column)}`;
    }).join('');
  }

  mapJoinColumns(type: QueryType, join: [string, string, string, string, string]): string[] {
    return [
      this.mapper(type, `${join[1]}.${join[2]}`),
      this.mapper(type, `${join[1]}.${join[3]}`),
    ];
  }

  getTableName(entityName: string, wrap = false): string {
    const name = this.metadata[entityName] ? this.metadata[entityName].collection : entityName;

    if (wrap) {
      return this.wrap(name);
    }

    return name;
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
    return Object.keys(cond).map(k => {
      if (k === '$and' || k === '$or') {
        return this.getGroupQueryCondition(type, k, cond[k]);
      }

      if (k === '$not') {
        return 'NOT (' + this.getQueryCondition(type, cond[k])[0] + ')';
      }

      // grouped condition for one field
      if (Utils.isObject(cond[k]) && Object.keys(cond[k]).length > 1) {
        const subCondition = Object.entries(cond[k]).map(([subKey, subValue]) => ({ [k]: { [subKey]: subValue } }));
        return this.getGroupQueryCondition(type, '$and', subCondition);
      }

      return this.mapper(type, k, cond[k]);
    });
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

  finalize(type: QueryType, sql: string, meta?: EntityMetadata): string {
    let append = '';
    const useReturningStatement = type === QueryType.INSERT && this.platform.usesReturningStatement();

    if (useReturningStatement && meta && meta.properties[meta.primaryKey]) {
      const prop = meta.properties[meta.primaryKey];
      append = ` RETURNING ${this.wrap(prop.fieldName)}`;
    }

    if (this.platform.getParameterPlaceholder() === '?') {
      return sql + append;
    }

    let index = 1;
    return sql.replace(/(\?)/g, () => {
      return this.platform.getParameterPlaceholder(index++);
    }) + append;
  }

  private processValue(value: any): string | undefined {
    if (value instanceof RegExp) {
      return ' LIKE ?';
    }

    if (Utils.isObject(value)) {
      return this.processObjectValue(value);
    }

    return ' = ?';
  }

  private processObjectValue(value: any): string | undefined {
    for (const [op, replacement] of Object.entries(QueryBuilderHelper.OPERATORS)) {
      if (!value[op]) {
        continue;
      }

      const token = Array.isArray(value[op]) ? `(${value[op].map(() => '?').join(', ')})` : '?';
      return ` ${replacement} ${token}`;
    }
  }

  private getGroupQueryCondition(type: QueryType, operator: '$and' | '$or', subCondition: any): string {
    const glue = QueryBuilderHelper.GROUP_OPERATORS[operator];
    const group = subCondition.map((sub: any) => this.getQueryCondition(type, sub)[0]);

    return '(' + group.join(` ${glue} `) + ')';
  }

  private isQuoted(field: string): boolean {
    return new RegExp(`${this.quoteChar}?\\w{2}${this.quoteChar}?\\.`).test(field);
  }

}
