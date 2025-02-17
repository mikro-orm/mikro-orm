import { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { EntityClass, Dictionary, AutoPath } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import type { DeferMode } from '../enums.js';

function createDecorator<T extends object>(options: IndexOptions<T, string> | UniqueOptions<T, string>, unique: boolean) {
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

export function Index<T extends object, H extends string>(options: IndexOptions<T, H> = {}) {
  return createDecorator(options, false);
}

export function Unique<T extends object, H extends string>(options: UniqueOptions<T, H> = {}) {
  return createDecorator(options, true);
}

type MaybeArray<T> = T | T[];
type Properties<T, H extends string> = MaybeArray<AutoPath<T, H>>;
interface BaseOptions<T, H extends string> {
  name?: string;
  properties?: (T extends EntityClass<infer P> ? Properties<P, H> : Properties<T, H>);
  options?: Dictionary;
  expression?: string;
}

export interface UniqueOptions<T, H extends string = string> extends BaseOptions<T, H> {
  deferMode?: DeferMode | `${DeferMode}`;
}

export interface IndexOptions<T, H extends string = string> extends BaseOptions<T, H> {
  type?: string;
}
