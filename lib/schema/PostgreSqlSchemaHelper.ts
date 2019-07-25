import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';

export class PostgreSqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: 'int',
    float: 'float',
    double: 'double precision',
    string: 'varchar(?)',
    date: 'timestamp(?)',
    boolean: 'boolean',
    text: 'text',
    json: 'json',
  };

  static readonly DEFAULT_TYPE_LENGTHS = {
    string: 255,
    date: 0,
  };

  getSchemaBeginning(): string {
    return `set names 'utf8';\nset session_replication_role = 'replica';\n\n`;
  }

  getSchemaEnd(): string {
    return `set session_replication_role = 'origin';\n`;
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, PostgreSqlSchemaHelper.TYPES, PostgreSqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  indexForeignKeys() {
    return false;
  }

}
