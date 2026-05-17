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
 * Stored procedure or function declaration. Register instances via the `routines` config option
 * passed to `MikroORM.init`, then call them through `em.callRoutine(routine, args)`.
 *
 * `TArgs` and `TReturn` are inferred from the literal config, so `em.callRoutine` is fully typed
 * without threading generics through the call site. Reach for {@link Routine.create} when the
 * inferred type is too loose — typically an `object` return that should be a concrete shape
 * rather than `Dictionary`.
 *
 * @example
 * ```ts
 * const HashUser = new Routine({
 *   name: 'hash_user',
 *   type: 'function',
 *   params: {
 *     name: { type: 'varchar(255)' },
 *     salt: { type: 'varchar(255)' },
 *   },
 *   returns: { runtimeType: 'string', columnType: 'char(40)' },
 *   body: 'SELECT SHA1(CONCAT(name, salt))',
 * });
 *
 * await MikroORM.init({ entities: [User], routines: [HashUser] });
 *
 * // args typed as `{ name: string; salt: string }`, result typed as `string`:
 * const hash = await em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' });
 * ```
 */
export class Routine<
  const TConfig extends RoutineConfig = RoutineConfig,
  TArgs = RoutineArgsOf<TConfig>,
  TReturn = RoutineReturnOf<TConfig>,
> {
  readonly name: string;
  readonly type: RoutineKind;
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
  readonly returnCustomType?: Type<unknown>;
  readonly ignoreSchemaChanges?: RoutineIgnoreField[];
  readonly params: RoutineProperty[];

  constructor(config: TConfig) {
    this.name = config.name;
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

  /** Bare `{ paramName: paramName }` map. Body callbacks invoked through the schema pipeline receive a dialect-prefixed map (e.g. MSSQL's `@name`); this helper does not prefix. */
  createParamMappingObject(): Record<string, string> {
    return this.params.reduce<Record<string, string>>((o, p) => {
      o[p.name as string] = p.name as string;
      return o;
    }, {});
  }

  /**
   * Overrides the inferred TArgs/TReturn. Omit a generic to keep inference; pass `never` in the
   * args slot to refine only the return type.
   *
   * @example
   * ```ts
   * interface UserStats { totalOrders: number; lastOrderAt: Date }
   * const GetStats = Routine.create<never, UserStats>({
   *   name: 'get_user_stats',
   *   type: 'function',
   *   params: { user_id: { type: 'int', runtimeType: 'number' } },
   *   returns: { runtimeType: 'object', columnType: 'json' },
   *   body: '...',
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

  static is(item: unknown): item is Routine {
    return item instanceof Routine;
  }
}
