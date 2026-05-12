import { LoadStrategy } from '@mikro-orm/core';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToOne({ entity: () => ProductPackage, mappedBy: 'product', nullable: true })
  package?: ProductPackage | null;
}

@Entity()
class ProductPackage {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToOne({ entity: () => Product, inversedBy: 'package' })
  product!: Product;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Product],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test.each([undefined, LoadStrategy.SELECT_IN, LoadStrategy.JOINED, LoadStrategy.BALANCED])(
  'em.populate wires inverse 1:1 on mapped entities with partial fields, strategy: %s',
  async strategy => {
    const product1 = orm.em.create(Product, { title: 'Product 1' });
    const product2 = orm.em.create(Product, { title: 'Product 2' });
    orm.em.create(ProductPackage, { title: 'Package 1', product: product1 });
    orm.em.create(ProductPackage, { title: 'Package 2', product: product2 });
    await orm.em.flush();
    orm.em.clear();

    const em = orm.em.fork();
    const products = [
      em.map(Product, { id: product1.id, title: product1.title }),
      em.map(Product, { id: product2.id, title: product2.title }),
    ];

    await em.populate(products, ['package'], {
      fields: ['package.title'],
      strategy,
    });

    expect(products[0].package?.title).toBe('Package 1');
    expect(products[1].package?.title).toBe('Package 2');
    expect(products[0].package?.product).toBe(products[0]);
    expect(products[1].package?.product).toBe(products[1]);
  },
);
