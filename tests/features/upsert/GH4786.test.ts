import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  SimpleLogger,
  sql,
  Unique,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity({ abstract: true })
abstract class ApplicationEntity<Optionals = never> {

  [OptionalProps]?: Optionals | 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property({ name: 'created_at', default: sql.now() })
  createdAt!: Date;

  @Property({ name: 'updated_at', default: sql.now(), onUpdate: () => new Date() })
  updatedAt!: Date;

}

@Entity()
class InternalRole extends ApplicationEntity {

  @Property()
  name!: string;

  @OneToMany(() => InternalRolePermission, permission => permission.internalRole, { orphanRemoval: true })
  permissions = new Collection<InternalRolePermission>(this);

}

@Entity()
@Unique({ properties: ['subject', 'action', 'internalRole'] })
class InternalRolePermission extends ApplicationEntity {

  @Property()
  subject!: string;

  @Property()
  action!: string;

  @ManyToOne(() => InternalRole, { deleteRule: 'cascade' })
  internalRole!: InternalRole;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [InternalRole],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

beforeAll(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('4786 (em.upsert)', async () => {
  orm.em.create(InternalRole, { id: 1, name: 'role' });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  let role = await orm.em.findOneOrFail(InternalRole, 1);
  await orm.em.upsert(InternalRolePermission, { subject: 'User', action: 'read', internalRole: role });

  expect(mock.mock.calls).toEqual([
    ['[query] select `i0`.* from `internal_role` as `i0` where `i0`.`id` = 1 limit 1'],
    ['[query] insert into `internal_role_permission` (`subject`, `action`, `internal_role_id`) values (\'User\', \'read\', 1) on conflict (`subject`, `action`, `internal_role_id`) do nothing returning `id`, `created_at`, `updated_at`'],
  ]);

  mock.mockReset();
  orm.em.clear();
  role = await orm.em.findOneOrFail(InternalRole, 1);
  await orm.em.upsert(InternalRolePermission, { subject: 'User', action: 'read', internalRole: role });

  expect(mock.mock.calls).toEqual([
    ['[query] select `i0`.* from `internal_role` as `i0` where `i0`.`id` = 1 limit 1'],
    ['[query] insert into `internal_role_permission` (`subject`, `action`, `internal_role_id`) values (\'User\', \'read\', 1) on conflict (`subject`, `action`, `internal_role_id`) do nothing returning `id`, `created_at`, `updated_at`'],
    ['[query] select `i0`.`id`, `i0`.`created_at`, `i0`.`updated_at` from `internal_role_permission` as `i0` where `i0`.`subject` = \'User\' and `i0`.`action` = \'read\' and `i0`.`internal_role_id` = 1 limit 1'],
  ]);
});

test('4786 (em.upsertMany)', async () => {
  orm.em.create(InternalRole, { id: 1, name: 'role' });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  let role = await orm.em.findOneOrFail(InternalRole, 1);
  await orm.em.upsertMany(InternalRolePermission, [
    { subject: 'User', action: 'read', internalRole: role },
    { subject: 'User', action: 'update', internalRole: role },
  ]);

  expect(mock.mock.calls).toEqual([
    ['[query] select `i0`.* from `internal_role` as `i0` where `i0`.`id` = 1 limit 1'],
    ['[query] insert into `internal_role_permission` (`subject`, `action`, `internal_role_id`) values (\'User\', \'read\', 1), (\'User\', \'update\', 1) on conflict (`subject`, `action`, `internal_role_id`) do nothing returning `id`, `created_at`, `updated_at`'],
  ]);

  mock.mockReset();
  orm.em.clear();
  role = await orm.em.findOneOrFail(InternalRole, 1);
  await orm.em.upsertMany(InternalRolePermission, [
    { subject: 'User', action: 'read', internalRole: role },
    { subject: 'User', action: 'update', internalRole: role },
  ]);

  expect(mock.mock.calls).toEqual([
    ['[query] select `i0`.* from `internal_role` as `i0` where `i0`.`id` = 1 limit 1'],
    ['[query] insert into `internal_role_permission` (`subject`, `action`, `internal_role_id`) values (\'User\', \'read\', 1), (\'User\', \'update\', 1) on conflict (`subject`, `action`, `internal_role_id`) do nothing returning `id`, `created_at`, `updated_at`'],
    ['[query] select `i0`.`id`, `i0`.`created_at`, `i0`.`updated_at`, `i0`.`subject`, `i0`.`action`, `i0`.`internal_role_id` from `internal_role_permission` as `i0` where ((`i0`.`subject` = \'User\' and `i0`.`action` = \'read\' and `i0`.`internal_role_id` = 1) or (`i0`.`subject` = \'User\' and `i0`.`action` = \'update\' and `i0`.`internal_role_id` = 1))'],
  ]);
});
