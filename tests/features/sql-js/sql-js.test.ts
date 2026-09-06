import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { type Generated, sql } from 'kysely';
import { defineEntity, p } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, MikroORM, type SqlJsStatic } from '@mikro-orm/sql-js';
import { TEMP_DIR } from '../../helpers.js';

// spy on the real initialiser to see the config the driver passes through
vi.mock('sql.js', async importOriginal => {
  const mod = await importOriginal<{ default: typeof initSqlJs }>();
  return { default: vi.fn(mod.default) };
});

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

async function initORM(driverOptions?: Record<string, unknown>) {
  const orm = await MikroORM.init({
    entities: [UserSchema],
    driverOptions,
  });
  await orm.schema.create();

  return orm;
}

test('defineConfig defaults the dbName to :memory:', async () => {
  expect(defineConfig({}).dbName).toBe(':memory:');

  const orm = await initORM();
  expect(orm.config.get('dbName')).toBe(':memory:');
  await orm.close(true);
});

test('the database image can be exported and reopened via driverOptions.data', async () => {
  const orm = await initORM();
  orm.em.create(UserSchema, { name: 'Jon Snow' });
  await orm.em.flush();
  const data = (await orm.em.getConnection().getNativeClient()).export();
  await orm.close(true);

  const orm2 = await MikroORM.init({ entities: [UserSchema], driverOptions: { data } });
  const users = await orm2.em.find(UserSchema, {});
  expect(users).toMatchObject([{ name: 'Jon Snow' }]);
  await orm2.close(true);
});

test('driverOptions.sqlJs is used instead of initializing sql.js again', async () => {
  let calls = 0;
  const SQL = (await initSqlJs()) as SqlJsStatic;
  const orm = await initORM({
    sqlJs: () => {
      calls++;
      return SQL;
    },
  });

  expect(calls).toBe(1);
  const db = await orm.em.getConnection().getNativeClient();
  expect(db).toBeInstanceOf(SQL.Database);
  await orm.close(true);
});

test('executeDump runs a multi-statement script', async () => {
  const orm = await initORM();
  await orm.em
    .getConnection()
    .executeDump(`insert into "user" ("name") values ('Jon Snow'); insert into "user" ("name") values ('Arya');`);

  const users = await orm.em.find(UserSchema, {}, { orderBy: { id: 'asc' } });
  expect(users.map(u => u.name)).toEqual(['Jon Snow', 'Arya']);
  await orm.close(true);
});

test('attachDatabases is rejected, as there is no filesystem to attach from', async () => {
  const orm = new MikroORM({
    entities: [UserSchema],
    attachDatabases: [{ name: 'other', path: 'other.sqlite3' }],
  });

  await expect(orm.connect()).rejects.toThrow('ATTACH DATABASE is not supported by the sql.js driver');
  await orm.close(true);
});

test('multi-statement SQL is rejected instead of silently running only the first statement', async () => {
  const orm = await initORM();
  const connection = orm.em.getConnection();

  await expect(
    connection.execute(`insert into "user" ("name") values ('Jon Snow'); insert into "user" ("name") values ('Arya')`),
  ).rejects.toThrow('The supplied SQL string contains more than one statement');

  await connection.execute(`insert into "user" ("name") values ('Jon Snow');`);
  expect(await orm.em.find(UserSchema, {})).toMatchObject([{ name: 'Jon Snow' }]);
  await orm.close(true);
});

test('a value sql.js cannot bind rejects with a real Error and leaves the connection usable', async () => {
  const orm = await initORM();
  const kysely = orm.em.getKysely();

  await expect(sql`select ${new Date()} as val`.execute(kysely)).rejects.toThrow(
    /tried to bind a value of an unknown type/,
  );

  await orm.em.getConnection().execute(`insert into "user" ("name") values ('Jon Snow')`);
  expect(await orm.em.find(UserSchema, {})).toMatchObject([{ name: 'Jon Snow' }]);
  await orm.close(true);
});

test('reconnecting after close creates a fresh empty database', async () => {
  const orm = await initORM();
  orm.em.create(UserSchema, { name: 'Jon Snow' });
  await orm.em.flush();
  expect(await orm.em.count(UserSchema)).toBe(1);

  await orm.close();
  await orm.connect();
  // the in-memory database is gone with the connection, so even the schema has to be recreated
  await orm.schema.create();
  expect(await orm.em.fork().count(UserSchema)).toBe(0);

  await orm.close(true);
});

test('driverOptions are forwarded to initSqlJs', async () => {
  // sql.js initialises once per process and ignores later configs, so assert on what the driver hands over
  const wasmPath = fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm'));
  const locateFile = () => wasmPath;
  const wasmBinary = await readFile(wasmPath);
  const orm = await initORM({ locateFile, wasmBinary, data: null });

  expect(vi.mocked(initSqlJs)).toHaveBeenLastCalledWith({ locateFile, wasmBinary });
  expect(await orm.em.count(UserSchema)).toBe(0);
  await orm.close(true);
});

test('migrations work against the in-memory database', async () => {
  const migrationPath = TEMP_DIR + '/migrations-sql-js';
  await rm(migrationPath, { recursive: true, force: true });
  const orm = await MikroORM.init({
    entities: [UserSchema],
    extensions: [Migrator],
    migrations: { path: migrationPath, snapshot: false },
  });

  const migration = await orm.migrator.create();
  expect(migration.code).toContain('create table \\`user\\`');
  await orm.migrator.up();
  expect(await orm.migrator.getPending()).toHaveLength(0);
  expect(await orm.em.count(UserSchema)).toBe(0);

  await orm.close(true);
  await rm(migrationPath, { recursive: true, force: true });
});

test('kysely queries run through the sql.js connection', async () => {
  const orm = await initORM();
  const kysely = orm.em.getKysely<{ user: { id: Generated<number>; name: string } }>();
  await kysely.insertInto('user').values({ name: 'Jon Snow' }).execute();
  const rows = await kysely.selectFrom('user').selectAll().execute();
  expect(rows).toEqual([{ id: 1, name: 'Jon Snow' }]);
  await orm.close(true);
});

test('parameters sql.js cannot bind natively are coerced', async () => {
  // the ORM normalizes such values on its own, but kysely binds whatever the user passes
  const orm = await initORM();
  const { rows } =
    await sql`select ${true} as yes, ${false} as no, ${42n} as big, ${null} as nil, ${undefined} as absent`.execute(
      orm.em.getKysely(),
    );

  expect(rows).toEqual([{ yes: 1, no: 0, big: 42, nil: null, absent: null }]);
  await orm.close(true);
});

test('a failing write rejects and leaves the connection usable', async () => {
  const orm = await initORM();
  const connection = orm.em.getConnection();

  await expect(connection.execute(`insert into "user" ("name") values (null)`)).rejects.toThrow(
    'NOT NULL constraint failed: user.name',
  );

  await connection.execute(`insert into "user" ("name") values ('Jon Snow')`);
  expect(await orm.em.find(UserSchema, {})).toMatchObject([{ name: 'Jon Snow' }]);
  await orm.close(true);
});

test('the published sql.js build has no FTS5 module', async () => {
  const orm = await initORM();
  await expect(orm.schema.execute('create virtual table book using fts5(title)')).rejects.toThrow(
    'no such module: fts5',
  );
  await orm.close(true);
});
