import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
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

describe('migrations with runtime schema (sqlite — silent no-op)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Foo],
      dbName: ':memory:',
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

  test('passing schema to up() is silently ignored on schemaless drivers', async () => {
    await expect(orm.migrator.up({ schema: 'anything' })).resolves.not.toThrow();
    const executed = await orm.migrator.getExecuted();
    expect(executed).toHaveLength(1);
  });
});
