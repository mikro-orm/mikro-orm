import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6867', async () => {
  const createdUser = orm.em.create(User, { name: 'Jon' });
  await orm.em.flush();
  orm.em.clear();

  const jon = await orm.em.findOneOrFail(User, { name: 'Jon' });
  jon.name = '123';
  await orm.em.flush();

  await orm.em.refresh(createdUser);
  expect(createdUser.name).toBe('123');
});
