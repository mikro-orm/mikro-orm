import { defineEntity, MikroORM, OptimisticLockError, p } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    active: p.boolean().concurrencyCheck(),
    revision: p.integer().concurrencyCheck(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

describe.each([true, false])('original boolean value: %s', active => {
  async function loadItems(extraRow = false) {
    const em = orm.em.fork();
    await em.insertMany(
      Item,
      Array.from({ length: extraRow ? 3 : 2 }, (_, index) => ({ id: index + 1, active, revision: 1 })),
    );
    const items = await em.find(Item, { id: [1, 2] }, { orderBy: { id: 'asc' } });
    return { em, items };
  }

  test.each([false, true])('updates the batch without a conflict (extra row: %s)', async extraRow => {
    const { em, items } = await loadItems(extraRow);
    items.forEach(item => (item.revision = 2));
    await em.flush();

    const expected = [
      { id: 1, active, revision: 2 },
      { id: 2, active, revision: 2 },
    ];
    if (extraRow) {
      expected.push({ id: 3, active, revision: 1 });
    }
    expect(await em.fork().findAll(Item, { orderBy: { id: 'asc' } })).toMatchObject(expected);
  });

  test.each([
    { field: 'active', pendingInsert: false },
    { field: 'revision', pendingInsert: false },
    { field: 'active', pendingInsert: true },
    { field: 'revision', pendingInsert: true },
  ])(
    'reports the stale entity after $field changes (pending insert: $pendingInsert)',
    async ({ field, pendingInsert }) => {
      const { em, items } = await loadItems();
      const other = em.fork();
      await other.nativeUpdate(Item, items[1].id, field === 'active' ? { active: !active } : { revision: 3 });
      const before = await other.findAll(Item, { orderBy: { id: 'asc' } });
      items.forEach(item => (item.revision = 2));
      if (pendingInsert) {
        em.create(Item, { id: 3, active, revision: 1 });
      }

      const error = await em.flush().catch((error: unknown) => error);
      expect(error).toBeInstanceOf(OptimisticLockError);
      expect((error as OptimisticLockError).getEntity()).toBe(items[1]);
      expect(await em.fork().findAll(Item, { orderBy: { id: 'asc' } })).toMatchObject(before);
    },
  );

  test('reports the stale entity when another writer deletes a row', async () => {
    const { em, items } = await loadItems();
    await em.fork().nativeDelete(Item, items[1].id);
    items.forEach(item => (item.revision = 2));

    const error = await em.flush().catch((error: unknown) => error);
    expect(error).toBeInstanceOf(OptimisticLockError);
    expect((error as OptimisticLockError).getEntity()).toBe(items[1]);
    expect(await em.fork().findAll(Item)).toMatchObject([{ id: 1, active, revision: 1 }]);
  });
});
