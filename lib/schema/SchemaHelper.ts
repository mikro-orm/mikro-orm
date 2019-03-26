import { EntityMetadata, EntityProperty } from '../decorators';

export abstract class SchemaHelper {

  getIdentifierQuoteCharacter(): string {
    return '"';
  }

  getSchemaBeginning(): string {
    return '';
  }

  getSchemaEnd(): string {
    return '';
  }

  getSchemaTableEnd(): string {
    return '';
  }

  getAutoIncrementStatement(meta: EntityMetadata): string {
    return 'AUTO_INCREMENT';
  }

  getPrimaryKeySubtype(meta: EntityMetadata): string {
    return 'NOT NULL';
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

  getUnsignedSuffix(prop: EntityProperty): string {
    return '';
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  supportsSchemaMultiAlter(): boolean {
    return true;
  }

  supportsSequences(): boolean {
    return false;
  }

  quoteIdentifier(field: string): string {
    const quoteChar = this.getIdentifierQuoteCharacter();
    return quoteChar + field + quoteChar;
  }

  dropTable(meta: EntityMetadata): string {
    const pkProp = meta.properties[meta.primaryKey];
    let ret = `DROP TABLE IF EXISTS ${this.quoteIdentifier(meta.collection)};\n`;

    if (this.supportsSequences() && pkProp.type === 'number') {
      ret += `DROP SEQUENCE IF EXISTS ${this.quoteIdentifier(meta.collection + '_seq')};\n`;
    }

    return ret;
  }

  indexForeignKeys() {
    return true;
  }

}
