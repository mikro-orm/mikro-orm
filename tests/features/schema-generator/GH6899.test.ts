import { MikroORM, EntitySchema } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers';

const Users = new EntitySchema({
  name: 'Users',
  properties: {
    _id: {
      type: 'ObjectId',
      primary: true,
    },
    email: {
      type: 'string',
      nullable: true,
      unique: true,
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    metaData: {
      name: 'meta_data',
      type: 'json',
      nullable: true,
    },
  },
  indexes: [
    {
      properties: 'metaData.nesTed.field' as string,
      name: 'metaData_nesTed_field_idx',
    },
  ],
  uniques: [
    {
      properties: 'metaData.nesTed.field' as string,
      name: 'metaData_nesTed_field_uniq',
    },
  ],
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Users],
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
  expect(calls[0][0]).toMatch(`db.getCollection('users').createIndex({ 'meta_data.nesTed.field': 1 }, { name: 'metaData_nesTed_field_idx', unique: false });`);
  expect(calls[1][0]).toMatch(`db.getCollection('users').createIndex({ 'meta_data.nesTed.field': 1 }, { name: 'metaData_nesTed_field_uniq', unique: true });`);
  expect(calls[2][0]).toMatch(`db.getCollection('users').createIndex({ email: 1 }, { unique: true, sparse: true });`);
  mock.mockReset();
  await orm.schema.dropIndexes();
  calls = mock.mock.calls.sort((call1, call2) => (call1[0] as string).localeCompare(call2[0] as string));
  expect(calls[0][0]).toMatch(`db.getCollection('users').dropIndex('email_1');`);
  expect(calls[1][0]).toMatch(`db.getCollection('users').dropIndex('metaData_nesTed_field_idx');`);
  expect(calls[2][0]).toMatch(`db.getCollection('users').dropIndex('metaData_nesTed_field_uniq');`);
});
