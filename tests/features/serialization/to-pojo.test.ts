import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM, Rel, wrap } from '@mikro-orm/sqlite';

@Embeddable()
class ProductPrice {
  @Property({ type: 'decimal', precision: 10, scale: 3 })
  retail: number = 0;

  @Property({ type: 'decimal', precision: 10, scale: 3 })
  net: number = 0;
}

@Entity()
class Category {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  name!: string;
}

@Entity()
class Product {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  title!: string;

  @Embedded(() => ProductPrice)
  price = new ProductPrice();

  @ManyToOne(() => Category, { nullable: true })
  category?: Rel<Category>;
}

describe('toPOJO drops embeddables after populate with fields', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Product, Category],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('should preserve embeddable properties in toPOJO after populate with fields narrows loaded-fields', async () => {
    // Setup: create a product with a category and price
    const category = orm.em.create(Category, { name: 'Food' });
    const product = orm.em.create(Product, {
      title: 'Test Product',
      price: { retail: 12, net: 10 },
      category,
    });
    await orm.em.flush();
    orm.em.clear();

    // Simulate CDC batch processing with shared identity map (like @EnsureRequestContext)
    const em = orm.em.fork();

    // --- Message 1 in batch ---
    // em.map simulates reconstructing entity from Debezium CDC payload
    const entity1 = em.map(Product, {
      id: product.id,
      title: 'Test Product',
      price_retail: 12,
      price_net: 10,
      category_id: category.id,
    });

    const pojo1 = wrap(entity1).toPOJO();
    // ✅ Embeddable is present after first em.map + toPOJO
    expect(pojo1.price).toBeDefined();
    expect(pojo1.price.retail).toBe('12');
    expect(pojo1.price.net).toBe('10');

    // Simulate populateProductSearchFields — only requesting category fields
    await em.populate(entity1, ['category'], {
      fields: ['category.name'],
    });

    // --- Message 2 in batch (same entity ID) ---
    // em.map returns the same identity-mapped entity
    const entity2 = em.map(Product, {
      id: product.id,
      title: 'Test Product',
      price_retail: 15,
      price_net: 13,
      category_id: category.id,
    });

    // Same entity instance due to identity map
    expect(entity2).toBe(entity1);

    const pojo2 = wrap(entity2).toPOJO();
    // toPOJO ignores partial-loading hints, so embeddable must be present
    expect(pojo2.price).toBeDefined();
    expect(pojo2.price.retail).toBe('15');
    expect(pojo2.price.net).toBe('13');

    // populated category should also be present
    expect(pojo2.category).toBeDefined();
    expect(pojo2.category!.name).toBe('Food');
  });
});
