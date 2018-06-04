import { BaseEntity, EntityProperty } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';

export function ManyToOne(options: ManyToOneOptions): Function {
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
      throw new Error(`'@ManyToOne({ entity: string })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    if (!options.fk) {
      options.fk = '_id';
    }

    const attributes = {} as any;
    Object.keys(options).forEach(k => {
      if (['cascade'].includes(k)) {
        attributes[k] = options[k];
      }
    });

    const property = { name: propertyName, reference: true, collection: false, attributes };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity: () => string,
  fk?: string;
  cascade?: string[];
}
