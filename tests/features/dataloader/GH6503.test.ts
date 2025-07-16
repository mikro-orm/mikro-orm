import { Entity, MikroORM, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Category, 'products')
  categories = new Collection<Category>(this);

}

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Product)
  products = new Collection<Product>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product, Category],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('dataloader generated queries', async () => {
  {
    // All products except Product 4 are added into Category 1
    const p1 = orm.em.create(Product, { name: 'Product 1' });
    const p2 = orm.em.create(Product, { name: 'Product 2' });
    const p3 = orm.em.create(Product, { name: 'Product 3' });
    const p4 = orm.em.create(Product, { name: 'Product 4' });

    const c1 = orm.em.create(Category, { name: 'Category 1' });
    const c2 = orm.em.create(Category, { name: 'Category 2' });

    c1.products.add([p1, p2, p3]);
  }

  await orm.em.flush();
  orm.em.clear();

  {
    const p1 = await orm.em.findOneOrFail(Product, { name: 'Product 1' });
    const mock = mockLogger(orm);
    await p1.categories.init({ dataloader: false });
    expect(mock.mock.calls[0][0]).toMatch('select `c1`.*, `c0`.`product_id` as `fk__product_id`, `c0`.`category_id` as `fk__category_id` from `category_products` as `c0` inner join `category` as `c1` on `c0`.`category_id` = `c1`.`id` where `c0`.`product_id` in (1)');
  }

  {
    const p1 = await orm.em.findOneOrFail(Product, { name: 'Product 1' });
    const mock = mockLogger(orm);
    await p1.categories.init({ dataloader: true });
    expect(mock.mock.calls[0][0]).toMatch('select `c1`.*, `c0`.`product_id` as `fk__product_id`, `c0`.`category_id` as `fk__category_id` from `category_products` as `c0` inner join `category` as `c1` on `c0`.`category_id` = `c1`.`id` where `c0`.`product_id` = 1 and `c0`.`product_id` in (1)');
  }
});

test('dataloader ref issue', async () => {
  orm.em.create(Category, { name: 'Category 1', products: [{ name: 'Product 1' }] });
  await orm.em.flush();
  orm.em.clear();

  const p1 = await orm.em.findOneOrFail(Product, { name: 'Product 1' });
  await p1.categories.init({ dataloader: true, ref: true });
  expect(p1.categories.isInitialized()).toBe(true);
  expect(p1.categories.isInitialized(true)).toBe(false);
});
