import { Collection, MikroORM, ref, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany(() => Address, address => address.user)
  addresses = new Collection<Address>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

@Entity()
class Address {
  @PrimaryKey()
  id!: number;

  @Property()
  type: string;

  @Property()
  country: string;

  @ManyToOne(() => User)
  user: Ref<User>;

  constructor(type: string, country: string, user: User) {
    this.type = type;
    this.country = country;
    this.user = ref(user);
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Address],
    debug: ['query', 'query-params'],
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH6160 - order with filtered relation and limit', async () => {
  // Setup: User1 has home (Zambia) and work (Albania) addresses
  //        User2 has home (Germany) address
  const user1 = orm.em.create(User, { name: 'User1', email: 'foo' });
  const user2 = orm.em.create(User, { name: 'User2', email: 'bar' });
  orm.em.create(Address, {
    type: 'home',
    user: user1,
    country: 'Zambia',
  });
  orm.em.create(Address, {
    type: 'work',
    user: user1,
    country: 'Albania', // This is alphabetically before Germany and Zambia
  });
  orm.em.create(Address, {
    type: 'home',
    user: user2,
    country: 'Germany',
  });

  await orm.em.flush();
  orm.em.clear();

  // When filtering by home addresses and ordering by country,
  // the order should be: User2 (Germany), User1 (Zambia)
  // NOT: User1 (Albania - which is a work address, not home)
  const users = await orm.em.find(
    User,
    { addresses: { type: 'home' } },
    { limit: 10, orderBy: { addresses: { country: 'ASC' } } },
  );

  // Expected: User2 first (home in Germany), then User1 (home in Zambia)
  // Bug: User1 might come first because outer query sees Albania (work address)
  expect(users.map(u => u.name)).toEqual(['User2', 'User1']);
});

test('GH6160 - order without limit should work correctly', async () => {
  orm.em.clear();

  // Without limit, the query should work correctly
  const users = await orm.em.find(
    User,
    { addresses: { type: 'home' } },
    { orderBy: { addresses: { country: 'ASC' } } },
  );

  expect(users.map(u => u.name)).toEqual(['User2', 'User1']);
});
