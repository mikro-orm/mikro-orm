import { helper, MikroORM, Opt } from '@mikro-orm/postgresql';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class User {

  @PrimaryKey({ type: 'integer', generated: 'by default as identity' })
  id!: number & Opt;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6593',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6593', async () => {
  let em = orm.em.fork();
  em.create(User, { name: 'Foo', email: 'foo' });
  em.create(User, { name: 'Foo1', email: 'foo1' });
  em.create(User, { name: 'Foo2', email: 'foo2' });
  await em.flush();

  em = orm.em.fork();
  const user = await em.findOneOrFail(User, { email: 'foo' });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  expect(helper(user).__originalEntityData).toEqual({ id: 1, name: 'Foo', email: 'foo' });
  await em.flush();
  expect(helper(user).__originalEntityData).toEqual({ id: 1, name: 'Bar', email: 'foo' });

  const user1 = await em.findOneOrFail(User, { email: 'foo' });

  user1.name = 'Foo';
  await em.flush();
  em.clear();

  const user2 = await em.findOneOrFail(User, { email: 'foo1' });
  expect(user2.name).toBe('Foo1');
});
