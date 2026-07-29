import { readFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Migration, Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

const Widget8049 = new EntitySchema({
  name: 'Widget8049',
  tableName: 'widget8049',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    name: { type: 'string' },
  },
});

const Audited8049 = new EntitySchema({
  name: 'Audited8049',
  tableName: 'audited8049',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    updatedAt: { type: 'Date', columnType: 'timestamptz' },
  },
  triggers: [
    {
      name: 'audited8049_touch',
      timing: 'before',
      events: ['insert', 'update'],
      body: 'NEW.updated_at = NOW(); RETURN NEW',
    },
  ],
});

class ExternalTriggerMigration extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create or replace function widget8049_external_fn() returns trigger as $$ begin return null; end; $$ language plpgsql`,
    );
    this.addSql(
      `create trigger widget8049_external after insert on "widget8049" for each statement execute function widget8049_external_fn()`,
    );
  }
}

const MIGRATIONS_PATH = BASE_DIR + '/../temp/migrations-gh8049';
const DB = 'mikro_orm_test_gh8049';

describe('GH #8049 — migration-owned triggers must not poison the snapshot', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Widget8049, Audited8049],
      dbName: DB,
      migrations: {
        path: MIGRATIONS_PATH,
        snapshot: true,
        migrationsList: [{ name: 'ExternalTriggerMigration', class: ExternalTriggerMigration }],
      },
      extensions: [Migrator],
    });
    await rm(MIGRATIONS_PATH, { recursive: true, force: true });
    await mkdir(MIGRATIONS_PATH, { recursive: true });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await rm(MIGRATIONS_PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('external trigger stays in the DB but is left out of the snapshot', async () => {
    await orm.migrator.up();

    const snapshot = JSON.parse(readFileSync(MIGRATIONS_PATH + '/.snapshot-' + DB + '.json', 'utf8'));
    const widget = snapshot.tables.find((t: any) => t.name === 'widget8049');
    const audited = snapshot.tables.find((t: any) => t.name === 'audited8049');

    // the migration-owned trigger is not part of the entity metadata
    expect(widget.triggers).toEqual([]);
    // ...while the one declared via `EntitySchema.triggers` round-trips
    expect(audited.triggers).toMatchObject([{ name: 'audited8049_touch' }]);

    // and no follow-up migration is requested just to drop the external trigger
    await expect(orm.migrator.checkSchema()).resolves.toBe(false);

    const triggers = await orm.em
      .getConnection()
      .execute<{ tgname: string }[]>(`select tgname from pg_trigger where not tgisinternal order by tgname`);
    expect(triggers.map(t => t.tgname)).toEqual(['audited8049_touch', 'widget8049_external']);
  });
});
