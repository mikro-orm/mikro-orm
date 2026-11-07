import { defineEntity, MikroORM, OptimisticLockError, p } from '@mikro-orm/mongodb';

const Doc = defineEntity({
  name: 'UpsertVersionDoc',
  properties: {
    _id: p.type('ObjectId').primary(),
    key: p.string().unique(),
    title: p.string(),
    version: p.integer().version(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Doc],
    dbName: 'mikro_orm_upsert_version',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insert(Doc, { key: 'd1', title: 'd1' });
});

afterAll(() => orm.close(true));

async function storedVersion(key: string) {
  const row = await orm.em.fork().findOneOrFail(Doc, { key });
  return row.version;
}

test('em.upsert() returns the version of the document it inserts or updates', async () => {
  const inserted = await orm.em.fork().upsert(Doc, { key: 'd2', title: 'd2' });
  expect(inserted.version).toBe(1);

  const updated = await orm.em.fork().upsert(Doc, { key: 'd1', title: 'd2' });
  expect(updated.version).toBe(2);
  expect(await storedVersion('d1')).toBe(2);
});

test('em.upsertMany() returns the version of each document', async () => {
  const docs = await orm.em.fork().upsertMany(Doc, [
    { key: 'd1', title: 'd2' }, // exists
    { key: 'd2', title: 'd2' }, // inserts
  ]);
  expect(docs.map(d => d.version)).toEqual([2, 1]);
});

test('upserting entity instances leaves them with the stored version', async () => {
  const em = orm.em.fork();
  const doc = await em.upsert(em.create(Doc, { key: 'd1', title: 'd2' }, { persist: false }));
  expect(doc.version).toBe(2);

  const docs = await em.upsertMany([
    em.create(Doc, { key: 'd1', title: 'd3' }, { persist: false }),
    em.create(Doc, { key: 'd2', title: 'd3' }, { persist: false }),
  ]);
  expect(docs.map(d => d.version)).toEqual([3, 1]);
});

test('an upserted entity can be changed and flushed with the version check', async () => {
  const em = orm.em.fork();
  const doc = await em.upsert(Doc, { key: 'd1', title: 'd2' });
  const em2 = orm.em.fork();
  const stale = await em2.findOneOrFail(Doc, { key: 'd1' });

  doc.title = 'd3';
  await em.flush();
  expect(await storedVersion('d1')).toBe(3);

  stale.title = 'd4';
  await expect(em2.flush()).rejects.toThrow(OptimisticLockError);
});
