import { BaseEntity, EntityProperty, ReferenceType } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    const type = Reflect.getMetadata('design:type', target, propertyName);

    if (!options.type && type) {
      options.type = type.name;
    }

    options.name = propertyName;
    meta.properties = meta.properties || {};
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
  };
}

export type PropertyOptions = {
  name?: string;
  type?: any;
  [prop: string]: any;
}
