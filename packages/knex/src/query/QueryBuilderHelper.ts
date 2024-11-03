import type { Knex } from 'knex';
import { inspect } from 'node:util';
import {
  ALIAS_REPLACEMENT,
  ALIAS_REPLACEMENT_RE,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityProperty,
  type FlatQueryOrderMap,
  GroupOperator,
  LockMode,
  type MetadataStorage,
  OptimisticLockError,
  type QBFilterQuery,
  QueryOperator,
  QueryOrderNumeric,
  raw,
  RawQueryFragment,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import { JoinType, QueryType } from './enums';
import type { Field, JoinOptions } from '../typings';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';

/**
 * @internal
 */
export class QueryBuilderHelper {

  private readonly platform: AbstractSqlPlatform;
  private readonly metadata: MetadataStorage;

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly aliasMap: Dictionary<Alias<any>>,
              private readonly subQueries: Dictionary<string>,
              private readonly knex: Knex,
              private readonly driver: AbstractSqlDriver) {
    this.platform = this.driver.getPlatform();
    this.metadata = this.driver.getMetadata();
  }

  mapper(field: string | Knex.Raw, type?: QueryType): string;
  mapper(field: string | Knex.Raw, type?: QueryType, value?: any, alias?: string | null): string;
  mapper(field: string | Knex.Raw, type = QueryType.SELECT, value?: any, alias?: string | null): string | Knex.Raw {
    if (Utils.isRawSql(field)) {
      return this.knex.raw(field.sql, field.params);
    }

    /* istanbul ignore next */
    if (typeof field !== 'string') {
      return field;
    }

    const isTableNameAliasRequired = this.isTableNameAliasRequired(type);
    const fields = Utils.splitPrimaryKeys(field);

    if (fields.length > 1) {
      const parts: string[] = [];

      for (const p of fields) {
        const [a, f] = this.splitField(p);
        const prop = this.getProperty(f, a);
        const fkIdx2 = prop?.fieldNames.findIndex(name => name === f) ?? -1;

        if (fkIdx2 !== -1) {
          parts.push(this.mapper(a !== this.alias ? `${a}.${prop!.fieldNames[fkIdx2]}` : prop!.fieldNames[fkIdx2], type, value, alias));
        } else if (prop) {
          parts.push(...prop.fieldNames.map(f => this.mapper(a !== this.alias ? `${a}.${f}` : f, type, value, alias)));
        } else {
          parts.push(this.mapper(a !== this.alias ? `${a}.${f}` : f, type, value, alias));
        }
      }

      // flatten the value if we see we are expanding nested composite key
      // hackish, but cleaner solution would require quite a lot of refactoring
      if (fields.length !== parts.length && Array.isArray(value)) {
        value.forEach(row => {
          if (Array.isArray(row)) {
            const tmp = Utils.flatten(row);
            row.length = 0;
            row.push(...tmp);
          }
        });
      }

      return this.knex.raw('(' + parts.map(part => this.knex.ref(part)).join(', ') + ')');
    }

    const rawField = RawQueryFragment.getKnownFragment(field);

    if (rawField) {
      // sometimes knex is confusing the binding positions, we need to interpolate early
      return this.knex.raw(this.platform.formatQuery(rawField.sql, rawField.params));
    }

    const [a, f] = this.splitField(field as EntityKey);
    const prop = this.getProperty(f, a);
    const fkIdx2 = prop?.fieldNames.findIndex(name => name === f) ?? -1;
    const fkIdx = fkIdx2 === -1 ? 0 : fkIdx2;
    let ret = field;

    // embeddable nested path instead of a regular property with table alias, reset alias
    if (prop?.name === a && prop.embeddedProps[f]) {
      return this.alias + '.' + prop.fieldNames[fkIdx];
    }

    const noPrefix = prop && prop.persist === false;

    if (prop?.fieldNameRaw) {
      return this.knex.raw(this.prefix(field, isTableNameAliasRequired));
    }

    if (prop?.formula) {
      const alias2 = this.knex.ref(a).toString();
      const aliased = this.knex.ref(prop.fieldNames[0]).toString();
      const as = alias === null ? '' : ` as ${aliased}`;
      let value = prop.formula(alias2);

      if (!this.isTableNameAliasRequired(type)) {
        value = value.replaceAll(alias2 + '.', '');
      }

      return this.knex.raw(`${value}${as}`);
    }

    if (prop?.hasConvertToJSValueSQL) {
      let valueSQL: string;

      if (prop.fieldNames.length > 1 && fkIdx !== -1) {
        const fk = prop.targetMeta!.getPrimaryProps()[fkIdx];
        const prefixed = this.prefix(field, isTableNameAliasRequired, true, fkIdx);
        valueSQL = fk.customType!.convertToJSValueSQL!(prefixed, this.platform);
      } else  {
        const prefixed = this.prefix(field, isTableNameAliasRequired, true);
        valueSQL = prop.customType!.convertToJSValueSQL!(prefixed, this.platform);
      }

      if (alias === null) {
        return this.knex.raw(valueSQL);
      }

      return this.knex.raw(`${valueSQL} as ${this.platform.quoteIdentifier(alias ?? prop.fieldNames[fkIdx])}`);
    }

    // do not wrap custom expressions
    if (!rawField) {
      ret = this.prefix(field, false, false, fkIdx);
    }

    if (alias) {
      ret += ' as ' + alias;
    }

    if (!isTableNameAliasRequired || this.isPrefixed(ret) || noPrefix) {
      return ret;
    }

    return this.alias + '.' + ret;
  }

  processData(data: Dictionary, convertCustomTypes: boolean, multi = false): any {
    if (Array.isArray(data)) {
      return data.map(d => this.processData(d, convertCustomTypes, true));
    }

    const meta = this.metadata.find(this.entityName);

    data = this.driver.mapDataToFieldNames(data, true, meta?.properties, convertCustomTypes);

    if (!Utils.hasObjectKeys(data) && meta && multi) {
      /* istanbul ignore next */
      data[meta.getPrimaryProps()[0].fieldNames[0]] = this.platform.usesDefaultKeyword() ? this.knex.raw('default') : undefined;
    }

    return data;
  }

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: JoinType, cond: Dictionary = {}, schema?: string): JoinOptions {
    const prop2 = prop.targetMeta!.properties[prop.mappedBy || prop.inversedBy];
    const table = this.getTableName(prop.type);
    const joinColumns = prop.owner ? prop.referencedColumnNames : prop2.joinColumns;
    const inverseJoinColumns = prop.referencedColumnNames;
    const primaryKeys = prop.owner ? prop.joinColumns : prop2.referencedColumnNames;
    schema ??= prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(prop.targetMeta);
    cond = Utils.merge(cond, prop.where);

    return {
      prop, type, cond, ownerAlias, alias, table, schema,
      joinColumns, inverseJoinColumns, primaryKeys,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: JoinType, cond: Dictionary = {}, schema?: string): JoinOptions {
    return {
      prop, type, cond, ownerAlias, alias,
      table: this.getTableName(prop.type),
      schema: prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(prop.targetMeta, { schema }),
      joinColumns: prop.referencedColumnNames,
      primaryKeys: prop.fieldNames,
    };
  }

  joinManyToManyReference(prop: EntityProperty, ownerAlias: string, alias: string, pivotAlias: string, type: JoinType, cond: Dictionary, path: string, schema?: string): Dictionary<JoinOptions> {
    const pivotMeta = this.metadata.find(prop.pivotEntity)!;
    const ret = {
      [`${ownerAlias}.${prop.name}#${pivotAlias}`]: {
        prop, type, ownerAlias,
        alias: pivotAlias,
        inverseAlias: alias,
        joinColumns: prop.joinColumns,
        inverseJoinColumns: prop.inverseJoinColumns,
        primaryKeys: prop.referencedColumnNames,
        cond: {},
        table: pivotMeta.tableName,
        schema: prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(pivotMeta, { schema }),
        path: path.endsWith('[pivot]') ? path : `${path}[pivot]`,
      } as JoinOptions,
    };

    if (type === JoinType.pivotJoin) {
      return ret;
    }

    const prop2 = prop.owner ? pivotMeta.relations[1] : pivotMeta.relations[0];
    ret[`${pivotAlias}.${prop2.name}#${alias}`] = this.joinManyToOneReference(prop2, pivotAlias, alias, type, cond, schema);
    ret[`${pivotAlias}.${prop2.name}#${alias}`].path = path;
    const tmp = prop2.referencedTableName.split('.');
    ret[`${pivotAlias}.${prop2.name}#${alias}`].schema ??= tmp.length > 1 ? tmp[0] : undefined;

    return ret;
  }

  processJoins(qb: Knex.QueryBuilder, joins: Dictionary<JoinOptions>, schema?: string): void {
    Object.values(joins).forEach(join => {
      if ([JoinType.nestedInnerJoin, JoinType.nestedLeftJoin].includes(join.type)) {
        return;
      }

      const { sql, params } = this.createJoinExpression(join, joins, schema);
      qb.joinRaw(sql, params);
    });
  }

  createJoinExpression(join: JoinOptions, joins: Dictionary<JoinOptions>, schema?: string) {
    let table = join.table;
    const method = {
      [JoinType.nestedInnerJoin as string]: 'inner join',
      [JoinType.nestedLeftJoin as string]: 'left join',
      [JoinType.pivotJoin]: 'left join',
    }[join.type] ?? join.type;
    const conditions: string[] = [];
    const params: Knex.Value[] = [];
    schema = join.schema && join.schema !== '*' ? join.schema : schema;

    if (schema) {
      table = `${schema}.${table}`;
    }

    if (join.prop.name !== '__subquery__') {
      join.primaryKeys!.forEach((primaryKey, idx) => {
        const right = `${join.alias}.${join.joinColumns![idx]}`;

        if (join.prop.formula) {
          const alias = this.platform.quoteIdentifier(join.ownerAlias);
          const left = join.prop.formula(alias);
          conditions.push(`${left} = ${this.knex.ref(right)}`);
          return;
        }

        const left = join.prop.object && join.prop.fieldNameRaw
          ? join.prop.fieldNameRaw.replaceAll(ALIAS_REPLACEMENT, join.ownerAlias)
          : this.knex.ref(`${join.ownerAlias}.${primaryKey}`);

        conditions.push(`${left} = ${this.knex.ref(right)}`);
      });
    }

    if (join.prop.targetMeta?.discriminatorValue && !join.path?.endsWith('[pivot]')) {
      const typeProperty = join.prop.targetMeta!.root.discriminatorColumn!;
      const alias = join.inverseAlias ?? join.alias;
      join.cond[`${alias}.${typeProperty}`] = join.prop.targetMeta!.discriminatorValue;
    }

    let sql = method + ' ';

    if (join.nested) {
      sql += `(${this.knex.ref(table)} as ${this.knex.ref(join.alias)}`;

      for (const nested of join.nested) {
        const { sql: nestedSql, params: nestedParams } = this.createJoinExpression(nested, joins, schema);
        sql += ' ' + nestedSql;
        params.push(...nestedParams);
      }

      sql += `)`;
    } else if (join.subquery) {
      sql += `(${join.subquery}) as ${this.knex.ref(join.alias)}`;
    } else {
      sql += `${this.knex.ref(table)} as ${this.knex.ref(join.alias)}`;
    }

    for (const key of Object.keys(join.cond)) {
      const hasPrefix = key.includes('.') || Utils.isOperator(key) || RawQueryFragment.isKnownFragment(key);
      const newKey = hasPrefix ? key : `${join.alias}.${key}`;
      const clause = this.processJoinClause(newKey, join.cond[key], join.alias, params);

      /* istanbul ignore else */
      if (clause !== '()') {
        conditions.push(clause);
      }
    }

    if (conditions.length > 0) {
      sql += ` on ${conditions.join(' and ')}`;
    }

    return { sql, params };
  }

  private processJoinClause(key: string, value: unknown, alias: string, params: Knex.Value[], operator = '$eq'): string {
    if (Utils.isGroupOperator(key) && Array.isArray(value)) {
      const parts = value.map(sub => {
        return this.wrapQueryGroup(Object.keys(sub).map(k => this.processJoinClause(k, sub[k], alias, params)));
      });
      return this.wrapQueryGroup(parts, key);
    }

    if (this.isSimpleRegExp(value)) {
      params.push(this.getRegExpParam(value));
      return `${this.knex.ref(this.mapper(key))} like ?`;
    }

    if (value instanceof RegExp) {
      value = this.platform.getRegExpValue(value);
    }

    if (Utils.isOperator(key, false) && Utils.isPlainObject(value)) {
      const parts = Object.keys(value).map(k => this.processJoinClause(k, (value as Dictionary)[k], alias, params, key));

      return key === '$not' ? `not ${this.wrapQueryGroup(parts)}` : this.wrapQueryGroup(parts);
    }

    if (Utils.isPlainObject(value) && Object.keys(value).every(k => Utils.isOperator(k, false))) {
      const parts = Object.keys(value).map(op => this.processJoinClause(key, (value as Dictionary)[op], alias, params, op));

      return this.wrapQueryGroup(parts);
    }

    operator = operator === '$not' ? '$eq' : operator;

    if (value === null) {
      return `${this.knex.ref(this.mapper(key))} is ${operator === '$ne' ? 'not ' : ''}null`;
    }

    if (operator === '$fulltext') {
      const [fromAlias, fromField] = this.splitField(key as EntityKey);
      const property = this.getProperty(fromField, fromAlias);
      const query = this.knex.raw(this.platform.getFullTextWhereClause(property!), {
        column: this.mapper(key),
        query: this.knex.raw('?'),
      }).toSQL().toNative();
      params.push(value as Knex.Value);

      return query.sql;
    }

    const replacement = this.getOperatorReplacement(operator, { [operator]: value });

    if (['$in', '$nin'].includes(operator) && Array.isArray(value)) {
      params.push(...value as Knex.Value[]);
      return `${this.knex.ref(this.mapper(key))} ${replacement} (${value.map(() => '?').join(', ')})`;
    }

    if (operator === '$exists') {
      value = null;
    }

    const rawField = RawQueryFragment.getKnownFragment(key);

    if (rawField) {
      let sql = rawField.sql.replaceAll(ALIAS_REPLACEMENT, alias);
      params.push(...rawField.params as Knex.Value[]);
      params.push(...Utils.asArray(value) as Knex.Value[]);

      if ((Utils.asArray(value) as Knex.Value[]).length > 0) {
        sql += ' = ?';
      }

      return sql;
    }

    const sql = this.mapper(key);

    if (value !== null) {
      params.push(value as Knex.Value);
    }

    return `${this.knex.ref(sql)} ${replacement} ${value === null ? 'null' : '?'}`;
  }

  private wrapQueryGroup(parts: string[], operator = '$and') {
    if (parts.length === 1) {
      return parts[0];
    }

    return `(${parts.join(` ${GroupOperator[operator as keyof typeof GroupOperator]} `)})`;
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): (string | Knex.Raw)[] {
    if (join.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(join.prop.kind)) {
      return join.prop.fieldNames.map((_fieldName, idx) => {
        const columns = join.prop.owner ? join.joinColumns : join.inverseJoinColumns;
        return this.mapper(`${join.alias}.${columns![idx]}`, type, undefined, `${join.alias}__${columns![idx]}`);
      });
    }

    return [
      ...join.joinColumns!.map(col => this.mapper(`${join.alias}.${col}`, type, undefined, `fk__${col}`)),
      ...join.inverseJoinColumns!.map(col => this.mapper(`${join.alias}.${col}`, type, undefined, `fk__${col}`)),
    ];
  }

  isOneToOneInverse(field: string, meta?: EntityMetadata): boolean {
    meta ??= this.metadata.find(this.entityName)!;
    const prop = meta.properties[field.replace(/:ref$/, '')];

    return prop && prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner;
  }

  getTableName(entityName: string): string {
    const meta = this.metadata.find(entityName);
    return meta ? meta.collection : entityName;
  }

  /**
   * Checks whether the RE can be rewritten to simple LIKE query
   */
  isSimpleRegExp(re: any): re is RegExp {
    if (!(re instanceof RegExp)) {
      return false;
    }

    if (re.flags.includes('i')) {
      return false;
    }

    // when including the opening bracket/paren we consider it complex
    return !re.source.match(/[{[(]/);
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

  appendOnConflictClause<T>(type: QueryType, onConflict: { fields: string[] | RawQueryFragment; ignore?: boolean; merge?: EntityData<T> | Field<T>[]; where?: QBFilterQuery<T> }[], qb: Knex.QueryBuilder): void {
    onConflict.forEach(item => {
      let sub: Knex.OnConflictQueryBuilder<any, any>;

      if (Utils.isRawSql<RawQueryFragment>(item.fields)) {
        sub = qb.onConflict(this.knex.raw(item.fields.sql, item.fields.params));
      } else if (item.fields.length > 0) {
        sub = qb.onConflict(item.fields);
      } else {
        sub = qb.onConflict();
      }

      Utils.runIfNotEmpty(() => sub.ignore(), item.ignore);
      Utils.runIfNotEmpty(() => {
        let mergeParam: Dictionary | string[] = item.merge!;

        if (Utils.isObject(item.merge)) {
          mergeParam = {};
          Utils.keys(item.merge).forEach(key => {
            const k = this.mapper(key as string, type);
            (mergeParam as Dictionary)[k] = item.merge![key];
          });
        }

        if (Array.isArray(item.merge)) {
          mergeParam = (item.merge as string[]).map(key => this.mapper(key, type));
        }

        const sub2 = sub.merge(mergeParam);
        Utils.runIfNotEmpty(() => this.appendQueryCondition(type, item.where, sub2), item.where);
      }, 'merge' in item);
    });
  }

  appendQueryCondition(type: QueryType, cond: any, qb: Knex.QueryBuilder, operator?: '$and' | '$or', method: 'where' | 'having' = 'where'): void {
    const m = operator === '$or' ? 'orWhere' : 'andWhere';

    Object.keys(cond).forEach(k => {
      if (k === '$and' || k === '$or') {
        if (operator) {
          return qb[m](inner => this.appendGroupCondition(type, inner, k, method, cond[k]));
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

  private appendQuerySubCondition(qb: Knex.QueryBuilder, type: QueryType, method: 'where' | 'having', cond: any, key: string, operator?: '$and' | '$or'): void {
    const m = operator === '$or' ? 'orWhere' : method;

    if (cond[key] instanceof RawQueryFragment) {
      cond[key] = this.knex.raw(cond[key].sql, cond[key].params);
    }

    if (this.isSimpleRegExp(cond[key])) {
      return void qb[m](this.mapper(key, type), 'like', this.getRegExpParam(cond[key]));
    }

    if (Utils.isPlainObject(cond[key]) || cond[key] instanceof RegExp) {
      return this.processObjectSubCondition(cond, key, qb, method, m, type);
    }

    const op = cond[key] === null ? 'is' : '=';
    const raw = RawQueryFragment.getKnownFragment(key);

    if (raw) {
      const value = Utils.asArray(cond[key]);

      if (value.length > 0) {
        return void qb[m](this.knex.raw(raw.sql, raw.params), op, value[0]);
      }

      return void qb[m](this.knex.raw(raw.sql, raw.params));
    }

    if (this.subQueries[key]) {
      return void qb[m](this.knex.raw(`(${this.subQueries[key]})`), op, cond[key]);
    }

    qb[m](this.mapper(key, type, cond[key], null), op, cond[key]);
  }

  private processObjectSubCondition(cond: any, key: string, qb: Knex.QueryBuilder, method: 'where' | 'having', m: 'where' | 'orWhere' | 'having', type: QueryType): void {
    let value = cond[key];
    const size = Utils.getObjectKeysSize(value);

    if (Utils.isPlainObject(value) && size === 0) {
      return;
    }

    // grouped condition for one field, e.g. `{ age: { $gte: 10, $lt: 50 } }`
    if (size > 1) {
      const rawField = RawQueryFragment.getKnownFragment(key);
      const subCondition = Object.entries(value).map(([subKey, subValue]) => {
        key = rawField?.clone().toString() ?? key;
        return ({ [key]: { [subKey]: subValue } });
      });

      return subCondition.forEach(sub => this.appendQueryCondition(type, sub, qb, '$and', method));
    }

    if (value instanceof RegExp) {
      value = this.platform.getRegExpValue(value);
    }

    // operators
    const op = Object.keys(QueryOperator).find(op => op in value);

    /* istanbul ignore next */
    if (!op) {
      throw new Error(`Invalid query condition: ${inspect(cond, { depth: 5 })}`);
    }

    const replacement = this.getOperatorReplacement(op, value);
    const fields = Utils.splitPrimaryKeys(key);

    if (fields.length > 1 && Array.isArray(value[op])) {
      const singleTuple = !value[op].every((v: unknown) => Array.isArray(v));

      if (!this.platform.allowsComparingTuples()) {
        const mapped = fields.map(f => this.mapper(f, type));

        if (op === '$in') {
          const conds = value[op].map(() => {
            return `(${mapped.map(field => `${this.platform.quoteIdentifier(field)} = ?`).join(' and ')})`;
          });
          return void qb[m](this.knex.raw(`(${conds.join(' or ')})`, Utils.flatten(value[op])));
        }

        return void qb[m](this.knex.raw(`${mapped.map(field => `${this.platform.quoteIdentifier(field)} = ?`).join(' and ')}`, Utils.flatten(value[op])));
      }

      if (singleTuple) {
        const tmp = value[op].length === 1 && Utils.isPlainObject(value[op][0]) ? fields.map(f => value[op][0][f]) : value[op];
        value[op] = this.knex.raw(`(${fields.map(() => '?').join(', ')})`, tmp);
      }
    }

    if (value[op] instanceof RawQueryFragment) {
      value[op] = this.knex.raw(value[op].sql, value[op].params);
    }

    if (this.subQueries[key]) {
      return void qb[m](this.knex.raw(`(${this.subQueries[key]})`), replacement, value[op]);
    }

    if (op === '$fulltext') {
      const [a, f] = this.splitField(key as EntityKey);
      const prop = this.getProperty(f, a);

      /* istanbul ignore next */
      if (!prop) {
        throw new Error(`Cannot use $fulltext operator on ${key}, property not found`);
      }

      qb[m](this.knex.raw(this.platform.getFullTextWhereClause(prop), {
        column: this.mapper(key, type, undefined, null),
        query: value[op],
      }));
    } else {
      const mappedKey = this.mapper(key, type, value[op], null);
      qb[m](mappedKey, replacement, value[op]);
    }
  }

  private getOperatorReplacement(op: string, value: Dictionary): string {
    let replacement: string = QueryOperator[op as keyof typeof QueryOperator];

    if (op === '$exists') {
      replacement = value[op] ? 'is not' : 'is';
      value[op] = null;
    }

    if (value[op] === null && ['$eq', '$ne'].includes(op)) {
      replacement = op === '$eq' ? 'is' : 'is not';
    }

    if (op === '$re') {
      replacement = this.platform.getRegExpOperator(value[op], value.$flags);
    }

    return replacement;
  }

  getQueryOrder(type: QueryType, orderBy: FlatQueryOrderMap | FlatQueryOrderMap[], populate: Dictionary<string>): string[] {
    if (Array.isArray(orderBy)) {
      return orderBy.flatMap(o => this.getQueryOrder(type, o, populate));
    }

    return this.getQueryOrderFromObject(type, orderBy, populate);
  }

  getQueryOrderFromObject(type: QueryType, orderBy: FlatQueryOrderMap, populate: Dictionary<string>): string[] {
    const ret: string[] = [];

    for (const key of Object.keys(orderBy)) {
      const direction = orderBy[key];
      const order = Utils.isNumber<QueryOrderNumeric>(direction) ? QueryOrderNumeric[direction] : direction;
      const raw = RawQueryFragment.getKnownFragment(key);

      if (raw) {
        ret.push(...this.platform.getOrderByExpression(this.platform.formatQuery(raw.sql, raw.params), order));
        continue;
      }

      for (const f of Utils.splitPrimaryKeys(key)) {
        // eslint-disable-next-line prefer-const
        let [alias, field] = this.splitField(f, true);
        alias = populate[alias] || alias;

        const prop = this.getProperty(field, alias);
        const noPrefix = (prop && prop.persist === false && !prop.formula && !prop.embedded) || RawQueryFragment.isKnownFragment(f);
        const column = this.mapper(noPrefix ? field : `${alias}.${field}`, type, undefined, null);
        /* istanbul ignore next */
        const rawColumn = Utils.isString(column) ? column.split('.').map(e => this.knex.ref(e)).join('.') : column;
        const customOrder = prop?.customOrder;

        let colPart = customOrder
          ? this.platform.generateCustomOrder(rawColumn, customOrder)
          : rawColumn;

        if (Utils.isRawSql(colPart)) {
          colPart = this.platform.formatQuery(colPart.sql, colPart.params);
        }

        if (Array.isArray(order)) {
          order.forEach(part => ret.push(...this.getQueryOrderFromObject(type, part, populate)));
        } else {
          ret.push(...this.platform.getOrderByExpression(colPart, order));
        }
      }
    }

    return ret;
  }

  finalize(type: QueryType, qb: Knex.QueryBuilder, meta?: EntityMetadata, data?: Dictionary, returning?: Field<any>[]): void {
    const usesReturningStatement = this.platform.usesReturningStatement() || this.platform.usesOutputStatement();

    if (!meta || !data || !usesReturningStatement) {
      return;
    }

    // always respect explicit returning hint
    if (returning && returning.length > 0) {
      qb.returning(returning.map(field => this.mapper(field as string, type)));

      return;
    }

    if (type === QueryType.INSERT) {
      const returningProps = meta.hydrateProps
        .filter(prop => prop.returning || (prop.persist !== false && ((prop.primary && prop.autoincrement) || prop.defaultRaw)))
        .filter(prop => !(prop.name in data));

      if (returningProps.length > 0) {
        qb.returning(Utils.flatten(returningProps.map(prop => prop.fieldNames)));
      }

      return;
    }

    if (type === QueryType.UPDATE) {
      const returningProps = meta.hydrateProps.filter(prop => prop.fieldNames && Utils.isRawSql(data[prop.fieldNames[0]]));

      if (returningProps.length > 0) {
        qb.returning(returningProps.flatMap(prop => {
          if (prop.hasConvertToJSValueSQL) {
            const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
            const sql = prop.customType!.convertToJSValueSQL!(aliased, this.platform) + ' as ' + this.platform.quoteIdentifier(prop.fieldNames[0]);
            return [this.knex.raw(sql) as any];
          }
          return prop.fieldNames;
        }) as any);
      }
    }
  }

  splitField<T>(field: EntityKey<T>, greedyAlias = false): [string, EntityKey<T>, string | undefined] {
    const parts = field.split('.') as EntityKey<T>[];
    const ref = parts[parts.length - 1].split(':')[1];

    if (ref) {
      parts[parts.length - 1] = parts[parts.length - 1].substring(0, parts[parts.length - 1].indexOf(':')) as any;
    }

    if (parts.length === 1) {
      return [this.alias, parts[0], ref];
    }

    if (greedyAlias) {
      const fromField = parts.pop()!;
      const fromAlias = parts.join('.');
      return [fromAlias, fromField, ref];
    }

    const fromAlias = parts.shift()!;
    const fromField = parts.join('.') as EntityKey<T>;

    return [fromAlias, fromField, ref];
  }

  getLockSQL(qb: Knex.QueryBuilder, lockMode: LockMode, lockTables: string[] = []): void {
    const meta = this.metadata.find(this.entityName);

    if (lockMode === LockMode.OPTIMISTIC && meta && !meta.versionProperty) {
      throw OptimisticLockError.lockFailed(this.entityName);
    }

    switch (lockMode) {
      case LockMode.PESSIMISTIC_READ: return void qb.forShare(...lockTables);
      case LockMode.PESSIMISTIC_WRITE: return void qb.forUpdate(...lockTables);
      case LockMode.PESSIMISTIC_PARTIAL_WRITE: return void qb.forUpdate(...lockTables).skipLocked();
      case LockMode.PESSIMISTIC_WRITE_OR_FAIL: return void qb.forUpdate(...lockTables).noWait();
      case LockMode.PESSIMISTIC_PARTIAL_READ: return void qb.forShare(...lockTables).skipLocked();
      case LockMode.PESSIMISTIC_READ_OR_FAIL: return void qb.forShare(...lockTables).noWait();
    }
  }

  updateVersionProperty(qb: Knex.QueryBuilder, data: Dictionary): void {
    const meta = this.metadata.find(this.entityName);

    if (!meta?.versionProperty || meta.versionProperty in data) {
      return;
    }

    const versionProperty = meta.properties[meta.versionProperty];
    let sql = this.platform.quoteIdentifier(versionProperty.fieldNames[0]) + ' + 1';

    if (versionProperty.runtimeType === 'Date') {
      sql = this.platform.getCurrentTimestampSQL(versionProperty.length);
    }

    qb.update(versionProperty.fieldNames[0], this.knex.raw(sql));
  }

  private prefix(field: string, always = false, quote = false, idx?: number): string {
    let ret: string;

    if (!this.isPrefixed(field)) {
      const alias = always ? (quote ? this.alias : this.platform.quoteIdentifier(this.alias)) + '.' : '';
      const fieldName = this.fieldName(field, this.alias, always, idx) as string | RawQueryFragment;

      if (fieldName instanceof RawQueryFragment) {
        return fieldName.sql;
      }

      ret = alias + fieldName;
    } else {
      const [a, ...rest] = field.split('.');
      const f = rest.join('.');
      const fieldName = this.fieldName(f, a, always, idx) as string | RawQueryFragment;

      if (fieldName instanceof RawQueryFragment) {
        return fieldName.sql;
      }

      ret = a + '.' + fieldName;
    }

    if (quote) {
      return this.platform.quoteIdentifier(ret);
    }

    return ret;
  }

  private appendGroupCondition(type: QueryType, qb: Knex.QueryBuilder, operator: '$and' | '$or', method: 'where' | 'having', subCondition: any[]): void {
    // single sub-condition can be ignored to reduce nesting of parens
    if (subCondition.length === 1 || operator === '$and') {
      return subCondition.forEach(sub => this.appendQueryCondition(type, sub, qb, undefined, method));
    }

    qb[method](outer => subCondition.forEach(sub => {
      // skip nesting parens if the value is simple = scalar or object without operators or with only single key, being the operator
      const keys = Object.keys(sub);
      const val = sub[keys[0]];
      const simple = !Utils.isPlainObject(val) || Utils.getObjectKeysSize(val) === 1 || Object.keys(val).every(k => !Utils.isOperator(k));

      if (keys.length === 1 && simple) {
        return this.appendQueryCondition(type, sub, outer, operator);
      }

      outer.orWhere(inner => this.appendQueryCondition(type, sub, inner));
    }));
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/[\w`"[\]]+\./);
  }

  private fieldName(field: string, alias?: string, always?: boolean, idx = 0): string {
    const prop = this.getProperty(field, alias);

    if (!prop) {
      return field;
    }

    if (prop.fieldNameRaw) {
      if (!always) {
        return raw(prop.fieldNameRaw
          .replace(new RegExp(ALIAS_REPLACEMENT_RE + '\\.?', 'g'), '')
          .replace(this.platform.quoteIdentifier('') + '.', ''));
      }

      if (alias) {
        return raw(prop.fieldNameRaw.replace(new RegExp(ALIAS_REPLACEMENT_RE, 'g'), alias));
      }

      /* istanbul ignore next */
      return raw(prop.fieldNameRaw);
    }

    /* istanbul ignore next */
    return prop.fieldNames?.[idx] ?? field;
  }

  getProperty(field: string, alias?: string): EntityProperty | undefined {
    const entityName = this.aliasMap[alias!]?.entityName || this.entityName;
    const meta = this.metadata.find(entityName);

    // check if `alias` is not matching an embedded property name instead of alias, e.g. `address.city`
    if (alias && meta) {
      const prop = meta.properties[alias];

      if (prop?.kind === ReferenceKind.EMBEDDED) {
        // we want to select the full object property so hydration works as expected
        if (prop.object) {
          return prop;
        }

        const parts = field.split('.');
        const nest = (p: EntityProperty): EntityProperty => parts.length > 0 ? nest(p.embeddedProps[parts.shift()!]) : p;
        return nest(prop);
      }
    }

    if (meta) {
      if (meta.properties[field]) {
        return meta.properties[field];
      }

      return meta.relations.find(prop => prop.fieldNames?.some(name => field === name));
    }

    return undefined;
  }

  isTableNameAliasRequired(type?: QueryType): boolean {
    return [QueryType.SELECT, QueryType.COUNT].includes(type ?? QueryType.SELECT);
  }

  // workaround for https://github.com/knex/knex/issues/5257
  processOnConflictCondition(cond: QBFilterQuery, schema?: string): QBFilterQuery {
    const meta = this.metadata.get(this.entityName);
    const tableName = this.driver.getTableName(meta, { schema }, false);

    for (const key of Object.keys(cond)) {
      const mapped = this.mapper(key, QueryType.INSERT);
      Utils.renameKey(cond, key, tableName + '.' + mapped);
    }

    return cond;
  }

}

export interface Alias<T> {
  aliasName: string;
  entityName: string;
  metadata?: EntityMetadata<T>;
  subQuery?: Knex.QueryBuilder;
}
