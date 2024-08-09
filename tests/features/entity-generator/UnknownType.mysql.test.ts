import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table \`test\` (
    \`id\` bigint unsigned auto_increment,
    \`poly\` polygon,
    \`r\` bit(8) default b'1',
    primary key (\`id\`)
  );
`;

test('unknown-types', async () => {
  const orm = await MikroORM.init({
    dbName: 'unknown-types-test',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
    ensureDatabase: false,
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
