import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table "test" (
    "id" int8 not null,
    "cidr" cidr default '127.0.0.0/8',
    "poly" polygon default '((0,0),(1,0),(1,1),(0,1))',
    "r" varbit(8) default '1',
    primary key ("id")
  );
`;

test('unknown-types', async () => {
  const orm = await MikroORM.init({
    dbName: 'unknown-types-test',
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
