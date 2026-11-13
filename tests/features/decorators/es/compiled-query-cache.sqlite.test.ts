import { type Dictionary, MikroORM, QueryBuilder } from '@mikro-orm/sqlite';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
@Filter({ name: 'minPrice', cond: (args: Dictionary) => ({ price: { $gte: args.min } }), default: false })
class Product {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  price!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Product],
    dbName: ':memory:',
    compiledQueryCache: { enabled: true, verify: true },
  });
  await orm.schema.create();
  const em = orm.em.fork();
  [10, 20, 30, 40].forEach((price, idx) => em.create(Product, { id: idx + 1, price }));
  await em.flush();
});

afterAll(() => orm.close(true));

test('callback filters of ES decorator entities are bound again on every compiled query', async () => {
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');
  const prices: number[][] = [];

  for (const min of [10, 20, 30, 40]) {
    const products = await orm.em.fork().find(Product, { id: { $gt: 0 } }, { filters: { minPrice: { min } } });
    prices.push(products.map(p => p.price));
  }

  expect(prices).toEqual([[10, 20, 30, 40], [20, 30, 40], [30, 40], [40]]);
  expect(hits).toHaveBeenCalledTimes(2);
});
