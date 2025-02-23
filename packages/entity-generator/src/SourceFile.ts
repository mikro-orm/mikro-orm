import {
  Cascade,
  Config,
  DecimalType,
  type DeferMode,
  type Dictionary,
  type EmbeddableOptions,
  type EntityMetadata,
  type EntityOptions,
  type EntityProperty,
  type GenerateOptions,
  type IndexOptions,
  type NamingStrategy,
  type OneToOneOptions,
  type Platform,
  ReferenceKind,
  SCALAR_TYPES,
  type TypeConfig,
  type UniqueOptions,
  UnknownType,
  Utils,
} from '@mikro-orm/core';
import { parse, relative } from 'node:path';
import { inspect } from 'node:util';
import { POSSIBLE_TYPE_IMPORTS } from './CoreImportsHelper.js';

/**
 * @see https://github.com/tc39/proposal-regexp-unicode-property-escapes#other-examples
 */
export const identifierRegex = /^(?:[$_\p{ID_Start}])(?:[$\u200C\u200D\p{ID_Continue}])*$/u;

const primitivesAndLibs = [...SCALAR_TYPES, 'bigint', 'Uint8Array', 'unknown', 'object', 'any'];

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
    if (this.meta.embeddable || this.meta.collection) {
      if (this.meta.embeddable) {
        const options = this.getEmbeddableDeclOptions();
        ret += `@${this.referenceCoreImport('Embeddable')}(${Utils.hasObjectKeys(options) ? this.serializeObject(options) : ''})\n`;
      } else {
        const options = this.getEntityDeclOptions();
        ret += `@${this.referenceCoreImport('Entity')}(${Utils.hasObjectKeys(options) ? this.serializeObject(options) : ''})\n`;
      }
    }

    for (const index of this.meta.indexes) {
      if (index.properties?.length === 1 && typeof this.meta.properties[index.properties[0]] !== 'undefined') {
        continue;
      }
      ret += `@${this.referenceCoreImport('Index')}(${this.serializeObject(this.getIndexOptions(index))})\n`;
    }

    for (const index of this.meta.uniques) {
      if (index.properties?.length === 1 && typeof this.meta.properties[index.properties[0]] !== 'undefined') {
        continue;
      }
      ret += `@${this.referenceCoreImport('Unique')}(${this.serializeObject(this.getUniqueOptions(index))})\n`;
    }

    let classHead = '';
    if (this.meta.className === this.options.customBaseEntityName) {
      const defineConfigTypeSettings: TypeConfig = {};
      defineConfigTypeSettings.forceObject = this.platform.getConfig().get('serialization').forceObject ?? false;
      classHead += `\n${' '.repeat(2)}[${this.referenceCoreImport('Config')}]?: ${this.referenceCoreImport('DefineConfig')}<${this.serializeObject(defineConfigTypeSettings)}>;\n\n`;
    }

    if (this.meta.repositoryClass) {
      this.entityImports.add(this.meta.repositoryClass);
      classHead += `\n${' '.repeat(2)}[${this.referenceCoreImport('EntityRepositoryType')}]?: ${this.meta.repositoryClass};\n`;
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
        enumDefinitions.push(this.getEnumClassDefinition(prop, 2));
      }

      if (prop.eager) {
        eagerProperties.push(prop);
      }

      if (prop.primary && (!['id', '_id', 'uuid'].includes(prop.name) || this.meta.compositePK)) {
        primaryProps.push(prop);
      }
    });

    if (primaryProps.length > 0) {
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        classHead += `\n${' '.repeat(2)}[${this.referenceCoreImport('PrimaryKeyProp')}]?: [${primaryPropNames.join(', ')}];\n`;
      } else {
        classHead += `\n${' '.repeat(2)}[${this.referenceCoreImport('PrimaryKeyProp')}]?: ${primaryPropNames[0]};\n`;
      }
    }

    if (eagerProperties.length > 0) {
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      classHead += `\n${' '.repeat(2)}[${this.referenceCoreImport('EagerProps')}]?: ${eagerPropertyNames.join(' | ')};\n`;
    }

    ret += this.getEntityClass(classBody ? `${classHead}\n${classBody}` : classHead);
    ret = `${this.generateImports()}\n\n${ret}`;
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    return ret;
  }

  protected getIndexOptions(index: EntityMetadata['indexes'][number], isAtEntityLevel = true) {
    const indexOpt: IndexOptions<Dictionary> = {};

    if (typeof index.name === 'string') {
      indexOpt.name = this.quote(index.name);
    }

    if (index.expression) {
      indexOpt.expression = this.quote(index.expression);
    }

    if (isAtEntityLevel && index.properties) {
      indexOpt.properties = Utils.asArray(index.properties).map(prop => this.quote('' + prop)) as never[];
    }

    return indexOpt;
  }

  protected getUniqueOptions(index: EntityMetadata['uniques'][number], isAtEntityLevel = true) {
    const uniqueOpt: UniqueOptions<Dictionary> = {};

    if (typeof index.name === 'string') {
      uniqueOpt.name = this.quote(index.name);
    }

    if (index.expression) {
      uniqueOpt.expression = this.quote(index.expression);
    }

    if (isAtEntityLevel && index.properties) {
      uniqueOpt.properties = Utils.asArray(index.properties).map(prop => this.quote('' + prop)) as never[];
    }

    if (index.deferMode) {
      uniqueOpt.deferMode = `${this.referenceCoreImport('DeferMode')}.INITIALLY_${index.deferMode.toUpperCase()}` as DeferMode;
    }

    return uniqueOpt;
  }

  protected generateImports() {
    const imports = new Set<string>();
    if (this.coreImports.size > 0) {
      imports.add(`import { ${([...this.coreImports].sort().map(t => {
        let ret = POSSIBLE_TYPE_IMPORTS.includes(t as typeof POSSIBLE_TYPE_IMPORTS[number]) ? `type ${t}` : t;
        if (this.options.coreImportsPrefix) {
          const resolvedIdentifier = `${this.options.coreImportsPrefix}${t}`;
          ret += ` as ${resolvedIdentifier}`;
        }
        return ret;
      }).join(', ')) } } from '@mikro-orm/core';`);
    }
    const extension = this.options.esmImport ? '.js' : '';
    const { dir, base } = parse(`${this.options.path ?? '.'}/${this.getBaseName()}`);
    const basePath = relative(dir, this.options.path ?? '.') || '.';
    (this.options.extraImports?.(basePath, base) ?? []).forEach(v => this.entityImports.add(v));
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      const file = this.options.onImport?.(entity, basePath, extension, base) ?? {
        path: `${basePath}/${this.options.fileName!(entity)}${extension}`,
        name: entity,
      };
      if (file.path === '') {
        if (file.name === '') {
          return;
        }
        imports.add(`import ${this.quote(file.name)};`);
        return;
      }
      if (file.name === '') {
        imports.add(`import * as ${entity} from ${this.quote(file.path)};`);
        return;
      }
      if (file.name === 'default') {
        imports.add(`import ${entity} from ${this.quote(file.path)};`);
        return;
      }
      if (file.name === entity) {
        imports.add(`import { ${entity} } from ${this.quote(file.path)};`);
        return;
      }
      imports.add(`import { ${identifierRegex.test(file.name) ? file.name : this.quote(file.name)} as ${entity} } from ${this.quote(file.path)};`);
    });
    return Array.from(imports.values()).join('\n');
  }

  protected getEntityClass(classBody: string) {
    let ret = `export `;
    if (this.meta.abstract) {
      ret += `abstract `;
    }
    ret += `class ${this.meta.className}`;
    if (this.meta.extends) {
      this.entityImports.add(this.meta.extends);
      ret += ` extends ${this.meta.extends}`;
    } else if (this.options.useCoreBaseEntity) {
      ret += ` extends ${this.referenceCoreImport('BaseEntity')}`;
    }
    ret += ` {\n${classBody}}\n`;
    return ret;
  }

  getBaseName(extension = '.ts') {
    return `${this.options.fileName!(this.meta.className)}${extension}`;
  }

  protected quote(val: string) {
    const backtick = val.startsWith(`'`) || val.includes('\n');
    /* v8 ignore next */
    return backtick ? `\`${val.replaceAll('`', '\\``')}\`` : `'${val.replaceAll(`'`, `\\'`)}'`;
  }

  protected getPropertyDefinition(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);

    const propName = identifierRegex.test(prop.name) ? prop.name : this.quote(prop.name);

    let hiddenType = '';
    if (prop.hidden) {
      hiddenType += ` & ${this.referenceCoreImport('Hidden')}`;
    }

    if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
      return `${padding}${propName}${hiddenType ? `: ${this.referenceCoreImport('Collection')}<${prop.type}>${hiddenType}` : ''} = new ${this.referenceCoreImport('Collection')}<${prop.type}>(this);\n`;
    }

    const isScalar = typeof prop.kind === 'undefined' || prop.kind === ReferenceKind.SCALAR;
    let breakdownOfIType: ReturnType<SourceFile['breakdownOfIType']>;
    const propType = prop.mapToPk
      ? (() => {
          const runtimeTypes = prop.columnTypes.map((t, i) => (prop.customTypes?.[i] ?? this.platform.getMappedType(t)).runtimeType);
          return runtimeTypes.length === 1 ? runtimeTypes[0] : this.serializeObject(runtimeTypes);
        })()
      : (() => {
          if (isScalar) {
            if (prop.enum) {
              return prop.runtimeType;
            }

            breakdownOfIType = this.breakdownOfIType(prop);

            if (typeof breakdownOfIType !== 'undefined') {
              if (breakdownOfIType.length >= 3) {
                hiddenType = '';
              }
              return `${this.referenceCoreImport('IType')}<${breakdownOfIType.join(', ')}>`;
            }

            return prop.runtimeType;
          }

          return prop.type;
        })();

    const hasUsableNullDefault = (prop.nullable && !this.options.forceUndefined && prop.default === null);
    const useDefault = hasUsableNullDefault || (!(typeof prop.default === 'undefined' || prop.default === null) && propType !== 'unknown' && typeof breakdownOfIType === 'undefined');
    const optional = (prop.nullable && (this.options.forceUndefined || prop.optional)) ? '?' : (useDefault ? '' : '!');

    let ret = `${propName}${optional}: `;
    const isArray = prop.array && (prop.kind === ReferenceKind.EMBEDDED || prop.enum);
    const complexType = isArray ? `${propType}[]` : propType;
    let wrappedType = prop.ref
      ? `${this.referenceCoreImport('Ref')}<${complexType}${(isScalar && prop.nullable && !this.options.forceUndefined) ? ' | null' : ''}>`
      : ((this.options.esmImport && !isScalar) ? `${this.referenceCoreImport('Rel')}<${complexType}>` : complexType);

    if (prop.nullable && !this.options.forceUndefined && (!isScalar || (!prop.ref && !wrappedType.includes(' | null')))) {
      wrappedType += ' | null';
    }

    const optionalType = (optional !== '?' && prop.optional)
      ? ` & ${this.referenceCoreImport('Opt')}`
      : '';

    ret += (!this.options.forceUndefined && prop.nullable && (hiddenType || optionalType)) ? `(${wrappedType})` : wrappedType;
    ret += hiddenType;
    ret += optionalType;

    if (!useDefault) {
      return `${padding}${ret};\n`;
    }

    if (prop.enum && typeof prop.default === 'string') {
      const enumVal = this.namingStrategy.enumValueToEnumProperty(prop.default, prop.fieldNames[0], this.meta.collection, this.meta.schema);
      return `${padding}${ret} = ${propType}${identifierRegex.test(enumVal) ? `.${enumVal}` : `[${this.quote(enumVal)}]`};\n`;
    }

    if (prop.fieldNames?.length > 1) {
      // TODO: Composite FKs with default values require additions to default/defaultRaw that are not yet supported.
      return `${padding}${ret};\n`;
    }

    const defaultVal = typeof prop.default === 'string' ? this.quote(prop.default) : prop.default;
    if (isScalar) {
      return `${padding}${ret} = ${prop.ref ? `${this.referenceCoreImport('ref')}(${defaultVal})` : defaultVal};\n`;
    }

    if (hasUsableNullDefault) {
      return `${padding}${ret} = null;\n`;
    }

    return `${padding}${ret} = ${prop.ref ? this.referenceCoreImport('ref') : this.referenceCoreImport('rel')}(${propType}, ${defaultVal});\n`;
  }

  protected getEnumClassDefinition(prop: EntityProperty, padLeft: number): string {
    const enumClassName = this.namingStrategy.getEnumClassName(prop.fieldNames[0], this.meta.collection, this.meta.schema);
    const padding = ' '.repeat(padLeft);
    let ret = `export enum ${enumClassName} {\n`;

    const enumValues = prop.items as string[];
    for (const enumValue of enumValues) {
      const enumName = this.namingStrategy.enumValueToEnumProperty(enumValue, prop.fieldNames[0], this.meta.collection, this.meta.schema);
      ret += `${padding}${identifierRegex.test(enumName) ? enumName : this.quote(enumName)} = ${this.quote(enumValue)},\n`;
    }

    ret += '}\n';

    return ret;
  }

  protected serializeObject(options: {}, wordwrap?: number, spaces?: number, level = 0): string {
    if (typeof wordwrap === 'number' && !Object.hasOwn(options, Config)) {
      const res = this.serializeObject(options, undefined, undefined, level);
      if (res.length <= wordwrap) {
        return res;
      }
    }
    const nextWordwrap = typeof wordwrap === 'number' ? 80 - (spaces ?? 0) - (level * 2) : undefined;
    const sep = typeof spaces === 'undefined' ? ', ' : `,\n${' '.repeat(spaces)}`;
    const doIndent = typeof spaces !== 'undefined';
    if (Array.isArray(options)) {
      return `[${doIndent ? `\n${' '.repeat(spaces)}` : ''}${options.map(val => `${doIndent ? ' '.repeat((level * 2) + (spaces + 2)) : ''}${this.serializeValue(val, typeof nextWordwrap === 'number' ? nextWordwrap : undefined, doIndent ? spaces : undefined, level + 1)}`).join(sep)}${doIndent ? `${options.length > 0 ? ',\n' : ''}${' '.repeat(spaces + (level * 2))}` : ''}]`;
    }
    const entries = Object.entries(options);
    return `{${doIndent ? `\n${' '.repeat(spaces)}` : ' '}${entries.map(
      ([opt, val]) => {
        const key = identifierRegex.test(opt) ? opt : this.quote(opt);
        return `${doIndent ? ' '.repeat((level * 2) + (spaces + 2)) : ''}${key}: ${this.serializeValue(val, typeof nextWordwrap === 'number' ? nextWordwrap - key.length - 2/* ': '.length*/ : undefined, doIndent ? spaces : undefined, level + 1)}`;
      },
    ).join(sep) }${doIndent ? `${entries.length > 0 ? ',\n' : ''}${' '.repeat(spaces + (level * 2))}` : ' '}}`;
  }

  protected serializeValue(val: unknown, wordwrap?: number, spaces?: number, level = 1) {
    if (typeof val === 'object' && val !== null) {
      return this.serializeObject(val, wordwrap, spaces, level);
    }
    return val;
  }

  protected getEntityDeclOptions() {
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

    if (this.meta.repositoryClass) {
      this.entityImports.add(this.meta.repositoryClass);
      options.repository = `() => ${this.meta.repositoryClass}` as unknown as typeof options.repository;
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

  protected getEmbeddableDeclOptions() {
    const options: EmbeddableOptions<unknown> = {};
    return this.getCollectionDecl(options);
  }

  private getCollectionDecl<T extends EntityOptions<unknown> | EmbeddableOptions<unknown>>(options: T) {
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

    return options;
  }

  private getPropertyDecorator(prop: EntityProperty, padLeft: number): string {
    const padding = ' '.repeat(padLeft);
    const options = {} as Dictionary;
    let decorator = `@${this.referenceCoreImport(this.getDecoratorType(prop))}`;

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
    const processIndex = (type: 'index' | 'unique') => {
      const propType = prop[type];
      if (!propType) {
        return;
      }

      const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
      options[type] = (propType === true || defaultName === propType) ? 'true' : this.quote(propType);
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

    const ret: string[] = [];

    let propIndexIsNonTrivialIndex = false;
    const nonTrivialIndexes = this.meta.indexes.filter(i => i.properties?.length === 1 && i.properties[0] === prop.name);
    for (const i of nonTrivialIndexes) {
      ret.push(`@${this.referenceCoreImport('Index')}(${this.serializeObject(this.getIndexOptions(i, false))})`);
      if (prop.index === i.name) {
        propIndexIsNonTrivialIndex = true;
        delete options.index;
      }
    }

    if (prop.index && !options.index && !propIndexIsNonTrivialIndex) {
      ret.push(`@${this.referenceCoreImport('Index')}(${typeof prop.index === 'string' ? `{ name: ${this.quote(prop.index)} }` : '' })`);
    }

    let propIndexIsNonTrivialUnique = false;
    const nonTrivialUnique = this.meta.uniques.filter(i => i.properties?.length === 1 && i.properties[0] === prop.name);
    for (const i of nonTrivialUnique) {
      ret.push(`@${this.referenceCoreImport('Unique')}(${this.serializeObject(this.getUniqueOptions(i, false))})`);
      if (prop.unique === i.name) {
        propIndexIsNonTrivialUnique = true;
        delete options.unique;
      }
    }

    if (prop.unique && !options.unique && !propIndexIsNonTrivialUnique) {
      ret.push(`@${this.referenceCoreImport('Unique')}(${typeof prop.unique === 'string' ? `{ name: ${this.quote(prop.unique)} }` : '' })`);
    }

    return ret;
  }

  protected getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (!prop.mappedBy && (prop.nullable || prop.customTypes?.[0]?.prop?.nullable)) {
      options.nullable = true;
    }

    if (prop.primary && (prop.enum || !(typeof prop.kind === 'undefined' || prop.kind === ReferenceKind.SCALAR))) {
      options.primary = true;
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

    if (Array.isArray(prop.groups)) {
      options.groups = prop.groups.map(group => this.quote(group));
    }

    (['hidden', 'version', 'concurrencyCheck', 'eager', 'lazy', 'orphanRemoval'] as const)
      .filter(key => prop[key])
      .forEach(key => options[key] = true);

    if (prop.cascade && (prop.cascade.length !== 1 || prop.cascade[0] !== Cascade.PERSIST)) {
      options.cascade = `[${prop.cascade.map(value => `${this.referenceCoreImport('Cascade')}.${value.toUpperCase()}`).join(', ')}]`;
    }

    if (typeof prop.comment === 'string') {
      options.comment = this.quote(prop.comment);
    }

    // TODO: Composite FKs with default values require additions to default/defaultRaw that are not yet supported.
    if (prop.fieldNames?.length <= 1) {
      if (typeof prop.defaultRaw !== 'undefined' && prop.defaultRaw !== 'null' && prop.defaultRaw !== '' &&
        prop.defaultRaw !== (typeof prop.default === 'string' ? this.quote(prop.default) : `${prop.default}`)
      ) {
        options.defaultRaw = `\`${prop.defaultRaw}\``;
      } else if (!(typeof prop.default === 'undefined' || prop.default === null) && (prop.ref || (!prop.enum && (typeof prop.kind === 'undefined' || prop.kind === ReferenceKind.SCALAR) && (prop.type === 'unknown' || typeof this.breakdownOfIType(prop) !== 'undefined')))) {
        options.default = typeof prop.default === 'string' ? this.quote(prop.default) : prop.default;
      }
    }

    if (typeof prop.extra === 'string') {
      options.extra = this.quote(prop.extra);
    }

    if (prop.deferMode) {
      options.deferMode = `${this.referenceCoreImport('DeferMode')}.INITIALLY_${prop.deferMode.toUpperCase()}`;
    }

    if (typeof prop.ignoreSchemaChanges !== 'undefined') {
      options.ignoreSchemaChanges ??= [];
      options.ignoreSchemaChanges.push(...prop.ignoreSchemaChanges.map(v => this.quote(v)));
    }
  }

  private propTypeBreakdowns = new WeakMap<EntityProperty, ReturnType<SourceFile['breakdownOfIType']>>();

  private breakdownOfIType(prop: EntityProperty): [string, string] | [string, string, string] | undefined {
    if (this.propTypeBreakdowns.has(prop)) {
      return this.propTypeBreakdowns.get(prop);
    }

    const mappedDeclaredType = this.platform.getMappedType(prop.type);
    const mappedRawType = (prop.customTypes?.[0] ?? ((prop.type !== 'unknown' && mappedDeclaredType instanceof UnknownType)
      ? this.platform.getMappedType(prop.columnTypes[0])
      : mappedDeclaredType));
    const rawType = mappedRawType.runtimeType;

    const mappedSerializedType = (prop.customType ?? mappedRawType);
    const serializedType = mappedSerializedType.runtimeType;

    // Add non-lib imports where needed.
    for (const typeSpec of [prop.runtimeType, rawType, serializedType]) {
      const simplePropType = typeSpec.replace(/\[]+$/, '');
      if (!primitivesAndLibs.includes(simplePropType)) {
        this.entityImports.add(simplePropType);
      }
    }

    const nullables = [
      prop.nullable ?? false,
      mappedRawType.prop?.nullable ?? prop.nullable ?? false,
      mappedSerializedType.prop?.nullable ?? prop.nullable ?? false,
    ] as const;
    const hasMixedNullability = (new Set(nullables)).size > 1;

    if (prop.runtimeType !== rawType || rawType !== serializedType || hasMixedNullability) {
      const nullType = this.options.forceUndefined ? ' | undefined' : ' | null';
      if (rawType !== serializedType || nullables[1] !== nullables[2] || (prop.hidden && nullables[0] !== nullables[1])) {
        const r: [string, string, string] = [prop.runtimeType, rawType, serializedType];
        if (hasMixedNullability || prop.hidden) {
          for (let i = r.length - 1; i >= 0; --i) {
            if (nullables[i]) {
              r[i] += nullType;
            }
          }
          if (prop.hidden) {
            r[2] = `(${r[2]}) & ${this.referenceCoreImport('Hidden')}`;
          }
        }
        this.propTypeBreakdowns.set(prop, r);
        return r;
      }

      const r: [string, string] = [prop.runtimeType, rawType];
      if (hasMixedNullability) {
        for (let i = r.length - 1; i >= 0; --i) {
          if (nullables[i]) {
            r[i] += nullType;
          }
        }
      }
      this.propTypeBreakdowns.set(prop, r);
      return r;
    }
    const r = undefined;
    this.propTypeBreakdowns.set(prop, r);
    return r;
  }

  protected getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
      options.fieldName = this.quote(prop.fieldNames[0]);
    }

    if (prop.enum) {
      options.items = `() => ${prop.runtimeType}`;
    }

    // For enum properties, we don't need a column type
    // or the property length or other information in the decorator.
    if (prop.enum) {
      return;
    }

    const mappedColumnType = this.platform.getMappedType(prop.columnTypes[0]);
    // If the column's runtimeType matches the declared runtimeType, assume it's the same underlying type.
    const mappedRuntimeType = mappedColumnType.runtimeType === prop.runtimeType
      ? mappedColumnType
      : this.platform.getMappedType(prop.runtimeType);

    const mappedDeclaredType = this.platform.getMappedType(prop.type);
    const isTypeStringMissingFromMap = prop.type !== 'unknown' && mappedDeclaredType instanceof UnknownType;

    if (isTypeStringMissingFromMap) {
      this.entityImports.add(prop.type);
      options.type = prop.type;
    } else {
      if (this.options.scalarTypeInDecorator // always output type if forced by the generator options
        || (prop.nullable && !this.options.forceUndefined) // also when there is the "| null" type modifier (because reflect-metadata can't extract the base)
        || prop.hidden // also when there is the "& Hidden" type modifier (because reflect-metadata can't extract the base)
        || (new Set([mappedRuntimeType.name, mappedColumnType.name, mappedDeclaredType.name, this.platform.getMappedType(prop.runtimeType === 'Date' ? 'datetime' : prop.runtimeType).name])).size > 1 // also, if there's any ambiguity in the type
        || (() => {
          const hasUsableNullDefault = (prop.nullable && !this.options.forceUndefined && prop.default === null);
          const useDefault = hasUsableNullDefault || !(typeof prop.default === 'undefined' || prop.default === null);

          return ((useDefault && !hasUsableNullDefault) || (prop.optional && !prop.nullable));
        })() // also when there is the "| Opt" type modifier (because reflect-metadata can't extract the base)
      ) {
        options.type = this.quote(prop.type);
      }
    }

    const columnTypeFromMappedRuntimeType = mappedRuntimeType.getColumnType(
      { ...prop, autoincrement: false },
      this.platform,
    );
    const columnTypeFromMappedColumnType = mappedColumnType.getColumnType(
      { ...prop, autoincrement: false },
      this.platform,
    );
    const columnTypeFromMappedDeclaredType = mappedDeclaredType.getColumnType(
      { ...prop, autoincrement: false },
      this.platform,
    );

    const needsExplicitColumnType = () => {
      if (isTypeStringMissingFromMap || [mappedRuntimeType, mappedColumnType, columnTypeFromMappedDeclaredType].some(t => t instanceof UnknownType)) {
        return true;
      }

      if (this.platform.normalizeColumnType(prop.columnTypes[0], prop) !== this.platform.normalizeColumnType(columnTypeFromMappedColumnType, prop)) {
        return prop.columnTypes[0] !== columnTypeFromMappedColumnType;
      }

      return columnTypeFromMappedRuntimeType !== columnTypeFromMappedColumnType || columnTypeFromMappedDeclaredType !== columnTypeFromMappedColumnType;
    };

    if (needsExplicitColumnType()) {
      options.columnType = this.quote(prop.columnTypes[0]);
    }

    const assign = (key: keyof EntityProperty) => {
      if (prop[key] != null) {
        options[key] = prop[key];
      }
    };

    if (!options.columnType && (typeof mappedColumnType.getDefaultLength === 'undefined' || mappedColumnType.getDefaultLength(this.platform) !== prop.length)) {
      assign('length');
    }

    // those are already included in the `columnType` in most cases, and when that option is present, they would be ignored anyway
    /* v8 ignore next 4 */
    if (mappedColumnType instanceof DecimalType && !options.columnType) {
      assign('precision');
      assign('scale');
    }

    if (this.platform.supportsUnsigned() &&
      (
        (!prop.primary && prop.unsigned) ||
        (prop.primary && !prop.unsigned && this.platform.isNumericColumn(mappedColumnType))
      )
    ) {
      assign('unsigned');
    }

    if (prop.autoincrement) {
      if (!prop.primary || !this.platform.isNumericColumn(mappedColumnType) || this.meta.getPrimaryProps().length !== 1) {
        options.autoincrement = true;
      }
    } else {
      if (prop.primary && this.platform.isNumericColumn(mappedColumnType) && this.meta.getPrimaryProps().length === 1) {
        options.autoincrement = false;
      }
    }

    if (prop.generated) {
      options.generated = typeof prop.generated === 'string' ? this.quote(prop.generated) : `${prop.generated}`;
    }
  }

  protected getManyToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;

    if (prop.orderBy) {
      options.orderBy = inspect(prop.orderBy);
    }

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
    if (prop.orderBy) {
      options.orderBy = inspect(prop.orderBy);
    }
  }

  protected getEmbeddedPropertyDeclarationOptions(options: Dictionary, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;

    if (prop.array) {
      options.array = true;
    }

    if (prop.object) {
      options.object = true;
    }

    if (prop.prefix === false || typeof prop.prefix === 'string') {
      options.prefix = prop.prefix === false ? false : this.quote(prop.prefix);
    }
  }

  protected getForeignKeyDecoratorOptions(options: OneToOneOptions<any, any>, prop: EntityProperty) {
    this.entityImports.add(prop.type);
    options.entity = `() => ${prop.type}`;

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

    if (prop.ownColumns && prop.ownColumns.length !== prop.fieldNames.length) {
      options.referencedColumnNames = prop.referencedColumnNames.map(fieldName => this.quote(fieldName));
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

    if (prop.fieldNames.length > 1 && !(typeof prop.default === 'undefined' || prop.default === null)) {
      // TODO: Composite FKs with default values require additions to default/defaultRaw that are not yet supported.
      options.ignoreSchemaChanges = [this.quote('default') as 'default'];
    }
  }

  protected getDecoratorType(prop: EntityProperty): string {
    if (prop.kind === ReferenceKind.ONE_TO_ONE) {
      return 'OneToOne';
    }

    if (prop.kind === ReferenceKind.MANY_TO_ONE) {
      return 'ManyToOne';
    }

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      return 'OneToMany';
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      return 'ManyToMany';
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      return 'Embedded';
    }

    if (prop.enum) {
      return 'Enum';
    }

    if (prop.primary) {
      return 'PrimaryKey';
    }

    if (prop.formula) {
      return 'Formula';
    }

    return 'Property';
  }

  protected referenceCoreImport(identifier: string): string {
    this.coreImports.add(identifier);
    return this.options.coreImportsPrefix
      ? `${this.options.coreImportsPrefix}${identifier}`
      : identifier;
  }

}
