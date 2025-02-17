import { MikroORM, TextType, Type } from '@mikro-orm/postgresql';
import { Author2, FooBaz2 } from '../../entities-sql/index.js';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
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
