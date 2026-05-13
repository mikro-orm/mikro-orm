import { defineEntity, EventArgs, EventSubscriber, MikroORM, p } from '@mikro-orm/sqlite';

const ProductSchema = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    context: p.json<{ mode: string; timestamp: string }>().nullable(),
  },
  uniques: [{ properties: ['title'] }],
});
class Product extends ProductSchema.class {}
ProductSchema.setClass(Product);

class EntityContextSubscriber implements EventSubscriber<Product> {
  beforeUpsertCalls = 0;
  afterUpsertCalls = 0;

  beforeUpsert(args: EventArgs<Product>) {
    this.beforeUpsertCalls++;
    args.entity.context = { mode: 'flush', timestamp: 'fixed' };
  }

  afterUpsert() {
    this.afterUpsertCalls++;
  }
}

describe('GHx48 — beforeUpsert receives the entity instance when upsert input is an entity', () => {
  let orm: MikroORM;
  let subscriber: EntityContextSubscriber;

  beforeAll(async () => {
    subscriber = new EntityContextSubscriber();
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Product],
      subscribers: [subscriber],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('beforeUpsert/afterUpsert fire when upserting an entity created via em.create()', async () => {
    const product = orm.em.create(Product, {
      title: 'Test Product Valid',
      context: undefined,
    });

    const upserted = await orm.em.upsert(Product, product, {
      onConflictAction: 'merge',
      onConflictFields: ['title'],
      onConflictMergeFields: ['title', 'context'],
    });

    expect(subscriber.beforeUpsertCalls).toBe(1);
    expect(subscriber.afterUpsertCalls).toBe(1);
    expect(upserted.context).toEqual({ mode: 'flush', timestamp: 'fixed' });

    orm.em.clear();
    const reloaded = await orm.em.findOneOrFail(Product, { title: 'Test Product Valid' });
    expect(reloaded.context).toEqual({ mode: 'flush', timestamp: 'fixed' });
  });

  test('beforeUpsert/afterUpsert fire when upsertMany is called with entity instances', async () => {
    subscriber.beforeUpsertCalls = 0;
    subscriber.afterUpsertCalls = 0;

    const products = [
      orm.em.create(Product, { title: 'Bulk Product A', context: undefined }),
      orm.em.create(Product, { title: 'Bulk Product B', context: undefined }),
    ];

    const upserted = await orm.em.upsertMany(Product, products, {
      onConflictAction: 'merge',
      onConflictFields: ['title'],
      onConflictMergeFields: ['title', 'context'],
    });

    expect(subscriber.beforeUpsertCalls).toBe(2);
    expect(subscriber.afterUpsertCalls).toBe(2);
    expect(upserted[0].context).toEqual({ mode: 'flush', timestamp: 'fixed' });
    expect(upserted[1].context).toEqual({ mode: 'flush', timestamp: 'fixed' });

    orm.em.clear();
    const reloaded = await orm.em.find(Product, { title: { $in: ['Bulk Product A', 'Bulk Product B'] } });
    expect(reloaded).toHaveLength(2);
    for (const product of reloaded) {
      expect(product.context).toEqual({ mode: 'flush', timestamp: 'fixed' });
    }
  });
});
