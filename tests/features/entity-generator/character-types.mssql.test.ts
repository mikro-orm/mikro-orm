import { MikroORM } from '@mikro-orm/mssql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  CREATE TABLE [test] (
    [id] int identity(1,1) not null primary key,
    [first_name] varchar(max),
    [middle_initial] char,
    [last_name] varchar(255),
    [gender] nchar(1),
    [currency] nchar(2),
    [locale] varchar(45),
    [blood_type] char(2),
    [mother_initial] char(1),
    [spouce_initial] varchar(1),
    [notes] nvarchar(max),
    [favorite_letter] nvarchar(1),
    [government_id] nvarchar(10),
    [descr] nvarchar(255),
    [father_initial] nchar,
    [father_in_group] varchar,
    [member_in_group] nvarchar
  );
`;

test('character-types', async () => {
  const orm = await MikroORM.init({
    dbName: 'character-types-test',
    password: 'Root.Root',
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
