import type { Dictionary, EntityMetadata, EntityOptions, EntityProperty, NamingStrategy, Platform } from '@mikro-orm/core';
import { ReferenceType, UnknownType, Utils } from '@mikro-orm/core';

export class SourceFile {

  private readonly coreImports = new Set<string>();
  private readonly entityImports = new Set<string>();

  constructor(private readonly meta: EntityMetadata,
              private readonly namingStrategy: NamingStrategy,
              private readonly platform: Platform) { }

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
    const enumDefinitions: string[] = [];
    Object.values(this.meta.properties).forEach(prop => {
      const decorator = this.getPropertyDecorator(prop, 2);
      const definition = this.getPropertyDefinition(prop, 2);

      if (!ret.endsWith('\n\n')) {
        ret += '\n';
      }

      ret += decorator;
      ret += definition;
      ret += '\n';

      if (prop.enum) {
        const enumClassName = this.namingStrategy.getClassName(this.meta.collection + '_' + prop.fieldNames[0], '_');
        enumDefinitions.push(this.getEnumClassDefinition(enumClassName, prop.items as string[], 2));
      }
    });
    ret += '}\n';

    const imports = [`import { ${([...this.coreImports].sort().join(', '))} } from '@mikro-orm/core';`];
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${entity} } from './${entity}';`);
    });

    ret = `${imports.join('\n')}\n\n${ret}`;
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    return ret;
  }

  getBaseName() {
    return this.meta.className + '.ts';
  }

  private getCollectionDecl() {
    const options: EntityOptions<unknown> = {};
    const quote = (str: string) => `'${str}'`;

    if (this.meta.collection !== this.namingStrategy.classToTableName(this.meta.className)) {
      options.tableName = quote(this.meta.collection);
    }

    if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
      options.schema = quote(this.meta.schema);
    }

    if (!Utils.hasObjectKeys(options)) {
      return '';
    }

    return `{ ${Object.entries(options).map(([opt, val]) => `${opt}: ${val}`).join(', ')} }`;
  }

  private getPropertyDefinition(prop: EntityProperty, padLeft: number): string {
    // string defaults are usually things like SQL functions
    // string defaults can be an enum though, in which case useDefault should be true.
    const useDefault = prop.default != null && (prop.enum || typeof prop.default !== 'string');
    const optional = prop.nullable ? '?' : (useDefault ? '' : '!');
    const ret = `${prop.name}${optional}: ${prop.type}`;
    const padding = ' '.repeat(padLeft);

    if (!useDefault) {
      return `${padding + ret};\n`;
    }

    if (prop.enum && typeof prop.default === 'string') {
      const noQuoteDefault = prop.default.match(/^'(.*)'$/)?.[1] ?? prop.default;
      return `${padding}${ret} = ${prop.type}.${noQuoteDefault.toUpperCase()};\n`;
    }

    return `${padding}${ret} = ${prop.default};\n`;
  }

  private getEnumClassDefinition(enumClassName: string, enumValues: string[], padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    let ret = `export enum ${enumClassName} {\n`;
    enumValues.forEach(enumValue => {
      ret += `${padding}${enumValue.toUpperCase()} = '${enumValue}',\n`;
    });
    ret += '}\n';
    return ret;
  }

  private getPropertyDecorator(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    const options = {} as Dictionary;
    let decorator = this.getDecoratorType(prop);
    this.coreImports.add(decorator.substr(1));

    if (prop.reference !== ReferenceType.SCALAR) {
      this.getForeignKeyDecoratorOptions(options, prop);
    } else {
      this.getScalarPropertyDecoratorOptions(options, prop);
    }

    if (prop.enum) {
      options.items = `() => ${prop.type}`;
    }

    this.getCommonDecoratorOptions(options, prop);
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

    const processIndex = (type: 'index' | 'unique') => {
      if (!prop[type]) {
        return;
      }

      const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
      options[type] = defaultName === prop[type] ? 'true' : `'${prop[type]}'`;
      const expected = {
        index: this.platform.indexForeignKeys(),
        unique: prop.reference === ReferenceType.ONE_TO_ONE,
      };

      if (expected[type] && options[type] === 'true') {
        delete options[type];
      }
    };

    processIndex('index');
    processIndex('unique');

    return [];
  }

  private getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    if (prop.nullable) {
      options.nullable = true;
    }

    // If prop is an enum, its default value would be covered in the property definition
    // instead of in property decorator, so we early return.
    if (prop.enum) {
      return;
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

  private getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    let t = prop.type.toLowerCase();

    if (t === 'date') {
      t = 'datetime';
    }

    if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    // for enum properties, we don't need a column type or the property length
    // in the decorator so return early.
    if (prop.enum) {
      return;
    }

    const mappedType1 = this.platform.getMappedType(t);
    const mappedType2 = this.platform.getMappedType(prop.columnTypes[0]);
    const columnType1 = mappedType1.getColumnType({ ...prop, autoincrement: false }, this.platform);
    const columnType2 = mappedType2.getColumnType({ ...prop, autoincrement: false }, this.platform);

    if (columnType1 !== columnType2 || [mappedType1, mappedType2].some(t => t instanceof UnknownType)) {
      options.columnType = this.quote(prop.columnTypes[0]);
    }

    if (prop.length) {
      options.length = prop.length;
    }
  }

  private getForeignKeyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    const parts = prop.referencedTableName.split('.', 2);
    const className = this.namingStrategy.getClassName(parts.length > 1 ? parts[1] : parts[0], '_');
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

  private quote(val: string) {
    return val.includes(`'`) ? `\`${val}\`` : `'${val}'`;
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

    if (prop.enum) {
      return '@Enum';
    }

    return '@Property';
  }

}
