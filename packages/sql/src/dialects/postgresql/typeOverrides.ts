/**
 * MikroORM keeps PostgreSQL date/timestamp/interval values as raw strings
 * (and array variants as `string[]`); both `pg` and `pglite` would otherwise
 * eagerly parse them via `pg-types`. Centralizing the OID list here keeps the
 * postgres and pglite drivers in lockstep, while leaving the actual array
 * parsing implementation to the leaf driver (so `@mikro-orm/sql` stays free of
 * postgres-array / postgres-date / postgres-interval dependencies).
 *
 * Use `select typname, oid, typarray from pg_type order by oid` to look up OIDs.
 */
type PostgreSqlArrayParser = (value: string) => string[];
type PostgreSqlValueParser = (value: string) => unknown;

export function createPostgreSqlTypeParsers(arrayParse: PostgreSqlArrayParser): Record<number, PostgreSqlValueParser> {
  const parsers: Record<number, PostgreSqlValueParser> = {};

  for (const oid of [1082, 1114, 1184, 1186]) {
    // date, timestamp, timestamptz, interval — kept as raw strings
    parsers[oid] = str => str;
  }

  for (const oid of [1182, 1115, 1185, 1187]) {
    // date[], timestamp[], timestamptz[], interval[]
    parsers[oid] = arrayParse;
  }

  return parsers;
}
