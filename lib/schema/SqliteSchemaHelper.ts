import { SchemaHelper } from './SchemaHelper';
import { EntityMetadata, EntityProperty } from '../decorators';

export class SqliteSchemaHelper extends SchemaHelper {

  static readonly TYPES = {
    number: 'INTEGER',
    boolean: 'INTEGER',
    date: 'TEXT',
    string: 'TEXT',
  };

  getAutoIncrementStatement(meta: EntityMetadata): string {
    return 'AUTOINCREMENT';
  }

  getSchemaBeginning(): string {
    return 'PRAGMA foreign_keys=OFF;\n\n\n';
  }

  getSchemaEnd(): string {
    return 'PRAGMA foreign_keys=ON;\n';
  }

  getPrimaryKeySubtype(meta: EntityMetadata): string {
    return 'PRIMARY KEY';
  }

  getTypeDefinition(prop: EntityProperty): string {
    const t = prop.type.toLowerCase() as keyof typeof SqliteSchemaHelper.TYPES;
    return SqliteSchemaHelper.TYPES[t] || SqliteSchemaHelper.TYPES.string;
  }

  supportsSchemaConstraints(): boolean {
    return false;
  }

  supportsSchemaMultiAlter(): boolean {
    return false;
  }

}
