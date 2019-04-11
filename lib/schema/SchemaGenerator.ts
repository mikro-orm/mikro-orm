import { Cascade, IDatabaseDriver, ReferenceType } from '..';
import { EntityMetadata, EntityProperty } from '../decorators';
import { Platform } from '../platforms';

export class SchemaGenerator {

  private readonly platform: Platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper();

  constructor(private readonly driver: IDatabaseDriver,
              private readonly metadata: Record<string, EntityMetadata>) { }

  generate(): string {
    let ret = this.helper.getSchemaBeginning();

    Object.values(this.metadata).forEach(meta => {
      ret += this.helper.dropTable(meta) + '\n';
      ret += this.createTable(meta) + '\n';
    });

    Object.values(this.metadata).forEach(meta => {
      ret += this.createForeignKeys(meta);
    });

    ret += this.helper.getSchemaEnd();

    return ret;
  }

  private createTable(meta: EntityMetadata): string {
    const pkProp = meta.properties[meta.primaryKey];
    let ret = '';

    if (this.helper.supportsSequences() && pkProp.type === 'number') {
      ret += `CREATE SEQUENCE ${this.helper.quoteIdentifier(meta.collection + '_seq')};\n`;
    }

    ret += `CREATE TABLE ${this.helper.quoteIdentifier(meta.collection)} (\n`;

    Object
      .values(meta.properties)
      .filter(prop => this.shouldHaveColumn(prop))
      .forEach(prop => ret += '  ' + this.createTableColumn(meta, prop) + ',\n');

    if (this.helper.supportsSchemaConstraints()) {
      ret += this.createIndexes(meta);
    } else {
      ret = ret.substr(0, ret.length - 2) + '\n';
    }

    ret += `)${this.helper.getSchemaTableEnd()};\n\n`;

    return ret;
  }

  private shouldHaveColumn(prop: EntityProperty): boolean {
    if (prop.persist === false) {
      return false;
    }

    if (prop.reference === ReferenceType.SCALAR) {
      return true;
    }

    if (!this.helper.supportsSchemaConstraints()) {
      return false;
    }

    return prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
  }

  private createTableColumn(meta: EntityMetadata, prop: EntityProperty, alter = false): string {
    const fieldName = prop.fieldName;
    const ret = this.helper.quoteIdentifier(fieldName) + ' ' + this.type(prop);
    const nullable = (alter && this.platform.requiresNullableForAlteringColumn()) || prop.nullable!;

    if (prop.primary) {
      return ret + this.helper.createPrimaryKeyColumn(meta, prop);
    }

    return ret + this.helper.createColumn(meta, prop, nullable);
  }

  private createIndexes(meta: EntityMetadata): string {
    let ret = `  PRIMARY KEY (${this.helper.quoteIdentifier(meta.properties[meta.primaryKey].fieldName)})`;

    if (this.helper.indexForeignKeys()) {
      Object
        .values(meta.properties)
        .filter(prop => prop.reference === ReferenceType.MANY_TO_ONE)
        .forEach(prop => ret += `,\n  KEY ${this.helper.quoteIdentifier(prop.fieldName)} (${this.helper.quoteIdentifier(prop.fieldName)})`);
    }

    return ret + '\n';
  }

  private createForeignKeys(meta: EntityMetadata): string {
    const ret = `ALTER TABLE ${this.helper.quoteIdentifier(meta.collection)}`;
    let i = 1;

    const constraints = Object
      .values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner))
      .map(prop => this.createForeignKey(meta, prop, i++));

    if (constraints.length === 0) {
      return '';
    }

    if (this.helper.supportsSchemaMultiAlter()) {
      return ret + '\n ' + constraints.join(',\n ') + ';\n\n\n';
    }

    return constraints.map(c => ret + c + ';').join('\n') + '\n\n';
  }

  private createForeignKey(meta: EntityMetadata, prop: EntityProperty, index: number): string {
    if (this.helper.supportsSchemaConstraints()) {
      return this.createForeignConstraint(meta, prop, index);
    }

    let ret = ' ADD ' + this.createTableColumn(meta, prop, true) + ' ';
    ret += this.createForeignKeyReference(prop);

    return ret;
  }

  private createForeignConstraint(meta: EntityMetadata, prop: EntityProperty, index: number): string {
    let ret = ' ADD CONSTRAINT ' + this.helper.quoteIdentifier(meta.collection + '_ibfk_' + index);
    ret += ` FOREIGN KEY (${this.helper.quoteIdentifier(prop.fieldName)}) `;
    ret += this.createForeignKeyReference(prop);

    return ret;
  }

  private createForeignKeyReference(prop: EntityProperty): string {
    const meta2 = this.metadata[prop.type];
    const pk2 = meta2.properties[meta2.primaryKey].fieldName;
    let ret = `REFERENCES ${this.helper.quoteIdentifier(meta2.collection)} (${this.helper.quoteIdentifier(pk2)})`;
    const cascade = prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL);
    ret += ` ON DELETE ${cascade ? 'CASCADE' : 'SET NULL'}`;

    if (prop.cascade.includes(Cascade.PERSIST) || prop.cascade.includes(Cascade.ALL)) {
      ret += ' ON UPDATE CASCADE';
    }

    return ret;
  }

  private type(prop: EntityProperty, foreignKey?: EntityProperty): string {
    const type = this.helper.getTypeDefinition(prop);

    if (prop.reference !== ReferenceType.SCALAR) {
      const meta = this.metadata[prop.type];
      return this.type(meta.properties[meta.primaryKey], prop);
    }

    if (prop.type === 'number' && prop.primary) {
      return type + this.helper.getUnsignedSuffix(foreignKey || prop);
    }

    return type;
  }

}
