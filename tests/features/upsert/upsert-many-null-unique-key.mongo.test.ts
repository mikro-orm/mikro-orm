import { defineEntity, MikroORM, p } from '@mikro-orm/mongodb';

// MongoDB inserts the rows without any unique value as part of the batch, a single row upsert would match every document.
const User = defineEntity({
  name: 'User',
  properties: {
    _id: p.type('ObjectId').primary(),
    email: p.string().unique().nullable(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_upsert_null_unique_key',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.clear();
});

afterAll(() => orm.close(true));

test('upsertMany inserts a row with a null unique key without touching the other documents', async () => {
  await orm.em.insertMany(User, [
    { email: 'a@example.com', name: 'old a' },
    { email: 'b@example.com', name: 'old b' },
  ]);
  const res = await orm.em.fork().upsertMany(User, [
    { email: 'a@example.com', name: 'a' },
    { email: null, name: 'c' },
  ]);

  const rows = await orm.em.fork().find(User, {}, { orderBy: { name: 1 } });
  expect(rows.map(row => row.name)).toEqual(['a', 'c', 'old b']);
  expect(res.map(e => e.name)).toEqual(['a', 'c']);
  expect(res[1]._id).toEqual(rows[1]._id);
});
