import { defineEntity, MikroORM, p } from '@mikro-orm/mongodb';

const Build = defineEntity({
  name: 'Build',
  uniques: [{ properties: ['env', 'version'] }],
  properties: {
    _id: p.type('ObjectId' as any).primary(),
    env: p.string(),
    version: p.integer(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Build],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-test-upsert-composite-on-conflict-fields',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insert(Build, { env: 'prod', version: 1, name: 'existing' });
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

const builds = async () => {
  const rows = await orm.em.fork().find(Build, {}, { orderBy: { version: 'asc' } });
  return rows.map(row => [row.version, row.name]);
};

test.each([2, 0])('em.upsert() matches by all onConflictFields (version %i)', async version => {
  const build = await orm.em
    .fork()
    .upsert(Build, { env: 'prod', version, name: 'new' }, { onConflictFields: ['env', 'version'] });

  expect([build.version, build.name]).toEqual([version, 'new']);
  expect(await builds()).toEqual(
    [
      [1, 'existing'],
      [version, 'new'],
    ].sort(),
  );
});

test('em.upsertMany() matches by all onConflictFields', async () => {
  const res = await orm.em.fork().upsertMany(
    Build,
    [
      { env: 'prod', version: 0, name: 'new 0' },
      { env: 'prod', version: 1, name: 'new 1' },
      { env: 'prod', version: 2, name: 'new 2' },
    ],
    { onConflictFields: ['env', 'version'] },
  );

  expect(res.map(r => [r.version, r.name])).toEqual([
    [0, 'new 0'],
    [1, 'new 1'],
    [2, 'new 2'],
  ]);
  expect(await builds()).toEqual(res.map(r => [r.version, r.name]));
});
