import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/postgresql';

@Entity({ schema: '*' })
class Role {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  name!: string;

  @ManyToMany(() => Permission, p => p.roles, { owner: true })
  permissions = new Collection<Permission>(this);

}

@Entity({ schema: 'permissions' })
class Permission {

  @PrimaryKey()
  id!: number;

  @Property({ length: 128 })
  name!: string;

  @ManyToMany(() => Role, r => r.permissions)
  roles = new Collection<Role>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Role, Permission],
    dbName: 'mikro_orm_test_ghx37',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('GHx37 - pivot table should use runtime schema when owner has wildcard and target has fixed schema', async () => {
  const em = orm.em.fork();

  // query builder with explicit schema should propagate it to the pivot table
  const sql = em
    .createQueryBuilder(Role, 'r')
    .select('r.*')
    .leftJoinAndSelect('r.permissions', 'p')
    .where({ id: 1 })
    .withSchema('tenant_1')
    .getFormattedQuery();

  // the pivot table must use the runtime schema (tenant_1), not default/public
  expect(sql).toContain('"tenant_1"."role"');
  expect(sql).toContain('"tenant_1"."role_permissions"');
  // the target entity has a fixed schema, so it should keep its own
  expect(sql).toContain('"permissions"."permission"');
});
