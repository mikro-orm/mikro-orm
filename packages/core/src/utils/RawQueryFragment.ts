import { AsyncLocalStorage } from 'node:async_hooks';
import { inspect } from 'node:util';
import { Utils } from './Utils';
import type { AnyString, Dictionary, EntityKey } from '../typings';

export class RawQueryFragment {

  static #rawQueryCache = new Map<string, RawQueryFragment>();
  static #storage = new AsyncLocalStorage<Set<string>>();
  static #index = 0n;
  static cloneRegistry?: Set<string>;

  #assigned = false;
  #used = 0;
  readonly #key: string;

  constructor(
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {
    this.#key = `[raw]: ${this.sql} (#${RawQueryFragment.#index++})`;
  }

  as(alias: string): RawQueryFragment {
    // TODO: to be removed in v7
    /* istanbul ignore next */
    if (alias.startsWith('`') || alias.startsWith('"')) {
      return new RawQueryFragment(`${this.sql} as ${alias}`, this.params);
    }

    return new RawQueryFragment(`${this.sql} as ??`, [...this.params, alias]);
  }

  valueOf(): string {
    throw new Error(`Trying to modify raw SQL fragment: '${this.sql}'`);
  }

  toJSON() {
    return this.#key;
  }

  toString() {
    RawQueryFragment.#rawQueryCache.set(this.#key, this);
    this.#used++;
    return this.#key;
  }

  /** @internal */
  assign() {
    if (this.#assigned) {
      throw new Error(`Cannot reassign already used RawQueryFragment: '${this.sql}'`);
    }

    this.#assigned = true;
  }

  clone(): RawQueryFragment {
    RawQueryFragment.cloneRegistry?.add(this.#key);
    return new RawQueryFragment(this.sql, this.params);
  }

  static async run<T>(cb: (...args: any[]) => Promise<T>): Promise<T> {
    const removeStack = new Set<string>();
    const res = await this.#storage.run(removeStack, cb);
    removeStack.forEach(key => RawQueryFragment.remove(key));
    removeStack.clear();

    return res;
  }

  /**
   * @internal allows testing we don't leak memory, as the raw fragments cache needs to be cleared automatically
   */
  static checkCacheSize() {
    return this.#rawQueryCache.size;
  }

  static isKnownFragment(key: string | RawQueryFragment) {
    if (key instanceof RawQueryFragment) {
      return true;
    }

    return this.#rawQueryCache.has(key);
  }

  static getKnownFragment(key: string | RawQueryFragment, cleanup = true) {
    if (key instanceof RawQueryFragment) {
      return key;
    }

    const raw = this.#rawQueryCache.get(key);

    if (raw && cleanup) {
      this.remove(key);
    }

    return raw;
  }

  static remove(key: string) {
    const raw = this.#rawQueryCache.get(key);

    if (!raw) {
      return;
    }

    raw.#used--;

    if (raw.#used <= 0) {
      const removeStack = this.#storage.getStore();

      if (removeStack) {
        removeStack.add(key);
      } else {
        this.#rawQueryCache.delete(key);
      }
    }
  }

  /* istanbul ignore next */
  /** @ignore */
  [inspect.custom]() {
    if (this.params) {
      return { sql: this.sql, params: this.params };
    }

    return { sql: this.sql };
  }

}

export { RawQueryFragment as Raw };

Object.defineProperties(RawQueryFragment.prototype, {
  __raw: { value: true, enumerable: false },
});

export function isRaw(value: unknown): value is RawQueryFragment {
  return typeof value === 'object' && value !== null && '__raw' in value;
}

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
 */
export function raw<T extends object = any, R = any>(sql: EntityKey<T> | EntityKey<T>[] | AnyString | ((alias: string) => string) | RawQueryFragment, params?: readonly unknown[] | Dictionary<unknown>): R {
  if (sql instanceof RawQueryFragment) {
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
 * ```
 */
export function sql(sql: readonly string[], ...values: unknown[]) {
  return raw(sql.reduce((query, queryPart, i) => {
    const valueExists = i < values.length;
    const text = query + queryPart;

    return valueExists ? text + '?' : text;
  }, ''), values);
}

export function createSqlFunction<T extends object, R = string>(func: string, key: string | ((alias: string) => string)): R {
  if (typeof key === 'string') {
    return raw<T, R>(`${func}(${key})`);
  }

  return raw<T, R>(a => `${func}(${(key(a))})`);
}

sql.ref = <T extends object>(...keys: string[]) => raw<T, RawQueryFragment>('??', [keys.join('.')]);
sql.now = (length?: number) => raw<Date, string>('current_timestamp' + (length == null ? '' : `(${length})`));
sql.lower = <T extends object>(key: string | ((alias: string) => string)) => createSqlFunction('lower', key);
sql.upper = <T extends object>(key: string | ((alias: string) => string)) => createSqlFunction('upper', key);
