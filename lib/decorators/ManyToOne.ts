import { PropertyOptions } from './Property';
import { Cascade, EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../metadata/MetadataStorage';

export function ManyToOne(options: ManyToOneOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = MetadataStorage.getMetadata(entity);

    const meta = storage[entity];
    meta.properties = meta.properties || {};
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST] };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity?: () => string | Function,
  fk?: string;
  cascade?: Cascade[];
}
