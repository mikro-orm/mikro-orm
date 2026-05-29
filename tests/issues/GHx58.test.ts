import { defineEntity, MikroORM, p, quote, sql } from '@mikro-orm/sqlite';

// upsertMany with a raw `onConflictFields` fragment (a partial unique index) plus `onConflictMergeFields`
// used to leave the returned managed entity holding the *input* values for the non-merged columns, even
// though the conflict update never wrote them. the in-memory state thus diverged from the db, so a later
// `assign()` of that same value was a no-op and never got flushed.
const Product = defineEntity({
  name: 'Product',
  tableName: 'products',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    localizedTitle: p.string().nullable(),
    externalId: p.string().length(12).nullable(),
    category: p.string().default('default'),
  },
  indexes: [
    {
      name: 'products_external_id_unique',
      expression: (columns, table, indexName) =>
        quote`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns.externalId}) WHERE ${columns.externalId} IS NOT NULL`,
    },
  ],
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Product],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('non-merged columns reflect db state after upsertMany with a raw conflict target', async () => {
  orm.em.create(Product, {
    title: 'Localized Product',
    localizedTitle: 'Old Localized Title',
    externalId: 'EXT000000008',
    category: 'Localized Category',
  });
  await orm.em.flush();
  orm.em.clear();

  const [upserted] = await orm.em.upsertMany(
    Product,
    [
      orm.em.create(Product, {
        title: 'Localized Product Updated',
        localizedTitle: 'New Localized Title',
        externalId: 'EXT000000008',
        category: 'Localized Category Updated',
      }),
    ],
    {
      onConflictFields: sql`(external_id) where external_id is not null`,
      onConflictAction: 'merge',
      onConflictMergeFields: ['title', 'category'],
    },
  );

  // localizedTitle was not part of the merge fields, so the db keeps the old value and the
  // managed entity must reflect that, not the value we passed in
  expect(upserted.localizedTitle).toBe('Old Localized Title');

  orm.em.assign(upserted, { localizedTitle: 'New Localized Title' });
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await orm.em.findOneOrFail(Product, { externalId: 'EXT000000008' });
  expect(reloaded.title).toBe('Localized Product Updated');
  expect(reloaded.category).toBe('Localized Category Updated');
  expect(reloaded.localizedTitle).toBe('New Localized Title');
});
