import {
  Collection,
  EntityData,
  IDatabaseDriver,
  MikroORM,
  Opt,
  raw,
  ref,
  Ref,
  SimpleLogger,
  Utils,
} from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
  ManyToMany,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';
import { SqlEntityManager } from '@mikro-orm/sql';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

// --- Test entities ---

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  age!: number;

  @Property()
  createdAt: Date & Opt = new Date();

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;
}

@Embeddable()
class Address {
  @Property()
  street!: string;

  @Property()
  city!: string;
}

@Entity()
class Company {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true, type: 'integer' })
  version!: number & Opt;

  @Embedded(() => Address)
  address!: Address;
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @ManyToMany(() => Article, a => a.tags)
  articles = new Collection<Article>(this);
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;
}

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  price!: number;

  @Property({ persist: false })
  transient?: string;

  @Property({ formula: 'price * 1.2' })
  priceWithTax?: number;
}

// --- TPT entities ---

@Entity({ inheritance: 'tpt' })
abstract class Vehicle {
  @PrimaryKey()
  id!: number;

  @Property()
  brand!: string;

  @Property()
  year!: number;
}

@Entity()
class Car extends Vehicle {
  @Property()
  doors!: number;
}

@Entity()
class Truck extends Vehicle {
  @Property()
  payload!: number;
}

// --- Test options ---

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: { dbName: 'mikro_orm_clone' },
  mysql: { dbName: 'mikro_orm_clone', port: 3308 },
  mariadb: { dbName: 'mikro_orm_clone', port: 3309 },
};

describe.each(Utils.keys(options))('clone [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Author, Book, Address, Company, Tag, Article, Product, Vehicle, Car, Truck],
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      metadataProvider: ReflectMetadataProvider,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(() => orm.close());

  async function createAuthor(data: { name: string; email: string; age: number }) {
    const author = orm.em.create(Author, data);
    await orm.em.flush();
    orm.em.clear();
    return author;
  }

  // -------------------------------------------------------
  // QueryBuilder: insertFrom()
  // -------------------------------------------------------

  describe('qb.insertFrom()', () => {
    test('no explicit select → all cloneable columns derived from metadata', async () => {
      // Use Book (no unique constraints other than PK) for pure clone
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const book = orm.em.create(Book, { title: 'Original', author: ref(author) });
      await orm.em.flush();
      orm.em.clear();

      const mock = mockLogger(orm);
      const source = (orm.em as SqlEntityManager).createQueryBuilder(Book).where({ id: book.id });
      await (orm.em as SqlEntityManager).createQueryBuilder(Book).insertFrom(source).execute();

      // The INSERT should include all non-PK columns
      const query = mock.mock.calls[0][0];
      expect(query).toMatch(/insert into/i);
      expect(query).toMatch(/select/i);

      // Verify the cloned row exists
      orm.em.clear();
      const books = await orm.em.find(Book, {}, { orderBy: { id: 'asc' } });
      expect(books).toHaveLength(2);
      expect(books[1].title).toBe('Original');
      expect(books[1].author.id).toBe(author.id);
      expect(books[1].id).not.toBe(book.id);
    });

    test('explicit select on source → columns from selected fields', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      const source = (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .select(['name', raw("'cloned@test.com'").as('email'), 'age', 'createdAt'])
        .where({ id: author.id });

      await (orm.em as SqlEntityManager).createQueryBuilder(Author).insertFrom(source).execute();

      orm.em.clear();
      const cloned = await orm.em.findOne(Author, { email: 'cloned@test.com' });
      expect(cloned).not.toBeNull();
      expect(cloned!.name).toBe('John');
      expect(cloned!.age).toBe(30);
    });

    test('explicit columns option for full control', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      const source = (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .select(['name', raw("'manual@test.com'"), 'age', 'createdAt'])
        .where({ id: author.id });

      await (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .insertFrom(source, { columns: ['name', 'email', 'age', 'createdAt'] })
        .execute();

      orm.em.clear();
      const cloned = await orm.em.findOne(Author, { email: 'manual@test.com' });
      expect(cloned).not.toBeNull();
      expect(cloned!.name).toBe('John');
    });

    test('composable with returning()', async () => {
      if (type === 'mysql' || type === 'mariadb') {
        return; // MySQL/MariaDB don't support RETURNING
      }

      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      const source = (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .select(['name', raw("'ret@test.com'").as('email'), 'age', 'createdAt'])
        .where({ id: author.id });
      const result = await (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .insertFrom(source)
        .returning('*')
        .execute();

      expect(result).toBeDefined();
    });

    test('composable with onConflict().ignore()', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      // Clone with same email — should be ignored due to unique constraint
      const source = (orm.em as SqlEntityManager).createQueryBuilder(Author).where({ id: author.id });
      await (orm.em as SqlEntityManager)
        .createQueryBuilder(Author)
        .insertFrom(source)
        .onConflict('email')
        .ignore()
        .execute();

      orm.em.clear();
      const authors = await orm.em.find(Author, {});
      expect(authors).toHaveLength(1); // no duplicate inserted
    });

    test('excludes persist:false, formula, M:N from metadata-derived columns', async () => {
      // Product has persist:false and formula props — tests those filter branches
      const product = orm.em.create(Product, { name: 'Widget', price: 100 });
      await orm.em.flush();
      orm.em.clear();

      const source = (orm.em as SqlEntityManager).createQueryBuilder(Product).where({ id: product.id });
      await (orm.em as SqlEntityManager).createQueryBuilder(Product).insertFrom(source).execute();

      orm.em.clear();
      const products = await orm.em.find(Product, {}, { orderBy: { id: 'asc' } });
      expect(products).toHaveLength(2);
      expect(products[1].name).toBe('Widget');
      expect(products[1].price).toBe(100);

      // Article has M:N (tags) and 1:M inverse — tests those filter branches
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const article = orm.em.create(Article, { title: 'Art 1', author: ref(author) });
      await orm.em.flush();
      orm.em.clear();

      const artSource = (orm.em as SqlEntityManager).createQueryBuilder(Article).where({ id: article.id });
      await (orm.em as SqlEntityManager).createQueryBuilder(Article).insertFrom(artSource).execute();

      orm.em.clear();
      const articles = await orm.em.find(Article, {}, { orderBy: { id: 'asc' } });
      expect(articles).toHaveLength(2);
      expect(articles[1].title).toBe('Art 1');

      // Company has embedded — tests embedded filter branch
      const company = orm.em.create(Company, {
        name: 'Acme',
        address: { street: '123 Main', city: 'Springfield' },
      });
      await orm.em.flush();
      orm.em.clear();

      const compSource = (orm.em as SqlEntityManager).createQueryBuilder(Company).where({ id: company.id });
      await (orm.em as SqlEntityManager).createQueryBuilder(Company).insertFrom(compSource).execute();

      orm.em.clear();
      const companies = await orm.em.find(Company, {}, { orderBy: { id: 'asc' } });
      expect(companies).toHaveLength(2);
      expect(companies[1].name).toBe('Acme');
    });

    test('M:1 FK column is copied', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const book = orm.em.create(Book, { title: 'Book 1', author: ref(author) });
      await orm.em.flush();
      orm.em.clear();

      const source = (orm.em as SqlEntityManager).createQueryBuilder(Book).where({ id: book.id });
      await (orm.em as SqlEntityManager).createQueryBuilder(Book).insertFrom(source).execute();

      orm.em.clear();
      const books = await orm.em.find(Book, {}, { populate: ['author'], orderBy: { id: 'asc' } });
      expect(books).toHaveLength(2);
      expect(books[1].author.id).toBe(author.id); // FK preserved
      expect(books[1].title).toBe('Book 1');
    });
  });

  // -------------------------------------------------------
  // EntityManager: clone()
  // -------------------------------------------------------

  describe('em.clone()', () => {
    test('pure clone (no overrides) — new PK, all fields copied', async () => {
      // Book has no unique constraints, so pure clone works
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const book = orm.em.create(Book, { title: 'Original', author: ref(author) });
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(Book, { id: book.id });

      expect(cloned).toBeInstanceOf(Book);
      expect(cloned.id).not.toBe(book.id);
      expect(cloned.title).toBe('Original');
      expect(cloned.author.id).toBe(author.id);
    });

    test('clone with overrides', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      const cloned = await orm.em.clone(
        Author,
        { id: author.id },
        {
          email: 'cloned@test.com',
          age: 99,
        },
      );

      expect(cloned).toBeInstanceOf(Author);
      expect(cloned.id).not.toBe(author.id);
      expect(cloned.name).toBe('John');
      expect(cloned.email).toBe('cloned@test.com');
      expect(cloned.age).toBe(99);
    });

    test('clone from loaded entity', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const loaded = await orm.em.findOneOrFail(Author, author.id);

      const cloned = await orm.em.clone(loaded, { email: 'entity-clone@test.com' });

      expect(cloned).toBeInstanceOf(Author);
      expect(cloned.id).not.toBe(loaded.id);
      expect(cloned.name).toBe('John');
      expect(cloned.email).toBe('entity-clone@test.com');
    });

    test('cloned entity is in identity map', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });

      const cloned = await orm.em.clone(
        Author,
        { id: author.id },
        {
          email: 'idmap@test.com',
        },
      );

      // Entity should be in identity map
      const fromMap = orm.em.getUnitOfWork().getById(Author, cloned.id);
      expect(fromMap).toBe(cloned);
    });

    test('version property is reset', async () => {
      const company = orm.em.create(Company, {
        name: 'Acme',
        address: { street: '123 Main St', city: 'Springfield' },
      });
      await orm.em.flush();
      orm.em.clear();

      // Bump version
      const loaded = await orm.em.findOneOrFail(Company, company.id);
      loaded.name = 'Acme Inc';
      await orm.em.flush();
      expect(Number(loaded.version)).toBe(2);
      orm.em.clear();

      const cloned = await orm.em.clone(
        Company,
        { id: company.id },
        {
          name: 'Acme Clone',
        },
      );

      expect(Number(cloned.version)).toBe(1); // reset to initial value
      expect(cloned.name).toBe('Acme Clone');
    });

    test('embedded properties are copied', async () => {
      const company = orm.em.create(Company, {
        name: 'Acme',
        address: { street: '123 Main St', city: 'Springfield' },
      });
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(
        Company,
        { id: company.id },
        {
          name: 'Acme Clone',
        },
      );

      expect(cloned.address.street).toBe('123 Main St');
      expect(cloned.address.city).toBe('Springfield');
    });

    test('M:1 FK is preserved in clone', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const book = orm.em.create(Book, { title: 'Book 1', author: ref(author) });
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(
        Book,
        { id: book.id },
        {
          title: 'Book 1 Clone',
        },
      );

      expect(cloned.title).toBe('Book 1 Clone');
      expect(cloned.author.id).toBe(author.id);
    });

    test('M:N relations are not cloned', async () => {
      const author = await createAuthor({ name: 'John', email: 'john@test.com', age: 30 });
      const tag = orm.em.create(Tag, { label: 'tag1' });
      const article = orm.em.create(Article, { title: 'Art 1', author: ref(author) });
      article.tags.add(tag);
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(
        Article,
        { id: article.id },
        {
          title: 'Art 1 Clone',
        },
      );

      expect(cloned.title).toBe('Art 1 Clone');
      expect(cloned.author.id).toBe(author.id);
      // M:N pivot rows are NOT cloned — tags collection should be empty on the clone
      await orm.em.populate(cloned, ['tags']);
      expect(cloned.tags).toHaveLength(0);
    });

    test('TPT entity clone inserts into all ancestor tables', async () => {
      const car = orm.em.create(Car, { brand: 'Toyota', year: 2024, doors: 4 });
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(
        Car,
        { id: car.id },
        {
          brand: 'Toyota Clone',
        },
      );

      expect(cloned).toBeInstanceOf(Car);
      expect(cloned.id).not.toBe(car.id);
      expect(cloned.brand).toBe('Toyota Clone');
      expect(cloned.year).toBe(2024);
      expect(cloned.doors).toBe(4);

      // Verify in DB
      orm.em.clear();
      const cars = await orm.em.find(Car, {}, { orderBy: { id: 'asc' } });
      expect(cars).toHaveLength(2);
      expect(cars[1].brand).toBe('Toyota Clone');
      expect(cars[1].doors).toBe(4);
    });

    test('persist:false and formula properties are excluded from clone', async () => {
      const product = orm.em.create(Product, { name: 'Widget', price: 100 });
      await orm.em.flush();
      orm.em.clear();

      const cloned = await orm.em.clone(
        Product,
        { id: product.id },
        {
          name: 'Widget Clone',
        },
      );

      expect(cloned.name).toBe('Widget Clone');
      expect(cloned.price).toBe(100);
      // transient (persist: false) and priceWithTax (formula) should not cause errors
    });
  });
});

// --- MongoDB-specific entities and tests ---

@Entity()
class MongoAuthor {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  age!: number;
}

@Entity()
class MongoCompany {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Property({ version: true })
  version!: number & Opt;
}

describe('clone [mongo]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [MongoAuthor, MongoCompany],
      driver: PLATFORMS.mongo,
      loggerFactory: SimpleLogger.create,
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_clone',
    });
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(() => orm.close());

  test('em.clone() with overrides', async () => {
    const author = orm.em.create(MongoAuthor, { name: 'John', email: 'john@test.com', age: 30 });
    await orm.em.flush();
    orm.em.clear();

    const cloned = await orm.em.clone(
      MongoAuthor,
      { name: 'John' },
      {
        email: 'cloned@test.com',
        age: 99,
      },
    );

    expect(cloned).toBeInstanceOf(MongoAuthor);
    expect(cloned.name).toBe('John');
    expect(cloned.email).toBe('cloned@test.com');
    expect(cloned.age).toBe(99);
  });

  test('em.clone() pure clone', async () => {
    const author = orm.em.create(MongoAuthor, { name: 'John', email: 'john@test.com', age: 30 });
    await orm.em.flush();
    orm.em.clear();

    const cloned = await orm.em.clone(MongoAuthor, { name: 'John' });

    expect(cloned).toBeInstanceOf(MongoAuthor);
    expect(cloned.name).toBe('John');
    expect(cloned.age).toBe(30);
  });

  test('em.clone() from loaded entity', async () => {
    const author = orm.em.create(MongoAuthor, { name: 'John', email: 'john@test.com', age: 30 });
    await orm.em.flush();
    const loaded = await orm.em.findOneOrFail(MongoAuthor, { name: 'John' });

    const cloned = await orm.em.clone(loaded, { email: 'entity-clone@test.com' });

    expect(cloned).toBeInstanceOf(MongoAuthor);
    expect(cloned.name).toBe('John');
    expect(cloned.email).toBe('entity-clone@test.com');
  });

  test('em.clone() version property is reset', async () => {
    const company = orm.em.create(MongoCompany, { name: 'Acme' });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(MongoCompany, { name: 'Acme' });
    loaded.name = 'Acme Inc';
    await orm.em.flush();
    orm.em.clear();

    const cloned = await orm.em.clone(
      MongoCompany,
      { name: 'Acme Inc' },
      {
        name: 'Acme Clone',
      },
    );

    expect(cloned.version).toBe(1);
    expect(cloned.name).toBe('Acme Clone');
  });
});
