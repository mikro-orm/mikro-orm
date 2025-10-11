import {
  Collection,
  Embeddable,
  Embedded,
  Entity,
  FilterQuery,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Embeddable()
class UserSocials {

  @Property()
  instagram!: string;

  @Property()
  twitter!: string;

}

@Embeddable()
class UserAddress {

  @Property()
  name!: string;

  @Property()
  addressNo!: number;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @OneToMany(() => UserDetails, (details: UserDetails) => details.user)
  details = new Collection<UserDetails>(this);

}

@Entity()
class UserDetails {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  phoneNumber!: string;

  @Embedded(() => UserAddress, { prefix: false })
  address = new UserAddress();

  @Embedded(() => UserSocials, { prefix: 'social_' })
  socials = new UserSocials();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, UserDetails],
  });
  await orm.schema.refreshDatabase();

  const createdUser = orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
  });
  orm.em.create(UserDetails, {
    user: createdUser,
    phoneNumber: '123456789',
    address: { name: 'Bar', addressNo: 1 },
    socials: { instagram: 'foo_insta', twitter: 'foo_twitter' },
  });
  orm.em.create(UserDetails, {
    user: createdUser,
    phoneNumber: '123456789001',
    address: { name: 'Foo', addressNo: 12 },
    socials: { instagram: 'bar_insta', twitter: 'bar_twitter' },
  });
  orm.em.create(UserDetails, {
    user: createdUser,
    phoneNumber: '123456789002',
    address: { name: 'FooBar', addressNo: 5 },
    socials: { instagram: 'foobar_insta', twitter: 'foobar_twitter' },
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(() => {
  orm.em.clear();
});

test('should expand embeddable on 1:m', async () => {
  const userDetailsQ: FilterQuery<UserDetails> = { address: { name: { $eq: 'FooBar' } } };
  const user = await orm.em.findOneOrFail(User, { email: 'foo', details: { $some: userDetailsQ } }, { fields: ['name', 'details.address'], populate: ['details'], populateWhere: { details: userDetailsQ } });

  expect(user!.name).toBe('Foo');
  expect(user!.details.count()).toEqual(1);

  const userDetails = user!.details.getItems();
  expect(userDetails[0].address).toBeDefined();
  expect(userDetails[0].address).toEqual({ name: 'FooBar', addressNo: 5 });
});

test('should partially expand embeddable on 1:m', async () => {
  const userDetailsQ: FilterQuery<UserDetails> = { address: { name: { $eq: 'FooBar' } } };
  const user = await orm.em.findOneOrFail(User, {
    email: 'foo',
    details: { $some: userDetailsQ },
  }, { fields: ['name', 'details.address.name'], populate: ['details'], populateWhere: { details: userDetailsQ } });

  expect(user!.name).toBe('Foo');
  expect(user!.details.count()).toEqual(1);

  const userDetails = user!.details.getItems();
  expect(userDetails[0].address).toBeDefined();
  expect(userDetails[0].address).toEqual({ name: 'FooBar' });
});

test('should expand object embeddable on 1:m', async () => {
  const userDetailsQ: FilterQuery<UserDetails> = { address: { name: { $eq: 'FooBar' } } };
  const user = await orm.em.findOneOrFail(User, { email: 'foo', details: { $some: userDetailsQ } }, { fields: ['name', 'details.socials'], populate: ['details'], populateWhere: { details: userDetailsQ } });

  expect(user!.name).toBe('Foo');
  expect(user!.details.count()).toEqual(1);

  const userDetails = user!.details.getItems();
  expect(userDetails[0].socials).toBeDefined();
  expect(userDetails[0].socials).toEqual({ instagram: 'foobar_insta', twitter: 'foobar_twitter' });
});

test('should expand embeddable on 1:m without populateWhere', async () => {
  const user = await orm.em.findOneOrFail(User, { email: 'foo' }, { fields: ['name', 'details.socials', 'details.address.name'], populate: ['details'] });

  expect(user!.name).toBe('Foo');
  expect(user!.details.count()).toEqual(3);

  const userDetails = user!.details.getItems();

  expect(userDetails[0].address).toBeDefined();
  expect(userDetails[0].address).toEqual({ name: 'Bar' });

  expect(userDetails[1].address).toBeDefined();
  expect(userDetails[1].address).toEqual({ name: 'Foo' });

  expect(userDetails[2].address).toBeDefined();
  expect(userDetails[2].address).toEqual({ name: 'FooBar' });
  expect(userDetails[2].socials).toBeDefined();
  expect(userDetails[2].socials).toEqual({ instagram: 'foobar_insta', twitter: 'foobar_twitter' });
});

test('should expand embeddable with projection & population all on 1:m', async () => {
  const user = await orm.em.findOneOrFail(User, { email: 'foo' }, { fields: ['*'], populate: ['*'] });

  expect(user!.name).toBe('Foo');
  expect(user!.details.count()).toEqual(3);

  const userDetails = user!.details.getItems();

  expect(userDetails[0].address).toBeDefined();
  expect(userDetails[0].address).toEqual({ name: 'Bar', addressNo: 1 });

  expect(userDetails[1].address).toBeDefined();
  expect(userDetails[1].address).toEqual({ name: 'Foo', addressNo: 12 });

  expect(userDetails[2].address).toBeDefined();
  expect(userDetails[2].address).toEqual({ name: 'FooBar', addressNo: 5 });
  expect(userDetails[2].socials).toBeDefined();
  expect(userDetails[2].socials).toEqual({ instagram: 'foobar_insta', twitter: 'foobar_twitter' });
});
