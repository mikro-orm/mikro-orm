import { type Dictionary, type EntityClass, RoutineMetadata, type RoutineConfig } from '@mikro-orm/core';
import { getRoutineMetadataFromDecorator } from '../utils.js';

/**
 * Declares a stored procedure or function on a class (legacy TypeScript decorator).
 *
 * Parameters are declared inline via the `params` option (the same shape used by
 * `defineRoutine`). `@Property()` decorators on the class are not used by routines.
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
export function Routine<T>(
  config: RoutineConfig<T>,
): (target: T, propertyName?: T extends EntityClass<unknown> ? undefined : never) => any {
  return function (target: T): any {
    const meta = getRoutineMetadataFromDecorator<T>(target as T & Dictionary);
    const built = RoutineMetadata.fromConfig<T>(config);
    Object.assign(meta, built);
    meta.class = target as any;
    meta.className = (target as any).name;
    return target;
  };
}
