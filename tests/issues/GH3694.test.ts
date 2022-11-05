import { Entity, PrimaryKey, Ref, OneToMany, Collection, ManyToOne, Enum, wrap, compareArrays } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

enum Enum1 {
  A = 'A',
}

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @OneToMany(() => UserAccount, u => u.user)
  userAccounts = new Collection<UserAccount>(this);

  @Enum({ items: () => Enum1, array: true })
  enum1: Enum1[] = [];

  constructor(init: { id: number; enum1?: Enum1[] }) {
    this.id = init.id;
    this.enum1 = init.enum1 ?? [];
  }

}

@Entity()
class UserAccount {

  @PrimaryKey()
  id: number;

  @ManyToOne(() => User, { onDelete: 'cascade', ref: true })
  user: Ref<User>;

  constructor(init: { id: number; user: Ref<User> }) {
    this.id = init.id;
    this.user = init.user;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, UserAccount],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 3694 1/2', async () => {
  const user = new User({ id: 1 });

  const ua = new UserAccount({ id: 1, user: wrap(user).toReference() });
  await orm.em.fork().persistAndFlush([user, ua]);

  const foundUser = await orm.em.fork().find(User, {});
  expect(foundUser).toHaveLength(1);

  const foundUA = await orm.em.fork().find(UserAccount, {}, { populate: ['user'] });
  expect(foundUA).toHaveLength(1);
});

test('GH issue 3694 2/2', async () => {
  const user = new User({ id: 1, enum1: [Enum1.A] });

  const ua = new UserAccount({ id: 1, user: wrap(user).toReference() });
  await orm.em.fork().persistAndFlush([user, ua]);

  const foundUser = await orm.em.fork().find(User, {});
  expect(foundUser).toHaveLength(1);

  const foundUA = await orm.em.fork().find(UserAccount, {}, { populate: ['user'] });
  expect(foundUA).toHaveLength(1);
});
