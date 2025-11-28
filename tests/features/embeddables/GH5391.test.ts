import { MikroORM, Ref } from '@mikro-orm/libsql';

import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Embeddable()
class RoleMeta {

  @Property()
  testString!: string;

}

@Entity()
class Role {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded({ entity: () => RoleMeta, nullable: true, object: true })
  meta?: RoleMeta;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @ManyToOne(() => Role, { ref: true })
  role!: Ref<Role>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Role, RoleMeta],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('Fetching an entity by a field in embeddable of a relation - does not work', async () => {
  orm.em.create(Role, { name: 'Foo', meta: { testString: 'test' } });
  await orm.em.flush();
  orm.em.clear();

  const role = await orm.em.findOneOrFail(Role, { name: 'Foo' });
  orm.em.create(User, { name: 'Foo', email: 'foo', role });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, {
    email: 'foo',
    role: {
      meta: {
        testString: 'test',
      },
    },
  });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: 'foo' });
  expect(count).toBe(0);
});

test('Fetching an entity by a field in embeddable - working', async () => {
  orm.em.create(Role, { name: 'Foo1', meta: { testString: 'test1' } });
  await orm.em.flush();
  orm.em.clear();

  const role = await orm.em.findOneOrFail(Role, {
    meta: {
      testString: 'test1',
    },
  });

  expect(role.name).toBe('Foo1');
  orm.em.remove(role);
  await orm.em.flush();

  const count = await orm.em.count(Role, { name: 'Foo1' });
  expect(count).toBe(0);
});
