import { Email, Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email: Email;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('should create with Vo', async () => {
  const email = Email.from('test@test.com');
  const mock = mockLogger(orm);
  const user = orm.em.repo(User).create({ email: 'test@test.com' });
  await orm.em.flush();

  expect(email.equals(user.email)).toBe(true);

  expect(mock.mock.calls).toEqual([
    [
      '[query] begin',
    ],
    [
      "[query] insert into `user` (`email`) values ('test@test.com') returning `id`",
    ],
    [
      '[query] commit',
    ],
  ]);
});

test('should find with Vo', async () => {
  orm.em.repo(User).create({ email: 'test@test.com' });
  const email = Email.from('test@test.com');
  await orm.em.flush();

  const found = await orm.em.findOne(User, {
    email: 'test@test.com',
  });

  expect(found).toBeDefined();
  expect(found!.email.equals(email)).toBe(true);
});
