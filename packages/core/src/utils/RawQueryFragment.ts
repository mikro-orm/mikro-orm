import { Utils } from './Utils.js';
import type { AnyString, Dictionary, EntityKey } from '../typings.js';

declare const rawFragmentSymbolBrand: unique symbol;

export type RawQueryFragmentSymbol = symbol & {
  readonly [rawFragmentSymbolBrand]: true;
};

export class RawQueryFragment<Alias extends string = string> {
  static #rawQueryReferences = new WeakMap<RawQueryFragmentSymbol, RawQueryFragment>();
  #key?: RawQueryFragmentSymbol;
  /** @internal Type-level only - used to track the alias for type inference */
  declare private readonly __alias?: Alias;

  constructor(
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {}

  get key(): RawQueryFragmentSymbol {
    if (!this.#key) {
      this.#key = Symbol(this.toJSON()) as RawQueryFragmentSymbol;
      RawQueryFragment.#rawQueryReferences.set(this.#key, this);
    }

    return this.#key;
  }

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

  static isKnownFragmentSymbol(key: unknown): key is RawQueryFragmentSymbol {
    return typeof key === 'symbol' && this.#rawQueryReferences.has(key as RawQueryFragmentSymbol);
  }

  static hasObjectFragments(object: unknown): boolean {
    return (
      Utils.isPlainObject(object) &&
      Object.getOwnPropertySymbols(object).some(symbol => this.isKnownFragmentSymbol(symbol))
    );
  }

  static isKnownFragment(key: unknown): key is RawQueryFragment | symbol {
    if (key instanceof RawQueryFragment) {
      return true;
    }

    return this.isKnownFragmentSymbol(key);
  }

  static getKnownFragment(key: unknown) {
    if (key instanceof RawQueryFragment) {
      return key;
    }

    if (typeof key !== 'symbol') {
      return;
    }

    return this.#rawQueryReferences.get(key as RawQueryFragmentSymbol);
  }

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')]() {
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
 *
 * // with type parameter for assignment without casting
 * entity.date = sql<Date>`now()`;
 * ```
 */
export function sql<R = RawQueryFragment & symbol>(sql: readonly string[], ...values: unknown[]): R {
  return raw<R>(sql.join('?'), values);
}

export function createSqlFunction<R = RawQueryFragment & symbol, T extends object = any>(
  func: string,
  key: string | ((alias: string) => string),
): R {
  if (typeof key === 'string') {
    return raw<R, T>(`${func}(${key})`);
  }

  return raw<R, T>(a => `${func}(${key(a)})`);
}

sql.ref = <T extends object = any>(...keys: string[]) => raw<RawQueryFragment & symbol, T>('??', [keys.join('.')]);
sql.now = (length?: number) => raw('current_timestamp' + (length == null ? '' : `(${length})`));
sql.lower = <R = RawQueryFragment & symbol, T extends object = any>(key: string | ((alias: string) => string)) =>
  createSqlFunction<R, T>('lower', key);
sql.upper = <R = RawQueryFragment & symbol, T extends object = any>(key: string | ((alias: string) => string)) =>
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
export function quote(expParts: readonly string[], ...values: (string | { toString(): string })[]) {
  return raw(expParts.join('??'), values);
}
