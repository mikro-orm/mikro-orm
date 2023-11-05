import { inspect } from 'util';
import { Utils } from './Utils';
import type { Dictionary, EntityKey, AnyString } from '../typings';

export class RawQueryFragment {

  static #rawQueryCache = new Map<string, RawQueryFragment>();
  static #index = 0;

  #used = false;
  readonly #key: string;

  constructor(
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {
    this.#key = `[raw]: ${this.sql}${this.params ? ` (#${RawQueryFragment.#index++})` : ''}`;
  }

  as(alias: string): RawQueryFragment {
    return new RawQueryFragment(`${this.sql} as ${alias}`, this.params);
  }

  valueOf(): string {
    throw new Error(`Trying to modify raw SQL fragment: '${this.sql}'`);
  }

  toJSON() {
    throw new Error(`Trying to serialize raw SQL fragment: '${this.sql}'`);
  }

  toString() {
    RawQueryFragment.#rawQueryCache.set(this.#key, this);
    return this.#key;
  }

  /** @internal */
  use() {
    if (this.#used) {
      throw new Error(`Cannot reassign already used RawQueryFragment: '${this.sql}'`);
    }

    this.#used = true;
  }

  clone(): RawQueryFragment {
    return new RawQueryFragment(this.sql, this.params);
  }

  static isKnownFragment(key: string) {
    return this.#rawQueryCache.has(key);
  }

  static getKnownFragment(key: string | RawQueryFragment, cleanup = true) {
    if (key instanceof RawQueryFragment) {
      return key;
    }

    const raw = this.#rawQueryCache.get(key);

    if (raw && cleanup) {
      this.#rawQueryCache.delete(key);
    }

    return raw;
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

Object.defineProperties(RawQueryFragment.prototype, {
  __raw: { value: true, enumerable: false },
});

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
export function raw<T extends object = any, R = any>(sql: EntityKey<T> | EntityKey<T>[] | AnyString | ((alias: string) => string) | RawQueryFragment, params?: unknown[] | Dictionary<unknown>): R {
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
    params = [];

    for (const [key, value] of pairs) {
      sql = sql.replace(':' + key, '?');
      params.push(value);
    }
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

sql.ref = <T extends object>(...keys: string[]) => raw<T, RawQueryFragment>('??', [keys.join('.')]);
