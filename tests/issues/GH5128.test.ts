import { Entity, PrimaryKey, Property, MikroORM, BaseEntity } from '@mikro-orm/sqlite';

@Entity()
class User extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    ensureDatabase: { create: true },
  });

  orm.em.create(User, { name: 'Foo', email: 'foo' });
  orm.em.create(User, { name: 'Foo2', email: 'foo2' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('problem 1', async () => {
  const userFound = await orm.em.findOneOrFail(
    User,
    { email: 'foo' },
    {
      fields: ['email'],
    },
  );

  expect(userFound.toObject()).toEqual({ email: 'foo', id: 1 });
  const user2Found = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user2Found.toObject()).toEqual({ email: 'foo', id: 1, name: 'Foo' }); // missing name
});

test('problem 2', async () => {
  const usersFound = await orm.em.find(User, {});

  expect(JSON.parse(JSON.stringify(usersFound))).toEqual([
    { email: 'foo', id: 1, name: 'Foo' }, // also missing name
    { email: 'foo2', id: 2, name: 'Foo2' },
  ]);
});
