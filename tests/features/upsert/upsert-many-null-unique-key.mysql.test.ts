import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';

// MySQL has no RETURNING, so `upsertMany` reloads the rows by their unique values, which a `null` cannot provide.
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().autoincrement(),
    email: p.string().unique().nullable(),
    name: p.string(),
  },
});

const Log = defineEntity({
  name: 'Log',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    note: p.string().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User, Log], dbName: 'mikro_orm_upsert_null_unique_key', port: 3308 });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insertMany(User, [
    { email: null, name: 'old' },
    { email: 'a@example.com', name: 'old a' },
  ]);
});

afterAll(() => orm.close(true));

async function expectStored(res: { id: number; name: string }[], names: string[], total: number) {
  const rows = await orm.em.fork().find(User, { name: { $in: names } });
  const stored = new Map(rows.map(row => [row.name, row.id]));
  expect(res.map(e => e.name)).toEqual(names);
  expect(res.map(e => e.id)).toEqual(names.map(name => stored.get(name)));
  expect(await orm.em.fork().count(User)).toBe(total);
}

test('loads the primary keys of rows with a null unique key mixed with conflicting rows', async () => {
  const res = await orm.em.fork().upsertMany(User, [
    { email: 'a@example.com', name: 'a' },
    { email: null, name: 'b' },
    { email: 'c@example.com', name: 'c' },
    { email: null, name: 'd' },
  ]);

  await expectStored(res, ['a', 'b', 'c', 'd'], 5);
});

test('loads the primary keys when every row has a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(User, [
    { email: null, name: 'b' },
    { email: null, name: 'c' },
  ]);

  await expectStored(res, ['b', 'c'], 4);
});

test('loads the primary keys when every row has a null unique key and onConflictFields are explicit', async () => {
  const res = await orm.em.fork().upsertMany(
    User,
    [
      { email: null, name: 'b' },
      { email: null, name: 'c' },
    ],
    { onConflictFields: ['email'] },
  );

  await expectStored(res, ['b', 'c'], 4);
});

test('reloads the rows of an entity without any unique key by their generated primary keys', async () => {
  await orm.em.insertMany(Log, [
    { name: 'old 1', note: 'note 1' },
    { name: 'old 2', note: 'note 2' },
  ]);
  const res = await orm.em.fork().upsertMany(Log, [{ name: 'a' }, { name: 'b' }]);
  const rows = await orm.em.fork().find(Log, { name: ['a', 'b'] }, { orderBy: { name: 'asc' } });

  expect(res.map(e => [e.id, e.name, e.note])).toEqual(rows.map(row => [row.id, row.name, null]));
  expect(rows).toHaveLength(2);
});
