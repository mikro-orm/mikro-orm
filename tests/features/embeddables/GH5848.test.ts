import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Properties {

  @Property({ lazy: true })
  tag: string;

  @Property({ lazy: true })
  value: string;

  constructor(tag: string) {
    this.tag = tag;
    this.value = 'val 123';
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Embedded(() => Properties)
  properties: Properties;

  constructor(name: string, email: string, properties: Properties) {
    this.name = name;
    this.email = email;
    this.properties = properties;
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

test('5848', async () => {
  orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    properties: new Properties('Bar'),
  });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);

  const user1 = await orm.em.fork().findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['properties.tag'] },
  );
  expect(user1.name).toBe('Foo');
  expect(user1.email).toBe('foo');
  expect(user1.properties.tag).toBe('Bar');
  expect(user1.properties.value).toBeUndefined();
  expect(mock.mock.calls[0][0]).toMatch("select `u0`.`id`, `u0`.`name`, `u0`.`email`, `u0`.`properties_tag` from `user` as `u0` where `u0`.`email` = 'foo' limit 1");

  const user2 = await orm.em.fork().findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['properties.tag', 'properties.value'] },
  );
  expect(user2.name).toBe('Foo');
  expect(user2.email).toBe('foo');
  expect(user2.properties.tag).toBe('Bar');
  expect(user2.properties.value).toBe('val 123');
  expect(mock.mock.calls[1][0]).toMatch("select `u0`.* from `user` as `u0` where `u0`.`email` = 'foo' limit 1");

  expect(mock).toHaveBeenCalledTimes(2);
});
