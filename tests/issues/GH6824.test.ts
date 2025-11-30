import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Organisation {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class User {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({
    entity: () => Profile,
    ref: true,
    fieldNames: ['org_id', 'profile_id'],
    ownColumns: ['profile_id'],
  })
  profile!: Ref<Profile>;

  @ManyToOne({
    entity: () => Workspace,
    fieldNames: ['org_id', 'workspace_id'],
    ownColumns: ['workspace_id'],
    ref: true,
  })
  workspace!: Ref<Workspace>;

  @OneToOne({
    entity: () => UserRequest,
    mappedBy: ur => ur.user,
    ref: true,
  })
  request?: Ref<UserRequest>;

}

@Entity()
class Profile {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({
    entity: () => User,
    mappedBy: u => u.profile,
    ref: true,
  })
  user?: Ref<User>;

}

@Entity()
class Workspace {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({
    entity: () => User,
    mappedBy: u => u.workspace,
    ref: true,
  })
  users = new Collection<User>(this);

}

@Entity()
class UserRequest {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({
    entity: () => User,
    ref: true,
    fieldNames: ['org_id', 'user_id'],
    ownColumns: ['user_id'],
  })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Organisation, User, Profile, UserRequest],
  });

  await orm.schema.refreshDatabase({ dropDb: true });

  const org = orm.em.create(Organisation, { id: 1, name: 'org1' });

  const workspace = orm.em.create(Workspace, {
    org,
    id: 10,
    name: 'workspace1',
  });

  const profile = orm.em.create(Profile, {
    org,
    id: 11,
    name: 'profile1',
  });

  const user = orm.em.create(User, {
    org,
    id: 12,
    name: 'user1',
    profile,
    workspace,
  });

  orm.em.create(UserRequest, {
    org,
    id: 13,
    name: 'userRequest1',
    user,
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

afterEach(() => {
  orm.em.clear();
});

test('partial composite foreign key from non-owning side, (1:1)', async () => {
  const user = await orm.em.findOneOrFail(User, {
    request: {
      id: 13,
    },
  });

  expect(user.name).toBe('user1');
});

test('partial composite foreign key from non-owning side (1:m)', async () => {
  const user = await orm.em.findOneOrFail(Workspace, {
    users: {
      id: 12,
    },
  });

  expect(user.name).toBe('workspace1');
});

test('partial composite foreign key from non-owning side (1:1, nested)', async () => {
  const profile = await orm.em.findOneOrFail(Profile, {
    user: {
      request: {
        id: 13,
      },
    },
  });

  expect(profile.name).toBe('profile1');
});
