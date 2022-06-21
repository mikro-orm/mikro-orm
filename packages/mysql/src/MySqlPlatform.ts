import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MySqlSchemaHelper } from './MySqlSchemaHelper';
import { MySqlExceptionConverter } from './MySqlExceptionConverter';
import type { Type } from '@mikro-orm/core';
import { expr, Utils } from '@mikro-orm/core';

export class MySqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: MySqlSchemaHelper = new MySqlSchemaHelper(this);
  protected readonly exceptionConverter = new MySqlExceptionConverter();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean): string {
    const [a, ...b] = path;

    if (aliased) {
      return expr(alias => `${this.quoteIdentifier(`${alias}.${a}`)}->'$.${b.join('.')}'`);
    }

    return `${this.quoteIdentifier(a)}->'$.${b.join('.')}'`;
  }

  getBooleanTypeDeclarationSQL(): string {
    return 'tinyint(1)';
  }

  getDefaultMappedType(type: string): Type<unknown> {
    if (type === 'tinyint(1)') {
      return super.getDefaultMappedType('boolean');
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
      timestamp: 'datetime',
    };

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  supportsUnsigned(): boolean {
    return true;
  }

  /**
   * Returns the default name of index for the given columns
   * cannot go past 64 character length for identifiers in MySQL
   */
  getIndexName(tableName: string, columns: string[], type: 'index' | 'unique' | 'foreign' | 'primary' | 'sequence'): string {
    if (type === 'primary') {
      return this.getDefaultPrimaryName(tableName, columns);
    }

    const indexName = super.getIndexName(tableName, columns, type);
    if (indexName.length > 64) {
      return `${indexName.substring(0, 56 - type.length)}_${Utils.hash(indexName, 5)}_${type}`;
    }

    return indexName;
  }

  getDefaultPrimaryName(tableName: string, columns: string[]): string {
    return 'PRIMARY'; // https://dev.mysql.com/doc/refman/8.0/en/create-table.html#create-table-indexes-keys
  }

}
