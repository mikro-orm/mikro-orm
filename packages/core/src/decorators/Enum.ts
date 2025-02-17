import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { ReferenceKind } from '../enums.js';
import type { PropertyOptions } from './Property.js';
import type { EntityProperty, AnyEntity, Dictionary, EntityKey } from '../typings.js';
import { Utils } from '../utils/Utils.js';

export function Enum<T extends object>(options: EnumOptions<AnyEntity> | (() => Dictionary) = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    options = options instanceof Function ? { items: options } : options;
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      enum: true,
      ...options,
    } as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface EnumOptions<T> extends PropertyOptions<T> {
  items?: (number | string)[] | (() => Dictionary);
  array?: boolean;
  /** for postgres, by default it uses text column with check constraint */
  nativeEnumName?: string;
}
