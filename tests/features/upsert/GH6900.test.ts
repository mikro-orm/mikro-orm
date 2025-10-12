import { defineEntity, ObjectId, MikroORM, EntityKey } from '@mikro-orm/mongodb';
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
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: '6899',
  });
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6900', async () => {
  const id = new ObjectId();
  const firstUser = {
    firstName: 'firstname',
    lastName: 'lastname',
    email: `foo1@bar.fr`,
    metaData: {
      workspaceId: 'wkId1',
    },
  };
  orm.em.create(User, { _id: id, ...firstUser });
  await orm.em.flush();

  const mock = mockLogger(orm);
  await orm.em.fork().upsert(
    User,
    {
      ...firstUser,
      firstName: 'updated firstName',
    },
    {
      onConflictFields: ['metaData.workspaceId' as EntityKey],
    },
  );

  expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').updateMany({ 'meta_data.workspaceId': 'wkId1' }, { '$set': { firstName: 'updated firstName', lastName: 'lastname', email: 'foo1@bar.fr', meta_data: { workspaceId: 'wkId1' } } }, { upsert: true });`);
  expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('user').find({}, { projection: { _id: 1 } }).limit(1).toArray();`);
  await orm.em.fork().upsertMany(
    User,
    [{
      ...firstUser,
      firstName: 'updated firstName',
    }],
    {
      onConflictFields: ['metaData.workspaceId' as EntityKey],
    },
  );
  expect(mock.mock.calls[2][0]).toMatch(`bulk = db.getCollection('user').initializeUnorderedBulkOp({ upsert: true });bulk.find({ 'meta_data.workspaceId': 'wkId1' }).upsert().update({ '$set': { firstName: 'updated firstName', lastName: 'lastname', email: 'foo1@bar.fr', meta_data: { workspaceId: 'wkId1' } } });bulk.execute()`);
});
