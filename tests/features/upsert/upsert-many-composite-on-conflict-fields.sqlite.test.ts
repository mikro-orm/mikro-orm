import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Run = defineEntity({
  name: 'Run',
  uniques: [{ properties: ['env', 'key'] }],
  properties: {
    id: p.integer().primary().autoincrement(),
    env: p.string(),
    key: p.string(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Run], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insert(Run, { env: 'prod', key: 'b', name: 'existing' });
});

afterAll(() => orm.close(true));

test.each(['ignore', 'merge'] as const)('reloads each row by all onConflictFields (%s)', async onConflictAction => {
  const res = await orm.em.fork().upsertMany(
    Run,
    [
      { env: 'prod', key: 'a', name: 'new a' },
      { env: 'prod', key: 'b', name: 'new b' },
      { env: 'prod', key: 'c', name: 'new c' },
    ],
    { onConflictFields: ['env', 'key'], onConflictAction },
  );

  const rows = await orm.em.fork().find(Run, {}, { orderBy: { key: 'asc' } });
  expect(res.map(r => [r.id, r.key, r.name])).toEqual(rows.map(r => [r.id, r.key, r.name]));
});
