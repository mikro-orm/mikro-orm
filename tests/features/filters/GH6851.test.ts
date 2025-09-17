import {
  BaseEntity,
  Collection,
  DateTimeType,
  Entity,
  Filter,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
abstract class CustomBaseEntity extends BaseEntity {

  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

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

  @ManyToMany(() => Profile, p => p.users, { owner: true })
  profiles = new Collection<Profile>(this);

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

@Entity()
class Profile extends CustomBaseEntity {

  @Property()
  name!: string;

  @Property({ nullable: true })
  bio?: string;

  @ManyToMany(() => User, u => u.profiles)
  users = new Collection<User>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Address, Login, Profile],
    // debug: ['query', 'query-params'],
  });

  await orm.schema.createSchema();

  // Create profiles first
  const developerProfile = orm.em.create(Profile, {
    name: 'Developer',
    bio: 'Software development enthusiast',
  });

  const adminProfile = orm.em.create(Profile, {
    name: 'Administrator',
    bio: 'System administrator',
  });

  const managerProfile = orm.em.create(Profile, {
    name: 'Manager',
    bio: 'Project manager',
    deletedAt: new Date(), // soft deleted profile
  });

  orm.em.create(User, {
    email: 'johny@example.com',
    logins: [
      { ip: '127.0.0.1' },
      { ip: '8.8.8.8', deletedAt: new Date() },
      { ip: '192.168.0.1' },
    ],
    address: { country: 'neverland', deletedAt: new Date() },
    profiles: [developerProfile, adminProfile, managerProfile], // includes soft deleted profile
  });

  // deleted user
  orm.em.create(User, {
    email: 'joshua@example.com',
    logins: [{ ip: '10.0.0.0' }],
    profiles: [adminProfile], // shares admin profile with johny
    deletedAt: new Date(),
  });

  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(() => orm.em.clear());

describe('Using joined strategy', () => {
  test('find user with many-to-many profiles and without soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'joined',
        populate: ['profiles'],
        filters: { softDelete: false },
      },
    );

    expect(users).toHaveLength(1);
  });

  test('find user with many-to-many profiles and soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'joined',
        populate: ['profiles'],
      },
    );

    expect(users).toHaveLength(1);
  });
});

describe('Using balanced strategy', () => {
  test('find user with many-to-many profiles and without soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'balanced',
        populate: ['profiles'],
        filters: { softDelete: false },
      },
    );

    expect(users).toHaveLength(1);
  });

  test('find user with many-to-many profiles and soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'balanced',
        populate: ['profiles'],
      },
    );

    expect(users).toHaveLength(1);
  });
});

describe('Using select-in strategy', () => {
  test('find user with many-to-many profiles and without soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'select-in',
        populate: ['profiles'],
        filters: { softDelete: false },
      },
    );

    expect(users).toHaveLength(1);
  });

  test('find user with many-to-many profiles and soft delete filter', async () => {
    const users = await orm.em.find(
      User,
      { email: 'johny@example.com' },
      {
        strategy: 'select-in',
        populate: ['profiles'],
      },
    );

    expect(users).toHaveLength(1);
  });
});
