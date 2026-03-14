import { type FilterDef, type EntityClass } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

/** Registers a named filter on an entity class (TC39 decorator). */
export function Filter<T extends EntityClass<unknown>>(options: FilterDef<T>): (target: T) => void {
  return function (target: T): void {
    const meta = getMetadataFromDecorator(target);
    meta.filters[options.name] = options as FilterDef;
  };
}
