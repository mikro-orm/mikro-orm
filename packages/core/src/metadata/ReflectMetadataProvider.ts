import 'reflect-metadata';
import type { EntityMetadata, EntityProperty } from '../typings';
import { MetadataProvider } from './MetadataProvider';
import { ReferenceKind } from '../enums';
import { Utils } from '../utils/Utils';

export class ReflectMetadataProvider extends MetadataProvider {

  loadEntityMetadata(meta: EntityMetadata, name: string): void {
    this.initProperties(meta);
  }

  protected initProperties(meta: EntityMetadata): void {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      if (Utils.isString(prop.entity)) {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      } else if (!prop.type) {
        this.initPropertyType(meta, prop);
      }
    }
  }

  protected initPropertyType(meta: EntityMetadata, prop: EntityProperty) {
    const type = Reflect.getMetadata('design:type', meta.prototype, prop.name);

    if (!type || (type === Object && prop.kind !== ReferenceKind.SCALAR)) {
      throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}. If you are using decorators, ensure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.`);
    }

    // Force mapping to UnknownType which is a string when we see just `Object`, as that often means failed inference.
    // This is to prevent defaulting to JSON column type, which can be often hard to revert and cause hard to understand issues with PKs.
    // If there are explicitly provided `columnTypes`, we use those instead for the inference, this way
    // we can have things like `columnType: 'timestamp'` be respected as `type: 'Date'`.
    if (prop.kind === ReferenceKind.SCALAR && type === Object && !prop.columnTypes) {
      prop.type = 'any';
      return;
    }

    prop.type = type.name;

    if (prop.type && ['string', 'number', 'boolean', 'array', 'object'].includes(prop.type.toLowerCase())) {
      prop.type = prop.type.toLowerCase();
    }

    prop.runtimeType = prop.type as 'string';
  }

}
