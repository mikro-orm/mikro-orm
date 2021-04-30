import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MySqlSchemaHelper } from './MySqlSchemaHelper';
import { MySqlExceptionConverter } from './MySqlExceptionConverter';
import { Type, Utils } from '@mikro-orm/core';

export class MySqlPlatform extends AbstractSqlPlatform {

  protected readonly schemaHelper: MySqlSchemaHelper = new MySqlSchemaHelper(this);
  protected readonly exceptionConverter = new MySqlExceptionConverter();

  getDefaultCharset(): string {
    return 'utf8mb4';
  }

  getSearchJsonPropertyKey(path: string[], type: string): string {
    const [a, ...b] = path;
    return `${this.quoteIdentifier(a)}->'$.${b.join('.')}'`;
  }

  getBooleanTypeDeclarationSQL(): string {
    return 'tinyint(1)';
  }

  getMappedType(type: string): Type<unknown> {
    if (type === 'tinyint(1)') {
      return super.getMappedType('boolean');
    }

    const normalizedType = this.extractSimpleType(type);
    const map = {
      int: 'integer',
    };

    return super.getMappedType(map[normalizedType] ?? type);
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
      return 'PRIMARY'; // https://dev.mysql.com/doc/refman/8.0/en/create-table.html#create-table-indexes-keys
    }

    let indexName = super.getIndexName(tableName, columns, type);
    if (indexName.length > 64) {
      indexName = `${indexName.substr(0, 57 - type.length)}_${Utils.hash(indexName).substr(0, 5)}_${type}`;
    }

    return indexName;
  }

}
