import { MetadataStorage } from '../metadata';
import { ReferenceKind } from '../enums';
import type { PropertyOptions } from './Property';
import type { EntityProperty, AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils/Utils';

export function Enum(options: EnumOptions<AnyEntity> | (() => Dictionary) = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    options = options instanceof Function ? { items: options } : options;
    meta.properties[propertyName] = Object.assign({ name: propertyName, kind: ReferenceKind.SCALAR, enum: true }, options) as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface EnumOptions<T> extends PropertyOptions<T> {
  items?: (number | string)[] | (() => Dictionary);
  array?: boolean;
}
