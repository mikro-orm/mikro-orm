import { SchemaHelper } from './SchemaHelper';
import { EntityProperty } from '../decorators';

export class SqliteSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: ['integer'],
    boolean: ['integer'],
    date: ['text'],
    string: ['text'],
  };

  getSchemaBeginning(): string {
    return 'pragma foreign_keys = off;\n\n';
  }

  getSchemaEnd(): string {
    return 'pragma foreign_keys = on;\n';
  }

  getTypeDefinition(prop: EntityProperty): string {
    const t = prop.type.toLowerCase() as keyof typeof SqliteSchemaHelper.TYPES;
    return (SqliteSchemaHelper.TYPES[t] || SqliteSchemaHelper.TYPES.string)[0];
  }

  supportsSchemaConstraints(): boolean {
    return false;
  }

}
