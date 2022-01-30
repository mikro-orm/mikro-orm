import { MetadataStorage } from '../metadata';
import type { AnyEntity } from '../typings';

export function Check<T>(options: CheckOptions) {
  return function <U>(target: U) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    meta.checks.push(options);

    return target;
  };
}

export interface CheckOptions {
  name: string;
  expression: string;
}
