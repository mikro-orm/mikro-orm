import Knex, { JoinClause, QueryBuilder as KnexQueryBuilder, Raw } from 'knex';
import { inspect } from 'util';

import { Utils, ValidationError } from '../utils';
import { Dictionary, EntityMetadata, EntityProperty } from '../typings';
import { FlatQueryOrderMap, QueryOrderNumeric, QueryType } from './enums';
import { Platform } from '../platforms';
import { JoinOptions } from './QueryBuilder';
import { ReferenceType } from '../entity';
import { LockMode } from '../unit-of-work';
import { MetadataStorage } from '../metadata';

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
    $not: 'not',
  };

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly aliasMap: Record<string, string>,
              private readonly metadata: MetadataStorage,
              private readonly knex: Knex,
              private readonly platform: Platform) { }

  mapper(field: string, type?: QueryType): string; // tslint:disable-next-line:lines-between-class-members
  mapper(field: string, type?: QueryType, value?: any, alias?: string): string; // tslint:disable-next-line:lines-between-class-members
  mapper(field: string, type = QueryType.SELECT, value?: any, alias?: string): string | Raw {
    let ret = field;
    const customExpression = QueryBuilderHelper.isCustomExpression(field);

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

  processData(data: Dictionary): any {
    data = Object.assign({}, data); // copy first
    const meta = this.metadata.get(this.entityName, false, false);

    Object.keys(data).forEach(k => {
      if (meta && meta.properties[k]) {
        const prop = meta.properties[k];

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

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    const meta = this.metadata.get(prop.type);
    const prop2 = meta.properties[prop.mappedBy || prop.inversedBy];

    return {
      prop, type, cond, ownerAlias, alias,
      table: this.getTableName(prop.type),
      joinColumn: prop.owner ? meta.primaryKey : prop2.fieldName,
      inverseJoinColumn: prop.owner ? meta.primaryKey : prop.referenceColumnName,
      primaryKey: prop.owner ? prop.joinColumn : prop2.referenceColumnName,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    return {
      prop, type, cond, ownerAlias, alias,
      table: this.getTableName(prop.type),
      joinColumn: prop.referenceColumnName,
      primaryKey: prop.fieldName,
    };
  }

  joinManyToManyReference(prop: EntityProperty, ownerAlias: string, alias: string, pivotAlias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary): Record<string, JoinOptions> {
    const join = {
      prop, type, cond, ownerAlias,
      alias: pivotAlias,
      inverseAlias: alias,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop.inverseJoinColumn,
      primaryKey: prop.referenceColumnName,
    } as JoinOptions;
    const name = `${ownerAlias}.${prop.name}`;
    const ret: Record<string, JoinOptions> = {};

    if (prop.owner) {
      ret[name] = Object.assign(join, { table: prop.pivotTable });
    } else {
      const meta = this.metadata.get(prop.type);
      const prop2 = meta.properties[prop.mappedBy];
      ret[name] = Object.assign(join, { table: prop2.pivotTable });
    }

    if (type === 'pivotJoin') {
      return ret;
    }

    const prop2 = this.metadata.get(prop.pivotTable).properties[prop.type + (prop.owner ? '_inverse' : '_owner')];
    ret[`${pivotAlias}.${prop2.name}`] = this.joinManyToOneReference(prop2, pivotAlias, alias, type);

    return ret;
  }

  joinPivotTable(field: string, prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    const prop2 = this.metadata.get(field).properties[prop.mappedBy || prop.inversedBy];

    return {
      prop, type, cond, ownerAlias, alias,
      table: this.metadata.get(field).collection,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop2.joinColumn,
      primaryKey: prop.referenceColumnName,
    };
  }

  processJoins(qb: KnexQueryBuilder, joins: Record<string, JoinOptions>): void {
    Object.values(joins).forEach(join => {
      const table = `${join.table} as ${join.alias}`;
      const left = `${join.ownerAlias}.${join.primaryKey!}`;
      const right = `${join.alias}.${join.joinColumn!}`;

      const method = join.type === 'pivotJoin' ? 'leftJoin' : join.type;
      return qb[method](table, inner => {
        inner.on(left, right);
        this.appendJoinClause(inner, join.cond);
      });
    });
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): (string | Raw)[] {
    if (join.prop && join.prop.reference === ReferenceType.ONE_TO_ONE && !join.prop.owner) {
      return [this.mapper(`${join.alias}.${join.inverseJoinColumn}`, type, undefined, join.prop.fieldName)];
    }

    return [
      this.mapper(`${join.alias}.${join.joinColumn}`, type),
      this.mapper(`${join.alias}.${join.inverseJoinColumn}`, type),
    ];
  }

  isOneToOneInverse(field: string): boolean {
    const meta = this.metadata.get(this.entityName);
    const prop = meta && meta.properties[field];

    return prop && prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
  }

  getTableName(entityName: string): string {
    const meta = this.metadata.get(entityName, false, false);
    return meta ? meta.collection : entityName;
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
        if (operator === '$or' && k === '$and') {
          return qb.orWhere(inner => this.appendGroupCondition(type, inner, k, method, cond[k]));
        }

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
      return void qb[m](this.mapper(key, type), 'like', this.getRegExpParam(cond[key]));
    }

    if (Utils.isObject(cond[key]) && !(cond[key] instanceof Date)) {
      return this.processObjectSubCondition(cond, key, qb, method, m, type);
    }

    if (QueryBuilderHelper.isCustomExpression(key)) {
      return this.processCustomExpression(qb, m, key, cond, type);
    }

    const op = cond[key] === null ? 'is' : '=';

    qb[m](this.mapper(key, type, cond[key]), op, cond[key]);
  }

  private processCustomExpression<T extends any[] = any[]>(clause: any, m: string, key: string, cond: any, type = QueryType.SELECT): void {
    // unwind parameters when ? found in field name
    const count = key.concat('?').match(/\?/g)!.length - 1;
    const value = Utils.asArray(cond[key]);
    const params1 = value.slice(0, count).map((c: any) => Utils.isObject(c) ? JSON.stringify(c) : c);
    const params2 = value.slice(count);
    const k = this.mapper(key, type, params1);

    if (params2.length > 0) {
      return void clause[m](k, this.knex.raw('?', params2));
    }

    clause[m](k);
  }

  private processObjectSubCondition(cond: any, key: string, qb: KnexQueryBuilder, method: 'where' | 'having', m: 'where' | 'orWhere' | 'having', type: QueryType): void {
    // grouped condition for one field
    if (Object.keys(cond[key]).length > 1) {
      const subCondition = Object.entries(cond[key]).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return void subCondition.forEach(sub => this.appendQueryCondition(type, sub, qb, '$and', method));
    }

    // operators
    const op = Object.keys(QueryBuilderHelper.OPERATORS).find(op => op in cond[key]);

    if (!op) {
      throw new Error(`Invalid query condition: ${inspect(cond)}`);
    }

    const replacement = QueryBuilderHelper.OPERATORS[op];
    qb[m](this.mapper(key, type), replacement, cond[key][op]);
  }

  private appendJoinClause(clause: JoinClause, cond: Dictionary, operator?: '$and' | '$or'): void {
    Object.keys(cond).forEach(k => {
      if (k === '$and' || k === '$or') {
        const method = operator === '$or' ? 'orOn' : 'andOn';
        const m = k === '$or' ? 'orOn' : 'andOn';
        return clause[method](outer => cond[k].forEach((sub: any) => {
          if (Object.keys(sub).length === 1) {
            return this.appendJoinClause(outer, sub, k);
          }

          outer[m](inner => this.appendJoinClause(inner, sub, '$and'));
        }));
      }

      this.appendJoinSubClause(clause, cond, k, operator);
    });
  }

  private appendJoinSubClause(clause: JoinClause, cond: any, key: string, operator?: '$and' | '$or'): void {
    const m = operator === '$or' ? 'orOn' : 'andOn';

    if (cond[key] instanceof RegExp) {
      return void clause[m](this.mapper(key), 'like', this.knex.raw('?', this.getRegExpParam(cond[key])));
    }

    if (Utils.isObject(cond[key]) && !(cond[key] instanceof Date)) {
      return this.processObjectSubClause(cond, key, clause, m);
    }

    if (QueryBuilderHelper.isCustomExpression(key)) {
      return this.processCustomExpression(clause, m, key, cond);
    }

    const op = cond[key] === null ? 'is' : '=';
    clause[m](this.knex.raw(`${this.knex.ref(this.mapper(key, QueryType.SELECT, cond[key]))} ${op} ?`, cond[key]));
  }

  private processObjectSubClause(cond: any, key: string, clause: JoinClause, m: 'andOn' | 'orOn'): void {
    // grouped condition for one field
    if (Object.keys(cond[key]).length > 1) {
      const subCondition = Object.entries(cond[key]).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return void clause[m](inner => subCondition.map(sub => this.appendJoinClause(inner, sub, '$and')));
    }

    // operators
    for (const [op, replacement] of Object.entries(QueryBuilderHelper.OPERATORS)) {
      if (!(op in cond[key])) {
        continue;
      }

      clause[m](this.mapper(key), replacement, this.knex.raw('?', cond[key][op]));

      break;
    }
  }

  getQueryOrder(type: QueryType, orderBy: FlatQueryOrderMap, populate: Record<string, string>): { column: string; order: string }[] {
    return Object.keys(orderBy).map(k => {
      // tslint:disable-next-line:prefer-const
      let [alias, field] = this.splitField(k);
      alias = populate[alias] || alias;
      const direction = orderBy[k];
      const order = Utils.isNumber<QueryOrderNumeric>(direction) ? QueryOrderNumeric[direction] : direction;

      return { column: this.mapper(`${alias}.${field}`, type), order: order.toLowerCase() };
    });
  }

  finalize(type: QueryType, qb: KnexQueryBuilder, meta?: EntityMetadata): void {
    const useReturningStatement = type === QueryType.INSERT && this.platform.usesReturningStatement() && meta && !meta.compositePK;

    if (useReturningStatement) {
      const returningProps = Object.values(meta!.properties).filter(prop => prop.primary || prop.default);
      qb.returning(returningProps.map(prop => prop.fieldName));
    }
  }

  splitField(field: string): [string, string] {
    const [a, b] = field.split('.');
    const fromAlias = b ? a : this.alias;
    const fromField = b || a;

    return [fromAlias, fromField];
  }

  getLockSQL(qb: KnexQueryBuilder, lockMode?: LockMode): void {
    if (lockMode === LockMode.PESSIMISTIC_READ) {
      return void qb.forShare();
    }

    if (lockMode === LockMode.PESSIMISTIC_WRITE) {
      return void qb.forUpdate();
    }

    const meta = this.metadata.get(this.entityName, false, false);

    if (lockMode === LockMode.OPTIMISTIC && meta && !meta.versionProperty) {
      throw ValidationError.lockFailed(this.entityName);
    }
  }

  updateVersionProperty(qb: KnexQueryBuilder): void {
    const meta = this.metadata.get(this.entityName, false, false);

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

  static isOperator(key: string, includeGroupOperators = true): boolean {
    if (!includeGroupOperators) {
      return !!QueryBuilderHelper.OPERATORS[key];
    }

    return !!QueryBuilderHelper.GROUP_OPERATORS[key] || !!QueryBuilderHelper.OPERATORS[key];
  }

  static isCustomExpression(field: string): boolean {
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
    if (subCondition.length === 1) {
      return this.appendQueryCondition(type, subCondition[0], qb, operator, method);
    }

    if (operator === '$and') {
      return subCondition.forEach(sub => this.appendQueryCondition(type, sub, qb, operator));
    }

    qb[method](outer => subCondition.forEach(sub => {
      if (Object.keys(sub).length === 1) {
        return this.appendQueryCondition(type, sub, outer, operator);
      }

      outer.orWhere(inner => this.appendQueryCondition(type, sub, inner, '$and'));
    }));
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/\w+\./);
  }

  private fieldName(field: string, alias?: string): string {
    const entityName = this.aliasMap[alias!] || this.entityName;
    const meta = this.metadata.get(entityName, false, false);
    const prop = meta ? meta.properties[field] : false;

    return prop ? prop.fieldName : field;
  }

}
