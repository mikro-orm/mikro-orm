import { type Dictionary, type EntityClass, type RoutineConfig } from '@mikro-orm/core';
import { getRoutineMetadataFromDecorator } from '../utils.js';

/**
 * Declares a stored procedure or function on a class (legacy TypeScript decorator).
 *
 * Parameters are declared inline via the `params` option (the same shape used by the
 * class-less `Routine` API). `@Property()` decorators on the class are not used by routines.
 *
 * @example
 * ```ts
 * @Routine({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: { name: { type: 'string' }, salt: { type: 'string' } },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: (p) => `SELECT SHA1(CONCAT(${p.name}, ${p.salt}))`,
 * })
 * class HashUser {}
 * ```
 */
export function Routine<T = any>(config: RoutineConfig<T>): <C extends EntityClass<unknown>>(target: C) => void {
  return function <C extends EntityClass<unknown>>(target: C): void {
    const meta = getRoutineMetadataFromDecorator<T>(target as unknown as T & Dictionary);
    meta.applyConfig(config);
    meta.class = target as any;
    meta.className = (target as { name: string }).name;
  };
}
