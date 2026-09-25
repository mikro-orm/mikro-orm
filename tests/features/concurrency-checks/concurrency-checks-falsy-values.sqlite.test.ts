import { defineEntity, MikroORM, OptimisticLockError, p } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    quantity: p.integer().concurrencyCheck(),
    active: p.boolean().concurrencyCheck(),
    token: p.string().nullable().concurrencyCheck(),
    label: p.string(),
  },
});

const Counter = defineEntity({
  name: 'Counter',
  properties: {
    id: p.integer().primary(),
    value: p.integer().concurrencyCheck(),
    label: p.string(),
  },
});

const initial = { quantity: 1, active: true, token: 'initial', label: 'initial' };
const updates = [{ quantity: 0 }, { active: false }, { token: '' }, { token: null }];
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item, Counter], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

describe.each([1, 2])('concurrency checks with %i entities', count => {
  async function createItems() {
    const em = orm.em.fork();
    const items = Array.from({ length: count }, (_, index) => em.create(Item, { id: index + 1, ...initial }));
    await em.flush();

    return { em, items };
  }

  test.each([...updates, { quantity: 2 }])('accepts an update to %j without a competing writer', async update => {
    const { em, items } = await createItems();
    items.forEach(item => em.assign(item, update));

    await em.flush();

    expect(await em.fork().findAll(Item, { orderBy: { id: 'asc' } })).toMatchObject(
      items.map(item => ({ id: item.id, ...initial, ...update })),
    );
  });

  test('rejects an update to zero when the concurrency property has changed in the database', async () => {
    const em = orm.em.fork();
    const counters = Array.from({ length: count }, (_, index) =>
      em.create(Counter, { id: index + 1, value: 1, label: 'initial' }),
    );
    await em.flush();
    await em.fork().nativeUpdate(Counter, counters[0].id, { value: 2 });
    counters.forEach(counter => (counter.value = 0));

    await expect(em.flush()).rejects.toThrow(OptimisticLockError);

    expect(await em.fork().findAll(Counter, { orderBy: { id: 'asc' } })).toMatchObject(
      counters.map((counter, index) => ({ id: counter.id, value: index === 0 ? 2 : 1, label: 'initial' })),
    );
  });

  test('rejects an update that leaves all concurrency properties unchanged', async () => {
    const { em, items } = await createItems();
    items.forEach(item => (item.label = 'updated'));

    await expect(em.flush()).rejects.toThrow(OptimisticLockError);

    expect(await em.fork().findAll(Item, { orderBy: { id: 'asc' } })).toMatchObject(
      items.map(item => ({ id: item.id, ...initial })),
    );
  });
});
