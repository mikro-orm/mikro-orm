import { RoutineMetadata, type RoutineArgsOf, type RoutineConfig, type RoutineReturnOf } from '../typings.js';

/**
 * Stored routine declaration. Pass instances of this class via the `routines` config option
 * to register stored procedures or functions.
 *
 * The `TArgs` and `TReturn` type parameters carry the call-site argument and return types and
 * are inferred from the literal config — callers don't have to thread generics through
 * `em.callRoutine(...)`. Use {@link withTypes} when the inferred type is too loose (e.g. an
 * `object` return that should be a concrete shape rather than `Dictionary`).
 *
 * @example Inferred types
 * ```ts
 * const HashUser = new Routine({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: {
 *     name: { type: 'varchar(255)', runtimeType: 'string' },
 *     salt: { type: 'varchar(255)', runtimeType: 'string' },
 *   },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: 'SELECT SHA1(CONCAT(name, salt))',
 * });
 *
 * await MikroORM.init({ entities: [User], routines: [HashUser] });
 *
 * // args typed as `{ name: string; salt: string }`, result inferred as `string`:
 * const hash = await em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' });
 * ```
 *
 * @example Refining the inferred type
 * ```ts
 * interface UserStats { totalOrders: number; lastOrderAt: Date }
 *
 * const GetStats = new Routine({
 *   name: 'get_user_stats',
 *   type: 'function',
 *   params: { user_id: { type: 'int', runtimeType: 'number' } },
 *   returns: { runtimeType: 'object', columnType: 'json' },
 *   body: '...',
 * }).withTypes<{ user_id: number }, UserStats>();
 *
 * const stats = await em.callRoutine(GetStats, { user_id: 1 });
 * stats.totalOrders; // typed as `number`
 * ```
 */
export class Routine<
  const TConfig extends RoutineConfig = RoutineConfig,
  TArgs = RoutineArgsOf<TConfig>,
  TReturn = RoutineReturnOf<TConfig>,
> {
  readonly meta: RoutineMetadata;

  constructor(config: TConfig) {
    this.meta = RoutineMetadata.fromConfig(config);
  }

  /**
   * Refines the inferred args/return types without changing the runtime declaration. Pure
   * compile-time — the returned value is the same `Routine` instance, only the static types
   * differ. Use when {@link RoutineArgsOf} / {@link RoutineReturnOf} infer too loose a type
   * (e.g. `object` should be a concrete shape, or `runtimeType` is left unset).
   */
  withTypes<TNewArgs = TArgs, TNewReturn = TReturn>(): Routine<TConfig, TNewArgs, TNewReturn> {
    return this as unknown as Routine<TConfig, TNewArgs, TNewReturn>;
  }

  /** Type guard that recognises {@link Routine} instances. */
  static is(item: unknown): item is Routine {
    return item instanceof Routine;
  }
}
