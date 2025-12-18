import crypto from 'node:crypto';
import { Collection, Entity, MikroORM, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Neo4jDriver, Neo4jMikroORM } from '@mikro-orm/neo4j';

@Entity()
class Category {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  categoryName!: string;

  @OneToMany(() => Product, product => product.category)
  products = new Collection<Product>(this);
}

@Entity()
class Product {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  productName!: string;

  @ManyToOne(() => Category, { ref: true, nullable: true, custom: { relationship: { type: 'PART_OF', direction: 'OUT' } } })
  category?: Ref<Category>;
}

@Entity({
  expression: () => ({
    cypher: 'MATCH (c:Category) RETURN { categoryName: c.categoryName, totalProducts: size((c)<-[:PART_OF]-(:Product)) } as node',
  }),
})
class CategorySummary {
  @Property()
  categoryName!: string;

  @Property()
  totalProducts!: number;
}

describe('Neo4j driver (MVP)', () => {
  let orm: MikroORM<Neo4jDriver>;

  beforeAll(async () => {
    orm = await Neo4jMikroORM.init({
      clientUrl: 'bolt://localhost:7687',
      entities: [Product, Category, CategorySummary],
      dbName: 'neo4j',
      user: 'neo4j',
      password: 'test',
    });
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('create and load product with category', async () => {
    const cat = orm.em.create(Category, { categoryName: 'Electronics' });
    const prod = orm.em.create(Product, { productName: 'Phone', category: cat });
    await orm.em.persistAndFlush([cat, prod]);
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Product, { id: prod.id }, { populate: ['category'] });
    expect(loaded.productName).toBe('Phone');
    expect(loaded.category!.$.categoryName).toBe('Electronics');
  });

  test('transactional rollback', async () => {
    await expect(orm.em.transactional(async em => {
      const cat = em.create(Category, { categoryName: 'Rollback' });
      em.persist(cat);
      await em.flush();
      throw new Error('fail');
    })).rejects.toThrow('fail');

    const count = await orm.em.count(Category, {});
    expect(count).toBe(0);
  });

  test('virtual entity aggregation', async () => {
    const cat = orm.em.create(Category, { categoryName: 'Books' });
    orm.em.persist(cat);
    orm.em.create(Product, { productName: 'Book A', category: cat });
    orm.em.create(Product, { productName: 'Book B', category: cat });
    await orm.em.flush();

    const summaries = await orm.em.find(CategorySummary, {});
    expect(summaries).toHaveLength(1);
    expect(summaries[0].categoryName).toBe('Books');
    expect(summaries[0].totalProducts).toBe(2);
  });
});
