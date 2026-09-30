import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  sku!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();

  // SQLite has no built-in `regexp` function, `x regexp y` calls `regexp(y, x)`
  const db = await orm.em.getConnection().getNativeClient();
  db.function('regexp', (pattern: string, value: string) => (new RegExp(pattern).test(value) ? 1 : 0));

  ['AB_12', 'ABX12', 'AB12', 'AB1112', 'A+B', 'draft', 'review', '50%', '500', 'a\\b'].forEach(sku =>
    orm.em.create(Product, { sku }),
  );
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

async function skus(sku: RegExp) {
  const products = await orm.em.fork().find(Product, { sku }, { orderBy: { id: 'asc' } });
  return products.map(p => p.sku);
}

test('regexps that LIKE cannot express are not converted to LIKE', async () => {
  expect(await skus(/^AB_12$/)).toEqual(['AB_12']);
  expect(await skus(/^50%$/)).toEqual(['50%']);
  expect(await skus(/^AB1+2$/)).toEqual(['AB12', 'AB1112']);
  expect(await skus(/^A\+B$/)).toEqual(['A+B']);
  expect(await skus(/^draft$|^review$/)).toEqual(['draft', 'review']);
  expect(await skus(/^AB\d\d$/)).toEqual(['AB12']);
  expect(await skus(/^a\\b$/)).toEqual(['a\\b']);
});

test('simple regexps are still converted to LIKE', async () => {
  const mock = mockLogger(orm);
  expect(await skus(/^AB.1.*2$/)).toEqual(['AB_12', 'ABX12', 'AB1112']);
  expect(await skus(/X1/)).toEqual(['ABX12']);
  expect(await skus(/^dra/)).toEqual(['draft']);
  expect(await skus(/iew$/)).toEqual(['review']);
  expect(mock.mock.calls.map(call => call[0]).filter(sql => sql.includes('like'))).toHaveLength(4);
});
