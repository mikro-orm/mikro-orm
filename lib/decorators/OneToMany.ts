import { BaseEntity, EntityProperty, ReferenceType } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';

export function OneToMany(options: OneToManyOptions): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    meta.properties = meta.properties || {};

    if (!options.entity) {
      throw new Error(`'@OneToMany({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    const property = { name: propertyName, reference: ReferenceType.ONE_TO_MANY };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface OneToManyOptions extends PropertyOptions {
  entity: () => string | Function;
  fk: string;
}
