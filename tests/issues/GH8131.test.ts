import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

// Postgres reports decimal defaults unquoted while metadata keeps the quoted literal, so a
// `default('0.00')` column diffed on every schema update, right after it was created from it.

const Product = defineEntity({
  name: 'Product',
  properties: () => ({
    id: p.integer().primary().autoincrement(),
    price: p.decimal().precision(12).scale(2).default('0.00'),
    quantity: p.decimal().precision(12).scale(2).default('0'),
    discount: p.decimal().precision(12).scale(2).default(0),
    tax: p.decimal().precision(12).scale(2).defaultRaw('0.00'),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh8131',
    entities: [Product],
  });
  await orm.schema.ensureDatabase();
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('schema is up to date after creating decimal columns with quoted defaults', async () => {
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');
});
