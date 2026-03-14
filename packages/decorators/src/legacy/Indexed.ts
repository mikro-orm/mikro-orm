import { type EntityClass, type IndexOptions, type UniqueOptions } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

function createDecorator<T extends object>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
  return function (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T): any {
    const meta = getMetadataFromDecorator(propertyName ? target.constructor : target);
    options.properties ??= propertyName;
    const key = unique ? 'uniques' : 'indexes';
    meta[key].push(options as any);

    if (!propertyName) {
      return target;
    }

    return undefined;
  };
}

/** Defines a database index on a property or entity class (legacy TypeScript decorator). */
export function Index<T extends object, H extends string>(
  options: IndexOptions<T, H> = {},
): (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) => any {
  return createDecorator(options, false);
}

/** Defines a unique constraint on a property or entity class (legacy TypeScript decorator). */
export function Unique<T extends object, H extends string>(
  options: UniqueOptions<T, H> = {},
): (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) => any {
  return createDecorator(options, true);
}
