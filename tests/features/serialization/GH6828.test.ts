import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ hidden: true })
  password!: string;

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

test('hidden properties are not refreshed', async () => {
  const em = orm.em.fork();
  const user = new User();
  user.password = 'my-old-password';
  await em.persistAndFlush(user);
  await em.nativeUpdate(User, user.id, { password: 'my-new-password' });
  await em.refresh(user);
  expect(user.password).toBe('my-new-password');

  const updatedUser = await em.findOneOrFail(User, user.id, { refresh: true });
  expect(updatedUser.password).toBe('my-new-password');
});
