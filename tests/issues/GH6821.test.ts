import { defineEntity, MikroORM, ObjectId, p } from '@mikro-orm/mongodb';
import { mockLogger } from '../helpers.js';

const User = defineEntity({
  name: 'User',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().index(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()).onUpdate(() => new Date()),
    firstName: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [User],
    dbName: '6821',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6821', async () => {
  const data = {
    id: 'custom-id-123',
    firstName: 'Martin',
  };
  const user = orm.em.create(User, data);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').insertMany([ { id: 'custom-id-123'`);
  expect(data).toEqual({ id: 'custom-id-123', firstName: 'Martin' });
  expect(user).toMatchObject({ id: 'custom-id-123', firstName: 'Martin' });
});
