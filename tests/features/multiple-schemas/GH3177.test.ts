import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Reference, t } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ schema: '*' })
class UserAccessProfile {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => User, user => user.accessProfile)
  users = new Collection<User>(this);

  @ManyToMany({ entity: () => Permission, pivotEntity: () => AccessProfilePermission })
  permissions = new Collection<Permission>(this);

}

@Entity({ schema: '*' })
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => UserAccessProfile)
  accessProfile!: UserAccessProfile;

}

@Entity({ schema: 'public' })
class Permission {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => UserAccessProfile, mappedBy: p => p.permissions })
  accessProfiles = new Collection<UserAccessProfile>(this);

}

@Entity({ schema: '*' })
class AccessProfilePermission {

  @ManyToOne(() => UserAccessProfile, { primary: true })
  accessProfile!: UserAccessProfile;

  @ManyToOne(() => Permission, { primary: true })
  permission!: Permission;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_test_3177',
    driver: PostgreSqlDriver,
    schema: 'tenant_01',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
  await orm.schema.dropSchema({ schema: 'tenant_01' });
  await orm.schema.updateSchema();
  await orm.schema.updateSchema({ schema: 'tenant_01' });
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3177`, async () => {
  const user = new User();
  user.id = 1;
  user.accessProfile = new UserAccessProfile();
  user.accessProfile.permissions.add(new Permission(), new Permission(), new Permission());
  orm.em.persist(user);

  const mock = mockLogger(orm);

  const u1 = await orm.em.findOneOrFail(User, 1, { populate: ['accessProfile'] });
  const permissions = await u1.accessProfile.permissions.init();

  expect(permissions.getItems()).toHaveLength(3);
  orm.em.clear();

  const u2 = await orm.em.findOneOrFail(User, 1, { populate: ['accessProfile.permissions'] });
  expect(u2.accessProfile.permissions.getItems()).toHaveLength(3);

  expect(mock.mock.calls[0][0]).toMatch(`begin`);
  expect(mock.mock.calls[1][0]).toMatch(`insert into "tenant_01"."user_access_profile" ("id") values (default) returning "id"`);
  expect(mock.mock.calls[2][0]).toMatch(`insert into "tenant_01"."user" ("id", "access_profile_id") values (1, 1) returning "id"`);
  expect(mock.mock.calls[3][0]).toMatch(`insert into "public"."permission" ("id") values (default), (default), (default) returning "id"`);
  expect(mock.mock.calls[4][0]).toMatch(`insert into "tenant_01"."access_profile_permission" ("access_profile_id", "permission_id") values (1, 1), (1, 2), (1, 3) returning "access_profile_id", "permission_id"`);
  expect(mock.mock.calls[5][0]).toMatch(`commit`);
  expect(mock.mock.calls[6][0]).toMatch(`select "u0".* from "tenant_01"."user" as "u0" where "u0"."id" = 1 limit 1`);
  expect(mock.mock.calls[7][0]).toMatch(`select "p0".* from "public"."permission" as "p0" where "p0"."id" in (1, 2, 3)`);
  expect(mock.mock.calls[8][0]).toMatch(`select "u0".* from "tenant_01"."user" as "u0" where "u0"."id" = 1 limit 1`);
  expect(mock.mock.calls[9][0]).toMatch(`select "u0".* from "tenant_01"."user_access_profile" as "u0" where "u0"."id" in (1) order by "u0"."id" asc`);
  expect(mock.mock.calls[10][0]).toMatch(`select "p0".*, "a1"."permission_id" as "fk__permission_id", "a1"."access_profile_id" as "fk__access_profile_id" from "public"."permission" as "p0" left join "tenant_01"."access_profile_permission" as "a1" on "p0"."id" = "a1"."permission_id" where "a1"."access_profile_id" in (1)`);
});
