import { BaseEntity, EntityProperty } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';

export function OneToMany(options: OneToManyOptions): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    const reflectMetadataType = Reflect.getMetadata('design:type', target, propertyName);

    if (!options.type && reflectMetadataType) {
      options.type = reflectMetadataType;
    }

    options.array = reflectMetadataType === Array;
    meta.properties = meta.properties || {};

    if (!options.entity) {
      throw new Error(`'@OneToMany({ entity: string })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    const attributes = {} as any;
    Object.keys(options).forEach(k => {
      if (['cascade'].includes(k)) {
        attributes[k] = options[k];
      }
    });

    const property = { name: propertyName, reference: true, collection: true, attributes };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface OneToManyOptions extends PropertyOptions {
  entity: () => string;
  fk: string;
  cascade?: string[];
}
