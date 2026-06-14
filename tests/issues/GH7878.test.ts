import { rm } from 'node:fs/promises';
import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

interface AuditLog {
  id: number;
  updatedAt: Date;
}

const AuditLog = new EntitySchema<AuditLog>({
  name: 'AuditLog',
  tableName: 'audit_log_gh7878',
  properties: {
    id: { primary: true, type: 'number', fieldName: 'id', columnType: 'serial' },
    updatedAt: { type: 'Date', fieldName: 'updated_at', columnType: 'timestamptz' },
  },
  triggers: [
    {
      name: 'update_timestamp_gh7878',
      timing: 'before',
      events: ['insert', 'update'],
      body: 'NEW.updated_at = NOW(); RETURN NEW',
    },
  ],
});

const PATH = BASE_DIR + '/../temp/migrations-gh7878';
const DB = 'mikro_orm_test_gh7878';

describe('GH #7878 — triggers dropped from migration snapshot in getSchemaFromSnapshot()', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [AuditLog],
      dbName: DB,
      migrations: { path: PATH, snapshot: true },
      extensions: [Migrator],
    });
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.schema.createDatabase(DB);
  });

  afterAll(async () => {
    await rm(PATH, { recursive: true, force: true });
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('the trigger survives the snapshot round-trip and a second create has no churn', async () => {
    // first create against an empty DB: produces a real CREATE TRIGGER diff and writes the snapshot
    const first = await orm.migrator.create();
    expect(first.diff.up.join('\n')).toMatch(/create trigger/i);
    await rm(PATH + '/' + first.fileName, { force: true });

    // a second create against the untouched entity must be empty — the trigger must survive the round-trip
    const second = await orm.migrator.create();
    if (second.fileName) {
      await rm(PATH + '/' + second.fileName, { force: true });
    }
    expect(second.diff).toEqual({ up: [], down: [] });
  });
});
