import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';

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

  getIdentifierQuoteCharacter(): string {
    return '`';
  }

  getSchemaBeginning(): string {
    return 'SET NAMES utf8;\nSET FOREIGN_KEY_CHECKS=0;\n\n\n';
  }

  getSchemaEnd(): string {
    return 'SET FOREIGN_KEY_CHECKS=1;\n';
  }

  getSchemaTableEnd(): string {
    return ' ENGINE=InnoDB DEFAULT CHARSET=utf8';
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, MySqlSchemaHelper.TYPES, MySqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getUnsignedSuffix(prop: EntityProperty): string {
    return ' unsigned';
  }

}
