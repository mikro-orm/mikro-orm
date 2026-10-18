import { defineEntity, MikroORM, p, type MikroORM as ORM } from '@mikro-orm/core';
import { Migration, Migrator } from '@mikro-orm/migrations';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mkdir, rm } from 'node:fs/promises';
import { TEMP_DIR } from '../../helpers.js';

const dbName = `${TEMP_DIR}/migrator-concurrent.sqlite`;

const Item = defineEntity({
  name: 'Item',
  tableName: 'item',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

/**
 * Shared by the migration class below. Reset at the start of every test.
 * The first `up()` parks on `releaseFirst` so a second runner has a chance to
 * enter the same migration before the first one logs it.
 */
let entered = 0;
let releaseFirst: (() => void) | undefined;

class DataMigration extends Migration {
  override async up(): Promise<void> {
    entered++;

    if (entered === 1) {
      await new Promise<void>(resolve => {
        releaseFirst = resolve;
      });
    }

    this.addSql(`insert into item (name) values ('x')`);
  }
}

async function createOrm(allOrNothing: boolean): Promise<ORM<SqliteDriver>> {
  return MikroORM.init({
    driver: SqliteDriver,
    dbName,
    entities: [Item],
    extensions: [Migrator],
    migrations: {
      migrationsList: [{ name: 'MigrationDataOnce', class: DataMigration }],
      snapshot: false,
      silent: true,
      allOrNothing,
    },
  });
}

/** Resolves `true` as soon as a second runner enters `up()`, or `false` after `ms`. */
function secondRunnerEntered(ms: number): Promise<boolean> {
  return new Promise(resolve => {
    const poll = setInterval(() => {
      if (entered >= 2) {
        clearInterval(poll);
        clearTimeout(timer);
        resolve(true);
      }
    }, 10);
    const timer = setTimeout(() => {
      clearInterval(poll);
      resolve(entered >= 2);
    }, ms);
  });
}

describe('concurrent migrator.up() (sqlite)', () => {
  beforeEach(async () => {
    entered = 0;
    releaseFirst = undefined;
    await mkdir(TEMP_DIR, { recursive: true });
    await rm(dbName, { force: true });
    await rm(`${dbName}-journal`, { force: true });
    await rm(`${dbName}-wal`, { force: true });
    await rm(`${dbName}-shm`, { force: true });
    await rm(`${dbName}.mikro_orm_migrations.lock`, { force: true });
  });

  test.each([{ allOrNothing: true }, { allOrNothing: false }])(
    'runs a data migration once when two ORMs call up() together (allOrNothing: $allOrNothing)',
    async ({ allOrNothing }) => {
      const orm1 = await createOrm(allOrNothing);
      const orm2 = await createOrm(allOrNothing);

      try {
        await orm1.em
          .getConnection()
          .execute(`create table item (id integer primary key autoincrement, name text not null)`);
        // The tracking table itself is created here so the race under test is the data migration,
        // not two concurrent `create table mikro_orm_migrations`.
        await orm1.migrator.getExecuted();

        const pending = Promise.all([orm1.migrator.up(), orm2.migrator.up()]);
        const slippedIn = await Promise.race([secondRunnerEntered(1_000), pending.then(() => false)]);
        releaseFirst?.();
        const results = await pending;

        expect(slippedIn).toBe(false);
        expect(entered).toBe(1);
        expect(results.reduce((sum, run) => sum + run.length, 0)).toBe(1);

        const rows = await orm1.em.getConnection().execute<{ c: number }[]>(`select count(*) as c from item`);
        expect(Number(rows[0].c)).toBe(1);
        const logged = await orm1.em
          .getConnection()
          .execute<{ c: number }[]>(`select count(*) as c from mikro_orm_migrations`);
        expect(Number(logged[0].c)).toBe(1);
      } finally {
        releaseFirst?.();
        await orm1?.close(true);
        await orm2?.close(true);
      }
    },
  );
});
