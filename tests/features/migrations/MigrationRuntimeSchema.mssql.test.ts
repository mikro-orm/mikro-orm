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
});
