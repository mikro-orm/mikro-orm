import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table "test" (
    "id" int8 not null,
    "first_name" varchar,
    "middle_initial" character,
    "last_name" varchar(255),
    "gender" character(1),
    "currency" character(2),
    "locale" varchar(45),
    "blood_type" char(2),
    "mother_initial" char(1),
    "spouce_initial" varchar(1),
    "notes" bpchar,
    "favorite_letter" bpchar(1),
    "government_id" bpchar(10),
    "description" char,
    primary key ("id")
  );
`;

test('character-types', async () => {
  const orm = await MikroORM.init({
    dbName: 'character-types-test',
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
