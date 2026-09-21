import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { Migration, Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../helpers';

class BlankMigration8279 extends Migration {

  override async up(): Promise<void> {
    this.addSql('select 1');
  }

  override async down(): Promise<void> {
    this.addSql('select 1');
  }

}

test('GH #8279: preserve the snapshot when migration up and down leave the schema unchanged', async () => {
  const path = BASE_DIR + '/../temp/migrations-gh8279-sqlite';
  const orm = await MikroORM.init({
    entities: [new EntitySchema({ name: 'Place8279', properties: { id: { type: 'number', primary: true } } })],
    dbName: ':memory:',
    migrations: { path, snapshot: true, migrationsList: [BlankMigration8279] },
    extensions: [Migrator],
    logger: () => void 0,
  });

  try {
    await orm.schema.createSchema();
    await orm.migrator.createMigration(path, true);
    const snapshotPath = path + '/.snapshot-:memory:.json';
    const snapshot = readFileSync(snapshotPath, 'utf8');

    await orm.migrator.up();
    expect(readFileSync(snapshotPath, 'utf8')).toBe(snapshot);

    await orm.migrator.down();
    expect(readFileSync(snapshotPath, 'utf8')).toBe(snapshot);
  } finally {
    await orm.close(true);
    await rm(path, { recursive: true, force: true });
  }
});
