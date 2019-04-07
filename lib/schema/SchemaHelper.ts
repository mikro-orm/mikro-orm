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

  createPrimaryKeyColumn(meta: EntityMetadata, prop: EntityProperty): string {
    let ret = ' ' + this.getPrimaryKeySubtype(meta);

    if (prop.type === 'number') {
      ret += ' ' + this.getAutoIncrementStatement(meta);
    }

    return ret;
  }

  createColumn(meta: EntityMetadata, prop: EntityProperty, nullable: boolean): string {
    let ret = '';

    if (prop.unique) {
      ret += ' UNIQUE';
    }

    if (!nullable) {
      ret += ' NOT NULL';
    }

    // support falsy default values like `0`, `false or empty string
    if (typeof prop.default !== 'undefined') {
      return ret + ` DEFAULT ${prop.default}`;
    }

    if (nullable) {
      return ret + ` DEFAULT NULL`;
    }

    return ret;
  }

}
