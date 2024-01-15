import { Property, Entity, PrimaryKey, MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

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
    dbName: ':memory:',
    entities: [User],
    ensureDatabase: { create: true },
  });
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('upsert should not modify data object unless it is an entity', async () => {
  const data = { name: 'Foo', email: 'foo' };
  orm.em.create(User, data);
  await orm.em.flush();
  orm.em.clear();

  expect(data).toMatchObject({ name: 'Foo', email: 'foo' });

  data.name = 'Bar';
  const newUser = await orm.em.upsert(User, data);

  expect(data).toMatchObject({ name: 'Bar', email: 'foo' });
  expect({ name: 'Bar', email: 'foo' }).toMatchObject(data);
});

test('upsertMany should not modify data object unless it is an entity', async () => {
  const data1 = { name: 'Foo1', email: 'foo1' };
  const data2 = { name: 'Foo2', email: 'foo2' };
  orm.em.create(User, data1);
  orm.em.create(User, data2);
  await orm.em.flush();
  orm.em.clear();

  expect(data1).toMatchObject({ name: 'Foo1', email: 'foo1' });
  expect(data2).toMatchObject({ name: 'Foo2', email: 'foo2' });

  data1.name = 'Bar1';
  data2.name = 'Bar2';
  const [newUser1, newUser2] = await orm.em.upsertMany(User, [data1, data2]);

  expect(data1).toMatchObject({ name: 'Bar1', email: 'foo1' });
  expect(data2).toMatchObject({ name: 'Bar2', email: 'foo2' });
  expect({ name: 'Bar1', email: 'foo1' }).toMatchObject(data1);
  expect({ name: 'Bar2', email: 'foo2' }).toMatchObject(data2);
});
