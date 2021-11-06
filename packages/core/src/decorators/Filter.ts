import { MetadataStorage } from '../metadata';
import type { Dictionary, FilterDef } from '../typings';

export function Filter<T>(options: FilterDef<T>) {
  return function <U>(target: U & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.filters[options.name] = options as unknown as FilterDef<U>;

    return target;
  };
}
