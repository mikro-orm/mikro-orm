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
  type TypeConfig,
  UnknownType,
  Utils,
} from '@mikro-orm/core';
import { ESCAPE_PREFIX, POSSIBLE_TYPE_IMPORTS, POSSIBLY_GENERATED_CORE_IMPORTS, RESOLVE_PREFIX } from './CoreImportsHelper';

/**
 * @see https://github.com/tc39/proposal-regexp-unicode-property-escapes#other-examples
 */
const identifierRegex = /^(?:[$_\p{ID_Start}])(?:[$\u200C\u200D\p{ID_Continue}])*$/u;

/**
 * It is possible that an entity is called something that starts with the resolve prefix,
 * thus causing conflicts in other files that may both import the entity and have their own conflicts.
 * So to ensure they are covered, such entities are also tagged for checks.
 */
const resolvePrefixRegex = new RegExp(`^(?:${RESOLVE_PREFIX})+`, 'g');

export class SourceFile {

  protected readonly coreImports = new Set<string>();
  protected readonly entityImports = new Set<string>();
  private _hasPotentialCoreConflict = false;

  constructor(
    protected readonly meta: EntityMetadata,
    protected readonly namingStrategy: NamingStrategy,
    protected readonly platform: Platform,
    protected readonly options: GenerateOptions,
  ) { }

  generate(): string {
    let ret = '';
    if (this.meta.embeddable || this.meta.collection) {
      if (this.meta.embeddable) {
        this.coreImports.add('Embeddable');
        ret += `@Embeddable(${this.getEmbeddableDeclOptions()})\n`;
      } else {
        this.coreImports.add('Entity');
        ret += `@Entity(${this.getEntityDeclOptions()})\n`;
      }
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

    let classHead = '';
    if (this.meta.className === this.options.customBaseEntityName) {
      this.coreImports.add('Config');
      this.coreImports.add('DefineConfig');
      const defineConfigTypeSettings: TypeConfig = {};
      defineConfigTypeSettings.forceObject = this.platform.getConfig().get('serialization').forceObject ?? false;
      classHead += `\n${' '.repeat(2)}[Config]?: DefineConfig<${this.serializeObject(defineConfigTypeSettings)}>;\n\n`;
    }

    const enumDefinitions: string[] = [];
    const eagerProperties: EntityProperty<any>[] = [];
    const primaryProps: EntityProperty<any>[] = [];
    let classBody = '';
    Object.values(this.meta.properties).forEach(prop => {
      const decorator = this.getPropertyDecorator(prop, 2);
      const definition = this.getPropertyDefinition(prop, 2);

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

      if (prop.primary && (!['id', '_id', 'uuid'].includes(prop.name) || this.meta.compositePK)) {
        primaryProps.push(prop);
      }
    });

    if (primaryProps.length > 0) {
      this.coreImports.add('PrimaryKeyProp');
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        classHead += `\n${' '.repeat(2)}[PrimaryKeyProp]?: [${primaryPropNames.join(', ')}];\n`;
      } else {
        classHead += `\n${' '.repeat(2)}[PrimaryKeyProp]?: ${primaryPropNames[0]};\n`;
      }
    }

    if (eagerProperties.length > 0) {
      this.coreImports.add('EagerProps');
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      classHead += `\n${' '.repeat(2)}[EagerProps]?: ${eagerPropertyNames.join(' | ')};\n`;
    }

    ret += this.getEntityClass(classBody ? `${classHead}\n${classBody}` : classHead);
    ret = `${this.generateImports()}\n\n${ret}`;
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    return ret;
  }

  protected generateImports() {
    const imports = [];
    if (this.coreImports.size > 0) {
      imports.push(`import { ${([...this.coreImports].sort().map(t => POSSIBLE_TYPE_IMPORTS.includes(t as typeof POSSIBLE_TYPE_IMPORTS[number]) ? `type ${t}` : t).join(', '))} } from '@mikro-orm/core';`);
    }
    const entityImportExtension = this.options.esmImport ? '.js' : '';
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${this.getValidIdentifierName(entity)} } from './${this.options.fileName!(entity)}${entityImportExtension}';`);
    });
    return imports.join('\n');
  }

  protected getEntityClass(classBody: string) {
    let ret = `export `;
    if (this.meta.abstract) {
      ret += `abstract `;
    }
    ret += `class ${this.getValidIdentifierName(this.meta.className)}`;
    if (this.meta.extends) {
      ret += ` extends ${this.refEntityImport(this.meta.extends)}`;
    } else if (this.options.useCoreBaseEntity) {
        this.coreImports.add('BaseEntity');
        ret += ` extends BaseEntity`;
    }
    ret += ` {\n${classBody}}\n`;
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

    let hiddenType = '';
    if (prop.hidden) {
      this.coreImports.add('Hidden');
      hiddenType += ' & Hidden';
    }

    if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
      this.coreImports.add('Collection');
      return `${padding}${prop.name}${hiddenType ? `: Collection<${this.refEntityImport(prop.type)}>${hiddenType}` : ''} = new Collection<${this.refEntityImport(prop.type)}>(this);\n`;
    }

    let propType = prop.mapToPk
      ? (() => {
          const runtimeTypes = prop.columnTypes.map(t => this.platform.getMappedType(t).runtimeType);
          return runtimeTypes.length === 1 ? runtimeTypes[0] : this.serializeObject(runtimeTypes);
        })()
      : prop.type;

    const useDefault = prop.default != null;
    const optional = prop.nullable ? '?' : (useDefault ? '' : '!');

    if (!prop.mapToPk && typeof prop.kind === 'string' && prop.kind !== ReferenceKind.SCALAR) {
      propType = this.refEntityImport(propType);
    }

    if (prop.ref) {
      this.coreImports.add('Ref');
      return `${padding}${prop.name}${optional}: Ref<${propType}>${hiddenType};\n`;
    }

    let ret = `${prop.name}${optional}: ${propType}`;

    if (prop.kind === ReferenceKind.EMBEDDED && prop.array) {
      ret += '[]';
    }
    ret += hiddenType;

    if (useDefault || (prop.optional && !prop.nullable)) {
      this.coreImports.add('Opt');
      ret += ' & Opt';
    }

    if (!useDefault) {
      return `${padding}${ret};\n`;
    }

    if (prop.enum && typeof prop.default === 'string') {
      return `${padding}${ret} = ${propType}.${prop.default.toUpperCase()};\n`;
    }

    return `${padding}${ret} = ${propType === 'string' ? this.quote('' + prop.default) : prop.default};\n`;
  }

  protected getEnumClassDefinition(enumClassName: string, enumValues: string[], padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    let ret = `export enum ${this.getValidIdentifierName(enumClassName)} {\n`;

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
      options.expression = this.quote(this.meta.expression);
    } else if (typeof this.meta.expression === 'function') {
      options.expression = `${this.meta.expression}`;
    }

    if (this.meta.comment) {
      options.comment = this.quote(this.meta.comment);
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
      options.discriminatorMap = Object.fromEntries(Object.entries(this.meta.discriminatorMap)
        .map(([discriminatorValue, className]) => [discriminatorValue, this.quote(className)]));
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
      options.items = `() => ${this.getValidIdentifierName(prop.type)}`;
    }

    this.getCommonDecoratorOptions(options, prop);
    const indexes = this.getPropertyIndexes(prop, options);
    decorator = [...indexes.sort(), decorator].map(d => padding + d).join('\n');

    const decoratorArgs = [];
    if (prop.formula) {
      decoratorArgs.push(`${prop.formula}`);
    }
    if (Utils.hasObjectKeys(options)) {
      decoratorArgs.push(`${this.serializeObject(options)}`);
    }

    return `${decorator}(${decoratorArgs.join(', ')})\n`;
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

    (['persist', 'hydrate', 'trackChanges'] as const)
      .filter(key => prop[key] === false)
      .forEach(key => options[key] = false);

    (['onCreate', 'onUpdate', 'serializer'] as const)
      .filter(key => typeof prop[key] === 'function')
      .forEach(key => options[key] = `${prop[key]}`);

    if (typeof prop.serializedName === 'string') {
      options.serializedName = this.quote(prop.serializedName);
    }

    (['hidden', 'version', 'concurrencyCheck', 'eager', 'lazy', 'orphanRemoval'] as const)
      .filter(key => prop[key])
      .forEach(key => options[key] = true);

    if (prop.cascade && (prop.cascade.length !== 1 || prop.cascade[0] !== Cascade.PERSIST)) {
      this.coreImports.add('Cascade');
      options.cascade = `[${prop.cascade.map(value => 'Cascade.' + value.toUpperCase()).join(', ')}]`;
    }

    if (typeof prop.comment === 'string') {
      options.comment = this.quote(prop.comment);
    }

    if (typeof prop.defaultRaw !== 'undefined' && prop.defaultRaw !== 'null' &&
      prop.defaultRaw !== (typeof prop.default === 'string' ? this.quote(prop.default) : `${prop.default}`)
    ) {
      options.defaultRaw = `\`${prop.defaultRaw}\``;
    } else if (prop.ref && prop.default != null) {
      options.default = typeof prop.default === 'string' ? this.quote(prop.default) : prop.default;
    }
  }

  protected getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    // For enum properties, we don't need a column type
    // or the property length or other information in the decorator.
    // Non-persistent properties also don't need any of that additional information.
    if (prop.enum || !prop.persist) {
      return;
    }

    // Type option is added not only with the scalarTypeInDecorator option,
    // but also when there are prop type modifiers, because reflect-metadata can't extract the base.
    if (this.options.scalarTypeInDecorator || prop.hidden || (prop.optional && (!prop.nullable || prop.default != null))) {
      options.type = this.quote(prop.type);
    }

    const mappedTypeFromPropType = this.platform.getMappedType(prop.type === 'Date' ? 'datetime' : prop.type);
    const mappedTypeFromColumnType = this.platform.getMappedType(prop.columnTypes[0]);
    const columnTypeFromMappedPropType = mappedTypeFromPropType.getColumnType(
      { ...prop, autoincrement: false },
      this.platform,
    );
    const columnTypeFromMappedColumnType = mappedTypeFromColumnType.getColumnType(
      { ...prop, autoincrement: false },
      this.platform,
    );

    if (
      columnTypeFromMappedPropType !== columnTypeFromMappedColumnType
      || [mappedTypeFromPropType, mappedTypeFromColumnType].some(t => t instanceof UnknownType)
    ) {
      options.columnType = this.quote(columnTypeFromMappedColumnType);
    }

    const assign = (key: keyof EntityProperty) => {
      if (prop[key] != null) {
        options[key] = prop[key];
      }
    };

    if (!(mappedTypeFromColumnType instanceof DateType) && !options.columnType) {
      assign('length');
    }

    // those are already included in the `columnType` in most cases, and when that option is present, they would be ignored anyway
    /* istanbul ignore next */
    if (mappedTypeFromColumnType instanceof DecimalType && !options.columnType) {
      assign('precision');
      assign('scale');
    }

    if (this.platform.supportsUnsigned() &&
      (
        (!prop.primary && prop.unsigned) ||
        (prop.primary && !prop.unsigned && this.platform.isNumericColumn(mappedTypeFromColumnType))
      )
    ) {
      assign('unsigned');
    }

    if (prop.autoincrement) {
      if (!prop.primary || !this.platform.isNumericColumn(mappedTypeFromColumnType) || this.meta.getPrimaryProps().length !== 1) {
        options.autoincrement = true;
      }
    } else {
      if (prop.primary && this.platform.isNumericColumn(mappedTypeFromColumnType) && this.meta.getPrimaryProps().length === 1) {
        options.autoincrement = false;
      }
    }

    if (prop.generated) {
      options.generated = typeof prop.generated === 'string' ? this.quote(prop.generated) : `${prop.generated}`;
    }
  }

  protected getManyToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    options.entity = `() => ${this.refEntityImport(prop.type)}`;

    if (prop.mappedBy) {
      options.mappedBy = this.quote(`${prop.mappedBy}`);
      return;
    }

    if (prop.pivotTable !== this.namingStrategy.joinTableName(this.meta.collection, prop.type, prop.name)) {
      options.pivotTable = this.quote(prop.pivotTable);
    }

    if (prop.pivotEntity && prop.pivotEntity !== prop.pivotTable) {
      options.pivotEntity = `() => ${this.refEntityImport(prop.pivotEntity)}`;
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
    options.entity = `() => ${this.refEntityImport(prop.type)}`;
    options.mappedBy = this.quote(prop.mappedBy);
  }

  protected getEmbeddedPropertyDeclarationOptions(options: Dictionary, prop: EntityProperty) {
    options.entity = `() => ${this.refEntityImport(prop.type)}`;

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
    options.entity = `() => ${this.refEntityImport(prop.type)}`;

    if (prop.ref) {
      options.ref = true;
    }

    if (prop.mapToPk) {
      options.mapToPk = true;
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

    if (prop.generated) {
      options.generated = typeof prop.generated === 'string' ? this.quote(prop.generated) : `${prop.generated}`;
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

    if (prop.formula) {
      return '@Formula';
    }

    return '@Property';
  }

  protected refEntityImport(type: string) {
    this.entityImports.add(type);
    return this.getValidIdentifierName(type);
  }

  protected getValidIdentifierName(type: string) {
    if (POSSIBLY_GENERATED_CORE_IMPORTS.includes(type.replaceAll(resolvePrefixRegex, '')) || type.startsWith(ESCAPE_PREFIX)) {
      this._hasPotentialCoreConflict = true;
      return `${ESCAPE_PREFIX}${type}`;
    }
    return type;
  }

  get hasPotentialCoreConflict(): boolean {
    return this._hasPotentialCoreConflict;
  }

}
