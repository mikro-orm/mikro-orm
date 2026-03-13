import { MikroORM, TextType, Type, defineEntity, p } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Author2, FooBaz2 } from '../../entities-sql/index.js';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author2, FooBaz2],
    dbName: `mikro_orm_test_3066`,
    discovery: {
      getMappedType(type: string) {
        if (type === 'string') {
          return Type.getType(TextType);
        }

        return undefined;
      },
    },
  });
});

afterAll(() => orm.close(true));

test('changing default type mapping (GH 3066)', async () => {
  await orm.schema.ensureDatabase();
  const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff0).toMatchSnapshot();
});

test('getMappedType callback always receives abstract type names', async () => {
  const receivedTypes: string[] = [];

  const TestEntity = defineEntity({
    name: 'GetMappedTypeTest',
    properties: {
      id: p.integer().primary(),
      name: p.string(),
      email: p.string(),
      bio: p.text(),
    },
  });

  const orm2 = await MikroORM.init({
    entities: [TestEntity],
    dbName: 'mikro_orm_test_mapped_type',
    discovery: {
      getMappedType(type: string) {
        receivedTypes.push(type);
        if (type === 'string') {
          return Type.getType(TextType);
        }

        return undefined;
      },
    },
  });

  // The callback should never receive resolved column types like varchar(255)
  expect(receivedTypes).not.toContain('varchar(255)');
  // string properties should always be reported as 'string', not as their column type
  expect(receivedTypes.filter(t => t === 'string').length).toBeGreaterThanOrEqual(2);

  // Verify the override was applied
  const meta = orm2.getMetadata().get('GetMappedTypeTest');
  expect(meta.properties.name.columnTypes).toEqual(['text']);
  expect(meta.properties.email.columnTypes).toEqual(['text']);

  await orm2.close();
});
