import Knex, { JoinClause, QueryBuilder as KnexQueryBuilder, Raw } from 'knex';
import { Utils, ValidationError } from '../utils';
import { EntityMetadata, EntityProperty } from '../decorators';
import { FlatQueryOrderMap, QueryOrderMap, QueryOrderNumeric, QueryType } from './enums';
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

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin', cond: Record<string, any> = {}): JoinOptions {
    const meta = this.metadata.get(prop.type);
    const prop2 = meta.properties[prop.mappedBy || prop.inversedBy];

    return {
      table: this.getTableName(prop.type),
      joinColumn: prop.owner ? prop2.referenceColumnName : prop2.fieldName,
      inverseJoinColumn: prop.owner ? prop2.referenceColumnName : prop.referenceColumnName,
      primaryKey: prop.owner ? prop.joinColumn : prop2.referenceColumnName,
      ownerAlias,
      alias,
      prop,
      type,
      cond,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin', cond: Record<string, any> = {}): JoinOptions {
    return {
      table: this.getTableName(prop.type),
      joinColumn: prop.referenceColumnName,
      primaryKey: prop.fieldName,
      ownerAlias,
      alias,
      prop,
      type,
      cond,
    };
  }

  joinManyToManyReference(prop: EntityProperty, ownerAlias: string, alias: string, pivotAlias: string, type: 'leftJoin' | 'innerJoin', cond: Record<string, any>): Record<string, JoinOptions> {
    const join = {
      prop,
      type,
      cond,
      ownerAlias,
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

    if (prop.owner) {
      const prop2 = this.metadata.get(prop.pivotTable).properties[prop.type];
      ret[`${pivotAlias}.${prop2.name}`] = this.joinManyToOneReference(prop2, pivotAlias, alias, type);
    } else {
      const prop2 = this.metadata.get(prop.type).properties[prop.mappedBy];
      const prop3 = this.metadata.get(prop2.pivotTable).properties[prop.type];
      ret[`${pivotAlias}.${prop3.name}`] = this.joinManyToOneReference(prop3, pivotAlias, alias, type);
    }

    return ret;
  }

  joinPivotTable(field: string, prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin', cond: Record<string, any> = {}): JoinOptions {
    const prop2 = this.metadata.get(field).properties[prop.mappedBy || prop.inversedBy];

    return {
      table: this.metadata.get(field).collection,
      joinColumn: prop.joinColumn,
      inverseJoinColumn: prop2.joinColumn,
      primaryKey: prop.referenceColumnName,
      ownerAlias,
      alias,
      prop,
      type,
      cond,
    };
  }

  processJoins(qb: KnexQueryBuilder, joins: Record<string, JoinOptions>): void {
    Object.values(joins).forEach(join => {
      const table = `${join.table} as ${join.alias}`;
      const left = `${join.ownerAlias}.${join.primaryKey!}`;
      const right = `${join.alias}.${join.joinColumn!}`;

      if (join.cond) {
        return qb[join.type](table, inner => {
          inner.on(left, right);
          this.appendJoinClause(inner, join.cond);
        });
      }

      qb[join.type](table, left, right);
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

    if (this.isCustomExpression(key)) {
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
      return void qb[m](inner => subCondition.map((sub: any) => this.appendQueryCondition(type, sub, inner, '$and', method)));
    }

    // operators
    for (const [op, replacement] of Object.entries(QueryBuilderHelper.OPERATORS)) {
      if (!(op in cond[key])) {
        continue;
      }

      qb[m](this.mapper(key, type), replacement, cond[key][op]);

      break;
    }
  }

  private appendJoinClause(clause: JoinClause, cond: Record<string, any>, operator?: '$and' | '$or'): void {
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

    if (this.isCustomExpression(key)) {
      return this.processCustomExpression(clause, m, key, cond);
    }

    const op = cond[key] === null ? 'is' : '=';
    clause[m](this.knex.raw(`${this.knex.ref(this.mapper(key, QueryType.SELECT, cond[key]))} ${op} ?`, cond[key]));
  }

  private processObjectSubClause(cond: any, key: string, clause: JoinClause, m: 'andOn' | 'orOn'): void {
    // grouped condition for one field
    if (Object.keys(cond[key]).length > 1) {
      const subCondition = Object.entries(cond[key]).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return void clause[m](inner => subCondition.map((sub: any) => this.appendJoinClause(inner, sub, '$and')));
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
      let alias = this.alias;
      let field = k;

      if (k.includes('.')) {
        [alias, field] = k.split('.');
      }

      alias = populate[alias] || alias;
      const direction = orderBy[k];
      const order = Utils.isNumber<QueryOrderNumeric>(direction) ? QueryOrderNumeric[direction] : direction;

      return { column: this.mapper(`${alias}.${field}`, type), order: order.toLowerCase() };
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

  isOperator(key: string): boolean {
    return !!QueryBuilderHelper.GROUP_OPERATORS[key] || !!QueryBuilderHelper.OPERATORS[key];
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
    const meta = this.metadata.get(entityName, false, false);
    const prop = meta ? meta.properties[field] : false;

    return prop ? prop.fieldName : field;
  }

}
