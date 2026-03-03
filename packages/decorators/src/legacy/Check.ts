import { type CheckConstraint, type Dictionary, type EntityClass } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Check<T>(options: CheckConstraint<T>) {
  return function (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) {
    const meta = getMetadataFromDecorator<T>(
      (propertyName ? (target as EntityClass<T>).constructor : target) as T & Dictionary,
    );
    options.property ??= propertyName as string;
    meta.checks.push(options);

    if (!propertyName) {
      return target;
    }

    return undefined as any;
  };
}
