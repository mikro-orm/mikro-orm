import { Entity, PrimaryKeyProp, OneToOne, Property, PrimaryKey, MikroORM, Rel } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToOne({ entity: () => UserMeta, mappedBy: 'user', nullable: true })
  meta?: Rel<UserMeta>;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class UserMeta {

  [PrimaryKeyProp]?: 'user';

  @OneToOne({ entity: () => User, primary: true })
  user!: User;

  @Property()
  bio: string;

  constructor(user: User, bio: string) {
    this.user = user;
    this.bio = bio;
  }

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

test('joining all users with their meta', async () => {
  const userWithMeta = orm.em.create(User, { name: 'Foo', email: 'foo' });
  const meta = orm.em.create(UserMeta, { user: userWithMeta, bio: 'Bio' });

  await orm.em.persistAndFlush([userWithMeta, meta]);

  const userWithoutMeta = orm.em.create(User, { name: 'Bar', email: 'bar' });
  await orm.em.persistAndFlush(userWithoutMeta);

  orm.em.clear();

  const mock = mockLogger(orm);
  const users = await orm.em.find(
    User,
    {},
    {
      populate: ['meta'],
    },
  );
  expect(users).toHaveLength(2);
  expect(users[0].meta).toBeDefined();
  expect(users[1].meta).toBeNull();
  expect(mock).toHaveBeenCalledTimes(1);
});
