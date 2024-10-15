import { MikroORM } from '@mikro-orm/mssql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  CREATE XML SCHEMA COLLECTION sampleCollection AS '
<schema xmlns="http://www.w3.org/2001/XMLSchema">
      <element name="root" type="string"/>
</schema>
';

  CREATE TABLE [test] (
    [id] int identity(1,1) not null primary key,
    [at] smalldatetime default current_timestamp,
    [at2] datetime2 default current_timestamp
    );
`;

test('small-date-time-type', async () => {
  const orm = await MikroORM.init({
    dbName: 'small-date-time-type-test',
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
