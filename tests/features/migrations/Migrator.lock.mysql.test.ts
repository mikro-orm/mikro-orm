import { MikroORM } from '@mikro-orm/mysql';
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

class QuickMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('select 1');
  }
}

let entered = 0;

class CountedMigration extends Migration {
  override async up(): Promise<void> {
    entered++;
    markReached?.();
    await parked;
    this.addSql('insert into lock_item values ()');
  }
}

async function createOrm(dbName: string, cls: new (...args: any[]) => Migration, reset = true) {
  const orm = await MikroORM.init({
    dbName,
    port: 3308,
    user: 'root',
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator],
    migrations: { migrationsList: [{ name: 'Migration1', class: cls }], snapshot: false, silent: true },
  });

  if (reset) {
    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('drop table if exists mikro_orm_migrations');
  }

  return orm;
}

test('concurrent up() runs apply a data migration once (mysql)', async () => {
  const orm1 = await createOrm('mikro_orm_test_migration_lock_concurrent', CountedMigration);
  const orm2 = await createOrm('mikro_orm_test_migration_lock_concurrent', CountedMigration, false);
  await orm1.em.getConnection().execute('drop table if exists lock_item');
  await orm1.em.getConnection().execute('create table lock_item (id int auto_increment primary key)');
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
    await expect(orm1.em.getConnection().execute('select count(*) as c from lock_item')).resolves.toEqual([{ c: 1 }]);
  } finally {
    release();
    parked = markReached = undefined;
    await orm1.close(true);
    await orm2.close(true);
  }
});

test('migration lock is scoped to the database (mysql)', async () => {
  const a = await createOrm('mikro_orm_test_migration_lock_a', ParkedMigration);
  const b = await createOrm('mikro_orm_test_migration_lock_b', QuickMigration);
  let release!: () => void;
  parked = new Promise(resolve => (release = resolve));
  const reached = new Promise<void>(resolve => (markReached = resolve));
  const runA = a.migrator.up();

  try {
    await reached;
    // `GET_LOCK` names are server-wide, so an unscoped name would make `b` wait for `a`
    await expect(b.migrator.up()).resolves.toHaveLength(1);
  } finally {
    release();
    await runA;
    parked = markReached = undefined;
    await a.close(true);
    await b.close(true);
  }
});
