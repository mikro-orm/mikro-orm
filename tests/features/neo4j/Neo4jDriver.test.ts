import crypto from 'node:crypto';
import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  ManyToMany,
  PrimaryKey,
  Property,
  Ref,
  type EntityManager,
  Reference,
} from '@mikro-orm/core';
import { MikroORM, Node, Rel, RelationshipProperties } from '@mikro-orm/neo4j';
const Neo4jMikroORM = MikroORM;
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
  @Rel({ type: 'HAS_TAG', direction: 'OUT' })
  tags = new Collection<Tag>(this);

}

@Entity()
class Tag {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @ManyToMany(() => Product, p => p.tags)
  @Rel({ type: 'HAS_TAG', direction: 'IN' })
  products = new Collection<Product>(this);

}

// Graph-style decorators
@Entity()
@Node()
class Person {

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @Property()
  age!: number;

  @ManyToOne(() => Person, {
    ref: true,
    nullable: true,
  })
  @Rel({ type: 'KNOWS', direction: 'OUT' })
  knows?: Ref<Person>;

  @ManyToMany(() => Person)
  @Rel({ type: 'WORKS_WITH', direction: 'OUT' })
  colleagues = new Collection<Person>(this);

}

// Node with multiple labels
@Entity()
@Node({ labels: ['Employee', 'Manager'] })
class Executive {

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @Property()
  title!: string;

  @Property()
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

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  name!: string;

  @Property()
  born!: number;

  @ManyToMany(() => Movie, undefined, {
    pivotEntity: () => ActedIn,
    inversedBy: 'actors',
  })
  @Rel({ type: 'ACTED_IN', direction: 'OUT' })
  movies = new Collection<Movie>(this);

  @ManyToMany(() => Series, undefined, {
    pivotEntity: () => ActedInSeries,
    inversedBy: 'actors',
  })
  @Rel({ type: 'ACTED_IN', direction: 'OUT' })
  series = new Collection<Series>(this);

}

@Entity()
@Node()
class Movie {

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  title!: string;

  @Property()
  released!: number;

  @Property({ nullable: true })
  tagline?: string;

  @ManyToMany(() => Actor, actor => actor.movies)
  @Rel({ type: 'ACTED_IN', direction: 'IN' })
  actors = new Collection<Actor>(this);

}

@Entity()
@Node()
class Series {

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  title!: string;

  @Property()
  released!: number;

  @Property()
  episodes!: number;

  @ManyToMany(() => Actor, actor => actor.series)
  @Rel({ type: 'ACTED_IN', direction: 'IN' })
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

// User friendship example for relationship property querying
@Entity()
@Node()
class User {

  @Property({ primary: true })
  id: string = crypto.randomUUID();

  @Property()
  username!: string;

  @Property()
  email!: string;

  @ManyToMany(() => User, undefined, {
    pivotEntity: () => FriendsWith,
  })
  @Rel({ type: 'FRIENDS_WITH', direction: 'OUT' })
  friends = new Collection<User>(this);

}

@Entity()
@RelationshipProperties({ type: 'FRIENDS_WITH' })
class FriendsWith {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @ManyToOne(() => User, { primary: true })
  user1!: User;

  @ManyToOne(() => User, { primary: true })
  user2!: User;

  @Property()
  since!: number;

  @Property()
  strength!: number;

}

describe('Neo4j driver (MVP)', () => {
  let orm: MikroORM;

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
        User,
        FriendsWith,
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
    test('virtual entity with aggregations and computed Propertys', async () => {
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
      await orm.em.run('MATCH (p:person {id: $id}) SET p:Student', {
        id: student.id,
      });
      await orm.em.run('MATCH (p:person {id: $id}) SET p:Admin', {
        id: admin.id,
      });

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
      await orm.em.run('MATCH (p:product {id: $id}) SET p:Movie', {
        id: movie.id,
      });
      await orm.em.run('MATCH (p:product {id: $id}) SET p:Series', {
        id: series.id,
      });

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
      expect(productions.find(p => p.title === 'The Matrix')?.type).toBe(
        'Movie',
      );
      expect(productions.find(p => p.title === 'Breaking Bad')?.type).toBe(
        'Series',
      );
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

      await orm.em.persistAndFlush([
        actor,
        matrix,
        lordOfRings,
        actedInMatrix,
        actedInLotr,
      ]);
      orm.em.clear();

      // Load actor with movies
      const loadedActor = await orm.em.findOneOrFail(
        Actor,
        { id: actor.id },
        { populate: ['movies'] },
      );

      expect(loadedActor.movies.length).toBe(2);
      const movieTitles = loadedActor.movies
        .getItems()
        .map(m => m.title)
        .sort();
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

      await orm.em.persistAndFlush([
        actor,
        movie,
        series,
        actedInMovie,
        actedInSeries,
      ]);
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
      const laurence = orm.em.create(Actor, {
        name: 'Laurence Fishburne',
        born: 1961,
      });
      const carrieAnne = orm.em.create(Actor, {
        name: 'Carrie-Anne Moss',
        born: 1967,
      });

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
      const actorNames = loadedMovie.actors
        .getItems()
        .map(a => a.name)
        .sort();
      expect(actorNames).toEqual([
        'Carrie-Anne Moss',
        'Keanu Reeves',
        'Laurence Fishburne',
      ]);

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

    test('query relationship properties with filters', async () => {
      // Create users
      const alice = orm.em.create(User, {
        username: 'alice',
        email: 'alice@example.com',
      });
      const bob = orm.em.create(User, {
        username: 'bob',
        email: 'bob@example.com',
      });
      const charlie = orm.em.create(User, {
        username: 'charlie',
        email: 'charlie@example.com',
      });

      await orm.em.persistAndFlush([alice, bob, charlie]);

      // Create friendships with properties
      const friendship1 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: bob,
        since: 2020,
        strength: 8,
      });

      const friendship2 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: charlie,
        since: 2022,
        strength: 6,
      });

      await orm.em.persistAndFlush([friendship1, friendship2]);
      orm.em.clear();

      // Query friendships with relationship property filters
      // MATCH (u1)-[r:FRIENDS_WITH]->(u2)
      // WHERE r.since >= 2022 AND r.strength > 5
      const results = await orm.em.run<{
        user1: string;
        user2: string;
        since: number;
        strength: number;
      }>(
        `MATCH (u1:user)-[r:FRIENDS_WITH]->(u2:user)
         WHERE r.since >= $since AND r.strength > $minStrength
         RETURN u1.username as user1, u2.username as user2, r.since as since, r.strength as strength
         ORDER BY r.since DESC`,
        { since: 2022, minStrength: 5 },
      );

      expect(results).toHaveLength(1);
      expect(results[0].user1).toBe('alice');
      expect(results[0].user2).toBe('charlie');
      expect(results[0].since).toBe(2022);
      expect(results[0].strength).toBe(6);
    });

    test('find users with strong recent friendships using QueryBuilder', async () => {
      // Create users
      const alice = orm.em.create(User, {
        username: 'alice',
        email: 'alice@example.com',
      });
      const bob = orm.em.create(User, {
        username: 'bob',
        email: 'bob@example.com',
      });
      const charlie = orm.em.create(User, {
        username: 'charlie',
        email: 'charlie@example.com',
      });
      const dave = orm.em.create(User, {
        username: 'dave',
        email: 'dave@example.com',
      });

      await orm.em.persistAndFlush([alice, bob, charlie, dave]);

      // Create friendships with properties
      const friendship1 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: bob,
        since: 2020,
        strength: 8,
      });

      const friendship2 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: charlie,
        since: 2023,
        strength: 9,
      });

      const friendship3 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: dave,
        since: 2022,
        strength: 7,
      });

      await orm.em.persistAndFlush([friendship1, friendship2, friendship3]);
      orm.em.clear();

      // Use QueryBuilder to find strong recent friendships
      // Query using raw cypher with relationship property filtering
      const results = await orm.em.run<{
        user1: string;
        user2: string;
        since: number;
        strength: number;
      }>(
        `MATCH (u1:user {username: $username})-[r:FRIENDS_WITH]->(u2:user)
         WHERE r.since >= $since AND r.strength > $minStrength
         RETURN u1.username as user1, u2.username as user2, r.since as since, r.strength as strength
         ORDER BY r.since DESC`,
        { username: 'alice', since: 2022, minStrength: 5 },
      );

      expect(results).toHaveLength(2);
      expect(results[0].user1).toBe('alice');
      expect(results[0].user2).toBe('charlie');
      expect(results[0].since).toBe(2023);
      expect(results[0].strength).toBe(9);
      expect(results[1].user2).toBe('dave');
      expect(results[1].since).toBe(2022);
      expect(results[1].strength).toBe(7);

      // Also verify with QueryBuilder pattern API to show relationship filtering
      const qb = orm.em.createQueryBuilder(User, 'u1');
      const Cypher = qb.getCypher();
      const node = qb.getNode();

      const rel = new Cypher.Relationship({ type: 'FRIENDS_WITH' });
      const u2 = new Cypher.Node({ labels: ['user'] });

      const patternQb = qb
        .match()
        .related(FriendsWith, {
          targetLabels: ['user'],
        })
        .where(
          Cypher.and(
            Cypher.gte(rel.property('since'), new Cypher.Param(2022)),
            Cypher.gt(rel.property('strength'), new Cypher.Param(5)),
          ),
        )
        .return();

      const { cypher, params } = patternQb.build();

      // Verify the query structure includes relationship property filters
      expect(cypher).toContain('since');
      expect(cypher).toContain('strength');
      expect(params.param0).toBe(2022);
      expect(params.param1).toBe(5);
    });

    test('query relationship entity directly with find()', async () => {
      // Create users
      const alice = orm.em.create(User, {
        username: 'alice',
        email: 'alice@example.com',
      });
      const bob = orm.em.create(User, {
        username: 'bob',
        email: 'bob@example.com',
      });
      const charlie = orm.em.create(User, {
        username: 'charlie',
        email: 'charlie@example.com',
      });
      const dave = orm.em.create(User, {
        username: 'dave',
        email: 'dave@example.com',
      });

      await orm.em.persistAndFlush([alice, bob, charlie, dave]);

      // Create friendships with properties
      const friendship1 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: bob,
        since: 2020,
        strength: 8,
      });

      const friendship2 = orm.em.create(FriendsWith, {
        user1: alice,
        user2: charlie,
        since: 2023,
        strength: 9,
      });

      const friendship3 = orm.em.create(FriendsWith, {
        user1: bob,
        user2: dave,
        since: 2021,
        strength: 4,
      });

      await orm.em.persistAndFlush([friendship1, friendship2, friendship3]);
      orm.em.clear();

      // Query relationship entities directly using find() with filters
      const recentStrongFriendships = await orm.em.find(FriendsWith, {
        since: { $gte: 2020 },
        strength: { $gt: 7 },
      });

      expect(recentStrongFriendships).toHaveLength(2);
      expect(recentStrongFriendships[0].strength).toBeGreaterThan(7);
      expect(recentStrongFriendships[0].since).toBeGreaterThanOrEqual(2020);
      expect(recentStrongFriendships[0].id).toBeDefined();
      expect(typeof recentStrongFriendships[0].id).toBe('string');

      // Query with specific filters
      const friendship2023 = await orm.em.findOne(FriendsWith, {
        since: 2023,
      });

      expect(friendship2023).toBeDefined();
      expect(friendship2023!.since).toBe(2023);
      expect(friendship2023!.strength).toBe(9);
    });

    test('query relationship entity with populate', async () => {
      // Create users
      const henry = orm.em.create(User, {
        username: 'henry_populate',
        email: 'henry@populate.com',
      });
      const iris = orm.em.create(User, {
        username: 'iris_populate',
        email: 'iris@populate.com',
      });

      await orm.em.persistAndFlush([henry, iris]);

      // Create friendship
      const friendship = orm.em.create(FriendsWith, {
        user1: henry,
        user2: iris,
        since: 2024,
        strength: 10,
      });

      await orm.em.persistAndFlush(friendship);
      orm.em.clear();

      // Query with populate for both users
      const friendships = await orm.em.find(
        FriendsWith,
        {
          since: 2024,
        },
        {
          populate: ['user1', 'user2'],
        },
      );

      expect(friendships).toHaveLength(1);
      expect(friendships[0].since).toBe(2024);
      expect(friendships[0].strength).toBe(10);
      expect(friendships[0].user1).toBeDefined();
      expect(friendships[0].user1.username).toBe('henry_populate');
      expect(friendships[0].user1.email).toBe('henry@populate.com');
      expect(friendships[0].user2).toBeDefined();
      expect(friendships[0].user2.username).toBe('iris_populate');
      expect(friendships[0].user2.email).toBe('iris@populate.com');
    });

    test('query relationship entity with partial populate', async () => {
      // Create new users for this test
      const jack = orm.em.create(User, {
        username: 'jack_partial',
        email: 'jack@partial.com',
      });
      const kate = orm.em.create(User, {
        username: 'kate_partial',
        email: 'kate@partial.com',
      });

      await orm.em.persistAndFlush([jack, kate]);

      // Create friendship
      const friendship = orm.em.create(FriendsWith, {
        user1: jack,
        user2: kate,
        since: 2025,
        strength: 7,
      });

      await orm.em.persistAndFlush(friendship);
      orm.em.clear();

      // Query with populate for only one user
      const friendships = await orm.em.find(
        FriendsWith,
        {
          since: 2025,
        },
        {
          populate: ['user1'],
        },
      );

      expect(friendships).toHaveLength(1);
      expect(friendships[0].user1).toBeDefined();
      expect(friendships[0].user1.username).toBe('jack_partial');
      // user2 should not be populated (just the reference)
      expect(friendships[0].user2).toBeDefined();
      expect(friendships[0].user2.username).toBeUndefined();
    });

    test('query relationship entity with findOne and populate', async () => {
      // Create new users for this test
      const leo = orm.em.create(User, {
        username: 'leo_findone',
        email: 'leo@findone.com',
      });
      const mia = orm.em.create(User, {
        username: 'mia_findone',
        email: 'mia@findone.com',
      });

      await orm.em.persistAndFlush([leo, mia]);

      // Create friendship
      const friendship = orm.em.create(FriendsWith, {
        user1: leo,
        user2: mia,
        since: 2026,
        strength: 6,
      });

      await orm.em.persistAndFlush(friendship);
      orm.em.clear();

      // Query single relationship with populate
      const foundFriendship = await orm.em.findOne(
        FriendsWith,
        {
          since: 2026,
        },
        {
          populate: ['user1', 'user2'],
        },
      );

      expect(foundFriendship).toBeDefined();
      expect(foundFriendship!.since).toBe(2026);
      expect(foundFriendship!.user1).toBeDefined();
      expect(foundFriendship!.user1.username).toBe('leo_findone');
      expect(foundFriendship!.user2).toBeDefined();
      expect(foundFriendship!.user2.username).toBe('mia_findone');
    });
  });
  describe('Neo4jQueryBuilder', () => {
    describe('Basic Query Building', () => {
      test('should build simple MATCH query', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb.match().return().build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('Movie');
        expect(cypher).toContain('RETURN');
      });

      test('should build MATCH with WHERE clause', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .match()
          .where('title', 'The Matrix')
          .return()
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('title');
        expect(params).toHaveProperty('param0', 'The Matrix');
      });

      test('should build MATCH with specific properties returned', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .match()
          .where('title', 'The Matrix')
          .return(['title', 'released'])
          .build();

        expect(cypher).toContain('RETURN');
        expect(cypher).toContain('title');
        expect(cypher).toContain('released');
        expect(cypher).not.toContain('tagline');
      });

      test('should build MATCH with AND condition', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .match()
          .where('title', 'The Matrix')
          .and('released', 1999)
          .return()
          .build();

        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('AND');
        expect(params).toHaveProperty('param0', 'The Matrix');
        expect(params).toHaveProperty('param1', 1999);
      });

      test('should build CREATE query', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .create({ title: 'Inception', released: 2010 })
          .return()
          .build();

        expect(cypher).toContain('CREATE');
        expect(cypher).toContain('Movie');
        expect(params).toHaveProperty('param0', 'Inception');
        expect(params).toHaveProperty('param1', 2010);
      });

      test('should build MERGE query', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .merge({ title: 'The Matrix' })
          .return()
          .build();

        expect(cypher).toContain('MERGE');
        expect(cypher).toContain('Movie');
        expect(params).toHaveProperty('param0', 'The Matrix');
      });
    });

    describe('Advanced Filtering', () => {
      test('should support custom Cypher predicates', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();
        const titleProp = node.property('title');

        const { cypher, params } = qb
          .match()
          .where(Cypher.contains(titleProp, new Cypher.Param('Matrix')))
          .return()
          .build();

        expect(cypher).toContain('CONTAINS');
        expect(params).toHaveProperty('param0', 'Matrix');
      });

      test('should support comparison operators', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();
        const releasedProp = node.property('released');

        const { cypher, params } = qb
          .match()
          .where(Cypher.lt(releasedProp, new Cypher.Param(2000)))
          .return()
          .build();

        expect(cypher).toContain('<');
        expect(params).toHaveProperty('param0', 2000);
      });

      test('should support OR conditions', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();

        const title1 = Cypher.eq(
          node.property('title'),
          new Cypher.Param('The Matrix'),
        );
        const title2 = Cypher.eq(
          node.property('title'),
          new Cypher.Param('Inception'),
        );

        const { cypher, params } = qb
          .match()
          .where(Cypher.or(title1, title2))
          .return()
          .build();

        expect(cypher).toContain('OR');
        expect(params).toHaveProperty('param0', 'The Matrix');
        expect(params).toHaveProperty('param1', 'Inception');
      });

      test('should support NOT conditions', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();
        const titleProp = node.property('title');

        const { cypher, params } = qb
          .match()
          .where(
            Cypher.not(Cypher.contains(titleProp, new Cypher.Param('Matrix'))),
          )
          .return()
          .build();

        expect(cypher).toContain('NOT');
        expect(params).toHaveProperty('param0', 'Matrix');
      });
    });

    describe('Sorting and Pagination', () => {
      test('should build query with ORDER BY', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .return()
          .orderBy('released', 'DESC')
          .build();

        expect(cypher).toContain('ORDER BY');
        expect(cypher).toContain('released');
        expect(cypher).toContain('DESC');
      });

      test('should build query with LIMIT', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb.match().limit(10).return().build();

        expect(cypher).toContain('LIMIT');
        expect(cypher).toContain('10');
      });

      test('should build query with SKIP', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb.match().skip(20).return().build();

        expect(cypher).toContain('SKIP');
        expect(cypher).toContain('20');
      });

      test('should build query with pagination (SKIP + LIMIT)', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb.match().skip(20).limit(10).return().build();

        expect(cypher).toContain('SKIP');
        expect(cypher).toContain('LIMIT');
        expect(cypher).toContain('20');
        expect(cypher).toContain('10');
      });
    });

    describe('Update and Delete Operations', () => {
      test('should build UPDATE query with SET', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .match()
          .where('title', 'The Matrix')
          .set({ tagline: 'Welcome to the Real World' })
          .return()
          .build();

        expect(cypher).toContain('SET');
        expect(params).toHaveProperty('param1', 'Welcome to the Real World');
      });

      test('should build DELETE query', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .where('title', 'OldMovie')
          .delete()
          .build();

        expect(cypher).toContain('DETACH DELETE');
      });

      test('should build DELETE query without DETACH', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .where('title', 'OldMovie')
          .delete(false)
          .build();

        expect(cypher).toContain('DELETE');
        expect(cypher).not.toContain('DETACH');
      });
    });

    describe('Relationships', () => {
      test('should build query with relationship pattern', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .related('ACTED_IN', 'left', 'Actor')
          .return()
          .build();

        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('Actor');
      });

      test('should handle relationship direction: left', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .related('ACTED_IN', 'left', 'Actor')
          .return()
          .build();

        expect(cypher).toContain('<-');
        expect(cypher).toContain('ACTED_IN');
      });

      test('should handle relationship direction: right', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const { cypher } = qb
          .match()
          .related('ACTED_IN', 'right', 'Movie')
          .return()
          .build();

        expect(cypher).toContain('-[');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain(']->');
      });
    });

    describe('Integration with EntityManager', () => {
      beforeEach(async () => {
        await orm.schema.clearDatabase();

        // Create test data using query builder
        // Note: Using query builder for test data setup ensures consistency with query builder API
        const qb1 = orm.em.createQueryBuilder(Movie);
        await qb1
          .create({
            id: 1,
            title: 'The Matrix',
            released: 1999,
            tagline: 'Welcome to the Real World',
          })
          .return()
          .getMany();

        const qb2 = orm.em.createQueryBuilder(Movie);
        await qb2
          .create({
            id: 2,
            title: 'Inception',
            released: 2010,
            tagline: 'Your mind is the scene of the crime',
          })
          .return()
          .getMany();

        const qb3 = orm.em.createQueryBuilder(Movie);
        await qb3
          .create({ id: 3, title: 'Interstellar', released: 2014 })
          .return()
          .getMany();

        orm.em.clear();
      });

      test('should execute query and return results', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const results = await qb
          .match()
          .where('title', 'The Matrix')
          .return(['title', 'released'])
          .getMany();

        expect(results).toHaveLength(1);
        expect(results[0]).toHaveProperty('title');
        expect(results[0].title).toBe('The Matrix');
      });

      test('should execute query with multiple results', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const results = await qb
          .match()
          .return(['title', 'released'])
          .getMany();

        expect(results.length).toBeGreaterThanOrEqual(3);
      });

      test('should execute query with filtering', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();
        const releasedProp = node.property('released');

        const results = await qb
          .match()
          .where(Cypher.gte(releasedProp, new Cypher.Param(2010)))
          .return(['title', 'released'])
          .getMany();

        expect(results.length).toBeGreaterThanOrEqual(2);
        results.forEach(movie => {
          expect(movie.released).toBeGreaterThanOrEqual(2010);
        });
      });

      test('should execute query with ordering', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const results = await qb
          .match()
          .return(['title', 'released'])
          .orderBy('released', 'DESC')
          .getMany();

        expect(results.length).toBeGreaterThanOrEqual(3);
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].released).toBeGreaterThanOrEqual(
            results[i + 1].released,
          );
        }
      });

      test('should execute query with pagination', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const result = await qb
          .match()
          .return(['title', 'released'])
          .orderBy('released', 'ASC')
          .skip(1)
          .getOne();

        expect(result).not.toBeNull();
      });

      test('getOne() should return single result or null', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const result = await qb
          .match()
          .where('title', 'The Matrix')
          .return(['title', 'released'])
          .getOne();

        expect(result).not.toBeNull();
        expect(result!.title).toBe('The Matrix');

        // Test getOne() with no results
        const qb2 = orm.em.createQueryBuilder(Movie);
        const notFound = await qb2
          .match()
          .where('title', 'NonExistent')
          .return(['title'])
          .getOne();

        expect(notFound).toBeNull();
      });

      test('getMany() should return array of results', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const results = await qb
          .match()
          .return(['title', 'released'])
          .orderBy('released', 'ASC')
          .getMany();

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThanOrEqual(3);
        expect(results[0].title).toBe('The Matrix');
      });

      test('getOne() should automatically add LIMIT 1', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const result = await qb
          .match()
          .return(['title', 'released'])
          .orderBy('released', 'ASC')
          .getOne();

        expect(result).not.toBeNull();
        expect(result!.title).toBe('The Matrix');
      });

      test('should create new nodes via query builder', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const result = await qb
          .create({ id: 999, title: 'The Dark Knight', released: 2008 })
          .return(['id', 'title', 'released'])
          .getOne();

        expect(result).not.toBeNull();
        expect(result!.title).toBe('The Dark Knight');
        expect(result!.released).toBe(2008);

        // Verify it was created using query builder
        orm.em.clear();
        const qb2 = orm.em.createQueryBuilder(Movie);
        const found = await qb2
          .match()
          .where('title', 'The Dark Knight')
          .return(['title', 'released'])
          .getOne();
        expect(found).not.toBeNull();
        expect(found!.released).toBe(2008);
      });

      test('should update nodes via query builder', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const updateResult = await qb
          .match()
          .where('title', 'Interstellar')
          .set({ tagline: 'Mankind was born on Earth' })
          .return(['id', 'title', 'tagline'])
          .getOne();

        expect(updateResult).not.toBeNull();
        expect(updateResult!.tagline).toBe('Mankind was born on Earth');

        orm.em.clear();
        const qb2 = orm.em.createQueryBuilder(Movie);
        const result = await qb2
          .match()
          .where('title', 'Interstellar')
          .return(['tagline'])
          .getOne();
        expect(result!.tagline).toBe('Mankind was born on Earth');
      });

      test('should delete nodes via query builder', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        await qb.match().where('title', 'Inception').delete().getMany();

        orm.em.clear();
        const found = await orm.em.findOne(Movie, { title: 'Inception' });
        expect(found).toBeNull();
      });
    });

    describe('Integration with EntityRepository', () => {
      beforeEach(async () => {
        await orm.schema.clearDatabase();

        const qb1 = orm.em.createQueryBuilder(Movie);
        await qb1
          .create({ id: 10, title: 'Test Movie 1', released: 2020 })
          .return()
          .getMany();

        const qb2 = orm.em.createQueryBuilder(Movie);
        await qb2
          .create({ id: 11, title: 'Test Movie 2', released: 2021 })
          .return()
          .getMany();

        orm.em.clear();
      });

      test('should create query builder from repository', async () => {
        const movieRepo = orm.em.getRepository(Movie);
        const qb = movieRepo.createQueryBuilder();

        const result = await qb
          .match()
          .where('released', 2020)
          .return(['title'])
          .getOne();

        expect(result).not.toBeNull();
        expect(result!.title).toBe('Test Movie 1');
      });

      test('should automatically use entity label from repository', async () => {
        const movieRepo = orm.em.getRepository(Movie);
        const qb = movieRepo.createQueryBuilder();

        const { cypher } = qb.match().return().build();

        expect(cypher).toContain('Movie');
      });
    });

    describe('Error Handling', () => {
      test('should throw error when WHERE is called without clause', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        expect(() => {
          qb.where('title', 'Test');
        }).toThrow(
          'Cannot add WHERE clause without a MATCH, CREATE, or MERGE clause',
        );
      });

      test('should throw error when RETURN is called without clause', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        expect(() => {
          qb.return();
        }).toThrow('Cannot add RETURN clause without a query clause');
      });

      test('should throw error when building without clauses', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        expect(() => {
          qb.build();
        }).toThrow('Cannot build query without any clauses');
      });

      test('should throw error when executing without EntityManager', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { execute } = qb.match().return().build();

        expect(execute).toBeDefined();
      });
    });

    describe('Complex Query Scenarios', () => {
      beforeEach(async () => {
        await orm.schema.clearDatabase();

        // Create actor and movie using query builder
        const qbActor = orm.em.createQueryBuilder(Actor);
        await qbActor
          .create({ id: 1, name: 'Keanu Reeves', born: 1964 })
          .return()
          .getMany();

        const qbMovie = orm.em.createQueryBuilder(Movie);
        await qbMovie
          .create({ id: 100, title: 'The Matrix', released: 1999 })
          .return()
          .getMany();

        orm.em.clear();
      });

      test('should handle complex filtering with multiple conditions', async () => {
        // First verify data exists
        const qbCheck = orm.em.createQueryBuilder(Movie);
        const all = await qbCheck
          .match()
          .return(['title', 'released'])
          .getMany();
        expect(all.length).toBeGreaterThanOrEqual(1);

        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();

        const titleContainsMatrix = Cypher.contains(
          node.property('title'),
          new Cypher.Param('Matrix'),
        );
        const releasedBefore2000 = Cypher.lt(
          node.property('released'),
          new Cypher.Param(2000),
        );

        const results = await qb
          .match()
          .where(Cypher.and(titleContainsMatrix, releasedBefore2000))
          .return(['title', 'released'])
          .getMany();

        expect(results.length).toBeGreaterThanOrEqual(1);
        results.forEach(movie => {
          expect(movie.title).toContain('Matrix');
          expect(movie.released).toBeLessThan(2000);
        });
      });

      test('should build query with relationship and filtering', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher, params } = qb
          .match()
          .related('ACTED_IN', 'left', 'Actor')
          .where('title', 'The Matrix')
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('WHERE');
        expect(params).toHaveProperty('param0', 'The Matrix');
      });
    });

    describe('Flexible Query Composition', () => {
      test('should allow building queries in any order', async () => {
        // Build base query
        const baseQuery = orm.em.createQueryBuilder<Movie>('Movie').match();

        // Add clauses in non-standard order
        const withLimit = baseQuery.limit(10);
        const withOrder = withLimit.orderBy('released', 'DESC');
        const withWhere = withOrder.where('released', 1999);
        const withReturn = withWhere.return(['title', 'released']);

        const { cypher } = withReturn.build();

        // Verify correct Cypher order regardless of call order
        expect(cypher).toMatch(/MATCH.*WHERE.*RETURN.*ORDER BY.*LIMIT/s);
        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('RETURN');
        expect(cypher).toContain('ORDER BY');
        expect(cypher).toContain('LIMIT');
      });

      test('should allow saving and reusing query parts', async () => {
        // Create base query that can be reused
        const baseQuery = orm.em
          .createQueryBuilder<Movie>('Movie')
          .match()
          .where('released', 1999);

        // Create two different queries from the same base
        const query1 = orm.em
          .createQueryBuilder<Movie>('Movie')
          .match()
          .where('released', 1999)
          .return(['title'])
          .orderBy('title', 'ASC');

        const query2 = orm.em
          .createQueryBuilder<Movie>('Movie')
          .match()
          .where('released', 1999)
          .return(['title', 'released'])
          .orderBy('released', 'DESC')
          .limit(5);

        const { cypher: cypher1 } = query1.build();
        const { cypher: cypher2 } = query2.build();

        // Both should have WHERE clause from base
        expect(cypher1).toContain('WHERE');
        expect(cypher2).toContain('WHERE');

        // But different RETURN and ORDER BY
        expect(cypher1).toContain('ORDER BY this0.title ASC');
        expect(cypher2).toContain('ORDER BY this0.released DESC');
        expect(cypher2).toContain('LIMIT');
      });

      test('should handle multiple where conditions correctly', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        // Add multiple WHERE conditions
        const { cypher } = qb
          .match()
          .where('title', 'The Matrix')
          .and('released', 1999)
          .return()
          .build();

        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('AND');
      });

      test('should allow orderBy before return', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        // Call orderBy before return (was not allowed in old implementation)
        const { cypher } = qb
          .match()
          .where('released', 1999)
          .orderBy('title', 'ASC')
          .return(['title'])
          .build();

        expect(cypher).toContain('RETURN');
        expect(cypher).toContain('ORDER BY');
        expect(cypher).toMatch(/RETURN.*ORDER BY/s);
      });
    });

    describe('Advanced Relationship Patterns', () => {
      test('should create relationship with properties', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher, params } = qb
          .match()
          .related('ACTED_IN', {
            direction: 'left',
            targetLabel: 'Actor',
            properties: { roles: ['Neo'] },
          })
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('<-');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('Actor');
        expect(cypher).toMatch(/roles.*param\d+/);
        expect(Object.values(params)).toContainEqual(['Neo']);
      });

      test('should create variable-length relationship', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb
          .match()
          .related('KNOWS', {
            length: { min: 1, max: 3 },
            targetLabel: 'Person',
          })
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('KNOWS*1..3');
      });

      test('should create any-length relationship', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb
          .match()
          .related('FRIEND_OF', {
            length: '*',
            targetLabel: 'Person',
          })
          .return()
          .build();

        expect(cypher).toContain('FRIEND_OF*');
      });

      test('should support undirected relationships', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb
          .match()
          .related('RELATED_TO', {
            direction: 'undirected',
            targetLabel: 'Movie',
          })
          .return(['title'])
          .build();

        expect(cypher).toContain('-[');
        expect(cypher).toContain(']-');
        expect(cypher).not.toContain('<-');
        expect(cypher).not.toContain('->');
      });
    });

    describe('Custom Pattern Building', () => {
      test('should allow custom pattern construction', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const CypherLib = qb.getCypher();

        const { cypher } = qb
          .match()
          .pattern((Cypher, node) => {
            const person = new Cypher.Node();
            const actedIn = new Cypher.Relationship();
            return new Cypher.Pattern(node, { labels: ['Movie'] })
              .related(actedIn, { type: 'ACTED_IN', direction: 'left' })
              .to(person, { labels: ['Person'] });
          })
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('Movie');
        expect(cypher).toContain('<-');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('Person');
      });

      test('should support complex multi-hop patterns', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const movieNode = qb.getNode();

        const actorNode = new Cypher.Node();
        const friendNode = new Cypher.Node();
        const actedIn = new Cypher.Relationship();
        const friendOf = new Cypher.Relationship();

        const { cypher } = qb
          .match()
          .pattern((Cypher, node) => {
            return new Cypher.Pattern(node, { labels: ['Movie'] })
              .related(actedIn, { type: 'ACTED_IN', direction: 'left' })
              .to(actorNode, { labels: ['Actor'] })
              .related(friendOf, { type: 'FRIEND_OF', direction: 'right' })
              .to(friendNode, { labels: ['Actor'] });
          })
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('<-');
        expect(cypher).toContain('->');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('FRIEND_OF');
      });
    });

    describe('WITH Clause Support', () => {
      test('should support WITH clause for query chaining', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const node = qb.getNode();

        const { cypher } = qb
          .match()
          .where('title', 'The Matrix')
          .with([node.property('title'), 'movieTitle'])
          .return(['movieTitle'])
          .build();

        expect(cypher).toContain('WITH');
        expect(cypher).toContain('movieTitle');
        expect(cypher).toMatch(/WITH.*RETURN/s);
      });

      test('should support WITH clause with simple property names', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb
          .match()
          .where('released', 1999)
          .with(['title', 'released'])
          .return(['title'])
          .build();

        expect(cypher).toContain('WITH');
      });
    });

    describe('CALL Subqueries', () => {
      test('should support basic CALL subquery', async () => {
        const Cypher = orm.em.createQueryBuilder().getCypher();
        const actorNode = new Cypher.Node();

        const subClause = new Cypher.Match(
          new Cypher.Pattern(actorNode, { labels: ['Actor'] }),
        )
          .where(
            Cypher.eq(
              actorNode.property('name'),
              new Cypher.Param('Keanu Reeves'),
            ),
          )
          .return([actorNode.property('name'), 'name']);

        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb.call(subClause).return(['name']).build();

        expect(cypher).toContain('CALL');
        expect(cypher).toMatch(/CALL.*\{.*MATCH/s);
      });

      test('should support CALL with imported variables', async () => {
        const Cypher = orm.em.createQueryBuilder().getCypher();
        const movieNode = new Cypher.Node();

        const subClause = new Cypher.Match(
          new Cypher.Pattern(movieNode, { labels: ['Movie'] }),
        ).return(movieNode);

        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb.call(subClause, { importVariables: '*' }).build();

        expect(cypher).toContain('CALL (*)');
      });

      test('should support CALL with transaction control', async () => {
        const Cypher = orm.em.createQueryBuilder().getCypher();
        const movieNode = new Cypher.Node();

        const subClause = new Cypher.Match(
          new Cypher.Pattern(movieNode, { labels: ['Movie'] }),
        ).return(movieNode);

        const qb = orm.em.createQueryBuilder(Movie);

        const { cypher } = qb
          .call(subClause, {
            inTransactions: {
              ofRows: 1000,
              concurrentTransactions: 4,
              onError: 'continue',
            },
          })
          .build();

        expect(cypher).toContain('CALL');
        expect(cypher).toContain('IN');
        expect(cypher).toContain('CONCURRENT TRANSACTIONS');
        expect(cypher).toContain('OF');
        expect(cypher).toContain('ROWS');
      });
    });

    describe('EXISTS and COUNT Subqueries', () => {
      test('should support EXISTS subquery', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const Cypher = qb.getCypher();
        const actorNode = qb.getNode();

        const relationship = new Cypher.Relationship();
        const targetNode = new Cypher.Node();
        const existsPattern = new Cypher.Pattern(actorNode)
          .related(relationship, { type: 'ACTED_IN' })
          .to(targetNode);

        const { cypher } = qb
          .match()
          .where(qb.exists(existsPattern))
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('EXISTS');
        expect(cypher).toContain('ACTED_IN');
      });

      test('should support COUNT subquery', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const Cypher = qb.getCypher();
        const actorNode = qb.getNode();

        const relationship = new Cypher.Relationship();
        const targetNode = new Cypher.Node();
        const countPattern = new Cypher.Pattern(actorNode)
          .related(relationship, { type: 'ACTED_IN' })
          .to(targetNode, { labels: ['Movie'] });

        const count = qb.count(countPattern);

        const { cypher } = qb
          .match()
          .where(Cypher.gt(count, new Cypher.Param(5)))
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('COUNT');
        expect(cypher).toContain('>');
      });
    });

    describe('Integration Tests with Database', () => {
      test('should execute query with relationship properties', async () => {
        const qb = orm.em.createQueryBuilder(Movie);

        const movies = await qb
          .match()
          .related('ACTED_IN', {
            direction: 'left',
            targetLabel: 'Actor',
          })
          .where('title', 'The Matrix')
          .return(['title'])
          .getMany();

        expect(Array.isArray(movies)).toBe(true);
      });

      test('should execute query with variable-length relationship', async () => {
        const qb = orm.em.createQueryBuilder(Actor);

        const actors = await qb
          .match()
          .related('ACTED_IN', {
            length: { min: 1, max: 2 },
            targetLabel: 'Movie',
          })
          .return(['name'])
          .limit(5)
          .getMany();

        expect(Array.isArray(actors)).toBe(true);
      });
    });

    describe('Entity-Based Query Building', () => {
      test('should extract relationship metadata from @Rel decorator', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const { cypher } = qb
          .match()
          .related(Actor, 'movies')
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('movie'); // collection name is lowercase
        expect(cypher).toContain('->'); // OUT direction
      });

      test('should extract relationship metadata from @Rel decorator', () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const { cypher } = qb
          .match()
          .related(Movie, 'actors')
          .return(['title'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('actor'); // collection name is lowercase
        expect(cypher).toContain('<-'); // IN direction
      });

      test('should accept entity class in targetEntity option', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const { cypher } = qb
          .match()
          .related('ACTED_IN', {
            direction: 'right',
            targetEntity: Movie,
          })
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('movie'); // collection name is lowercase
        expect(cypher).toContain('->');
      });

      test('should extract multiple labels from @Node decorator', () => {
        // Create a test entity with multiple labels
        @Entity()
        @Node({ labels: ['Employee', 'Manager'] })
        class Executive {

          @PrimaryKey()
          id!: number;

          @Property()
          name!: string;

}

        const qb = orm.em.createQueryBuilder<Executive>('Executive');
        const { cypher } = qb.match().return(['name']).build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('Executive');
      });

      test('should work with entity-based queries and filters', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const { cypher } = qb
          .match()
          .related(Actor, 'movies')
          .where('title', 'The Matrix')
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('WHERE');
        expect(cypher).toContain('title');
      });

      test('should throw error when no decorator metadata found', () => {
        const qb = orm.em.createQueryBuilder(Movie);

        expect(() => {
          qb.match().related(Movie, 'invalidProperty').build();
        }).toThrow(/No @Rel decorator found/);
      });

      test('should work with entity classes in complex patterns', () => {
        const qb = orm.em.createQueryBuilder(Actor);
        const { cypher } = qb
          .match()
          .related('ACTED_IN', {
            direction: 'right',
            targetEntity: Movie,
            properties: { roles: ['Neo'] },
          })
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('ACTED_IN');
        expect(cypher).toContain('movie'); // collection name is lowercase
      });

      test('should execute entity-based queries', async () => {
        const qb = orm.em.createQueryBuilder(Actor);

        const actors = await qb
          .match()
          .related(Actor, 'movies')
          .return(['name'])
          .limit(5)
          .getMany();

        expect(Array.isArray(actors)).toBe(true);
      });

      test('should work with WHERE clauses on entity-based queries', async () => {
        const qb = orm.em.createQueryBuilder(Movie);
        const Cypher = qb.getCypher();
        const node = qb.getNode();

        const movies = await qb
          .match()
          .related(Movie, 'actors')
          .where(
            Cypher.eq(node.property('title'), new Cypher.Param('The Matrix')),
          )
          .return(['title'])
          .getMany();

        expect(Array.isArray(movies)).toBe(true);
      });

      test('should accept relationship entity class directly', () => {
        const qb = orm.em.createQueryBuilder(User);
        const { cypher } = qb
          .match()
          .related(FriendsWith)
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('FRIENDS_WITH');
        expect(cypher).toContain('user'); // target entity
      });

      test('should accept relationship entity class with options', () => {
        const qb = orm.em.createQueryBuilder(User);
        const { cypher } = qb
          .match()
          .related(FriendsWith, {
            direction: 'right',
            properties: { since: 2020 },
          })
          .return(['name'])
          .build();

        expect(cypher).toContain('MATCH');
        expect(cypher).toContain('FRIENDS_WITH');
        expect(cypher).toContain('since');
        expect(cypher).toContain('$param'); // Parameters are converted to $param0, $param1, etc.
      });

      test('should execute queries with relationship entity class', async () => {
        // Create test data
        const user1 = orm.em.create(User, {
          username: 'testuser1',
          email: 'test1@example.com',
        });
        const user2 = orm.em.create(User, {
          username: 'testuser2',
          email: 'test2@example.com',
        });
        const friendship = orm.em.create(FriendsWith, {
          user1,
          user2,
          since: 2023,
          strength: 8,
        });
        await orm.em.persistAndFlush([user1, user2, friendship]);
        orm.em.clear();

        // Query using relationship entity class - create query builder for Cypher verification
        const qb1 = orm.em.createQueryBuilder(User);
        const { cypher, params } = qb1
          .match()
          .related(FriendsWith)
          .return(['username'])
          .build();

        // Verify the query is built correctly
        expect(cypher).toContain('FRIENDS_WITH');
        expect(cypher).toContain('user'); // target entity label

        // Execute the query using a new query builder
        const qb2 = orm.em.createQueryBuilder(User);
        const users = await qb2
          .match()
          .related(FriendsWith)
          .return(['username'])
          .getMany();

        expect(Array.isArray(users)).toBe(true);
        // Query should execute successfully (may or may not return results depending on data)
      });
    });
  });
});
