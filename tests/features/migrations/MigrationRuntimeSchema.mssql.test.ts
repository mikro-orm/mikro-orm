import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';
import { Migration, Migrator } from '@mikro-orm/migrations';

const Foo = defineEntity({
  name: 'Foo',
  tableName: 'foo',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

class NoopMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('select 1');
  }

  override async down(): Promise<void> {
    this.addSql('select 1');
  }
}

describe('migrations with runtime schema (mssql — unsupported)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Foo],
      dbName: `mikro_orm_test_mssql_migration_runtime_schema`,
      password: 'Root.Root',
      extensions: [Migrator],
      migrations: {
        migrationsList: [{ class: NoopMigration, name: 'NoopMigration' }],
        snapshot: false,
        silent: true,
      },
    });

    await orm.schema.refresh();
  });

  afterAll(async () => orm.close(true));

  test('passing schema to up() throws a clear error on MSSQL', async () => {
    await expect(orm.migrator.up({ schema: 'anything' })).rejects.toThrow(
      /Runtime schema for migrations is not supported by the MsSqlDriver/,
    );
  });

  test('upgrades a legacy tracking table and persists rollback breakpoints', async () => {
    await orm.schema.dropTableIfExists('mikro_orm_migrations');
    await orm.em
      .getConnection()
      .execute(
        'create table [mikro_orm_migrations] ([id] int identity primary key, [name] varchar(255) not null, [executed_at] datetime2 default getdate())',
      );
    await orm.migrator.up();
    const before = await orm.migrator.getExecuted();
    expect(before[0]).not.toHaveProperty('breakpoint');
    await orm.migrator.setBreakpoint('NoopMigration');
    const migrator = new Migrator(orm.em);
    expect(await migrator.getExecuted()).toEqual([{ ...before[0], breakpoint: true }]);
    await expect(migrator.down()).rejects.toThrow("breakpoint 'NoopMigration'");
    await expect(migrator.setBreakpoint('NoopMigration', true, { schema: 'anything' })).rejects.toThrow(
      /Runtime schema for migrations is not supported by the MsSqlDriver/,
    );
    await migrator.setBreakpoint('NoopMigration', false);
    expect((await migrator.getExecuted())[0].breakpoint).toBe(false);
    expect((await migrator.down()).map(row => row.name)).toEqual(['NoopMigration']);
  });
});
