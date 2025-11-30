import { type FilterDef, type EntityClass } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Filter<T extends EntityClass<unknown>>(options: FilterDef<T>) {
  return function (target: T) {
    const meta = getMetadataFromDecorator(target);
    meta.filters[options.name] = options as FilterDef;
  };
}
