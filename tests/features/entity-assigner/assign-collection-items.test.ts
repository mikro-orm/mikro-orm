import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../../helpers.js';

function generateProducts(amountOfProducts: number, amountOfVariants: number) {
  const products = [];
  const variants = [];

  for (let j = 0; j < amountOfVariants; j++) {
    variants.push({
      name: `variant-${j}-${Math.random()}`,
    });
  }

  for (let j = 0; j < amountOfProducts; j++) {
    products.push({
      name: `product-${j}-${Math.random()}`,
      variants,
    });
  }

  return products;
}

@Entity()
class Store {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property({ type: 'text' })
  name!: string;

  @OneToMany(() => Product, product => product.store, { orphanRemoval: true })
  products = new Collection<Product>(this);

}

@Entity()
class Product {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property({ type: 'text' })
  name!: string;

  @ManyToOne(() => Store, { ref: true, deleteRule: 'cascade' })
  store!: Ref<Store>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Store, Product],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('assigning collection items with updateByPrimaryKey: false', async () => {
  const data = {
    name: 'store',
    products: generateProducts(1, 1),
  };

  const store = orm.em.create(Store, data);
  await orm.em.flush();

  data.products = generateProducts(2, 1);
  orm.em.assign(store, data, { updateByPrimaryKey: false });

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `product` (`id`, `name`, `store_id`) values (?, ?, ?)'],
    ['[query] update `product` set `name` = ? where `id` = ?'],
    ['[query] commit'],
  ]);
});

test('assigning collection items with updateNestedEntities: false', async () => {
  const data = {
    name: 'store',
    products: generateProducts(1, 1),
  };

  const store = orm.em.create(Store, data);
  await orm.em.flush();

  data.products = generateProducts(2, 1);
  orm.em.assign(store, data, { updateNestedEntities: false });

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `product` (`id`, `name`, `store_id`) values (?, ?, ?), (?, ?, ?)'],
    ['[query] delete from `product` where `id` in (?)'],
    ['[query] commit'],
  ]);
});
