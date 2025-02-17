import { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Dictionary, FilterDef } from '../typings.js';

export function Filter<T>(options: FilterDef) {
  return function <U>(target: U & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.filters[options.name] = options;

    return target;
  };
}
