import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';
import { MySqlTableBuilder } from 'knex';

export class MySqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: 'int(?)',
    float: 'float',
    double: 'double',
    string: 'varchar(?)',
    date: 'datetime(?)',
    boolean: 'tinyint(1)',
    text: 'text',
    json: 'json',
  };

  static readonly DEFAULT_TYPE_LENGTHS = {
    number: 11,
    string: 255,
    date: 0,
  };

  getSchemaBeginning(): string {
    return 'set names utf8;\nset foreign_key_checks = 0;\n\n';
  }

  getSchemaEnd(): string {
    return 'set foreign_key_checks = 1;\n';
  }

  finalizeTable(table: MySqlTableBuilder): void {
    table.engine('InnoDB');
    table.charset('utf8');
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

}
