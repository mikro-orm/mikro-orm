import { defineEntity, type Dictionary, p, type MikroORM as CoreMikroORM, type Options } from '@mikro-orm/core';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
import { MikroORM as MariaDbMikroORM } from '@mikro-orm/mariadb';
import {
  type AbstractSqlConnection,
  type AbstractSqlPlatform,
  MikroORM as PostgreSqlMikroORM,
} from '@mikro-orm/postgresql';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';
import { MikroORM as PgliteMikroORM } from '@mikro-orm/pglite';
import { Migration, Migrator } from '@mikro-orm/migrations';

const LockItem = defineEntity({
  name: 'LockItem',
  tableName: 'lock_item',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const drivers = [
  {
    name: 'postgresql',
    MikroORM: PostgreSqlMikroORM,
    options: {},
    sleep: 'select pg_sleep(0.5)',
  },
  {
    name: 'mysql',
    MikroORM: MySqlMikroORM,
    options: { port: 3308, user: 'root' },
    sleep: 'do sleep(0.5)',
  },
  {
    name: 'mariadb',
    MikroORM: MariaDbMikroORM,
    options: { port: 3309, user: 'root' },
    sleep: 'do sleep(0.5)',
  },
  {
    name: 'mssql',
    MikroORM: MsSqlMikroORM,
    options: { password: 'Root.Root' },
    sleep: `waitfor delay '00:00:00.500'`,
  },
] as const;

describe.each(drivers)('migration lock ($name)', ({ name, MikroORM, options, sleep }) => {
  class InsertItemMigration extends Migration {
    override async up(): Promise<void> {
      this.addSql(`insert into lock_item (name) values ('x')`);
      this.addSql(sleep);
    }
  }

  const dbName = `mikro_orm_test_migration_lock`;
  const init = (extra: Partial<Options> = {}) =>
    (MikroORM.init as (o: Partial<Options>) => Promise<CoreMikroORM>)({
      entities: [LockItem],
      dbName,
      extensions: [Migrator],
      ...options,
      ...extra,
      migrations: {
        migrationsList: [{ name: 'InsertItemMigration', class: InsertItemMigration }],
        snapshot: false,
        silent: true,
        lock: true,
        ...extra.migrations,
      },
    });

  let orm: CoreMikroORM;

  beforeAll(async () => {
    orm = await init();
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.em.getConnection().execute('drop table if exists mikro_orm_migrations');
    await orm.em.getConnection().execute('delete from lock_item');
  });

  afterAll(() => orm.close(true));

  test.each([
    { allOrNothing: true, freshDatabase: true },
    { allOrNothing: true, freshDatabase: false },
    { allOrNothing: false, freshDatabase: true },
    { allOrNothing: false, freshDatabase: false },
  ])(
    'concurrent up() runs apply a migration once (allOrNothing: $allOrNothing, fresh database: $freshDatabase)',
    async ({ allOrNothing, freshDatabase }) => {
      const orm1 = await init({ migrations: { allOrNothing } });
      const orm2 = await init({ migrations: { allOrNothing } });

      try {
        if (!freshDatabase) {
          // with an existing migrations table, the runs race on the data change itself
          await orm1.migrator.getExecuted();
        }

        const results = await Promise.all([orm1.migrator.up(), orm2.migrator.up()]);
        expect(results.map(r => r.length).sort()).toEqual([0, 1]);

        const [{ count: items }] = await orm.em.getConnection().execute(`select count(*) as count from lock_item`);
        const [{ count: logged }] = await orm.em
          .getConnection()
          .execute(`select count(*) as count from mikro_orm_migrations`);
        expect(+items).toBe(1);
        expect(+logged).toBe(1);
      } finally {
        await orm1.close();
        await orm2.close();
      }
    },
  );

  /** Runs `cb` while another session holds the migration lock. */
  const withLockHeld = async (cb: (release: () => Promise<void>) => Promise<void>) => {
    const connection = orm.em.getConnection() as AbstractSqlConnection;
    const { acquire, release } = (orm.em.getPlatform() as AbstractSqlPlatform)
      .getSchemaHelper()!
      .getMigrationLockSQL()!;
    const name = 'mikro_orm_migrations';

    await connection
      .getClient()
      .connection()
      .execute(async db => {
        let held = true;
        const unlock = async () => {
          if (held) {
            held = false;
            await connection.execute(release, [name], 'run', db);
          }
        };

        expect((await connection.execute<Dictionary>(acquire, [name], 'get', db)).locked).toBeTruthy();

        try {
          await cb(unlock);
        } finally {
          await unlock();
        }
      });
  };

  test('waits for the lock held by another session and logs it', async () => {
    const messages: string[] = [];
    const orm1 = await init({ logger: msg => messages.push(msg), migrations: { silent: false, lockTimeout: 30_000 } });

    try {
      await withLockHeld(async release => {
        const run = orm1.migrator.up();
        await expect
          .poll(() => messages.some(m => m.includes('Waiting for the migration lock')), { timeout: 10_000 })
          .toBe(true);
        await release();
        await expect(run).resolves.toHaveLength(1);
      });
    } finally {
      await orm1.close();
    }
  });

  test('lockTimeout bounds the wait', async () => {
    const orm1 = await init({ migrations: { lockTimeout: 100 } });

    try {
      await withLockHeld(async () => {
        await expect(orm1.migrator.up()).rejects.toThrow('Timed out after 100 ms waiting for the migration lock');
      });
    } finally {
      await orm1.close();
    }
  });

  if (name === 'postgresql') {
    test('a failed run releases the lock', async () => {
      class FailingMigration extends Migration {
        override async up(): Promise<void> {
          this.addSql('select * from missing_table');
        }
      }

      const orm1 = await init({
        migrations: { migrationsList: [{ name: 'FailingMigration', class: FailingMigration }] },
      });
      const orm2 = await init({ migrations: { lockTimeout: 100 } });

      try {
        await expect(orm1.migrator.up()).rejects.toThrow('missing_table');
        await expect(orm2.migrator.up()).resolves.toHaveLength(1);
      } finally {
        await orm1.close();
        await orm2.close();
      }
    });

    test('refuses to lock with a single connection pool', async () => {
      const orm1 = await init({ pool: { max: 1 } });

      try {
        await expect(orm1.migrator.up()).rejects.toThrow('The migration lock needs at least 2 pooled connections');
      } finally {
        await orm1.close();
      }
    });

    test('locks a database that does not exist yet', async () => {
      class CreateItemMigration extends Migration {
        override async up(): Promise<void> {
          this.addSql(`create table lock_item (id serial primary key, name varchar(255) not null)`);
        }
      }

      const orm1 = await init({
        dbName: `${dbName}_fresh`,
        migrations: { migrationsList: [{ name: 'CreateItemMigration', class: CreateItemMigration }] },
      });

      try {
        await expect(orm1.migrator.up()).resolves.toHaveLength(1);
        await expect(orm1.migrator.up()).resolves.toHaveLength(0);
      } finally {
        await orm1.schema.dropDatabase();
        await orm1.close(true);
      }
    });
  }
});

test.each([
  { name: 'sqlite', MikroORM: SqliteMikroORM, dbName: ':memory:' },
  { name: 'pglite', MikroORM: PgliteMikroORM, dbName: 'memory://' },
] as const)('the lock option is ignored without a lock primitive ($name)', async ({ MikroORM, dbName }) => {
  class InsertItemMigration extends Migration {
    override async up(): Promise<void> {
      this.addSql(`insert into lock_item (name) values ('x')`);
    }
  }

  const orm = await (MikroORM.init as (o: Partial<Options>) => Promise<CoreMikroORM>)({
    entities: [LockItem],
    dbName,
    extensions: [Migrator],
    pool: { max: 1 },
    migrations: {
      migrationsList: [{ name: 'InsertItemMigration', class: InsertItemMigration }],
      snapshot: false,
      silent: true,
      lock: true,
    },
  });

  try {
    await orm.schema.create();
    await expect(orm.migrator.up()).resolves.toHaveLength(1);
  } finally {
    await orm.close();
  }
});
