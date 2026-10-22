import { MikroORM } from '@mikro-orm/postgresql';
import { Migration, Migrator } from '@mikro-orm/migrations';

let parked: Promise<void> | undefined;
let markReached: (() => void) | undefined;

class ParkedMigration extends Migration {
  override async up(): Promise<void> {
    markReached?.();
    await parked;
    this.addSql('select 1');
  }
}

class NonTransactionalMigration extends Migration {
  override isTransactional(): boolean {
    return false;
  }

  override async up(): Promise<void> {
    this.addSql('select 1');
  }
}

class QueryWithoutContextMigration extends Migration {
  override async up(): Promise<void> {
    await this.driver.execute('select 1');
    this.addSql('select 1');
  }
}

let entered = 0;

class CountedMigration extends Migration {
  override async up(): Promise<void> {
    entered++;
    markReached?.();
    await parked;
    this.addSql('insert into lock_item default values');
  }
}

async function createOrm(suffix: string, cls: new (...args: any[]) => Migration, allOrNothing = true, reset = true) {
  const orm = await MikroORM.init({
    dbName: `mikro_orm_test_migration_lock_${suffix}`,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator],
    migrations: { migrationsList: [{ name: 'Migration1', class: cls }], snapshot: false, silent: true, allOrNothing },
  });

  if (reset) {
    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('drop table if exists mikro_orm_migrations');
  }

  return orm;
}

describe('migration lock (postgres)', () => {
  test.each([true, false])(
    'concurrent up() runs apply a data migration once (allOrNothing: %s)',
    async allOrNothing => {
      const orm1 = await createOrm('concurrent', CountedMigration, allOrNothing);
      const orm2 = await createOrm('concurrent', CountedMigration, allOrNothing, false);
      await orm1.em
        .getConnection()
        .execute('drop table if exists lock_item; create table lock_item (id serial primary key)');
      entered = 0;
      let release!: () => void;
      parked = new Promise(resolve => (release = resolve));
      const reached = new Promise<void>(resolve => (markReached = resolve));

      try {
        const run1 = orm1.migrator.up();
        await reached;
        const run2 = orm2.migrator.up();
        // give the second runner time to slip into `up()` if it is not blocked by the lock
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(entered).toBe(1);
        release();
        const [res1, res2] = await Promise.all([run1, run2]);

        expect(res1.length + res2.length).toBe(1);
        expect(entered).toBe(1);
        await expect(orm1.em.getConnection().execute('select count(*)::int as c from lock_item')).resolves.toEqual([
          { c: 1 },
        ]);
        await expect(
          orm1.em.getConnection().execute('select count(*)::int as c from mikro_orm_migrations'),
        ).resolves.toEqual([{ c: 1 }]);
      } finally {
        release();
        parked = markReached = undefined;
        await orm1.close(true);
        await orm2.close(true);
      }
    },
  );

  test('non-transactional migration runs under the allOrNothing master transaction', async () => {
    const orm = await createOrm('non_tx', NonTransactionalMigration);
    await expect(orm.migrator.up()).resolves.toHaveLength(1);
    await orm.close(true);
  });

  test('query without the migration context does not wait for the migration transaction', async () => {
    const orm = await createOrm('no_ctx', QueryWithoutContextMigration);
    await expect(orm.migrator.up()).resolves.toHaveLength(1);
    await orm.close(true);
  });

  test('unrelated query is not queued behind an in-progress migration', async () => {
    const orm = await createOrm('unrelated', ParkedMigration);
    let release!: () => void;
    parked = new Promise(resolve => (release = resolve));
    const reached = new Promise<void>(resolve => (markReached = resolve));
    const run = orm.migrator.up();

    try {
      await reached;
      await expect(orm.em.fork().execute('select 1 as x')).resolves.toEqual([{ x: 1 }]);
    } finally {
      release();
      await run;
      parked = markReached = undefined;
      await orm.close(true);
    }
  });
});
