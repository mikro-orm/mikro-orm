// @ts-ignore
import Client from 'knex/lib/client';
// @ts-ignore
import QueryExecutioner from 'knex/lib/execution/internal/query-executioner';
// @ts-ignore
import MySqlDialect from 'knex/lib/dialects/mysql2';
// @ts-ignore
import Sqlite3Dialect from 'knex/lib/dialects/sqlite3';
// @ts-ignore
import BetterSqlite3Dialect from 'knex/lib/dialects/better-sqlite3';

// These specific portions of knex are overridden by the different
// database packages. We need to be sure the knex files they get to
// monkey patch are the same version as our overall knex instance
// which is why we need to import them in this package.
export const MonkeyPatchable = {
  Client,
  QueryExecutioner,
  MySqlDialect,
  Sqlite3Dialect,
  BetterSqlite3Dialect,
};
