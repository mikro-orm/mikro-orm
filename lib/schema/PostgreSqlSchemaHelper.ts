import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';

export class PostgreSqlSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: ['int', 'int8', 'integer', 'float', 'float8', 'double', 'double precision', 'bigint', 'smallint', 'decimal', 'numeric', 'real'],
    float: ['float'],
    double: ['double', 'double precision', 'float8'],
    string: ['varchar(?)', 'character varying', 'text', 'character', 'char'],
    date: ['datetime(?)', 'timestamp(?)', 'timestamp without time zone', 'timestamptz', 'datetimetz', 'time', 'date', 'timetz', 'datetz'],
    boolean: ['boolean', 'bool'],
    text: ['text'],
    json: ['json'],
  };

  static readonly DEFAULT_VALUES = {
    'now()': ['now()', 'current_timestamp'],
    "('now'::text)::timestamp(?) with time zone": ['current_timestamp(?)'],
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
