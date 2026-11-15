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

const Build = defineEntity({
  name: 'Build',
  uniques: [{ properties: ['env', 'version'] }],
  properties: {
    id: p.integer().primary().autoincrement(),
    env: p.string(),
    version: p.integer(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Run, Build], dbName: ':memory:' });
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

test.each(['ignore', 'merge'] as const)(
  'keeps falsy values in the composite condition (%s)',
  async onConflictAction => {
    await orm.em.fork().insert(Build, { env: 'prod', version: -1, name: 'existing' });
    const res = await orm.em.fork().upsertMany(
      Build,
      [
        { env: 'prod', version: -1, name: 'new -1' },
        { env: 'prod', version: 0, name: 'new 0' },
        { env: 'prod', version: 1, name: 'new 1' },
      ],
      { onConflictFields: ['env', 'version'], onConflictAction },
    );

    const rows = await orm.em.fork().find(Build, {}, { orderBy: { version: 'asc' } });
    expect(res.map(r => [r.id, r.version, r.name])).toEqual(rows.map(r => [r.id, r.version, r.name]));
  },
);
