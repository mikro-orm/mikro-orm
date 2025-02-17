import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  SimpleLogger,
  Unique,
  wrap,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity({ tableName: 'core_users' })
class User {

  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  account!: string;

  @Property()
  name!: string;

  @ManyToMany(() => Role, role => role.users)
  roles = new Collection<Role>(this);

}

@Entity({ tableName: 'core_roles' })
class Role {

  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  name!: string;

  @ManyToMany(() => User, user => user.roles, { owner: true })
  users = new Collection<User>(this);

  @OneToMany(
    () => RoleResourcePermission,
    roleResourcePermission => roleResourcePermission.role,
  )
  permissions = new Collection<RoleResourcePermission>(this);

}

@Entity({ tableName: 'core_role_resources' })
@Unique({ properties: ['role', 'resource', 'isOriginal'] })
export class RoleResourcePermission {

  @ManyToOne(() => Role, {
    primary: true,
    deleteRule: 'cascade',
  })
  role!: Role;

  @Property({ primary: true })
  resource!: string;

  @Property({ primary: true })
  isOriginal!: boolean;

  @Property()
  canCreate!: number;

  @Property()
  canRead!: number;

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [RoleResourcePermission],
    dbName: ':memory:',
    driver: SqliteDriver,
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
  await orm.em.insert(User, { id: 1, account: 'acc', name: 'u1' });
  await orm.em.insert(Role, { id: 1, name: 'r1', users: [1] });
  await orm.em.insert(RoleResourcePermission, {
    role: 1,
    resource: 'core_user',
    isOriginal: true,
    canCreate: 1,
    canRead: 1,
  });
});

afterAll(() => orm.close(true));

test('updating composite key entity', async () => {
  const permission = await orm.em.findOneOrFail(
    RoleResourcePermission,
    {
      role: orm.em.getReference(Role, 1),
      resource: 'core_user',
      isOriginal: true,
    },
  );

  wrap(permission).assign({
    canCreate: 0,
    canRead: 0,
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] update `core_role_resources` set `can_create` = 0, `can_read` = 0 where `role_id` = 1 and `resource` = 'core_user' and `is_original` = true"],
    ['[query] commit'],
  ]);
});
