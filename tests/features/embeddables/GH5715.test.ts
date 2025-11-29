import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Embedded({ entity: () => Role, array: true, nullable: true })
  roles?: Role[] | null;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Embeddable()
class Role {

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5715', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo0' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.upsert(User,
    { name: 'Bar', email: 'foo0', roles: null },
  );
  expect(user.name).toBe('Bar');
});

test('5723', async () => {
  const user1 = orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    roles: [{ name: 'Foo' }],
  });
  const user2 = orm.em.create(User, {
    name: 'Bar',
    email: 'bar',
    roles: [{ name: 'Bar' }],
  });
  await orm.em.flush();

  user1.name = 'Baz';
  user1.roles = null;

  user2.name = 'Qux';
  user2.roles = null;

  await orm.em.flush();
  orm.em.clear();

  const user1Check = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user1Check.name).toBe('Baz');

  const user2Check = await orm.em.findOneOrFail(User, { email: 'bar' });
  expect(user2Check.name).toBe('Qux');
});
