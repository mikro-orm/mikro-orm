import { EntityProperty, IEntity } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../entity';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    options.name = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
  };
}

export type PropertyOptions = {
  name?: string;
  fieldName?: string;
  type?: any;
  length?: any;
  onUpdate?: () => any;
  default?: any;
  unique?: boolean;
  nullable?: boolean;
  persist?: boolean;
}
