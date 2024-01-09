import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create schema if not exists "schema1";
  create schema if not exists "schema2";
  create table "schema1"."test" (
    "id" int8 not null,
    "name" varchar,
    "created" timestamptz,
    "test_id" int8 null,
    primary key ("id")
  );
  create table "schema2"."test" (
    "id" int8 not null,
    "name" varchar,
    "created" timestamptz,
    "test_id" int8 null,
    primary key ("id")
  );
  create table "public"."test" (
    "id" int8 not null,
    "name" varchar,
    "created" timestamptz,
    "test_id" int8 null,
    primary key ("id")
  );
  alter table "schema1"."test" add constraint "test_test_id_foreign" foreign key ("test_id") references "schema1"."test" ("id") on update cascade on delete set null;
  alter table "schema2"."test" add constraint "test_test_id_foreign" foreign key ("test_id") references "schema2"."test" ("id") on update cascade on delete set null;
  alter table "public"."test" add constraint "test_test_id_foreign" foreign key ("test_id") references "public"."test" ("id") on update cascade on delete set null;
`;

test('multiple schemas with same table name 1', async () => {
  const orm = await MikroORM.init({
    dbName: '5084',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
    namingStrategy: class extends UnderscoreNamingStrategy {

      getEntityName(tableName: string, schemaName?: string): string {
        if (schemaName !== 'public') {
          return super.getClassName(`${schemaName}_${tableName}`, '_');
        }

        return super.getClassName(tableName, '_');
      }

    },
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});

test('multiple schemas with same table name 2', async () => {
  const orm = await MikroORM.init({
    dbName: '5084',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
