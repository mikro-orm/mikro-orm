import { BaseEntity, EntityProperty } from '../BaseEntity';
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
    options.array = type === Array;

    meta.properties = meta.properties || {};
    meta.properties[propertyName] = Object.assign({}, options, { reference: false, collection: false }) as EntityProperty;
  };
}

export type PropertyOptions = {
  name?: string;
  type?: any;
  array?: boolean;
  [prop: string]: any;
}
