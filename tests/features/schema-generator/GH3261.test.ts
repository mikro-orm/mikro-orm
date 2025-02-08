import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/mongodb';

@Entity()
class User {

  @PrimaryKey()
  _id!: number;

  @Property()
  email!: string;

}
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro-orm-test-gh3261',
  });
  await orm.schema.dropSchema();
});

afterAll(() => orm.close(true));

test('retry limit to 3 when ensureIndex() fails', async () => {
  orm.em.create(User, {
    email: 'test',
  });
  orm.em.create(User, {
    email: 'test',
  });
  await orm.em.flush();
  const userMeta = orm.em.getMetadata(User);
  userMeta.uniques = [{
    properties: 'email',
  }];
  await expect(orm.schema.ensureIndexes()).rejects.toThrow(/Failed to create indexes on the following collections: user\n.*E11000 duplicate key error collection/);
});
