import { type AnyString, type Dictionary, type EntityKey, type RawQueryFragment, raw as raw_, Utils } from '@mikro-orm/core';
import type { SelectQueryBuilder as KyselySelectQueryBuilder } from 'kysely';

/** @internal Type for QueryBuilder instances passed to raw() - uses toRaw to distinguish from Kysely QueryBuilder */
type QueryBuilderLike = { toQuery(): { sql: string; params: readonly unknown[] }; toRaw(): RawQueryFragment };

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
  sql: QueryBuilderLike | KyselySelectQueryBuilder<any, any, any> | EntityKey<T> | EntityKey<T>[] | AnyString | ((alias: string) => string) | RawQueryFragment,
  params?: readonly unknown[] | Dictionary<unknown>,
): R {
  if (Utils.isObject<KyselySelectQueryBuilder<any, any, any>>(sql) && 'compile' in sql) {
    const query = sql.compile();
    return raw_(query.sql, query.parameters) as R;
  }

  if (Utils.isObject<QueryBuilderLike>(sql) && 'toQuery' in sql) {
    const query = sql.toQuery();
    return raw_(query.sql, query.params) as R;
  }

  return raw_(sql as Exclude<typeof sql, QueryBuilderLike>, params) as R;
}
