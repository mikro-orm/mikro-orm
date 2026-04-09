import { Utils } from './Utils.js';
import type { AnyString, Dictionary, EntityKey } from '../typings.js';

// Brand lives on the prototype so JSON payloads — whose proto is
// `Object.prototype` — cannot forge it. String key, not a `Symbol.for(...)`,
// so each CJS/ESM copy of this module independently installs it on its own
// prototype without publishing a global key for the marker that controls raw
// SQL assembly. The string is namespaced so it does not collide with property
// names users might independently install on their own prototypes.
const RAW_FRAGMENT_BRAND = '__mikroOrmRawFragment';

// Back-references from a fragment's symbol key to the fragment itself, shared
// across CJS/ESM module copies via globalThis: when one copy creates a fragment
// via `raw('…')` and stores its symbol in a where-clause object key, the other
// copy still needs to recover the original fragment to assemble SQL.
const REGISTRY_KEY = Symbol.for('@mikro-orm/core/RawQueryFragment.references');
const rawQueryReferences: WeakMap<RawQueryFragmentSymbol, RawQueryFragment> = ((globalThis as any)[REGISTRY_KEY] ??=
  new WeakMap());

declare const rawFragmentSymbolBrand: unique symbol;

/** Branded symbol type used as a unique key for tracking raw SQL fragments in object properties. */
export type RawQueryFragmentSymbol = symbol & {
  readonly [rawFragmentSymbolBrand]: true;
};

/** Checks whether the given value is a `RawQueryFragment` instance. */
export function isRaw(value: unknown): value is RawQueryFragment {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  // Fast path: intra-module instances and their subclasses.
  // eslint-disable-next-line no-use-before-define
  if (value instanceof RawQueryFragment) {
    return true;
  }

  // Walk the prototype chain starting from the *prototype* (not the value) so
  // own-property spoofing from JSON payloads cannot forge the brand. Stop at
  // `Object.prototype`, which is never branded — that bails plain objects,
  // JSON payloads, and built-ins like `Date`/`Array`/`Map` at depth 1.
  for (let p = Object.getPrototypeOf(value); p != null && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
    if (Object.hasOwn(p, RAW_FRAGMENT_BRAND)) {
      return true;
    }
  }

  return false;
}

/** Represents a raw SQL fragment with optional parameters, usable as both a value and an object key via Symbol coercion. */
export class RawQueryFragment<Alias extends string = string> {
  #key?: RawQueryFragmentSymbol;
  /** @internal Type-level only - used to track the alias for type inference */
  declare private readonly __alias?: Alias;

  constructor(
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {}

  /** Returns a unique symbol key for this fragment, creating and caching it on first access. */
  get key(): RawQueryFragmentSymbol {
    if (!this.#key) {
      this.#key = Symbol(this.toJSON()) as RawQueryFragmentSymbol;
      rawQueryReferences.set(this.#key, this);
    }

    return this.#key;
  }

  /** Creates a new fragment with an alias appended via `as ??`. */
  as<A extends string>(alias: A): RawQueryFragment<A> {
    return new RawQueryFragment<A>(`${this.sql} as ??`, [...this.params, alias]);
  }

  [Symbol.toPrimitive](hint: 'string'): RawQueryFragmentSymbol;
  [Symbol.toPrimitive](hint: string): RawQueryFragmentSymbol | never {
    // if a fragment is converted to string (used as an object key), return a unique symbol
    // and save a weak reference to map so we can retrieve it when compiling the query
    if (hint === 'string') {
      return this.key;
    }

    throw new Error(`Trying to modify raw SQL fragment: '${this.sql}'`);
  }

  get [Symbol.toStringTag](): string {
    return this.toJSON();
  }

  toJSON(): string {
    return `raw('${this.sql}')`;
  }

  clone(): this {
    return this;
  }

  /** Checks whether the given value is a symbol that maps to a known raw query fragment. */
  static isKnownFragmentSymbol(key: unknown): key is RawQueryFragmentSymbol {
    return typeof key === 'symbol' && rawQueryReferences.has(key as RawQueryFragmentSymbol);
  }

  /** Checks whether an object has any symbol keys that are known raw query fragments. */
  static hasObjectFragments(object: unknown): boolean {
    return (
      Utils.isPlainObject(object) &&
      Object.getOwnPropertySymbols(object).some(symbol => this.isKnownFragmentSymbol(symbol))
    );
  }

  /** Checks whether the given value is a RawQueryFragment instance or a known fragment symbol. */
  static isKnownFragment(key: unknown): key is RawQueryFragment | symbol {
    return isRaw(key) || this.isKnownFragmentSymbol(key);
  }

  /** Retrieves the RawQueryFragment associated with the given key (instance or symbol). */
  static getKnownFragment(key: unknown): RawQueryFragment | undefined {
    if (isRaw(key)) {
      return key;
    }

    if (typeof key !== 'symbol') {
      return;
    }

    return rawQueryReferences.get(key as RawQueryFragmentSymbol);
  }

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')](): { sql: string; params?: unknown[] } {
    if (this.params) {
      return { sql: this.sql, params: this.params };
    }

    return { sql: this.sql };
  }
}

// Non-enumerable so the brand is skipped by JSON/Object.keys/for-in, and locked
// down (non-writable, non-configurable) so in-process code cannot delete or
// overwrite it and thereby silently disable `isRaw` recognition for every
// fragment in the process. Subclasses don't need mutability here — they inherit
// the brand via the prototype chain, and sibling-copy classes install their own
// brand on their own prototype (a different object), so lockdown only blocks
// tampering with the canonical marker.
Object.defineProperty(RawQueryFragment.prototype, RAW_FRAGMENT_BRAND, {
  value: true,
  writable: false,
  configurable: false,
});

export { RawQueryFragment as Raw };

/** @internal */
export const ALIAS_REPLACEMENT = '[::alias::]';

/** @internal */
export const ALIAS_REPLACEMENT_RE = '\\[::alias::\\]';

/**
 * Creates raw SQL query fragment that can be assigned to a property or part of a filter. This fragment is represented
 * by `RawQueryFragment` class instance that can be serialized to a string, so it can be used both as an object value
 * and key. When serialized, the fragment key gets cached and only such cached key will be recognized by the ORM.
 * This adds a runtime safety to the raw query fragments.
 *
 * > **`raw()` helper is required since v6 to use a raw fragment in your query, both through EntityManager and QueryBuilder.**
 *
 * ```ts
 * // as a value
 * await em.find(User, { time: raw('now()') });
 *
 * // as a key
 * await em.find(User, { [raw('lower(name)')]: name.toLowerCase() });
 *
 * // value can be empty array
 * await em.find(User, { [raw('(select 1 = 1)')]: [] });
 * ```
 *
 * The `raw` helper supports several signatures, you can pass in a callback that receives the current property alias:
 *
 * ```ts
 * await em.find(User, { [raw(alias => `lower(${alias}.name)`)]: name.toLowerCase() });
 * ```
 *
 * You can also use the `sql` tagged template function, which works the same, but supports only the simple string signature:
 *
 * ```ts
 * await em.find(User, { [sql`lower(name)`]: name.toLowerCase() });
 * ```
 *
 * When using inside filters, you might have to use a callback signature to create new raw instance for every filter usage.
 *
 * ```ts
 * @Filter({ name: 'long', cond: () => ({ [raw('length(perex)')]: { $gt: 10000 } }) })
 * ```
 *
 * The `raw` helper can be used within indexes and uniques to write database-agnostic SQL expressions. In that case, you can use `'??'` to tag your database identifiers (table name, column names, index name, ...) inside your expression, and pass those identifiers as a second parameter to the `raw` helper. Internally, those will automatically be quoted according to the database in use:
 *
 * ```ts
 * // On postgres, will produce: create index "index custom_idx_on_name" on "library.author" ("country")
 * // On mysql, will produce: create index `index custom_idx_on_name` on `library.author` (`country`)
 * @Index({ name: 'custom_idx_on_name', expression: (table, columns) => raw(`create index ?? on ?? (??)`, ['custom_idx_on_name', table, columns.name]) })
 * @Entity({ schema: 'library' })
 * export class Author { ... }
 * ```
 *
 * You can also use the `quote` tag function to write database-agnostic SQL expressions. The end-result is the same as using the `raw` function regarding database identifiers quoting, only to have a more elegant expression syntax:
 *
 * ```ts
 * @Index({ name: 'custom_idx_on_name', expression: (table, columns) => quote`create index ${'custom_idx_on_name'} on ${table} (${columns.name})` })
 * @Entity({ schema: 'library' })
 * export class Author { ... }
 * ```
 */
export function raw<R = RawQueryFragment & symbol, T extends object = any>(
  sql: EntityKey<T> | EntityKey<T>[] | AnyString | ((alias: string) => string) | RawQueryFragment,
  params?: readonly unknown[] | Dictionary<unknown>,
): R {
  if (isRaw(sql)) {
    return sql as R;
  }

  if (sql instanceof Function) {
    sql = sql(ALIAS_REPLACEMENT);
  }

  if (sql === '??' && Array.isArray(params)) {
    return new RawQueryFragment(sql, params) as R;
  }

  if (Array.isArray(sql)) {
    // for composite FK we return just a simple string
    return Utils.getPrimaryKeyHash(sql) as R;
  }

  if (typeof params === 'object' && !Array.isArray(params)) {
    const pairs = Object.entries(params);
    const objectParams = [];

    for (const [key, value] of pairs) {
      sql = sql.replace(`:${key}:`, '??');
      sql = sql.replace(`:${key}`, '?');
      objectParams.push(value);
    }

    return new RawQueryFragment(sql, objectParams) as R;
  }

  return new RawQueryFragment(sql, params) as R;
}

/**
 * Alternative to the `raw()` helper allowing to use it as a tagged template function for the simple cases.
 *
 * ```ts
 * // as a value
 * await em.find(User, { time: sql`now()` });
 *
 * // as a key
 * await em.find(User, { [sql`lower(name)`]: name.toLowerCase() });
 *
 * // value can be empty array
 * await em.find(User, { [sql`(select 1 = 1)`]: [] });
 *
 * // with type parameter for assignment without casting
 * entity.date = sql<Date>`now()`;
 * ```
 */
export function sql<R = RawQueryFragment & symbol>(sql: readonly string[], ...values: unknown[]): R {
  return raw<R>(sql.join('?'), values);
}

/** Creates a raw SQL function expression wrapping the given key (e.g., `lower(name)`). */
export function createSqlFunction<R = RawQueryFragment & symbol, T extends object = any>(
  func: string,
  key: string | ((alias: string) => string),
): R {
  if (typeof key === 'string') {
    return raw<R, T>(`${func}(${key})`);
  }

  return raw<R, T>(a => `${func}(${key(a)})`);
}

sql.ref = <T extends object = any>(...keys: string[]): RawQueryFragment & symbol =>
  raw<RawQueryFragment & symbol, T>('??', [keys.join('.')]);
sql.now = (length?: number): RawQueryFragment & symbol =>
  raw('current_timestamp' + (length == null ? '' : `(${length})`));
sql.lower = <R = RawQueryFragment & symbol, T extends object = any>(key: string | ((alias: string) => string)): R =>
  createSqlFunction<R, T>('lower', key);
sql.upper = <R = RawQueryFragment & symbol, T extends object = any>(key: string | ((alias: string) => string)): R =>
  createSqlFunction<R, T>('upper', key);

/**
 * Tag function providing quoting of db identifiers (table name, columns names, index names, ...).
 *
 * Within the template literal on which the tag function is applied, all placeholders are considered to be database identifiers, and will thus be quoted as so according to the database in use.
 *
 * ```ts
 * // On postgres, will produce: create index "index custom_idx_on_name" on "library.author" ("name")
 * // On mysql, will produce: create index `index custom_idx_on_name` on `library.author` (`name`)
 * @Index({ name: 'custom_idx_on_name', expression: (table, columns, indexName) => quote`create index ${indexName} on ${table} (${columns.name})` })
 * @Entity({ schema: 'library' })
 * export class Author { ... }
 * ```
 */
export function quote(
  expParts: readonly string[],
  ...values: (string | { toString(): string })[]
): RawQueryFragment & symbol {
  return raw(expParts.join('??'), values);
}
