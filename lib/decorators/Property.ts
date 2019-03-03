import { EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../metadata/MetadataStorage';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options.name = propertyName;
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
