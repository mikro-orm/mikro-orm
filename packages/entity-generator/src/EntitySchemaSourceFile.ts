import { ReferenceKind, Utils, type Dictionary, type EntityProperty, type TypeConfig } from '@mikro-orm/core';
import { SourceFile } from './SourceFile';

export class EntitySchemaSourceFile extends SourceFile {

  override generate(): string {
    this.coreImports.add('EntitySchema');

    let classBody = '';
    if (this.meta.className === this.options.customBaseEntityName) {
      this.coreImports.add('Config');
      this.coreImports.add('DefineConfig');
      const defineConfigTypeSettings: TypeConfig = {};
      defineConfigTypeSettings.forceObject = this.platform.getConfig().get('serialization').forceObject ?? false;
      classBody += `${' '.repeat(2)}[Config]?: DefineConfig<${this.serializeObject(defineConfigTypeSettings)}>;\n`;
    }

    const enumDefinitions: string[] = [];
    const eagerProperties: EntityProperty<any>[] = [];
    const primaryProps: EntityProperty<any>[] = [];
    const props: string[] = [];

    for (const prop of Object.values(this.meta.properties)) {
      props.push(this.getPropertyDefinition(prop, 2));

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
    }

    if (primaryProps.length > 0) {
      this.coreImports.add('PrimaryKeyProp');
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        classBody += `${' '.repeat(2)}[PrimaryKeyProp]?: [${primaryPropNames.join(', ')}];\n`;
      } else {
        classBody += `${' '.repeat(2)}[PrimaryKeyProp]?: ${primaryPropNames[0]};\n`;
      }
    }

    if (eagerProperties.length > 0) {
      this.coreImports.add('EagerProps');
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      classBody += `${' '.repeat(2)}[EagerProps]?: ${eagerPropertyNames.join(' | ')};\n`;
    }

    classBody += `${props.join('')}`;

    let ret = this.getEntityClass(classBody);
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    ret += `\n`;
    ret += `export const ${this.getValidIdentifierName(`${this.meta.className}Schema`)} = new EntitySchema({\n`;
    ret += `  class: ${this.getValidIdentifierName(this.meta.className)},\n`;

    if (this.meta.tableName && this.meta.tableName !== this.namingStrategy.classToTableName(this.meta.className)) {
      ret += `  tableName: ${this.quote(this.meta.tableName)},\n`;
    }

    /* istanbul ignore next */
    if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
      ret += `  schema: ${this.quote(this.meta.schema)},\n`;
    }

    if (this.meta.indexes.length > 0) {
      ret += `  indexes: [\n`;
      this.meta.indexes.forEach(index => {
        if (index.expression) {
          ret += `    { name: '${index.name}', expression: ${this.quote(index.expression)} },\n`;
          return;
        }
        const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
        ret += `    { name: '${index.name}', properties: [${properties.join(', ')}] },\n`;
      });
      ret += `  ],\n`;
    }

    if (this.meta.uniques.length > 0) {
      ret += `  uniques: [\n`;
      this.meta.uniques.forEach(index => {
        if (index.expression) {
          ret += `    { name: '${index.name}', expression: ${this.quote(index.expression)} },\n`;
          return;
        }
        const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
        ret += `    { name: '${index.name}', properties: [${properties.join(', ')}] },\n`;
      });
      ret += `  ],\n`;
    }

    ret += `  properties: {\n`;
    Object.values(this.meta.properties).forEach(prop => {
      const options = this.getPropertyOptions(prop);
      let def = this.serializeObject(options);

      if (def.length > 80) {
        def = this.serializeObject(options, 2);
      }
      //
      ret += `    ${prop.name}: ${def},\n`;
    });
    ret += `  },\n`;
    ret += `});\n`;

    ret = `${this.generateImports()}\n\n${ret}`;

    return ret;
  }

  private getPropertyOptions(prop: EntityProperty): Dictionary {
    const options = {} as Dictionary;

    if (prop.primary) {
      options.primary = true;
    }

    if (typeof prop.kind !== 'undefined' && prop.kind !== ReferenceKind.SCALAR) {
      options.kind = this.quote(prop.kind);
    }

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
      options.enum = true;
      options.items = `() => ${this.getValidIdentifierName(prop.type)}`;
    }

    if (prop.formula) {
      options.formula = `${prop.formula}`;
    }

    this.getCommonDecoratorOptions(options, prop);
    this.getPropertyIndexesOptions(prop, options);

    return options;
  }

  protected getPropertyIndexesOptions(prop: EntityProperty, options: Dictionary): void {
    if (prop.kind === ReferenceKind.SCALAR) {
      if (prop.index) {
        options.index = this.quote(prop.index as string);
      }

      if (prop.unique) {
        options.unique = this.quote(prop.unique as string);
      }

      return;
    }

    const processIndex = (type: 'index' | 'unique') => {
      if (!prop[type]) {
        return;
      }

      const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
      /* istanbul ignore next */
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
  }

  protected override getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (prop.kind === ReferenceKind.SCALAR && !prop.enum) {
      options.type = this.quote(prop.type);
    }

    super.getScalarPropertyDecoratorOptions(options, prop);
  }

}
