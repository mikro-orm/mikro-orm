import { defineEntity, MikroORM, p } from '@mikro-orm/mongodb';

// MongoDB inserts the rows without any unique value as part of the batch, a single row upsert would match every document.
const User = defineEntity({
  name: 'User',
  properties: {
    _id: p.type('ObjectId').primary(),
    email: p.string().unique().nullable(),
    name: p.string(),
    note: p.string().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_upsert_null_unique_key',
    clientUrl: 'mongodb://localhost:27017',
  });
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insertMany(User, [
    { email: 'a@example.com', name: 'old a', note: 'note a' },
    { email: 'b@example.com', name: 'old b', note: 'note b' },
    { email: null, name: 'old null', note: 'note null' },
  ]);
});

afterAll(() => orm.close(true));

async function expectStored(res: InstanceType<typeof User.class>[], names: string[], notes: (string | null)[]) {
  const rows = await orm.em.fork().find(User, {});
  const stored = new Map(rows.map(row => [row.name, row._id]));
  expect(res.map(e => e.name)).toEqual(names);
  expect(res.map(e => e._id)).toEqual(names.map(name => stored.get(name)));
  expect(res.map(e => e.note ?? null)).toEqual(notes);
  expect(rows.map(row => row.name).sort()).toEqual([...names, 'old b', 'old null'].sort());
}

test('upsertMany inserts a row with a null unique key without touching the other documents', async () => {
  const res = await orm.em.fork().upsertMany(User, [
    { email: 'a@example.com', name: 'a' },
    { email: null, name: 'c' },
  ]);

  await expectStored(res, ['a', 'c'], ['note a', null]);
});

test('upsertMany reloads the rows when the first one has a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(User, [
    { email: null, name: 'c' },
    { email: 'a@example.com', name: 'a' },
  ]);

  await expectStored(res, ['c', 'a'], [null, 'note a']);
});

test('upsertMany reloads the inserted rows when every row has a null unique key', async () => {
  const res = await orm.em.fork().upsertMany(User, [
    { email: null, name: 'c' },
    { email: null, name: 'd' },
  ]);
  const rows = await orm.em.fork().find(User, { name: ['c', 'd'] }, { orderBy: { name: 1 } });

  expect(res.map(e => [e._id, e.name, e.note ?? null])).toEqual(rows.map(row => [row._id, row.name, null]));
  expect(rows).toHaveLength(2);
});
