import { SchemaHelper } from './SchemaHelper';
import { EntityMetadata, EntityProperty } from '../decorators';

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
    return `SET NAMES 'utf8';\nSET session_replication_role = 'replica';\n\n\n`;
  }

  getSchemaEnd(): string {
    return `SET session_replication_role = 'origin';\n`;
  }

  getAutoIncrementStatement(meta: EntityMetadata): string {
    return `DEFAULT NEXTVAL('${meta.collection}_seq')`;
  }

  getTypeDefinition(prop: EntityProperty): string {
    return super.getTypeDefinition(prop, PostgreSqlSchemaHelper.TYPES, PostgreSqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
  }

  getUnsignedSuffix(prop: EntityProperty): string {
    return ` check (${this.quoteIdentifier(prop.fieldName)} > 0)`;
  }

  supportsSequences(): boolean {
    return true;
  }

  indexForeignKeys() {
    return false;
  }

  dropTable(meta: EntityMetadata): string {
    let ret = `DROP TABLE IF EXISTS ${this.quoteIdentifier(meta.collection)} CASCADE;\n`;
    ret += `DROP SEQUENCE IF EXISTS ${this.quoteIdentifier(meta.collection + '_seq')};\n`;

    return ret;
  }

}
