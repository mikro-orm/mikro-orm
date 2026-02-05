import {
  Utils,
  type SimpleColumnMeta,
  type Type,
  type TransformContext,
  QueryOrder,
  DecimalType,
  DoubleType,
  type IsolationLevel,
} from '@mikro-orm/core';
import { MySqlSchemaHelper } from './MySqlSchemaHelper.js';
import { MySqlExceptionConverter } from './MySqlExceptionConverter.js';
import { AbstractSqlPlatform } from '../../AbstractSqlPlatform.js';
import type { IndexDef } from '../../typings.js';
import { MySqlNativeQueryBuilder } from './MySqlNativeQueryBuilder.js';

export class BaseMySqlPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: MySqlSchemaHelper = new MySqlSchemaHelper(this);
  protected override readonly exceptionConverter = new MySqlExceptionConverter();

  protected readonly ORDER_BY_NULLS_TRANSLATE = {
    [QueryOrder.asc_nulls_first]: 'is not null',
    [QueryOrder.asc_nulls_last]: 'is null',
    [QueryOrder.desc_nulls_first]: 'is not null',
    [QueryOrder.desc_nulls_last]: 'is null',
  } as const;

  /** @internal */
  override createNativeQueryBuilder(): MySqlNativeQueryBuilder {
    return new MySqlNativeQueryBuilder(this);
  }

  override getDefaultCharset(): string {
    return 'utf8mb4';
  }

  override getBeginTransactionSQL(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean }): string[] {
    if (options?.isolationLevel || options?.readOnly) {
      const parts: string[] = [];

      if (options.isolationLevel) {
        parts.push(`isolation level ${options.isolationLevel}`);
      }

      if (options.readOnly) {
        parts.push('read only');
      }

      const sql = `set transaction ${parts.join(', ')}`;

      return [sql, 'begin'];
    }

    return ['begin'];
  }

  override convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    if (context?.mode === 'query') {
      return value;
    }

    return JSON.stringify(value);
  }

  override getJsonIndexDefinition(index: IndexDef): string[] {
    return index.columnNames
      .map(column => {
        if (!column.includes('.')) {
          return column;
        }

        const [root, ...path] = column.split('.');
        return `(json_value(${this.quoteIdentifier(root)}, '$.${path.join('.')}' returning ${index.options?.returning ?? 'char(255)'}))`;
      });
  }

  override getBooleanTypeDeclarationSQL(): string {
    return 'tinyint(1)';
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
    const simpleType = this.extractSimpleType(type);

    if (['decimal', 'numeric'].includes(simpleType)) {
      return this.getDecimalTypeDeclarationSQL(options);
    }

    return type;
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type === 'tinyint(1)') {
      return super.getDefaultMappedType('boolean');
    }

    return super.getDefaultMappedType(type);
  }

  override isNumericColumn(mappedType: Type<unknown>): boolean {
    return super.isNumericColumn(mappedType) || [DecimalType, DoubleType].some(t => mappedType instanceof t);
  }

  override supportsUnsigned(): boolean {
    return true;
  }

  /**
   * Returns the default name of index for the given columns
   * cannot go past 64 character length for identifiers in MySQL
   */
  override getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    if (type === 'primary') {
      return this.getDefaultPrimaryName(tableName, columns);
    }

    const indexName = super.getIndexName(tableName, columns, type);

    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - type.length)}_${Utils.hash(indexName, 5)}_${type}`;
    }

    return indexName;
  }

  override getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'PRIMARY'; // https://dev.mysql.com/doc/refman/8.0/en/create-table.html#create-table-indexes-keys
  }

  override supportsCreatingFullTextIndex(): boolean {
    return true;
  }

  override getFullTextWhereClause(): string {
    return `match(:column:) against (:query in boolean mode)`;
  }

  override getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    /* v8 ignore next */
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    return `alter table ${quotedTableName} add fulltext index ${quotedIndexName}(${quotedColumnNames.join(',')})`;
  }

  override getOrderByExpression(column: string, direction: string): string[] {
    const ret: string[] = [];
    const dir = direction.toLowerCase() as keyof typeof this.ORDER_BY_NULLS_TRANSLATE;

    if (dir in this.ORDER_BY_NULLS_TRANSLATE) {
      ret.push(`${column} ${this.ORDER_BY_NULLS_TRANSLATE[dir]}`);
    }

    ret.push(`${column} ${dir.replace(/(\s|nulls|first|last)*/gi, '')}`);

    return ret;
  }

  override getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  /**
   * @internal
   */
  override getJsonElementPropertySQL(field: string, alias: string, type?: string): string {
    const jsonPath = `json_unquote(json_extract(${this.quoteIdentifier(alias)}.elem, '$.${field}'))`;
    return this.castJsonElementValue(jsonPath, type);
  }

  /**
   * @internal
   */
  override getJsonArrayIteratorSQL(column: string, alias: string): string {
    return `json_table(${column}, '$[*]' columns (elem json path '$')) as ${this.quoteIdentifier(alias)}`;
  }

  /**
   * Override for MySQL to optimize $elemMatch queries.
   * Uses JSON_CONTAINS for simple equality conditions (much faster).
   * Falls back to json_table with inner self-join pattern for complex operators.
   * @internal
   */
  override getJsonArrayContainsSql(column: string, conditionsSql: string, alias: string, params: unknown[], options?: { tableName?: string; tableAlias?: string; pkField?: string; fieldName?: string; rawConditions?: unknown }): { sql: string; params: unknown[] } {
    // Try to use JSON_CONTAINS optimization for simple equality conditions
    if (options?.rawConditions && this.isSimpleEqualityConditions(options.rawConditions)) {
      const jsonObject = JSON.stringify(options.rawConditions);
      const sql = `json_contains(${column}, ?)`;
      return { sql, params: [jsonObject] };
    }

    // If we have full context (table info), use the inner self-join pattern for complex conditions
    if (options?.tableName && options?.tableAlias && options?.pkField && options?.fieldName) {
      const innerAlias = `${options.tableAlias}_jt`;
      const innerColumn = `${this.quoteIdentifier(innerAlias)}.${this.quoteIdentifier(options.fieldName)}`;
      const iterator = this.getJsonArrayIteratorSQL(innerColumn, alias);
      const innerPk = `${this.quoteIdentifier(innerAlias)}.${this.quoteIdentifier(options.pkField)}`;
      const outerPk = `${this.quoteIdentifier(options.tableAlias)}.${this.quoteIdentifier(options.pkField)}`;
      const sql = `exists (select 1 from ${this.quoteIdentifier(options.tableName)} as ${this.quoteIdentifier(innerAlias)}, ${iterator} where ${innerPk} = ${outerPk} and ${conditionsSql})`;
      return { sql, params };
    }

    // Default fallback - use standard EXISTS (may not work for all MySQL versions with correlated subqueries)
    const iterator = this.getJsonArrayIteratorSQL(column, alias);
    const sql = `exists (select 1 from ${iterator} where ${conditionsSql})`;
    return { sql, params };
  }

  /**
   * Checks if the $elemMatch conditions are simple equality conditions (no operators).
   * Simple conditions like { field: 'value' } can use the faster JSON_CONTAINS approach.
   * Complex conditions like { field: { $gt: 10 } } require json_table.
   * @internal
   */
  private isSimpleEqualityConditions(conditions: unknown): boolean {
    if (!Utils.isPlainObject(conditions)) {
      return false;
    }

    for (const key of Object.keys(conditions as object)) {
      // Any operator key requires json_table
      if (Utils.isOperator(key)) {
        return false;
      }

      const value = (conditions as Record<string, unknown>)[key];

      // If value has operators, it's not simple equality
      if (Utils.isPlainObject(value) && Object.keys(value as object).some(k => Utils.isOperator(k))) {
        return false;
      }
    }

    return true;
  }

}
