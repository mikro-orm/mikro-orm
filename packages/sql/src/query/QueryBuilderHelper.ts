import {
  ALIAS_REPLACEMENT,
  ALIAS_REPLACEMENT_RE,
  ArrayType,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type FilterQuery,
  type FlatQueryOrderMap,
  type FormulaTable,
  inspect,
  isRaw,
  LockMode,
  type MetadataStorage,
  OptimisticLockError,
  QueryOperator,
  type QueryOrderMap,
  QueryOrderNumeric,
  raw,
  Raw,
  type RawQueryFragment,
  type RawQueryFragmentSymbol,
  QueryHelper,
  ReferenceKind,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { JoinType, QueryType } from './enums.js';
import type { InternalField, JoinOptions } from '../typings.js';
import type { AbstractSqlDriver } from '../AbstractSqlDriver.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import type { NativeQueryBuilder } from './NativeQueryBuilder.js';

/**
 * @internal
 */
export class QueryBuilderHelper {

  private readonly platform: AbstractSqlPlatform;
  private readonly metadata: MetadataStorage;

  constructor(
    private readonly entityName: EntityName,
    private alias: string,
    private readonly aliasMap: Dictionary<Alias<any>>,
    private readonly subQueries: Dictionary<string>,
    private readonly driver: AbstractSqlDriver,
    private readonly tptAliasMap: Dictionary<string> = {},
  ) {
    this.platform = this.driver.getPlatform();
    this.metadata = this.driver.getMetadata();
  }

  /**
   * For TPT inheritance, finds the correct alias for a property based on which entity owns it.
   * Returns the main alias if not a TPT property or if the property belongs to the main entity.
   */
  getTPTAliasForProperty(propName: string, defaultAlias: string): string {
    const meta = this.aliasMap[defaultAlias]?.meta ?? this.metadata.get(this.entityName);

    if (meta?.inheritanceType !== 'tpt' || !meta.tptParent) {
      return defaultAlias;
    }

    // Check if property is in the main entity's ownProps
    if (meta.ownProps?.some(p => p.name === propName || p.fieldNames?.includes(propName))) {
      return defaultAlias;
    }

    // Walk up the TPT hierarchy to find which parent owns this property
    let parentMeta: EntityMetadata | undefined = meta.tptParent;

    while (parentMeta) {
      const parentAlias = this.tptAliasMap[parentMeta.className];

      if (parentAlias && parentMeta.ownProps?.some(p => p.name === propName || p.fieldNames?.includes(propName))) {
        return parentAlias;
      }

      parentMeta = parentMeta.tptParent;
    }

    // Property not found in hierarchy, return default alias
    return defaultAlias;
  }

  mapper(field: string | Raw | RawQueryFragmentSymbol, type?: QueryType): string;
  mapper(field: string | Raw | RawQueryFragmentSymbol, type?: QueryType, value?: any, alias?: string | null, schema?: string): string;
  mapper(field: string | Raw | RawQueryFragmentSymbol, type = QueryType.SELECT, value?: any, alias?: string | null, schema?: string): string | Raw {
    if (isRaw(field)) {
      return raw(field.sql, field.params);
    }

    if (Raw.isKnownFragmentSymbol(field)) {
      return Raw.getKnownFragment(field)!;
    }

    /* v8 ignore next */
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

    const [a, f] = this.splitField(field as EntityKey);
    const prop = this.getProperty(f, a);
    // For TPT inheritance, resolve the correct alias for this property
    // Only apply TPT resolution when `a` is an actual table alias (in aliasMap),
    // not when it's an embedded property name like 'profile1.identity.links'
    const isTableAlias = !!this.aliasMap[a];
    const baseAlias = isTableAlias ? a : this.alias;
    const resolvedAlias = isTableAlias ? this.getTPTAliasForProperty(prop?.name ?? f, a) : this.alias;
    const aliasPrefix = isTableNameAliasRequired ? resolvedAlias + '.' : '';
    const fkIdx2 = prop?.fieldNames.findIndex(name => name === f) ?? -1;
    const fkIdx = fkIdx2 === -1 ? 0 : fkIdx2;

    if (a === prop?.embedded?.[0]) {
      return aliasPrefix + prop.fieldNames[fkIdx];
    }

    const noPrefix = prop?.persist === false;

    if (prop?.fieldNameRaw) {
      return raw(this.prefix(field, isTableNameAliasRequired));
    }

    if (prop?.formula) {
      const alias2 = this.platform.quoteIdentifier(a).toString();
      const aliasName = alias === undefined ? prop.fieldNames[0] : alias;
      const as = aliasName === null ? '' : ` as ${this.platform.quoteIdentifier(aliasName)}`;
      const meta = this.aliasMap[a]?.meta ?? this.metadata.get(this.entityName);
      const table = this.createFormulaTable(alias2, meta, schema);
      const columns = meta.createColumnMappingObject(
        p => this.getTPTAliasForProperty(p.name, a),
        alias2,
      );
      let value = this.driver.evaluateFormula(prop.formula, columns, table);

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

    let ret = this.prefix(field, false, false, fkIdx);

    if (alias) {
      ret += ' as ' + alias;
    }

    if (!isTableNameAliasRequired || this.isPrefixed(ret) || noPrefix) {
      return ret;
    }

    return resolvedAlias + '.' + ret;
  }

  processData(data: Dictionary, convertCustomTypes: boolean, multi = false): any {
    if (Array.isArray(data)) {
      return data.map(d => this.processData(d, convertCustomTypes, true));
    }

    const meta = this.metadata.find(this.entityName);

    data = this.driver.mapDataToFieldNames(data, true, meta?.properties, convertCustomTypes);

    if (!Utils.hasObjectKeys(data) && meta && multi) {
      /* v8 ignore next */
      data[meta.getPrimaryProps()[0].fieldNames[0]] = this.platform.usesDefaultKeyword() ? raw('default') : undefined;
    }

    return data;
  }

  joinOneToReference(prop: EntityProperty, ownerAlias: string, alias: string, type: JoinType, cond: Dictionary = {}, schema?: string): JoinOptions {
    const prop2 = prop.targetMeta!.properties[prop.mappedBy || prop.inversedBy];
    const table = this.getTableName(prop.targetMeta!.class);
    const joinColumns = prop.owner ? prop.referencedColumnNames : prop2.joinColumns;
    const inverseJoinColumns = prop.referencedColumnNames;
    const primaryKeys = prop.owner ? prop.joinColumns : prop2.referencedColumnNames;
    schema ??= prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(prop.targetMeta);
    cond = Utils.merge(cond, prop.where);

    // For inverse side of polymorphic relations, add discriminator condition
    if (!prop.owner && prop2.polymorphic && prop2.discriminatorColumn && prop2.discriminatorMap) {
      const ownerMeta = this.aliasMap[ownerAlias]?.meta ?? this.metadata.get(this.entityName);
      const discriminatorValue = QueryHelper.findDiscriminatorValue(prop2.discriminatorMap, ownerMeta.class);
      if (discriminatorValue) {
        cond[`${alias}.${prop2.discriminatorColumn}`] = discriminatorValue;
      }
    }

    return {
      prop, type, cond, ownerAlias, alias, table, schema,
      joinColumns, inverseJoinColumns, primaryKeys,
    };
  }

  joinManyToOneReference(prop: EntityProperty, ownerAlias: string, alias: string, type: JoinType, cond: Dictionary = {}, schema?: string): JoinOptions {
    return {
      prop, type, cond, ownerAlias, alias,
      table: this.getTableName(prop.targetMeta!.class),
      schema: prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(prop.targetMeta, { schema }),
      joinColumns: prop.referencedColumnNames,
      // For polymorphic relations, fieldNames includes the discriminator column which is not
      // part of the join condition - use joinColumns (the FK columns only) instead
      primaryKeys: prop.polymorphic ? prop.joinColumns : prop.fieldNames,
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

    const prop2 = pivotMeta.relations[prop.owner ? 1 : 0];
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
          const quotedAlias = this.platform.quoteIdentifier(join.ownerAlias).toString();
          const ownerMeta = this.aliasMap[join.ownerAlias]?.meta ?? this.metadata.get(this.entityName);
          const table = this.createFormulaTable(quotedAlias, ownerMeta, schema);
          const columns = ownerMeta.createColumnMappingObject(
            p => this.getTPTAliasForProperty(p.name, join.ownerAlias),
            quotedAlias,
          );
          const left = this.driver.evaluateFormula(join.prop.formula, columns, table);
          conditions.push(`${left} = ${this.platform.quoteIdentifier(right)}`);
          return;
        }

        const left = join.prop.object && join.prop.fieldNameRaw
          ? join.prop.fieldNameRaw.replaceAll(ALIAS_REPLACEMENT, join.ownerAlias)
          : this.platform.quoteIdentifier(`${join.ownerAlias}.${primaryKey}`);

        conditions.push(`${left} = ${this.platform.quoteIdentifier(right)}`);
      });
    }

    if (join.prop.targetMeta?.root.inheritanceType === 'sti' && join.prop.targetMeta?.discriminatorValue && !join.path?.endsWith('[pivot]')) {
      const typeProperty = join.prop.targetMeta.root.discriminatorColumn;
      const alias = join.inverseAlias ?? join.alias;
      join.cond[`${alias}.${typeProperty}`] = join.prop.targetMeta.discriminatorValue;
    }

    // For polymorphic relations, add discriminator condition to filter by target entity type
    if (join.prop.polymorphic && join.prop.discriminatorColumn && join.prop.discriminatorMap) {
      const discriminatorValue = QueryHelper.findDiscriminatorValue(join.prop.discriminatorMap, join.prop.targetMeta!.class);
      if (discriminatorValue) {
        const discriminatorCol = this.platform.quoteIdentifier(`${join.ownerAlias}.${join.prop.discriminatorColumn}`);
        conditions.push(`${discriminatorCol} = ?`);
        params.push(discriminatorValue);
      }
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
      subquery.params.forEach(p => params.push(p));
    }

    if (conditions.length > 0) {
      sql += ` on ${conditions.join(' and ')}`;
    }

    return { sql, params };
  }

  mapJoinColumns(type: QueryType, join: JoinOptions): (string | Raw)[] {
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

    return prop?.kind === ReferenceKind.ONE_TO_ONE && !prop.owner;
  }

  getTableName(entityName: EntityName): string {
    const meta = this.metadata.find(entityName);
    return meta?.tableName ?? Utils.className(entityName);
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

    for (const k of Utils.getObjectQueryKeys(cond)) {
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
        res.params.forEach(p => params.push(p));
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
    res.params.forEach(p => params.push(p));
  }

  private appendQuerySubCondition(type: QueryType, cond: any, key: string | RawQueryFragmentSymbol): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];

    if (this.isSimpleRegExp(cond[key])) {
      parts.push(`${this.platform.quoteIdentifier(this.mapper(key, type))} like ?`);
      params.push(this.getRegExpParam(cond[key]));
      return { sql: parts.join(' and '), params };
    }

    if (Utils.isPlainObject(cond[key]) || cond[key] instanceof RegExp) {
      return this.processObjectSubCondition(cond, key, type);
    }

    const op = cond[key] === null ? 'is' : '=';

    if (Raw.isKnownFragmentSymbol(key)) {
      const raw = Raw.getKnownFragment(key)!;
      const sql = raw.sql.replaceAll(ALIAS_REPLACEMENT, this.alias);
      const value = Utils.asArray(cond[key]);
      params.push(...raw.params);

      if (value.length > 0) {
        const k = key as unknown as string;
        const val = this.getValueReplacement([k], value[0], params, k);
        parts.push(`${sql} ${op} ${val}`);
        return { sql: parts.join(' and '), params };
      }

      parts.push(sql);
      return { sql: parts.join(' and '), params };
    }

    const fields = Utils.splitPrimaryKeys(key);

    if (this.subQueries[key]) {
      const val = this.getValueReplacement(fields, cond[key], params, key);
      parts.push(`(${this.subQueries[key]}) ${op} ${val}`);
      return { sql: parts.join(' and '), params };
    }

    const val = this.getValueReplacement(fields, cond[key], params, key);
    parts.push(`${this.platform.quoteIdentifier(this.mapper(key, type, cond[key], null))} ${op} ${val}`);

    return { sql: parts.join(' and '), params };
  }

  private processObjectSubCondition(cond: any, key: string | RawQueryFragmentSymbol, type: QueryType): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];
    let value = cond[key];
    const size = Utils.getObjectKeysSize(value);

    if (Utils.isPlainObject(value) && size === 0) {
      return { sql: '', params };
    }

    // grouped condition for one field, e.g. `{ age: { $gte: 10, $lt: 50 } }`
    if (size > 1) {
      const subCondition = Object.entries(value).map(([subKey, subValue]) => {
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

    /* v8 ignore next */
    if (!op) {
      throw ValidationError.invalidQueryCondition(cond);
    }

    const replacement = this.getOperatorReplacement(op, value);
    const rawField = Raw.isKnownFragmentSymbol(key);
    const fields = rawField ? [key as unknown as string] : Utils.splitPrimaryKeys(key);

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

    if (this.subQueries[key as string]) {
      const val = this.getValueReplacement(fields, value[op], params, op);
      parts.push(`(${this.subQueries[key as string]}) ${replacement} ${val}`);
      return { sql: parts.join(' and '), params };
    }

    const [a, f] = rawField ? [] : this.splitField(key as EntityKey);
    const prop: EntityProperty = f! && this.getProperty(f, a);

    if (prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
      return { sql: '', params };
    }

    if (op === '$fulltext') {
      /* v8 ignore next */
      if (!prop) {
        throw new Error(`Cannot use $fulltext operator on ${String(key)}, property not found`);
      }

      const { sql, params: params2 } = raw(this.platform.getFullTextWhereClause(prop), {
        column: this.mapper(key, type, undefined, null),
        query: value[op],
      });
      parts.push(sql);
      params.push(...params2);
    } else if (['$in', '$nin'].includes(op) && Array.isArray(value[op]) && value[op].length === 0) {
      parts.push(`1 = ${op === '$in' ? 0 : 1}`);
    } else if (value[op] instanceof Raw || (typeof value[op]?.toRaw === 'function')) {
      const query = value[op] instanceof Raw ? value[op] : value[op].toRaw();
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
        value.forEach(p => params.push(p));
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

  validateQueryOrder<T>(orderBy: QueryOrderMap<T>): void {
    const strKeys: string[] = [];
    const rawKeys: Raw[] = [];

    for (const key of Utils.getObjectQueryKeys(orderBy)) {
      const raw = Raw.getKnownFragment(key);

      if (raw) {
        rawKeys.push(raw);
      } else {
        strKeys.push(key as string);
      }
    }

    if (strKeys.length > 0 && rawKeys.length > 0) {
      const example = [
        ...strKeys.map(key => ({ [key]: orderBy[key as never] })),
        ...rawKeys.map(rawKey => ({ [`raw('${rawKey.sql}')`]: orderBy[rawKey as never] })),
      ];

      throw new Error([
        `Invalid "orderBy": You are mixing field-based keys and raw SQL fragments inside a single object.`,
        `This is not allowed because object key order cannot reliably preserve evaluation order.`,
        `To fix this, split them into separate objects inside an array:\n`,
        `orderBy: ${inspect(example, { depth: 5 }).replace(/"raw\('(.*)'\)"/g, `[raw('$1')]`)}`,
      ].join('\n'));
    }
  }

  getQueryOrder(type: QueryType, orderBy: FlatQueryOrderMap | FlatQueryOrderMap[], populate: Dictionary<string>, collation?: string): string[] {
    if (Array.isArray(orderBy)) {
      return orderBy.flatMap(o => this.getQueryOrder(type, o, populate, collation));
    }

    return this.getQueryOrderFromObject(type, orderBy, populate, collation);
  }

  getQueryOrderFromObject(type: QueryType, orderBy: FlatQueryOrderMap, populate: Dictionary<string>, collation?: string): string[] {
    const ret: string[] = [];

    for (const key of Utils.getObjectQueryKeys(orderBy)) {
      const direction = orderBy[key as string];
      const order = typeof direction === 'number' ? QueryOrderNumeric[direction] : direction;

      if (Raw.isKnownFragmentSymbol(key)) {
        const raw = Raw.getKnownFragment(key)!;
        ret.push(...this.platform.getOrderByExpression(this.platform.formatQuery(raw.sql, raw.params), order, collation));
        continue;
      }

      for (const f of Utils.splitPrimaryKeys(key)) {
        // eslint-disable-next-line prefer-const
        let [alias, field] = this.splitField(f, true);
        alias = populate[alias] || alias;

        const prop = this.getProperty(field, alias);
        const noPrefix = (prop?.persist === false && !prop.formula && !prop.embedded) || Raw.isKnownFragment(f);
        const column = this.mapper(noPrefix ? field : `${alias}.${field}`, type, undefined, null);
        /* v8 ignore next */
        const rawColumn = typeof column === 'string' ? column.split('.').map(e => this.platform.quoteIdentifier(e)).join('.') : column;
        const customOrder = prop?.customOrder;

        let colPart = customOrder
          ? this.platform.generateCustomOrder(rawColumn, customOrder)
          : rawColumn;

        if (isRaw(colPart)) {
          colPart = this.platform.formatQuery(colPart.sql, colPart.params);
        }

        if (Array.isArray(order)) {
          order.forEach(part => ret.push(...this.getQueryOrderFromObject(type, part, populate, collation)));
        } else {
          ret.push(...this.platform.getOrderByExpression(colPart, order, collation));
        }
      }
    }

    return ret;
  }

  finalize(type: QueryType, qb: NativeQueryBuilder, meta?: EntityMetadata, data?: Dictionary, returning?: InternalField<any>[]): void {
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
        const fields = returningProps.flatMap((prop): (string | Raw)[] => {
          if (prop.hasConvertToJSValueSQL) {
            const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
            const sql = prop.customType!.convertToJSValueSQL!(aliased, this.platform) + ' as ' + this.platform.quoteIdentifier(prop.fieldNames[0]);
            return [raw(sql)];
          }
          return prop.fieldNames;
        });
        qb.returning(fields as any);
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

  getLockSQL(qb: NativeQueryBuilder, lockMode: LockMode, lockTables: string[] = [], joinsMap?: Dictionary<JoinOptions>): void {
    const meta = this.metadata.find(this.entityName);

    if (lockMode === LockMode.OPTIMISTIC && meta && !meta.versionProperty) {
      throw OptimisticLockError.lockFailed(Utils.className(this.entityName));
    }

    if (lockMode !== LockMode.OPTIMISTIC && lockTables.length === 0 && joinsMap) {
      const joins = Object.values(joinsMap);
      const innerJoins = joins.filter(join => [JoinType.innerJoin, JoinType.innerJoinLateral, JoinType.nestedInnerJoin].includes(join.type));

      if (joins.length > innerJoins.length) {
        lockTables.push(this.alias, ...innerJoins.map(join => join.alias));
      }
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
      // For TPT inheritance, resolve the correct alias for this property
      const tptAlias = this.getTPTAliasForProperty(field, this.alias);
      const alias = always ? (quote ? tptAlias : this.platform.quoteIdentifier(tptAlias)) + '.' : '';
      const fieldName = this.fieldName(field, tptAlias, always, idx) as string | Raw;

      if (fieldName instanceof Raw) {
        return fieldName.sql;
      }

      ret = alias + fieldName;
    } else {
      const [a, ...rest] = field.split('.');
      const f = rest.join('.');
      // For TPT inheritance, resolve the correct alias for this property
      // Only apply TPT resolution when `a` is an actual table alias (in aliasMap),
      // not when it's an embedded property name like 'profile1.identity.links'
      const isTableAlias = !!this.aliasMap[a];
      const resolvedAlias = isTableAlias ? this.getTPTAliasForProperty(f, a) : a;
      const fieldName = this.fieldName(f, resolvedAlias, always, idx) as string | Raw;

      if (fieldName instanceof Raw) {
        return fieldName.sql;
      }

      ret = resolvedAlias + '.' + fieldName;
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
      const keys = Utils.getObjectQueryKeys(sub);
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

  private fieldName(field: string, alias?: string, always?: boolean, idx = 0): string | Raw {
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

      /* v8 ignore next */
      return raw(prop.fieldNameRaw);
    }

    /* v8 ignore next */
    return prop.fieldNames?.[idx] ?? field;
  }

  getProperty(field: string, alias?: string): EntityProperty | undefined {
    const entityName = this.aliasMap[alias!]?.entityName || this.entityName;
    const meta = this.metadata.get(entityName);

    // check if `alias` is not matching an embedded property name instead of alias, e.g. `address.city`
    if (alias) {
      const prop = meta.properties[alias];

      if (prop?.kind === ReferenceKind.EMBEDDED) {
        const parts = field.split('.');
        const nest = (p: EntityProperty): EntityProperty => parts.length > 0 ? nest(p.embeddedProps[parts.shift()!]) : p;
        return nest(prop);
      }
    }

    if (meta.properties[field]) {
      return meta.properties[field];
    }

    return meta.relations.find(prop => prop.fieldNames?.some(name => field === name));
  }

  isTableNameAliasRequired(type: QueryType): boolean {
    return [QueryType.SELECT, QueryType.COUNT].includes(type);
  }

  processOnConflictCondition(cond: FilterQuery<any>, schema?: string): FilterQuery<any> {
    const meta = this.metadata.get(this.entityName);
    const tableName = meta.tableName;

    for (const key of Object.keys(cond)) {
      const mapped = this.mapper(key, QueryType.UPSERT);
      Utils.renameKey(cond, key, tableName + '.' + mapped);
    }

    return cond;
  }

  createFormulaTable(alias: string, meta: EntityMetadata, schema?: string): FormulaTable {
    const effectiveSchema = schema ?? (meta.schema !== '*' ? meta.schema : undefined);
    const qualifiedName = effectiveSchema ? `${effectiveSchema}.${meta.tableName}` : meta.tableName;
    return {
      alias,
      name: meta.tableName,
      schema: effectiveSchema,
      qualifiedName,
      toString: () => alias,
    };
  }

}

export interface Alias<T> {
  aliasName: string;
  entityName: EntityName<T>;
  meta: EntityMetadata<T>;
  subQuery?: NativeQueryBuilder | RawQueryFragment;
}

export interface OnConflictClause<T> {
  fields: string[] | Raw;
  ignore?: boolean;
  merge?: EntityData<T> | InternalField<T>[];
  where?: FilterQuery<T>;
}
