import { PropertyOptions } from './Property';
import { EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../MetadataStorage';

export function OneToMany(options: OneToManyOptions): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = MetadataStorage.getMetadata(entity);

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
