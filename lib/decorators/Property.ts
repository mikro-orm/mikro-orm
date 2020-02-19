import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';
import { EntityName, EntityProperty, AnyEntity } from '../typings';

export function Property(options: PropertyOptions = {}): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    options.name = options.name || propertyName;
    const prop = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
    const desc = Object.getOwnPropertyDescriptor(target, propertyName) || {};
    prop.getter = !!desc.get;
    prop.setter = !!desc.set;

    if (desc.value instanceof Function) {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = propertyName;
    }

    meta.properties[prop.name] = prop;
  };
}

export type PropertyOptions = {
  name?: string;
  fieldName?: string;
  columnType?: string;
  type?: any;
  length?: any;
  onCreate?: () => any;
  onUpdate?: () => any;
  default?: any;
  nullable?: boolean;
  unsigned?: boolean;
  persist?: boolean;
  hidden?: boolean;
  version?: boolean;
  index?: boolean | string;
  unique?: boolean | string;
  primary?: boolean;
  serializedPrimaryKey?: boolean;
};

export interface ReferenceOptions<T extends AnyEntity<T>> extends PropertyOptions {
  entity?: string | (() => EntityName<T>);
  cascade?: Cascade[];
  eager?: boolean;
}
