import {
  MikroORM, Entity, PrimaryKey, ManyToOne, Property, SimpleLogger,
  Unique, Ref, ref, EventSubscriber, EventArgs, OneToMany, Collection, Embeddable, Embedded,
} from '@mikro-orm/core';
import { mockLogger } from '../../helpers';

@Entity()
export class Author {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = Author.id++;

  @Property({ unique: true })
  email: string;

  @Property({ name: 'current_age' })
  age: number;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  constructor(email: string, age: number) {
    this.email = email;
    this.age = age;
  }

}

@Entity()
export class Book {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = Book.id++;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @Property()
  name: string;

  constructor(name: string, author: Author) {
    this.name = name;
    this.author = ref(author);
  }

}

@Entity()
@Unique({ properties: ['author', 'name'] })
export class FooBar {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = FooBar.id++;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @Property()
  name: string;

  @Property({ nullable: true })
  propName?: string;

  constructor(name: string, author: Author | Ref<Author>) {
    this.name = name;
    this.author = ref(author);
  }

}

@Entity()
export class FooBarWithEmbeddable {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = FooBar.id++;

  @Embedded(() => FooBarEmbeddable)
  fooBarEmbeddable = new FooBarEmbeddable();

}

@Embeddable()
export class FooBarEmbeddable {

  @Property({ nullable: true })
  name?: string;

}

class Subscriber implements EventSubscriber {

  static log: any[] = [];

  beforeUpsert(args: EventArgs<any>): void | Promise<void> {
    Subscriber.log.push(['beforeUpsert', args]);
  }

  afterUpsert(args: EventArgs<any>): void | Promise<void> {
    Subscriber.log.push(['afterUpsert', args]);
  }

  onInit(args: EventArgs<any>) {
    Subscriber.log.push(['onInit', args]);
  }

}

const options = {
  'sqlite': { dbName: ':memory:' },
  'better-sqlite': { dbName: ':memory:' },
  'mysql': { dbName: 'mikro_orm_upsert', port: 3308 },
  'mariadb': { dbName: 'mikro_orm_upsert', port: 3309 },
  'postgresql': { dbName: 'mikro_orm_upsert' },
  'mongo': { dbName: 'mikro_orm_upsert' },
};

describe.each(Object.keys(options))('em.upsert [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, FooBar, FooBarWithEmbeddable],
      type,
      loggerFactory: options => new SimpleLogger(options),
      subscribers: [new Subscriber()],
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    Author.id = Book.id = FooBar.id = 1;
    Subscriber.log.length = 0;
  });

  afterAll(() => orm.close());

  async function createEntities() {
    const books = [
      new Book('b1', new Author('a1', 31)),
      new Book('b2', new Author('a2', 32)),
      new Book('b3', new Author('a3', 33)),
    ];
    const fooBars = [
      new FooBar('fb1', books[0].author),
      new FooBar('fb2', books[1].author),
      new FooBar('fb3', books[2].author),
    ];
    await orm.em.persist(books).persist(fooBars).flush();
    expect(books.map(b => b.id)).toEqual([1, 2, 3]);
    expect(books.map(b => b.author.id)).toEqual([1, 2, 3]);
    expect(fooBars.map(fb => fb.id)).toEqual([1, 2, 3]);
    expect(fooBars.map(fb => fb.author.id)).toEqual([1, 2, 3]);

    return books;
  }

  async function assert(author: Author, mock: jest.Mock) {
    expect(mock.mock.calls).toMatchSnapshot();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    author.age = 123;
    await orm.em.flush();
    expect(mock).toBeCalled();

    orm.em.clear();
    const authors = await orm.em.find(Author, {}, { orderBy: { email: 'asc' } });
    expect(authors).toHaveLength(3);

    mock.mockReset();
    authors[1].age = 321;
    const author12 = await orm.em.upsert(authors[0]); // exists
    const author22 = await orm.em.upsert(authors[1]); // exists
    const author32 = await orm.em.upsert(authors[2]); // exists
    expect(author12).toBe(authors[0]);
    expect(author22).toBe(authors[1]);
    expect(author32).toBe(authors[2]);
    expect(author22.age).toBe(321);
    expect(mock).not.toBeCalled();
    await orm.em.flush();
    await orm.em.refresh(author22);
    expect(author22.age).toBe(321);
  }

  async function assertFooBars(fooBars: FooBar[], mock: jest.Mock) {
    expect(mock.mock.calls).toMatchSnapshot();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    fooBars[0].propName = '12345';
    await orm.em.flush();
    expect(mock).toBeCalled();

    orm.em.clear();
    const fooBarsReloaded = await orm.em.find(FooBar, {}, { orderBy: { name: 'asc' } });
    expect(fooBarsReloaded).toHaveLength(3);

    mock.mockReset();
    fooBarsReloaded[1].propName = '12345';
    const fooBar12 = await orm.em.upsert(fooBarsReloaded[0]); // exists
    const fooBar22 = await orm.em.upsert(fooBarsReloaded[1]); // exists
    const fooBar32 = await orm.em.upsert(fooBarsReloaded[2]); // exists
    expect(fooBar12).toBe(fooBarsReloaded[0]);
    expect(fooBar22).toBe(fooBarsReloaded[1]);
    expect(fooBar32).toBe(fooBarsReloaded[2]);
    expect(fooBar22.propName).toBe('12345');
    expect(mock).not.toBeCalled();
    await orm.em.flush();
    await orm.em.refresh(fooBar22);
    expect(fooBar22.propName).toBe('12345');
  }

  test('em.upsert(Type, data) with PK', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const author1 = await orm.em.upsert(Author, { id: 1, email: 'a1', age: 41 }); // exists
    const author2 = await orm.em.upsert(Author, { id: 2, email: 'a2', age: 42 }); // inserts
    const author3 = await orm.em.upsert(Author, { id: 3, email: 'a3', age: 43 }); // inserts

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
    ]);

    await assert(author2, mock);
  });

  test('em.upsert(Type, data) with unique property', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const author1 = await orm.em.upsert(Author, { email: 'a1', age: 41 }); // exists
    const author2 = await orm.em.upsert(Author, { email: 'a2', age: 42 }); // inserts
    const author3 = await orm.em.upsert(Author, { email: 'a3', age: 43 }); // inserts

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
    ]);

    await assert(author2, mock);
  });

  test('em.upsertMany(Type, [data1, data2, data3]) with PK', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const [author1, author2, author3] = await orm.em.upsertMany(Author, [
      { id: 1, email: 'a1', age: 41 }, // exists
      { id: 2, email: 'a2', age: 42 }, // inserts
      { id: 3, email: 'a3', age: 43 }, // inserts
    ]);

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeUpsert', 'Object'],
      ['beforeUpsert', 'Object'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['afterUpsert', 'Author'],
      ['afterUpsert', 'Author'],
    ]);

    await assert(author2, mock);
  });

  test('em.upsertMany(Type, [data1, data2, data3]) with unique property', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const [author1, author2, author3] = await orm.em.upsertMany(Author, [
      { email: 'a1', age: 41 }, // exists
      { email: 'a2', age: 42 }, // inserts
      { email: 'a3', age: 43 }, // inserts
    ]);
    expect(author1.id).toBeDefined();
    expect(author2.id).toBeDefined();
    expect(author3.id).toBeDefined();

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeUpsert', 'Object'],
      ['beforeUpsert', 'Object'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['afterUpsert', 'Author'],
      ['afterUpsert', 'Author'],
      ['afterUpsert', 'Author'],
    ]);

    await assert(author2, mock);
  });

  test('em.upsert(Type, data) with unique composite property (no additional props)', async () => {
    await createEntities();

    await orm.em.nativeDelete(FooBar, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const fooBar1 = await orm.em.upsert(FooBar, { name: 'fb1', author: 1 }); // exists
    const fooBar2 = await orm.em.upsert(FooBar, { name: 'fb2', author: 2 }); // inserts
    const fooBar3 = await orm.em.upsert(FooBar, { name: 'fb3', author: 3 }); // inserts

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['onInit', 'FooBar'],
      ['afterUpsert', 'FooBar'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['onInit', 'FooBar'],
      ['afterUpsert', 'FooBar'],
      ['beforeUpsert', 'Object'],
      ['onInit', 'Author'],
      ['onInit', 'FooBar'],
      ['afterUpsert', 'FooBar'],
    ]);

    await assertFooBars([fooBar1, fooBar2, fooBar3], mock);
  });

  test('em.upsert(Type, data) with unique composite property (update additional prop)', async () => {
    await createEntities();

    await orm.em.nativeDelete(FooBar, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const fooBar1 = await orm.em.upsert(FooBar, { name: 'fb1', author: 1, propName: 'val 1' }); // exists
    const fooBar2 = await orm.em.upsert(FooBar, { name: 'fb2', author: 2, propName: 'val 2' }); // inserts
    const fooBar3 = await orm.em.upsert(FooBar, { name: 'fb3', author: 3, propName: 'val 3' }); // inserts

    await assertFooBars([fooBar1, fooBar2, fooBar3], mock);
  });

  test('em.upsert(entity)', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const a1 = orm.em.create(Author, { id: 1, email: 'a1', age: 41 });
    const a2 = orm.em.create(Author, { id: 2, email: 'a2', age: 42 });
    const a3 = orm.em.create(Author, { id: 3, email: 'a3', age: 43 });
    const author1 = await orm.em.upsert(a1); // exists
    const author2 = await orm.em.upsert(a2); // inserts
    const author3 = await orm.em.upsert(a3); // inserts
    expect(a1).toBe(author1);
    expect(a2).toBe(author2);
    expect(a3).toBe(author3);

    expect(Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['onInit', 'Author'],
      ['beforeUpsert', 'Object'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['afterUpsert', 'Author'],
      ['beforeUpsert', 'Object'],
      ['afterUpsert', 'Author'],
    ]);

    await assert(author2, mock);
  });

  test('em.upsertMany([entity1, entity2, entity3]) with PK', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const a1 = orm.em.create(Author, { id: 1, email: 'a1', age: 41 }); // exists
    const a2 = orm.em.create(Author, { id: 2, email: 'a2', age: 42 }); // inserts
    const a3 = orm.em.create(Author, { id: 3, email: 'a3', age: 43 }); // inserts
    const [author1, author2, author3] = await orm.em.upsertMany([a1, a2, a3]);
    expect(a1).toBe(author1);
    expect(a2).toBe(author2);
    expect(a3).toBe(author3);

    await assert(author2, mock);
  });

  test('em.upsertMany([entity1, entity2, entity3]) with unique property', async () => {
    await createEntities();

    await orm.em.nativeDelete(Book, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const a1 = orm.em.create(Author, { email: 'a1', age: 41 }); // exists
    delete (a1 as any).id; // simulate unknown pk
    const a2 = orm.em.create(Author, { email: 'a2', age: 42 }); // inserts
    delete (a2 as any).id; // simulate unknown pk
    const a3 = orm.em.create(Author, { email: 'a3', age: 43 }); // inserts
    delete (a3 as any).id; // simulate unknown pk
    const [author1, author2, author3] = await orm.em.upsertMany([a1, a2, a3]);
    expect(a1).toBe(author1);
    expect(a1.id).toBeDefined();
    expect(a2).toBe(author2);
    expect(a2.id).toBeDefined();
    expect(a3).toBe(author3);
    expect(a3.id).toBeDefined();

    await assert(author2, mock);
  });

  test('em.upsert(entity) with unique composite property', async () => {
    await createEntities();

    await orm.em.nativeDelete(FooBar, [2, 3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const fb1 = orm.em.create(FooBar, { id: 1, name: 'fb1', author: 1, propName: 'val 1' });
    const fb2 = orm.em.create(FooBar, { id: 2, name: 'fb2', author: 2, propName: 'val 2' });
    const fb3 = orm.em.create(FooBar, { id: 3, name: 'fb3', author: 3, propName: 'val 3' });
    const fooBar1 = await orm.em.upsert(FooBar, fb1); // exists
    const fooBar2 = await orm.em.upsert(FooBar, fb2); // inserts
    const fooBar3 = await orm.em.upsert(FooBar, fb3); // inserts
    expect(fb1).toBe(fooBar1);
    expect(fb2).toBe(fooBar2);
    expect(fb3).toBe(fooBar3);

    await assertFooBars([fooBar1, fooBar2, fooBar3], mock);
  });


  test('em.upsert(entity) with embeddable', async () => {
    const testEntity = orm.em.create(FooBarWithEmbeddable, { fooBarEmbeddable: {} });

    await orm.em.upsert(testEntity);

    expect(testEntity.id).toBeDefined();

    const [insertedEntity2] = await orm.em.upsertMany(FooBarWithEmbeddable, [{ id: testEntity.id, fooBarEmbeddable: {} }]);

    expect(insertedEntity2).toBe(testEntity);
  });

});
