import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table "public"."fr_usuario" (
    "id" int8 not null,
    "name" varchar,
    primary key ("id")
  );
  create table "public"."sft_contato" (
    "id" int8 not null,
    "usr_codigo_app" int8 not null,
    primary key ("id"),
    constraint "sft_contato_usr_codigo_app_fkey" foreign key ("usr_codigo_app") references "public"."fr_usuario" ("id")
  );
`;

test('GH5400: FK property names should not contain schema prefix', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5400',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
    namingStrategy: UnderscoreNamingStrategy,
    entityGenerator: {
      scalarPropertiesForRelations: 'always',
    },
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();

  // Verify that the FK property names don't contain 'public.' prefix
  for (const file of dump) {
    expect(file).not.toContain('public.');
  }

  await orm.close(true);
});

const crossSchemaConflictDdl = `
  create schema if not exists "schema1";
  create schema if not exists "schema2";

  -- Same table name in different schemas
  create table "schema1"."target" (
    "id" int8 not null,
    primary key ("id")
  );
  create table "schema2"."target" (
    "id" int8 not null,
    primary key ("id")
  );

  -- Table with FKs to both schema1.target and schema2.target
  create table "public"."source" (
    "id" int8 not null,
    "schema1_target_id" int8 not null,
    "schema2_target_id" int8 not null,
    primary key ("id"),
    constraint "source_schema1_fkey" foreign key ("schema1_target_id") references "schema1"."target" ("id"),
    constraint "source_schema2_fkey" foreign key ("schema2_target_id") references "schema2"."target" ("id")
  );
`;

test('GH5400: cross-schema FKs to same-named tables should use constraint names', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5400_cross_schema',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
    namingStrategy: UnderscoreNamingStrategy,
    entityGenerator: {
      scalarPropertiesForRelations: 'always',
    },
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(crossSchemaConflictDdl);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();

  // Verify no schema prefixes in property names
  for (const file of dump) {
    expect(file).not.toMatch(/['"]schema[12]\./);
    expect(file).not.toContain('public.');
  }

  await orm.close(true);
});
