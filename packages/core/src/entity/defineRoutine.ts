import { RoutineMetadata, type RoutineConfig } from '../typings.js';

/** Wrapper around {@link RoutineMetadata} returned by {@link defineRoutine}. */
export interface RoutineDefinition {
  /** @internal */
  readonly meta: RoutineMetadata;
}

/**
 * Schema-less helper for declaring a stored procedure or function without a class.
 * Sibling of {@link defineEntity}; produces a {@link RoutineMetadata} object that is
 * registered via the dedicated `routines` config option (separate from `entities`,
 * the same way `subscribers` is its own slot).
 *
 * @example
 * ```ts
 * const HashUser = defineRoutine({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: { name: { type: 'string' }, salt: { type: 'string' } },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: (p) => `SELECT SHA1(CONCAT(${p.name}, ${p.salt}))`,
 * });
 *
 * await MikroORM.init({
 *   entities: [User],
 *   routines: [HashUser],
 * });
 * ```
 */
export function defineRoutine(config: RoutineConfig): RoutineDefinition {
  return { meta: RoutineMetadata.fromConfig(config) };
}
