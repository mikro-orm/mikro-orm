import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { BASE_DIR } from '../bootstrap.js';

interface Sub {
  id: number;
  subscriber: number;
  course: number | null;
  instructor: number | null;
}

const Subscription = new EntitySchema<Sub>({
  name: 'Subscription',
  tableName: 'subscriptions_gh7773',
  properties: {
    id: { primary: true, type: 'number', fieldName: 'id', columnType: 'serial' },
    subscriber: { type: 'number', fieldName: 'subscriber_id', columnType: 'int' },
    course: { type: 'number', fieldName: 'course_id', columnType: 'int', nullable: true },
    instructor: { type: 'number', fieldName: 'instructor_id', columnType: 'int', nullable: true },
  },
  uniques: [
    {
      name: 'subscriptions_gh7773_subscriber_course_unique',
      properties: ['subscriber', 'course'],
      where: { course: { $ne: null } },
    },
    {
      name: 'subscriptions_gh7773_subscriber_instructor_unique',
      properties: ['subscriber', 'instructor'],
      where: { instructor: { $ne: null }, course: null },
    },
  ],
});

const PATH = BASE_DIR + '/../temp/migrations-gh7773';
const DB = 'mikro_orm_test_gh7773';

describe('GH #7773 — partial unique indexes churn through snapshot', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Subscription],
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

  test('second migration:create against a fresh snapshot has no churn for partial unique indexes', async () => {
    // first create against an empty DB: produces real CREATE INDEX … WHERE … diff and writes the snapshot
    const first = await orm.migrator.create();
    expect(first.diff.up.length).toBeGreaterThan(0);
    expect(first.diff.up.join('\n')).toMatch(/where /i);
    await rm(PATH + '/' + first.fileName, { force: true });

    // the partial predicate must survive the snapshot round-trip — otherwise the next diff churns
    const snap = JSON.parse(readFileSync(PATH + '/.snapshot-' + DB + '.json', 'utf8'));
    const subs = snap.tables.find((t: any) => t.name === 'subscriptions_gh7773');
    const partials = subs.indexes.filter((i: any) => i.keyName.startsWith('subscriptions_gh7773_subscriber_'));
    for (const idx of partials) {
      expect(typeof idx.where).toBe('string');
      expect(idx.where!.length).toBeGreaterThan(0);
    }

    // and the user-visible symptom: a second create against an untouched entity must be empty
    const second = await orm.migrator.create();
    if (second.fileName) {
      await rm(PATH + '/' + second.fileName, { force: true });
    }
    expect(second.diff).toEqual({ up: [], down: [] });
  });
});
