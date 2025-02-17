import {
  type AnyEntity,
  Config,
  type Dictionary,
  type EntityProperty,
  type EntitySchemaMetadata,
  type TypeConfig,
  ReferenceKind,
} from '@mikro-orm/core';
import { SourceFile } from './SourceFile.js';

export class EntitySchemaSourceFile extends SourceFile {

  override generate(): string {
    let classBody = '';
    if (this.meta.className === this.options.customBaseEntityName) {
      const defineConfigTypeSettings: TypeConfig = {};
      defineConfigTypeSettings.forceObject = this.platform.getConfig().get('serialization').forceObject ?? false;
      classBody += `${' '.repeat(2)}[${this.referenceCoreImport('Config')}]?: ${this.referenceCoreImport('DefineConfig')}<${this.serializeObject(defineConfigTypeSettings)}>;\n`;
    }

    const enumDefinitions: string[] = [];
    const eagerProperties: EntityProperty<any>[] = [];
    const primaryProps: EntityProperty<any>[] = [];
    const props: string[] = [];

    for (const prop of Object.values(this.meta.properties)) {
      props.push(this.getPropertyDefinition(prop, 2));

      if (prop.enum && (typeof prop.kind === 'undefined' || prop.kind === ReferenceKind.SCALAR)) {
        enumDefinitions.push(this.getEnumClassDefinition(prop, 2));
      }

      if (prop.eager) {
        eagerProperties.push(prop);
      }

      if (prop.primary && (!['id', '_id', 'uuid'].includes(prop.name) || this.meta.compositePK)) {
        primaryProps.push(prop);
      }
    }

    if (primaryProps.length > 0) {
      const primaryPropNames = primaryProps.map(prop => `'${prop.name}'`);

      if (primaryProps.length > 1) {
        classBody += `${' '.repeat(2)}[${this.referenceCoreImport('PrimaryKeyProp')}]?: [${primaryPropNames.join(', ')}];\n`;
      } else {
        classBody += `${' '.repeat(2)}[${this.referenceCoreImport('PrimaryKeyProp')}]?: ${primaryPropNames[0]};\n`;
      }
    }

    if (eagerProperties.length > 0) {
      const eagerPropertyNames = eagerProperties.map(prop => `'${prop.name}'`).sort();
      classBody += `${' '.repeat(2)}[${this.referenceCoreImport('EagerProps')}]?: ${eagerPropertyNames.join(' | ')};\n`;
    }

    classBody += `${props.join('')}`;

    let ret = this.getEntityClass(classBody);
    if (enumDefinitions.length) {
      ret += '\n' + enumDefinitions.join('\n');
    }

    ret += `\n`;
    const entitySchemaOptions: Partial<Record<keyof EntitySchemaMetadata<AnyEntity>, any>> & {[Config]?: any} = {
      class: this.meta.className,
      ...(this.meta.embeddable ? this.getEmbeddableDeclOptions() : (this.meta.collection ? this.getEntityDeclOptions() : {})),
    };
    const declLine = `export const ${this.meta.className}Schema = new ${this.referenceCoreImport('EntitySchema')}(`;
    ret += declLine;

    if (this.meta.indexes.length > 0) {
      entitySchemaOptions.indexes = this.meta.indexes.map(index => this.getIndexOptions(index));
    }

    if (this.meta.uniques.length > 0) {
      entitySchemaOptions.uniques = this.meta.uniques.map(index => this.getUniqueOptions(index));
    }

    entitySchemaOptions.properties = Object.fromEntries(
      Object.entries(this.meta.properties).map(
        ([name, prop]) => [name, this.getPropertyOptions(prop)],
      ),
    );

    // Force top level and properties to be indented, regardless of line length
    entitySchemaOptions[Config] = true;
    entitySchemaOptions.properties[Config] = true;

    ret += this.serializeObject(entitySchemaOptions, declLine.length > 80 ? undefined : 80 - declLine.length, 0);
    ret += ');\n';

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
      const propType = prop[type];
      if (!propType) {
        return;
      }

      const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
      /* v8 ignore next */
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
  }

  protected override getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
    if (prop.enum) {
      options.enum = true;
      options.items = `() => ${prop.runtimeType}`;
    } else {
      options.type = this.quote(prop.type);
    }

    super.getScalarPropertyDecoratorOptions(options, prop);
  }

}
