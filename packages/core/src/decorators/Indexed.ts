import { MetadataStorage } from '../metadata';
import type { EntityClass, Dictionary } from '../typings';
import { Utils } from '../utils/Utils';
import type { DeferMode } from '../enums';

function createDecorator<T extends object>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
  return function (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : keyof T) {
    const meta = MetadataStorage.getMetadataFromDecorator(propertyName ? target.constructor : target);
    options.properties ??= propertyName;
    const key = unique ? 'uniques' : 'indexes';
    meta[key].push(options as any);

    if (!propertyName) {
      return target;
    }

    return Utils.propertyDecoratorReturnValue();
  };
}

export function Index<T extends object>(options: IndexOptions<T> = {}) {
  return createDecorator(options, false);
}

export function Unique<T extends object>(options: UniqueOptions<T> = {}) {
  return createDecorator(options, true);
}

type Properties<T> = keyof T | (keyof T)[];
interface BaseOptions<T> {
  name?: string;
  properties?: T extends EntityClass<infer P> ? Properties<P> : Properties<T>;
  options?: Dictionary;
  expression?: string;
}

export interface UniqueOptions<T> extends BaseOptions<T> {
  deferMode?: DeferMode | `${DeferMode}`;
}

export interface IndexOptions<T> extends BaseOptions<T> {
  type?: string;
}
