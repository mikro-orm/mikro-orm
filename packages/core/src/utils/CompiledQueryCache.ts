import type { Dictionary, EntityMetadata, EntityProperty, FilterDef, PopulateOptions } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import type { Type } from '../types/Type.js';
import { Reference } from '../entity/Reference.js';
import { helper } from '../entity/wrap.js';
import { Utils } from './Utils.js';

const SEP = '\u0001';
const SLOT_KINDS = new Set(['string', 'number', 'bigint', 'date']);
// longer `$in` lists are not cached
const MAX_LIST_SIZE = 512;
// every size of a list that is not keyed by its bucket is a separate entry, so longer ones are not cached
const MAX_UNBUCKETED_LIST_SIZE = 32;
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
  // `findAll()` passes its condition as the `where` argument too
  'where',
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
// `$in` lists of the last key that are keyed by their size bucket, `undefined` when bucketing is disabled
let lists: CompiledQueryList[] | undefined;
let functionIds: WeakMap<object, number> | undefined;
let functionCounter = 0;

function kindOf(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  return value instanceof Date ? 'date' : typeof value;
}

/** Prefixes a name with its length, so names containing the separators of the key cannot collide with other shapes. */
function nameKey(name: string): string {
  return name.length + '#' + name;
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

/**
 * Describes the shape of a condition and collects its values into `leaves`. A `$in`/`$nin` list is keyed by its size
 * rounded up to a power of two, so lists of similar sizes share one entry. Its leaves are filled up to that size, the
 * placeholders of the missing items are cut from the SQL again before the query is executed.
 */
function whereKey(value: unknown, leaves: unknown[], list = false): string {
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
    if (lists && value.length > MAX_LIST_SIZE) {
      bail = true;
      return '';
    }

    const start = leaves.length;
    let key = '[';
    let uniform = true;
    let first: string | undefined;

    for (let i = 0; i < value.length; i++) {
      const item = whereKey(value[i], leaves);
      first ??= item;
      uniform &&= item === first;
      key += item + ',';
    }

    // only lists of scalar values (or entities) of the same kind, each contributing a single value
    if (!list || !lists || !uniform || value.length === 0 || leaves.length - start !== value.length) {
      bail ||= !!lists && value.length > MAX_UNBUCKETED_LIST_SIZE;
      return key + ']';
    }

    const size = 2 ** (32 - Math.clz32(value.length - 1));
    const last = leaves[leaves.length - 1];
    lists.push({ start, length: value.length, size });

    for (let i = value.length; i < size; i++) {
      leaves.push(last);
    }

    return '(' + size + first + ')';
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
      key += nameKey(k) + ':' + whereKey((value as Dictionary)[k], leaves, k === '$in' || k === '$nin') + ',';
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

/** Mirrors `whereKey()`, replacing every collected leaf with its sentinel. Bucketed lists get all sentinels of their bucket. */
function substitute(
  value: unknown,
  sentinels: unknown[],
  pos: { idx: number; sizes?: Map<number, number> },
  list = false,
): unknown {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return sentinels[pos.idx++];
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    const size = list ? pos.sizes?.get(pos.idx) : undefined;

    if (size !== undefined) {
      return sentinels.slice(pos.idx, (pos.idx += size));
    }

    return value.map(item => substitute(item, sentinels, pos));
  }

  const proto = Object.getPrototypeOf(value);

  if (!(value instanceof Date) && (proto === Object.prototype || proto === null)) {
    const ret: Dictionary = {};

    for (const k in value) {
      ret[k] = substitute((value as Dictionary)[k], sentinels, pos, k === '$in' || k === '$nin');
    }

    return ret;
  }

  return sentinels[pos.idx++];
}

function optionKey(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return '"' + nameKey(value);
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
    key += nameKey(k) + ':' + optionKey((value as Dictionary)[k]) + ',';
  }

  return key + '}';
}

/** Keys the `filters` option, the arguments of a filter are only passed to its callback so they are not part of it. */
function filtersOptionKey(value: unknown): string {
  if (!Utils.isPlainObject(value)) {
    return optionKey(value);
  }

  let key = '{';

  for (const k in value) {
    key += nameKey(k) + ':' + (Utils.isPlainObject(value[k]) ? 'O' : optionKey(value[k])) + ',';
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

/** @internal invocation of a filter callback, repeated on every execution of the compiled query */
export interface CompiledFilterCall {
  filter: FilterDef;
  entity: string;
  type: 'read' | 'update' | 'delete';
  /** shape of the returned condition */
  shape: string;
}

/** @internal condition a filter callback returned when replayed for a cache hit */
export interface ReplayedFilterCond {
  call: CompiledFilterCall;
  cond: Dictionary;
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
  /** processed options that differ from the prepared ones */
  overrides?: Dictionary;
  populate?: PopulateOptions<any>[];
  /** set when the outcome depends on something the cache key cannot see */
  dynamic?: boolean;
  /** `filters` option of the call, set for dry runs */
  filters?: unknown;
  /** set for the dry run that replaces the values with placeholders */
  recording?: CompiledQueryRecording;
  /** filter callbacks invoked by a dry run, in order, and the values of the conditions they returned */
  filterCalls?: CompiledFilterCall[];
  filterLeaves?: unknown[];
}

/** @internal `$in`/`$nin` list keyed by its size bucket */
export interface CompiledQueryList {
  /** index of its first value in the leaves */
  start: number;
  /** number of values in the call */
  length: number;
  /** size of the bucket, the leaves are filled up to it */
  size: number;
}

/** @internal placeholders of a bucketed list in the compiled SQL */
interface CompiledQueryListRun {
  /** index of the list in the key */
  list: number;
  /** index of its first parameter */
  param: number;
  /** end offsets of its placeholders in the SQL */
  ends: number[];
}

/** @internal outcome of a cache lookup, with `params` when the compiled query can be executed */
export interface CompiledQueryLookup {
  entry: CompiledQueryEntry;
  leaves: unknown[];
  /** number of `leaves` coming from the call itself, the rest comes from the filter callbacks */
  base: number;
  where: unknown;
  /** bucketed lists of the condition */
  lists: CompiledQueryList[];
  /** SQL for the sizes of the lists of this call, set together with `params` */
  sql?: string;
  /** options before the EntityManager processed them */
  prepared: Dictionary;
  query?: CompiledQuery;
  params?: unknown[];
  /** compile the query the regular way too and compare */
  verify?: boolean;
  recording?: CompiledQueryRecording;
  /** options for the driver call only, so they do not leak to the queries of the loader */
  internal?: Dictionary;
  /** conditions of the replayed filter callbacks, reused for the joined filters */
  filterConds?: ReplayedFilterCond[];
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
    /** filter callbacks to invoke before binding, their values follow the ones of the call */
    readonly filterCalls: CompiledFilterCall[] | undefined,
    /** whether the joined filters hold values of the filter callbacks, so they need to be computed for every call */
    readonly joinedFilters: boolean,
    /** placeholders of the bucketed lists, in the order they appear in the SQL */
    readonly runs: CompiledQueryListRun[] = [],
  ) {}

  /**
   * Returns the SQL for the actual sizes of the lists and removes the parameters filling their buckets,
   * so the query is the same as the one compiled the regular way.
   */
  resolve(lists: CompiledQueryList[], params: unknown[]): string {
    const { sql, runs } = this;
    let ret = '';
    let pos = 0;

    // backwards, so the parameter indexes stay valid
    for (let i = runs.length - 1; i >= 0; i--) {
      const { length, size } = lists[runs[i].list];

      if (length < size) {
        params.splice(runs[i].param + length, size - length);
      }
    }

    for (const run of runs) {
      const { length, size } = lists[run.list];

      if (length < size) {
        ret += sql.substring(pos, run.ends[length - 1]);
        pos = run.ends[size - 1];
      }
    }

    return pos === 0 ? sql : ret + sql.substring(pos);
  }

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

function sameFilterCalls(a?: CompiledFilterCall[], b?: CompiledFilterCall[]): boolean {
  if (!a || !b) {
    return a === b;
  }

  return (
    a.length === b.length &&
    a.every((call, i) => {
      const other = b[i];
      return (
        call.filter === other.filter &&
        call.entity === other.entity &&
        call.type === other.type &&
        call.shape === other.shape
      );
    })
  );
}

/** @internal recording of the second sighting of a cache key */
export class CompiledQueryRecording {
  readonly #sentinels = new Map<unknown, { slot: number; raw?: boolean; conversion?: CompiledQueryConversion }>();
  readonly #seed = 2 ** 40 + Math.floor(Math.random() * 2 ** 40);
  #slots = 0;
  #ambiguous = false;
  /** capture of the real query */
  readonly compilation: QueryCompilation;
  readonly where: unknown;
  readonly options: Dictionary;

  constructor(
    readonly leaves: unknown[],
    where: unknown,
    /** prepared options before the EntityManager processed them */
    readonly prepared: Dictionary,
    readonly lists: CompiledQueryList[] = [],
  ) {
    this.compilation = { dry: false };
    const sentinels = this.createSentinels(leaves);
    const pos = { idx: 0, sizes: new Map(lists.map(list => [list.start, list.size])) };
    this.where = substitute(where, sentinels, pos);
    this.options = { ...prepared };

    for (const k in prepared) {
      if ((k === 'limit' || k === 'offset') && prepared[k] > 0) {
        this.options[k] = sentinels[pos.idx++];
      }
    }
  }

  private createSentinels(leaves: unknown[]): unknown[] {
    return leaves.map(leaf => {
      const idx = this.#slots++;
      let sentinel: unknown;

      if (typeof leaf === 'string') {
        sentinel = `__mikro_orm_slot_${this.#seed}_${idx}__`;
      } else if (typeof leaf === 'number') {
        sentinel = this.#seed + idx;
      } else if (typeof leaf === 'bigint') {
        sentinel = BigInt(this.#seed + idx);
      } else {
        // spread by days so date-only types keep the values distinct
        sentinel = new Date((this.#seed % 1e12) + idx * 86_400_000 * 3);
      }

      this.#sentinels.set(valueKey(sentinel), { slot: idx, raw: true });
      return sentinel;
    });
  }

  /**
   * Finds the placeholders of the bucketed lists in the SQL compiled for full buckets. Returns `undefined` when
   * they cannot be cut out reliably, i.e. when a list is not rendered as its values separated by commas.
   */
  private findListRuns(sql: string, slots: number[]): CompiledQueryListRun[] | undefined {
    const runs: CompiledQueryListRun[] = [];

    if (this.lists.length === 0) {
      return runs;
    }

    const starts: number[] = [];
    const ends: number[] = [];

    // same rules as `Platform.formatQuery()`: `?` is a value, `??` an identifier and `\\?` a literal question mark
    for (let idx = sql.indexOf('?'); idx !== -1; idx = sql.indexOf('?', idx)) {
      if (sql[idx - 1] === '\\') {
        idx++;
        continue;
      }

      starts.push(idx);
      ends.push((idx += sql[idx + 1] === '?' ? 2 : 1));
    }

    for (let i = 0; i < slots.length; i++) {
      const idx = this.lists.findIndex(list => slots[i] >= list.start && slots[i] < list.start + list.size);

      if (idx === -1) {
        continue;
      }

      const { start, size } = this.lists[idx];

      // the whole list has to follow, value by value, otherwise a part of it would be left behind when it shrinks
      for (let k = 0; k < size; k++) {
        if (slots[i + k] !== start + k || (k > 0 && sql.substring(ends[i + k - 1], starts[i + k]) !== ', ')) {
          return undefined;
        }
      }

      runs.push({ list: idx, param: i, ends: ends.slice(i, i + size) });
      i += size - 1;
    }

    return runs;
  }

  /** Stores the processed options of the real query, before the driver or the loader get to touch them. */
  capture(options: Dictionary): void {
    const compilation = this.compilation;
    compilation.overrides = {};

    for (const k of Object.keys(options)) {
      if (k === 'populate') {
        compilation.populate = clonePopulate(options[k]);
      } else if (options[k] !== this.prepared[k]) {
        compilation.overrides[k] = deepFreeze(Utils.copy(options[k]));
      }
    }
  }

  /** Replaces the values of a condition returned by a filter callback with placeholders. */
  substituteFilter(cond: unknown, leaves: unknown[]): unknown {
    return substitute(cond, this.createSentinels(leaves), { idx: 0 });
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
      this.#ambiguous = true;
    } else if (existing?.conversion) {
      const c = existing.conversion;
      this.#ambiguous ||= c.type !== conversion.type || c.key !== key || !c.fromQuery !== !fromQuery;
    } else if (existing) {
      existing.conversion = conversion;
    } else {
      this.#sentinels.set(valueKey(output), { slot: source.slot, conversion });
    }
  }

  /**
   * Builds the compiled query from the real and the dry compilation, `undefined` when they cannot be reconciled.
   * With filter callbacks, the `reference` is another dry run with the values those callbacks returned, as the ones
   * used by the real query are not known.
   */
  build(dry: QueryCompilation, platform: Platform, reference?: QueryCompilation): CompiledQuery | undefined {
    const real = this.compilation;
    const ref = reference ?? real;

    if (
      this.#ambiguous ||
      dry.dynamic ||
      ref.dynamic ||
      real.count !== 1 ||
      dry.count !== 1 ||
      ref.count !== 1 ||
      !real.overrides ||
      real.sql !== ref.sql ||
      !!dry.filterCalls !== !!reference ||
      !sameFilterCalls(dry.filterCalls, reference?.filterCalls)
    ) {
      return undefined;
    }

    const leaves = reference ? [...this.leaves, ...reference.filterLeaves!] : this.leaves;
    let overrides = real.overrides;
    let joinedFilters = false;

    if (reference && overrides.populateFilter !== undefined) {
      overrides = { ...overrides, populateFilter: undefined };
      joinedFilters = true;
    }

    const slots: number[] = [];
    const constants: unknown[] = [];
    const conversions: (CompiledQueryConversion | undefined)[] = [];
    let hasConversions = false;

    for (let i = 0; i < dry.params!.length; i++) {
      const source = this.#sentinels.get(valueKey(dry.params![i]));
      slots.push(source ? source.slot : -1);
      constants.push(source ? undefined : dry.params![i]);
      conversions.push(source?.conversion);
      hasConversions ||= !!source?.conversion;
    }

    const runs = this.findListRuns(dry.sql!, slots);

    if (!runs) {
      return undefined;
    }

    const query = new CompiledQuery(
      dry.sql!,
      dry.state,
      overrides,
      real.populate,
      slots,
      constants,
      conversions,
      hasConversions,
      dry.filterCalls,
      joinedFilters,
      runs,
    );
    const bound = query.bind(leaves, platform);
    const params = bound && [...bound];

    // the recipe has to reproduce the real query, otherwise some value was transformed on the way
    if (!bound || query.resolve(this.lists, params!) !== ref.sql || !Utils.equals(params, ref.params)) {
      return undefined;
    }

    // a conversion mapping the value and its placeholder to the same parameter cannot be told apart from a constant
    if (hasConversions && conversions.some((c, i) => c && Utils.equals(bound[i], dry.params![i]))) {
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
  #lists: CompiledQueryList[] = [];
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
    lists = this.#lists = [];
    let key = kind + meta._id + SEP + filters + SEP + whereKey(where, leaves);
    lists = undefined;

    for (const k in options) {
      const value = options[k];

      if (value === undefined || IGNORED_OPTIONS.has(k)) {
        continue;
      }

      if (k === 'limit' || k === 'offset') {
        if (typeof value !== 'number') {
          return undefined;
        }

        // only positive values are plain parameters, zero, negative and `NaN` change the generated SQL
        if (!(value > 0)) {
          key += SEP + k + '=' + value;
          continue;
        }

        leaves.push(value);
        key += SEP + k + 'n';
      } else if (k === 'populateWhere') {
        // an empty condition is what the loader passes to child queries
        if (value !== 'all' && !(Utils.isPlainObject(value) && Reflect.ownKeys(value).length === 0)) {
          return undefined;
        }

        key += SEP + (value === 'all' ? 'pw' : 'pw{}');
      } else if (k === 'filters') {
        key += SEP + k + '=' + filtersOptionKey(value);
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

  /** Bucketed `$in`/`$nin` lists of the last `lookup()` call. */
  get lists(): CompiledQueryList[] {
    return this.#lists;
  }

  /**
   * Computes the shape of a condition returned by a filter callback and collects its values into `leaves`.
   * Returns `undefined` when the condition cannot be part of a compiled query.
   */
  static filterKey(cond: unknown, leaves: unknown[]): string | undefined {
    bail = false;
    const key = whereKey(cond, leaves);

    return bail ? undefined : key;
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
