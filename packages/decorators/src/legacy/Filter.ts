import { MetadataStorage, type FilterDef, type EntityName, type EntityClass } from '@mikro-orm/core';

export function Filter<T extends EntityClass<unknown>>(options: FilterDef<T>) {
  return function (target: T) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.filters[options.name] = options as FilterDef;
  };
}

export type FilterOptions<T, E = T extends EntityClass<infer P> ? P : T> = FilterDef<E & EntityName<E>>;
