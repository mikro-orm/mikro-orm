import { RoutineMetadata, type RoutineConfig } from '../typings.js';

/**
 * Class-less routine declaration that provides a programmatic API for defining stored
 * procedures and functions without decorators. Sibling of {@link EntitySchema}.
 *
 * @example
 * ```ts
 * const HashUser = new RoutineSchema({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: { name: { type: 'string' }, salt: { type: 'string' } },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: 'SELECT SHA1(CONCAT(name, salt))',
 * });
 * ```
 */
export class RoutineSchema<T = any> {
  readonly meta: RoutineMetadata<T>;

  constructor(config: RoutineConfig) {
    this.meta = RoutineMetadata.fromConfig<T>(config);
  }

  /** Type guard that recognises {@link RoutineSchema} instances and {@link defineRoutine} return values. */
  static is(item: unknown): item is RoutineSchema {
    return (
      item instanceof RoutineSchema ||
      (typeof item === 'object' &&
        item !== null &&
        'meta' in item &&
        (item as { meta: unknown }).meta instanceof RoutineMetadata)
    );
  }
}
