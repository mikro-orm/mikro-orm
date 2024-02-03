import { ReferenceKind, Utils, type Dictionary, type EntityProperty } from '@mikro-orm/core';
import { SourceFile } from './SourceFile';

export class EntitySchemaSourceFile extends SourceFile {

  override generate(): string {
    this.coreImports.add('EntitySchema');
    let ret = `export `;
    if (this.meta.abstract) {
      ret += `abstract `;
    }
    ret += `class ${this.meta.className}`;
    if (this.meta.extends) {
      this.entityImports.add(this.meta.extends);
      ret += ` extends ${this.meta.extends}`;
    }
    ret += ' {\n';
    const enumDefinitions: string[] = [];
    const eagerProperties: EntityProperty<any>[] = [];
    const hiddenProperties: EntityProperty<any>[] = [];
    const optionalProperties: EntityProperty<any>[] = [];
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

      if (prop.hidden) {
        hiddenProperties.push(prop);
      }

      if (!prop.nullable && typeof prop.default !== 'undefined') {
        optionalProperties.push(prop);
      }

      if (prop.primary && (!['id', '_id', 'uuid'].includes(prop.name) || this.meta.compositePK)) {
        primaryProps.push(prop);
      }
    }

    if (primaryProps.length > 0) {
      this.coreImports.add('PrimaryKeyProp');
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        ret += `${' '.repeat(2)}[PrimaryKeyProp]?: [${primaryPropNames.join(', ')}];\n`;
      } else {
        ret += `${' '.repeat(2)}[PrimaryKeyProp]?: ${primaryPropNames[0]};\n`;
      }
    }

    if (eagerProperties.length > 0) {
      this.coreImports.add('EagerProps');
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      ret += `${' '.repeat(2)}[EagerProps]?: ${eagerPropertyNames.join(' | ')};\n`;
    }

    if (hiddenProperties.length > 0) {
      this.coreImports.add('HiddenProps');
      const hiddenPropertyNames = hiddenProperties.map(prop => `'${prop.name}'`).sort();
      ret += `${' '.repeat(2)}[HiddenProps]?: ${hiddenPropertyNames.join(' | ')};\n`;
    }

    if (optionalProperties.length > 0) {
      this.coreImports.add('OptionalProps');
      const optionalPropertyNames = optionalProperties.map(prop => `'${prop.name}'`).sort();
      ret += `${' '.repeat(2)}[OptionalProps]?: ${optionalPropertyNames.join(' | ')};\n`;
    }

    ret += `${props.join('')}}\n`;

    const imports = [`import { ${([...this.coreImports].sort().join(', '))} } from '@mikro-orm/core';`];
    const entityImports = [...this.entityImports].filter(e => e !== this.meta.className);
    entityImports.sort().forEach(entity => {
      imports.push(`import { ${entity} } from './${entity}';`);
    });

    ret = `${imports.join('\n')}\n\n${ret}`;
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    ret += `\n`;
    ret += `export const ${this.meta.className}Schema = new EntitySchema({\n`;
    ret += `  class: ${this.meta.className},\n`;

    if (this.meta.tableName !== this.namingStrategy.classToTableName(this.meta.className)) {
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
      options.items = `() => ${prop.type}`;
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
