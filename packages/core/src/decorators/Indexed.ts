import { MetadataStorage } from '../metadata';
import type { Dictionary, AutoPath, IndexCallback, UniqueCallback } from '../typings';
import { Utils } from '../utils/Utils';
import type { DeferMode } from '../enums';

function createDecorator<T>(options: IndexOptions<T> | UniqueOptions<T>, unique: boolean) {
  return function (target: any, propertyName?: string) {
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

export function Index<T>(options: IndexOptions<T> = {}) {
  return createDecorator(options, false);
}

export function Unique<T>(options: UniqueOptions<T> = {}) {
  return createDecorator(options, true);
}

type MaybeArray<T> = T | T[];
type Properties<T, H extends string> = MaybeArray<AutoPath<T, H>>;
interface BaseOptions<T> {
  name?: string;
  properties?: string | string[];
  options?: Dictionary;
}

export interface UniqueOptions<T> extends BaseOptions<T> {
  deferMode?: DeferMode | `${DeferMode}`;
  expression?: string | UniqueCallback<T>;
}

export interface IndexOptions<T> extends BaseOptions<T> {
  type?: string;
  expression?: string | IndexCallback<T>;
}
