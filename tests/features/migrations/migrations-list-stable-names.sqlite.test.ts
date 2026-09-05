import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { Migration, Migrator } from '@mikro-orm/migrations';
import type { Constructor, MigrationObject } from '@mikro-orm/core';

const Foo = defineEntity({
  name: 'Foo',
  tableName: 'foo',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

function renameClass(cls: Constructor<Migration>, name: string): void {
  Object.defineProperty(cls, 'name', { value: name, configurable: true });
}

async function createORM(migrationsList: (MigrationObject | Constructor<Migration>)[]) {
  return MikroORM.init({
    entities: [Foo],
    dbName: ':memory:',
    extensions: [Migrator],
    migrations: {
      migrationsList,
      snapshot: false,
      silent: true,
    },
  });
}

describe('migrationsList stable names (sqlite)', () => {
  test('bare class entries derive the stored name from the `name` property, not the constructor name', async () => {
    // a minifier (e.g. Turbopack production build) mangles class names, so the constructor
    // name is not a stable identity — the `name` property survives minification
    class Migration20250101000000 extends Migration {
      override name = 'Migration20250101000000';

      override async up(): Promise<void> {
        this.addSql('create table stable_name_test (id integer not null primary key)');
      }
    }

    const orm = await createORM([Migration20250101000000]);

    try {
      // simulate the minified production build executing the migration first
      renameClass(Migration20250101000000, 'g');
      await orm.migrator.up();
      const executed = await orm.migrator.getExecuted();
      expect(executed.map(row => row.name)).toEqual(['Migration20250101000000']);

      // simulate the unminified dev build running against the same database — without a stable
      // name, the migration is considered pending again and fails with a TableExistsException
      renameClass(Migration20250101000000, 'Migration20250101000000');
      await expect(orm.migrator.up()).resolves.toEqual([]);
      await expect(orm.migrator.getPending()).resolves.toEqual([]);
    } finally {
      await orm.close(true);
    }
  });

  test('explicit name of a `MigrationObject` entry wins over the `name` property', async () => {
    class MigrationWithBothNames extends Migration {
      override name = 'instance-name';

      override async up(): Promise<void> {
        this.addSql('select 1');
      }
    }

    const orm = await createORM([{ name: 'explicit-name', class: MigrationWithBothNames }]);

    try {
      await orm.migrator.up();
      const executed = await orm.migrator.getExecuted();
      expect(executed.map(row => row.name)).toEqual(['explicit-name']);
    } finally {
      await orm.close(true);
    }
  });

  test('bare class entries without a `name` property keep using the constructor name', async () => {
    class Migration20250102000000 extends Migration {
      override async up(): Promise<void> {
        this.addSql('select 1');
      }
    }

    const orm = await createORM([Migration20250102000000]);

    try {
      await orm.migrator.up();
      const executed = await orm.migrator.getExecuted();
      expect(executed.map(row => row.name)).toEqual(['Migration20250102000000']);
    } finally {
      await orm.close(true);
    }
  });
});
