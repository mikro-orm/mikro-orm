import { Dictionary, EntityMetadata, EntityProperty, NamingStrategy, ReferenceType, Utils } from '@mikro-orm/core';
import { SchemaHelper } from '@mikro-orm/knex';

export class SourceFile {

  private readonly coreImports = new Set<string>();
  private readonly entityImports = new Set<string>();

  constructor(private readonly meta: EntityMetadata,
              private readonly namingStrategy: NamingStrategy,
              private readonly helper: SchemaHelper) { }

  generate(): string {
    this.coreImports.add('Entity');
    let ret = `@Entity(${this.getCollectionDecl()})\n`;

    this.meta.indexes.forEach(index => {
      this.coreImports.add('Index');
      const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
      ret += `@Index({ name: '${index.name}', properties: [${properties.join(', ')}] })\n`;
    });

    this.meta.uniques.forEach(index => {
      this.coreImports.add('Unique');
      const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
      ret += `@Unique({ name: '${index.name}', properties: [${properties.join(', ')}] })\n`;
    });

    ret += `export class ${this.meta.className} {\n`;
    Object.values(this.meta.properties).forEach(prop => {
      const decorator = this.getPropertyDecorator(prop, 2);
      const definition = this.getPropertyDefinition(prop, 2);

      if (!ret.endsWith('\n\n')) {
        ret += '\n';
      }

      ret += decorator;
      ret += definition;
      ret += '\n';
    });
    ret += '}\n';

    const imports = [`import { ${([...this.coreImports].sort().join(', '))} } from '@mikro-orm/core';`];
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${entity} } from './${entity}';`);
    });

    return `${imports.join('\n')}\n\n${ret}`;
  }

  getBaseName() {
    return this.meta.className + '.ts';
  }

  private getCollectionDecl() {
    const needsCollection = this.meta.collection !== this.namingStrategy.classToTableName(this.meta.className);

    return needsCollection ? `{ collection: '${this.meta.collection}' }` : '';
  }

  private getPropertyDefinition(prop: EntityProperty, padLeft: number): string {
    // string defaults are usually things like SQL functions
    const useDefault = prop.default && typeof prop.default !== 'string';
    const optional = prop.nullable ? '?' : (useDefault ? '' : '!');
    const ret = `${prop.name}${optional}: ${prop.type}`;
    const padding = ' '.repeat(padLeft);

    if (!useDefault) {
      return `${padding + ret};\n`;
    }

    return `${padding}${ret} = ${prop.default};\n`;
  }

  private getPropertyDecorator(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    const options = {} as Dictionary;
    const columnType = this.helper.getTypeFromDefinition(prop.columnTypes[0], '__false') === '__false' ? prop.columnTypes[0] : undefined;
    let decorator = this.getDecoratorType(prop);
    this.coreImports.add(decorator.substr(1));

    if (prop.reference !== ReferenceType.SCALAR) {
      this.getForeignKeyDecoratorOptions(options, prop);
    } else {
      this.getScalarPropertyDecoratorOptions(options, prop, columnType);
    }

    this.getCommonDecoratorOptions(options, prop, columnType);
    const indexes = this.getPropertyIndexes(prop, options);
    decorator = [...indexes.sort(), decorator].map(d => padding + d).join('\n');

    if (!Utils.hasObjectKeys(options)) {
      return `${decorator}()\n`;
    }

    return `${decorator}({ ${Object.entries(options).map(([opt, val]) => `${opt}: ${val}`).join(', ')} })\n`;
  }

  private getPropertyIndexes(prop: EntityProperty, options: Dictionary): string[] {
    if (prop.reference === ReferenceType.SCALAR) {
      const ret: string[] = [];

      if (prop.index) {
        this.coreImports.add('Index');
        ret.push(`@Index({ name: '${prop.index}' })`);
      }

      if (prop.unique) {
        this.coreImports.add('Unique');
        ret.push(`@Unique({ name: '${prop.unique}' })`);
      }

      return ret;
    }

    if (prop.index) {
      options.index = `'${prop.index}'`;
    }

    if (prop.unique) {
      options.unique = `'${prop.unique}'`;
    }

    return [];
  }

  private getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty, columnType: string | undefined) {
    if (columnType) {
      options.columnType = `'${columnType}'`;
    }

    if (prop.nullable) {
      options.nullable = true;
    }

    if (prop.default && typeof prop.default === 'string') {
      if ([`''`, ''].includes(prop.default)) {
        options.default = `''`;
      } else if (prop.default.match(/^'.*'$/)) {
        options.default = prop.default;
      } else {
        options.defaultRaw = `\`${prop.default}\``;
      }
    }
  }

  private getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty, columnType: string | undefined): void {
    const defaultColumnType = this.helper.getTypeDefinition(prop).replace(/\(\d+\)/, '');

    if (!columnType && prop.columnTypes[0] !== defaultColumnType && prop.type !== columnType) {
      options.columnType = `'${prop.columnTypes[0]}'`;
    }

    if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    if (prop.length && prop.columnTypes[0] !== 'enum') {
      options.length = prop.length;
    }
  }

  private getForeignKeyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    const className = this.namingStrategy.getClassName(prop.referencedTableName, '_');
    this.entityImports.add(className);
    options.entity = `() => ${className}`;

    if (prop.fieldNames[0] !== this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[0])) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    if (!['no action', 'restrict'].includes(prop.onUpdateIntegrity!.toLowerCase())) {
      options.onUpdateIntegrity = `'${prop.onUpdateIntegrity}'`;
    }

    if (!['no action', 'restrict'].includes(prop.onDelete!.toLowerCase())) {
      options.onDelete = `'${prop.onDelete}'`;
    }

    if (prop.primary) {
      options.primary = true;
    }
  }

  private getDecoratorType(prop: EntityProperty): string {
    if (prop.reference === ReferenceType.ONE_TO_ONE) {
      return '@OneToOne';
    }

    if (prop.reference === ReferenceType.MANY_TO_ONE) {
      return '@ManyToOne';
    }

    if (prop.primary) {
      return '@PrimaryKey';
    }

    return '@Property';
  }

}
