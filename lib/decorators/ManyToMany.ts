import { BaseEntity, EntityProperty, ReferenceType } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';

export function ManyToMany(options: ManyToManyOptions): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);
    const meta = storage[entity];
    meta.properties = meta.properties || {};

    if (!options.entity) {
      throw new Error(`'@ManyToMany({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    const property = { name: propertyName, reference: ReferenceType.MANY_TO_MANY, owner: !!options.inversedBy };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToManyOptions extends PropertyOptions {
  entity: () => string | Function;
  owner?: boolean;
  inversedBy?: string;
  mappedBy?: string;
}
