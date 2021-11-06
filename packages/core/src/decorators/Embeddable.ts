import type { Constructor, Dictionary } from '../typings';
import { MetadataStorage } from '../metadata';

export function Embeddable() {
  return function <T>(target: T & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.class = target as unknown as Constructor<T>;
    meta.name = target.name;
    meta.embeddable = true;

    return target;
  };
}
