import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';
import { MikroORM } from '@mikro-orm/postgresql';

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
    clientUrl: 'postgresql://postgres@127.0.0.1:5432/mikro_orm_test_3177?schema=tenant_01',
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
  const mock = mockLogger(orm);

  const user = new User();
  user.id = 1;
  user.accessProfile = new UserAccessProfile();
  user.accessProfile.permissions.add(new Permission(), new Permission(), new Permission());
  await orm.em.persist(user).flush();

  const u1 = await orm.em.findOneOrFail(User, 1, { populate: ['accessProfile'] });
  const permissions = await u1.accessProfile.permissions.init();

  expect(permissions.getItems()).toHaveLength(3);
  orm.em.clear();

  const u2 = await orm.em.findOneOrFail(User, 1, { populate: ['accessProfile.permissions'] });
  expect(u2.accessProfile.permissions.getItems()).toHaveLength(3);

  expect(mock).toHaveBeenCalledTimes(8);
  expect(mock.mock.calls[0][0]).toMatch(`begin`);
  expect(mock.mock.calls[1][0]).toMatch(`insert into "tenant_01"."user_access_profile" ("id") values (default) returning "id"`);
  expect(mock.mock.calls[2][0]).toMatch(`insert into "tenant_01"."user" ("id", "access_profile_id") values (1, 1)`);
  expect(mock.mock.calls[3][0]).toMatch(`insert into "permission" ("id") values (default), (default), (default) returning "id"`);
  expect(mock.mock.calls[4][0]).toMatch(`insert into "tenant_01"."access_profile_permission" ("permission_id", "access_profile_id") values (1, 1), (2, 1), (3, 1)`);
  expect(mock.mock.calls[5][0]).toMatch(`commit`);
  expect(mock.mock.calls[6][0]).toMatch(`select "p1".*, "a0"."permission_id" as "fk__permission_id", "a0"."access_profile_id" as "fk__access_profile_id" from "tenant_01"."access_profile_permission" as "a0" inner join "permission" as "p1" on "a0"."permission_id" = "p1"."id" where "a0"."access_profile_id" in (1)`);
  expect(mock.mock.calls[7][0]).toMatch(`select "u0".*, "a1"."id" as "a1__id", "p2"."id" as "p2__id" from "tenant_01"."user" as "u0" left join "tenant_01"."user_access_profile" as "a1" on "u0"."access_profile_id" = "a1"."id" left join "tenant_01"."access_profile_permission" as "a3" on "a1"."id" = "a3"."access_profile_id" left join "permission" as "p2" on "a3"."permission_id" = "p2"."id" where "u0"."id" = 1`);
});
