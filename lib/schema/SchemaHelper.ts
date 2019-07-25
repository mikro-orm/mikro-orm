import { TableBuilder } from 'knex';
import { EntityProperty } from '../decorators';

export abstract class SchemaHelper {

  getSchemaBeginning(): string {
    return '';
  }

  getSchemaEnd(): string {
    return '';
  }

  finalizeTable(table: TableBuilder): void {
    //
  }

  getTypeDefinition(prop: EntityProperty, types: Record<string, string> = {}, lengths: Record<string, number> = {}): string {
    const t = prop.type.toLowerCase();
    let type = types[t] || types.json || types.text || t;

    if (type.includes('(?)')) {
      const length = prop.length || lengths[t];
      type = length ? type.replace('?', length) : type.replace('(?)', '');
    }

    return type;
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  indexForeignKeys() {
    return true;
  }

}
