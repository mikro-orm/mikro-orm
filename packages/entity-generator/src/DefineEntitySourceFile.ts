import {
  type AnyEntity,
  Config,
  type Dictionary,
  type EntityProperty,
  type EntitySchemaMetadata,
  ReferenceKind,
  types,
} from '@mikro-orm/core';
import { EntitySchemaSourceFile } from './EntitySchemaSourceFile';

export class DefineEntitySourceFile extends EntitySchemaSourceFile {

  override generate(): string {
    const enumDefinitions: string[] = [];

    for (const prop of Object.values(this.meta.properties)) {
      if (prop.enum && (typeof prop.kind === 'undefined' || prop.kind === ReferenceKind.SCALAR)) {
        enumDefinitions.push(this.getEnumClassDefinition(prop, 2));
      }
    }

    let ret = '';

    if (!this.options.inferEntityType) {
      ret += this.generateClassDefinition() + '\n';
    }

    if (enumDefinitions.length) {
      ret += enumDefinitions.join('\n') + '\n';
    }

    const entitySchemaOptions: Partial<Record<keyof EntitySchemaMetadata<AnyEntity>, any>> & { [Config]?: any } = {};

    if (this.options.inferEntityType) {
      entitySchemaOptions.name = this.quote(this.meta.className);

      if (this.meta.compositePK) {
        entitySchemaOptions.primaryKeys = this.meta.getPrimaryProps().map(p => this.quote(p.name));
      }
    } else {
      entitySchemaOptions.class = this.meta.className;
    }

    Object.assign(entitySchemaOptions, (this.meta.embeddable ? this.getEmbeddableDeclOptions() : (this.meta.collection ? this.getEntityDeclOptions() : {})));
    const nameSuffix = this.options.inferEntityType ? '' : 'Schema';
    const declLine = `export const ${this.meta.className + nameSuffix} = ${this.referenceCoreImport('defineEntity')}(`;
    ret += declLine;

    if (this.meta.indexes.length > 0) {
      entitySchemaOptions.indexes = this.meta.indexes.map(index => this.getIndexOptions(index));
    }

    if (this.meta.uniques.length > 0) {
      entitySchemaOptions.uniques = this.meta.uniques.map(index => this.getUniqueOptions(index));
    }

    entitySchemaOptions.properties = Object.fromEntries(
      Object.entries(this.meta.properties).map(
        ([name, prop]) => [name, this.getPropertyBuilder(prop)],
      ),
    );

    // Force top level and properties to be indented, regardless of line length
    entitySchemaOptions[Config] = true;
    entitySchemaOptions.properties[Config] = true;

    ret += this.serializeObject(entitySchemaOptions, declLine.length > 80 ? undefined : 80 - declLine.length, 0);
    ret += ');\n';

    if (this.options.inferEntityType) {
      ret += `\nexport interface I${this.meta.className} extends ${this.referenceCoreImport('InferEntity')}<typeof ${this.meta.className}> {}\n`;
    }

    ret = `${this.generateImports()}\n\n${ret}`;

    return ret;
  }

  private getPropertyBuilder(prop: EntityProperty): string {
    const options = this.getPropertyOptions(prop, false);
    const p = this.referenceCoreImport('p');
    let builder = ``;

    switch (prop.kind) {
      case ReferenceKind.ONE_TO_ONE: builder += `() => ${p}.oneToOne(${prop.type})`; break;
      case ReferenceKind.ONE_TO_MANY: builder += `() => ${p}.oneToMany(${prop.type})`; break;
      case ReferenceKind.MANY_TO_ONE: builder += `() => ${p}.manyToOne(${prop.type})`; break;
      case ReferenceKind.MANY_TO_MANY: builder += `() => ${p}.manyToMany(${prop.type})`; break;
      case ReferenceKind.EMBEDDED: builder += `() => ${p}.embedded(${prop.type})`; break;
      case ReferenceKind.SCALAR:
      default: {
        if (options.type && !(options.type in types)) {
          builder += `${p}.type(${options.type})`;
        } else {
          builder += options.type ? `${p}.${options.type}()` : p;
        }
      }
    }

    const simpleOptions = new Set([
      'primary', 'ref', 'nullable', 'array', 'object', 'mapToPk', 'hidden', 'concurrencyCheck', 'lazy', 'eager',
      'orphanRemoval', 'version', 'unsigned', 'returning', 'createForeignKeyConstraint', 'fixedOrder', 'owner',
      'getter', 'setter', 'unique', 'index', 'hydrate', 'persist', 'autoincrement',
    ]);
    const skipOptions = new Set(['entity', 'kind', 'type', 'items']);
    const spreadOptions = new Set([
      'fieldNames', 'joinColumns', 'inverseJoinColumns', 'referencedColumnNames', 'ownColumns', 'columnTypes',
      'cascade', 'ignoreSchemaChanges', 'customOrder', 'groups', 'where', 'orderBy',
    ]);
    const rename: Dictionary<string> = {
      fieldName: 'name',
    };

    for (const key of Object.keys(options)) {
      if (typeof options[key] !== 'undefined' && !skipOptions.has(key)) {
        const method = rename[key] ?? key;
        const params = simpleOptions.has(key) && options[key] === true ? '' : options[key];
        builder += `.${method}`;

        if (key === 'enum') {
          builder += `(${options.items})`;
        } else if (spreadOptions.has(key) && typeof params === 'string' && params.startsWith('[')) {
          builder += `(${params.slice(1, -1)})`;
        } else {
          builder += `(${params})`;
        }
      }
    }

    return builder;
  }

}
