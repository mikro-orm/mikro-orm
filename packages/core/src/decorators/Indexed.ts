import { MetadataStorage } from '../metadata';
import type { AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils/Utils';

function createDecorator<T extends AnyEntity<T>>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
  return function (target: AnyEntity, propertyName?: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(propertyName ? target.constructor : target);
    options.properties = options.properties || propertyName as keyof T;
    const key = unique ? 'uniques' : 'indexes';
    meta[key].push(options as any);

    if (!propertyName) {
      return target;
    }

    return Utils.propertyDecoratorReturnValue();
  };
}

export function Index<T>(options: IndexOptions<T> = {}) {
  return createDecorator(options, false);
}

export function Unique<T>(options: UniqueOptions<T> = {}) {
  return createDecorator(options, true);
}

export interface UniqueOptions<T extends AnyEntity<T>> {
  name?: string;
  properties?: keyof T | (keyof T)[];
  options?: Dictionary;
}

export interface IndexOptions<T extends AnyEntity<T>> extends UniqueOptions<T> {
  type?: string;
  expression?: string;
}
