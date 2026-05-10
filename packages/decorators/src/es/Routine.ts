import {
  type Constructor,
  type EntityCtor,
  type EntityClass,
  RoutineMetadata,
  type RoutineConfig,
} from '@mikro-orm/core';
import { getRoutineMetadataFromDecorator } from '../utils.js';

/**
 * Declares a stored procedure or function on a class (TC39 decorator).
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
export function Routine<Owner extends EntityClass<unknown> & EntityCtor>(
  config: RoutineConfig<Owner>,
): (target: Owner, context: ClassDecoratorContext<Owner>) => void {
  return function (target: Owner, context: ClassDecoratorContext<Owner>): void {
    const meta = getRoutineMetadataFromDecorator(target);
    const built = RoutineMetadata.fromConfig<Owner>(config);
    Object.assign(meta, built);
    meta.class = target as unknown as Constructor<Owner>;
    meta.className = context.name as string;
  };
}
