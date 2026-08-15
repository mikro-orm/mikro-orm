import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import BetterSqlite3 from 'better-sqlite3';
import LibSqlDatabase from 'libsql';
import { SqliteDialect } from 'kysely';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { LibSqlDriver } from '@mikro-orm/libsql';
import { Author4 } from '../entities-schema/index.js';
import {
  initORMMongo,
  initORMMsSql,
  initORMMySql,
  initORMOracleDb,
  initORMPostgreSql,
  initORMSqlite,
} from '../bootstrap.js';

describe('getNativeClient', () => {
  test('sqlite returns the better-sqlite3 database', async () => {
    const orm = await initORMSqlite<SqliteDriver>('sqlite');
    const db = await orm.em.getConnection().getNativeClient();

    expect(db).toBeInstanceOf(BetterSqlite3);
    // a better-sqlite3-only API — synchronous prepared statements have no ORM equivalent
    expect(db.prepare('select 1 as a').get()).toEqual({ a: 1 });

    await orm.close(true);
  });

  test('libsql returns the libsql database', async () => {
    const orm = await initORMSqlite<LibSqlDriver>('libsql');
    const db = await orm.em.getConnection().getNativeClient();

    expect(db).toBeInstanceOf(LibSqlDatabase);
    // libsql tacks `_metadata` onto rows, hence the loose match
    expect(db.prepare('select 1 as a').get()).toMatchObject({ a: 1 });

    await orm.close(true);
  });

  test('throws when the driver builds no client of its own', async () => {
    // `node-sqlite` hands MikroORM a ready-made kysely dialect and its connection never
    // captures a client, so the base implementation stands
    const orm = await initORMSqlite('node-sqlite');

    await expect(orm.em.getConnection().getNativeClient()).rejects.toThrow(
      'Accessing the native client is not supported by current driver',
    );

    await orm.close(true);
  });

  test('throws when a driver that has a client was handed a dialect via driverOptions', async () => {
    const orm = await MikroORM.init<SqliteDriver>({
      entities: [Author4],
      dbName: ':memory:',
      driver: SqliteDriver,
      driverOptions: new SqliteDialect({ database: new BetterSqlite3(':memory:') }),
    });

    // `createKyselyDialect()` is skipped, so `SqliteConnection` never gets hold of a database
    await expect(orm.em.getConnection().getNativeClient()).rejects.toThrow(
      'The native client is not available, as it is owned by the Kysely instance or dialect passed via `driverOptions`',
    );

    await orm.close(true);
  });

  test('postgres returns the pg pool', async () => {
    const orm = await initORMPostgreSql();
    const pool = await orm.em.getConnection().getNativeClient();

    expect(pool).toBeInstanceOf(Pool);
    const res = await pool.query('select 1 as a');
    expect(res.rows).toEqual([{ a: 1 }]);

    await orm.close(true);
  });

  test('mysql returns the mysql2 pool', async () => {
    const orm = await initORMMySql('mysql', {}, true);
    const pool = await orm.em.getConnection().getNativeClient();

    const [rows] = await pool.promise().query('select 1 as a');
    expect(rows).toEqual([{ a: 1 }]);

    await orm.close(true);
  });

  test('mariadb returns the mysql2 pool', async () => {
    const orm = await initORMMySql('mariadb', {}, true);
    const pool = await orm.em.getConnection().getNativeClient();

    const [rows] = await pool.promise().query('select 1 as a');
    expect(rows).toEqual([{ a: 1 }]);

    await orm.close(true);
  });

  test('mssql has no native client to expose', async () => {
    const orm = await initORMMsSql();

    // tedious has no long-lived client, and kysely's pool holds its own connection wrappers
    await expect(orm.em.getConnection().getNativeClient()).rejects.toThrow(
      'Accessing the native client is not supported by current driver',
    );

    await orm.close(true);
  });

  test('oracle returns the oracledb pool', async () => {
    const orm = await initORMOracleDb();
    const pool = await orm.em.getConnection().getNativeClient();

    expect(pool.poolMax).toBeGreaterThan(0);
    const connection = await pool.getConnection();
    const res = await connection.execute<[number]>('select 1 from dual');
    expect(res.rows).toEqual([[1]]);
    await connection.close();

    await orm.close(true);
  });

  test('mongo returns the MongoClient', async () => {
    const orm = await initORMMongo();
    const client = await orm.em.getConnection().getNativeClient();

    expect(client).toBeInstanceOf(MongoClient);
    await expect(client.db().admin().ping()).resolves.toMatchObject({ ok: 1 });

    await orm.close(true);
  });
});
