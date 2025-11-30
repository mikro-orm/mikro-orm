import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('hidden properties are not refreshed', async () => {
  const em = orm.em.fork();
  const user = new User();
  user.password = 'my-old-password';
  await em.persist(user).flush();
  await em.nativeUpdate(User, user.id, { password: 'my-new-password' });
  await em.refresh(user);
  expect(user.password).toBe('my-new-password');

  const updatedUser = await em.findOneOrFail(User, user.id, { refresh: true });
  expect(updatedUser.password).toBe('my-new-password');
});
