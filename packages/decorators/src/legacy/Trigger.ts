import { type TriggerDef, type Dictionary, type EntityClass } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

/** Defines a database trigger on an entity class (legacy TypeScript decorator). */
export function Trigger<T>(
  options: TriggerDef<T>,
): (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : never) => any {
  return function (target: T): any {
    const meta = getMetadataFromDecorator<T>(target as T & Dictionary);
    meta.triggers.push(options);
    return target;
  };
}
