import { defineEntity, MikroORM, p } from '@mikro-orm/mongodb';

// MongoDB inserts the rows without any unique value as part of the batch, those get the initial version.
const Doc = defineEntity({
  name: 'Doc',
  properties: {
    _id: p.type('ObjectId').primary(),
    key: p.string().unique().nullable(),
    name: p.string(),
    version: p.integer().version(),
  },
});

const RenamedDoc = defineEntity({
  name: 'RenamedDoc',
  properties: {
    _id: p.type('ObjectId').primary(),
    name: p.string(),
    version: p.integer().version().name('rev'),
  },
});

const DatedDoc = defineEntity({
  name: 'DatedDoc',
  properties: {
    _id: p.type('ObjectId').primary(),
    name: p.string(),
    version: p.datetime().version(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Doc, RenamedDoc, DatedDoc],
    dbName: 'mikro_orm_upsert_many_version_without_unique_key',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

function stored(entity: typeof Doc | typeof RenamedDoc | typeof DatedDoc) {
  return orm.em
    .getCollection<any>(entity)
    .find({}, { projection: { _id: 0 }, sort: { name: 1 } })
    .toArray();
}

test('em.upsertMany() stores the same document as em.upsert() for a row without a unique key', async () => {
  const single = await orm.em.fork().upsert(Doc, { name: 'a' });
  const [many] = await orm.em.fork().upsertMany(Doc, [{ name: 'b' }]);

  expect(await stored(Doc)).toEqual([
    { name: 'a', version: 1 },
    { name: 'b', version: 1 },
  ]);
  expect(single.version).toBe(1);
  expect(many.version).toBe(1);
});

test('em.upsertMany() versions each row of a mixed batch', async () => {
  await orm.em.fork().insert(Doc, { key: 'k1', name: 'a' });

  const em = orm.em.fork();
  const docs = await em.upsertMany(Doc, [
    { name: 'b' }, // inserts, nothing to match on
    { key: 'k1', name: 'a' }, // exists
    { key: 'k2', name: 'c' }, // inserts
    { name: 'd', version: 5 }, // inserts with an explicit version
  ]);

  expect(docs.map(d => d.version)).toEqual([1, 2, 1, 5]);
  expect(await stored(Doc)).toEqual([
    { key: 'k1', name: 'a', version: 2 },
    { name: 'b', version: 1 },
    { key: 'k2', name: 'c', version: 1 },
    { name: 'd', version: 5 },
  ]);

  docs.forEach(d => (d.name += '!'));
  await em.flush();
  expect((await stored(Doc)).map(d => d.version)).toEqual([3, 2, 2, 6]);
});

test('em.upsertMany() respects a custom field name of the version property', async () => {
  const em = orm.em.fork();
  const [doc] = await em.upsertMany(RenamedDoc, [{ name: 'a' }]);

  expect(doc.version).toBe(1);
  expect(await stored(RenamedDoc)).toEqual([{ name: 'a', rev: 1 }]);

  doc.name = 'b';
  await em.flush();
  expect(await stored(RenamedDoc)).toEqual([{ name: 'b', rev: 2 }]);
});

test('em.upsertMany() stores a Date version for a row without a unique key', async () => {
  const [doc] = await orm.em.fork().upsertMany(DatedDoc, [{ name: 'a' }]);

  expect(doc.version).toBeInstanceOf(Date);
  expect(await stored(DatedDoc)).toEqual([{ name: 'a', version: doc.version }]);
});
