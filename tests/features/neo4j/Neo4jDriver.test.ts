import crypto from 'node:crypto';
import {
  Collection,
  Entity,
  MikroORM,
  ManyToOne,
  OneToMany,
  ManyToMany,
  PrimaryKey,
  Property,
  Ref,
  type EntityManager,
  Reference,
} from '@mikro-orm/core';
import {
  Neo4jDriver,
  MikroORM as Neo4jMikroORM,
  Node,
  Rel,
  RelMany,
  Field,
  RelationshipProperties,
} from '@mikro-orm/neo4j';

// Traditional decorators
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

  @Property({ nullable: true })
  price?: number;

  @ManyToOne(() => Category, {
    ref: true,
    nullable: true,
  })
  @Rel({ type: 'PART_OF', direction: 'OUT' })
  category?: Ref<Category>;

  @ManyToMany(() => Tag)
  @RelMany({ type: 'HAS_TAG', direction: 'OUT' })
  tags = new Collection<Tag>(this);

}

@Entity()
class Tag {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @ManyToMany(() => Product, p => p.tags)
  @RelMany({ type: 'HAS_TAG', direction: 'IN' })
  products = new Collection<Product>(this);

}

// Graph-style decorators
@Entity()
@Node()
class Person {

  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  age!: number;

  @ManyToOne(() => Person, {
    ref: true,
    nullable: true,
  })
  @Rel({ type: 'KNOWS', direction: 'OUT' })
  knows?: Ref<Person>;

  @ManyToMany(() => Person)
  @RelMany({ type: 'WORKS_WITH', direction: 'OUT' })
  colleagues = new Collection<Person>(this);

}

// Node with multiple labels
@Entity()
@Node({ labels: ['Employee', 'Manager'] })
class Executive {

  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  title!: string;

  @Field()
  department!: string;

}

@Entity({
  expression: () => ({
    cypher:
      'MATCH (c:category) RETURN { categoryName: c.categoryName, totalProducts: COUNT { (c)<-[:PART_OF]-(:product) } } as node',
  }),
})
class CategorySummary {

  @Property()
  categoryName!: string;

  @Property()
  totalProducts!: number;

}

@Entity({
  expression: (em: EntityManager, where: any, options: any) => {
    const cypher = `
      MATCH (p:product)-[:PART_OF]->(c:category)
      RETURN {
        productName: p.productName,
        categoryName: c.categoryName,
        price: p.price
      } as node
      ${
        options.orderBy && Object.keys(options.orderBy).length > 0
          ? 'ORDER BY node.price DESC'
          : ''
      }
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `;
    return { cypher, params: {} };
  },
})
class ProductWithCategory {

  @Property()
  productName!: string;

  @Property()
  categoryName!: string;

  @Property({ nullable: true })
  price?: number;

}

// Neo4j GraphQL-style entities for relationship properties
@Entity()
@Node()
class Actor {

  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  name!: string;

  @Field()
  born!: number;

  @ManyToMany(() => Movie, undefined, {
    pivotEntity: () => ActedIn,
    inversedBy: 'actors',
  })
  @RelMany({ type: 'ACTED_IN', direction: 'OUT' })
  movies = new Collection<Movie>(this);

  @ManyToMany(() => Series, undefined, {
    pivotEntity: () => ActedInSeries,
    inversedBy: 'actors',
  })
  @RelMany({ type: 'ACTED_IN', direction: 'OUT' })
  series = new Collection<Series>(this);

}

@Entity()
@Node()
class Movie {

  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  title!: string;

  @Field()
  released!: number;

  @ManyToMany(() => Actor, actor => actor.movies)
  @RelMany({ type: 'ACTED_IN', direction: 'IN' })
  actors = new Collection<Actor>(this);

}

@Entity()
@Node()
class Series {

  @Field({ primary: true })
  id: string = crypto.randomUUID();

  @Field()
  title!: string;

  @Field()
  released!: number;

  @Field()
  episodes!: number;

  @ManyToMany(() => Actor, actor => actor.series)
  @RelMany({ type: 'ACTED_IN', direction: 'IN' })
  actors = new Collection<Actor>(this);

}

@Entity()
@RelationshipProperties({ type: 'ACTED_IN' })
class ActedIn {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @ManyToOne(() => Actor, { primary: true })
  actor!: Actor;

  @ManyToOne(() => Movie, { primary: true })
  movie!: Movie;

  @Property()
  roles!: string[];

}

@Entity()
@RelationshipProperties({ type: 'ACTED_IN' })
class ActedInSeries {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @ManyToOne(() => Actor, { primary: true })
  actor!: Actor;

  @ManyToOne(() => Series, { primary: true })
  series!: Series;

  @Property()
  roles!: string[];

}

describe('Neo4j driver (MVP)', () => {
  let orm: MikroORM<Neo4jDriver>;

  beforeAll(async () => {
    orm = await Neo4jMikroORM.init({
      clientUrl: 'bolt://localhost:7687',
      entities: [
        Product,
        Category,
        CategorySummary,
        ProductWithCategory,
        Tag,
        Person,
        Executive,
        Actor,
        Movie,
        Series,
        ActedIn,
        ActedInSeries,
      ],
      dbName: 'neo4j',
      user: 'neo4j',
      password: 'testtest',
      ensureDatabase: false,
    });
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  describe('Basic CRUD operations', () => {
    test('create and load single entity', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Electronics' });
      await orm.em.persistAndFlush(cat);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(Category, { id: cat.id });
      expect(loaded.categoryName).toBe('Electronics');
      expect(loaded.id).toBe(cat.id);
    });

    test('create and load product with category', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Electronics' });
      const prod = orm.em.create(Product, {
        productName: 'Phone',
        category: cat,
        price: 999,
      });
      await orm.em.persistAndFlush([cat, prod]);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(
        Product,
        { id: prod.id },
        { populate: ['category'] },
      );
      expect(loaded.productName).toBe('Phone');
      expect(loaded.price).toBe(999);
      expect(loaded.category!.$.categoryName).toBe('Electronics');
    });

    test('update entity', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Electronics' });
      await orm.em.persistAndFlush(cat);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(Category, { id: cat.id });
      loaded.categoryName = 'Updated Electronics';
      await orm.em.flush();
      orm.em.clear();

      const reloaded = await orm.em.findOneOrFail(Category, { id: cat.id });
      expect(reloaded.categoryName).toBe('Updated Electronics');
    });

    test('delete entity', async () => {
      const cat = orm.em.create(Category, { categoryName: 'ToDelete' });
      await orm.em.persistAndFlush(cat);
      orm.em.clear();

      await orm.em.nativeDelete(Category, { id: cat.id });
      const found = await orm.em.findOne(Category, { id: cat.id });
      expect(found).toBeNull();
    });

    test('find multiple entities', async () => {
      orm.em.create(Category, { categoryName: 'Electronics' });
      orm.em.create(Category, { categoryName: 'Books' });
      orm.em.create(Category, { categoryName: 'Clothing' });
      await orm.em.flush();

      const all = await orm.em.find(Category, {});
      expect(all).toHaveLength(3);
      expect(all.map(c => c.categoryName).sort()).toEqual([
        'Books',
        'Clothing',
        'Electronics',
      ]);
    });

    test('count entities', async () => {
      orm.em.create(Product, { productName: 'Phone' });
      orm.em.create(Product, { productName: 'Laptop' });
      await orm.em.flush();

      const count = await orm.em.count(Product, {});
      expect(count).toBe(2);
    });

    test('find with where clause', async () => {
      orm.em.create(Product, { productName: 'Phone', price: 999 });
      orm.em.create(Product, { productName: 'Laptop', price: 1999 });
      orm.em.create(Product, { productName: 'Mouse', price: 29 });
      await orm.em.flush();

      const cheap = await orm.em.find(Product, { price: 29 });
      expect(cheap).toHaveLength(1);
      expect(cheap[0].productName).toBe('Mouse');
    });

    test('find with orderBy', async () => {
      orm.em.create(Product, { productName: 'Zebra', price: 100 });
      orm.em.create(Product, { productName: 'Apple', price: 50 });
      orm.em.create(Product, { productName: 'Banana', price: 75 });
      await orm.em.flush();

      const sorted = await orm.em.find(
        Product,
        {},
        { orderBy: { productName: 'ASC' } },
      );
      expect(sorted.map(p => p.productName)).toEqual([
        'Apple',
        'Banana',
        'Zebra',
      ]);
    });

    test('find with limit and offset', async () => {
      for (let i = 1; i <= 5; i++) {
        orm.em.create(Product, { productName: `Product ${i}` });
      }
      await orm.em.flush();

      const page1 = await orm.em.find(
        Product,
        {},
        { limit: 2, offset: 0, orderBy: { productName: 'ASC' } },
      );
      expect(page1).toHaveLength(2);
      expect(page1[0].productName).toBe('Product 1');

      const page2 = await orm.em.find(
        Product,
        {},
        { limit: 2, offset: 2, orderBy: { productName: 'ASC' } },
      );
      expect(page2).toHaveLength(2);
      expect(page2[0].productName).toBe('Product 3');
    });
  });

  describe('Relationships', () => {
    test('many-to-one relationship', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Electronics' });
      const prod1 = orm.em.create(Product, {
        productName: 'Phone',
        category: cat,
      });
      const prod2 = orm.em.create(Product, {
        productName: 'Laptop',
        category: cat,
      });
      await orm.em.persistAndFlush([cat, prod1, prod2]);
      orm.em.clear();

      const loaded1 = await orm.em.findOneOrFail(
        Product,
        { id: prod1.id },
        { populate: ['category'] },
      );
      const loaded2 = await orm.em.findOneOrFail(
        Product,
        { id: prod2.id },
        { populate: ['category'] },
      );

      expect(loaded1.category!.$.id).toBe(cat.id);
      expect(loaded2.category!.$.id).toBe(cat.id);
    });

    test('many-to-many relationship', async () => {
      const tag1 = orm.em.create(Tag, { name: 'electronics' });
      const tag2 = orm.em.create(Tag, { name: 'mobile' });
      const prod = orm.em.create(Product, { productName: 'Phone' });
      prod.tags.add(tag1, tag2);
      await orm.em.persistAndFlush([tag1, tag2, prod]);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(
        Product,
        { id: prod.id },
        { populate: ['tags'] },
      );
      expect(loaded.tags.length).toBe(2);
      expect(
        loaded.tags
          .getItems()
          .map(t => t.name)
          .sort(),
      ).toEqual(['electronics', 'mobile']);
    });

    test('self-referencing relationship with graph decorators', async () => {
      const john = orm.em.create(Person, { name: 'John', age: 30 });
      const jane = orm.em.create(Person, { name: 'Jane', age: 28 });
      john.knows = Reference.create(jane);
      await orm.em.persistAndFlush([john, jane]);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(
        Person,
        { id: john.id },
        { populate: ['knows'] },
      );
      expect(loaded.knows!.$.name).toBe('Jane');
      expect(loaded.knows!.$.age).toBe(28);
    });

    test('many-to-many self-referencing relationship', async () => {
      const alice = orm.em.create(Person, { name: 'Alice', age: 25 });
      const bob = orm.em.create(Person, { name: 'Bob', age: 30 });
      const charlie = orm.em.create(Person, { name: 'Charlie', age: 35 });
      alice.colleagues.add(bob, charlie);
      await orm.em.persistAndFlush([alice, bob, charlie]);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(
        Person,
        { id: alice.id },
        { populate: ['colleagues'] },
      );
      expect(loaded.colleagues.length).toBe(2);
      expect(
        loaded.colleagues
          .getItems()
          .map(p => p.name)
          .sort(),
      ).toEqual(['Bob', 'Charlie']);
    });
  });

  describe('Transactions', () => {
    test('successful transaction', async () => {
      await orm.em.transactional(async em => {
        const cat = em.create(Category, { categoryName: 'Transaction Test' });
        em.persist(cat);
        await em.flush();
      });

      const count = await orm.em.count(Category, {});
      expect(count).toBe(1);
    });

    test('transactional rollback', async () => {
      await expect(
        orm.em.transactional(async em => {
          const cat = em.create(Category, { categoryName: 'Rollback' });
          em.persist(cat);
          await em.flush();
          throw new Error('fail');
        }),
      ).rejects.toThrow('fail');

      const count = await orm.em.count(Category, {});
      expect(count).toBe(0);
    });

    test('nested transaction (auto-handled)', async () => {
      await orm.em.transactional(async em1 => {
        const cat1 = em1.create(Category, { categoryName: 'Outer' });
        em1.persist(cat1);
        await em1.flush();

        await em1.transactional(async em2 => {
          const cat2 = em2.create(Category, { categoryName: 'Inner' });
          em2.persist(cat2);
          await em2.flush();
        });
      });

      const count = await orm.em.count(Category, {});
      expect(count).toBe(2);
    });

    test('begin and commit manually', async () => {
      const em = orm.em.fork();
      await em.begin();
      const cat = em.create(Category, { categoryName: 'Manual TX' });
      em.persist(cat);
      await em.flush();
      await em.commit();

      const count = await orm.em.count(Category, {});
      expect(count).toBe(1);
    });
  });

  describe('Virtual Entities', () => {
    test('virtual entity with static cypher', async () => {
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

    test('virtual entity with callback expression', async () => {
      const cat1 = orm.em.create(Category, { categoryName: 'Electronics' });
      const cat2 = orm.em.create(Category, { categoryName: 'Books' });
      orm.em.create(Product, {
        productName: 'Phone',
        category: cat1,
        price: 999,
      });
      orm.em.create(Product, {
        productName: 'Book',
        category: cat2,
        price: 29,
      });
      await orm.em.flush();

      const results = await orm.em.find(
        ProductWithCategory,
        {},
        { orderBy: { price: 'DESC' as any }, limit: 1 },
      );
      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Phone');
      expect(results[0].categoryName).toBe('Electronics');
      expect(results[0].price).toBe(999);
    });
  });

  describe('Custom Repository Methods', () => {
    test('run custom cypher via entity manager', async () => {
      orm.em.create(Category, { categoryName: 'Test1' });
      orm.em.create(Category, { categoryName: 'Test2' });
      await orm.em.flush();

      const results = await orm.em.run<{ name: string }>(
        'MATCH (c:category) RETURN c.categoryName as name',
      );
      expect(results).toHaveLength(2);
      expect(results.map(r => r.name).sort()).toEqual(['Test1', 'Test2']);
    });

    test('run custom cypher via repository', async () => {
      const repo = orm.em.getRepository(Product);
      orm.em.create(Product, { productName: 'Product1' });
      orm.em.create(Product, { productName: 'Product2' });
      await orm.em.flush();

      const results = await repo.run<{ name: string }>(
        'MATCH (p:product) RETURN p.productName as name ORDER BY name',
      );
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Product1');
    });

    test('aggregate via entity manager', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Electronics' });
      orm.em.create(Product, {
        productName: 'Phone',
        category: cat,
        price: 999,
      });
      orm.em.create(Product, {
        productName: 'Laptop',
        category: cat,
        price: 1999,
      });
      await orm.em.flush();

      const results = await orm.em.aggregate<{ total: number; avg: number }>(
        'MATCH (p:product) RETURN count(p) as total, avg(p.price) as avg',
      );
      expect(results).toHaveLength(1);
      expect(results[0].total).toBe(2);
      expect(results[0].avg).toBe(1499);
    });
  });

  describe('Fork and Context', () => {
    test('fork entity manager', async () => {
      const cat = orm.em.create(Category, { categoryName: 'Main EM' });
      await orm.em.persistAndFlush(cat);

      const fork = orm.em.fork();
      const loaded = await fork.findOneOrFail(Category, { id: cat.id });
      expect(loaded.categoryName).toBe('Main EM');

      loaded.categoryName = 'Forked EM';
      await fork.flush();

      orm.em.clear(); // Clear identity map to force fresh load
      const reloaded = await orm.em.findOneOrFail(Category, { id: cat.id });
      expect(reloaded.categoryName).toBe('Forked EM');
    });
  });

  describe('Complex queries', () => {
    test('find with $and operator', async () => {
      orm.em.create(Product, { productName: 'Phone', price: 999 });
      orm.em.create(Product, { productName: 'Laptop', price: 1999 });
      orm.em.create(Product, { productName: 'Mouse', price: 29 });
      await orm.em.flush();

      const results = await orm.em.find(Product, {
        $and: [{ productName: 'Phone' }, { price: 999 }],
      } as any);
      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Phone');
    });

    test('find with $or operator', async () => {
      orm.em.create(Product, { productName: 'Phone', price: 999 });
      orm.em.create(Product, { productName: 'Laptop', price: 1999 });
      orm.em.create(Product, { productName: 'Mouse', price: 29 });
      await orm.em.flush();

      const results = await orm.em.find(Product, {
        $or: [{ productName: 'Phone' }, { productName: 'Mouse' }],
      } as any);
      expect(results).toHaveLength(2);
      expect(results.map(r => r.productName).sort()).toEqual([
        'Mouse',
        'Phone',
      ]);
    });
  });

  describe('Multiple Labels', () => {
    test('node with multiple labels', async () => {
      const exec = orm.em.create(Executive, {
        name: 'Jane Smith',
        title: 'CTO',
        department: 'Technology',
      });
      await orm.em.persistAndFlush(exec);
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(Executive, { id: exec.id });
      expect(loaded.name).toBe('Jane Smith');
      expect(loaded.title).toBe('CTO');
      expect(loaded.department).toBe('Technology');

      // Verify the node has multiple labels in Neo4j
      const results = await orm.em.run<{ labels: string[] }>(
        'MATCH (n:executive) WHERE n.id = $id RETURN labels(n) as labels',
        { id: exec.id },
      );
      expect(results).toHaveLength(1);
      expect(results[0].labels.sort()).toEqual([
        'Employee',
        'Manager',
        'executive',
      ]);
    });
  });

  describe('Real World Scenarios', () => {
    // Scenario 1: Virtual Entity (UserProgressView)
    test('virtual entity with aggregations and computed fields', async () => {
      // Create test data
      const user1 = orm.em.create(Category, { categoryName: 'User1' });
      const user2 = orm.em.create(Category, { categoryName: 'User2' });

      // Create completed lessons (using products as lessons)
      for (let i = 0; i < 12; i++) {
        orm.em.create(Product, { productName: `Lesson${i}`, category: user1 });
      }
      for (let i = 0; i < 5; i++) {
        orm.em.create(Product, { productName: `Lesson${i}`, category: user2 });
      }
      await orm.em.flush();

      // Query using raw Cypher to test virtual entity pattern
      const results = await orm.em.run<{
        id: string;
        name: string;
        completedLessons: number;
        level: string;
      }>(
        `MATCH (u:category)
         OPTIONAL MATCH (u)<-[:PART_OF]-(l:product)
         WITH u, count(l) AS completedLessons
         RETURN u.id as id,
                u.categoryName as name,
                completedLessons,
                CASE
                  WHEN completedLessons >= 20 THEN "ADVANCED"
                  WHEN completedLessons >= 10 THEN "INTERMEDIATE"
                  ELSE "BEGINNER"
                END as level`,
      );

      expect(results.length).toBe(2);
      const user1Result = results.find(r => r.name === 'User1');
      expect(user1Result).toBeDefined();
      expect(user1Result!.completedLessons).toBe(12);
      expect(user1Result!.level).toBe('INTERMEDIATE');

      const user2Result = results.find(r => r.name === 'User2');
      expect(user2Result).toBeDefined();
      expect(user2Result!.completedLessons).toBe(5);
      expect(user2Result!.level).toBe('BEGINNER');
    });

    // Scenario 2: Polymorphism with multiple labels
    test('polymorphism via multiple labels and label detection', async () => {
      // Create users with different roles
      const student = orm.em.create(Person, { name: 'Alice', age: 20 });
      const admin = orm.em.create(Person, { name: 'Bob', age: 35 });
      await orm.em.persistAndFlush([student, admin]);

      // Manually add role labels using raw Cypher
      await orm.em.run(
        'MATCH (p:person {id: $id}) SET p:Student',
        { id: student.id },
      );
      await orm.em.run(
        'MATCH (p:person {id: $id}) SET p:Admin',
        { id: admin.id },
      );

      // Query and check labels
      const studentLabels = await orm.em.run<{ labels: string[] }>(
        'MATCH (p:person {id: $id}) RETURN labels(p) as labels',
        { id: student.id },
      );
      expect(studentLabels[0].labels).toContain('person');
      expect(studentLabels[0].labels).toContain('Student');

      const adminLabels = await orm.em.run<{ labels: string[] }>(
        'MATCH (p:person {id: $id}) RETURN labels(p) as labels',
        { id: admin.id },
      );
      expect(adminLabels[0].labels).toContain('person');
      expect(adminLabels[0].labels).toContain('Admin');

      // Query all users with their roles
      const usersWithRoles = await orm.em.run<{
        id: string;
        name: string;
        roles: string[];
      }>(
        `MATCH (u:person)
         RETURN u.id as id, u.name as name,
                [label IN labels(u) WHERE label <> 'person'] as roles`,
      );

      expect(usersWithRoles.length).toBe(2);
      const studentData = usersWithRoles.find(u => u.name === 'Alice');
      expect(studentData?.roles).toContain('Student');

      const adminData = usersWithRoles.find(u => u.name === 'Bob');
      expect(adminData?.roles).toContain('Admin');
    });

    // Scenario 3: Relationship with direction and properties
    test('relationship with direction and properties', async () => {
      const user = orm.em.create(Person, { name: 'Manuel', age: 30 });
      const lesson = orm.em.create(Product, { productName: 'Neo4j Basics' });
      await orm.em.persistAndFlush([user, lesson]);

      // Create relationship with properties using raw Cypher
      const completedAt = new Date('2025-12-18T02:30:00').toISOString();
      await orm.em.run(
        `MATCH (u:person {id: $userId}), (l:product {id: $lessonId})
         CREATE (u)-[r:COMPLETED {
           progress: $progress,
           completedAt: $completedAt
         }]->(l)
         RETURN r`,
        {
          userId: user.id,
          lessonId: lesson.id,
          progress: 100,
          completedAt,
        },
      );

      // Query relationship with properties
      const results = await orm.em.run<{
        userId: string;
        lessonId: string;
        progress: number;
        completedAt: string;
      }>(
        `MATCH (u:person)-[r:COMPLETED]->(l:product)
         WHERE u.id = $userId
         RETURN u.id as userId,
                l.id as lessonId,
                r.progress as progress,
                r.completedAt as completedAt`,
        { userId: user.id },
      );

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(user.id);
      expect(results[0].lessonId).toBe(lesson.id);
      expect(results[0].progress).toBe(100);
      expect(results[0].completedAt).toBe(completedAt);
    });

    // Bonus: Interface implementation with @Node
    test('interface implementation with polymorphic queries', async () => {
      // Create different production types
      const movie = orm.em.create(Product, {
        productName: 'The Matrix',
        price: 1999,
      });
      const series = orm.em.create(Product, {
        productName: 'Breaking Bad',
        price: 2008,
      });
      await orm.em.persistAndFlush([movie, series]);

      // Add type labels
      await orm.em.run(
        'MATCH (p:product {id: $id}) SET p:Movie',
        { id: movie.id },
      );
      await orm.em.run(
        'MATCH (p:product {id: $id}) SET p:Series',
        { id: series.id },
      );

      // Query all productions (polymorphic)
      const productions = await orm.em.run<{
        id: string;
        title: string;
        type: string;
      }>(
        `MATCH (p:product)
         WHERE 'Movie' IN labels(p) OR 'Series' IN labels(p)
         RETURN p.id as id,
                p.productName as title,
                CASE
                  WHEN 'Movie' IN labels(p) THEN 'Movie'
                  WHEN 'Series' IN labels(p) THEN 'Series'
                  ELSE 'Unknown'
                END as type`,
      );

      expect(productions.length).toBe(2);
      expect(productions.find(p => p.title === 'The Matrix')?.type).toBe('Movie');
      expect(productions.find(p => p.title === 'Breaking Bad')?.type).toBe('Series');
    });
  });

  describe('Relationship Properties (@RelationshipProperties)', () => {
    test('create actor and movie with relationship properties (roles)', async () => {
      const actor = orm.em.create(Actor, {
        name: 'Keanu Reeves',
        born: 1964,
      });
      const movie = orm.em.create(Movie, {
        title: 'The Matrix',
        released: 1999,
      });

      // Create relationship with properties using pivot entity
      const actedIn = orm.em.create(ActedIn, {
        actor,
        movie,
        roles: ['Neo', 'Thomas Anderson'],
      });

      await orm.em.persistAndFlush([actor, movie, actedIn]);
      orm.em.clear();

      // Query and verify relationship properties
      const loadedActor = await orm.em.findOneOrFail(
        Actor,
        { id: actor.id },
        { populate: ['movies'] },
      );

      expect(loadedActor.movies.length).toBe(1);
      expect(loadedActor.movies[0].title).toBe('The Matrix');

      // Verify via raw query that roles are stored
      const results = await orm.em.run<{
        actorName: string;
        movieTitle: string;
        roles: string[];
      }>(
        `MATCH (a:actor)-[r:ACTED_IN]->(m:movie)
         WHERE a.id = $actorId
         RETURN a.name as actorName,
                m.title as movieTitle,
                r.roles as roles`,
        { actorId: actor.id },
      );

      expect(results).toHaveLength(1);
      expect(results[0].actorName).toBe('Keanu Reeves');
      expect(results[0].movieTitle).toBe('The Matrix');
      expect(results[0].roles).toEqual(['Neo', 'Thomas Anderson']);
    });

    test('actor with multiple movies and different roles', async () => {
      const actor = orm.em.create(Actor, {
        name: 'Hugo Weaving',
        born: 1960,
      });
      const matrix = orm.em.create(Movie, {
        title: 'The Matrix',
        released: 1999,
      });
      const lordOfRings = orm.em.create(Movie, {
        title: 'The Lord of the Rings',
        released: 2001,
      });

      // Create relationships with different roles using pivot entities
      const actedInMatrix = orm.em.create(ActedIn, {
        actor,
        movie: matrix,
        roles: ['Agent Smith'],
      });

      const actedInLotr = orm.em.create(ActedIn, {
        actor,
        movie: lordOfRings,
        roles: ['Elrond'],
      });

      await orm.em.persistAndFlush([actor, matrix, lordOfRings, actedInMatrix, actedInLotr]);
      orm.em.clear();

      // Load actor with movies
      const loadedActor = await orm.em.findOneOrFail(
        Actor,
        { id: actor.id },
        { populate: ['movies'] },
      );

      expect(loadedActor.movies.length).toBe(2);
      const movieTitles = loadedActor.movies.getItems().map(m => m.title).sort();
      expect(movieTitles).toEqual(['The Lord of the Rings', 'The Matrix']);

      // Verify roles via raw query
      const results = await orm.em.run<{
        movieTitle: string;
        roles: string[];
      }>(
        `MATCH (a:actor {id: $actorId})-[r:ACTED_IN]->(m:movie)
         RETURN m.title as movieTitle, r.roles as roles
         ORDER BY m.released`,
        { actorId: actor.id },
      );

      expect(results).toHaveLength(2);
      expect(results[0].movieTitle).toBe('The Matrix');
      expect(results[0].roles).toEqual(['Agent Smith']);
      expect(results[1].movieTitle).toBe('The Lord of the Rings');
      expect(results[1].roles).toEqual(['Elrond']);
    });

    test('series with actors and relationship properties', async () => {
      const actor = orm.em.create(Actor, {
        name: 'Bryan Cranston',
        born: 1956,
      });
      const series = orm.em.create(Series, {
        title: 'Breaking Bad',
        released: 2008,
        episodes: 62,
      });

      // Create relationship using pivot entity
      const actedInSeries = orm.em.create(ActedInSeries, {
        actor,
        series,
        roles: ['Walter White', 'Heisenberg'],
      });

      await orm.em.persistAndFlush([actor, series, actedInSeries]);
      orm.em.clear();

      // Load series with actors
      const loadedSeries = await orm.em.findOneOrFail(
        Series,
        { id: series.id },
        { populate: ['actors'] },
      );

      expect(loadedSeries.actors.length).toBe(1);
      expect(loadedSeries.actors[0].name).toBe('Bryan Cranston');

      // Verify via raw query
      const results = await orm.em.run<{
        seriesTitle: string;
        episodes: number;
        actorName: string;
        roles: string[];
      }>(
        `MATCH (a:actor)-[r:ACTED_IN]->(s:series)
         WHERE s.id = $seriesId
         RETURN s.title as seriesTitle,
                s.episodes as episodes,
                a.name as actorName,
                r.roles as roles`,
        { seriesId: series.id },
      );

      expect(results).toHaveLength(1);
      expect(results[0].seriesTitle).toBe('Breaking Bad');
      expect(results[0].episodes).toBe(62);
      expect(results[0].actorName).toBe('Bryan Cranston');
      expect(results[0].roles).toEqual(['Walter White', 'Heisenberg']);
    });

    test('polymorphic production query (movies and series)', async () => {
      const actor = orm.em.create(Actor, {
        name: 'Tom Hanks',
        born: 1956,
      });
      const movie = orm.em.create(Movie, {
        title: 'Forrest Gump',
        released: 1994,
      });
      const series = orm.em.create(Series, {
        title: 'Band of Brothers',
        released: 2001,
        episodes: 10,
      });

      // Create relationships using pivot entities
      const actedInMovie = orm.em.create(ActedIn, {
        actor,
        movie,
        roles: ['Forrest Gump'],
      });

      const actedInSeries = orm.em.create(ActedInSeries, {
        actor,
        series,
        roles: ['Narrator'],
      });

      await orm.em.persistAndFlush([actor, movie, series, actedInMovie, actedInSeries]);
      orm.em.clear();

      // Load actor with both movies and series
      const loadedActor = await orm.em.findOneOrFail(
        Actor,
        { id: actor.id },
        { populate: ['movies', 'series'] },
      );

      expect(loadedActor.movies.length).toBe(1);
      expect(loadedActor.movies[0].title).toBe('Forrest Gump');
      expect(loadedActor.series.length).toBe(1);
      expect(loadedActor.series[0].title).toBe('Band of Brothers');

      // Query all productions (polymorphic - both movies and series)
      const results = await orm.em.run<{
        title: string;
        type: string;
        roles: string[];
      }>(
        `MATCH (a:actor {id: $actorId})-[r:ACTED_IN]->(production)
         WHERE 'movie' IN labels(production) OR 'series' IN labels(production)
         RETURN production.title as title,
                CASE
                  WHEN 'movie' IN labels(production) THEN 'Movie'
                  WHEN 'series' IN labels(production) THEN 'Series'
                  ELSE 'Unknown'
                END as type,
                r.roles as roles
         ORDER BY production.released`,
        { actorId: actor.id },
      );

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Forrest Gump');
      expect(results[0].type).toBe('Movie');
      expect(results[0].roles).toEqual(['Forrest Gump']);
      expect(results[1].title).toBe('Band of Brothers');
      expect(results[1].type).toBe('Series');
      expect(results[1].roles).toEqual(['Narrator']);
    });

    test('query all actors for a movie with their roles', async () => {
      const movie = orm.em.create(Movie, {
        title: 'The Matrix Reloaded',
        released: 2003,
      });
      const keanu = orm.em.create(Actor, { name: 'Keanu Reeves', born: 1964 });
      const laurence = orm.em.create(Actor, { name: 'Laurence Fishburne', born: 1961 });
      const carrieAnne = orm.em.create(Actor, { name: 'Carrie-Anne Moss', born: 1967 });

      // Create all relationships using pivot entities
      const keanuActedIn = orm.em.create(ActedIn, {
        actor: keanu,
        movie,
        roles: ['Neo'],
      });

      const laurenceActedIn = orm.em.create(ActedIn, {
        actor: laurence,
        movie,
        roles: ['Morpheus'],
      });

      const carrieActedIn = orm.em.create(ActedIn, {
        actor: carrieAnne,
        movie,
        roles: ['Trinity'],
      });

      await orm.em.persistAndFlush([
        movie,
        keanu,
        laurence,
        carrieAnne,
        keanuActedIn,
        laurenceActedIn,
        carrieActedIn,
      ]);
      orm.em.clear();

      // Load movie with actors
      const loadedMovie = await orm.em.findOneOrFail(
        Movie,
        { id: movie.id },
        { populate: ['actors'] },
      );

      expect(loadedMovie.actors.length).toBe(3);
      const actorNames = loadedMovie.actors.getItems().map(a => a.name).sort();
      expect(actorNames).toEqual(['Carrie-Anne Moss', 'Keanu Reeves', 'Laurence Fishburne']);

      // Query all actors for the movie with roles
      const results = await orm.em.run<{
        actorName: string;
        born: number;
        roles: string[];
      }>(
        `MATCH (a:actor)-[r:ACTED_IN]->(m:movie {id: $movieId})
         RETURN a.name as actorName, a.born as born, r.roles as roles
         ORDER BY a.name`,
        { movieId: movie.id },
      );

      expect(results).toHaveLength(3);
      expect(results[0].actorName).toBe('Carrie-Anne Moss');
      expect(results[0].roles).toEqual(['Trinity']);
      expect(results[1].actorName).toBe('Keanu Reeves');
      expect(results[1].roles).toEqual(['Neo']);
      expect(results[2].actorName).toBe('Laurence Fishburne');
      expect(results[2].roles).toEqual(['Morpheus']);
    });
  });
});
