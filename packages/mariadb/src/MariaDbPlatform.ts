import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MariaDbSchemaHelper } from './MariaDbSchemaHelper';
import { MariaDbExceptionConverter } from './MariaDbExceptionConverter';
import { Utils, type SimpleColumnMeta, type Dictionary, type Type } from '@mikro-orm/core';

export class MariaDbPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: MariaDbSchemaHelper = new MariaDbSchemaHelper(this);
  protected override readonly exceptionConverter = new MariaDbExceptionConverter();

  override getDefaultCharset(): string {
    return 'utf8mb4';
  }

  override getBooleanTypeDeclarationSQL(): string {
    return 'tinyint(1)';
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type === 'tinyint(1)') {
      return super.getDefaultMappedType('boolean');
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
      timestamp: 'datetime',
    } as Dictionary;

    return super.getDefaultMappedType(map[normalizedType] ?? type);
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

    /* istanbul ignore next */
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
    /* istanbul ignore next */
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    return `alter table ${quotedTableName} add fulltext index ${quotedIndexName}(${quotedColumnNames.join(',')})`;
  }

}
