import {
  Cascade,
  DateType,
  DecimalType,
  type Dictionary,
  type EmbeddableOptions,
  type EntityMetadata,
  type EntityOptions,
  type EntityProperty,
  type GenerateOptions,
  type NamingStrategy,
  type OneToOneOptions,
  type Platform,
  ReferenceKind,
  UnknownType,
  Utils,
} from '@mikro-orm/core';

/**
 * @see https://github.com/tc39/proposal-regexp-unicode-property-escapes#other-examples
 */
const identifierRegex = /^(?:[$_\p{ID_Start}])(?:[$\u200C\u200D\p{ID_Continue}])*$/u;

export class SourceFile {

  protected readonly coreImports = new Set<string>();
  protected readonly entityImports = new Set<string>();

  constructor(
    protected readonly meta: EntityMetadata,
    protected readonly namingStrategy: NamingStrategy,
    protected readonly platform: Platform,
    protected readonly options: GenerateOptions,
  ) { }

  generate(): string {
    let ret = '';
    if (this.meta.embeddable) {
      this.coreImports.add('Embeddable');
      ret += `@Embeddable(${this.getEmbeddableDeclOptions()})\n`;
    } else {
      this.coreImports.add('Entity');
      ret += `@Entity(${this.getEntityDeclOptions()})\n`;
    }

    this.meta.indexes.forEach(index => {
      this.coreImports.add('Index');

      if (index.expression) {
        ret += `@Index({ name: '${index.name}', expression: ${this.quote(index.expression)} })\n`;
        return;
      }

      const properties = Utils.asArray(index.properties).map(prop => this.quote('' + prop));
      ret += `@Index({ name: '${index.name}', properties: [${properties.join(', ')}] })\n`;
    });

    this.meta.uniques.forEach(index => {
      this.coreImports.add('Unique');

      if (index.expression) {
        ret += `@Unique({ name: '${index.name}', expression: ${this.quote(index.expression)} })\n`;
        return;
      }

      const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
      ret += `@Unique({ name: '${index.name}', properties: [${properties.join(', ')}] })\n`;
    });

    ret += `export `;
    if (this.meta.abstract) {
      ret += `abstract `;
    }
    ret += `class ${this.meta.className}`;
    if (this.meta.extends) {
      this.entityImports.add(this.meta.extends);
      ret += ` extends ${this.meta.extends}`;
    }
    ret += ' {';
    const enumDefinitions: string[] = [];
    const eagerProperties: EntityProperty<any>[] = [];
    const hiddenProperties: EntityProperty<any>[] = [];
    const optionalProperties: EntityProperty<any>[] = [];
    const primaryProps: EntityProperty<any>[] = [];
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

      if (prop.eager) {
        eagerProperties.push(prop);
      }

      if (prop.hidden) {
        hiddenProperties.push(prop);
      }

      if (!prop.nullable && typeof prop.default !== 'undefined') {
          optionalProperties.push(prop);
      }

      if (prop.primary && (!['id', '_id', 'uuid'].includes(prop.name) || this.meta.compositePK)) {
        primaryProps.push(prop);
      }
    });

    if (primaryProps.length > 0) {
      this.coreImports.add('PrimaryKeyProp');
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        ret += `\n\n${' '.repeat(2)}[PrimaryKeyProp]?: [${primaryPropNames.join(', ')}];`;
      } else {
        ret += `\n\n${' '.repeat(2)}[PrimaryKeyProp]?: ${primaryPropNames[0]};`;
      }
    }

    if (eagerProperties.length > 0) {
      this.coreImports.add('EagerProps');
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      ret += `\n\n${' '.repeat(2)}[EagerProps]?: ${eagerPropertyNames.join(' | ')};`;
    }

    if (hiddenProperties.length > 0) {
      this.coreImports.add('HiddenProps');
      const hiddenPropertyNames = hiddenProperties.map(prop => `'${prop.name}'`).sort();
      ret += `\n\n${' '.repeat(2)}[HiddenProps]?: ${hiddenPropertyNames.join(' | ')};`;
    }

    if (optionalProperties.length > 0) {
      this.coreImports.add('OptionalProps');
      const optionalPropertyNames = optionalProperties.map(prop => `'${prop.name}'`).sort();
      ret += `\n\n${' '.repeat(2)}[OptionalProps]?: ${optionalPropertyNames.join(' | ')};`;
    }

    ret += `${classBody}}\n`;
    const imports = [`import { ${([...this.coreImports].sort().join(', '))} } from '@mikro-orm/core';`];
    const entityImportExtension = this.options.esmImport ? '.js' : '';
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${entity} } from './${this.options.fileName!(entity)}${entityImportExtension}';`);
    });

    ret = `${imports.join('\n')}\n\n${ret}`;
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    return ret;
  }

  getBaseName(extension = '.ts') {
    return `${this.options.fileName!(this.meta.className)}${extension}`;
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

    let ret = `${prop.name}${optional}: ${prop.type}`;

    if (prop.kind === ReferenceKind.EMBEDDED && prop.array) {
      ret += '[]';
    }

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

  protected serializeObject(options: {}, spaces?: number): string {
    const sep = typeof spaces === 'undefined' ? ', ' : `,\n${' '.repeat(spaces)}`;
    const doIndent = typeof spaces !== 'undefined';
    if (Array.isArray(options)) {
      return `[${doIndent ? `\n${' '.repeat(spaces)}` : ''}${options.map(val => `${doIndent ? ' '.repeat(spaces) : ''}${this.serializeValue(val, doIndent ? spaces + 2 : undefined)}`).join(sep)}${doIndent ? `\n${' '.repeat(spaces + 2)}` : ''}]`;
    }
    return `{${doIndent ? `\n${' '.repeat(spaces)}` : ' '}${Object.entries(options).map(
      ([opt, val]) => {
        return `${doIndent ? ' '.repeat(spaces + 2) : ''}${identifierRegex.test(opt) ? opt : JSON.stringify(opt)}: ${this.serializeValue(val, doIndent ? spaces + 2 : undefined)}`;
      },
    ).join(sep) }${doIndent ? `,\n${' '.repeat(spaces + 2)}` : ' '}}`;
  }

  protected serializeValue(val: unknown, spaces?: number) {
    if (typeof val === 'object' && val !== null) {
      return this.serializeObject(val, spaces);
    }
    return val;
  }

  private getEntityDeclOptions() {
    const options: EntityOptions<unknown> = {};

    if (this.meta.collection !== this.namingStrategy.classToTableName(this.meta.className)) {
      options.tableName = this.quote(this.meta.collection);
    }

    if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
      options.schema = this.quote(this.meta.schema);
    }

    if (typeof this.meta.expression === 'string') {
      options.expression = this.meta.expression;
    }

    if (this.meta.comment) {
      options.comment = this.meta.comment;
    }

    if (this.meta.readonly && !this.meta.virtual) {
      options.readonly = this.meta.readonly;
    }
    if (this.meta.virtual) {
      options.virtual = this.meta.virtual;
    }

    return this.getCollectionDecl(options);
  }

  private getEmbeddableDeclOptions() {
    const options: EmbeddableOptions = {};
    return this.getCollectionDecl(options);
  }

  private getCollectionDecl(options: EntityOptions<unknown> | EmbeddableOptions) {
    if (this.meta.abstract) {
      options.abstract = true;
    }

    if (this.meta.discriminatorValue) {
      options.discriminatorValue = typeof this.meta.discriminatorValue === 'string' ? this.quote(this.meta.discriminatorValue) : this.meta.discriminatorValue;
    }

    if (this.meta.discriminatorColumn) {
      options.discriminatorColumn = this.quote(this.meta.discriminatorColumn);
    }

    if (this.meta.discriminatorMap) {
      options.discriminatorMap = this.meta.discriminatorMap;
    }

    if (!Utils.hasObjectKeys(options)) {
      return '';
    }

    return this.serializeObject(options);
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
    } else if (prop.kind === ReferenceKind.SCALAR || typeof prop.kind === 'undefined') {
      this.getScalarPropertyDecoratorOptions(options, prop);
    } else if (prop.kind === ReferenceKind.EMBEDDED) {
      this.getEmbeddedPropertyDeclarationOptions(options, prop);
    } else {
      this.getForeignKeyDecoratorOptions(options, prop);
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

    return `${decorator}(${this.serializeObject(options)})\n`;
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
    if (this.options.scalarTypeInDecorator && prop.kind === ReferenceKind.SCALAR && !prop.enum) {
      options.type = this.quote(prop.type);
    }

    if (prop.nullable && !prop.mappedBy) {
      options.nullable = true;
    }

    if (prop.persist === false) {
      options.persist = false;
    }

    (['hidden', 'version', 'concurrencyCheck', 'eager', 'lazy', 'orphanRemoval'] as const)
      .filter(key => prop[key])
      .forEach(key => options[key] = true);

    if (prop.cascade && (prop.cascade.length !== 1 || prop.cascade[0] !== Cascade.PERSIST)) {
      this.coreImports.add('Cascade');
      options.cascade = `[${prop.cascade.map(value => 'Cascade.' + value.toUpperCase()).join(', ')}]`;
    }

    if (typeof prop.comment === 'string') {
      options.comment = prop.comment;
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
    if (prop.autoincrement) {
      if (!prop.primary || !['number', 'bigint'].includes(t) || this.meta.getPrimaryProps().length !== 1) {
        options.autoincrement = true;
      }
    } else {
      if (prop.primary && ['number', 'bigint'].includes(t) && this.meta.getPrimaryProps().length === 1) {
        options.autoincrement = false;
      }
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

    if (prop.pivotEntity && prop.pivotEntity !== prop.pivotTable) {
      this.entityImports.add(prop.pivotEntity);
      options.pivotEntity = `() => ${prop.pivotEntity}`;
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

    if (prop.fixedOrder) {
      options.fixedOrder = true;
      if (prop.fixedOrderColumn && prop.fixedOrderColumn !== this.namingStrategy.referenceColumnName()) {
        options.fixedOrderColumn = this.quote(prop.fixedOrderColumn);
      }
    }
  }

  protected getOneToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;
    options.mappedBy = this.quote(prop.mappedBy);
  }

  protected getEmbeddedPropertyDeclarationOptions(options: Dictionary, prop: EntityProperty) {
    this.coreImports.add('Embedded');
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;

    if (prop.array) {
      options.array = true;
    }

    if (prop.object) {
      options.object = true;
    }

    if (prop.prefix === false || typeof prop.prefix === 'string') {
      options.prefix = prop.prefix;
    }
  }

  protected getForeignKeyDecoratorOptions(options: OneToOneOptions<any, any>, prop: EntityProperty) {
    const parts = prop.referencedTableName.split('.', 2);
    const className = this.namingStrategy.getEntityName(...parts.reverse() as [string, string]);
    this.entityImports.add(className);
    options.entity = `() => ${className}`;

    if (prop.ref) {
      options.ref = true;
    }

    if (prop.mappedBy) {
      options.mappedBy = this.quote(prop.mappedBy);
      return;
    }

    if (prop.fieldNames.length === 1) {
      if (prop.fieldNames[0] !== this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[0])) {
        options.fieldName = this.quote(prop.fieldNames[0]);
      }
    } else {
      if (prop.fieldNames.length > 1 && prop.fieldNames.some((fieldName, i) => fieldName !== this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[i]))) {
        options.fieldNames = prop.fieldNames.map(fieldName => this.quote(fieldName));
      }
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

    if (prop.kind === ReferenceKind.EMBEDDED) {
      return '@Embedded';
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
