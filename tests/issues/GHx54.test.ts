import { Opt, SimpleLogger } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  Formula,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Embeddable()
class ProductPackageLocalizedTitle {
  @Property({ nullable: true })
  en?: string;

  @Property({ nullable: true })
  el?: string;
}

@Embeddable()
class FontStyle {
  @Property({ nullable: true })
  fontFamily?: string;

  @Property({ nullable: true })
  fontWeight?: string;
}

@Embeddable()
class DisplayInfo {
  @Property({ nullable: true })
  badgeLabel?: string;

  @Embedded(() => FontStyle, { nullable: true })
  font?: FontStyle;
}

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

  @Formula(cols => `${cols.quantity} || ' x ' || ${cols.multiplier}`)
  title!: Opt<string>;

  @Embedded(() => ProductPackageLocalizedTitle)
  localizedTitle!: ProductPackageLocalizedTitle;

  @Embedded(() => DisplayInfo, { nullable: true })
  display?: DisplayInfo;

  @Property()
  quantity!: number;

  @Property()
  multiplier!: number;

  @OneToOne({ entity: () => Product, inversedBy: 'package' })
  product!: Product;
}

@Entity()
class ClientProduct {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Product)
  product!: Product;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [ClientProduct, Product, ProductPackage],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();

  const product1 = orm.em.create(Product, { title: 'Product 1' });
  const product2 = orm.em.create(Product, { title: 'Product 2' });
  orm.em.create(ProductPackage, {
    quantity: 2,
    multiplier: 3,
    localizedTitle: { en: 'Package 1' },
    display: { badgeLabel: 'Hot', font: { fontFamily: 'Inter', fontWeight: '700' } },
    product: product1,
  });
  orm.em.create(ProductPackage, {
    quantity: 4,
    multiplier: 5,
    localizedTitle: { en: 'Package 2' },
    display: { badgeLabel: 'New', font: { fontFamily: 'Arial', fontWeight: '400' } },
    product: product2,
  });
  orm.em.create(ClientProduct, { title: 'Client Product 1', product: product1 });
  orm.em.create(ClientProduct, { title: 'Client Product 2', product: product2 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

// The JOIN strategy should already cover `product.package` in the main query.
// A second populate phase that re-fetches the same rows is a bug.
test('em.find with nested populate + projected fields runs a single query', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm, ['query']);

  await em.find(
    ClientProduct,
    {},
    {
      fields: [
        'product.package.title',
        'product.package.quantity',
        'product.package.multiplier',
        'product.package.localizedTitle',
      ],
      populate: ['product.package'],
    },
  );

  const queries = mock.mock.calls.map(call => String(call[0]));
  expect(queries).toHaveLength(1);
  expect(queries[0]).toContain('inner join `product`');
  expect(queries[0]).toContain('left join `product_package`');
});

// Same scenario, but the populated relation contains an inline embeddable that itself
// contains another inline embeddable — exercises the recursive embedded-leaf check.
test('em.find with nested populate + projected fields handles nested inline embeddables', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm, ['query']);

  const results = await em.find(
    ClientProduct,
    {},
    {
      fields: ['product.package.title', 'product.package.display'],
      populate: ['product.package'],
    },
  );

  const queries = mock.mock.calls.map(call => String(call[0]));
  expect(queries).toHaveLength(1);
  expect(results[0].product.package?.display?.font?.fontFamily).toBe('Inter');
  expect(results[0].product.package?.display?.font?.fontWeight).toBe('700');
});
