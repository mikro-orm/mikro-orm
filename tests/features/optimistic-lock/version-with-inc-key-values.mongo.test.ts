import { defineEntity, MikroORM, p } from '@mikro-orm/mongodb';

const Doc = defineEntity({
  name: 'VersionIncKeyDoc',
  properties: {
    _id: p.type('ObjectId').primary(),
    key: p.string().unique(),
    data: p.json<Record<string, unknown>>().nullable(),
    version: p.integer().version(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Doc],
    dbName: 'mikro_orm_version_inc_key_values',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insert(Doc, { key: 'd1', data: { x: 1 } });
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

const stored = () => orm.em.fork().findOneOrFail(Doc, { key: 'd1' });

test('JSON value with an `$inc` key is stored as it is on flush', async () => {
  const em = orm.em.fork();
  const doc = await em.findOneOrFail(Doc, { key: 'd1' });
  em.assign(doc, { data: { $inc: 5, x: 1 } });
  await em.flush();

  expect(doc.version).toBe(2);
  expect(await stored()).toMatchObject({ data: { $inc: 5, x: 1 }, version: 2 });
});

test('JSON value with an `$inc` key is stored as it is via `em.nativeUpdate()`', async () => {
  await orm.em.fork().nativeUpdate(Doc, { key: 'd1' }, { data: { $inc: 5 } });
  expect(await stored()).toMatchObject({ data: { $inc: 5 }, version: 2 });
});

test('JSON value with an `$inc` key is stored as it is via `em.upsert()` and `em.upsertMany()`', async () => {
  const doc = await orm.em.fork().upsert(Doc, { key: 'd1', data: { $inc: 5 } });
  expect(doc.version).toBe(2);
  expect(await stored()).toMatchObject({ data: { $inc: 5 }, version: 2 });

  const [doc2] = await orm.em.fork().upsertMany(Doc, [{ key: 'd1', data: { $inc: 6 } }]);
  expect(doc2.version).toBe(3);
  expect(await stored()).toMatchObject({ data: { $inc: 6 }, version: 3 });
});

test('explicit `$inc` update is merged with the version increment', async () => {
  await orm.em.fork().nativeUpdate(Doc, { key: 'd1' }, { $inc: { 'data.x': 2 } } as any);
  expect(await stored()).toMatchObject({ data: { x: 3 }, version: 2 });
});
