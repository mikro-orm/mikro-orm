import { v4 } from 'uuid';
import {
  AnyEntity,
  ChangeSet,
  ChangeSetType,
  Collection,
  EntityMetadata,
  EventSubscriber,
  FilterQuery,
  FlushEventArgs,
  ForeignKeyConstraintViolationException,
  InvalidFieldNameException,
  MikroORM,
  NonUniqueFieldNameException,
  NotNullConstraintViolationException,
  QueryFlag,
  QueryOrder,
  raw,
  ref,
  Reference,
  sql,
  SyntaxErrorException,
  TableExistsException,
  UniqueConstraintViolationException,
  wrap,
} from '@mikro-orm/oracledb';
import { Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  Publisher2,
  PublisherType,
  PublisherType2,
  Test2,
} from './entities-sql/index.js';
import { BASE_DIR, mockLogger } from './bootstrap.js';
import { Test2Subscriber } from './subscribers/Test2Subscriber.js';

@Entity({ tableName: 'mikro_orm_test_2.label' })
class Label {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => Test2, pivotTable: 'mikro_orm_test_2.label_tests', fixedOrder: true })
  tests = new Collection<Test2>(this);

  constructor(name: string) {
    this.name = name;
  }
}

describe('EntityManagerOracle2', () => {
  let orm: MikroORM;

  async function createBooksWithTags() {
    const author = await orm.em.upsert(Author2, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = new Book2('My Life on The Wall, part 1', author.id);
    const book2 = new Book2('My Life on The Wall, part 2', author.id);
    const book3 = new Book2('My Life on The Wall, part 3', author.id);
    const publisher = new Publisher2();
    book1.publisher = ref(publisher);
    book2.publisher = ref(publisher);
    book3.publisher = ref(publisher);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]).flush();
    orm.em.clear();
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_2',
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, Configuration2, FooBar2, FooBaz2, Label],
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      password: 'oracle123',
      baseDir: BASE_DIR,
      subscribers: [Test2Subscriber],
      autoJoinOneToOneOwner: false,
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.update();
  });
  beforeEach(async () => orm.schema.clear());
  afterAll(async () => {
    await orm.close(true);
  });

  test('bigint support', async () => {
    const t = new BookTag2('test');
    t.id = 9223372036854775807n;
    await orm.em.persist(t).flush();
    expect(t.id).toBe(9223372036854775807n);
    orm.em.clear();

    const t2 = await orm.em.findOneOrFail(BookTag2, t.id);
    expect(t2.id).toBe(9223372036854775807n);
  });

  test('populating many to many relation', async () => {
    const p1 = new Publisher2('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Publisher2('bar');
    p2.tests.add(new Test2(), new Test2());
    await orm.em.persist([p1, p2]).flush();
    orm.em.clear();

    const publishers = await orm.em.findAll(Publisher2, {
      populate: ['tests'],
      orderBy: { id: 1 },
    });
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0]).toBeInstanceOf(Publisher2);
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized(true)).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);

    orm.em.clear();
    const mock = mockLogger(orm);
    const publishers2 = await orm.em.findAll(Publisher2, {
      populate: ['tests:ref'],
      strategy: 'select-in',
      orderBy: { id: 1 },
    });
    expect(publishers2).toBeInstanceOf(Array);
    expect(publishers2.length).toBe(2);
    expect(publishers2[0]).toBeInstanceOf(Publisher2);
    expect(publishers2[0].tests).toBeInstanceOf(Collection);
    expect(publishers2[0].tests.isInitialized()).toBe(true);
    expect(publishers2[0].tests.isInitialized(true)).toBe(true); // empty collection
    expect(publishers2[0].tests.isDirty()).toBe(false);
    expect(publishers2[0].tests.count()).toBe(0);

    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select "p0".* from "publisher2" "p0" order by "p0"."id" asc');
    expect(mock.mock.calls[1][0]).toMatch(
      'select "p0"."id", "p0"."test2_id", "p0"."publisher2_id" from "publisher2_tests" "p0" where "p0"."publisher2_id" in (1, 2) order by "p0"."id" asc',
    );
    mock.mockReset();
    orm.em.clear();

    const publishers3 = await orm.em.findAll(Publisher2, {
      populate: ['tests:ref'],
      strategy: 'joined',
      orderBy: { id: 1 },
    });
    expect(publishers3).toBeInstanceOf(Array);
    expect(publishers3.length).toBe(2);
    expect(publishers3[0]).toBeInstanceOf(Publisher2);
    expect(publishers3[0].tests).toBeInstanceOf(Collection);
    expect(publishers3[0].tests.isInitialized()).toBe(true);
    expect(publishers3[0].tests.isInitialized(true)).toBe(true); // empty collection
    expect(publishers3[0].tests.isDirty()).toBe(false);
    expect(publishers3[0].tests.count()).toBe(0);
    expect(publishers3[1].tests.isInitialized(true)).toBe(false); // collection with references only
    expect(wrap(publishers3[1].tests[0]).isInitialized()).toBe(false);

    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "p0".*, "t1"."publisher2_id" "t1__publisher2_id", "t1"."test2_id" "t1__test2_id" from "publisher2" "p0" left join "publisher2_tests" "t1" on "p0"."id" = "t1"."publisher2_id" order by "p0"."id" asc, "t1"."id" asc',
    );
    mock.mockReset();
    orm.em.clear();

    const publishers4 = await orm.em.findAll(Publisher2, {
      orderBy: { id: 1 },
    });
    await orm.em.populate(publishers4, ['tests:ref']);
    expect(publishers4).toBeInstanceOf(Array);
    expect(publishers4.length).toBe(2);
    expect(publishers4[0]).toBeInstanceOf(Publisher2);
    expect(publishers4[0].tests).toBeInstanceOf(Collection);
    expect(publishers4[0].tests.isInitialized()).toBe(true);
    expect(publishers4[0].tests.isInitialized(true)).toBe(true); // empty collection
    expect(publishers4[0].tests.isDirty()).toBe(false);
    expect(publishers4[0].tests.count()).toBe(0);
    expect(publishers4[1].tests.isInitialized(true)).toBe(false); // collection with references only
    expect(wrap(publishers4[1].tests[0]).isInitialized()).toBe(false);

    orm.em.clear();
    const publishers5 = await orm.em.findAll(Publisher2, {
      orderBy: { id: 1 },
    });
    mock.mockReset();
    await publishers5[0].tests.init({ ref: true });
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "p0"."id", "p0"."test2_id", "p0"."publisher2_id" from "publisher2_tests" "p0" where "p0"."publisher2_id" in (1) order by "p0"."id" asc',
    );
    await publishers5[1].tests.init({ ref: true });
    expect(publishers5).toBeInstanceOf(Array);
    expect(publishers5.length).toBe(2);
    expect(publishers5[0]).toBeInstanceOf(Publisher2);
    expect(publishers5[0].tests).toBeInstanceOf(Collection);
    expect(publishers5[0].tests.isInitialized()).toBe(true);
    expect(publishers5[0].tests.isInitialized(true)).toBe(true); // empty collection
    expect(publishers5[0].tests.isDirty()).toBe(false);
    expect(publishers5[0].tests.count()).toBe(0);
    expect(publishers5[1].tests.isInitialized(true)).toBe(false); // collection with references only
    expect(wrap(publishers5[1].tests[0]).isInitialized()).toBe(false);
  });

  test('many to many relation (ref: true)', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    await orm.em.persist([book1, book2, book3]).flush();
    orm.em.clear();

    const mock = mockLogger(orm);
    const bt1 = await orm.em.findOneOrFail(BookTag2, tag1.id, {
      populate: ['books:ref'],
      strategy: 'joined',
      filters: false,
    });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b1"."book_tag2_id" "b1__book_tag2_id", "b1"."book2_uuid_pk" "b1__book2_uuid_pk" ' +
        'from "book_tag2" "b0" ' +
        'left join "book2_tags" "b1" on "b0"."id" = "b1"."book_tag2_id" ' +
        `where "b0"."id" = '1' ` +
        'order by "b1"."order" asc',
    );
    expect(bt1.books.isInitialized()).toBe(true);
    expect(bt1.books.isInitialized(true)).toBe(false);
    expect(wrap(bt1.books[0]).isInitialized()).toBe(false);
    orm.em.clear();
    mock.mockReset();

    const bt2 = await orm.em.findOneOrFail(BookTag2, tag1.id, {
      populate: ['books:ref'],
      strategy: 'select-in',
      filters: false,
    });
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "b0".* from "book_tag2" "b0" where "b0"."id" = '1' fetch next 1 rows`,
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "b0"."order", "b0"."book2_uuid_pk", "b0"."book_tag2_id" ' +
        'from "book2_tags" "b0" ' +
        `where "b0"."book_tag2_id" in ('1') ` +
        'order by "b0"."order" asc',
    );
    expect(bt2.books.isInitialized()).toBe(true);
    expect(bt2.books.isInitialized(true)).toBe(false);
    expect(wrap(bt2.books[0]).isInitialized()).toBe(false);
  });

  test('one to many relation (ref: true)', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    await orm.em.persist([book1, book2, book3]).flush();
    orm.em.clear();
    const mock = mockLogger(orm);
    const a1 = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['books:ref'],
      strategy: 'joined',
    });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "a0".*, "b1"."uuid_pk" "b1__uuid_pk", "f2"."uuid_pk" "f2__uuid_pk" from "author2" "a0" left join "book2" "b1" on "a0"."id" = "b1"."author_id" and "b1"."author_id" is not null left join "book2" "f2" on "a0"."favourite_book_uuid_pk" = "f2"."uuid_pk" and "f2"."author_id" is not null where "a0"."id" = 1 order by "b1"."title" asc',
    );
    expect(a1.books.isInitialized()).toBe(true);
    expect(a1.books.isInitialized(true)).toBe(false);
    expect(wrap(a1.books[0]).isInitialized()).toBe(false);
    orm.em.clear();
    mock.mockReset();

    const a2 = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['books:ref'],
      strategy: 'select-in',
    });
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "a0".*, "f1"."uuid_pk" "f1__uuid_pk" from "author2" "a0" left join "book2" "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null where "a0"."id" = 1 fetch next 1 rows',
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "b0"."uuid_pk", "b0"."author_id" from "book2" "b0" where "b0"."author_id" is not null and "b0"."author_id" in (1) order by "b0"."title" asc',
    );
    expect(a2.books.isInitialized()).toBe(true);
    expect(a2.books.isInitialized(true)).toBe(false);
    expect(wrap(a2.books[0]).isInitialized()).toBe(false);
  });

  test('populating many to many relation with explicit schema name', async () => {
    const p1 = new Label('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Label('bar');
    p2.tests.add(new Test2(), new Test2());
    await orm.em.persist([p1, p2]).flush();
    const repo = orm.em.getRepository(Label);

    orm.em.clear();
    const labels = await repo.findAll({ populate: ['tests'] });
    expect(labels).toBeInstanceOf(Array);
    expect(labels.length).toBe(2);
    expect(labels[0]).toBeInstanceOf(Label);
    expect(labels[0].tests).toBeInstanceOf(Collection);
    expect(labels[0].tests.isInitialized()).toBe(true);
    expect(labels[0].tests.isDirty()).toBe(false);
    expect(labels[0].tests.count()).toBe(0);
    await labels[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(labels[1].tests.getItems()[0]).isInitialized()).toBe(true);
  });

  test('em.create(ref) does not mark reference as loaded', async () => {
    await createBooksWithTags();

    const p = await orm.em.findOneOrFail(Book2, { uuid: { $ne: null } });
    expect(p.publisher!.isInitialized()).toBe(false);
    const b1 = orm.em.create(Book2, {
      author: p.author,
      publisher: p.publisher,
    });
    expect(p.publisher!.isInitialized()).toBe(false);
    expect(b1.publisher!.isInitialized()).toBe(false);
  });

  test('populating many to many relation on inverse side', async () => {
    await createBooksWithTags();
    const repo = orm.em.getRepository(BookTag2);
    const tags = await repo.findAll({ populate: ['books'] });
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag2);
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books.getItems()[0]).isInitialized()).toBe(true);
  });

  test('populating dirty collections will merge the items and keep it dirty', async () => {
    await createBooksWithTags();

    const a = await orm.em.findOneOrFail(Author2, { email: 'snow@wall.st' });
    expect(a.books.isDirty()).toBe(false);
    a.books.add(new Book2('new book', a, 123));
    expect(a.books.isDirty()).toBe(true);

    const mock = mockLogger(orm, ['query']);
    const books = await a.books.loadItems();
    expect(a.books.isDirty()).toBe(false);
    expect(books).toHaveLength(4);
    expect(books.map(b => b.title)).toEqual([
      'My Life on The Wall, part 1',
      'My Life on The Wall, part 2',
      'My Life on The Wall, part 3',
      'new book',
    ]);

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(
      `insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`,
    );
    expect(mock.mock.calls[2][0]).toMatch(`commit`);
    expect(mock.mock.calls[3][0]).toMatch(
      `select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null and "b0"."author_id" in (?) order by "b0"."title" asc`,
    );
  });

  test('nested populating', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book1.publisher = wrap(new Publisher2('B1 publisher')).toReference();
    book1.publisher.unwrap().tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.publisher = wrap(new Publisher2('B2 publisher')).toReference();
    book2.publisher.unwrap().tests.add(Test2.create('t21'), Test2.create('t22'));
    book3.publisher = wrap(new Publisher2('B3 publisher')).toReference();
    book3.publisher.unwrap().tests.add(Test2.create('t31'), Test2.create('t32'));
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]).flush();
    const repo = orm.em.getRepository(BookTag2);

    orm.em.clear();
    const tags = await repo.findAll({ populate: ['books.publisher.tests', 'books.author'] });
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag2);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books[0]).isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags[0].books[0].author).isInitialized()).toBe(true);
    expect(tags[0].books[0].author.name).toBe('Jon Snow');
    expect(tags[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags[0].books[0].publisher!).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags[0].books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(tags[0].books[0].publisher!.unwrap().tests[1].name).toBe('t12');

    orm.em.clear();
    const books = await orm.em.findAll(Book2, {
      populate: ['publisher.tests', 'author'],
      orderBy: { title: QueryOrder.ASC },
    });
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book2);
    expect(wrap(books[0]).isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author2);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Reference);
    expect(books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(books[0].publisher!.isInitialized()).toBe(true);
    expect(books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher!.unwrap().tests[1].name).toBe('t12');

    // #5711
    orm.em.clear();
    const [book] = await orm.em.findAll(Book2, {
      populate: ['publisher'],
      orderBy: { title: QueryOrder.ASC },
    });
    const perex = await book.perex?.load({});
    expect(perex).toBe(undefined);
    expect(book.publisher?.isInitialized()).toBe(true);
    // @ts-ignore
    expect(book.publisher!.__meta).toBeInstanceOf(EntityMetadata);
    expect(book.publisher!.unwrap().tests.isInitialized(true)).toBe(false);
    await book.publisher!.load({ populate: ['tests'] });
    expect(book.publisher!.isInitialized()).toBe(true);
    expect(book.publisher!.unwrap().tests.isInitialized(true)).toBe(true);
  });

  test('hooks', async () => {
    Author2.beforeDestroyCalled = 0;
    Author2.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author2);
    const author = repo.create({ name: 'Jon Snow', email: 'snow@wall.st' });
    expect(author.id).toBeUndefined();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();
    expect(author.code).toBe('snow@wall.st - Jon Snow');

    await orm.em.persist(author).flush();
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await orm.em.persist(author).flush();
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author2.beforeDestroyCalled).toBe(0);
    expect(Author2.afterDestroyCalled).toBe(0);
    await orm.em.remove(author).flush();
    expect(Author2.beforeDestroyCalled).toBe(1);
    expect(Author2.afterDestroyCalled).toBe(1);

    const author2 = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persist(author2).flush();
    await orm.em.remove(author2).flush();
    expect(Author2.beforeDestroyCalled).toBe(2);
    expect(Author2.afterDestroyCalled).toBe(2);
  });

  test('populate queries respect the root condition (query condition propagation)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]).flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res = await orm.em.findAll(Author2, {
      where: { books: { title: { $in: ['b1', 'b2'] } } },
      populate: ['books.perex'],
      strategy: 'select-in',
    });
    expect(res).toHaveLength(1);
    expect(res[0].books.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "a0".*, "f1"."uuid_pk" "f1__uuid_pk" from "author2" "a0" left join "book2" "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null left join "book2" "b2" on "a0"."id" = "b2"."author_id" and "b2"."author_id" is not null where "b2"."title" in (?, ?)',
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null and "b0"."author_id" in (?) order by "b0"."title" asc',
    );
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persist(author).flush();
    orm.em.clear();

    await expect(repo.findAll({ populate: ['tests'] as never })).rejects.toThrow(
      `Entity 'Author2' does not have property 'tests'`,
    );
    await expect(repo.findOne(author.id, { populate: ['tests'] as never })).rejects.toThrow(
      `Entity 'Author2' does not have property 'tests'`,
    );
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository(Publisher2);
    const publisher = new Publisher2();
    const t1 = Test2.create('t1');
    const t2 = Test2.create('t2');
    const t3 = Test2.create('t3');
    await orm.em.persist([t1, t2, t3]).flush();
    publisher.tests.add(t2, t1, t3);
    await orm.em.persist(publisher).flush();
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id, { populate: ['tests'] }))!;
    expect(ent.tests.count()).toBe(3);
    expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);
  });

  test('property onUpdate hook (updatedAt field)', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    expect(author.createdAt).toBeDefined();
    expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);
    await orm.em.persist(author).flush();

    author.name = 'name1';
    await orm.em.persist(author).flush();
    expect(author.createdAt).toBeDefined();
    expect(author.updatedAt).toBeDefined();
    expect(author.updatedAt).not.toEqual(author.createdAt);
    expect(author.updatedAt > author.createdAt).toBe(true);

    orm.em.clear();
    const ent = (await repo.findOne(author.id))!;
    expect(ent.createdAt).toBeDefined();
    expect(ent.updatedAt).toBeDefined();
    expect(ent.updatedAt).not.toEqual(ent.createdAt);
    expect(ent.updatedAt > ent.createdAt).toBe(true);
  });

  test('EM supports native insert/update/delete', async () => {
    const res1 = await orm.em.insert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author2, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author2, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.insert(Author2, {
      createdAt: new Date('1989-11-17'),
      updatedAt: new Date('2018-10-28'),
      name: 'native name 2',
      email: 'native2@email.com',
    });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(
      Author2,
      { name: 'native name 2' },
      { name: 'new native name', updatedAt: new Date('2018-10-28') },
    );
    expect(res5).toBe(1);

    const author = orm.em.getReference(Author2, res4);
    const b = orm.em.create(Book2, { uuid: v4(), author, title: 'native name 2' }); // do not provide createdAt, default value from DB will be used
    await orm.em.persist(b).flush();
    expect(b.createdAt).toBeDefined();
    expect(b.createdAt).toBeInstanceOf(Date);

    const mock = mockLogger(orm, ['query', 'query-params']);
    await orm.em.insert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(mock.mock.calls[0][0]).toMatch(
      'insert into "author2" ("name", "email") values (\'native name 1\', \'native1@email.com\') returning "id", "created_at", "updated_at"',
    );
  });

  test('self referencing (2 step)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]).flush();
    author.favouriteAuthor = author;
    await orm.em.persist(author).flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(wrap(a1).toJSON()).toMatchObject({ favouriteAuthor: a1.id });
  });

  test('self referencing (1 step)', async () => {
    const mock = mockLogger(orm, ['query']);

    const author = new Author2('name', 'email');
    author.favouriteAuthor = author;
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]).flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(wrap(a1).toJSON()).toMatchObject({ favouriteAuthor: a1.id });

    // check fired queries
    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?)',
    );
    expect(mock.mock.calls[2][0]).toMatch(
      'insert into "book2" ("uuid_pk", "created_at", "title", "author_id") values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)',
    );
    expect(mock.mock.calls[3][0]).toMatch(
      'update "author2" set "favourite_author_id" = ?, "updated_at" = ? where "id" = ?',
    );
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch(
      'select "a0".*, "f1"."uuid_pk" "f1__uuid_pk" from "author2" "a0" left join "book2" "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null where "a0"."id" = ? fetch next ? rows',
    );
  });

  test('allow assigning PK to undefined/null', async () => {
    const test = new Test2({ name: 'name' });
    await orm.em.persist(test).flush();
    expect(test.id).toBeDefined();
  });

  test('find with custom function', async () => {
    const author = new Author2('name', 'email');
    author.age = 123;
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]).flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const books1 = await orm.em.find(
      Book2,
      {
        [sql.upper('"title"')]: ['B1', 'B2'],
        author: {
          [raw(a => `"${a}"."age"`)]: { $like: '%2%' },
        },
      },
      { populate: ['perex'] },
    );
    expect(books1).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" inner join "author2" "a1" on "b0"."author_id" = "a1"."id" where "b0"."author_id" is not null and "a1"."age" like '%2%' and upper("title") in ('B1', 'B2')`,
    );
    orm.em.clear();

    const books2 = await orm.em.find(
      Book2,
      {
        [sql.upper('"title"')]: raw('upper(?)', ['b2']),
      },
      { populate: ['perex'] },
    );
    expect(books2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(
      `select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null and upper("title") = upper('b2')`,
    );
  });

  test('insert with raw sql fragment', async () => {
    const author = orm.em.create(Author2, { id: 1, name: 'name', email: 'email', age: raw('100 + 20 + 3') });
    const mock = mockLogger(orm, ['query', 'query-params']);
    expect(() => (author.age as number)++).toThrow();
    expect(() => JSON.stringify(author)).toThrow();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      /insert into "author2" \("id", "created_at", "updated_at", "name", "email", "age", "terms_accepted"\) values \(1, timestamp '.*', timestamp '.*', 'name', 'email', 100 \+ 20 \+ 3, false\) returning "age" into :out_age/,
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');

    expect(author.age).toBe(123);
  });

  test('update reference with null', async () => {
    await orm.em.insertMany(Author2, [
      { id: 1, name: 'name', email: 'email1', age: 123 },
      { id: 2, name: 'name', email: 'email2', age: 1, favouriteAuthor: 1 },
    ]);
    const ref2 = orm.em.getReference(Author2, 2);

    const mock = mockLogger(orm, ['query', 'query-params']);
    ref2.favouriteAuthor = null;
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      /update "author2" set "favourite_author_id" = null, "updated_at" = timestamp '.*' where "id" = 2/,
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');

    expect(ref2.favouriteAuthor).toBeNull();
  });

  test('update with raw sql fragment', async () => {
    await orm.em.insertMany(Author2, [
      { id: 1, name: 'name', email: 'email1', age: 123 },
      { id: 2, name: 'name', email: 'email2', age: 1 },
    ]);
    const ref1 = await orm.em.findOneOrFail(Author2, 1);
    const ref2 = await orm.em.findOneOrFail(Author2, 2);

    const mock = mockLogger(orm, ['query', 'query-params']);
    ref1.age = sql`"age" * 2`;
    expect(() => (ref1.age as number)++).toThrow();
    expect(() => JSON.stringify(ref1)).toThrow();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      /update "author2" set "age" = "age" \* 2, "updated_at" = timestamp '.*' where "id" = 1 returning "age" into :out_age/,
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');

    expect(ref1.age).toBe(246);
  });

  test('update with raw sql fragment (batch)', async () => {
    await orm.em.insertMany(Author2, [
      { id: 1, name: 'name 1', email: 'email 1', age: 123 },
      { id: 2, name: 'name 2', email: 'email 2', age: 222 },
    ]);
    const mock = mockLogger(orm, ['query', 'query-params']);

    const ref1 = orm.em.getReference(Author2, 1);
    const ref2 = orm.em.getReference(Author2, 2);
    ref1.age = raw(`"age" * 2`);
    ref2.age = raw(`"age" / 2`);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      /update "author2" set "age" = case when \("id" = 1\) then "age" \* 2 when \("id" = 2\) then "age" \/ 2 else "age" end, "updated_at" = case when \("id" = 1\) then timestamp '.*' when \("id" = 2\) then timestamp '.*' else "updated_at" end where "id" in \(1, 2\) returning "age", "id" into :out_age, :out_id/,
    );
    expect(mock.mock.calls[2][0]).toMatch('commit');

    expect(ref1.age).toBe(246);
    expect(ref2.age).toBe(111);
  });

  test('find by joined property', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const t1 = Test2.create('t1');
    t1.book = book1;
    const t2 = Test2.create('t2');
    t2.book = book2;
    const t3 = Test2.create('t3');
    t3.book = book3;
    author.books.add(book1, book2, book3);
    await orm.em.persist([author, t1, t2, t3]).flush();
    author.favouriteBook = book3;
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['perex'] });
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeUndefined();
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'where "b0"."author_id" is not null and "a1"."name" = ?',
    );

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(
      Book2,
      { author: { favouriteBook: { author: { name: 'Jon Snow' } } } },
      { populate: ['perex'] },
    );
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'left join ("book2" "b2" inner join "author2" "a3" on "b2"."author_id" = "a3"."id") on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
        'where "b0"."author_id" is not null and "a3"."name" = ?',
    );

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, { populate: ['perex'] });
    expect(res3).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'where "b0"."author_id" is not null and "a1"."favourite_book_uuid_pk" = ?',
    );

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(
      Book2,
      { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } },
      { populate: ['perex'] },
    );
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'left join ("book2" "b2" inner join "author2" "a3" on "b2"."author_id" = "a3"."id") on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
        'where "b0"."author_id" is not null and "a3"."name" = ?',
    );
  });

  test('populate: $infer', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.perex = ref('asd 1');
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.perex = ref('asd 2');
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.perex = ref('asd 3');
    const t1 = Test2.create('t1');
    t1.book = book1;
    const t2 = Test2.create('t2');
    t2.book = book2;
    const t3 = Test2.create('t3');
    t3.book = book3;
    author.books.add(book1, book2, book3);
    await orm.em.persist([author, t1, t2, t3]).flush();
    author.favouriteBook = book3;
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res2 = await orm.em.find(
      Book2,
      { author: { favouriteBook: { author: { name: 'Jon Snow' } } } },
      { populate: ['perex', '$infer'] },
    );
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(wrap(res2[0]).toObject()).toMatchObject({
      title: 'My Life on The Wall, part 1',
      perex: 'asd 1',
      author: {
        id: 1,
        name: 'Jon Snow',
        email: 'snow@wall.st',
        favouriteBook: {
          title: 'My Life on The Wall, part 3',
          perex: 'asd 3',
          author: {
            name: 'Jon Snow',
            email: 'snow@wall.st',
          },
        },
      },
    });
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0".*, "b0"."price" * 1.19 as "price_taxed", ' +
        '"a1"."id" "a1__id", "a1"."created_at" "a1__created_at", "a1"."updated_at" "a1__updated_at", "a1"."name" "a1__name", "a1"."email" "a1__email", "a1"."age" "a1__age", "a1"."terms_accepted" "a1__terms_accepted", "a1"."optional" "a1__optional", "a1"."identities" "a1__identities", "a1"."born" "a1__born", "a1"."born_time" "a1__born_time", "a1"."favourite_book_uuid_pk" "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" "a1__favourite_author_id", "a1"."identity" as "a1__identity", ' +
        '"b2"."uuid_pk" "b2__uuid_pk", "b2"."created_at" "b2__created_at", "b2"."isbn" "b2__isbn", "b2"."title" "b2__title", "b2"."price" "b2__price", "b2"."price" * 1.19 as "b2__price_taxed", "b2"."double" "b2__double", "b2"."meta" as "b2__meta", "b2"."author_id" "b2__author_id", "b2"."publisher_id" "b2__publisher_id", ' +
        '"a3"."id" "a3__id", "a3"."created_at" "a3__created_at", "a3"."updated_at" "a3__updated_at", "a3"."name" "a3__name", "a3"."email" "a3__email", "a3"."age" "a3__age", "a3"."terms_accepted" "a3__terms_accepted", "a3"."optional" "a3__optional", "a3"."identities" "a3__identities", "a3"."born" "a3__born", "a3"."born_time" "a3__born_time", "a3"."favourite_book_uuid_pk" "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" "a3__favourite_author_id", "a3"."identity" as "a3__identity" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'left join ("book2" "b2" inner join "author2" "a3" on "b2"."author_id" = "a3"."id") on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
        'where "b0"."author_id" is not null and "a3"."name" = ?',
    );

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(
      Book2,
      { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } },
      { populate: ['$infer'] },
    );
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed", ' +
        '"a1"."id" "a1__id", "a1"."created_at" "a1__created_at", "a1"."updated_at" "a1__updated_at", "a1"."name" "a1__name", "a1"."email" "a1__email", "a1"."age" "a1__age", "a1"."terms_accepted" "a1__terms_accepted", "a1"."optional" "a1__optional", "a1"."identities" "a1__identities", "a1"."born" "a1__born", "a1"."born_time" "a1__born_time", "a1"."favourite_book_uuid_pk" "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" "a1__favourite_author_id", "a1"."identity" as "a1__identity", ' +
        '"b2"."uuid_pk" "b2__uuid_pk", "b2"."created_at" "b2__created_at", "b2"."isbn" "b2__isbn", "b2"."title" "b2__title", "b2"."price" "b2__price", "b2"."price" * 1.19 as "b2__price_taxed", "b2"."double" "b2__double", "b2"."meta" as "b2__meta", "b2"."author_id" "b2__author_id", "b2"."publisher_id" "b2__publisher_id", ' +
        '"a3"."id" "a3__id", "a3"."created_at" "a3__created_at", "a3"."updated_at" "a3__updated_at", "a3"."name" "a3__name", "a3"."email" "a3__email", "a3"."age" "a3__age", "a3"."terms_accepted" "a3__terms_accepted", "a3"."optional" "a3__optional", "a3"."identities" "a3__identities", "a3"."born" "a3__born", "a3"."born_time" "a3__born_time", "a3"."favourite_book_uuid_pk" "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" "a3__favourite_author_id", "a3"."identity" as "a3__identity" ' +
        'from "book2" "b0" ' +
        'inner join "author2" "a1" on "b0"."author_id" = "a1"."id" ' +
        'left join ("book2" "b2" inner join "author2" "a3" on "b2"."author_id" = "a3"."id") on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
        'where "b0"."author_id" is not null and "a3"."name" = ?',
    );
    expect(wrap(res4[0]).toObject()).toMatchObject({
      title: 'My Life on The Wall, part 1',
      author: {
        id: 1,
        name: 'Jon Snow',
        email: 'snow@wall.st',
        favouriteBook: {
          title: 'My Life on The Wall, part 3',
          author: {
            name: 'Jon Snow',
            email: 'snow@wall.st',
          },
        },
      },
    });
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author2('n', 'e');
    author.createdAt = new Date('2000-01-01T00:00:00Z');
    await orm.em.persist(author).flush();
    orm.em.clear();

    const res = await orm.em.execute<{ created_at: string }[]>(
      `select to_char("created_at" at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.FF6') as "created_at" from "author2" where "id" = ${author.id}`,
    );
    expect(res[0].created_at).toBe('2000-01-01 00:00:00.000000');
    const a = await orm.em.findOneOrFail(Author2, author.id);
    expect(+a.createdAt!).toBe(+author.createdAt);
    const a1 = await orm.em.findOneOrFail(Author2, { createdAt: { $eq: a.createdAt } });
    expect(+a1.createdAt!).toBe(+author.createdAt);
    expect(orm.em.merge(a1)).toBe(a1);
    const a2 = await orm.em.findOneOrFail(Author2, { updatedAt: { $eq: a.updatedAt } });
    expect(+a2.updatedAt!).toBe(+author.updatedAt);
  });

  test('simple derived entity', async () => {
    const author = new Author2('n', 'e');
    author.id = 5;
    author.address = new Address2(author, 'v1');
    await orm.em.persist(author).flush();
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author2, author.id, { populate: ['address'] });
    expect(a1.address!.value).toBe('v1');
    expect(a1.address!.author).toBe(a1);

    a1.address!.value = 'v2';
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author.id, { populate: ['address'] });
    expect(a2.address!.value).toBe('v2');
    expect(a2.address!.author).toBe(a2);

    const address = await orm.em.findOneOrFail(Address2, author.id as any);
    expect(address.author).toBe(a2);
    expect(address.author.address).toBe(address);

    await orm.em.remove(a2).flush();
    const a3 = await orm.em.findOne(Author2, author.id);
    expect(a3).toBeNull();
    const address2 = await orm.em.findOne(Address2, author.id as any);
    expect(address2).toBeNull();
  });

  test('remove by unfetched entity', async () => {
    await orm.em.insert(Author2, { id: 5, name: 'n', email: 'e' });
    const author = new Author2('n', 'e');
    author.id = 5;
    const mock = mockLogger(orm);
    await orm.em.remove(author).flush();
    expect(mock).toHaveBeenCalled();
  });

  test('pagination', async () => {
    for (let i = 1; i <= 10; i++) {
      const num = `${i}`.padStart(2, '0');
      const god = new Author2(`God ${num}`, `hello${num}@heaven.god`);
      const b1 = new Book2(`Bible ${num}.1`, god);
      const b2 = new Book2(`Bible ${num}.2`, god);
      const b3 = new Book2(`Bible ${num}.3`, god);
      orm.em.persist([b1, b2, b3]);
    }

    await orm.em.flush();
    orm.em.clear();

    // without paginate flag it fails to get only 2 records (we need to explicitly disable it)
    const res1 = await orm.em.find(
      Author2,
      { books: { title: /^Bible/ } },
      {
        orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
        offset: 3,
        limit: 5,
        flags: [QueryFlag.DISABLE_PAGINATE],
      },
    );

    expect(res1).toHaveLength(2);
    expect(res1.map(a => a.name)).toEqual(['God 02', 'God 03']);

    const mock = mockLogger(orm, ['query']);

    // with paginate flag (and a bit of dark sql magic) we get what we want
    const res2 = await orm.em.find(
      Author2,
      { books: { title: /^Bible/ } },
      {
        orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
        offset: 3,
        limit: 5,
        flags: [QueryFlag.PAGINATE],
        filters: false,
      },
    );

    expect(res2).toHaveLength(5);
    expect(res2.map(a => a.name)).toEqual(['God 04', 'God 05', 'God 06', 'God 07', 'God 08']);
    expect(mock.mock.calls[0][0]).toMatch(
      'select "a0".* ' +
        'from "author2" "a0" ' +
        'left join "book2" "b1" on "a0"."id" = "b1"."author_id" and "b1"."title" like ? where "a0"."id" in (select "a0"."id" ' +
        'from (select "a0"."id" ' +
        'from "author2" "a0" ' +
        'left join "book2" "b1" on "a0"."id" = "b1"."author_id" ' +
        'where "b1"."title" like ? group by "a0"."id" order by min("a0"."name") asc, min("b1"."title") asc offset ? rows fetch next ? rows only' +
        ') "a0"' +
        ') order by "a0"."name" asc, "b1"."title" asc',
    );
  });

  test('custom types', async () => {
    await orm.em.insert(FooBar2, { id: 123, name: 'n1', array: [1, 2, 3] });
    await orm.em.insert(FooBar2, { id: 456, name: 'n2', array: [] });

    const bar = FooBar2.create('b1 "b" \'1\'');
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.blob2 = new Uint8Array([1, 2, 3, 4, 5]);
    bar.array = [];
    bar.objectProperty = { foo: `bar 'lol' baz "foo"`, bar: 3 };
    await orm.em.persist(bar).flush();
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.blob2).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(b1.blob2).toBeInstanceOf(Uint8Array);
    expect(b1.array).toEqual(null); // empty array gets serialized to empty string, which is null in oracle
    expect(b1.objectProperty).toEqual({ foo: `bar 'lol' baz "foo"`, bar: 3 });
    expect(b1.objectProperty).toBeInstanceOf(Object);
    expect(b1.objectProperty!.bar).toBe(3);

    b1.objectProperty = 'foo';
    b1.array = [1, 2, 3, 4, 5];
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b2.objectProperty).toBe('foo');
    expect(b2.array).toEqual([1, 2, 3, 4, 5]);
    expect(b2.array![2]).toBe(3);

    b2.objectProperty = [1, 2, '3'];
    await orm.em.flush();
    orm.em.clear();

    const b3 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b3.objectProperty[0]).toBe(1);
    expect(b3.objectProperty[1]).toBe(2);
    expect(b3.objectProperty[2]).toBe('3');

    b3.objectProperty = 123;
    await orm.em.flush();
    orm.em.clear();

    const b4 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b4.objectProperty).toBe(123);
  });

  test('should allow to find by array of PKs', async () => {
    await orm.em.getDriver().nativeInsertMany(Author2, [
      { id: 1, name: 'n1', email: 'e1' },
      { id: 2, name: 'n2', email: 'e2' },
      { id: 3, name: 'n3', email: 'e3' },
    ]);
    const repo = orm.em.getRepository(Author2);
    const res = await repo.find([1, 2, 3], { orderBy: { id: 1 } });
    expect(res.map(a => a.id)).toEqual([1, 2, 3]);
  });

  test('exceptions', async () => {
    await orm.driver.nativeInsert(Author2, { name: 'author', email: 'email' });
    await expect(orm.em.upsert(Author2, { name: 'author', email: 'email', favouriteAuthor: 123 })).rejects.toThrow(
      ForeignKeyConstraintViolationException,
    );
    await expect(
      orm.em.upsertMany(Author2, [{ name: 'author', email: 'email', favouriteAuthor: 123 }]),
    ).rejects.toThrow(ForeignKeyConstraintViolationException);
    await expect(orm.driver.nativeInsert(Author2, { name: 'author', email: 'email' })).rejects.toThrow(
      UniqueConstraintViolationException,
    );
    await expect(orm.driver.nativeInsert(Author2, {})).rejects.toThrow(NotNullConstraintViolationException);
    await expect(orm.driver.execute('create table "author2" (foo clob not null)')).rejects.toThrow(
      TableExistsException,
    );
    await expect(orm.driver.execute('foo bar 123')).rejects.toThrow(SyntaxErrorException);
    await expect(orm.driver.execute('select "id" from "author2", "foo_bar2"')).rejects.toThrow(
      NonUniqueFieldNameException,
    );
    await expect(orm.driver.execute('select "uuid" from "author2"')).rejects.toThrow(InvalidFieldNameException);
  });

  test('question marks and parameter interpolation (GH issue #920)', async () => {
    const e = new FooBaz2(`?baz? uh \\? ? wut? \\\\ wut`);
    await orm.em.persist(e).flush();
    const e2 = await orm.em.fork().findOneOrFail(FooBaz2, e);
    expect(e2.name).toBe(`?baz? uh \\? ? wut? \\\\ wut`);
    const res = await orm.em.execute('select ? as count', [1]);
    expect(res[0].count).toBe(1);
  });

  test('mapping to raw PKs instead of entities', async () => {
    const t1 = new Test2({ name: 't1' });
    const t2 = new Test2({ name: 't2' });
    const t3 = new Test2({ name: 't3' });
    await orm.em.persist([t1, t2, t3]).flush();
    t1.parent = t2.id;
    await orm.em.flush();
    orm.em.clear();

    const tt1 = await orm.em.findOneOrFail(Test2, t1.id);
    expect(tt1.parent).toBe(t2.id);

    tt1.parent = t3.id;
    await orm.em.flush();
    orm.em.clear();

    const ttt1 = await orm.em.findOneOrFail(Test2, t1.id);
    expect(ttt1.parent).toBe(t3.id);
  });

  test('populating relations should not send update changesets when using custom types (GH issue 864)', async () => {
    class Subscriber implements EventSubscriber {
      static readonly log: ChangeSet<AnyEntity>[][] = [];

      async afterFlush(args: FlushEventArgs): Promise<void> {
        Subscriber.log.push(args.uow.getChangeSets());
      }
    }

    const em = orm.em.fork();
    em.getEventManager().registerSubscriber(new Subscriber());

    const a = new Author2('1stA', 'e1');
    a.born = '2023-03-23';
    const b = new Book2('1stB', a);

    await em.persist(b).flush();
    em.clear();

    // Comment this out and the test will pass
    await em.findOneOrFail(Book2, { title: '1stB' }, { populate: ['author'] });

    const newA = new Author2('2ndA', 'e2');
    newA.born = '2023-03-23';
    const newB = new Book2('2ndB', newA);
    newB.author = newA;
    await em.persist(newB).flush();

    expect(Subscriber.log).toHaveLength(2);
    const updates = Subscriber.log.reduce((x, y) => x.concat(y), []).filter(c => c.type === ChangeSetType.UPDATE);
    expect(updates).toHaveLength(0);
    Subscriber.log.length = 0;
  });

  test('working with global identity map will throw', async () => {
    orm.config.set('allowGlobalContext', false);

    const err =
      "Using global EntityManager instance methods for context specific actions is disallowed. If you need to work with the global instance's identity map, use `allowGlobalContext` configuration option or `fork()` instead.";
    expect(() => orm.em.create(Author2, { name: 'a1', email: 'e1' })).toThrow(err);
    const author = new Author2('a', 'e');
    expect(() => orm.em.persist(author)).toThrow(err);
    expect(() => orm.em.assign(author, { name: 'b' })).toThrow(err);
    expect(() => orm.em.assign(author, { books: ['1', '2', '3'] })).toThrow(err);
    await expect(orm.em.flush()).rejects.toThrow(err);

    const fork = orm.em.fork();
    await expect(fork.flush()).resolves.not.toThrow();
    expect(() => fork.create(Author2, { name: 'a1', email: 'e1' })).not.toThrow();
    expect(() => fork.persist(author)).not.toThrow();
    expect(() => fork.assign(author, { name: 'b' })).not.toThrow();
    expect(() => fork.assign(author, { books: ['1', '2', '3'] })).not.toThrow();

    orm.config.set('allowGlobalContext', true);
  });

  test('working with global identity map will not throw if disableIdentityMap is used', async () => {
    orm.config.set('allowGlobalContext', false);
    orm.config.set('disableIdentityMap', true);

    await orm.em.insert(FooBar2, { name: 'bar 1' });
    const res1 = await orm.em.getRepository(FooBar2).find({});
    expect(res1).toHaveLength(1);

    const res2 = await orm.em.find(FooBar2, {}, { disableIdentityMap: true });
    expect(res2).toHaveLength(1);

    await expect(orm.em.find(FooBar2, {}, { disableIdentityMap: false })).rejects.toThrow(
      /Using global EntityManager instance methods for context specific actions is disallowed/,
    );

    orm.config.set('allowGlobalContext', true);
    orm.config.set('disableIdentityMap', false);
  });

  test('Collection.init() returns Loaded type', async () => {
    await createBooksWithTags();
    const a = await orm.em.findOneOrFail(Author2, { email: 'snow@wall.st' });
    const b = await a.books.init({ populate: ['publisher', 'tags'] });
    expect(b.$[0].publisher?.$.id).toBe(1);
  });

  test('creating unmanaged entity reference', async () => {
    await orm.em.insertMany(Publisher2, [
      { id: 1, name: 'p 1', type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { id: 2, name: 'p 2', type: PublisherType.GLOBAL, type2: PublisherType2.GLOBAL },
    ]);
    const a = new Author2('a', 'e');
    const b = new Book2('t', a, 123);
    b.publisher = Reference.createFromPK(Publisher2, 1);

    const mock = mockLogger(orm, ['query']);

    // not managed reference
    expect(wrap(b.publisher, true).__em).toBeUndefined();
    await orm.em.persist(b).flush();
    // after flush it will become managed
    expect(wrap(b.publisher, true).__em).toBe(orm.em);

    // or will get replaced by existing managed reference to same entity
    b.publisher = Reference.createFromPK(Publisher2, 2);
    expect(wrap(b.publisher, true).__em).toBeUndefined();
    const ref2 = orm.em.getReference(Publisher2, 2);
    expect(wrap(ref2, true).__em).toBe(orm.em);
    await orm.em.flush();
    expect(wrap(b.publisher, true).__em).toBe(orm.em);
    expect(b.publisher.unwrap()).toBe(ref2);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age',
    );
    expect(mock.mock.calls[2][0]).toMatch(
      'insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id", "publisher_id") values (?, ?, ?, ?, ?, ?)',
    );
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update "book2" set "publisher_id" = ? where "uuid_pk" = ?');
    expect(mock.mock.calls[6][0]).toMatch('commit');

    mock.mockReset();
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
    mock.mockRestore();
  });

  test('flushing via Promise.all()', async () => {
    const mock = mockLogger(orm, ['query']);

    const ret = await Promise.all([
      (async () => {
        const a = new Author2('a1', 'e1');
        const b = new Book2('t1', a, 123);
        await orm.em.persist(b).flush();
        return b;
      })(),
      (async () => {
        const a = new Author2('a2', 'e2');
        const b = new Book2('t2', a, 456);
        await orm.em.persist(b).flush();
        return b;
      })(),
      (async () => {
        const a = new Author2('a3', 'e3');
        const b = new Book2('t3', a, 789);
        await orm.em.persist(b).flush();
        return b;
      })(),
    ]);

    // flushing things at the same tick will even batch the queries
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      `begin execute immediate 'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age' using out :out_id__0, out :out_age__0; execute immediate 'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age' using out :out_id__1, out :out_age__1; execute immediate 'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age' using out :out_id__2, out :out_age__2; end;`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      'insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
    );
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock).toHaveBeenCalledTimes(4);

    expect(ret.map(b => b.author.id)).toEqual([1, 2, 3]);
    expect(ret.map(b => b.author.name)).toEqual(['a1', 'a2', 'a3']);

    mock.mockReset();

    const ret2 = await Promise.all([
      (async () => {
        const a = new Author2('a4', 'e4');
        const b = new Book2('t4', a, 123);
        while (!orm.em.getReference(Author2, 5, { wrapped: true }).isInitialized()) {
          await new Promise(r => setImmediate(r));
        }
        await orm.em.persist(b).flush();
        return b;
      })(),
      (async () => {
        const a = new Author2('a5', 'e5');
        const b = new Book2('t5', a, 456);
        while (!orm.em.getReference(Author2, 3, { wrapped: true }).isInitialized()) {
          await new Promise(r => setImmediate(r));
        }
        await orm.em.persist(b).flush();
        return b;
      })(),
      (async () => {
        const a = new Author2('a6', 'e6');
        const b = new Book2('t6', a, 789);
        while (!orm.em.getReference(Author2, 4, { wrapped: true }).isInitialized()) {
          await new Promise(r => setImmediate(r));
        }
        await orm.em.persist(b).flush();
        return b;
      })(),
    ]);

    expect(ret2.map(b => b.author.id)).toEqual([6, 4, 5]);
    expect(ret2.map(b => b.author.name)).toEqual(['a4', 'a5', 'a6']);

    // flushing things at different time will create multiple transactions
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(
      `insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`,
    );
    expect(mock.mock.calls[3][0]).toMatch(`commit`);
    expect(mock.mock.calls[4][0]).toMatch(`begin`);
    expect(mock.mock.calls[5][0]).toMatch(
      `insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`,
    );
    expect(mock.mock.calls[6][0]).toMatch(
      `insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`,
    );
    expect(mock.mock.calls[7][0]).toMatch(`commit`);
    expect(mock.mock.calls[8][0]).toMatch(`begin`);
    expect(mock.mock.calls[9][0]).toMatch(
      `insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`,
    );
    expect(mock.mock.calls[10][0]).toMatch(
      `insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`,
    );
    expect(mock.mock.calls[11][0]).toMatch(`commit`);
    expect(mock).toHaveBeenCalledTimes(12);

    mock.mockRestore();
  });

  test('GH #2934', async () => {
    // This test used to be flaky in CI where it runs with fewer resources. To mimic this behaviour, we can run it with
    // larger payload and many times in a row via turning `heavy` to `true`.
    const heavy = false; // heavy mode takes around 10 minutes to complete (half a million entities, each doing select + insert)
    const length = heavy ? 50 : 4;
    const runs = heavy ? 10000 : 3;

    const users = Array.from({ length }).map((_, i) => ({ name: `name ${i}`, email: `email ${i}` }));

    async function saveUser(options: FilterQuery<Author2>): Promise<Author2> {
      let user = await orm.em.findOne(Author2, options);

      if (!user) {
        user = orm.em.create(Author2, options as any);
        await orm.em.persist(user).flush();
      }

      expect(user.id).toBeDefined();

      return user;
    }

    for (let i = 0; i < runs; i++) {
      await orm.em.nativeDelete(Author2, {});
      orm.em.clear();
      const res = await Promise.all(users.map(userData => saveUser(userData)));
      res.forEach(user => expect(user.id).toBeDefined());
    }
  });

  test('required fields validation', async () => {
    const jon = new Author2('Jon', undefined as any);
    await expect(orm.em.persist(jon).flush()).rejects.toThrow(`Value for Author2.email is required, 'undefined' found`);

    orm.config.set('validateRequired', false);
    await expect(orm.em.persist(jon).flush()).rejects.toThrow(
      `ORA-01400: cannot insert NULL into ("mikro_orm_test_2"."author2"."email")`,
    );
    await expect(orm.em.persist(jon).flush()).rejects.toThrow(NotNullConstraintViolationException);
    orm.config.set('validateRequired', true);
  });

  test('changing PK', async () => {
    const bar = new FooBar2();
    bar.name = 'abc';
    expect(bar.id).toBeUndefined();
    await orm.em.persist(bar).flush();
    expect(bar.id).toBe(1);
    bar.id = 321;

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch(
      `update "foo_bar2" set "id" = 321, "version" = current_timestamp where "id" = 1 and "version" = `,
    );

    const c = await orm.em.fork().findOne(FooBar2, bar);
    expect(c).toBeDefined();
    expect(c!.id).toBe(321);
  });

  test('validation in em.populate() for non discovered entities', async () => {
    await expect(orm.em.populate({}, ['foo'] as never[])).rejects.toThrow(
      `Trying to populate not discovered entity of type object.`,
    );
    class Book2 {}
    await expect(orm.em.populate(new Book2(), ['author'] as never[])).rejects.toThrow(
      'Trying to populate not discovered entity of type Book2. ' +
        'Entity with this name was discovered, but not the prototype you are passing to the ORM. If using EntitySchema, be sure to point to the implementation via `class`.',
    );
  });

  test('changing PK (batch)', async () => {
    const bars = [FooBar2.create('abc 1'), FooBar2.create('abc 2')];
    expect(bars[0].id).toBeUndefined();
    expect(bars[1].id).toBeUndefined();
    await orm.em.persist(bars).flush();
    expect(bars[0].id).toBe(1);
    expect(bars[1].id).toBe(2);
    bars[0].id = 321;
    bars[1].id = 322;

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(4);
    expect(mock.mock.calls[1][0]).toMatch(
      'select "f0"."id" from "foo_bar2" "f0" where (("f0"."id" = ? and "f0"."version" = ?) or ("f0"."id" = ? and "f0"."version" = ?))',
    );
    expect(mock.mock.calls[2][0]).toMatch(
      'update "foo_bar2" set "id" = case when ("id" = ?) then ? when ("id" = ?) then ? else "id" end, "version" = current_timestamp where "id" in (?, ?) returning "id", "version" into :out_id, :out_version',
    );

    const c1 = await orm.em.fork().findOne(FooBar2, bars[0]);
    expect(c1).toBeDefined();
    expect(c1!.id).toBe(321);

    const c2 = await orm.em.fork().findOne(FooBar2, bars[1]);
    expect(c2).toBeDefined();
    expect(c2!.id).toBe(322);
  });
});
