import type {
  RoutineArgsOf,
  RoutineConfig,
  RoutineDataAccess,
  RoutineIgnoreField,
  RoutineKind,
  RoutineParamMap,
  RoutineProperty,
  RoutineReturnOf,
  RoutineReturns,
  RoutineSecurity,
} from '../typings.js';
import { resolveRoutineCustomType } from '../typings.js';
import type { Type } from '../types/Type.js';
import type { Raw } from '../utils/RawQueryFragment.js';

/**
 * Stored routine declaration. Pass instances of this class via the `routines` config option
 * to register stored procedures or functions.
 *
 * `Routine` carries the declaration directly — there is no separate metadata indirection. The
 * instance itself is the identity used at lookup time and the object drivers receive at call
 * time. `TArgs` and `TReturn` are inferred from the literal config, so call sites get full type
 * safety without threading generics through `em.callRoutine(...)`. Use {@link Routine.create}
 * when the inferred type is too loose (e.g. an `object` return that should be a concrete shape
 * rather than `Dictionary`) — it accepts explicit override generics.
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
 * @example Refining the inferred type — see {@link Routine.create}
 */
export class Routine<
  const TConfig extends RoutineConfig = RoutineConfig,
  TArgs = RoutineArgsOf<TConfig>,
  TReturn = RoutineReturnOf<TConfig>,
> {
  /** Routine name in the database. */
  readonly routineName: string;
  /** Whether this is a stored procedure or function. */
  readonly type: RoutineKind;
  /** Optional schema/namespace (PostgreSQL, MSSQL, Oracle). */
  readonly schema?: string;
  readonly comment?: string;
  readonly security?: RoutineSecurity;
  readonly definer?: string;
  readonly deterministic?: boolean;
  readonly dataAccess?: RoutineDataAccess;
  readonly language?: string;
  readonly body?: string | Raw | ((params: RoutineParamMap<any>, em: any) => string | Raw);
  readonly expression?: string;
  readonly bodyJs?: (params: any) => unknown;
  readonly returns?: RoutineReturns;
  /** Resolved Type instance for scalar function returns, when `returns.customType` is declared. */
  readonly returnCustomType?: Type<unknown>;
  readonly ignoreSchemaChanges?: RoutineIgnoreField[];
  /** Parameters in declaration order. */
  readonly params: RoutineProperty[];

  constructor(config: TConfig) {
    this.routineName = config.name;
    this.type = config.type;
    this.schema = config.schema;
    this.comment = config.comment;
    this.security = config.security;
    this.definer = config.definer;
    this.deterministic = config.deterministic;
    this.dataAccess = config.dataAccess;
    this.language = config.language;
    this.body = config.body;
    this.expression = config.expression;
    this.bodyJs = config.bodyJs;
    this.returns = config.returns;
    this.ignoreSchemaChanges = config.ignoreSchemaChanges;

    this.params = Object.entries(config.params ?? {}).map(([name, opts], index) => ({
      name,
      direction: opts.direction ?? 'in',
      type: opts.type ?? 'string',
      runtimeType: opts.runtimeType ?? 'any',
      columnTypes: [opts.type ?? 'string'],
      customType: resolveRoutineCustomType(opts.customType),
      ref: opts.ref,
      length: opts.length,
      precision: opts.precision,
      scale: opts.scale,
      nullable: opts.nullable,
      defaultRaw: opts.defaultRaw,
      index,
    }));

    if (config.returns && typeof config.returns === 'object' && 'customType' in config.returns) {
      this.returnCustomType = resolveRoutineCustomType(config.returns.customType);
    }
  }

  /**
   * Returns a fresh `{ paramName: paramName }` mapping for body callbacks — body callbacks
   * receive this as their first argument so they can interpolate parameter names symbolically
   * without hard-coding them.
   */
  createParamMappingObject(): Record<string, string> {
    return this.params.reduce<Record<string, string>>((o, p) => {
      o[p.name as string] = p.name as string;
      return o;
    }, {});
  }

  /**
   * Constructs a routine and lets the caller override the inferred argument and/or return
   * types. Pure compile-time override — runtime behaviour is identical to `new Routine(config)`.
   * Use when {@link RoutineArgsOf} / {@link RoutineReturnOf} infer too loose a type (e.g. an
   * `object` return that should be a concrete shape, or `runtimeType` is left unset on params).
   *
   * Omit a generic to fall back to inference; pass `never` in the args slot to refine only the
   * return type. The order is `<TArgs, TReturn>`, matching the order on the class itself.
   *
   * @example Refine the return type only
   * ```ts
   * interface UserStats { totalOrders: number; lastOrderAt: Date }
   *
   * const GetStats = Routine.create<never, UserStats>({
   *   name: 'get_user_stats',
   *   type: 'function',
   *   params: { user_id: { type: 'int', runtimeType: 'number' } },
   *   returns: { runtimeType: 'object', columnType: 'json' },
   *   body: '...',
   * });
   *
   * const stats = await em.callRoutine(GetStats, { user_id: 1 });
   * stats.totalOrders; // typed as `number`
   * ```
   *
   * @example Refine both arg and return types
   * ```ts
   * const TwoSets = Routine.create<Record<string, never>, unknown[][]>({
   *   name: 'two_sets',
   *   type: 'procedure',
   *   params: {},
   *   body: 'select 1; select 2;',
   * });
   * ```
   */
  static create<TArgs = never, TReturn = never, const TConfig extends RoutineConfig = RoutineConfig>(
    config: TConfig,
  ): Routine<
    TConfig,
    [TArgs] extends [never] ? RoutineArgsOf<TConfig> : TArgs,
    [TReturn] extends [never] ? RoutineReturnOf<TConfig> : TReturn
  > {
    return new Routine(config) as unknown as Routine<
      TConfig,
      [TArgs] extends [never] ? RoutineArgsOf<TConfig> : TArgs,
      [TReturn] extends [never] ? RoutineReturnOf<TConfig> : TReturn
    >;
  }

  /** Type guard that recognises {@link Routine} instances. */
  static is(item: unknown): item is Routine {
    return item instanceof Routine;
  }
}
