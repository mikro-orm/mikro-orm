import { Entity, MikroORM, PrimaryKey, Property, Embeddable, Embedded } from '@mikro-orm/sqlite';

@Embeddable()
class Tag {

  @Property()
  key: string;

  @Property({ unique: true })
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
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

  @Embedded({ entity: () => Tag, array: true })
  tags: Tag[];

  constructor(name: string, email: string, tags: Tag[]) {
    this.name = name;
    this.email = email;
    this.tags = tags;
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

test('6198', async () => {
  const user1 = await orm.em.upsert(User, {
    name: 'Foo',
    email: 'foo',
    tags: [{ key: 'hello', value: 'world' }],
  });

  expect(user1.name).toEqual('Foo');
  expect(user1.email).toEqual('foo');
  expect(user1.tags).toEqual([new Tag('hello', 'world')]);

  const user2 = await orm.em.upsert(User, {
    name: 'Bar',
    email: 'bar',
    tags: [new Tag('hello', 'world')],
  });

  expect(user2.name).toEqual('Bar');
  expect(user2.email).toEqual('bar');
  expect(user2.tags).toEqual([new Tag('hello', 'world')]);
});
