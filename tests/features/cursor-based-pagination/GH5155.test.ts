import { MikroORM, QueryOrder, Ref, ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Org {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
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

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class OrgMembership {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { ref: true })
  user: Ref<User>;

  @ManyToOne(() => Org, { ref: true })
  org: Ref<Org>;

  constructor(user: User, org: Org) {
    this.user = ref(user);
    this.org = ref(org);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, OrgMembership, Org],
  });
  await orm.schema.create();

  const org = orm.em.create(Org, { name: 'The Org' });
  const user1 = orm.em.create(User, { name: 'Abc', email: 'foo' });
  const user2 = orm.em.create(User, { name: 'Bar', email: 'bar' });
  const user3 = orm.em.create(User, { name: 'Bar', email: 'bar2' });
  const user4 = orm.em.create(User, { name: 'Baz', email: 'baz' });
  orm.em.create(OrgMembership, { user: user1, org });
  orm.em.create(OrgMembership, { user: user2, org });
  orm.em.create(OrgMembership, { user: user3, org });
  orm.em.create(OrgMembership, { user: user4, org });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('validate missing populate hint', async () => {
  const res = await orm.em.findByCursor(OrgMembership, { orderBy: { user: { name: QueryOrder.ASC } }, first: 1 });
  expect(() => res.startCursor).toThrow(`Cannot create cursor, value for 'OrgMembership.user' is missing.`);
  const goodCursor = await orm.em.findByCursor(OrgMembership, {
    orderBy: { user: { name: QueryOrder.ASC } },
    populate: ['user'],
    first: 1,
  });

  expect(goodCursor.endCursor).toBe('W3sibmFtZSI6IkFiYyJ9XQ');
});

test('cursor from multiple order by clauses', async () => {
  const cursor1 = await orm.em.findByCursor(OrgMembership, {
    populate: ['user'],
    orderBy: [
      { user: { name: QueryOrder.ASC } },
      { user: 'asc' },
    ],
    first: 1,
  });
  expect(cursor1.items[0].user.$.email).toBe('foo');

  const cursor2 = await orm.em.findByCursor(OrgMembership, {
    populate: ['user'],
    orderBy: [
      { user: { name: QueryOrder.ASC } },
      { user: 'asc' },
    ],
    first: 1,
    after: cursor1,
  });
  expect(cursor2.items[0].user.$.email).toBe('bar');

  const cursor3 = await orm.em.findByCursor(OrgMembership, {
    populate: ['user'],
    orderBy: [
      { user: { name: QueryOrder.ASC } },
      { user: 'asc' },
    ],
    first: 1,
    after: cursor2,
  });
  expect(cursor3.items[0].user.$.email).toBe('bar2');
});
