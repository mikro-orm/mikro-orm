import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  _id!: number;


  @Property({ type: 'boolean' })
  email!: string;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'GH3216',
    type: 'mongo',
  });
  await orm.getSchemaGenerator().dropSchema();
});

afterAll(() => orm.close(true));

test('retry limit to 3 when ensureIndex() fails', async () => {
  const user1 = await orm.em.create(User, {
    email: 'test',
  });
  const user2 = await orm.em.create(User, {
    email: 'test',
  });
  await orm.em.persistAndFlush(
    [user1, user2],
  );
  const userMeta = orm.em.getMetadata().get('User');
  userMeta.uniques = [{
    properties: 'email',
  }];
  await expect(
    orm.getSchemaGenerator().ensureIndexes(),
  ).rejects.toThrowError(/Failed to create indexes:/);
});
