import {
  Cast,
  Embeddable,
  Embedded,
  Entity,
  IsUnknown,
  JoinType,
  MikroORM,
  OneToOne,
  PrimaryKey,
  PrimaryProperty,
  Property,
  Reference as Reference_,
} from '@mikro-orm/sqlite';

// we need to define those to get around typescript issues with reflection (ts-morph would return `any` for the type otherwise)
export class Reference<T extends object> extends Reference_<T> { }
export type Ref<T extends object, PK extends keyof T | unknown = PrimaryProperty<T>> = true extends IsUnknown<PK> ? Reference<T> : ({ [K in Cast<PK, keyof T>]?: T[K] } & Reference<T>);


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
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToOne(() => UserDetails, (details: UserDetails) => details.user)
  details!: Ref<UserDetails> | null;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

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
    dbName: ':memory:',
    entities: [User, UserDetails],
    debug: ['query', 'query-params'],
    allowGlobalContext: true,
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
