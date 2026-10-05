import { defineEntity, MikroORM, p, quote, sql } from '@mikro-orm/sqlite';

const Product = defineEntity({
  name: 'Product',
  tableName: 'products',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    externalId: p.string().nullable(),
    category: p.string().default('default'),
  },
  indexes: [
    {
      name: 'products_external_id_unique',
      expression: (columns, table, indexName) =>
        quote`create unique index ${indexName} on ${table} (${columns.externalId}) where ${columns.externalId} is not null and ${columns.category} is not null`,
    },
  ],
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Product],
    dbName: ':memory:',
  });
});

beforeEach(async () => {
  await orm.schema.refresh();
  await orm.em.insertMany(Product, [
    { id: 1, title: 'Unrelated', externalId: 'EXT1', category: 'c1' },
    // seeded last, sqlite keeps reporting its rowid as the insert id after an ignored insert

    { id: 2, title: 'Existing', externalId: 'EXT2', category: 'c2' },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await orm.close(true);
});

const options = {
  onConflictFields: sql`(external_id) where external_id is not null and category is not null`,
  onConflictAction: 'ignore',
} as const;

describe.each([true, false])('ignored conflict on a raw conflict target (returning: %s)', returning => {
  beforeEach(() => {
    vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(returning);
  });

  test('upsert hydrates the conflicting row', async () => {
    const em = orm.em.fork();
    const product = await em.upsert(Product, { title: 'New', externalId: 'EXT2' }, options);

    expect(product).toMatchObject({ id: 2, title: 'Existing', externalId: 'EXT2', category: 'c2' });
    expect(await em.count(Product)).toBe(2);
  });

  test('upsert does not identify the row by the predicate columns', async () => {
    const em = orm.em.fork();
    const product = await em.upsert(
      Product,
      { title: 'New', externalId: 'EXT2', category: 'other' },
      {
        onConflictFields: sql`(EXTERNAL_ID) where external_id is not null and category is not null`,
        onConflictAction: 'ignore',
      },
    );

    expect(product).toMatchObject({ id: 2, title: 'Existing', externalId: 'EXT2', category: 'c2' });
    expect(await em.count(Product)).toBe(2);
  });

  test('upsertMany hydrates the conflicting rows', async () => {
    const em = orm.em.fork();
    const products = await em.upsertMany(
      Product,
      [
        { title: 'New 2', externalId: 'EXT2' },
        { title: 'New 3', externalId: 'EXT3' },
      ],
      options,
    );

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({ id: 2, title: 'Existing', externalId: 'EXT2', category: 'c2' });
    expect(products[1]).toMatchObject({ title: 'New 3', externalId: 'EXT3', category: 'default' });
    expect(products[1].id).toBeGreaterThan(2);
    expect(await em.count(Product)).toBe(3);
  });
});
