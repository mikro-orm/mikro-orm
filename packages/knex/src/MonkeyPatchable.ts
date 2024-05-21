// @ts-ignore
import Client from 'knex/lib/client';
// @ts-ignore
import QueryExecutioner from 'knex/lib/execution/internal/query-executioner';
// @ts-ignore
import MySqlDialect from 'knex/lib/dialects/mysql2';
// @ts-ignore
import MySqlColumnCompiler from 'knex/lib/dialects/mysql/schema/mysql-columncompiler';
// @ts-ignore
import MySqlQueryCompiler from 'knex/lib/dialects/mysql/query/mysql-querycompiler';
// @ts-ignore
import MsSqlColumnCompiler from 'knex/lib/dialects/mssql/schema/mssql-columncompiler';
// @ts-ignore
import MsSqlTableCompiler from 'knex/lib/dialects/mssql/schema/mssql-tablecompiler';
// @ts-ignore
import MsSqlQueryCompiler from 'knex/lib/dialects/mssql/query/mssql-querycompiler';
// @ts-ignore
import MsSqlDialect from 'knex/lib/dialects/mssql';
// @ts-ignore
import PostgresDialect from 'knex/lib/dialects/postgres';
// @ts-ignore
import PostgresDialectTableCompiler from 'knex/lib/dialects/postgres/schema/pg-tablecompiler';
// @ts-ignore
import PostgresQueryCompiler from 'knex/lib/dialects/postgres/query/pg-querycompiler';
// @ts-ignore
import Sqlite3Dialect from 'knex/lib/dialects/sqlite3';
// @ts-ignore
import BetterSqlite3Dialect from 'knex/lib/dialects/better-sqlite3';
// @ts-ignore
import Sqlite3DialectTableCompiler from 'knex/lib/dialects/sqlite3/schema/sqlite-tablecompiler';
// @ts-ignore
import TableCompiler from 'knex/lib/schema/tablecompiler';

// These specific portions of knex are overridden by the different
// database packages. We need to be sure the knex files they get to
// monkey patch are the same version as our overall knex instance
// which is why we need to import them in this package.
export const MonkeyPatchable = {
  Client,
  QueryExecutioner,
  MySqlDialect,
  MySqlColumnCompiler,
  MySqlQueryCompiler,
  MsSqlColumnCompiler,
  MsSqlTableCompiler,
  MsSqlQueryCompiler,
  MsSqlDialect,
  PostgresDialect,
  PostgresDialectTableCompiler,
  PostgresQueryCompiler,
  Sqlite3Dialect,
  Sqlite3DialectTableCompiler,
  BetterSqlite3Dialect,
  TableCompiler,
};
