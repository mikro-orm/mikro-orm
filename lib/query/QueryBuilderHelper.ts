import * as Knex from 'knex';
import { QueryBuilder as KnexQueryBuilder, Raw } from 'knex';
import { Utils, ValidationError } from '../utils';
import { EntityMetadata, EntityProperty } from '../decorators';
import { QueryOrderMap, QueryOrderNumeric, QueryType } from './enums';
import { Platform } from '../platforms';
import { JoinOptions } from './QueryBuilder';
import { ReferenceType } from '../entity';
import { LockMode } from '../unit-of-work';

export class QueryBuilderHelper {

  static readonly GROUP_OPERATORS = {
    $and: 'and',
    $or: 'or',
  };

  static readonly OPERATORS = {
    $eq: '=',
    $in: 'in',
    $nin: 'not in',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $ne: '!=',
  };

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly aliasMap: Record<string, string>,
              private readonly metadata: Record<string, EntityMetadata>,
              private readonly knex: Knex,
              private readonly platform: Platform) { }

  mapper(type: QueryType, field: string, value?: any, alias?: string): string | Raw {
    let ret = field;
    const customExpression = this.isCustomExpression(field);

    // do not wrap custom expressions
    if (!customExpression) {
      ret = this.prefix(field);
    }

    if (alias) {
      ret += ' as ' + alias;
    }

    if (customExpression) {
      return this.knex.raw(ret, value);
    }

    if (![QueryType.SELECT, QueryType.COUNT].includes(type) || this.isPrefixed(ret)) {
      return ret;
    }

    return this.alias + '.' + ret;
  }

  processData(data: any): any {
    data = Object.assign({}, data); // copy first

    Object.keys(data).forEach(k => {
      if (this.metadata[this.entityName] && this.metadata[this.entityName].properties[k]) {
        const prop = this.metadata[this.entityName].properties[k];

        if (Array.isArray(data[k]) || (Utils.isObject(data[k]) && !(data[k] instanceof Date))) {
          data[k] = JSON.stringify(data[k]);
        }

        if (prop.fieldName) {
          Utils.renameKey(data, k, prop.fieldName);
        }
      }
    });

    return data;
  }

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin'): JoinOptions {
    const prop2 = this.metadata[prop.type].properties[prop.mappedBy || prop.inversedBy];
    return {
      table: this.getTableName(prop.type),
      joinColumn: prop.owner ? prop2.referenceColumnName : prop2.fieldName,
      inverseJoinColumn: prop2.referenceColumnName,
      primaryKey: prop.owner ? prop.joinColumn : prop.referenceColumnName,
      ownerAlias,
      alias,
      prop,
      type,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin'): JoinOptions {
    return {
      table: this.getTableName(prop.type),
      joinColumn: prop.inverseJoinColumn,
      primaryKey: prop.fieldName,
      ownerAlias,
      alias,
      prop,
      type,
    };
  }

  joinManyToManyReference(prop: EntityProperty, ownerAlias: string, alias: string, pivotAlias: string, type: 'leftJoin' | 'innerJoin'): Record<string, JoinOptions> {
    const join = {
      type,
      ownerAlias,
      alias: pivotAlias,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop.inverseJoinColumn,
      primaryKey: prop.referenceColumnName,
    } as JoinOptions;
    const name = `${pivotAlias}.${prop.name}`;
    const ret: Record<string, JoinOptions> = {};

    if (prop.owner) {
      ret[name] = Object.assign(join, { table: prop.pivotTable });
    } else {
      const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
      ret[name] = Object.assign(join, { table: prop2.pivotTable });
    }

    if (prop.owner) {
      const prop2 = this.metadata[prop.pivotTable].properties[prop.type];
      ret[prop2.name] = this.joinManyToOneReference(prop2, pivotAlias, alias, type);
    } else {
      const prop2 = this.metadata[prop.type].properties[prop.mappedBy];
      const prop3 = this.metadata[prop2.pivotTable].properties[prop.type];
      ret[prop3.name] = this.joinManyToOneReference(prop3, pivotAlias, alias, type);
    }

    return ret;
  }

  joinPivotTable(field: string, prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin'): JoinOptions {
    const prop2 = this.metadata[field].properties[prop.mappedBy || prop.inversedBy];
    return {
      table: this.metadata[field].collection,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop2.joinColumn,
      primaryKey: prop.referenceColumnName,
      ownerAlias,
      alias,
      prop,
      type,
    };
  }

  processJoins(qb: KnexQueryBuilder, joins: Record<string, JoinOptions>): void {
    Object.values(joins).forEach(join => {
      const table = `${join.table} as ${join.alias}`;
      const left = `${join.ownerAlias}.${join.primaryKey!}`;
      const right = `${join.alias}.${join.joinColumn!}`;
      qb[join.type](table, left, right);
    });
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): (string | Raw)[] {
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

  appendQueryCondition(type: QueryType, cond: any, qb: KnexQueryBuilder, operator?: '$and' | '$or', method: 'where' | 'having' = 'where'): void {
    Object.keys(cond).forEach(k => {
      if (k === '$and' || k === '$or') {
        return this.appendGroupCondition(type, qb, k, method, cond[k]);
      }

      if (k === '$not') {
        const m = operator === '$or' ? 'orWhereNot' : 'whereNot';
        return qb[m](inner => this.appendQueryCondition(type, cond[k], inner));
      }

      this.appendQuerySubCondition(qb, type, method, cond, k, operator);
    });
  }

  private appendQuerySubCondition(qb: KnexQueryBuilder, type: QueryType, method: 'where' | 'having', cond: any, key: string, operator?: '$and' | '$or'): void {
    const m = operator === '$or' ? 'orWhere' : method;

    if (cond[key] instanceof RegExp) {
      return void qb[m](this.mapper(type, key) as string, 'like', this.getRegExpParam(cond[key]));
    }

    if (Utils.isObject(cond[key]) && !(cond[key] instanceof Date)) {
      return this.processObjectSubCondition(cond, key, qb, method, m, type);
    }

    if (this.isCustomExpression(key)) {
      return this.processCustomExpression(key, cond, qb, m, type);
    }

    const op = cond[key] === null ? 'is' : '=';

    qb[m](this.mapper(type, key, cond[key]) as string, op, cond[key]);
  }

  private processCustomExpression(key: string, cond: any, qb: KnexQueryBuilder, m: 'where' | 'orWhere' | 'having', type: QueryType): void {
    // unwind parameters when ? found in field name
    const count = key.concat('?').match(/\?/g)!.length - 1;
    const params1 = cond[key].slice(0, count).map((c: any) => Utils.isObject(c) ? JSON.stringify(c) : c);
    const params2 = cond[key].slice(count);

    if (params2.length > 0) {
      return void qb[m](this.mapper(type, key, params1) as string, params2);
    }

    qb[m](this.mapper(type, key, params1) as string);
  }

  private processObjectSubCondition(cond: any, key: string, qb: Knex.QueryBuilder, method: 'where' | 'having', m: 'where' | 'orWhere' | 'having', type: QueryType): void {
    // grouped condition for one field
    if (Object.keys(cond[key]).length > 1) {
      const subCondition = Object.entries(cond[key]).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return void qb[m](inner => subCondition.map((sub: any) => this.appendQueryCondition(type, sub, inner, '$and', method)));
    }

    // operators
    for (const [op, replacement] of Object.entries(QueryBuilderHelper.OPERATORS)) {
      if (!(op in cond[key])) {
        continue;
      }

      qb[m](this.mapper(type, key) as string, replacement, cond[key][op]);

      break;
    }
  }

  getQueryOrder(type: QueryType, orderBy: QueryOrderMap, populate: Record<string, string>): { column: string, order: string }[] {
    return Object.keys(orderBy).map(k => {
      let alias = this.alias;
      let field = k;

      if (k.includes('.')) {
        [alias, field] = k.split('.');
      }

      alias = populate[alias] || alias;
      const direction = orderBy[k];
      const order = Utils.isNumber<QueryOrderNumeric>(direction) ? QueryOrderNumeric[direction] : direction;

      return { column: this.mapper(type, `${alias}.${field}`) as string, order: order.toLowerCase() };
    });
  }

  finalize(type: QueryType, qb: KnexQueryBuilder, meta?: EntityMetadata): void {
    const useReturningStatement = type === QueryType.INSERT && this.platform.usesReturningStatement();

    if (useReturningStatement && meta) {
      const returningProps = Object.values(meta.properties).filter(prop => prop.primary || prop.default);
      qb.returning(returningProps.map(prop => prop.fieldName));
    }
  }

  splitField(field: string): [string, string] {
    const [a, b] = field.split('.');
    const fromAlias = b ? a : this.alias;
    const fromField = b || a;

    return [fromAlias, fromField];
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

  getLockSQL(qb: KnexQueryBuilder, lockMode?: LockMode): void {
    if (lockMode === LockMode.PESSIMISTIC_READ) {
      return void qb.forShare();
    }

    if (lockMode === LockMode.PESSIMISTIC_WRITE) {
      return void qb.forUpdate();
    }

    if (lockMode === LockMode.OPTIMISTIC && this.metadata[this.entityName] && !this.metadata[this.entityName].versionProperty) {
      throw ValidationError.lockFailed(this.entityName);
    }
  }

  updateVersionProperty(qb: KnexQueryBuilder): void {
    const meta = this.metadata[this.entityName];

    if (!meta || !meta.versionProperty) {
      return;
    }

    const versionProperty = meta.properties[meta.versionProperty];
    let sql = versionProperty.fieldName + ' + 1';

    if (versionProperty.type.toLowerCase() === 'date') {
      sql = this.platform.getCurrentTimestampSQL(versionProperty.length);
    }

    qb.update(versionProperty.fieldName, this.knex.raw(sql));
  }

  private isCustomExpression(field: string): boolean {
    return !!field.match(/[ ?<>=()]|^\d/);
  }

  private prefix(field: string): string {
    if (!this.isPrefixed(field)) {
      return this.fieldName(field, this.alias);
    }

    const [a, f] = field.split('.');

    return a + '.' + this.fieldName(f, a);
  }

  private appendGroupCondition(type: QueryType, qb: KnexQueryBuilder, operator: '$and' | '$or', method: 'where' | 'having', subCondition: any[]): void {
    const m = operator === '$or' ? 'orWhere' : 'andWhere';
    qb[method](outer => subCondition.forEach((sub: any) => {
      if (Object.keys(sub).length === 1) {
        return this.appendQueryCondition(type, sub, outer, operator);
      }

      outer[m](inner => this.appendQueryCondition(type, sub, inner, '$and'));
    }));
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/\w+\./);
  }

  private fieldName(field: string, alias?: string): string {
    const entityName = this.aliasMap[alias!] || this.entityName;
    const prop = this.metadata[entityName] ? this.metadata[entityName].properties[field] : false;

    return prop ? prop.fieldName : field;
  }

}
