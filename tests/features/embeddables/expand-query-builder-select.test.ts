import { JoinType, MikroORM, Ref } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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

  @OneToOne(() => UserDetails, (details: UserDetails) => details.user)
  details!: Ref<UserDetails> | null;

}

@Entity()
class UserDetails {

  @OneToOne(() => User, { owner: true, primary: true })
  user!: User;

  @Property()
  phoneNumber!: string;

  @Embedded(() => UserAddress, { prefix: false })
  address = new UserAddress();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, UserDetails],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('should populate with joinAndSelect', async () => {
  orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    details: {
      phoneNumber: '123456789',
      address: { name: 'Bar', addressNo: 1 },
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const qb = orm.em.qb(User, 'u');
  const user = await qb
    .joinAndSelect(
      'u.details',
      'details',
      undefined,
      JoinType.innerJoin,
      undefined,
      ['id', 'address'],
    )
    .where({ email: 'foo' })
    .getSingleResult();

  expect(user!.name).toBe('Foo');
  expect(user?.details?.toJSON().address).toBeDefined();
  expect(user?.details?.toJSON().address).toEqual({ name: 'Bar', addressNo: 1 });
});
