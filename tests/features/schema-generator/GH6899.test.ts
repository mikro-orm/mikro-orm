import { MikroORM, defineEntity, ObjectId, EntityKey } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers';

const User = defineEntity({
  name: 'User',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    email: p.string().unique().nullable(),
    firstName: p.string(),
    lastName: p.string(),
    metaData: p.json().name('meta_data').nullable(),
  }),
  indexes: [
    {
      properties: 'metaData.nesTed.field' as EntityKey,
      name: 'metaData_nesTed_field_idx',
    },
  ],
  uniques: [
    {
      properties: 'metaData.nesTed.field' as EntityKey,
      name: 'metaData_nesTed_field_uniq',
    },
  ],
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: '6899',
  });
  await orm.schema.dropIndexes();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6899', async () => {
  const mock = mockLogger(orm);
  await orm.schema.updateSchema();
  let calls = mock.mock.calls.sort((call1, call2) => (call1[0] as string).localeCompare(call2[0] as string));
  expect(calls[0][0]).toMatch(`db.getCollection('user').createIndex({ 'meta_data.nesTed.field': 1 }, { name: 'metaData_nesTed_field_idx', unique: false });`);
  expect(calls[1][0]).toMatch(`db.getCollection('user').createIndex({ 'meta_data.nesTed.field': 1 }, { name: 'metaData_nesTed_field_uniq', unique: true });`);
  expect(calls[2][0]).toMatch(`db.getCollection('user').createIndex({ email: 1 }, { unique: true, sparse: true });`);
  mock.mockReset();
  await orm.schema.dropIndexes();
  calls = mock.mock.calls.sort((call1, call2) => (call1[0] as string).localeCompare(call2[0] as string));
  expect(calls[0][0]).toMatch(`db.getCollection('user').dropIndex('email_1');`);
  expect(calls[1][0]).toMatch(`db.getCollection('user').dropIndex('metaData_nesTed_field_idx');`);
  expect(calls[2][0]).toMatch(`db.getCollection('user').dropIndex('metaData_nesTed_field_uniq');`);
});
