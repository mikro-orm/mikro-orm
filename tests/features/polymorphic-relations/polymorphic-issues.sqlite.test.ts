import { Collection, LoadStrategy, MikroORM, Opt, QueryOrder } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { vi } from 'vitest';

describe('polymorphic M:N with composite keys on owner side (fixed)', () => {

  @Entity()
  class Article {

    @PrimaryKey()
    tenantId!: number;

    @PrimaryKey()
    articleId!: number;

    @Property()
    title!: string;

    @ManyToMany(() => Category, c => c.articles, {
      pivotTable: 'categorizables',
      discriminator: 'categorizable',
      owner: true,
    })
    categories = new Collection<Category>(this);

    constructor(tenantId: number, articleId: number, title: string) {
      this.tenantId = tenantId;
      this.articleId = articleId;
      this.title = title;
    }

  }

  @Entity()
  class Product {

    @PrimaryKey()
    tenantId!: number;

    @PrimaryKey()
    productId!: number;

    @Property()
    name!: string;

    @ManyToMany(() => Category, c => c.products, {
      pivotTable: 'categorizables',
      discriminator: 'categorizable',
      owner: true,
    })
    categories = new Collection<Category>(this);

    constructor(tenantId: number, productId: number, name: string) {
      this.tenantId = tenantId;
      this.productId = productId;
      this.name = name;
    }

  }

  @Entity()
  class Category {

    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @ManyToMany(() => Article, a => a.categories)
    articles = new Collection<Article>(this);

    @ManyToMany(() => Product, p => p.categories)
    products = new Collection<Product>(this);

    constructor(name: string) {
      this.name = name;
    }

  }

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Article, Product, Category],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('inverse side loading with composite PK owners', async () => {
    const article1 = new Article(1, 100, 'Article 1');
    const article2 = new Article(1, 200, 'Article 2');
    const product1 = new Product(1, 100, 'Product 1');

    const category = new Category('Tech');
    category.articles.add(article1, article2);
    category.products.add(product1);

    orm.em.persist(category);
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Category, { id: category.id }, {
      populate: ['articles', 'products'],
    });

    expect(loaded.articles).toHaveLength(2);
    expect(loaded.products).toHaveLength(1);

    const loadedArticle1 = loaded.articles.getItems().find(a => a.articleId === 100);
    expect(loadedArticle1).toBeDefined();
    expect(loadedArticle1!.tenantId).toBe(1);
    expect(loadedArticle1!.title).toBe('Article 1');
  });

});

describe('polymorphic to-one with joined strategy', () => {

  @Entity()
  class Tag {

    @PrimaryKey()
    tenantId!: number;

    @PrimaryKey()
    tagId!: number;

    @Property()
    label!: string;

  }

  @Embeddable()
  class Address {

    @Property()
    city!: string;

    @Property()
    country!: string;

  }

  @Entity()
  class TargetA {

    @PrimaryKey()
    id!: number;

    @Property()
    valueA!: string;

    @Property()
    createdAt: Date & Opt = new Date('2024-01-15T12:00:00Z');

    @ManyToOne(() => Tag, { nullable: true })
    tag?: Tag;

  }

  @Entity()
  class TargetB {

    @PrimaryKey()
    id!: number;

    @Property()
    valueB!: string;

    @Embedded(() => Address, { object: true, nullable: true })
    address?: Address;

  }

  @Entity()
  class Owner {

    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @ManyToOne(() => [TargetA, TargetB], { nullable: true })
    target!: TargetA | TargetB | null;

  }

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tag, TargetA, TargetB, Owner],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();

    const tag = orm.em.create(Tag, { tenantId: 1, tagId: 10, label: 'important' });
    const targetA = orm.em.create(TargetA, { valueA: 'Value A', tag });
    const targetB = orm.em.create(TargetB, { valueB: 'Value B', address: { city: 'London', country: 'UK' } });
    orm.em.create(Owner, { name: 'Owner 1', target: targetA });
    orm.em.create(Owner, { name: 'Owner 2', target: targetB });
    orm.em.create(Owner, { name: 'Owner 3', target: null });

    await orm.em.flush();
    orm.em.clear();
  });

  test('SELECT_IN strategy fires multiple queries for polymorphic relation', async () => {
    const mock = vi.fn();
    const logger = orm.config.getLogger();
    logger.setDebugMode(true);
    logger.log = mock;

    const owners = await orm.em.find(Owner, {}, {
      populate: ['target'],
      strategy: LoadStrategy.SELECT_IN,
      orderBy: { id: QueryOrder.ASC },
    });

    logger.setDebugMode(false);

    expect(owners).toHaveLength(3);
    expect(owners[0].target).toBeInstanceOf(TargetA);
    expect(owners[1].target).toBeInstanceOf(TargetB);
    expect(owners[2].target).toBeNull();

    // SELECT_IN: 1 query for owners + 2 queries (one per target type) = 3
    // Note: There may be additional queries from commit or other operations
    const selectQueries = mock.mock.calls.filter((c: any) => c[1]?.includes('select'));
    expect(selectQueries.length).toBeGreaterThanOrEqual(3);
  });

  test('JOINED strategy uses LEFT JOINs per target type for polymorphic relations', async () => {
    const mock = vi.fn();
    const logger = orm.config.getLogger();
    logger.setDebugMode(true);
    logger.log = mock;

    const owners = await orm.em.find(Owner, {}, {
      populate: ['target'],
      strategy: LoadStrategy.JOINED,
      orderBy: { id: QueryOrder.ASC },
    });

    logger.setDebugMode(false);

    expect(owners).toHaveLength(3);
    expect(owners[0].target).toBeInstanceOf(TargetA);
    expect(owners[1].target).toBeInstanceOf(TargetB);
    expect(owners[2].target).toBeNull();

    // Verify Date property on polymorphic target is correctly hydrated
    expect((owners[0].target as TargetA).createdAt).toBeInstanceOf(Date);
    // Verify composite FK on polymorphic target is hydrated as reference
    expect((owners[0].target as TargetA).tag).toBeDefined();
    // Verify embedded object on polymorphic target is correctly hydrated
    expect((owners[1].target as TargetB).address).toEqual({ city: 'London', country: 'UK' });

    // JOINED: single query with LEFT JOINs per target type
    const selectQueries = mock.mock.calls.filter((c: any) => c[1]?.includes('select'));
    expect(selectQueries[0][1]).toContain('left join');
    expect(selectQueries[0][1]).toContain('target_type');
    expect(selectQueries).toHaveLength(1);
  });

  test('JOINED strategy with timezone config parses dates correctly', async () => {
    const tzOrm = await MikroORM.init({
      entities: [Tag, TargetA, TargetB, Owner],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
      timezone: '+02:00',
    });
    await tzOrm.schema.create();

    const tag = tzOrm.em.create(Tag, { tenantId: 1, tagId: 10, label: 'tz' });
    const targetA = tzOrm.em.create(TargetA, { valueA: 'TZ Value', tag });
    tzOrm.em.create(Owner, { name: 'TZ Owner', target: targetA });
    await tzOrm.em.flush();
    tzOrm.em.clear();

    const owners = await tzOrm.em.find(Owner, {}, {
      populate: ['target'],
      strategy: LoadStrategy.JOINED,
    });

    expect(owners).toHaveLength(1);
    expect(owners[0].target).toBeInstanceOf(TargetA);
    expect((owners[0].target as TargetA).createdAt).toBeInstanceOf(Date);

    await tzOrm.close(true);
  });

});

describe('polymorphic relation with STI target (fixed)', () => {

  test('throws error when polymorphic targets share the same table (STI)', async () => {
    @Entity({
      discriminatorColumn: 'type',
      discriminatorMap: { person: 'Person', employee: 'Employee' },
    })
    class Person {

      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

    }

    @Entity({ discriminatorValue: 'employee' })
    class Employee extends Person {

      @Property()
      department!: string;

    }

    @Entity()
    class Task {

      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;

      // This is disallowed: Person and Employee share the same table
      // Use separate @ManyToOne(() => Person) properties instead
      @ManyToOne(() => [Person, Employee], { nullable: true })
      assignee!: Person | Employee | null;

    }

    await expect(
      MikroORM.init({
        entities: [Person, Employee, Task],
        dbName: ':memory:',
        metadataProvider: ReflectMetadataProvider,
      }),
    ).rejects.toThrow(/incompatible polymorphic targets.*both use table 'person'.*Use separate properties/i);
  });

});

describe('invalid discriminator value handling (fixed)', () => {

  @Entity()
  class TypeA {

    @PrimaryKey()
    id!: number;

    @Property()
    value!: string;

  }

  @Entity()
  class TypeB {

    @PrimaryKey()
    id!: number;

    @Property()
    value!: string;

  }

  @Entity()
  class Container {

    @PrimaryKey()
    id!: number;

    @ManyToOne(() => [TypeA, TypeB])
    item!: TypeA | TypeB;

  }

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TypeA, TypeB, Container],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('throws error when hydrating invalid discriminator value', async () => {
    const conn = orm.em.getConnection();
    await conn.execute(`INSERT INTO type_a (id, value) VALUES (1, 'A')`);
    await conn.execute(`INSERT INTO container (id, item_type, item_id) VALUES (1, 'invalid_type', 1)`);

    await expect(
      orm.em.findOneOrFail(Container, { id: 1 }),
    ).rejects.toThrow(/discriminator|unknown|invalid/i);
  });

});

describe('ChangeSetComputer with polymorphic relations (fixed)', () => {

  @Entity()
  class Target {

    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

  }

  @Entity()
  class Target2 {

    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

  }

  @Entity()
  class Parent {

    @PrimaryKey()
    id!: number;

    @ManyToOne(() => [Target, Target2])
    poly!: Target | Target2;

  }

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Target, Target2, Parent],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('updating to same target does not create unnecessary changeset', async () => {
    const target = orm.em.create(Target, { name: 'Target' });
    const parent = orm.em.create(Parent, { poly: target });
    await orm.em.flush();

    // Re-assign the same target - should not create a changeset
    parent.poly = target;

    const uow = orm.em.getUnitOfWork();
    uow.computeChangeSets();
    const changes = uow.getChangeSets();

    const parentChanges = changes.filter(cs => cs.entity === parent);
    expect(parentChanges).toHaveLength(0);
  });

});
