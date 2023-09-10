import {
  DateType,
  DecimalType,
  type Dictionary,
  type EntityMetadata,
  type EntityOptions,
  type EntityProperty,
  type NamingStrategy,
  type OneToOneOptions,
  type Platform,
  ReferenceKind,
  UnknownType,
  Utils,
} from '@mikro-orm/core';

export class SourceFile {
  protected readonly coreImports = new Set<string>();
  protected readonly entityImports = new Set<string>();

  constructor(
    protected readonly meta: EntityMetadata,
    protected readonly namingStrategy: NamingStrategy,
    protected readonly platform: Platform,
    protected readonly esmImport: boolean,
  ) {}

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

    ret += `export class ${this.meta.className} {`;
    const enumDefinitions: string[] = [];
    const optionalProperties: EntityProperty<any>[] = [];
    let classBody = '\n';
    Object.values(this.meta.properties).forEach(prop => {
      const decorator = this.getPropertyDecorator(prop, 2);
      const definition = this.getPropertyDefinition(prop, 2);

      if (!classBody.endsWith('\n\n')) {
        classBody += '\n';
      }

      classBody += decorator;
      classBody += definition;
      classBody += '\n';

      if (prop.enum) {
        const enumClassName = this.namingStrategy.getClassName(this.meta.collection + '_' + prop.fieldNames[0], '_');
        enumDefinitions.push(this.getEnumClassDefinition(enumClassName, prop.items as string[], 2));
      }

      if (!prop.nullable && typeof prop.default !== 'undefined') {
        optionalProperties.push(prop);
      }
    });

    if (optionalProperties.length > 0) {
      this.coreImports.add('OptionalProps');
      const optionalPropertyNames = optionalProperties.map(prop => `'${prop.name}'`).sort();
      ret += `\n\n${' '.repeat(2)}[OptionalProps]?: ${optionalPropertyNames.join(' | ')};`;
    }
    ret += `${classBody}}\n`;
    const imports = [`import { ${([...this.coreImports].sort().join(', '))} } from '@mikro-orm/core';`];
    const entityImportExtension = this.esmImport ? '.js' : '';
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${entity} } from './${entity}${entityImportExtension}';`);
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

  protected quote(val: string) {
    /* istanbul ignore next */
    return val.startsWith(`'`) ? `\`${val}\`` : `'${val}'`;
  }

  protected getPropertyDefinition(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);

    if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
      this.coreImports.add('Collection');
      this.entityImports.add(prop.type);
      return `${padding}${prop.name} = new Collection<${prop.type}>(this);\n`;
    }

    // string defaults are usually things like SQL functions, but can be also enums, for that `useDefault` should be true
    const isEnumOrNonStringDefault = prop.enum || typeof prop.default !== 'string';
    const useDefault = prop.default != null && isEnumOrNonStringDefault;
    const optional = prop.nullable ? '?' : (useDefault ? '' : '!');

    if (prop.ref) {
      this.coreImports.add('Ref');
      this.entityImports.add(prop.type);
      return `${padding}${prop.name}${optional}: Ref<${prop.type}>;\n`;
    }

    const ret = `${prop.name}${optional}: ${prop.type}`;

    if (!useDefault) {
      return `${padding + ret};\n`;
    }

    if (prop.enum && typeof prop.default === 'string') {
      return `${padding}${ret} = ${prop.type}.${prop.default.toUpperCase()};\n`;
    }

    return `${padding}${ret} = ${prop.default};\n`;
  }

  protected getEnumClassDefinition(enumClassName: string, enumValues: string[], padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    let ret = `export enum ${enumClassName} {\n`;

    for (const enumValue of enumValues) {
      ret += `${padding}${enumValue.toUpperCase()} = '${enumValue}',\n`;
    }

    ret += '}\n';

    return ret;
  }

  private getCollectionDecl() {
    const options: EntityOptions<unknown> = {};

    if (this.meta.collection !== this.namingStrategy.classToTableName(this.meta.className)) {
      options.tableName = this.quote(this.meta.collection);
    }

    if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
      options.schema = this.quote(this.meta.schema);
    }

    if (!Utils.hasObjectKeys(options)) {
      return '';
    }

    return `{ ${Object.entries(options).map(([opt, val]) => `${opt}: ${val}`).join(', ')} }`;
  }

  private getPropertyDecorator(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    const options = {} as Dictionary;
    let decorator = this.getDecoratorType(prop);
    this.coreImports.add(decorator.substring(1));

    if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      this.getManyToManyDecoratorOptions(options, prop);
    } else if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      this.getOneToManyDecoratorOptions(options, prop);
    } else if (prop.kind !== ReferenceKind.SCALAR) {
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

  protected getPropertyIndexes(prop: EntityProperty, options: Dictionary): string[] {
    if (prop.kind === ReferenceKind.SCALAR) {
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
        unique: prop.kind === ReferenceKind.ONE_TO_ONE,
      };

      if (expected[type] && options[type] === 'true') {
        delete options[type];
      }
    };

    processIndex('index');
    processIndex('unique');

    return [];
  }

  protected getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (prop.nullable && !prop.mappedBy) {
      options.nullable = true;
    }

    if (prop.default == null) {
      return;
    }

    if (typeof prop.default !== 'string') {
      options.default = prop.default;
      return;
    }

    if ([`''`, ''].includes(prop.default)) {
      options.default = `''`;
    } else if (prop.defaultRaw === this.quote(prop.default)) {
      options.default = this.quote(prop.default);
    } else {
      options.defaultRaw = `\`${prop.default}\``;
    }
  }

  protected getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    let t = prop.type;

    if (t === 'Date') {
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
      options.columnType = this.quote(columnType2);
    }

    const assign = (key: keyof EntityProperty) => {
      if (prop[key] != null) {
        options[key] = prop[key];
      }
    };

    if (!(mappedType2 instanceof DateType) && !options.columnType) {
      assign('length');
    }

    // those are already included in the `columnType` in most cases, and when that option is present, they would be ignored anyway
    /* istanbul ignore next */
    if (mappedType2 instanceof DecimalType && !options.columnType) {
      assign('precision');
      assign('scale');
    }
  }

  protected getManyToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;

    if (prop.mappedBy) {
      options.mappedBy = this.quote(prop.mappedBy);
      return;
    }

    if (prop.pivotTable !== this.namingStrategy.joinTableName(this.meta.collection, prop.type, prop.name)) {
      options.pivotTable = this.quote(prop.pivotTable);
    }

    if (prop.joinColumns.length === 1) {
      options.joinColumn = this.quote(prop.joinColumns[0]);
    } else {
      options.joinColumns = `[${prop.joinColumns.map(this.quote).join(', ')}]`;
    }

    if (prop.inverseJoinColumns.length === 1) {
      options.inverseJoinColumn = this.quote(prop.inverseJoinColumns[0]);
    } else {
      options.inverseJoinColumns = `[${prop.inverseJoinColumns.map(this.quote).join(', ')}]`;
    }
  }

  protected getOneToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;
    options.mappedBy = this.quote(prop.mappedBy);
  }

  protected getForeignKeyDecoratorOptions(options: OneToOneOptions<any, any>, prop: EntityProperty) {
    const parts = prop.referencedTableName.split('.', 2);
    const className = this.namingStrategy.getClassName(parts.length > 1 ? parts[1] : parts[0], '_');
    this.entityImports.add(className);
    options.entity = `() => ${className}`;

    if (prop.ref) {
      options.ref = true;
    }

    if (prop.mappedBy) {
      options.mappedBy = this.quote(prop.mappedBy);
      return;
    }

    if (prop.fieldNames[0] !== this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[0])) {
      options.fieldName = this.quote(prop.fieldNames[0]);
    }

    if (!['no action', 'restrict'].includes(prop.updateRule!.toLowerCase())) {
      options.updateRule = this.quote(prop.updateRule!);
    }

    if (!['no action', 'restrict'].includes(prop.deleteRule!.toLowerCase())) {
      options.deleteRule = this.quote(prop.deleteRule!);
    }

    if (prop.primary) {
      options.primary = true;
    }
  }

  protected getDecoratorType(prop: EntityProperty): string {
    if (prop.kind === ReferenceKind.ONE_TO_ONE) {
      return '@OneToOne';
    }

    if (prop.kind === ReferenceKind.MANY_TO_ONE) {
      return '@ManyToOne';
    }

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      return '@OneToMany';
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      return '@ManyToMany';
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
