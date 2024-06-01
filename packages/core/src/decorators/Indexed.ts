import { MetadataStorage } from '../metadata';
import type { AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils/Utils';
import type { DeferMode } from '../enums';

function createDecorator<T>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
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

interface BaseOptions<T> {
  name?: string;
  properties?: keyof T | (keyof T)[];
  options?: Dictionary;
  expression?: string;
}

export interface UniqueOptions<T> extends BaseOptions<T> {
  deferMode?: DeferMode | `${DeferMode}`;
}

export interface IndexOptions<T> extends BaseOptions<T> {
  type?: string;
}
