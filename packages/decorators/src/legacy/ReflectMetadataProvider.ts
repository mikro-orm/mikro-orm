import 'reflect-metadata';
import {
  type EntityClass,
  type EntityMetadata,
  type EntityProperty,
  EntitySchema,
  MetadataProvider,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export class ReflectMetadataProvider extends MetadataProvider {

  override loadEntityMetadata(meta: EntityMetadata): void {
    // load types and column names
    for (const prop of meta.props) {
      /* v8 ignore next */
      if (typeof prop.entity === 'string') {
        throw new Error(`Relation target needs to be an entity class or EntitySchema instance, '${prop.entity}' given instead for ${meta.className}.${prop.name}.`);
      } else if (prop.entity) {
        const tmp = prop.entity() as EntityClass;
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
        prop.target = tmp instanceof EntitySchema ? tmp.meta.class : tmp;
      } else {
        this.initPropertyType(meta, prop);
      }
    }
  }

  protected initPropertyType(meta: EntityMetadata, prop: EntityProperty) {
    const type = Reflect.getMetadata('design:type', meta.prototype, prop.name);

    if (!prop.type && (!type || (type === Object && prop.kind !== ReferenceKind.SCALAR)) && !(prop.enum && (prop.items?.length ?? 0) > 0)) {
      throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}. Make sure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.`);
    }

    // Force mapping to UnknownType which is a string when we see just `Object`, as that often means failed inference.
    // This is to prevent defaulting to JSON column type, which can often be hard to revert and cause hard to understand issues with PKs.
    // If there are explicitly provided `columnTypes`, we use those instead for the inference, this way
    // we can have things like `columnType: 'timestamp'` be respected as `type: 'Date'`.
    if (prop.kind === ReferenceKind.SCALAR && type === Object && !prop.columnTypes) {
      prop.type ??= 'any';
      return;
    }

    let typeName = type?.name;

    if (typeName && ['string', 'number', 'boolean', 'array', 'object'].includes(typeName.toLowerCase())) {
      typeName = typeName.toLowerCase();
    }

    prop.type ??= typeName;
    prop.runtimeType ??= typeName;
    prop.target = type;
  }

}
