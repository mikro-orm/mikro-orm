import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { Utils } from '../utils/Utils.js';
import type { CheckConstraint, Dictionary, EntityClass } from '../typings.js';

export function Check<T>(options: CheckOptions<T>) {
  return function (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) {
    const meta = MetadataStorage.getMetadataFromDecorator<T>((propertyName ? (target as EntityClass<T>).constructor : target) as T & Dictionary);
    options.property ??= propertyName as string;
    meta.checks.push(options);

    if (!propertyName) {
      return target;
    }

    return Utils.propertyDecoratorReturnValue();
  };
}

export type CheckOptions<T = any> = CheckConstraint<T>;
