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

export function Index<T extends object, H extends string>(options: IndexOptions<T, H> = {}) {
  return createDecorator(options, false);
}

export function Unique<T extends object, H extends string>(options: UniqueOptions<T, H> = {}) {
  return createDecorator(options, true);
}
