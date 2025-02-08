import { inspect } from 'node:util';
import {
  ALIAS_REPLACEMENT,
  ALIAS_REPLACEMENT_RE,
  ArrayType,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityProperty,
  type FlatQueryOrderMap,
  isRaw,
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
import { NativeQueryBuilder } from './NativeQueryBuilder';

/**
 * @internal
 */
export class QueryBuilderHelper {

  private readonly platform: AbstractSqlPlatform;
  private readonly metadata: MetadataStorage;

  constructor(private readonly entityName: string,
              private alias: string,
              private readonly aliasMap: Dictionary<Alias<any>>,
              private readonly subQueries: Dictionary<string>,
              private readonly driver: AbstractSqlDriver) {
    this.platform = this.driver.getPlatform();
    this.metadata = this.driver.getMetadata();
  }

  mapper(field: string | RawQueryFragment, type?: QueryType): string;
  mapper(field: string | RawQueryFragment, type?: QueryType, value?: any, alias?: string | null): string;
  mapper(field: string | RawQueryFragment, type = QueryType.SELECT, value?: any, alias?: string | null): string | RawQueryFragment {
    if (isRaw(field)) {
      return raw(field.sql, field.params);
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

      return raw('(' + parts.map(part => this.platform.quoteIdentifier(part)).join(', ') + ')');
    }

    const rawField = RawQueryFragment.getKnownFragment(field);

    if (rawField) {
      return rawField;
    }

    const aliasPrefix = isTableNameAliasRequired ? this.alias + '.' : '';
    const [a, f] = this.splitField(field as EntityKey);
    const prop = this.getProperty(f, a);
    const fkIdx2 = prop?.fieldNames.findIndex(name => name === f) ?? -1;
    const fkIdx = fkIdx2 === -1 ? 0 : fkIdx2;
    let ret = field;

    // embeddable nested path instead of a regular property with table alias, reset alias
    if (prop?.name === a && prop.embeddedProps[f]) {
      return aliasPrefix + prop.fieldNames[fkIdx];
    }

    if (prop?.embedded && a === prop.embedded[0]) {
      return aliasPrefix + prop.fieldNames[fkIdx];
    }

    const noPrefix = prop && prop.persist === false;

    if (prop?.fieldNameRaw) {
      return raw(this.prefix(field, isTableNameAliasRequired));
    }

    if (prop?.formula) {
      const alias2 = this.platform.quoteIdentifier(a).toString();
      const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]).toString();
      const as = alias === null ? '' : ` as ${aliased}`;
      let value = prop.formula(alias2);

      if (!this.isTableNameAliasRequired(type)) {
        value = value.replaceAll(alias2 + '.', '');
      }

      return raw(`${value}${as}`);
    }

    if (prop?.hasConvertToJSValueSQL && type !== QueryType.UPSERT) {
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
        return raw(valueSQL);
      }

      return raw(`${valueSQL} as ${this.platform.quoteIdentifier(alias ?? prop.fieldNames[fkIdx])}`);
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
      data[meta.getPrimaryProps()[0].fieldNames[0]] = this.platform.usesDefaultKeyword() ? raw('default') : undefined;
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

  processJoins(qb: NativeQueryBuilder, joins: Dictionary<JoinOptions>, schema?: string): void {
    Object.values(joins).forEach(join => {
      if ([JoinType.nestedInnerJoin, JoinType.nestedLeftJoin].includes(join.type)) {
        return;
      }

      const { sql, params } = this.createJoinExpression(join, joins, schema);
      qb.join(sql, params);
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
    const params: unknown[] = [];
    schema = join.schema && join.schema !== '*' ? join.schema : schema;

    if (schema && schema !== this.platform.getDefaultSchemaName()) {
      table = `${schema}.${table}`;
    }

    if (join.prop.name !== '__subquery__') {
      join.primaryKeys!.forEach((primaryKey, idx) => {
        const right = `${join.alias}.${join.joinColumns![idx]}`;

        if (join.prop.formula) {
          const alias = this.platform.quoteIdentifier(join.ownerAlias);
          const left = join.prop.formula(alias);
          conditions.push(`${left} = ${this.platform.quoteIdentifier(right)}`);
          return;
        }

        const left = join.prop.object && join.prop.fieldNameRaw
          ? join.prop.fieldNameRaw.replaceAll(ALIAS_REPLACEMENT, join.ownerAlias)
          : this.platform.quoteIdentifier(`${join.ownerAlias}.${primaryKey}`);

        conditions.push(`${left} = ${this.platform.quoteIdentifier(right)}`);
      });
    }

    if (join.prop.targetMeta?.discriminatorValue && !join.path?.endsWith('[pivot]')) {
      const typeProperty = join.prop.targetMeta!.root.discriminatorColumn!;
      const alias = join.inverseAlias ?? join.alias;
      join.cond[`${alias}.${typeProperty}`] = join.prop.targetMeta!.discriminatorValue;
    }

    let sql = method + ' ';

    if (join.nested) {
      sql += `(${this.platform.quoteIdentifier(table)} as ${this.platform.quoteIdentifier(join.alias)}`;

      for (const nested of join.nested) {
        const { sql: nestedSql, params: nestedParams } = this.createJoinExpression(nested, joins, schema);
        sql += ' ' + nestedSql;
        params.push(...nestedParams);
      }

      sql += `)`;
    } else if (join.subquery) {
      sql += `(${join.subquery}) as ${this.platform.quoteIdentifier(join.alias)}`;
    } else {
      sql += `${this.platform.quoteIdentifier(table)} as ${this.platform.quoteIdentifier(join.alias)}`;
    }

    const oldAlias = this.alias;
    this.alias = join.alias;
    const subquery = this._appendQueryCondition(QueryType.SELECT, join.cond);
    this.alias = oldAlias;

    if (subquery.sql) {
      conditions.push(subquery.sql);
      params.push(...subquery.params);
    }

    if (conditions.length > 0) {
      sql += ` on ${conditions.join(' and ')}`;
    }

    return { sql, params };
  }

// <<<<<<< HEAD
//   private processJoinClause(key: string, value: unknown, alias: string, params: Knex.Value[], operator = '$eq'): string {
//     if (Utils.isGroupOperator(key) && Array.isArray(value)) {
//       const parts = value.map(sub => {
//         return this.wrapQueryGroup(Object.keys(sub).map(k => this.processJoinClause(k, sub[k], alias, params)));
//       });
//       return this.wrapQueryGroup(parts, key);
//     }
//
//     const rawField = RawQueryFragment.getKnownFragment(key);
//
//     if (!rawField && !Utils.isOperator(key, false) && !this.isPrefixed(key)) {
//       key = `${alias}.${key}`;
//     }
//
//     if (this.isSimpleRegExp(value)) {
//       params.push(this.getRegExpParam(value));
//       return `${this.knex.ref(this.mapper(key))} like ?`;
//     }
//
//     if (value instanceof RegExp) {
//       value = this.platform.getRegExpValue(value);
//     }
//
//     if (Utils.isOperator(key, false) && Utils.isPlainObject(value)) {
//       const parts = Object.keys(value).map(k => this.processJoinClause(k, (value as Dictionary)[k], alias, params, key));
//
//       return key === '$not' ? `not ${this.wrapQueryGroup(parts)}` : this.wrapQueryGroup(parts);
//     }
//
//     if (Utils.isPlainObject(value) && Object.keys(value).every(k => Utils.isOperator(k, false))) {
//       const parts = Object.keys(value).map(op => this.processJoinClause(key, (value as Dictionary)[op], alias, params, op));
//
//       return this.wrapQueryGroup(parts);
//     }
//
//     const [fromAlias, fromField] = this.splitField(key as EntityKey);
//     const prop = this.getProperty(fromField, fromAlias);
//     operator = operator === '$not' ? '$eq' : operator;
//     const column = this.mapper(key, undefined, undefined, null);
//
//     if (value === null) {
//       return `${this.knex.ref(column)} is ${operator === '$ne' ? 'not ' : ''}null`;
//     }
//
//     if (operator === '$fulltext' && prop) {
//       const query = this.knex.raw(this.platform.getFullTextWhereClause(prop), {
//         column,
//         query: this.knex.raw('?'),
//       }).toSQL().toNative();
//       params.push(value as Knex.Value);
//
//       return query.sql;
//     }
//
//     const replacement = this.getOperatorReplacement(operator, { [operator]: value });
//
//     if (['$in', '$nin'].includes(operator) && Array.isArray(value)) {
//       params.push(...value as Knex.Value[]);
//       return `${this.knex.ref(column)} ${replacement} (${value.map(() => '?').join(', ')})`;
//     }
//
//     if (operator === '$exists') {
//       value = null;
//     }
//
//     if (rawField) {
//       let sql = rawField.sql.replaceAll(ALIAS_REPLACEMENT, alias);
//       params.push(...rawField.params as Knex.Value[]);
//       params.push(...Utils.asArray(value) as Knex.Value[]);
//
//       if ((Utils.asArray(value) as Knex.Value[]).length > 0) {
//         sql += ' = ?';
//       }
//
//       return sql;
//     }
//
//     if (value !== null) {
//       if (prop?.customType) {
//         value = prop.customType.convertToDatabaseValue(value, this.platform, { fromQuery: true, key, mode: 'query' });
//       }
//
//       params.push(value as Knex.Value);
//     }
//
//     return `${this.knex.ref(column)} ${replacement} ${value === null ? 'null' : '?'}`;
//   }
//
//   private wrapQueryGroup(parts: string[], operator = '$and') {
//     if (parts.length === 1) {
//       return parts[0];
//     }
//
//     return `(${parts.join(` ${GroupOperator[operator as keyof typeof GroupOperator]} `)})`;
//   }
//
//   mapJoinColumns(type: QueryType, join: JoinOptions): (string | Knex.Raw)[] {
// =======
  mapJoinColumns(type: QueryType, join: JoinOptions): (string | RawQueryFragment)[] {
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

  appendOnConflictClause<T>(type: QueryType, onConflict: OnConflictClause<T>[], qb: NativeQueryBuilder): void {
    onConflict.forEach(item => {
      const { fields, ignore } = item;
      const sub = qb.onConflict({ fields, ignore });

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

        sub.merge = mergeParam ?? [];

        if (item.where) {
          sub.where = this._appendQueryCondition(type, item.where);
        }
      }, 'merge' in item);
    });
  }

  appendQueryCondition(type: QueryType, cond: any, qb: NativeQueryBuilder, operator?: '$and' | '$or', method: 'where' | 'having' = 'where'): void {
    const { sql, params } = this._appendQueryCondition(type, cond, operator);
    qb[method](sql, params);
  }

  _appendQueryCondition(type: QueryType, cond: any, operator?: '$and' | '$or'): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];

    for (const k of Object.keys(cond)) {
      if (k === '$and' || k === '$or') {
        if (operator) {
          this.append(() => this.appendGroupCondition(type, k, cond[k]), parts, params, operator);
          continue;
        }

        this.append(() => this.appendGroupCondition(type, k, cond[k]), parts, params);
        continue;
      }

      if (k === '$not') {
        const res = this._appendQueryCondition(type, cond[k]);
        parts.push(`not (${res.sql})`);
        params.push(...res.params);
        continue;
      }

      this.append(() => this.appendQuerySubCondition(type, cond, k), parts, params);
    }

    return { sql: parts.join(' and '), params };
  }

  private append(cb: () => { sql: string; params: unknown[] }, parts: string[], params: unknown[], operator?: '$and' | '$or'): void {
    const res = cb();

    if (['', '()'].includes(res.sql)) {
      return;
    }

    parts.push(operator === '$or' ? `(${res.sql})` : res.sql);
    params.push(...res.params);
  }

  private appendQuerySubCondition(type: QueryType, cond: any, key: string): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];
    const fields = Utils.splitPrimaryKeys(key);

    if (this.isSimpleRegExp(cond[key])) {
      parts.push(`${this.platform.quoteIdentifier(this.mapper(key, type))} like ?`);
      params.push(this.getRegExpParam(cond[key]));
      return { sql: parts.join(' and '), params };
    }

    if (Utils.isPlainObject(cond[key]) || cond[key] instanceof RegExp) {
      return this.processObjectSubCondition(cond, key, type);
    }

    const op = cond[key] === null ? 'is' : '=';
    const raw = RawQueryFragment.getKnownFragment(key);

    if (raw) {
      const sql = raw.sql.replaceAll(ALIAS_REPLACEMENT, this.alias);
      const value = Utils.asArray(cond[key]);
      params.push(...raw.params);

      if (value.length > 0) {
        const val = this.getValueReplacement(fields, value[0], params, key);
        parts.push(`${sql} ${op} ${val}`);
        return { sql: parts.join(' and '), params };
      }

      parts.push(sql);
      return { sql: parts.join(' and '), params };
    }

    if (this.subQueries[key]) {
      const val = this.getValueReplacement(fields, cond[key], params, key);
      parts.push(`(${this.subQueries[key]}) ${op} ${val}`);
      return { sql: parts.join(' and '), params };
    }

    const val = this.getValueReplacement(fields, cond[key], params, key);
    parts.push(`${this.platform.quoteIdentifier(this.mapper(key, type, cond[key], null))} ${op} ${val}`);

    return { sql: parts.join(' and '), params };
  }

  private processObjectSubCondition(cond: any, key: string, type: QueryType): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];
    let value = cond[key];
    const size = Utils.getObjectKeysSize(value);

    if (Utils.isPlainObject(value) && size === 0) {
      return { sql: '', params };
    }


    // grouped condition for one field, e.g. `{ age: { $gte: 10, $lt: 50 } }`
    if (size > 1) {
      const rawField = RawQueryFragment.getKnownFragment(key);
      const subCondition = Object.entries(value).map(([subKey, subValue]) => {
        key = rawField?.clone().toString() ?? key;
        return ({ [key]: { [subKey]: subValue } });
      });

      for (const sub of subCondition) {
        this.append(() => this._appendQueryCondition(type, sub, '$and'), parts, params);
      }

      return { sql: parts.join(' and '), params };
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
          parts.push(`(${conds.join(' or ')})`);
          params.push(...Utils.flatten(value[op]));
          return { sql: parts.join(' and '), params };
        }

        parts.push(...mapped.map(field => `${this.platform.quoteIdentifier(field)} = ?`));
        params.push(...Utils.flatten(value[op]));
        return { sql: parts.join(' and '), params };
      }

      if (singleTuple) {
        const tmp = value[op].length === 1 && Utils.isPlainObject(value[op][0]) ? fields.map(f => value[op][0][f]) : value[op];
        const sql = `(${fields.map(() => '?').join(', ')})`;
        value[op] = raw(sql, tmp);
      }
    }

    if (this.subQueries[key]) {
      const val = this.getValueReplacement(fields, value[op], params, op);
      parts.push(`(${this.subQueries[key]}) ${replacement} ${val}`);
      return { sql: parts.join(' and '), params };
    }

    const [a, f] = this.splitField(key as EntityKey);
    const prop = this.getProperty(f, a);

    if (op === '$fulltext') {
      /* istanbul ignore next */
      if (!prop) {
        throw new Error(`Cannot use $fulltext operator on ${key}, property not found`);
      }

      const { sql, params: params2 } = raw(this.platform.getFullTextWhereClause(prop), {
        column: this.mapper(key, type, undefined, null),
        query: value[op],
      });
      parts.push(sql);
      params.push(...params2);
    } else if (['$in', '$nin'].includes(op) && Array.isArray(value[op]) && value[op].length === 0) {
      parts.push(`1 = ${op === '$in' ? 0 : 1}`);
    } else if (value[op] instanceof RawQueryFragment || value[op] instanceof NativeQueryBuilder) {
      const query = value[op] instanceof NativeQueryBuilder ? value[op].toRaw() : value[op];
      const mappedKey = this.mapper(key, type, query, null);

      let sql = query.sql;

      if (['$in', '$nin'].includes(op)) {
        sql = `(${sql})`;
      }

      parts.push(`${this.platform.quoteIdentifier(mappedKey)} ${replacement} ${sql}`);
      params.push(...query.params);
    } else {
      const mappedKey = this.mapper(key, type, value[op], null);
      const val = this.getValueReplacement(fields, value[op], params, op, prop);

      parts.push(`${this.platform.quoteIdentifier(mappedKey)} ${replacement} ${val}`);
    }

    return { sql: parts.join(' and '), params };
  }

  private getValueReplacement(fields: string[], value: unknown, params: unknown[], key?: string, prop?: EntityProperty): string {
    if (Array.isArray(value)) {
      if (fields.length > 1) {
        const tmp = [];

        for (const field of value) {
          tmp.push(`(${field.map(() => '?').join(', ')})`);
          params.push(...field);
        }

        return `(${tmp.join(', ')})`;
      }

      if (prop?.customType instanceof ArrayType) {
        const item = prop.customType.convertToDatabaseValue(value, this.platform, { fromQuery: true, key, mode: 'query' });
        params.push(item);
      } else {
        params.push(...value);
      }

      return `(${value.map(() => '?').join(', ')})`;
    }

    if (value === null) {
      return 'null';
    }

    params.push(value);

    return '?';
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

    if (replacement.includes('?')) {
      replacement = replacement.replaceAll('?', '\\?');
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
        const rawColumn = Utils.isString(column) ? column.split('.').map(e => this.platform.quoteIdentifier(e)).join('.') : column;
        const customOrder = prop?.customOrder;

        let colPart = customOrder
          ? this.platform.generateCustomOrder(rawColumn, customOrder)
          : rawColumn;

        if (isRaw(colPart)) {
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

  finalize(type: QueryType, qb: NativeQueryBuilder, meta?: EntityMetadata, data?: Dictionary, returning?: Field<any>[]): void {
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
      const returningProps = meta.hydrateProps.filter(prop => prop.fieldNames && isRaw(data[prop.fieldNames[0]]));

      if (returningProps.length > 0) {
        qb.returning(returningProps.flatMap(prop => {
          if (prop.hasConvertToJSValueSQL) {
            const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
            const sql = prop.customType!.convertToJSValueSQL!(aliased, this.platform) + ' as ' + this.platform.quoteIdentifier(prop.fieldNames[0]);
            return [raw(sql)];
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

  getLockSQL(qb: NativeQueryBuilder, lockMode: LockMode, lockTables: string[] = []): void {
    const meta = this.metadata.find(this.entityName);

    if (lockMode === LockMode.OPTIMISTIC && meta && !meta.versionProperty) {
      throw OptimisticLockError.lockFailed(this.entityName);
    }

    qb.lockMode(lockMode, lockTables);
  }

  updateVersionProperty(qb: NativeQueryBuilder, data: Dictionary): void {
    const meta = this.metadata.find(this.entityName);

    if (!meta?.versionProperty || meta.versionProperty in data) {
      return;
    }

    const versionProperty = meta.properties[meta.versionProperty];
    let sql = this.platform.quoteIdentifier(versionProperty.fieldNames[0]) + ' + 1';

    if (versionProperty.runtimeType === 'Date') {
      sql = this.platform.getCurrentTimestampSQL(versionProperty.length);
    }

    qb.update({ [versionProperty.fieldNames[0]]: raw(sql) });
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

  private appendGroupCondition(type: QueryType, operator: '$and' | '$or', subCondition: any[]): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];

    // single sub-condition can be ignored to reduce nesting of parens
    if (subCondition.length === 1 || operator === '$and') {
      for (const sub of subCondition) {
        this.append(() => this._appendQueryCondition(type, sub), parts, params);
      }

      return { sql: parts.join(' and '), params };
    }

    for (const sub of subCondition) {
      // skip nesting parens if the value is simple = scalar or object without operators or with only single key, being the operator
      const keys = Object.keys(sub);
      const val = sub[keys[0]];
      const simple = !Utils.isPlainObject(val) || Utils.getObjectKeysSize(val) === 1 || Object.keys(val).every(k => !Utils.isOperator(k));

      if (keys.length === 1 && simple) {
        this.append(() => this._appendQueryCondition(type, sub, operator), parts, params);
        continue;
      }

      this.append(() => this._appendQueryCondition(type, sub), parts, params, operator);
    }

    return { sql: `(${parts.join(' or ')})`, params };
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

  isTableNameAliasRequired(type: QueryType): boolean {
    return [QueryType.SELECT, QueryType.COUNT].includes(type);
  }

  processOnConflictCondition(cond: QBFilterQuery, schema?: string): QBFilterQuery {
    const meta = this.metadata.get(this.entityName);
    const tableName = meta.tableName;

    for (const key of Object.keys(cond)) {
      const mapped = this.mapper(key, QueryType.UPSERT);
      Utils.renameKey(cond, key, tableName + '.' + mapped);
    }

    return cond;
  }

}

export interface Alias<T> {
  aliasName: string;
  entityName: string;
  metadata?: EntityMetadata<T>;
  subQuery?: NativeQueryBuilder;
}

export interface OnConflictClause<T> {
  fields: string[] | RawQueryFragment;
  ignore?: boolean;
  merge?: EntityData<T> | Field<T>[];
  where?: QBFilterQuery<T>;
}
