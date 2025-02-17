import 'reflect-metadata';
import type { EntityMetadata, EntityProperty } from '../typings.js';
import { MetadataProvider } from './MetadataProvider.js';
import { ReferenceKind } from '../enums.js';
import { Utils } from '../utils/Utils.js';

export class ReflectMetadataProvider extends MetadataProvider {

  loadEntityMetadata(meta: EntityMetadata, name: string): void {
    this.initProperties(meta);
  }

  protected initProperties(meta: EntityMetadata): void {
    // load types and column names
    for (const prop of meta.props) {
      if (typeof prop.entity === 'string') {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      } else {
        this.initPropertyType(meta, prop);
      }
    }
  }

  protected initPropertyType(meta: EntityMetadata, prop: EntityProperty) {
    const type = Reflect.getMetadata('design:type', meta.prototype, prop.name);

    if (!prop.type && (!type || (type === Object && prop.kind !== ReferenceKind.SCALAR)) && !(prop.enum && (prop.items?.length ?? 0) > 0)) {
      throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}. If you are using decorators, ensure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.`);
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
  }

}
