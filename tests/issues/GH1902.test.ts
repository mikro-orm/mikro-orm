import {
  MikroORM,
  Entity,
  PrimaryKey,
  Unique,
  Collection,
  ManyToOne,
  OneToMany,
  Property,
  Filter,
  LoadStrategy,
  OptionalProps,
  PrimaryKeyProp,
} from '@mikro-orm/sqlite';

@Entity({ tableName: 'users' })
export class UserEntity {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string', fieldName: 'firstName' })
  name!: string;

  @Unique({ name: 'UQ_89f3fc6f491c6a3e548b9c92d93' })
  @Property({ type: 'string' })
  email!: string;

  @OneToMany(() => UserTenantEntity, item => item.user)
  items = new Collection<UserTenantEntity>(this);

}

@Entity({ tableName: 'tenants' })
export class TenantEntity {

  [OptionalProps]?: 'isEnabled';

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Unique({ name: 'UQ_392df8e04b97895b69cc4a469b8' })
  @Property({ type: 'string' })
  schema!: string;

  @Property({ type: 'boolean', fieldName: 'isEnabled' })
  isEnabled: boolean = true;

  @OneToMany(() => UserTenantEntity, item => item.tenant)
  items = new Collection<UserTenantEntity>(this);

}

@Entity({ tableName: 'user_tenant' })
@Filter({ name: 'byUser', cond: args => ({ user: { id: args.id } }) })
@Filter({ name: 'byTenant', cond: args => ({ tenant: { id: args.id } }) })
class UserTenantEntity {

  @ManyToOne({ primary: true, entity: () => UserEntity, fieldName: 'userId', cascade: [] })
  user!: UserEntity;

  @ManyToOne({ primary: true, entity: () => TenantEntity, fieldName: 'tenantId', cascade: [] })
  tenant!: TenantEntity;

  [PrimaryKeyProp]?: ['user', 'tenant'];
  [OptionalProps]?: 'isActive';

  @Property({ type: 'boolean', fieldName: 'isActive' })
  isActive: boolean = true;

}

describe('GH issue 1902', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [UserEntity, TenantEntity, UserTenantEntity],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1902`, async () => {
    const user = orm.em.create(UserEntity, { name: 'user one', email: 'one@email' });
    await orm.em.flush();

    const tenant1 = orm.em.create(TenantEntity, { name: 'tenant one', schema: 'tenant_one' });
    await orm.em.flush();
    const tenant2 = orm.em.create(TenantEntity, { name: 'tenant two', schema: 'tenant_two' });
    await orm.em.flush();

    const repoUserTenant = orm.em.getRepository(UserTenantEntity);
    orm.em.create(UserTenantEntity, { user, tenant: tenant1, isActive: true });
    await orm.em.flush();
    orm.em.create(UserTenantEntity, { user, tenant: tenant2, isActive: false });
    await orm.em.flush();
    orm.em.clear();

    const findOpts = {
      filters: {
        byUser: { id: 1 },
      },
      populate: ['tenant'] as const,
    };
    const f1 = await repoUserTenant.findAll(findOpts);
    expect(f1.length).toBe(2);	// succeeds
    orm.em.clear();

    const f2 = await repoUserTenant.findAll({ ...findOpts, strategy: LoadStrategy.JOINED });
    expect(f2.length).toBe(2);	// fails

    return;
  });

});
