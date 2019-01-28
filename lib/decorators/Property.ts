import { getMetadataStorage } from '../MikroORM';
import { EntityProperty, IEntity, ReferenceType } from './Entity';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

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
  [prop: string]: any;
}
