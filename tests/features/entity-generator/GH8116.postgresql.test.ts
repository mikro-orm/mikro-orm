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

const nestedSchema = `
  create table "public"."p1" ("c1" int4 not null, "c2" int4 not null, primary key ("c1", "c2"));
  create table "public"."p2" ("d1" int4 not null, "d2" int4 not null, primary key ("d1", "d2"));
  create table "public"."child" (
    "id" serial4 not null,
    "p_a" int4 not null,
    "q_a" int4 not null,
    "q_b" int4 not null,
    "filler" int4 not null,
    "p_b" int4 not null,
    primary key ("id"),
    constraint "fk_p" foreign key ("p_a", "p_b") references "public"."p1" ("c1", "c2"),
    constraint "fk_q" foreign key ("q_a", "q_b") references "public"."p2" ("d1", "d2")
  );
  create unique index "uq_child" on "public"."child" ("p_a", "q_a", "q_b", "filler", "p_b");
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

test('GH8116: a relation spanning other index columns keeps the position of its first column', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '8116_nested',
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
    await orm.schema.execute(nestedSchema);
  }

  const dump = await orm.entityGenerator.generate();
  const child = dump.find(file => file.includes('class Child'))!;
  expect(child).toContain(`properties: ['p1', 'p2', 'filler']`);

  await orm.close(true);
});
