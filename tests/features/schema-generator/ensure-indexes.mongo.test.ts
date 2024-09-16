import { Entity, MikroORM, ObjectId, PrimaryKey, Property } from '@mikro-orm/mongodb';

@Entity()
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Property({ unique: true, index: true })
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

test('basic CRUD example', async () => {
  let error!: Error;

  try {
    await orm.schema.refreshDatabase();
  } catch (e: any) {
    error = e;
  }

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toMatch('Failed to create indexes on the following collections: user');
  expect(error.message).toMatch('An existing index has the same name as the requested index. When index names are not specified, they are auto generated and can cause conflicts. Please refer to our documentation. Requested index: ');
  expect(Array.isArray(error.cause)).toBe(true);
  expect(error.cause).toHaveLength(1);
  expect((error.cause as Error[])[0]).toBeInstanceOf(Error);
  expect((error.cause as Error[])[0].message).toMatch('An existing index has the same name as the requested index. When index names are not specified, they are auto generated and can cause conflicts. Please refer to our documentation. Requested index: ');
});
