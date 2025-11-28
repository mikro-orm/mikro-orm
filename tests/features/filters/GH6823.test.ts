import { BaseEntity, Collection, DateTimeType, MikroORM, Ref } from '@mikro-orm/sqlite';

import { Entity, Filter, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
abstract class CustomBaseEntity extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: string;

  @Property({ type: DateTimeType, nullable: true })
  deletedAt?: Date;

}

@Entity()
class User extends CustomBaseEntity {

  @Property({ unique: true })
  email!: string;

  @OneToOne(() => Address, a => a.user, { ref: true, nullable: true })
  address?: Ref<Address>;

  @OneToMany(() => Login, l => l.user)
  logins = new Collection<Login>(this);

}

@Entity()
class Address extends CustomBaseEntity {

  @Property()
  country!: string;

  @OneToOne(() => User, u => u.address, { ref: true, owner: true })
  user!: Ref<User>;

}

@Entity()
class Login extends CustomBaseEntity {

  @Property()
  ip!: string;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Address, Login],
  });

  await orm.schema.refreshDatabase();

  orm.em.create(User, {
    email: 'johny@example.com',
    logins: [
      { ip: '127.0.0.1' },
      { ip: '8.8.8.8', deletedAt: new Date() },
      { ip: '192.168.0.1' },
    ],
    address: { country: 'neverland', deletedAt: new Date() },
  });

  // deleted user
  orm.em.create(User, {
    email: 'joshua@example.com',
    logins: [
      { ip: '10.0.0.0' },
    ],
    deletedAt: new Date(),
  });

  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(() => orm.em.clear());

test('find with 1:1 relation and soft delete filter', async () => {
  const logins = await orm.em.find(
    Login,
    { user: { email: { $like: '%@example.com' } } },
    { populate: ['user.address'] },
  );

  expect(logins).toHaveLength(2);
  expect(logins[0].ip).toBe('127.0.0.1');
  expect(logins[0].user.$.email).toBe('johny@example.com');
  expect(logins[0].user.$.address).toBeNull();
  expect(logins[1].ip).toBe('192.168.0.1');
  expect(logins[1].user).toStrictEqual(logins[0].user);
});

test('count with 1:1 relation and disabled soft delete filter', async () => {
  const countOfLogins = await orm.em.count(
    Login,
    { user: { email: { $like: '%@example.com' } } },
    { populate: ['user.address'], filters: { softDelete: false } },
  );

  expect(countOfLogins).toBe(4);
});

test('count without populating 1:1 relation and with soft delete filter', async () => {
  const countOfLogins = await orm.em.count(
    Login,
    { user: { email: { $like: '%@example.com' } } },
    { populate: ['user'] },
  );

  expect(countOfLogins).toBe(2);
});

test('count with 1:1 relation and with soft delete filter', async () => {
  const countOfLogins = await orm.em.count(
    Login,
    { user: { email: { $like: '%@example.com' } } },
    { populate: ['user.address'] },
  );

  expect(countOfLogins).toBe(2);
});
