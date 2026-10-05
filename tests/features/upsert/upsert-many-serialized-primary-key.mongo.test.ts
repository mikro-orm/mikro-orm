import { defineEntity, MikroORM, ObjectId, p } from '@mikro-orm/mongodb';

const Doc = defineEntity({
  name: 'Doc',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Doc],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-test-upsert-many-serialized-pk',
  });
});

beforeEach(() => orm.schema.clear());

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

test('upsertMany by the serialized primary key updates the document instead of inserting a duplicate', async () => {
  const _id = new ObjectId();
  await orm.em.fork().insert(Doc, { _id, name: 'old' });

  const res = await orm.em.fork().upsertMany(Doc, [{ id: _id.toHexString(), name: 'new' }]);
  const stored = await orm.em.fork().find(Doc, {});

  expect(res.map(doc => [doc.id, doc.name])).toEqual([[_id.toHexString(), 'new']]);
  expect(stored.map(doc => [doc.id, doc.name])).toEqual([[_id.toHexString(), 'new']]);
});
