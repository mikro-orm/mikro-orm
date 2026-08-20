import { readFile, rm } from 'node:fs/promises';
import { MikroORM, defineEntity, p } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { TEMP_DIR } from '../helpers.js';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const migrationPath = TEMP_DIR + '/migrations-8037';
const dbName = TEMP_DIR + '/gh8037.db';

describe('GH8037', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
    await rm(dbName, { force: true });
    orm = await MikroORM.init({
      dbName,
      entities: [User],
      driver: SqliteDriver,
      extensions: [Migrator],
      migrations: { path: migrationPath, silent: true },
      schemaGenerator: { skipTables: ['foreign_table'], skipViews: ['foreign_view'] },
    });
    await orm.schema.execute('create table "foreign_table" ("id" integer not null primary key autoincrement)');
    await orm.schema.execute('create view "foreign_view" as select 1 as "id"');
  });

  afterAll(async () => {
    await orm.close(true);
    await rm(migrationPath, { recursive: true, force: true });
    await rm(dbName, { force: true });
  });

  test('skipped tables and views do not leak into the snapshot rewritten after `migration:up`', async () => {
    await orm.migrator.createInitial();
    const snapshotPath = migrationPath + '/.snapshot-gh8037.db.json';
    expect(await readFile(snapshotPath, 'utf8')).not.toContain('foreign_table');

    await orm.migrator.up();
    const snapshot = await readFile(snapshotPath, 'utf8');
    expect(snapshot).not.toContain('foreign_table');
    expect(snapshot).not.toContain('foreign_view');

    const migration = await orm.migrator.create();
    expect(migration.diff.up).toEqual([]);
  });
});
