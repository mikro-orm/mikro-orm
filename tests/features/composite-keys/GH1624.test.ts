import { Collection, Entity, IdentifiedReference, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyType, Property, Reference, Unique, wrap } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Organization {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
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
    wrappedReference: true,
    index: true,
    cascade: [],
    onDelete: 'no action',
  })
  organization!: IdentifiedReference<Organization>;

  @Property({ columnType: 'varchar' })
  firstName!: string;

  @Property({ columnType: 'varchar' })
  lastName!: string;

  @Property({ columnType: 'varchar' })
  email!: string;

  @OneToMany({ entity: 'UserRole', mappedBy: 'user' })
  userRoles = new Collection<UserRole>(this);

  [PrimaryKeyType]: [string, string];

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
    wrappedReference: true,
    cascade: [],
    onDelete: 'cascade',
  })
  user!: IdentifiedReference<User>;

  @ManyToOne({
    entity: () => Role,
    inversedBy: x => x.userRoles,
    primary: true,
    wrappedReference: true,
    cascade: [],
    onDelete: 'no action',
  })
  role!: IdentifiedReference<Role>;

  [PrimaryKeyType]: [string, string, string];

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
    wrappedReference: true,
  })
  organization!: IdentifiedReference<Organization>;

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
    wrappedReference: true,
    cascade: [],
    onUpdateIntegrity: 'no action',
    onDelete: 'no action',
  })
  program!: Reference<Program>;

  @Property({ columnType: 'varchar' })
  name!: string;

  [PrimaryKeyType]: [string, string, string];

  constructor(value: Partial<Site> = {}) {
    Object.assign(this, value);
  }

}

describe('GH issue 1624, 1658', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, UserRole, Organization, Role, Program, Site],
      dbName: 'mikro_orm_test_1624',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await orm.getSchemaGenerator().createSchema();
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
      { populate: { userRoles: LoadStrategy.JOINED } },
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
