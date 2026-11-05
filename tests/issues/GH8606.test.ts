import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

let orm: MikroORM;

afterEach(async () => {
  await orm.close(true);
});

async function setup(deleteRule: 'set null' | 'cascade' | 'restrict' | 'no action') {
  const Customer = defineEntity({
    name: 'Customer',
    properties: {
      id: p.integer().primary(),
      orders: () => p.oneToMany(Order).mappedBy('customer'),
    },
  });

  const Order = defineEntity({
    name: 'Order',
    properties: {
      id: p.integer().primary(),
      customer: () => p.manyToOne(Customer).nullable().deleteRule(deleteRule),
    },
  });

  orm = await MikroORM.init({ entities: [Customer, Order], dbName: ':memory:' });
  await orm.schema.create();
  await orm.em.insert(Customer, { id: 1 });
  await orm.em.insert(Order, { id: 1, customer: 1 });

  return { Customer, Order };
}

describe.each(['set null', 'cascade', 'restrict', 'no action'] as const)(
  'GH #8606 deleteRule %s with loaded 1:M collection',
  deleteRule => {
    test('em.remove() respects the FK delete rule of the inverse side', async () => {
      const { Customer, Order } = await setup(deleteRule);
      const em = orm.em.fork();
      const customer = await em.findOneOrFail(Customer, 1, { populate: ['orders'] });
      em.remove(customer);

      if (deleteRule === 'set null') {
        await em.flush();
        expect(await orm.em.fork().find(Customer, {})).toHaveLength(0);
        expect(await orm.em.fork().find(Order, {})).toMatchObject([{ id: 1, customer: null }]);
      } else if (deleteRule === 'cascade') {
        await em.flush();
        expect(await orm.em.fork().find(Customer, {})).toHaveLength(0);
        expect(await orm.em.fork().find(Order, {})).toHaveLength(0);
      } else {
        await expect(em.flush()).rejects.toThrow(/FOREIGN KEY constraint failed/);
        expect(await orm.em.fork().find(Customer, {})).toHaveLength(1);
        expect(await orm.em.fork().find(Order, {})).toMatchObject([{ id: 1, customer: { id: 1 } }]);
      }
    });
  },
);
