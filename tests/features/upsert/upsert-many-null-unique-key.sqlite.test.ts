import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// A `null` in a unique key never conflicts, so such a row is always inserted and has no unique value to be reloaded by.
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().autoincrement(),
    email: p.string().unique().nullable(),
    name: p.string(),
  },
});

const Tenant = defineEntity({
  name: 'Tenant',
  properties: {
    org: p.integer().primary(),
    id: p.integer().primary(),
    email: p.string().unique().nullable(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User, Tenant], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insertMany(User, [
    { email: null, name: 'old' },
    { email: 'a@example.com', name: 'old a' },
  ]);
});

afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

function withoutReturning() {
  vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
}

async function expectStored(res: { id: number; name: string }[], names: string[], total: number) {
  const rows = await orm.em.fork().find(User, { name: { $in: names } });
  const stored = new Map(rows.map(row => [row.name, row.id]));
  expect(res.map(e => e.name)).toEqual(names);
  expect(res.map(e => e.id)).toEqual(names.map(name => stored.get(name)));
  expect(await orm.em.fork().count(User)).toBe(total);
}

test('upsertMany without RETURNING loads the primary key of a row with a null unique key', async () => {
  withoutReturning();
  const res = await orm.em.fork().upsertMany(User, [
    { email: 'a@example.com', name: 'a' },
    { email: null, name: 'b' },
    { email: 'c@example.com', name: 'c' },
  ]);

  await expectStored(res, ['a', 'b', 'c'], 4);
});

test('upsertMany without RETURNING and with explicit onConflictFields', async () => {
  withoutReturning();
  const res = await orm.em.fork().upsertMany(
    User,
    [
      { email: null, name: 'b' },
      { email: 'a@example.com', name: 'a' },
    ],
    { onConflictFields: ['email'] },
  );

  await expectStored(res, ['b', 'a'], 3);
});

test('upsertMany ignoring a conflict next to a row with a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(
    User,
    [
      { email: 'a@example.com', name: 'old a' },
      { email: null, name: 'b' },
    ],
    { onConflictAction: 'ignore' },
  );

  await expectStored(res, ['old a', 'b'], 3);
});

test('upsertMany ignoring conflicts when every row has a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(
    User,
    [
      { email: null, name: 'b' },
      { email: null, name: 'c' },
    ],
    { onConflictAction: 'ignore' },
  );

  await expectStored(res, ['b', 'c'], 4);
});

test('upsertMany with onConflictWhere next to a row with a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(
    User,
    [
      { email: 'a@example.com', name: 'a' },
      { email: null, name: 'b' },
    ],
    { onConflictFields: ['email'], onConflictWhere: { name: 'other' } },
  );

  await expectStored(res, ['old a', 'b'], 3);
});

test('upsertMany without RETURNING and with entity instances', async () => {
  withoutReturning();
  const em = orm.em.fork();
  const res = await em.upsertMany([
    em.create(User, { email: 'a@example.com', name: 'a' }, { persist: false }),
    em.create(User, { email: null, name: 'b' }, { persist: false }),
  ]);

  await expectStored(res, ['a', 'b'], 3);
});

test('upsert without RETURNING and with explicit onConflictFields', async () => {
  withoutReturning();
  const res = await orm.em.fork().upsert(User, { email: null, name: 'b' }, { onConflictFields: ['email'] });

  await expectStored([res], ['b'], 3);
});

test('upsert ignoring conflicts with a composite primary key and a null unique key', async () => {
  await orm.em.insertMany(Tenant, [{ org: 9, id: 9, email: null, name: 'old' }]);
  const res = await orm.em
    .fork()
    .upsert(
      Tenant,
      { org: 1, id: 2, email: null, name: 'b' },
      { onConflictFields: ['email'], onConflictAction: 'ignore' },
    );

  expect(res).toMatchObject({ org: 1, id: 2, name: 'b' });
  expect(await orm.em.fork().count(Tenant)).toBe(2);
});
