import { MetadataStorage, type CheckConstraint, type Dictionary, type EntityClass } from '@mikro-orm/core';

export function Check<T>(options: CheckOptions<T>) {
  return function (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) {
    const meta = MetadataStorage.getMetadataFromDecorator<T>((propertyName ? (target as EntityClass<T>).constructor : target) as T & Dictionary);
    options.property ??= propertyName as string;
    meta.checks.push(options);

    if (!propertyName) {
      return target;
    }

    return undefined;
  };
}

// FIXME dedupe
export type CheckOptions<T = any> = CheckConstraint<T>;
