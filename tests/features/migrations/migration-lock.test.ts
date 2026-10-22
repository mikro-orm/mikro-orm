import { defineEntity, p, type MikroORM as CoreMikroORM, type Options } from '@mikro-orm/core';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
import { MikroORM as MariaDbMikroORM } from '@mikro-orm/mariadb';
import { type AbstractSqlConnection, MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
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
      const messages: string[] = [];
      const extra = { logger: (msg: string) => messages.push(msg), migrations: { allOrNothing, silent: false } };
      const orm1 = await init(extra);
      const orm2 = await init(extra);

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
        expect(messages.some(m => m.includes('Waiting for the migration lock'))).toBe(true);
      } finally {
        await orm1.close();
        await orm2.close();
      }
    },
  );

  if (name === 'postgresql') {
    test('lockTimeout bounds the wait', async () => {
      const orm1 = await init({ migrations: { lockTimeout: 100 } });
      const connection = orm.em.getConnection() as AbstractSqlConnection;

      try {
        await connection
          .getClient()
          .connection()
          .execute(async db => {
            await connection.execute(`select pg_advisory_lock(hashtext('mikro_orm_migrations'))`, [], 'run', db);
            await expect(orm1.migrator.up()).rejects.toThrow('Timed out after 100 ms waiting for the migration lock');
            await connection.execute(`select pg_advisory_unlock(hashtext('mikro_orm_migrations'))`, [], 'run', db);
          });
      } finally {
        await orm1.close();
      }
    });

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
