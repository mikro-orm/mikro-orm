import {
  Collection,
  Entity,
  Ref,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Reference,
  Unique,
  wrap,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { v4 } from 'uuid';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Organization {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Unique()
  @Property({ columnType: 'varchar' })
  name!: string;

  @OneToMany({ entity: 'User', mappedBy: 'organization', cascade: [] })
  users = new Collection<User>(this);

  @OneToMany({ entity: 'Program', mappedBy: 'organization', cascade: [] })
  programs = new Collection<Program>(this);

  constructor(value: Partial<Organization> = {}) {
    Object.assign(this, value);
  }

}

@Entity()
export class User {

  @PrimaryKey({ columnType: 'varchar' })
  id!: string;

  @ManyToOne({
    entity: () => Organization,
    primary: true,
    ref: true,
    index: true,
    cascade: [],
    deleteRule: 'no action',
  })
  organization!: Ref<Organization>;

  @Property({ columnType: 'varchar' })
  firstName!: string;

  @Property({ columnType: 'varchar' })
  lastName!: string;

  @Property({ columnType: 'varchar' })
  email!: string;

  @OneToMany({ entity: 'UserRole', mappedBy: 'user' })
  userRoles = new Collection<UserRole>(this);

  [PrimaryKeyProp]?: ['id', 'organization'];

  constructor(value: Partial<User> = {}) {
    Object.assign(this, value);
  }

}

@Entity()
export class Role {

  @PrimaryKey({ columnType: 'varchar' })
  id!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @OneToMany({ entity: 'UserRole', mappedBy: 'role' })
  userRoles = new Collection<UserRole>(this);

  constructor(value: Partial<Role> = {}) {
    Object.assign(this, value);
  }

}

@Entity()
export class UserRole {

  @ManyToOne({
    entity: () => User,
    inversedBy: x => x.userRoles,
    primary: true,
    ref: true,
    cascade: [],
    deleteRule: 'cascade',
  })
  user!: Ref<User>;

  @ManyToOne({
    entity: () => Role,
    inversedBy: x => x.userRoles,
    primary: true,
    ref: true,
    cascade: [],
    deleteRule: 'no action',
  })
  role!: Ref<Role>;

  [PrimaryKeyProp]?: ['user', 'role'];

  constructor(value: Partial<UserRole> = {}) {
    Object.assign(this, value);
  }

}

@Entity()
export class Program {

  @PrimaryKey({ columnType: 'varchar' })
  id!: string;

  @ManyToOne({
    entity: () => Organization,
    inversedBy: 'programs',
    primary: true,
    ref: true,
  })
  organization!: Ref<Organization>;

  @OneToMany({ entity: 'Site', mappedBy: 'program', cascade: [] })
  sites = new Collection<Site, Program>(this);

  @Property({ columnType: 'varchar' })
  name!: string;

  constructor(value: Partial<Program> = {}) {
    Object.assign(this, value);
  }

}

@Entity()
export class Site {

  @PrimaryKey({ columnType: 'varchar' })
  id!: string;

  @ManyToOne({
    entity: () => Program,
    inversedBy: 'sites',
    primary: true,
    ref: true,
    cascade: [],
    updateRule: 'no action',
    deleteRule: 'no action',
  })
  program!: Reference<Program>;

  @Property({ columnType: 'varchar' })
  name!: string;

  [PrimaryKeyProp]?: ['id', 'program'];

  constructor(value: Partial<Site> = {}) {
    Object.assign(this, value);
  }

}

describe('GH issue 1624, 1658 (postgres)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, UserRole, Organization, Role, Program, Site],
      dbName: 'mikro_orm_test_1624',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1624`, async () => {
    const roleId = v4();
    const userId = v4();
    const orgId = v4();
    const role = new Role({ id: roleId, name: 'r' });
    const org = new Organization({ id: orgId, name: 'on' });
    const user = new User({ email: 'e', firstName: 'f', lastName: 'l', organization: wrap(org).toReference(), id: userId });
    const userRole = new UserRole({ role: wrap(role).toReference(), user: wrap(user).toReference() });
    user.userRoles.add(userRole);
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    // just using the mapper
    const ur = orm.em.map(UserRole, {
      user_id: userId,
      user_organization_id: orgId,
      role: roleId,
    });
    expect(ur).toBeInstanceOf(UserRole);
    expect(ur.user).toBeInstanceOf(Reference);
    expect(ur.user.id).toBe(userId);
    expect(ur.role).toBeInstanceOf(Reference);
    expect(ur.role.id).toBe(roleId);
    orm.em.clear();

    // query and map just the join table
    const a = await orm.em.find(UserRole, { user: { $eq: [userId, orgId] } });
    expect(a).toHaveLength(1);
    orm.em.clear();

    // or try to populate it
    const b = await orm.em.findOneOrFail(
      User,
      { id: { $eq: userId }, organization: { $eq: orgId } },
      { populate: ['userRoles'], strategy: LoadStrategy.JOINED },
    );
    expect(b.organization).toBeInstanceOf(Reference);
    expect(b.organization.id).toBe(orgId);
    expect(b.userRoles).toHaveLength(1);
    expect(b.userRoles[0]).toBeInstanceOf(UserRole);
    expect(b.userRoles[0].user).toBeInstanceOf(Reference);
    expect(b.userRoles[0].user.id).toBe(userId);
    expect(b.userRoles[0].role).toBeInstanceOf(Reference);
    expect(b.userRoles[0].role.id).toBe(roleId);
  });

  test(`GH issue 1658`, async () => {
    const org = new Organization({ id: 'e3dca7ae-6389-49dc-931d-419716828a79', name: 'Organization' });
    const program = new Program({
      id: 'cc455d1f-f4c7-4b57-b833-e6ca88239b61',
      organization: Reference.create(org),
      name: 'Program 1',
    });
    const site = new Site({
      id: '7007a128-4cc0-4177-b754-0cda0927368d',
      program: Reference.create(program),
      name: 'Site 1',
    });

    orm.em.persist(org);
    orm.em.persist(program);
    orm.em.persist(site);
    await orm.em.flush();

    const createdSite = await orm.em.findOneOrFail(Site, { id: site.id });
    createdSite.name = 'Site 2';
    await orm.em.flush();

    orm.em.clear();
    const updatedSite = await orm.em.findOneOrFail(Site, { id: site.id });
    expect(updatedSite.name).toBe(createdSite.name);
  });

});

describe('GH issue 1624, 1658 (sqlite)', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, UserRole, Organization, Role, Program, Site],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1624`, async () => {
    const roleId = v4();
    const userId = v4();
    const orgId = v4();
    const role = new Role({ id: roleId, name: 'r' });
    const org = new Organization({ id: orgId, name: 'on' });
    const user = new User({ email: 'e', firstName: 'f', lastName: 'l', organization: wrap(org).toReference(), id: userId });
    const userRole = new UserRole({ role: wrap(role).toReference(), user: wrap(user).toReference() });
    user.userRoles.add(userRole);
    await orm.em.persistAndFlush(user);
    orm.em.clear();

    // just using the mapper
    const ur = orm.em.map(UserRole, {
      user_id: userId,
      user_organization_id: orgId,
      role: roleId,
    });
    expect(ur).toBeInstanceOf(UserRole);
    expect(ur.user).toBeInstanceOf(Reference);
    expect(ur.user.id).toBe(userId);
    expect(ur.role).toBeInstanceOf(Reference);
    expect(ur.role.id).toBe(roleId);
    orm.em.clear();

    // query and map just the join table
    const a = await orm.em.find(UserRole, { user: { $eq: [userId, orgId] } });
    expect(a).toHaveLength(1);
    orm.em.clear();

    // or try to populate it
    const b = await orm.em.findOneOrFail(
      User,
      { id: { $eq: userId }, organization: { $eq: orgId } },
      { populate: ['userRoles'], strategy: LoadStrategy.JOINED },
    );
    expect(b.organization).toBeInstanceOf(Reference);
    expect(b.organization.id).toBe(orgId);
    expect(b.userRoles).toHaveLength(1);
    expect(b.userRoles[0]).toBeInstanceOf(UserRole);
    expect(b.userRoles[0].user).toBeInstanceOf(Reference);
    expect(b.userRoles[0].user.id).toBe(userId);
    expect(b.userRoles[0].role).toBeInstanceOf(Reference);
    expect(b.userRoles[0].role.id).toBe(roleId);
  });

  test(`GH issue 1658`, async () => {
    const org = new Organization({ id: 'e3dca7ae-6389-49dc-931d-419716828a79', name: 'Organization' });
    const program = new Program({
      id: 'cc455d1f-f4c7-4b57-b833-e6ca88239b61',
      organization: Reference.create(org),
      name: 'Program 1',
    });
    const site = new Site({
      id: '7007a128-4cc0-4177-b754-0cda0927368d',
      program: Reference.create(program),
      name: 'Site 1',
    });

    orm.em.persist(org);
    orm.em.persist(program);
    orm.em.persist(site);
    await orm.em.flush();

    const createdSite = await orm.em.findOneOrFail(Site, { id: site.id });
    createdSite.name = 'Site 2';
    await orm.em.flush();

    orm.em.clear();
    const updatedSite = await orm.em.findOneOrFail(Site, { id: site.id });
    expect(updatedSite.name).toBe(createdSite.name);
  });

});
