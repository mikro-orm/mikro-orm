import 'reflect-metadata';
import type { EntityMetadata, EntityProperty } from '../typings';
import { MetadataProvider } from './MetadataProvider';
import { ReferenceType } from '../enums';

export class ReflectMetadataProvider extends MetadataProvider {

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    await this.initProperties(meta, prop => this.initPropertyType(meta, prop));
  }

  protected initPropertyType(meta: EntityMetadata, prop: EntityProperty) {
    let type = Reflect.getMetadata('design:type', meta.prototype, prop.name);

    if (!type || (type === Object && prop.reference !== ReferenceType.SCALAR)) {
      throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}`);
    }

    // Instead of requiring the type everywhere, we default to string, which maintains the behaviour,
    // as we were mapping it to UnknownType which is a string. This is to prevent defaulting to JSON
    // column type, which can be often hard to revert and cause hard to understand issues with PKs.
    if (prop.reference === ReferenceType.SCALAR && type === Object) {
      type = String;
    }

    prop.type = type.name;

    if (prop.type && ['string', 'number', 'boolean', 'array', 'object'].includes(prop.type.toLowerCase())) {
      prop.type = prop.type.toLowerCase();
    }
  }

}
