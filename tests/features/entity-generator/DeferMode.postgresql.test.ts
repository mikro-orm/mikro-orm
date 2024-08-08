import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  CREATE TABLE "locale" (
    "code" varchar(10) NOT NULL,
    PRIMARY KEY ("code")
  );

  CREATE TABLE "test" (
    "id" int8 NOT NULL,
    "first_name" varchar,
    "middle_initial" character,
    "last_name" varchar(255),
    "government_id" bpchar(10) CONSTRAINT must_be_different UNIQUE DEFERRABLE INITIALLY DEFERRED,
    "locale" varchar(10),
    PRIMARY KEY ("id"),
    CONSTRAINT "locale_fk" FOREIGN KEY ("locale") REFERENCES "locale" ("code") DEFERRABLE INITIALLY DEFERRED
  );
`;

test('defer-mode', async () => {
  const orm = await MikroORM.init({
    dbName: 'defer-mode-test',
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
