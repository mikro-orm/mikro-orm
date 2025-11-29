import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';

import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
const schema1 = new EntitySchema({
  name: 'EntityOne',
  schema: 'one_schema',
  properties: {
    id: { type: 'uuid', defaultRaw: 'gen_random_uuid()', primary: true },
    enum1: { type: 'enum', nativeEnumName: 'SomeEnum', items: ['A', 'B', 'D'], nullable: true },
  },
});

const schema2 = new EntitySchema({
  name: 'EntityTwo',
  schema: 'two_schema', // other schema
  properties: {
    id: { type: 'uuid', defaultRaw: 'gen_random_uuid()', primary: true },
    enum2: { type: 'enum', nativeEnumName: 'SomeEnum', items: ['D', 'E', 'F'], nullable: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5905',
    entities: [schema1, schema2],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('date range', async () => {
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});
