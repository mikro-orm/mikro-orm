import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table "public"."tenants" (
    "id" int4 not null,
    primary key ("id")
  );
  create table "public"."users" (
    "tenant_id" int4 not null,
    "id" int4 not null,
    primary key ("tenant_id", "id")
  );
  create table "public"."roles" (
    "tenant_id" int4 not null,
    "id" int4 not null,
    primary key ("tenant_id", "id")
  );
  create table "public"."org_nodes" (
    "tenant_id" int4 not null,
    "id" int4 not null,
    primary key ("tenant_id", "id")
  );
  create table "public"."role_grants" (
    "id" serial4 not null,
    "tenant_id" int4 not null,
    "user_id" int4 not null,
    "role_id" int4 not null,
    "org_node_id" int4 not null,
    "coverage" varchar(64) not null,
    primary key ("id"),
    constraint "fk_org" foreign key ("tenant_id", "org_node_id") references "public"."org_nodes" ("tenant_id", "id"),
    constraint "fk_role" foreign key ("tenant_id", "role_id") references "public"."roles" ("tenant_id", "id"),
    constraint "fk_tenant" foreign key ("tenant_id") references "public"."tenants" ("id"),
    constraint "fk_user" foreign key ("tenant_id", "user_id") references "public"."users" ("tenant_id", "id")
  );
  create unique index "uq_role_grants_anchored"
    on "public"."role_grants" ("tenant_id", "user_id", "role_id", "org_node_id", "coverage");
`;

test('GH8116: index column order is kept when columns are shared between relations', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '8116',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
    entityGenerator: {
      scalarPropertiesForRelations: 'always',
    },
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();

  const roleGrants = dump.find(file => file.includes('class RoleGrants'))!;
  expect(roleGrants).toContain(`properties: ['tenantId', 'userId', 'roleId', 'orgNodeId', 'coverage']`);

  await orm.close(true);
});
