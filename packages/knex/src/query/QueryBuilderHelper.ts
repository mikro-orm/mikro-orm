import type { Knex } from 'knex';
import { inspect } from 'util';
import type { Dictionary, EntityData, EntityMetadata, EntityProperty, FlatQueryOrderMap, QBFilterQuery } from '@mikro-orm/core';
import { LockMode, OptimisticLockError, QueryOperator, QueryOrderNumeric, ReferenceType, Utils } from '@mikro-orm/core';
import { QueryType } from './enums';
import type { Field, JoinOptions } from '../typings';
import type { AbstractSqlDriver } from '../AbstractSqlDriver';

/**
 * @internal
 */
export class QueryBuilderHelper {

  private readonly platform = this.driver.getPlatform();
  private readonly metadata = this.driver.getMetadata();

  constructor(private readonly entityName: string,
              private readonly alias: string,
              private readonly aliasMap: Dictionary<string>,
              private readonly subQueries: Dictionary<string>,
              private readonly knex: Knex,
              private readonly driver: AbstractSqlDriver) { }

  mapper(field: string, type?: QueryType): string;
  mapper(field: string, type?: QueryType, value?: any, alias?: string | null): string;
  mapper(field: string, type = QueryType.SELECT, value?: any, alias?: string | null): string | Knex.Raw {
    const isTableNameAliasRequired = this.isTableNameAliasRequired(type);
    const fields = Utils.splitPrimaryKeys(field);

    if (fields.length > 1) {
      const parts: string[] = [];

      for (const p of fields) {
        const [a, f] = this.splitField(p);
        const prop = this.getProperty(f, a);

        if (prop) {
          parts.push(...prop.fieldNames.map(f => this.mapper(f, type, value, alias)));
        } else {
          parts.push(this.mapper(`${a}.${f}`, type, value, alias));
        }
      }

      return this.knex.raw('(' + parts.map(part => this.knex.ref(part)).join(', ') + ')');
    }

    let ret = field;
    const customExpression = QueryBuilderHelper.isCustomExpression(field, !!alias);
    const [a, f] = this.splitField(field);
    const prop = this.getProperty(f, a);
    const noPrefix = prop && prop.persist === false;

    if (prop?.fieldNameRaw) {
      return this.knex.raw(this.prefix(field, isTableNameAliasRequired));
    }

    if (prop?.formula) {
      const alias2 = this.knex.ref(a).toString();
      const aliased = this.knex.ref(prop.fieldNames[0]).toString();
      const as = alias === null ? '' : ` as ${aliased}`;

      return this.knex.raw(`${prop.formula(alias2)}${as}`);
    }

    if (prop?.customType?.convertToJSValueSQL) {
      const prefixed = this.prefix(field, isTableNameAliasRequired, true);
      const valueSQL = prop.customType.convertToJSValueSQL!(prefixed, this.platform);

      if (alias === null) {
        return this.knex.raw(valueSQL);
      }

      return this.knex.raw(`${valueSQL} as ${this.platform.quoteIdentifier(alias ?? prop.fieldNames[0])}`);
    }

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

    if (!isTableNameAliasRequired || this.isPrefixed(ret) || noPrefix) {
      return ret;
    }

    return this.alias + '.' + ret;
  }

  processData(data: Dictionary, convertCustomTypes: boolean, multi = false): any {
    if (Array.isArray(data)) {
      return data.map(d => this.processData(d, convertCustomTypes, true));
    }

    data = Object.assign({}, data); // copy first
    const meta = this.metadata.find(this.entityName);

    Object.keys(data).forEach(k => {
      if (!meta?.properties[k]) {
        return;
      }

      const prop = meta.properties[k];

      if (prop.joinColumns && Array.isArray(data[k])) {
        const copy = data[k];
        delete data[k];
        prop.joinColumns.forEach((joinColumn, idx) => data[joinColumn] = copy[idx]);

        return;
      }

      if (prop.customType && convertCustomTypes && !this.platform.isRaw(data[k])) {
        data[k] = prop.customType.convertToDatabaseValue(data[k], this.platform, true);
      }

      if (prop.customType && 'convertToDatabaseValueSQL' in prop.customType && !this.platform.isRaw(data[k])) {
        const quoted = this.platform.quoteValue(data[k]);
        data[k] = this.knex.raw(prop.customType.convertToDatabaseValueSQL!(quoted, this.platform));
      }

      if (!prop.customType && (Array.isArray(data[k]) || Utils.isPlainObject(data[k]))) {
        data[k] = JSON.stringify(data[k]);
      }

      if (prop.fieldNames) {
        Utils.renameKey(data, k, prop.fieldNames[0]);
      }
    });

    if (!Utils.hasObjectKeys(data) && meta && multi) {
      data[meta.primaryKeys[0]] = this.platform.usesDefaultKeyword() ? this.knex.raw('default') : undefined;
    }

    return data;
  }

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    const prop2 = prop.targetMeta!.properties[prop.mappedBy || prop.inversedBy];
    const table = this.getTableName(prop.type);
    const schema = this.driver.getSchemaName(prop.targetMeta);
    const joinColumns = prop.owner ? prop.referencedColumnNames : prop2.joinColumns;
    const inverseJoinColumns = prop.referencedColumnNames;
    const primaryKeys = prop.owner ? prop.joinColumns : prop2.referencedColumnNames;

    return {
      prop, type, cond, ownerAlias, alias, table, schema,
      joinColumns, inverseJoinColumns, primaryKeys,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    return {
      prop, type, cond, ownerAlias, alias,
      table: this.getTableName(prop.type),
      schema: this.driver.getSchemaName(prop.targetMeta),
      joinColumns: prop.referencedColumnNames,
      primaryKeys: prop.fieldNames,
    };
  }

  joinManyToManyReference(prop: EntityProperty, ownerAlias: string, alias: string, pivotAlias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary, path: string): Dictionary<JoinOptions> {
    const ret = {
      [`${ownerAlias}.${prop.name}#${pivotAlias}`]: {
        prop, type, cond, ownerAlias,
        alias: pivotAlias,
        inverseAlias: alias,
        joinColumns: prop.joinColumns,
        inverseJoinColumns: prop.inverseJoinColumns,
        primaryKeys: prop.referencedColumnNames,
        table: prop.pivotTable,
        schema: this.driver.getSchemaName(this.metadata.find(prop.pivotEntity)),
        path: path.endsWith('[pivot]') ? path : `${path}[pivot]`,
      } as JoinOptions,
    };

    if (type === 'pivotJoin') {
      return ret;
    }

    const prop2 = this.metadata.find(prop.pivotEntity)!.properties[prop.type + (prop.owner ? '_inverse' : '_owner')];
    ret[`${pivotAlias}.${prop2.name}#${alias}`] = this.joinManyToOneReference(prop2, pivotAlias, alias, type);
    ret[`${pivotAlias}.${prop2.name}#${alias}`].path = path;

    return ret;
  }

  joinPivotTable(field: string, prop: EntityProperty, ownerAlias: string, alias: string, type: 'leftJoin' | 'innerJoin' | 'pivotJoin', cond: Dictionary = {}): JoinOptions {
    const pivotMeta = this.metadata.find(field)!;
    const prop2 = pivotMeta.relations[0] === prop ? pivotMeta.relations[1] : pivotMeta.relations[0];

    return {
      prop, type, cond, ownerAlias, alias,
      table: pivotMeta.collection,
      schema: pivotMeta.schema,
      joinColumns: prop.joinColumns,
      inverseJoinColumns: prop2.joinColumns,
      primaryKeys: prop.referencedColumnNames,
    };
  }

  processJoins(qb: Knex.QueryBuilder, joins: Dictionary<JoinOptions>, schema?: string): void {
    Object.values(joins).forEach(join => {
      let table = `${join.table} as ${join.alias}`;
      const method = join.type === 'pivotJoin' ? 'leftJoin' : join.type;
      schema = join.schema && join.schema !== '*' ? join.schema : schema;

      if (schema) {
        table = `${schema}.${table}`;
      }

      return qb[method](this.knex.ref(table), inner => {
        join.primaryKeys!.forEach((primaryKey, idx) => {
          const left = `${join.ownerAlias}.${primaryKey}`;
          const right = `${join.alias}.${join.joinColumns![idx]}`;
          inner.on(left, right);
        });
        this.appendJoinClause(inner, join.cond);
      });
    });
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): (string | Knex.Raw)[] {
    if (join.prop && join.prop.reference === ReferenceType.ONE_TO_ONE && !join.prop.owner) {
      return join.prop.fieldNames.map((fieldName, idx) => {
        return this.mapper(`${join.alias}.${join.inverseJoinColumns![idx]}`, type, undefined, fieldName);
      });
    }

    return [
      ...join.joinColumns!.map(col => this.mapper(`${join.alias}.${col}`, type, undefined, `fk__${col}`)),
      ...join.inverseJoinColumns!.map(col => this.mapper(`${join.alias}.${col}`, type, undefined, `fk__${col}`)),
    ];
  }

  isOneToOneInverse(field: string): boolean {
    const meta = this.metadata.find(this.entityName)!;
    const prop = meta.properties[field];

    return prop && prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
  }

  getTableName(entityName: string): string {
    const meta = this.metadata.find(entityName);
    return meta ? meta.collection : entityName;
  }

  /**
   * Checks whether the RE can be rewritten to simple LIKE query
   */
  isSimpleRegExp(re: any): boolean {
    if (!(re instanceof RegExp)) {
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

  appendOnConflictClause<T>(type: QueryType, onConflict: { fields: string[]; ignore?: boolean; merge?: EntityData<T> | Field<T>[]; where?: QBFilterQuery<T> }[], qb: Knex.QueryBuilder): void {
    onConflict.forEach(item => {
      const sub = qb.onConflict(item.fields);
      Utils.runIfNotEmpty(() => sub.ignore(), item.ignore);
      Utils.runIfNotEmpty(() => {
        let mergeParam: Dictionary | string[] = item.merge!;

        if (Utils.isObject(item.merge)) {
          mergeParam = {};
          Object.keys(item.merge).forEach(key => {
            const k = this.mapper(key, type) as string;
            mergeParam[k] = item.merge![key];
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

    if (this.isSimpleRegExp(cond[key])) {
      return void qb[m](this.mapper(key, type), 'like', this.getRegExpParam(cond[key]));
    }

    if (Utils.isPlainObject(cond[key]) || cond[key] instanceof RegExp) {
      return this.processObjectSubCondition(cond, key, qb, method, m, type);
    }

    if (QueryBuilderHelper.isCustomExpression(key)) {
      return this.processCustomExpression(qb, m, key, cond, type);
    }

    const op = cond[key] === null ? 'is' : '=';

    if (this.subQueries[key]) {
      return void qb[m](this.knex.raw(`(${this.subQueries[key]})`), op, cond[key]);
    }

    qb[m](this.mapper(key, type, cond[key], null), op, cond[key]);
  }

  private processCustomExpression<T extends any[] = any[]>(clause: any, m: string, key: string, cond: any, type = QueryType.SELECT): void {
    // unwind parameters when ? found in field name
    const count = key.concat('?').match(/\?/g)!.length - 1;
    const value = Utils.asArray(cond[key]);
    const params1 = value.slice(0, count).map((c: any) => Utils.isObject(c) ? JSON.stringify(c) : c);
    const params2 = value.slice(count);
    const k = this.mapper(key, type, params1);

    if (params2.length > 0) {
      const val = params2.length === 1 && params2[0] === null ? null : this.knex.raw('?', params2);
      return void clause[m](k, val);
    }

    clause[m](k);
  }

  private processObjectSubCondition(cond: any, key: string, qb: Knex.QueryBuilder, method: 'where' | 'having', m: 'where' | 'orWhere' | 'having', type: QueryType): void {
    // grouped condition for one field
    let value = cond[key];

    if (Utils.getObjectKeysSize(value) > 1) {
      const subCondition = Object.entries(value).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return subCondition.forEach(sub => this.appendQueryCondition(type, sub, qb, '$and', method));
    }

    if (value instanceof RegExp) {
      value = { $re: value.source };
    }

    // operators
    const op = Object.keys(QueryOperator).find(op => op in value);

    if (!op) {
      throw new Error(`Invalid query condition: ${inspect(cond)}`);
    }

    const replacement = this.getOperatorReplacement(op, value);
    const fields = Utils.splitPrimaryKeys(key);

    if (fields.length > 1 && Array.isArray(value[op]) && !value[op].every((v: unknown) => Array.isArray(v))) {
      const values = this.platform.requiresValuesKeyword() ? 'values ' : '';
      value[op] = this.knex.raw(`${values}(${fields.map(() => '?').join(', ')})`, value[op]);
    }

    if (this.subQueries[key]) {
      return void qb[m](this.knex.raw(`(${this.subQueries[key]})`), replacement, value[op]);
    }

    qb[m](this.mapper(key, type, undefined, null), replacement, value[op]);
  }

  private getOperatorReplacement(op: string, value: Dictionary): string {
    let replacement = QueryOperator[op];

    if (value[op] === null && ['$eq', '$ne'].includes(op)) {
      replacement = op === '$eq' ? 'is' : 'is not';
    }

    if (op === '$re') {
      replacement = this.platform.getRegExpOperator();
    }

    return replacement;
  }

  private appendJoinClause(clause: Knex.JoinClause, cond: Dictionary, operator?: '$and' | '$or'): void {
    Object.keys(cond).forEach(k => {
      if (k === '$and' || k === '$or') {
        const method = operator === '$or' ? 'orOn' : 'andOn';
        const m = k === '$or' ? 'orOn' : 'andOn';
        return clause[method](outer => cond[k].forEach((sub: any) => {
          if (Utils.getObjectKeysSize(sub) === 1) {
            return this.appendJoinClause(outer, sub, k);
          }

          outer[m](inner => this.appendJoinClause(inner, sub, '$and'));
        }));
      }

      this.appendJoinSubClause(clause, cond, k, operator);
    });
  }

  private appendJoinSubClause(clause: Knex.JoinClause, cond: Dictionary, key: string, operator?: '$and' | '$or'): void {
    const m = operator === '$or' ? 'orOn' : 'andOn';

    if (cond[key] instanceof RegExp) {
      return void clause[m](this.mapper(key), 'like', this.knex.raw('?', this.getRegExpParam(cond[key])));
    }

    if (Utils.isPlainObject(cond[key])) {
      return this.processObjectSubClause(cond, key, clause, m);
    }

    if (QueryBuilderHelper.isCustomExpression(key)) {
      return this.processCustomExpression(clause, m, key, cond);
    }

    const op = cond[key] === null ? 'is' : '=';
    clause[m](this.knex.raw(`${this.knex.ref(this.mapper(key, QueryType.SELECT, cond[key]))} ${op} ?`, cond[key]));
  }

  private processObjectSubClause(cond: any, key: string, clause: Knex.JoinClause, m: 'andOn' | 'orOn'): void {
    // grouped condition for one field
    if (Utils.getObjectKeysSize(cond[key]) > 1) {
      const subCondition = Object.entries(cond[key]).map(([subKey, subValue]) => ({ [key]: { [subKey]: subValue } }));
      return void clause[m](inner => subCondition.map(sub => this.appendJoinClause(inner, sub, '$and')));
    }

    // operators
    for (const [op, replacement] of Object.entries(QueryOperator)) {
      if (!(op in cond[key])) {
        continue;
      }

      clause[m](this.mapper(key), replacement, this.knex.raw('?', cond[key][op]));

      break;
    }
  }

  getQueryOrder(type: QueryType, orderBy: FlatQueryOrderMap | FlatQueryOrderMap[], populate: Dictionary<string>): string {
    if (Array.isArray(orderBy)) {
      return orderBy
        .map(o => this.getQueryOrder(type, o, populate))
        .filter(o => o)
        .join(', ');
    }

    return this.getQueryOrderFromObject(type, orderBy, populate);
  }

  getQueryOrderFromObject(type: QueryType, orderBy: FlatQueryOrderMap, populate: Dictionary<string>): string {
    const ret: string[] = [];
    Object.keys(orderBy).forEach(k => {
      const direction = orderBy[k];
      const order = Utils.isNumber<QueryOrderNumeric>(direction) ? QueryOrderNumeric[direction] : direction;

      if (QueryBuilderHelper.isCustomExpression(k)) {
        ret.push(`${k} ${order.toLowerCase()}`);
        return;
      }

      // eslint-disable-next-line prefer-const
      let [alias, field] = this.splitField(k);
      alias = populate[alias] || alias;

      Utils.splitPrimaryKeys(field).forEach(f => {
        const prop = this.getProperty(f, alias);
        const noPrefix = (prop && prop.persist === false) || QueryBuilderHelper.isCustomExpression(f);
        const column = this.mapper(noPrefix ? f : `${alias}.${f}`, type, undefined, null);
        /* istanbul ignore next */
        const rawColumn = Utils.isString(column) ? column.split('.').map(e => this.knex.ref(e)).join('.') : column;
        const customOrder = prop?.customOrder;

        const colPart = customOrder
          ? this.platform.generateCustomOrder(rawColumn, customOrder)
          : rawColumn;

        ret.push(`${colPart} ${order.toLowerCase()}`);
      });
    });

    return ret.join(', ');
  }

  finalize(type: QueryType, qb: Knex.QueryBuilder, meta?: EntityMetadata): void {
    const useReturningStatement = type === QueryType.INSERT && this.platform.usesReturningStatement() && meta && !meta.compositePK;

    if (useReturningStatement) {
      const returningProps = meta!.props.filter(prop => prop.primary || prop.defaultRaw);
      qb.returning(Utils.flatten(returningProps.map(prop => prop.fieldNames)));
    }
  }

  splitField(field: string): [string, string] {
    const parts = field.split('.');
    const fromField = parts.pop()!;
    const fromAlias = parts.length > 0 ? parts.join('.') : this.alias;

    return [fromAlias, fromField];
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

    if (!meta || !meta.versionProperty || meta.versionProperty in data) {
      return;
    }

    const versionProperty = meta.properties[meta.versionProperty];
    let sql = this.platform.quoteIdentifier(versionProperty.fieldNames[0]) + ' + 1';

    if (versionProperty.type.toLowerCase() === 'date') {
      sql = this.platform.getCurrentTimestampSQL(versionProperty.length);
    }

    qb.update(versionProperty.fieldNames[0], this.knex.raw(sql));
  }

  static isCustomExpression(field: string, hasAlias = false): boolean {
    // if we do not have alias, we don't consider spaces as custom expressions
    const re = hasAlias ? /[ ?<>=()'"`:]|^\d/ : /[?<>=()'"`:]|^\d/;

    return !!field.match(re);
  }

  private prefix(field: string, always = false, quote = false): string {
    let ret: string;

    if (!this.isPrefixed(field)) {
      const alias = always ? (quote ? this.alias : this.platform.quoteIdentifier(this.alias)) + '.' : '';
      const fieldName = this.fieldName(field, this.alias, always);

      if (QueryBuilderHelper.isCustomExpression(fieldName)) {
        return fieldName;
      }

      ret = alias + fieldName;
    } else {
      const [a, f] = field.split('.');
      ret = a + '.' + this.fieldName(f, a);
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

  private fieldName(field: string, alias?: string, always?: boolean): string {
    const prop = this.getProperty(field, alias);

    if (!prop) {
      return field;
    }

    if (prop.fieldNameRaw) {
      if (!always) {
        return prop.fieldNameRaw
          .replace(/\[::alias::]\.?/g, '')
          .replace(this.platform.quoteIdentifier('') + '.', '');
      }

      if (alias) {
        return prop.fieldNameRaw.replace(/\[::alias::]/g, alias);
      }

      /* istanbul ignore next */
      return prop.fieldNameRaw;
    }

    /* istanbul ignore next */
    return prop.fieldNames[0] ?? field;
  }

  getProperty(field: string, alias?: string): EntityProperty | undefined {
    const entityName = this.aliasMap[alias!] || this.entityName;
    const meta = this.metadata.find(entityName);

    return meta ? meta.properties[field] : undefined;
  }

  isTableNameAliasRequired(type: QueryType): boolean {
    return [QueryType.SELECT, QueryType.COUNT].includes(type);
  }

}
