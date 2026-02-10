import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/core';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => Role, pivotEntity: () => UserRole, owner: true })
  roles = new Collection<Role>(this);
}

@Entity()
class Role {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => User, mappedBy: 'roles' })
  users = new Collection<User>(this);
}

@Entity()
class UserRole {
  @ManyToOne({ entity: () => User, primary: true, mapToPk: true })
  user!: number;

  @ManyToOne({ entity: () => Role, primary: true, mapToPk: true })
  role!: number;

  [PrimaryKeyProp]?: ['user', 'role'];
}

describe('GH #7107 - ManyToMany with mapToPk in pivot entity', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Role, UserRole],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.em.clear());

  test('should load users through roles when pivot entity uses mapToPk', async () => {
    // Create test data
    const user1 = orm.em.create(User, { name: 'User 1' });
    const user2 = orm.em.create(User, { name: 'User 2' });
    const role1 = orm.em.create(Role, { name: 'Admin' });
    const role2 = orm.em.create(Role, { name: 'Editor' });

    user1.roles.add(role1, role2);
    user2.roles.add(role1);

    await orm.em.flush();
    orm.em.clear();

    // Load roles with users populated
    const roles = await orm.em.find(Role, {}, { populate: ['users'] });

    expect(roles).toHaveLength(2);

    const adminRole = roles.find(r => r.name === 'Admin')!;
    const editorRole = roles.find(r => r.name === 'Editor')!;

    expect(adminRole.users.isInitialized()).toBe(true);
    expect(adminRole.users.getItems()).toHaveLength(2);
    expect(
      adminRole.users
        .getItems()
        .map(u => u.name)
        .sort(),
    ).toEqual(['User 1', 'User 2']);

    expect(editorRole.users.isInitialized()).toBe(true);
    expect(editorRole.users.getItems()).toHaveLength(1);
    expect(editorRole.users.getItems()[0].name).toBe('User 1');
  });

  test('should load roles through users when pivot entity uses mapToPk', async () => {
    // Create test data
    const user = orm.em.create(User, { name: 'Test User' });
    const role1 = orm.em.create(Role, { name: 'Role A' });
    const role2 = orm.em.create(Role, { name: 'Role B' });

    user.roles.add(role1, role2);

    await orm.em.flush();
    orm.em.clear();

    // Load user with roles populated
    const loadedUser = await orm.em.findOneOrFail(User, { name: 'Test User' }, { populate: ['roles'] });

    expect(loadedUser.roles.isInitialized()).toBe(true);
    expect(loadedUser.roles.getItems()).toHaveLength(2);
    expect(
      loadedUser.roles
        .getItems()
        .map(r => r.name)
        .sort(),
    ).toEqual(['Role A', 'Role B']);
  });
});
