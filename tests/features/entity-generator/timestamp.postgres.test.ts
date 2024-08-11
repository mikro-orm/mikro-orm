import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schema = `
CREATE TABLE IF NOT EXISTS test (
  test_id serial4 NOT NULL,
  test_data_cadastro timestamp NOT NULL,
  test_data_alteracao timestamp NOT NULL,
  CONSTRAINT test_pkey PRIMARY KEY (test_id)
);
`;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5918',
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
    ensureDatabase: false,
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }
});

afterAll(async () => {
  await orm.close(true);
});

test('5918', async () => {
  const dump = await orm.entityGenerator.generate({
    bidirectionalRelations: true,
    identifiedReferences: true,
    scalarTypeInDecorator: true,
    scalarPropertiesForRelations: 'always',
    onlyPurePivotTables: false,
    outputPurePivotTables: true,
    useCoreBaseEntity: true,
  });
  expect(dump).toMatchSnapshot('dump');
});
