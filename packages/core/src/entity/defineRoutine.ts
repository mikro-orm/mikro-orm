import { RoutineMetadata, type RoutineConfig } from '../typings.js';

/** Wrapper around {@link RoutineMetadata} returned by {@link defineRoutine}. */
export interface RoutineDefinition {
  /** @internal */
  readonly meta: RoutineMetadata;
}

/**
 * Schema-less helper for declaring a stored procedure or function without a class.
 * Sibling of {@link defineEntity}; produces a {@link RoutineMetadata} object that can be
 * passed alongside entities in `MikroORM.init({ entities: [...] })`.
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
 * ```
 */
export function defineRoutine(config: RoutineConfig): RoutineDefinition {
  return { meta: RoutineMetadata.fromConfig(config) };
}
