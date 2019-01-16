import { BaseEntity, EntityProperty, ReferenceType } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';

export function ManyToOne(options: ManyToOneOptions): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    meta.properties = meta.properties || {};
    const reflectMetadataType = Reflect.getMetadata('design:type', target, propertyName);

    if (!options.type && reflectMetadataType) {
      options.type = reflectMetadataType;
    }

    if (!options.entity) {
      throw new Error(`'@ManyToOne({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity: () => string | Function,
  fk?: string;
}
