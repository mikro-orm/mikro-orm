import { Entity, MikroORM, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/sqlite';

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

test('dataloader ref issue', async () => {
  orm.em.create(Category, { name: 'Category 1', products: [{ name: 'Product 1' }] });
  await orm.em.flush();
  orm.em.clear();

  const p1 = await orm.em.findOneOrFail(Product, { name: 'Product 1' });
  await p1.categories.init({ dataloader: true, ref: true });
  expect(p1.categories.isInitialized()).toBe(true);
  expect(p1.categories.isInitialized(true)).toBe(false);
});
