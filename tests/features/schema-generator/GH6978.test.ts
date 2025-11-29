import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
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

  const calls = mock.mock.calls.sort((a, b) => a[0].localeCompare(b[0]));
  expect(calls[0][0]).toMatch(`db.getCollection('user').createIndex({ Email: 1 }, { unique: true });`);
  expect(calls[1][0]).toMatch(`db.getCollection('user').createIndex({ Name: 1 }, { unique: false });`);
});
