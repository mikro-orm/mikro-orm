import { MikroORM, defineEntity, p } from '@mikro-orm/postgresql';

const TestEntity = defineEntity({
  name: 'TestEntity',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7187',
    entities: [TestEntity],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('table-only comment change is detected in schema diff', async () => {
  const meta = orm.getMetadata(TestEntity);
  meta.comment = 'table comment';

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('table comment');
});
