import type { Dictionary, EntityMetadata, EntityProperty, FilterDef, PopulateOptions } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import type { Type } from '../types/Type.js';
import { Reference } from '../entity/Reference.js';
import { helper } from '../entity/wrap.js';
import { Utils } from './Utils.js';

const SEP = '\u0001';
const SLOT_KINDS = new Set(['string', 'number', 'bigint', 'date']);
// options that never change the generated SQL, they are read from the live call on every execution
const IGNORED_OPTIONS = new Set([
  'ctx',
  'logging',
  'loggerContext',
  'signal',
  'inflightQueryAbortStrategy',
  'refresh',
  'flushMode',
  'connectionType',
  'disableIdentityMap',
  'visited',
  'strict',
  'failHandler',
  '_compile',
]);
// options whose handling depends on runtime values in ways the cache does not model
const BYPASS_OPTIONS = new Set([
  'cache',
  'lockMode',
  'lockVersion',
  'lockTableAliases',
  'first',
  'last',
  'before',
  'after',
  'overfetch',
  'unionWhere',
  'unionWhereStrategy',
  'groupBy',
  'having',
  'populateFilter',
  '_partitionLimit',
]);

let bail = false;
let functionIds: WeakMap<object, number> | undefined;
let functionCounter = 0;

function kindOf(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  return value instanceof Date ? 'date' : typeof value;
}

function valueKey(value: unknown): unknown {
  return value instanceof Date ? `date:${value.getTime()}` : value;
}

/** Returns the primary key of an entity (or reference) with a simple scalar primary key. */
function entityKey(value: object): string | number | bigint | undefined {
  if (!Utils.isEntity(value, true)) {
    return undefined;
  }

  const wrapped = helper(Reference.unwrapReference(value));

  if (wrapped.__meta.compositePK) {
    return undefined;
  }

  const pk = wrapped.getPrimaryKey() as unknown;

  return typeof pk === 'string' || typeof pk === 'number' || typeof pk === 'bigint' ? pk : undefined;
}

function whereKey(value: unknown, leaves: unknown[]): string {
  switch (typeof value) {
    case 'string':
      leaves.push(value);
      return 's';
    case 'number':
      leaves.push(value);
      return 'n';
    case 'bigint':
      leaves.push(value);
      return 'i';
    case 'boolean':
      return value ? 'T' : 'F';
    case 'undefined':
      return 'U';
    case 'object':
      break;
    default:
      bail = true;
      return '';
  }

  if (value === null) {
    return 'N';
  }

  if (Array.isArray(value)) {
    let key = '[';

    for (let i = 0; i < value.length; i++) {
      key += whereKey(value[i], leaves) + ',';
    }

    return key + ']';
  }

  if (value instanceof Date) {
    leaves.push(value);
    return 'd';
  }

  const proto = Object.getPrototypeOf(value);

  if (proto === Object.prototype || proto === null) {
    // symbol keys are raw query fragments
    if (Object.getOwnPropertySymbols(value).length > 0) {
      bail = true;
      return '';
    }

    let key = '{';

    for (const k in value) {
      key += k + ':' + whereKey((value as Dictionary)[k], leaves) + ',';
    }

    return key + '}';
  }

  const pk = entityKey(value);

  if (pk === undefined) {
    bail = true;
    return '';
  }

  leaves.push(pk);

  return 'e' + helper(Reference.unwrapReference(value)).__meta._id + (typeof pk)[0];
}

/** Mirrors `whereKey()`, replacing every collected leaf with its sentinel. */
function substitute(value: unknown, sentinels: unknown[], pos: { idx: number }): unknown {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return sentinels[pos.idx++];
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => substitute(item, sentinels, pos));
  }

  const proto = Object.getPrototypeOf(value);

  if (!(value instanceof Date) && (proto === Object.prototype || proto === null)) {
    const ret: Dictionary = {};

    for (const k in value) {
      ret[k] = substitute((value as Dictionary)[k], sentinels, pos);
    }

    return ret;
  }

  return sentinels[pos.idx++];
}

function optionKey(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return '"' + value + '"';
    case 'number':
    case 'boolean':
      return '' + value;
    case 'bigint':
      return value + 'n';
    case 'undefined':
      return 'U';
    case 'object':
      break;
    default:
      bail = true;
      return '';
  }

  if (value === null) {
    return 'N';
  }

  if (Array.isArray(value)) {
    let key = '[';

    for (let i = 0; i < value.length; i++) {
      key += optionKey(value[i]) + ',';
    }

    return key + ']';
  }

  if (value instanceof Date) {
    return 'd' + value.getTime();
  }

  const proto = Object.getPrototypeOf(value);

  if ((proto !== Object.prototype && proto !== null) || Object.getOwnPropertySymbols(value).length > 0) {
    bail = true;
    return '';
  }

  let key = '{';

  for (const k in value) {
    key += k + ':' + optionKey((value as Dictionary)[k]) + ',';
  }

  return key + '}';
}

/** @internal */
export function clonePopulate<T>(populate: PopulateOptions<T>[]): PopulateOptions<T>[] {
  const ret = new Array(populate.length);

  for (let i = 0; i < populate.length; i++) {
    const hint = populate[i];
    ret[i] = hint.children ? { ...hint, children: clonePopulate(hint.children) } : { ...hint };
  }

  return ret;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }

  return value;
}

/** @internal */
export type CompiledQueryKind = 'find' | 'findOne' | 'count';

/** @internal custom type conversion applied to a parameter at bind time */
export interface CompiledQueryConversion {
  type: Type<unknown>;
  key?: string;
  fromQuery?: boolean;
  kind: string;
}

/** @internal state of one query compilation, shared between the EntityManager and the driver */
export interface QueryCompilation {
  /** compile only, do not execute */
  dry: boolean;
  /** how many queries the driver executed for this call */
  count?: number;
  sql?: string;
  params?: readonly unknown[];
  /** driver specific state needed to execute and map the query again */
  state?: unknown;
  /** prepared options before the EntityManager processed them, set when the options should be captured */
  prepared?: Dictionary;
  /** processed options that differ from the prepared ones */
  overrides?: Dictionary;
  populate?: PopulateOptions<any>[];
  /** set when the outcome depends on something the cache key cannot see */
  dynamic?: boolean;
}

/** @internal outcome of a cache lookup, with `params` when the compiled query can be executed */
export interface CompiledQueryLookup {
  entry: CompiledQueryEntry;
  leaves: unknown[];
  where: unknown;
  /** options before the EntityManager processed them */
  prepared: Dictionary;
  query?: CompiledQuery;
  params?: unknown[];
  /** compile the query the regular way too and compare */
  verify?: boolean;
  recording?: CompiledQueryRecording;
}

/** @internal */
export class CompiledQuery {
  constructor(
    readonly sql: string,
    readonly state: unknown,
    readonly overrides: Dictionary,
    readonly populate: PopulateOptions<any>[] | undefined,
    readonly slots: number[],
    readonly constants: unknown[],
    readonly conversions: (CompiledQueryConversion | undefined)[],
    readonly hasConversions: boolean,
  ) {}

  /** Returns the parameters for given leaf values, or `undefined` when a converted value changes its kind. */
  bind(leaves: unknown[], platform: Platform): unknown[] | undefined {
    const { slots, constants } = this;
    const params = new Array(slots.length);

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      params[i] = slot === -1 ? constants[i] : leaves[slot];
    }

    if (this.hasConversions) {
      for (let i = 0; i < slots.length; i++) {
        const conversion = this.conversions[i];

        if (conversion) {
          params[i] = conversion.type.convertToDatabaseValue(params[i], platform, {
            fromQuery: conversion.fromQuery,
            key: conversion.key,
            mode: 'query',
          });

          if (kindOf(params[i]) !== conversion.kind) {
            return undefined;
          }
        }
      }
    }

    return params;
  }
}

/** @internal */
export interface CompiledQueryEntry {
  seen: number;
  tick: number;
  /** value of `seen` when the recording in progress started */
  pending?: number;
  bypass?: boolean;
  query?: CompiledQuery;
}

/** @internal recording of the second sighting of a cache key */
export class CompiledQueryRecording {
  readonly #sentinels = new Map<unknown, { slot: number; raw?: boolean; conversion?: CompiledQueryConversion }>();
  /** capture of the real query */
  readonly compilation: QueryCompilation;
  ambiguous = false;
  where: unknown;
  options!: Dictionary;

  constructor(
    readonly leaves: unknown[],
    where: unknown,
    /** prepared options before the EntityManager processed them */
    readonly prepared: Dictionary,
  ) {
    this.compilation = { dry: false, prepared };
    const seed = 2 ** 40 + Math.floor(Math.random() * 2 ** 40);
    const sentinels = leaves.map((leaf, idx) => {
      let sentinel: unknown;

      if (typeof leaf === 'string') {
        sentinel = `__mikro_orm_slot_${seed}_${idx}__`;
      } else if (typeof leaf === 'number') {
        sentinel = seed + idx;
      } else if (typeof leaf === 'bigint') {
        sentinel = BigInt(seed + idx);
      } else {
        // spread by days so date-only types keep the values distinct
        sentinel = new Date((seed % 1e12) + idx * 86_400_000 * 3);
      }

      this.#sentinels.set(valueKey(sentinel), { slot: idx, raw: true });
      return sentinel;
    });

    const pos = { idx: 0 };
    this.where = substitute(where, sentinels, pos);
    this.options = { ...prepared };

    for (const k in prepared) {
      if ((k === 'limit' || k === 'offset') && prepared[k] !== undefined) {
        this.options[k] = sentinels[pos.idx++];
      }
    }
  }

  /** Called for every custom type conversion while this recording is active. */
  onConvert(input: unknown, output: unknown, prop: EntityProperty, key?: string, fromQuery?: boolean): void {
    const source = this.#sentinels.get(valueKey(input));

    if (!source) {
      return;
    }

    const kind = kindOf(output);
    const existing = this.#sentinels.get(valueKey(output));
    const conversion = { type: prop.customType!, key, fromQuery, kind };

    if (!SLOT_KINDS.has(kind) || !source.raw || (existing && existing.slot !== source.slot)) {
      this.ambiguous = true;
    } else if (existing?.conversion) {
      const c = existing.conversion;
      this.ambiguous ||= c.type !== conversion.type || c.key !== key || !c.fromQuery !== !fromQuery;
    } else if (existing) {
      existing.conversion = conversion;
    } else {
      this.#sentinels.set(valueKey(output), { slot: source.slot, conversion });
    }
  }

  /** Builds the compiled query from the real and the dry compilation, `undefined` when they cannot be reconciled. */
  build(dry: QueryCompilation, platform: Platform): CompiledQuery | undefined {
    const real = this.compilation;

    if (
      this.ambiguous ||
      dry.dynamic ||
      real.count !== 1 ||
      dry.count !== 1 ||
      !real.overrides ||
      real.sql !== dry.sql ||
      real.params!.length !== dry.params!.length
    ) {
      return undefined;
    }

    const slots: number[] = [];
    const constants: unknown[] = [];
    const conversions: (CompiledQueryConversion | undefined)[] = [];
    let hasConversions = false;

    for (let i = 0; i < dry.params!.length; i++) {
      const source = this.#sentinels.get(valueKey(dry.params![i]));

      if (source) {
        slots.push(source.slot);
        constants.push(undefined);
        conversions.push(source.conversion);
        hasConversions ||= !!source.conversion;
      } else if (Utils.equals(dry.params![i], real.params![i])) {
        slots.push(-1);
        constants.push(real.params![i]);
        conversions.push(undefined);
      } else {
        return undefined;
      }
    }

    const query = new CompiledQuery(
      real.sql!,
      dry.state,
      real.overrides!,
      real.populate,
      slots,
      constants,
      conversions,
      hasConversions,
    );
    const bound = query.bind(this.leaves, platform);

    // the recipe has to reproduce the parameters of the real query, otherwise some value was transformed on the way
    if (!bound || !Utils.equals(bound, real.params)) {
      return undefined;
    }

    return query;
  }
}

/**
 * Caches compiled SQL of `em.find()`, `em.findOne()` and `em.count()` calls. The key describes the shape of the call
 * (entity, property and operator names, value types, options), the values are bound to the cached SQL as parameters.
 * This is not a result cache, every call still executes its query.
 *
 * @internal
 */
export class CompiledQueryCache {
  /** recording in progress, at most one at a time */
  static recording?: CompiledQueryRecording;

  readonly #entries = new Map<string, CompiledQueryEntry>();
  readonly #size: number;
  #tick = 0;
  readonly verify: boolean;

  constructor(size: number, verify: boolean) {
    this.#size = size;
    this.verify = verify;
  }

  get size(): number {
    return this.#entries.size;
  }

  clear(): void {
    this.#entries.clear();
  }

  /**
   * Computes the cache key and collects the bindable values into `leaves`.
   * Returns `undefined` when the call cannot be cached.
   */
  lookup(
    kind: CompiledQueryKind,
    meta: EntityMetadata,
    where: unknown,
    options: Dictionary,
    filters: string,
    leaves: unknown[],
  ): CompiledQueryEntry | undefined {
    bail = false;
    let key = kind + meta._id + SEP + filters + SEP + whereKey(where, leaves);

    for (const k in options) {
      const value = options[k];

      if (value === undefined || IGNORED_OPTIONS.has(k)) {
        continue;
      }

      if (k === 'limit' || k === 'offset') {
        if (typeof value !== 'number') {
          return undefined;
        }

        leaves.push(value);
        key += SEP + k + (value === 0 ? '0' : 'n');
      } else if (k === 'populateWhere') {
        // an empty condition is what the loader passes to child queries
        if (value !== 'all' && !(Utils.isPlainObject(value) && Reflect.ownKeys(value).length === 0)) {
          return undefined;
        }

        key += SEP + (value === 'all' ? 'pw' : 'pw{}');
      } else if (BYPASS_OPTIONS.has(k)) {
        if (value != null && value !== false) {
          return undefined;
        }
      } else {
        key += SEP + k + '=' + optionKey(value);
      }
    }

    if (bail) {
      return undefined;
    }

    let entry = this.#entries.get(key);

    if (!entry) {
      entry = { seen: 0, tick: ++this.#tick };
      this.#entries.set(key, entry);

      if (this.#entries.size > this.#size) {
        this.#entries.delete(this.#entries.keys().next().value!);
      }
    } else if (this.#tick - entry.tick > this.#size >> 1) {
      // keep the entries in use at the young end of the map
      entry.tick = ++this.#tick;
      this.#entries.delete(key);
      this.#entries.set(key, entry);
    }

    entry.seen++;

    return entry.bypass ? undefined : entry;
  }

  /** Describes the set of filters registered on an EntityManager, part of the cache key. */
  static filtersKey(filters: Dictionary<FilterDef>): string {
    let key = '';

    for (const name of Object.keys(filters)) {
      const filter = filters[name];
      bail = false;
      let cond = typeof filter.cond === 'function' ? '' : optionKey(filter.cond);

      if (cond === '' || bail) {
        functionIds ??= new WeakMap();
        let id = functionIds.get(filter.cond);

        if (id === undefined) {
          functionIds.set(filter.cond, (id = ++functionCounter));
        }

        cond = '#' + id;
      }

      const entity = Utils.asArray(filter.entity as unknown[]).map(e => Utils.className(e as string));
      key += `${name}:${cond}:${filter.default}:${filter.args}:${filter.strict}:${entity.join()};`;
    }

    return key;
  }
}

/** Stores the processed options of a compilation, before the driver or the loader get to touch them. */
export function captureOptions(compilation: QueryCompilation, options: Dictionary): void {
  if (!compilation.prepared) {
    return;
  }

  compilation.overrides = {};

  for (const k of Object.keys(options)) {
    if (k === 'populate') {
      compilation.populate = clonePopulate(options[k]);
    } else if (k !== '_compile' && options[k] !== compilation.prepared[k]) {
      compilation.overrides[k] = deepFreeze(Utils.copy(options[k]));
    }
  }
}
