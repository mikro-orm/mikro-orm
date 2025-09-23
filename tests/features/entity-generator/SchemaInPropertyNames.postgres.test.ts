import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create schema if not exists "test_schema";

  create table "public"."fr_usuario" (
    "id" serial primary key,
    "nome" varchar(100) not null
  );

  create table "test_schema"."tabela_com_fk" (
    "id" serial primary key,
    "usr_codigo_app" int not null,
    constraint "fk_tabela_fr_usuario" foreign key ("usr_codigo_app") references "public"."fr_usuario" ("id")
  );
`;

test('schema names should not appear in property names', async () => {
  const orm = await MikroORM.init({
    dbName: 'schema_property_test',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate({
    scalarPropertiesForRelations: 'always',
  });

  // The generated property should be "frUsuario", not "public.frUsuario"
  expect(dump.join('\n')).not.toContain('public.frUsuario');
  expect(dump.join('\n')).toContain('frUsuario');

  await orm.close(true);
});
