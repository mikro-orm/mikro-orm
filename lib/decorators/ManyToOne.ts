import { getMetadataStorage } from '../MikroORM';
import { PropertyOptions } from './Property';
import { EntityProperty, IEntity, ReferenceType } from './Entity';

export function ManyToOne(options: ManyToOneOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    meta.properties = meta.properties || {};
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity?: () => string | Function,
  fk?: string;
}
