import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  _id!: number;

  @Property()
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
  const userEntity1 = await orm.em.create(User, {
    email: 'test',
  });
  const userEntity2 = await orm.em.create(User, {
    email: 'test',
  });
});
