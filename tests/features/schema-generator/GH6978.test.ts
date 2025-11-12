import { Entity, Index, MikroORM, ObjectId, PrimaryKey, Property, Unique } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers.js';

@Entity()
@Index({ properties: ['name'] })
@Unique({ properties: ['email'] })
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @Property({ fieldName: 'Name' })
  name!: string;

  @Property({ fieldName: 'Email' })
  email!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'test',
    entities: [User],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6978', async () => {
  const mock = mockLogger(orm);
  await orm.schema.ensureIndexes();

  const calls = mock.mock.calls;
  expect(calls[0][0]).toMatch(`db.getCollection('user').createIndex({ Name: 1 }, { unique: false });`);
  expect(calls[1][0]).toMatch(`db.getCollection('user').createIndex({ Email: 1 }, { unique: true });`);
});
