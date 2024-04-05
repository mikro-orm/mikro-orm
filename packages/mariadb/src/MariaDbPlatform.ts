import { AbstractSqlPlatform, QueryOrder } from '@mikro-orm/knex';
import { MariaDbSchemaHelper } from './MariaDbSchemaHelper';
import { MariaDbExceptionConverter } from './MariaDbExceptionConverter';
import { Utils, type SimpleColumnMeta, type Type } from '@mikro-orm/core';

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

    return super.getDefaultMappedType(type);
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

  private readonly ORDER_BY_NULLS_TRANSLATE = {
    [QueryOrder.asc_nulls_first]: 'is not null',
    [QueryOrder.asc_nulls_last]: 'is null',
    [QueryOrder.desc_nulls_first]: 'is not null',
    [QueryOrder.desc_nulls_last]: 'is null',
  } as const;

  /* istanbul ignore next */
  override getOrderByExpression(column: string, direction: string): string[] {
    const ret: string[] = [];
    const dir = direction.toLowerCase() as keyof typeof this.ORDER_BY_NULLS_TRANSLATE;

    if (dir in this.ORDER_BY_NULLS_TRANSLATE) {
      ret.push(`${column} ${this.ORDER_BY_NULLS_TRANSLATE[dir]}`);
    }

    ret.push(`${column} ${dir.replace(/(\s|nulls|first|last)*/gi, '')}`);

    return ret;
  }

}
