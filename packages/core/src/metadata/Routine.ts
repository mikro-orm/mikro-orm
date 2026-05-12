import { RoutineMetadata, type RoutineConfig } from '../typings.js';

/**
 * Class-less routine declaration. Pass instances of this class via the `routines` config
 * option to register stored procedures or functions without decorators.
 *
 * The `@Routine` decorator from `@mikro-orm/decorators/{legacy,es}` shares the name — both
 * declare a routine, but the decorator targets a class while this is the class-less form.
 *
 * @example
 * ```ts
 * const HashUser = new Routine({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: { name: { type: 'string' }, salt: { type: 'string' } },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: 'SELECT SHA1(CONCAT(name, salt))',
 * });
 *
 * await MikroORM.init({
 *   entities: [User],
 *   routines: [HashUser],
 * });
 * ```
 */
export class Routine<T = any> {
  readonly meta: RoutineMetadata<T>;

  constructor(config: RoutineConfig) {
    this.meta = RoutineMetadata.fromConfig<T>(config);
  }

  /** Type guard that recognises {@link Routine} instances. */
  static is(item: unknown): item is Routine {
    return item instanceof Routine;
  }
}
