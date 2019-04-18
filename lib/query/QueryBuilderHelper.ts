import { Utils } from '../utils';
import { EntityMetadata } from '../decorators';
import { QueryOrder, QueryType } from './enums';
import { Platform } from '../platforms';
import { JoinOptions } from './QueryBuilder';
import { ReferenceType } from '../entity';

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

  private readonly quoteChar = this.platform.getSchemaHelper().getIdentifierQuoteCharacter();

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly platform: Platform) { }

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

      if (cond instanceof RegExp) {
        return ret.push(this.getRegExpParam(cond));
      }

      if (!Utils.isObject(cond) && !Array.isArray(cond)) {
        return ret.push(cond);
      }

      ret.push(...this.processComplexParam(key, cond));
    });

    return ret;
  }

  wrap(field: string) {
    if (field === '*') {
      return field;
    }

    return this.quoteChar + field + this.quoteChar;
  }

  mapper(type: QueryType, field: string, value?: any, alias?: string): string {
    let ret = field;
    const customExpression = field.match(/\(.*\)/);

    // do not wrap custom expressions
    if (!customExpression) {
      ret = this.prefixAndWrap(field);
    }

    if (typeof value !== 'undefined') {
      ret += this.processValue(value);
    }

    if (alias) {
      ret += ' AS ' + this.wrap(alias);
    }

    if (type !== QueryType.SELECT || customExpression || this.isQuoted(ret)) {
      return ret;
    }

    return this.wrap(this.alias) + '.' + ret;
  }

  processData(data: any): any {
    data = Object.assign({}, data); // copy first

    Object.keys(data).forEach(k => {
      if (this.metadata[this.entityName] && this.metadata[this.entityName].properties[k]) {
        const prop = this.metadata[this.entityName].properties[k];

        if (Array.isArray(data[k])) {
          data[k] = JSON.stringify(data[k]);
        }

        if (prop.fieldName) {
          Utils.renameKey(data, k, prop.fieldName);
        }
      }
    });

    return data;
  }

  processJoins(leftJoins: Record<string, JoinOptions>): string {
    return Object.values(leftJoins).map(join => {
      return ` LEFT JOIN ${this.wrap(join.table)} AS ${this.wrap(join.alias)} ON ${this.wrap(this.alias)}.${this.wrap(join.primaryKey!)} = ${this.wrap(join.alias)}.${this.wrap(join.joinColumn!)}`;
    }).join('');
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): string[] {
    if (join.prop && join.prop.reference === ReferenceType.ONE_TO_ONE && !join.prop.owner) {
      return [this.mapper(type, `${join.alias}.${join.inverseJoinColumn}`, undefined, join.prop.fieldName)];
    }

    return [
      this.mapper(type, `${join.alias}.${join.joinColumn}`),
      this.mapper(type, `${join.alias}.${join.inverseJoinColumn}`),
    ];
  }

  isOneToOneInverse(field: string): boolean {
    const prop = this.metadata[this.entityName] && this.metadata[this.entityName].properties[field];
    return prop && prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
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

    if (useReturningStatement && meta) {
      const returningProps = Object.values(meta.properties).filter(prop => prop.primary || prop.default);
      append = ` RETURNING ${returningProps.map(prop => this.wrap(prop.fieldName)).join(', ')}`;
    }

    if (this.platform.getParameterPlaceholder() === '?') {
      return sql + append;
    }

    let index = 1;
    return sql.replace(/(\?)/g, () => {
      return this.platform.getParameterPlaceholder(index++);
    }) + append;
  }

  replaceEmptyInConditions(cond: any, field: string): void {
    if (QueryBuilderHelper.GROUP_OPERATORS[field as '$and' | '$or']) {
      cond[field].forEach((subCond: any) => Object.keys(subCond).forEach(key => this.replaceEmptyInConditions(subCond, key)));
      cond[field] = cond[field].filter((subCond: any) => !Utils.isObject(subCond) || Object.keys(subCond).length > 0);
      return;
    }

    if (!Utils.isObject(cond[field]) || cond[field] instanceof RegExp) {
      return;
    }

    // IN () is always false
    if (cond[field] && cond[field].$in && cond[field].$in.length === 0) {
      cond[field].$in = [null];
    }

    // NOT IN () is always true
    if (cond[field] && cond[field].$nin && cond[field].$nin.length === 0) {
      delete cond[field];
    }
  }

  private processComplexParam(key: string, cond: any): any[] {
    // unwind parameters when ? found in field name
    if (key.includes('?') && Array.isArray(cond)) {
      const count = key.match(/\?/g)!.length;
      return cond.slice(0, count).map(c => JSON.stringify(c)).concat(cond.slice(count));
    }

    const operator = Object.keys(QueryBuilderHelper.OPERATORS).find(op => cond[op])!;

    if (cond[operator]) {
      return Array.isArray(cond[operator]) ? cond[operator] : [cond[operator]];
    }

    return [cond];
  }

  private prefixAndWrap(field: string): string {
    if (!this.isQuoted(field)) {
      return this.wrap(field);
    }

    const [a, f] = field.split('.');

    return this.wrap(a) + '.' + this.wrap(f);
  }

  private getGroupWhereParams(key: string, cond: Record<string, any>): any[] {
    if (key === '$and' || key === '$or') {
      return Utils.flatten(cond.map((sub: any) => this.getWhereParams(sub)));
    } else {
      return this.getWhereParams(cond);
    }
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
