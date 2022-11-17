import type { Constructor, Dictionary } from '../typings';
import { MetadataStorage } from '../metadata';

export function Embeddable(options: EmbeddableOptions = {}) {
  return function <T>(target: T & Dictionary) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.class = target as unknown as Constructor<T>;
    meta.name = target.name;
    meta.embeddable = true;
    Object.assign(meta, options);

    return target;
  };
}

export type EmbeddableOptions = {
  discriminatorColumn?: string;
  discriminatorMap?: Dictionary<string>;
  discriminatorValue?: number | string;
  abstract?: boolean;
};
