import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType, LoadStrategy } from '../entity';
import { EntityName, EntityProperty, AnyEntity, Constructor } from '../typings';
import { Type } from '../types';

export function Property<T>(options: PropertyOptions<T> = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    const desc = Object.getOwnPropertyDescriptor(target, propertyName) || {};
    MetadataValidator.validateSingleDecorator(meta, propertyName);
    const name = options.name || propertyName;

    if (propertyName !== name && !(desc.value instanceof Function)) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    options.name = propertyName;
    const prop = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
    prop.getter = !!desc.get;
    prop.setter = !!desc.set;

    if (desc.value instanceof Function) {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = propertyName;
      prop.name = name;
    }

    meta.properties[prop.name] = prop;
  };
}

export type PropertyOptions<T> = {
  name?: string;
  fieldName?: string;
  fieldNames?: string[];
  customType?: Type<any>;
  columnType?: string;
  type?: 'string' | 'number' | 'boolean' | 'bigint' | 'ObjectId' | string | unknown | bigint | Date | Constructor<Type<any>> | Type<any>;
  length?: number;
  onCreate?: (entity: T) => any;
  onUpdate?: (entity: T) => any;
  default?: string | number | boolean | null;
  defaultRaw?: string;
  formula?: string | ((alias: string) => string);
  nullable?: boolean;
  unsigned?: boolean;
  persist?: boolean;
  hidden?: boolean;
  version?: boolean;
  index?: boolean | string;
  unique?: boolean | string;
  lazy?: boolean;
  primary?: boolean;
  serializedPrimaryKey?: boolean;
};

export interface ReferenceOptions<T, O> extends PropertyOptions<O> {
  entity?: string | (() => EntityName<T>);
  cascade?: Cascade[];
  eager?: boolean;
  strategy?: LoadStrategy;
}
