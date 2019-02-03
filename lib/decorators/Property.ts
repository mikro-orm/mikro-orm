import { EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../MetadataStorage';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = MetadataStorage.getMetadata(entity);

    const meta = storage[entity];
    options.name = propertyName;
    meta.properties = meta.properties || {};
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
  };
}

export type PropertyOptions = {
  name?: string;
  fieldName?: string;
  referenceColumnName?: string;
  type?: any;
  onUpdate?: () => any;
}
