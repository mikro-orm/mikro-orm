import { v4 } from 'uuid';
import {
  AnyEntity,
  ChangeSet,
  DefaultLogger,
  EntityMetadata,
  EventSubscriber,
  FilterQuery,
  FlushEventArgs,
  RawQueryFragment,
} from '@mikro-orm/core';
import {
  ChangeSetType,
  Collection,
  Configuration,
  EntityManager,
  ForeignKeyConstraintViolationException,
  InvalidFieldNameException,
  IsolationLevel,
  LoadStrategy,
  LockMode,
  MikroORM,
  NonUniqueFieldNameException,
  NotNullConstraintViolationException,
  PopulateHint,
  QueryFlag,
  QueryOrder,
  raw,
  ref,
  sql,
  Reference,
  SyntaxErrorException,
  TableExistsException,
  TableNotFoundException,
  UniqueConstraintViolationException,
  ValidationError,
  wrap,
} from '@mikro-orm/core';
import { PostgreSqlConnection, PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  FooBar2,
  FooBaz2,
  Label2,
  Publisher2,
  PublisherType,
  PublisherType2,
  Test2,
} from './entities-sql';
import { initORMPostgreSql, mockLogger } from './bootstrap';
import { performance } from 'node:perf_hooks';
import { Test2Subscriber } from './subscribers/Test2Subscriber';

describe('EntityManagerPostgre', () => {

  let orm: MikroORM<PostgreSqlDriver>;

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
    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();
  }

  beforeAll(async () => orm = await initORMPostgreSql());
  beforeEach(async () => orm.schema.clearDatabase());
  afterEach(() => expect(RawQueryFragment.checkCacheSize()).toBe(0));
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    expect(await orm.checkConnection()).toEqual({
      ok: true,
    });
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    const check = await orm.checkConnection();
    expect(check).toMatchObject({
      ok: false,
      reason: 'Connection not established',
    });
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
    expect(await orm.checkConnection()).toEqual({
      ok: true,
    });
  });

  test('getConnectionOptions()', async () => {
    const config = new Configuration({
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      logger: jest.fn(),
      forceUtcTimezone: true,
    } as any, false);
    const driver = new PostgreSqlDriver(config);
    expect(driver.getConnection().mapOptions({})).toMatchObject({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      port: 1234,
      user: 'user',
    });
  });

  test('raw query with array param', async () => {
    const q1 = orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [[1, 2, 3], 3]);
    expect(q1).toBe('select * from author2 where id in (1, 2, 3) limit 3');
    const q2 = orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [['1', '2', '3'], 3]);
    expect(q2).toBe(`select * from author2 where id in ('1', '2', '3') limit 3`);
  });

  test('should return postgre driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(PostgreSqlDriver);
    await expect(driver.findOne<Book2>(Book2.name, { double: 123 })).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name' });
    const uuid1 = v4();
    await expect(driver.nativeInsert(Book2.name, { uuid: uuid1, author: author.insertId, tags: [tag.insertId] })).resolves.not.toBeNull();
    await expect(driver.nativeUpdate(Book2.name, { uuid: uuid1 }, { title: 'booook' })).resolves.not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: { count: 1 },
      rows: [{ count: 1 }],
    });
    await expect(driver.getConnection().execute('insert into test2 (name) values (?) returning id', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: { id: 1 },
      rows: [{ id: 1 }],
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: undefined,
      rows: [],
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: undefined,
      rows: [],
    });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find<BookTag2>(BookTag2.name, { books: { $in: [uuid1] } })).resolves.not.toBeNull();
    expect(driver.getPlatform().formatQuery('CREATE USER ?? WITH PASSWORD ?', ['foo', 'bar'])).toBe(`CREATE USER "foo" WITH PASSWORD 'bar'`);
    expect(driver.getPlatform().formatQuery('select \\?, ?, ?', ['foo', 'bar'])).toBe(`select ?, 'foo', 'bar'`);
    expect(driver.getPlatform().formatQuery('? = ??', ['foo', 'bar'])).toBe(`'foo' = "bar"`);

    // multi inserts
    await driver.nativeInsert(Test2.name, { id: 1, name: 't1' });
    await driver.nativeInsert(Test2.name, { id: 2, name: 't2' });
    await driver.nativeInsert(Test2.name, { id: 3, name: 't3' });
    await driver.nativeInsert(Test2.name, { id: 4, name: 't4' });
    await driver.nativeInsert(Test2.name, { id: 5, name: 't5' });

    const mock = mockLogger(orm, ['query']);

    const res = await driver.nativeInsertMany(Publisher2.name, [
      { name: 'test 1', tests: [1, 3, 4], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { name: 'test 2', tests: [4, 2], type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { name: 'test 3', tests: [1, 5, 2], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);

    expect(mock.mock.calls[0][0]).toMatch('/* foo */ insert into "publisher2" ("name", "type", "type2") values (?, ?, ?), (?, ?, ?), (?, ?, ?) returning "id"');
    expect(mock.mock.calls[1][0]).toMatch('/* foo */ insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?), (?, ?), (?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('/* foo */ insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?), (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('/* foo */ insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?), (?, ?), (?, ?)');

    // postgres returns all the ids based on returning clause
    expect(res).toMatchObject({ insertId: 1, affectedRows: 3, row: { id: 1 }, rows: [ { id: 1 }, { id: 2 }, { id: 3 } ] });
    const res2 = await driver.find(Publisher2.name, {});
    expect(res2).toMatchObject([
      { id: 1, name: 'test 1', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { id: 2, name: 'test 2', type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { id: 3, name: 'test 3', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);
  });

  test('multi insert maps PKs', async () => {
    const tests = [1, 2, 3, 4, 5].map(n => orm.em.create(Test2, { name: `n${n}` }, { persist: false }));
    await orm.em.insertMany(tests);
    expect(tests.map(t => t.id)).toEqual([1, 2, 3, 4, 5]);
    expect(orm.em.getUnitOfWork().getIdentityMap().values()).toHaveLength(0);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = 'relation "not_existing" does not exist';
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(err1);
    const err2 = 'relation "not_existing" does not exist';
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrow(err2);
  });

  test('connection returns correct URL', async () => {
    const conn1 = new PostgreSqlConnection(new Configuration({
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://example.host.com',
      port: 1234,
      user: 'usr',
      password: 'pw',
    }, false));
    await expect(conn1.getClientUrl()).toBe('postgre://usr:*****@example.host.com:1234');
    const conn2 = new PostgreSqlConnection(new Configuration({ driver: PostgreSqlDriver, port: 5433 } as any, false));
    await expect(conn2.getClientUrl()).toBe('postgresql://postgres@127.0.0.1:5433');
  });

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    author.termsAccepted = true;
    author.favouriteAuthor = author;
    await orm.em.persistAndFlush(author);
    const a = await repo.findOne(author);
    const authors = await repo.find({ favouriteAuthor: author });
    expect(a).toBe(author);
    expect(authors[0]).toBe(author);
    await expect(repo.findOne({ termsAccepted: false })).resolves.toBeNull();
  });

  test('transactions', async () => {
    const god1 = new Author2('God1', 'hello@heaven1.god');
    try {
      await orm.em.transactional(async em => {
        await em.persistAndFlush(god1);
        throw new Error(); // rollback the transaction
      });
    } catch { }

    const res1 = await orm.em.findOne(Author2, { name: 'God1' });
    expect(res1).toBeNull();

    const ret = await orm.em.transactional(async em => {
      const god2 = new Author2('God2', 'hello@heaven2.god');
      em.persist(god2);
      return true;
    });

    const res2 = await orm.em.findOne(Author2, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god3 = new Author2('God4', 'hello@heaven4.god');
        em.persist(god3);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res3 = await orm.em.findOne(Author2, { name: 'God4' });
      expect(res3).toBeNull();
    }
  });

  test('collections loaded in a transaction can be refreshed after transaction is committed', async () => {
    const god = new Author2('god', 'god@test.com');
    const believer = new Author2('believer', 'believer@test.com');
    await orm.em.persistAndFlush([god, believer]);
    orm.em.clear();

    const believerFromTx = await orm.em.transactional(async () => {
      const believerFromTx = await orm.em.findOneOrFail(
        Author2,
        { name: 'believer' },
        { populate: ['following'] },
      );
      believerFromTx.following.add(god);
      return believerFromTx;
    });

    const gods = await believerFromTx.following.loadItems({ refresh: true });
    expect(gods.map(a => a.name)).toEqual(['god']);
  });

  test('transactions with isolation levels', async () => {
    const mock = mockLogger(orm, ['query']);

    const god1 = new Author2('God1', 'hello@heaven1.god');
    try {
      await orm.em.transactional(async em => {
        await em.persistAndFlush(god1);
        throw new Error(); // rollback the transaction
      }, { isolationLevel: IsolationLevel.READ_UNCOMMITTED });
    } catch { }

    expect(mock.mock.calls[0][0]).toMatch('start transaction isolation level read uncommitted');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('read-only transactions', async () => {
    const mock = mockLogger(orm, ['query']);

    const god1 = new Author2('God1', 'hello@heaven1.god');
    await expect(orm.em.transactional(async em => {
      await em.persistAndFlush(god1);
    }, { readOnly: true, isolationLevel: IsolationLevel.READ_COMMITTED })).rejects.toThrow(/cannot execute INSERT in a read-only transaction/);

    expect(mock.mock.calls[0][0]).toMatch('start transaction isolation level read committed read only');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const god1 = new Author2('God1', 'hello1@heaven.god');

      try {
        await em.transactional(async em2 => {
          await em2.persistAndFlush(god1);
          throw new Error(); // rollback the transaction
        });
      } catch { }

      const res1 = await em.findOne(Author2, { name: 'God1' });
      expect(res1).toBeNull();

      await em.transactional(async em2 => {
        const god2 = new Author2('God2', 'hello2@heaven.god');
        await em2.persistAndFlush(god2);
      });

      const res2 = await em.findOne(Author2, { name: 'God2' });
      expect(res2).not.toBeNull();
    });
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = mockLogger(orm, ['query']);

    // start outer transaction
    await orm.em.transactional(async em => {
      // do stuff inside inner transaction and rollback
      try {
        await em.transactional(async em2 => {
          await em2.persistAndFlush(new Author2('God', 'hello@heaven.god'));
          throw new Error(); // rollback the transaction
        });
      } catch { }

      em.persist(new Author2('God Persisted!', 'hello-persisted@heaven.god'));
    });

    // try to commit the outer transaction
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id"');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id"');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('collection loads items after savepoint should not fail', async () => {
    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);
    const book = new Book2('My Life on The Wall, part 1', new Author2('name', 'email'));
    book.publisher = ref(publisher);

    const author = new Author2('Bartleby', 'bartelby@writer.org');
    author.books.add(book);

    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();
    await em.begin();

    const book2 = await em.findOneOrFail(Book2, book.uuid);
    const publisher2 = await book2.publisher!.loadOrFail({ populate: ['tests'], lockMode: LockMode.PESSIMISTIC_WRITE });

    await em.transactional(async () => {
      //
    });

    expect(publisher2.books.isInitialized(true)).toBe(false);
    const books1 = await publisher2.books.load({ lockMode: LockMode.PESSIMISTIC_WRITE });
    const books2 = await publisher2.books.load({ lockMode: LockMode.PESSIMISTIC_WRITE });
    expect(books1).toBeInstanceOf(Collection);
    expect(books1.isInitialized(true)).toBe(true);
    expect(books1).toBe(books2);
    await em.commit();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."uuid_pk" = ? limit ?`);
    expect(mock.mock.calls[2][0]).toMatch(`select "p0".* from "publisher2" as "p0" where "p0"."id" = ? limit ? for update`);
    expect(mock.mock.calls[3][0]).toMatch(`select "t1".*, "p0"."test2_id" as "fk__test2_id", "p0"."publisher2_id" as "fk__publisher2_id" from "publisher2_tests" as "p0" inner join "test2" as "t1" on "p0"."test2_id" = "t1"."id" where "p0"."publisher2_id" in (?) order by "p0"."id" asc for update`);
    expect(mock.mock.calls[4][0]).toMatch(`savepoint trx`);
    expect(mock.mock.calls[5][0]).toMatch(`release savepoint trx`);
    expect(mock.mock.calls[6][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."publisher_id" in (?) for update`);
    expect(mock.mock.calls[7][0]).toMatch(`commit`);
  });

  test('em.commit/rollback validation', async () => {
    await expect(orm.em.commit()).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.rollback()).rejects.toThrow('An open transaction is required for this operation');
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates2]', async () => {
    expect(Test2Subscriber.log).toEqual([]);
    const qb = orm.em.createQueryBuilder(Test2).insert({ name: '123' });
    qb.setLoggerContext({ label: 'foo', bar: 123 });
    expect(qb.getLoggerContext()).toEqual({ label: 'foo', bar: 123 });
    const logSpy = jest.spyOn(DefaultLogger.prototype, 'log');
    const a = await qb;
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][2]).toMatchObject({
      id: orm.em.id,
      label: 'foo',
      bar: 123,
      query: expect.any(String),
      affected: 1,
      took: expect.any(Number),
    });
    logSpy.mockRestore();

    const r1 = await orm.em.createQueryBuilder(Test2).where({ name: '123' });
    orm.em.clear();
    const test = new Test2();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persistAndFlush(test);
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }

    expect(Test2Subscriber.log.map(r => r[0])).toEqual([
      'onFlush',
      'afterFlush',
      'onFlush',
      'afterFlush',
      'onFlush',
      'afterFlush',
      'onFlush',
      'afterFlush',
      'onFlush',
      'afterFlush',
    ]);
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god, 0.01);
    bible.double = 123.45;
    await orm.em.persistAndFlush(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    const book1 = new Book2('My Life on The Wall, part 1', author, 1.11);
    book1.publisher = ref(publisher);
    const book2 = new Book2('My Life on The Wall, part 2', author, 2.22);
    book2.publisher = ref(publisher);
    const book3 = new Book2('My Life on The Wall, part 3', author, 3.33);
    book3.publisher = ref(publisher);

    orm.em.persist(book1);
    orm.em.persist(book2);
    orm.em.persist(book3);
    await orm.em.flush();
    orm.em.clear();

    const publisher7k = (await orm.em.getRepository(Publisher2).findOne({ name: '7K publisher' }))!;
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(false);
    orm.em.clear();

    const authorRepository = orm.em.getRepository(Author2);
    const booksRepository = orm.em.getRepository(Book2);
    const books = await booksRepository.findAll({ populate: ['author'] });
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(typeof books[0].double).toBe('number');
    expect(books[0].double).toBe(123.45);
    expect(typeof books[0].price).toBe('number');
    expect(books[0].price).toBe(0.01);
    await expect(authorRepository.findOne({ favouriteBook: bible.uuid })).resolves.not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, { populate: ['author'] });
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }, { populate: ['books', 'favouriteBook'] }))!;
    const authors = await authorRepository.findAll({ populate: ['books', 'favouriteBook'] });
    await expect(authorRepository.findOne({ email: 'not existing' })).resolves.toBeNull();

    // full text search test
    const fullTextBooks = (await booksRepository.find({ title: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);

    // count test
    const count = await authorRepository.count();
    expect(count).toBe(authors.length);

    const count2 = await authorRepository.count({ favouriteBook: v4() }, { groupBy: 'email' });
    expect(count2).toBe(0);

    // identity map test
    authors.shift(); // shift the god away, as that entity is detached from IM
    expect(jon).toBe(authors[0]);
    expect(jon).toBe(await authorRepository.findOne(jon.id));

    // serialization test
    const o = wrap(jon).toJSON();
    expect(o).toMatchObject({
      id: jon.id,
      createdAt: jon.createdAt,
      updatedAt: jon.updatedAt,
      books: [
        { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 1' },
        { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 2' },
        { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 3' },
      ],
      favouriteBook: { author: god.id, title: 'Bible' },
      born: '1990-03-23',
      email: 'snow@wall.st',
      name: 'Jon Snow',
    });
    expect(wrap(jon).toJSON()).toEqual(o);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('string');
    expect(jon.books.getIdentifiers()[0]).toBe(book1.uuid);

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);

        expect(book.author).toBeInstanceOf(Author2);
        expect(wrap(book.author).isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Reference);
        expect(book.publisher!.unwrap()).toBeInstanceOf(Publisher2);
        expect(book.publisher!.isInitialized()).toBe(false);
      }
    }

    const booksByTitleAsc = await booksRepository.find({ author: jon.id }, { orderBy: { title: QueryOrder.ASC } });
    expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
    expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

    const booksByTitleDesc = await booksRepository.find({ author: jon.id }, { orderBy: { title: QueryOrder.DESC } });
    expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
    expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

    const twoBooks = await booksRepository.find({ author: jon.id }, { orderBy: { title: QueryOrder.DESC }, limit: 2 });
    expect(twoBooks.length).toBe(2);
    expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
    expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

    const lastBook = await booksRepository.find({ author: jon.id }, {
      populate: ['author'],
      orderBy: { title: QueryOrder.DESC },
      limit: 2,
      offset: 2,
    });
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author2);
    expect(wrap(lastBook[0].author).isInitialized()).toBe(true);
    await orm.em.remove(lastBook[0]).flush();
  });

  test('json properties', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    god.identities = ['fb-123', 'pw-231', 'tw-321'];
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'god like', items: 3, valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const g = await orm.em.findOneOrFail(Author2, god.id, { populate: ['books'] });
    expect(Array.isArray(g.identities)).toBe(true);
    expect(g.identities).toEqual(['fb-123', 'pw-231', 'tw-321']);
    expect(typeof g.books[0].meta).toBe('object');
    expect(g.books[0].meta).toEqual({ category: 'god like', items: 3, valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } });
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(Book2, { meta: { category: 'god like' } });
    const b2 = await orm.em.findOneOrFail(Book2, { meta: { category: { $in: ['god like'] }, items: 3 } }); // supports operators (GH #1487)
    const b3 = await orm.em.findOneOrFail(Book2, { meta: { nested: { bar: 321 } } });
    const b4 = await orm.em.findOneOrFail(Book2, { meta: { nested: { foo: '123', bar: 321 } } });
    const b5 = await orm.em.findOneOrFail(Book2, { meta: { valid: true, nested: { foo: '123', bar: 321 } } });
    const b6 = await orm.em.findOneOrFail(Book2, { meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59 } } } });
    const b7 = await orm.em.findOneOrFail(Book2, { meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } } });
    expect(b1).toBe(b2);
    expect(b1).toBe(b3);
    expect(b1).toBe(b4);
    expect(b1).toBe(b5);
    expect(b1).toBe(b6);
    expect(b1).toBe(b7);
  });

  test('order by json properties', async () => {
    await orm.em.insert(Author2, { name: 'n', email: 'e', id: 1 });
    await orm.em.insertMany(Book2, [
      { uuid: '123e4567-e89b-12d3-a456-426614174001', title: 't1', author: 1, meta: { nested: { foo: '3', deep: { str: 'c', qux: false, baz: 3 } } } },
      { uuid: '123e4567-e89b-12d3-a456-426614174002', title: 't2', author: 1, meta: { nested: { foo: '2', deep: { str: 'b', qux: false, baz: 1 } } } },
      { uuid: '123e4567-e89b-12d3-a456-426614174003', title: 't3', author: 1, meta: { nested: { foo: '1', deep: { str: 'a', qux: false, baz: 2 } } } },
    ]);

    const res14 = await orm.em.fork().findAll(Book2, { orderBy: { meta: { nested: { foo: 'asc' } } } });
    expect(res14.map(r => r.title)).toEqual(['t3', 't2', 't1']);

    const res15 = await orm.em.fork().findAll(Book2, { orderBy: { meta: { nested: { deep: { str: 'asc' } } } } });
    expect(res15.map(r => r.title)).toEqual(['t3', 't2', 't1']);

    const res16 = await orm.em.fork().findAll(Book2, { orderBy: { meta: { nested: { deep: { baz: QueryOrder.DESC } } } } });
    expect(res16.map(r => r.title)).toEqual(['t1', 't3', 't2']);
  });

  test('properties with spaces in column names', async () => {
    const bar = new FooBar2();
    bar.name = 'n';
    bar.nameWithSpace = '123';
    await orm.em.fork().persistAndFlush(bar);

    const b1 = await orm.em.findOneOrFail(FooBar2, bar);
    expect(b1.nameWithSpace).toBe('123');
    b1.nameWithSpace = '456';
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, bar);
    expect(b2.nameWithSpace).toBe('456');
  });

  test('em.create and reference property in constructor parameters', async () => {
    const book = orm.em.create(Book2, { title: 'b', author: 1 });
    expect(wrap(book.author).isInitialized()).toBe(false);
  });

  test('unsetting 1:1 inverse (GH #1872)', async () => {
    const author = orm.em.create(Author2, { name: 'a', email: 'e' });
    const fb1 = orm.em.create(Test2, { name: 'fb 1' });
    const fb2 = orm.em.create(Test2, { name: 'fb 2' });
    const fz1 = orm.em.create(Book2, { title: 'fb 1', author });
    const fz2 = orm.em.create(Book2, { title: 'fb 2', author });
    fz1.test = fb1;
    await orm.em.persistAndFlush([fb1, fb2, fz1, fz2]);

    fz1.test = undefined;
    await orm.em.flush();
    orm.em.clear();

    const fz11 = await orm.em.findOneOrFail(Book2, fz1, { populate: ['test'] });
    expect(fz11.test).toBeNull();
  });

  test('json properties respect field names', async () => {
    const bar = new FooBar2();
    bar.name = 'b';
    bar.objectProperty = { myPropName: { nestedProperty: 123, somethingElse: null } };
    await orm.em.fork().persistAndFlush(bar);

    const mock = mockLogger(orm, ['query', 'query-params']);
    const em = orm.em.fork({ loggerContext: { label: 'foo', bar: 1 } });
    em.setLoggerContext({ label: 'foo', bar: 123 });
    expect(em.getLoggerContext()).toEqual({ label: 'foo', bar: 123 });
    const logSpy = jest.spyOn(DefaultLogger.prototype, 'log');
    const b0 = await em.findOneOrFail(FooBar2, bar, {
      logging: { label: 'foo 123' },
      loggerContext: { bar: 456, new: true },
    });
    expect(b0.objectProperty).toEqual({ myPropName: { nestedProperty: 123, somethingElse: null } });

    const b1 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { nestedProperty: { $in: [123] } } } });
    const b2 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { somethingElse: null } } });
    const b3 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { nestedProperty: [123], somethingElse: null } } });
    const b4 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { nestedProperty: 123, somethingElse: null } } });
    expect(b0).toBe(b1);
    expect(b0).toBe(b2);
    expect(b0).toBe(b3);
    expect(b0).toBe(b4);

    expect(mock.mock.calls).toHaveLength(5);
    expect(logSpy.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch(`select "f0".*, (select 123) as "random" from "foo_bar2" as "f0" where "f0"."id" = 1 limit 1`);
    expect(mock.mock.calls[0][0]).toMatch('(foo 123)');
    expect(logSpy.mock.calls[0][2]).toMatchObject({ id: em.id, label: 'foo 123', bar: 456, new: true });
    expect(mock.mock.calls[1][0]).toMatch(`select "f0".*, (select 123) as "random" from "foo_bar2" as "f0" where ("f0"."object_property"->'myPropName'->>'nestedProperty')::float8 in (123) limit 1`);
    expect(mock.mock.calls[1][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[1][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[2][0]).toMatch(`select "f0".*, (select 123) as "random" from "foo_bar2" as "f0" where "f0"."object_property"->'myPropName'->>'somethingElse' is null limit 1`);
    expect(mock.mock.calls[2][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[2][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[3][0]).toMatch(`select "f0".*, (select 123) as "random" from "foo_bar2" as "f0" where ("f0"."object_property"->'myPropName'->>'nestedProperty')::float8 in (123) and "f0"."object_property"->'myPropName'->>'somethingElse' is null limit 1`);
    expect(mock.mock.calls[3][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[3][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[4][0]).toMatch(`select "f0".*, (select 123) as "random" from "foo_bar2" as "f0" where ("f0"."object_property"->'myPropName'->>'nestedProperty')::float8 = 123 and "f0"."object_property"->'myPropName'->>'somethingElse' is null limit 1`);
    expect(mock.mock.calls[4][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[4][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author2, god.id);
    expect(wrap(ref).isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author2, god.id);
    expect(ref).toBe(newGod);
    expect(wrap(ref).isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    const author1 = new Author2('Author 1', 'a1@example.com');
    const author2 = new Author2('Author 2', 'a2@example.com');
    const author3 = new Author2('Author 3', 'a3@example.com');
    await orm.em.persistAndFlush([author1, author2, author3]);
    orm.em.clear();

    const authors = await orm.em.find(Author2, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
    orm.em.clear();

    const authors2 = await orm.em.find(Author2, { email: { $re: 'exa.*le.c.m$' } });
    expect(authors2.length).toBe(3);
    expect(authors2[0].name).toBe('Author 1');
    expect(authors2[1].name).toBe('Author 2');
    expect(authors2[2].name).toBe('Author 3');
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates]', async () => {
    const test = new Test2();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persistAndFlush(test);
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testStandardFailureThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    expect(typeof test.version).toBe('number');
    expect(test.version).toBe(1);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test2, test.id);
    await orm.em.nativeUpdate(Test2, { id: test.id }, { name: 'Changed!' }); // simulate concurrent update
    test2!.name = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe(`The optimistic lock on entity Test2 failed`);
      expect((e as ValidationError).getEntity()).toBe(test2);
    }
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const proxy = orm.em.getReference(Test2, test.id);
    await orm.em.lock(proxy, LockMode.OPTIMISTIC, 1);
    expect(wrap(proxy).isInitialized()).toBe(true);
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test2, test.id);
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [testOptimisticTimestampLockFailureThrowsException]', async () => {
    const bar = FooBar2.create('Testing');
    expect(bar.version).toBeUndefined();
    await orm.em.persistAndFlush(bar);
    expect(bar.version).toBeInstanceOf(Date);
    orm.em.clear();

    const bar2 = (await orm.em.findOne(FooBar2, bar.id))!;
    expect(bar2.version).toBeInstanceOf(Date);

    try {
      // Try to lock the record with an older timestamp and it should throw an exception
      const expectedVersionExpired = new Date(+bar2.version - 3600);
      await orm.em.lock(bar2, LockMode.OPTIMISTIC, expectedVersionExpired);
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect((e as ValidationError).getEntity()).toBe(bar2);
    }
  });

  test('findOne supports optimistic locking [unversioned entity]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrow('Cannot obtain optimistic lock on unversioned entity Author2');
  });

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [version mismatch]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrow('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrow('Entity Test2 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('batch updates increments version field (optimistic locking)', async () => {
    const tests = [
      new Test2({ name: 't1' }),
      new Test2({ name: 't2' }),
      new Test2({ name: 't3' }),
    ];
    await orm.em.persistAndFlush(tests);
    expect(tests.map(t => t.version)).toEqual([1, 1, 1]);
    tests.forEach(t => t.name += ' changed!');
    await orm.em.flush();
    expect(tests.map(t => t.version)).toEqual([2, 2, 2]);
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = Test2.create('Lock test');
    await orm.em.persistAndFlush(test);
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrow('An open transaction is required for this operation');
  });

  test('findOne supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = ? for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = ? for share');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;
    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE);
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = ? for update skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;
    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE, { lockTableAliases: ['a0'] });
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = ? for update of "a0" skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;
    await orm.em.transactional(async em => {
      await em.findAll(Book2, {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        lockTableAliases: ['b0'],
        populate: ['author'],
        strategy: LoadStrategy.JOINED,
      });
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed", "a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", "a1"."identity" as "a1__identity" from "book2" as "b0" left join "author2" as "a1" on "b0"."author_id" = "a1"."id" where "b0"."author_id" is not null for update of "b0" skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('locking and select-in population (GH #1670)', async () => {
    await createBooksWithTags();
    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.findAll(Book2, {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        populate: ['author', 'tags'],
        populateWhere: PopulateHint.INFER,
        strategy: LoadStrategy.SELECT_IN,
      });
    });
    expect(mock.mock.calls.length).toBe(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null for update skip locked`);
    expect(mock.mock.calls[2][0]).toMatch(`select "a0".* from "author2" as "a0" where "a0"."id" in (?) and "a0"."id" is not null for update skip locked`);
    expect(mock.mock.calls[3][0]).toMatch(`select "b1".*, "b0"."book_tag2_id" as "fk__book_tag2_id", "b0"."book2_uuid_pk" as "fk__book2_uuid_pk" from "book2_tags" as "b0" inner join "book_tag2" as "b1" on "b0"."book_tag2_id" = "b1"."id" where "b0"."book2_uuid_pk" in (?, ?, ?) order by "b0"."order" asc for update skip locked`);
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('stable results of serialization', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = (await orm.em.findOne(Author2, god.id))!;
    const books = await orm.em.find(Book2, {});
    await wrap(newGod).init();

    for (const book of books) {
      expect(wrap(book).toJSON()).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = new Publisher2('Publisher2');
    await orm.em.persistAndFlush(pub);
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(pub).toReference();
    const bible2 = new Book2('Bible pt. 2', god);
    bible2.publisher = wrap(pub).toReference();
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    bible3.publisher = wrap(pub).toReference();
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = orm.em.getReference(Author2, god.id);
    const publisher = (await orm.em.findOne(Publisher2, pub.id, { populate: ['books'] }))!;
    await wrap(newGod).init();

    const json = wrap(publisher).toJSON().books;

    for (const book of publisher.books) {
      expect(json.find(b => b.uuid === book.uuid)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization with partial loading', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    god.books.add(new Book2('Bible', god));
    await orm.em.fork().persistAndFlush(god);

    // when populating collections, the owner is selected automatically (here book.author)
    const newGod = await orm.em.findOneOrFail(Author2, god.id, {
      populate: ['books'],
      fields: ['books.title'],
    });
    const json = wrap(newGod).toJSON();
    // @ts-expect-error since v6, automatically selected FKs are no longer part of the serialized entity
    expect(json.books[0].author).toBeUndefined();
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(jon);

    orm.em.clear();
    let author = (await authorRepository.findOne(jon.id))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = (await authorRepository.findOne({ id: jon.id }))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');
  });

  test('populate ManyToOne relation via init()', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const publisher = new Publisher2('Publisher');
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = ref(publisher);
    await orm.em.persistAndFlush(bible);

    let jon = new Author2('Jon Snow', 'snow@wall.st');
    jon.born = '1990-03-23';
    jon.favouriteBook = bible;
    await orm.em.persistAndFlush(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.born).toEqual('1990-03-23');
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook!).isInitialized()).toBe(false);

    await wrap(jon.favouriteBook!).init();
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook!).isInitialized()).toBe(true);
    expect(jon.favouriteBook!.title).toBe('Bible');

    const em2 = orm.em.fork();
    const bible2 = await em2.findOneOrFail(Book2, { uuid: bible.uuid });
    expect(wrap(bible2, true).__em!.id).toBe(em2.id);
    expect(wrap(bible2.publisher!, true).__em!.id).toBe(em2.id);
    const publisher2 = await bible2.publisher!.loadOrFail();
    expect(wrap(publisher2, true).__em!.id).toBe(em2.id);
  });

  test('populating a relation does save its original entity data (GH issue 864)', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const b = await orm.em.findOneOrFail(Book2, bible.uuid, { populate: ['author'] });
    expect(wrap(b.author, true).__originalEntityData).toMatchObject({ name: 'God', email: 'hello@heaven.god' });
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }, { populate: ['baz'], refresh: true }))!;
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({ baz: { id: baz.id, bar: bar.id, name: 'baz' } });

    const mock = mockLogger(orm, ['query']);

    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(0);
  });

  test('populate OneToOne relation on inverse side', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // autoJoinOneToOneOwner: false
    const b0 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id });
    expect(mock.mock.calls[0][0]).toMatch('select "f0".* from "foo_baz2" as "f0" where "f0"."id" = ? limit ?');
    expect(b0.bar).toBeUndefined();
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id }, { populate: ['bar'] });
    expect(mock.mock.calls[1][0]).toMatch('select "f0".*, "b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."blob2" as "b1__blob2", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random" from "foo_baz2" as "f0" left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" where "f0"."id" = ? limit ?');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, { populate: ['bar'] });
    expect(mock.mock.calls[2][0]).toMatch('select "f0".*, "b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."blob2" as "b1__blob2", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random" from "foo_baz2" as "f0" left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" left join "foo_bar2" as "f2" on "f0"."id" = "f2"."baz_id" where "f2"."id" = ? limit ?');
    expect(mock.mock.calls).toHaveLength(3);
    expect(b2.bar).toBeInstanceOf(FooBar2);
    expect(b2.bar!.id).toBe(bar.id);
    expect(wrap(b2).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
  });

  test('populate OneToOne relation with uuid PK', async () => {
    const author = new Author2('name', 'email');
    const book = new Book2('b1', author);
    const test = Test2.create('t');
    test.book = book;
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const b1 = (await orm.em.findOne(Book2, { test: test.id }, { populate: ['test.config'] }))!;
    expect(b1.uuid).not.toBeNull();
    expect(wrap(b1).toJSON()).toMatchObject({ test: { id: test.id, book: test.book.uuid, name: 't' } });
  });

  test('batch update with OneToOne relation will use 2 queries (GH issue #1025)', async () => {
    const bar1 = FooBar2.create('bar 1');
    const bar2 = FooBar2.create('bar 2');
    const bar3 = FooBar2.create('bar 3');
    bar1.fooBar = bar2;
    await orm.em.persistAndFlush([bar1, bar3]);
    bar1.fooBar = undefined;
    bar3.fooBar = bar2;

    const mock = mockLogger(orm, ['query']);

    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "foo_bar2" set "foo_bar_id" = ?, "version" = ? where "id" = ? and "version" = ? returning "version"');
    expect(mock.mock.calls[2][0]).toMatch('update "foo_bar2" set "foo_bar_id" = ?, "version" = ? where "id" = ? and "version" = ? returning "version"');
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

  test('many to many relation', async () => {
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

    orm.em.persist(book1);
    orm.em.persist(book2);
    await orm.em.persistAndFlush(book3);

    expect(typeof tag1.id).toBe('bigint');
    expect(typeof tag2.id).toBe('bigint');
    expect(typeof tag3.id).toBe('bigint');
    expect(typeof tag4.id).toBe('bigint');
    expect(typeof tag5.id).toBe('bigint');

    // test inverse side
    const tagRepository = orm.em.getRepository(BookTag2);
    let tags = await tagRepository.findAll();
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag2);
    expect(tags[0].name).toBe('silly');
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.length).toBe(2);

    orm.em.clear();
    tags = await orm.em.find(BookTag2, {});
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrow(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrow(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrow(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);

    // test M:N lazy load
    orm.em.clear();
    tags = await tagRepository.findAll();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0]).toBeInstanceOf(Book2);
    expect(tags[0].books.getItems()[0].uuid).toBeDefined();
    expect(wrap(tags[0].books.getItems()[0]).isInitialized()).toBe(true);
    expect(tags[0].books.isInitialized()).toBe(true);
    const old = tags[0];
    expect(tags[1].books.isInitialized()).toBe(false);
    tags = await tagRepository.findAll({ populate: ['books'] as const });
    expect(tags[1].books.isInitialized()).toBe(true);
    expect(tags[0].id).toBe(old.id);
    expect(tags[0]).toBe(old);
    expect(tags[0].books).toBe(old.books);

    // test M:N lazy load
    orm.em.clear();
    let book = (await orm.em.findOne(Book2, { tags: tag1.id }))!;
    expect(book.tags.isInitialized()).toBe(false);
    await book.tags.init();
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag2);
    expect(book.tags.getItems()[0].id).toBeDefined();
    expect(wrap(book.tags.getItems()[0]).isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(t => t.id === tag1.id); // we need to get reference as tag1 is detached from current EM
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    book.tags.add(new BookTag2('fresh'));
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(3);

    // slice
    expect(book.tags.slice().length).toBe(3);
    expect(book.tags.slice(0, 1)).toEqual([book.tags[0]]);

    // exists
    expect(book.tags.exists(tag => tag === tagRepository.getReference(tag1.id))).toBe(true);
    expect(book.tags.exists(tag => tag === tagRepository.getReference(tag2.id))).toBe(false);

    // find
    expect(book.tags.find(tag => tag === tagRepository.getReference(tag1.id))).toEqual(tagRepository.getReference(tag1.id));
    expect(book.tags.find(() => false)).toBeUndefined();

    // filter
    expect(book.tags.filter(tag => tag === tagRepository.getReference(tag1.id))).toEqual([tagRepository.getReference(tag1.id)]);
    expect(book.tags.filter(() => false)).toEqual([]);

    // map
    expect(book.tags.map(tag => tag.name)).toEqual([tag3.name, tag1.name, 'fresh']);

    // contains
    expect(book.tags.contains(tagRepository.getReference(tag1.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag2.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag3.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag4.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag5.id))).toBe(false);

    // removeAll
    book.tags.removeAll();
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(0);
    expect(book.tags.isEmpty()).toBe(true);
  });

  test('bigint support', async () => {
    const t = new BookTag2('test');
    t.id = 9223372036854775807n;
    await orm.em.persistAndFlush(t);
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
    await orm.em.persistAndFlush([p1, p2]);
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
    expect(mock.mock.calls[0][0]).toMatch('select "p0".* from "publisher2" as "p0" order by "p0"."id" asc');
    expect(mock.mock.calls[1][0]).toMatch('select "p0"."test2_id" as "fk__test2_id", "p0"."publisher2_id" as "fk__publisher2_id" from "publisher2_tests" as "p0" where "p0"."publisher2_id" in (1, 2) order by "p0"."id" asc');
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
    expect(mock.mock.calls[0][0]).toMatch('select "p0".*, "t1"."publisher2_id" as "t1__publisher2_id", "t1"."test2_id" as "t1__test2_id" from "publisher2" as "p0" left join "publisher2_tests" as "t1" on "p0"."id" = "t1"."publisher2_id" order by "p0"."id" asc, "t1"."id" asc');
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
    expect(mock.mock.calls[0][0]).toMatch('select "p0"."test2_id" as "fk__test2_id", "p0"."publisher2_id" as "fk__publisher2_id" from "publisher2_tests" as "p0" where "p0"."publisher2_id" in (1) order by "p0"."id" asc');
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

    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();

    const mock = mockLogger(orm);
    const bt1 = await orm.em.findOneOrFail(BookTag2, tag1.id, {
      populate: ['books:ref'],
      strategy: 'joined',
      filters: false,
    });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b1"."book_tag2_id" as "b1__book_tag2_id", "b1"."book2_uuid_pk" as "b1__book2_uuid_pk" ' +
      'from "book_tag2" as "b0" ' +
      'left join "book2_tags" as "b1" on "b0"."id" = "b1"."book_tag2_id" ' +
      `where "b0"."id" = '1' ` +
      'order by "b1"."order" asc');
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
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "book_tag2" as "b0" where "b0"."id" = '1' limit 1`);
    expect(mock.mock.calls[1][0]).toMatch('select "b0"."book_tag2_id" as "fk__book_tag2_id", "b0"."book2_uuid_pk" as "fk__book2_uuid_pk" ' +
      'from "book2_tags" as "b0" ' +
      `where "b0"."book_tag2_id" in ('1') ` +
      'order by "b0"."order" asc');
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

    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();
    const mock = mockLogger(orm);
    const a1 = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['books:ref'],
      strategy: 'joined',
    });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0".*, "b1"."uuid_pk" as "b1__uuid_pk", "f2"."uuid_pk" as "f2__uuid_pk" from "author2" as "a0" left join "book2" as "b1" on "a0"."id" = "b1"."author_id" and "b1"."author_id" is not null left join "book2" as "f2" on "a0"."favourite_book_uuid_pk" = "f2"."uuid_pk" and "f2"."author_id" is not null where "a0"."id" = 1 order by "b1"."title" asc');
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
    expect(mock.mock.calls[0][0]).toMatch('select "a0".* from "author2" as "a0" where "a0"."id" = 1 limit 1');
    expect(mock.mock.calls[1][0]).toMatch('select "b0"."uuid_pk", "b0"."author_id" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."author_id" in (1) order by "b0"."title" asc');
    expect(a2.books.isInitialized()).toBe(true);
    expect(a2.books.isInitialized(true)).toBe(false);
    expect(wrap(a2.books[0]).isInitialized()).toBe(false);
  });

  test('populating many to many relation with explicit schema name', async () => {
    const p1 = new Label2('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Label2('bar');
    p2.tests.add(new Test2(), new Test2());
    await orm.em.persistAndFlush([p1, p2]);
    const repo = orm.em.getRepository(Label2);

    orm.em.clear();
    const publishers = await repo.findAll({ populate: ['tests'] });
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0]).toBeInstanceOf(Label2);
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized()).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);
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
    expect(a.books.isDirty()).toBe(true);
    await orm.em.flush();
    expect(a.books.isDirty()).toBe(false);
    expect(books).toHaveLength(4);
    expect(books.map(b => b.title)).toEqual([
      'My Life on The Wall, part 1',
      'My Life on The Wall, part 2',
      'My Life on The Wall, part 3',
      'new book',
    ]);

    expect(mock.mock.calls[0][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."author_id" in (?) order by "b0"."title" asc`);
    expect(mock.mock.calls[1][0]).toMatch(`begin`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`);
    expect(mock.mock.calls[3][0]).toMatch(`commit`);
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
    await orm.em.persistAndFlush([book1, book2, book3]);
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

    await orm.em.persistAndFlush(author);
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await orm.em.persistAndFlush(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author2.beforeDestroyCalled).toBe(0);
    expect(Author2.afterDestroyCalled).toBe(0);
    await orm.em.removeAndFlush(author);
    expect(Author2.beforeDestroyCalled).toBe(1);
    expect(Author2.afterDestroyCalled).toBe(1);

    const author2 = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persistAndFlush(author2);
    await orm.em.removeAndFlush(author2);
    expect(Author2.beforeDestroyCalled).toBe(2);
    expect(Author2.afterDestroyCalled).toBe(2);
  });

  test('populate queries respect the root condition (query condition propagation)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res = await orm.em.findAll(Author2, {
      where: { books: { title: { $in: ['b1', 'b2'] } } },
      populate: ['books.perex'],
    });
    expect(res).toHaveLength(1);
    expect(res[0].books.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('select "a0".*, "f1"."uuid_pk" as "f1__uuid_pk" from "author2" as "a0" left join "book2" as "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null left join "book2" as "b2" on "a0"."id" = "b2"."author_id" and "b2"."author_id" is not null where "b2"."title" in (?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."author_id" in (?) order by "b0"."title" asc');
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    await expect(repo.findAll({ populate: ['tests'] as never })).rejects.toThrow(`Entity 'Author2' does not have property 'tests'`);
    await expect(repo.findOne(author.id, { populate: ['tests'] as never })).rejects.toThrow(`Entity 'Author2' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository(Publisher2);
    const publisher = new Publisher2();
    const t1 = Test2.create('t1');
    const t2 = Test2.create('t2');
    const t3 = Test2.create('t3');
    await orm.em.persistAndFlush([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await orm.em.persistAndFlush(publisher);
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id, { populate: ['tests'] }))!;
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);
  });

  test('property onUpdate hook (updatedAt field)', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    await expect(author.createdAt).toBeDefined();
    await expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    await expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);
    await orm.em.persistAndFlush(author);

    author.name = 'name1';
    await orm.em.persistAndFlush(author);
    await expect(author.createdAt).toBeDefined();
    await expect(author.updatedAt).toBeDefined();
    await expect(author.updatedAt).not.toEqual(author.createdAt);
    await expect(author.updatedAt > author.createdAt).toBe(true);

    orm.em.clear();
    const ent = (await repo.findOne(author.id))!;
    await expect(ent.createdAt).toBeDefined();
    await expect(ent.updatedAt).toBeDefined();
    await expect(ent.updatedAt).not.toEqual(ent.createdAt);
    await expect(ent.updatedAt > ent.createdAt).toBe(true);
  });

  test('EM supports native insert/update/delete', async () => {
    const res1 = await orm.em.insert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author2, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author2, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.insert(Author2, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2', email: 'native2@email.com' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author2, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);

    const author = orm.em.getReference(Author2, res4);
    const b = orm.em.create(Book2, { uuid: v4(), author, title: 'native name 2' }); // do not provide createdAt, default value from DB will be used
    await orm.em.persistAndFlush(b);
    expect(b.createdAt).toBeDefined();
    expect(b.createdAt).toBeInstanceOf(Date);

    const mock = mockLogger(orm, ['query', 'query-params']);
    await orm.em.insert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(mock.mock.calls[0][0]).toMatch('insert into "author2" ("name", "email") values (\'native name 1\', \'native1@email.com\') returning "id", "created_at", "updated_at"');
    orm.config.set('debug', ['query']);
  });

  test('self referencing (2 step)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    author.favouriteAuthor = author;
    await orm.em.persistAndFlush(author);
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
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(wrap(a1).toJSON()).toMatchObject({ favouriteAuthor: a1.id });

    // check fired queries
    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into "book2" ("uuid_pk", "created_at", "title", "author_id") values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('update "author2" set "favourite_author_id" = ?, "updated_at" = ? where "id" = ?');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch('select "a0".*, "f1"."uuid_pk" as "f1__uuid_pk" from "author2" as "a0" left join "book2" as "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null where "a0"."id" = ? limit ?');
  });

  test('allow assigning PK to undefined/null', async () => {
    const test = new Test2({ name: 'name' });
    await orm.em.persistAndFlush(test);
    expect(test.id).toBeDefined();
  });

  test('find with custom function', async () => {
    const author = new Author2('name', 'email');
    author.age = 123;
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const books1 = await orm.em.find(Book2, {
      [sql.upper('title')]: ['B1', 'B2'],
      author: {
        [raw(a => `${a}.age::text`)]: { $ilike: '%2%' },
      },
    }, { populate: ['perex'] });
    expect(books1).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" left join "author2" as "a1" on "b0"."author_id" = "a1"."id" where "b0"."author_id" is not null and upper(title) in ('B1', 'B2') and a1.age::text ilike '%2%'`);
    orm.em.clear();

    const books2 = await orm.em.find(Book2, {
      [sql.upper('title')]: raw('upper(?)', ['b2']),
    }, { populate: ['perex'] });
    expect(books2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and upper(title) = upper('b2')`);
  });

  test('custom expressions require raw helper', async () => {
    await orm.em.insertMany(Author2, [
      { name: 'n1', email: 'e1' },
      { name: 'n2', email: 'e2' },
      { name: 'n3', email: 'e3' },
    ]);
    const mock = mockLogger(orm, ['query', 'query-params']);
    const res = await orm.em.find(Author2, {
      [sql`1 = 1 union select * from author2; --`]: 1,
    }, { filters: false });
    expect(res).toHaveLength(3);

    expect(mock.mock.calls[0][0]).toMatch('select "a0".* from "author2" as "a0" where 1 = 1 union select * from author2; --');

    await expect(orm.em.find(Author2, {
      // @ts-expect-error
      ['1 = 1 union select * from author2; --']: 1,
    })).rejects.toThrow('Trying to query by not existing property Author2.1 = 1 union select * from author2; --');

    await expect(orm.em.findAll(Author2, {
      orderBy: {
        // @ts-expect-error
        ['1; drop table author2 --']: 1,
      },
    })).rejects.toThrow('Trying to order by not existing property Author2.1; drop table author2 --');
  });

  test('insert with raw sql fragment', async () => {
    const author = orm.em.create(Author2, { id: 1, name: 'name', email: 'email', age: raw('100 + 20 + 3') });
    const mock = mockLogger(orm, ['query', 'query-params']);
    expect(() => (author.age as number)++).toThrow();
    expect(() => JSON.stringify(author)).toThrow();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/insert into "author2" \("id", "created_at", "updated_at", "name", "email", "age", "terms_accepted"\) values \(1, '.*', '.*', 'name', 'email', 100 \+ 20 \+ 3, false\) returning "age"/);
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
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "favourite_author_id" = NULL, "updated_at" = '.*' where "id" = 2/);
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
    ref1.age = sql`age * 2`;
    expect(() => (ref1.age as number)++).toThrow();
    expect(() => ref2.age = ref1.age).toThrow();
    expect(() => JSON.stringify(ref1)).toThrow();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "age" = age \* 2, "updated_at" = '.*' where "id" = 1 returning "age"/);
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
    ref1.age = raw(`age * 2`);
    ref2.age = raw(`age / 2`);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "age" = case when \("id" = 1\) then age \* 2 when \("id" = 2\) then age \/ 2 else "age" end, "updated_at" = case when \("id" = 1\) then '.*' when \("id" = 2\) then '.*' else "updated_at" end where "id" in \(1, 2\) returning "age"/);
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
    await orm.em.persistAndFlush([author, t1, t2, t3]);
    author.favouriteBook = book3;
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['perex'] });
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeUndefined();
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'where "b0"."author_id" is not null and "a1"."name" = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, { populate: ['perex'] });
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "b2" on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
      'left join "author2" as "a3" on "b2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, { populate: ['perex'] });
    expect(res3).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'where "b0"."author_id" is not null and "a1"."favourite_book_uuid_pk" = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, { populate: ['perex'] });
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "b2" on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
      'left join "author2" as "a3" on "b2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = ?');
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
    await orm.em.persistAndFlush([author, t1, t2, t3]);
    author.favouriteBook = book3;
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, { populate: ['perex', '$infer'] });
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
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed", ' +
      '"a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", "a1"."identity" as "a1__identity", ' +
      '"b2"."uuid_pk" as "b2__uuid_pk", "b2"."created_at" as "b2__created_at", "b2"."isbn" as "b2__isbn", "b2"."title" as "b2__title", "b2"."price" as "b2__price", "b2".price * 1.19 as "b2__price_taxed", "b2"."double" as "b2__double", "b2"."meta" as "b2__meta", "b2"."author_id" as "b2__author_id", "b2"."publisher_id" as "b2__publisher_id", ' +
      '"a3"."id" as "a3__id", "a3"."created_at" as "a3__created_at", "a3"."updated_at" as "a3__updated_at", "a3"."name" as "a3__name", "a3"."email" as "a3__email", "a3"."age" as "a3__age", "a3"."terms_accepted" as "a3__terms_accepted", "a3"."optional" as "a3__optional", "a3"."identities" as "a3__identities", "a3"."born" as "a3__born", "a3"."born_time" as "a3__born_time", "a3"."favourite_book_uuid_pk" as "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" as "a3__favourite_author_id", "a3"."identity" as "a3__identity" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "b2" on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
      'left join "author2" as "a3" on "b2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, { populate: ['$infer'] });
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed", ' +
      '"a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", "a1"."identity" as "a1__identity", ' +
      '"b2"."uuid_pk" as "b2__uuid_pk", "b2"."created_at" as "b2__created_at", "b2"."isbn" as "b2__isbn", "b2"."title" as "b2__title", "b2"."price" as "b2__price", "b2".price * 1.19 as "b2__price_taxed", "b2"."double" as "b2__double", "b2"."meta" as "b2__meta", "b2"."author_id" as "b2__author_id", "b2"."publisher_id" as "b2__publisher_id", ' +
      '"a3"."id" as "a3__id", "a3"."created_at" as "a3__created_at", "a3"."updated_at" as "a3__updated_at", "a3"."name" as "a3__name", "a3"."email" as "a3__email", "a3"."age" as "a3__age", "a3"."terms_accepted" as "a3__terms_accepted", "a3"."optional" as "a3__optional", "a3"."identities" as "a3__identities", "a3"."born" as "a3__born", "a3"."born_time" as "a3__born_time", "a3"."favourite_book_uuid_pk" as "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" as "a3__favourite_author_id", "a3"."identity" as "a3__identity" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "b2" on "a1"."favourite_book_uuid_pk" = "b2"."uuid_pk" and "b2"."author_id" is not null ' +
      'left join "author2" as "a3" on "b2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = ?');
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
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.execute<{ created_at: string }[]>(`select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') as created_at from author2 where id = ${author.id}`);
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
    await orm.em.persistAndFlush(author);
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
    const res1 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
      flags: [QueryFlag.DISABLE_PAGINATE],
    });

    expect(res1).toHaveLength(2);
    expect(res1.map(a => a.name)).toEqual(['God 02', 'God 03']);

    const mock = mockLogger(orm, ['query']);

    // with paginate flag (and a bit of dark sql magic) we get what we want
    const res2 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
      flags: [QueryFlag.PAGINATE],
      filters: false,
    });

    expect(res2).toHaveLength(5);
    expect(res2.map(a => a.name)).toEqual(['God 04', 'God 05', 'God 06', 'God 07', 'God 08']);
    expect(mock.mock.calls[0][0]).toMatch('select "a0".* ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" where "a0"."id" in (select "a0"."id" ' +
      'from (select "a0"."id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "b1"."title" like ? group by "a0"."id" order by min("a0"."name") asc, min("b1"."title") asc limit ? offset ?' +
      ') as "a0"' +
      ') order by "a0"."name" asc, "b1"."title" asc');
  });

  test('custom types', async () => {
    await orm.em.insert(FooBar2, { id: 123, name: 'n1', array: [1, 2, 3] });
    await orm.em.insert(FooBar2, { id: 456, name: 'n2', array: [] });

    const bar = FooBar2.create('b1 "b" \'1\'');
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.blob2 = new Uint8Array([1, 2, 3, 4, 5]);
    bar.array = [];
    bar.objectProperty = { foo: `bar 'lol' baz "foo"`, bar: 3 };
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.blob2).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(b1.blob2).toBeInstanceOf(Uint8Array);
    expect(b1.array).toEqual([]);
    expect(b1.array).toBeInstanceOf(Array);
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

  test('using $contains', async () => {
    const a = new Author2('n', 'e');
    a.identities = ['1', '2', '3'];
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    await expect(orm.em.findOneOrFail(Author2, { identities: { $contains: ['2'] } })).resolves.toBeTruthy();
    await expect(orm.em.findOneOrFail(Author2, { identities: { $contains: ['4'] } })).rejects.toThrow();
  });

  test(`toObject uses serializedName on PKs`, async () => {
    const l = new Label2('l');
    await orm.em.persistAndFlush(l);
    expect(wrap(l).toObject()).toMatchObject({ id: 'uuid is ' + l.uuid, name: 'l' });
  });

  test('should allow to find by array of PKs', async () => {
    await orm.em.getDriver().nativeInsertMany(Author2.name, [
      { id: 1, name: 'n1', email: 'e1' },
      { id: 2, name: 'n2', email: 'e2' },
      { id: 3, name: 'n3', email: 'e3' },
    ]);
    const repo = orm.em.getRepository(Author2);
    const res = await repo.find([1, 2, 3], { orderBy: { id: 1 } });
    expect(res.map(a => a.id)).toEqual([1, 2, 3]);
  });

  test('exceptions', async () => {
    const driver = orm.em.getDriver();
    await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    await expect(orm.em.upsert(Author2, { name: 'author', email: 'email', favouriteAuthor: 123 })).rejects.toThrow(ForeignKeyConstraintViolationException);
    await expect(orm.em.upsertMany(Author2, [{ name: 'author', email: 'email', favouriteAuthor: 123 }])).rejects.toThrow(ForeignKeyConstraintViolationException);
    await expect(driver.nativeInsert(Author2.name, { name: 'author', email: 'email' })).rejects.toThrow(UniqueConstraintViolationException);
    await expect(driver.nativeInsert(Author2.name, {})).rejects.toThrow(NotNullConstraintViolationException);
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(TableNotFoundException);
    await expect(driver.execute('create table author2 (foo text not null)')).rejects.toThrow(TableExistsException);
    await expect(driver.execute('foo bar 123')).rejects.toThrow(SyntaxErrorException);
    await expect(driver.execute('select id from author2, foo_bar2')).rejects.toThrow(NonUniqueFieldNameException);
    await expect(driver.execute('select uuid from author2')).rejects.toThrow(InvalidFieldNameException);
  });

  test('question marks and parameter interpolation (GH issue #920)', async () => {
    const e = new FooBaz2(`?baz? uh \\? ? wut? \\\\ wut`);
    await orm.em.persistAndFlush(e);
    const e2 = await orm.em.fork().findOneOrFail(FooBaz2, e);
    expect(e2.name).toBe(`?baz? uh \\? ? wut? \\\\ wut`);
    const res = await orm.em.execute('select ? as count', [1]);
    expect(res[0].count).toBe(1);
  });

  test('mapping to raw PKs instead of entities', async () => {
    const t1 = new Test2({ name: 't1' });
    const t2 = new Test2({ name: 't2' });
    const t3 = new Test2({ name: 't3' });
    await orm.em.persistAndFlush([t1, t2, t3]);
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

  test('perf: delete', async () => {
    const start = performance.now();
    for (let i = 1; i <= 5_000; i++) {
      const e = new FooBaz2(`baz ${i}`);
      e.id = i;
      orm.em.merge(e);
      orm.em.remove(e);
    }
    await orm.em.flush();
    const took = performance.now() - start;

    if (took > 300) {
      process.stdout.write(`delete test took ${took}\n`);
    }
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

    await em.persistAndFlush(b);
    em.clear();

    // Comment this out and the test will pass
    await em.findOneOrFail(Book2, { title: '1stB' }, { populate: ['author'] });

    const newA = new Author2('2ndA', 'e2');
    newA.born = '2023-03-23';
    const newB = new Book2('2ndB', newA);
    newB.author = newA;
    await em.persistAndFlush(newB);

    expect(Subscriber.log).toHaveLength(2);
    const updates = Subscriber.log.reduce((x, y) => x.concat(y), []).filter(c => c.type === ChangeSetType.UPDATE);
    expect(updates).toHaveLength(0);
    Subscriber.log.length = 0;
  });

  test('getConnection() with replicas (GH issue #1963)', async () => {
    const config = new Configuration({
      driver: PostgreSqlDriver,
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      logger: jest.fn(),
      forceUtcTimezone: true,
      replicas: [
        { name: 'read-1', host: 'read_host_1', user: 'read_user' },
      ],
    } as any, false);
    const driver = new PostgreSqlDriver(config);
    expect(driver.getConnection('write').getConnectionOptions()).toMatchObject({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      port: 1234,
    });
    expect(driver.getConnection('read').getConnectionOptions()).toMatchObject({
      database: 'db_name',
      host: 'read_host_1',
      password: 'secret',
      user: 'read_user',
      port: 1234,
    });
  });

  // this should run in ~200ms (when running single test locally)
  test('perf: one to many', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    for (let i = 1; i <= 1000; i++) {
      const b = new Book2('My Life on The Wall, part ' + i, author);
      author.books.add(b);
    }

    await orm.em.flush();
    expect(author.books.getItems().every(b => b.uuid)).toBe(true);
  });

  test('perf: populating many large one to many collections (#4171)', async () => {
    const authors = [];
    const books = [];

    for (let i = 1; i <= 1000; i++) {
      const author = new Author2('Jon Snow ' + i, `snow-${i}@wall.st`);
      authors.push(author);

      for (let j = 1; j <= 20; j++) {
        books.push(new Book2(`My Life on The Wall, part ${i}/${j}`, author));
      }
    }

    await orm.em.insertMany(authors);
    await orm.em.insertMany(books);

    orm.em.clear();
    const res = await orm.em.find(Author2, {});
    console.time('perf: populate many 1:m collections');
    await orm.em.populate(res, ['books']);
    console.timeEnd('perf: populate many 1:m collections');
  });

  // this should run in ~70ms (when running single test locally)
  test('perf: one to many via em.create()', async () => {
    const books = [] as Book2[];
    for (let i = 1; i <= 10000; i++) {
      const b = new Book2('My Life on The Wall, part ' + i, undefined as any);
      books.push(b);
    }

    console.time('perf: one to many via em.create()');
    const author = orm.em.create(Author2, {
      name: 'Jon Snow',
      email: 'snow@wall.st',
      books,
    });
    console.timeEnd('perf: one to many via em.create()');
  });

  // this should run in ~400ms (when running single test locally)
  test('perf: batch insert and update', async () => {
    const authors = new Set<Author2>();

    for (let i = 1; i <= 1000; i++) {
      const author = new Author2(`Jon Snow ${i}`, `snow-${i}@wall.st`);
      orm.em.persist(author);
      authors.add(author);
    }

    await orm.em.flush();
    authors.forEach(author => expect(author.id).toBeGreaterThan(0));

    authors.forEach(a => a.termsAccepted = true);
    await orm.em.flush();
  });

  test('working with global identity map will throw', async () => {
    orm.config.set('allowGlobalContext', false);

    const err = 'Using global EntityManager instance methods for context specific actions is disallowed. If you need to work with the global instance\'s identity map, use `allowGlobalContext` configuration option or `fork()` instead.';
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

    await expect(orm.em.find(FooBar2, {}, { disableIdentityMap: false })).rejects.toThrow(/Using global EntityManager instance methods for context specific actions is disallowed/);

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
    await orm.em.persistAndFlush(b);
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
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id", "publisher_id") values (?, ?, ?, ?, ?, ?)');
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
        await orm.em.persistAndFlush(b);
        return b;
      })(),
      (async () => {
        const a = new Author2('a2', 'e2');
        const b = new Book2('t2', a, 456);
        await orm.em.persistAndFlush(b);
        return b;
      })(),
      (async () => {
        const a = new Author2('a3', 'e3');
        const b = new Book2('t3', a, 789);
        await orm.em.persistAndFlush(b);
        return b;
      })(),
    ]);

    // flushing things at the same tick will even batch the queries
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('commit');

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
        await orm.em.persistAndFlush(b);
        return b;
      })(),
      (async () => {
        const a = new Author2('a5', 'e5');
        const b = new Book2('t5', a, 456);
        while (!orm.em.getReference(Author2, 3, { wrapped: true }).isInitialized()) {
          await new Promise(r => setImmediate(r));
        }
        await orm.em.persistAndFlush(b);
        return b;
      })(),
      (async () => {
        const a = new Author2('a6', 'e6');
        const b = new Book2('t6', a, 789);
        while (!orm.em.getReference(Author2, 4, { wrapped: true }).isInitialized()) {
          await new Promise(r => setImmediate(r));
        }
        await orm.em.persistAndFlush(b);
        return b;
      })(),
    ]);

    expect(ret2.map(b => b.author.id)).toEqual([6, 4, 5]);
    expect(ret2.map(b => b.author.name)).toEqual(['a4', 'a5', 'a6']);

    // flushing things at different time will create multiple transactions
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`);
    expect(mock.mock.calls[3][0]).toMatch(`commit`);
    expect(mock.mock.calls[4][0]).toMatch(`begin`);
    expect(mock.mock.calls[5][0]).toMatch(`insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`);
    expect(mock.mock.calls[6][0]).toMatch(`insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`);
    expect(mock.mock.calls[7][0]).toMatch(`commit`);
    expect(mock.mock.calls[8][0]).toMatch(`begin`);
    expect(mock.mock.calls[9][0]).toMatch(`insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age"`);
    expect(mock.mock.calls[10][0]).toMatch(`insert into "book2" ("uuid_pk", "created_at", "title", "price", "author_id") values (?, ?, ?, ?, ?)`);
    expect(mock.mock.calls[11][0]).toMatch(`commit`);

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
        await orm.em.persistAndFlush(user);
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
    await expect(orm.em.persistAndFlush(jon)).rejects.toThrow(`Value for Author2.email is required, 'undefined' found`);

    orm.config.set('validateRequired', false);
    await expect(orm.em.persistAndFlush(jon)).rejects.toThrow(`null value in column "email" of relation "author2" violates not-null constraint`);
    await expect(orm.em.persistAndFlush(jon)).rejects.toThrow(NotNullConstraintViolationException);
    orm.config.set('validateRequired', true);
  });

  test('changing PK', async () => {
    const bar = new FooBar2();
    bar.name = 'abc';
    expect(bar.id).toBeUndefined();
    await orm.em.persistAndFlush(bar);
    expect(bar.id).toBe(1);
    bar.id = 321;

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch(`update "foo_bar2" set "id" = 321, "version" = current_timestamp(0) where "id" = 1 and "version" = `);

    const c = await orm.em.fork().findOne(FooBar2, bar);
    expect(c).toBeDefined();
    expect(c!.id).toBe(321);
  });

  test('validation in em.populate() for non discovered entities', async () => {
    await expect(orm.em.populate({}, ['foo'] as never[])).rejects.toThrow(`Trying to populate not discovered entity of type object.`);
    class Book2 {}
    await expect(orm.em.populate(new Book2(), ['author'] as never[])).rejects.toThrow('Trying to populate not discovered entity of type Book2. ' +
      'Entity with this name was discovered, but not the prototype you are passing to the ORM. If using EntitySchema, be sure to point to the implementation via `class`.');
  });

  test('changing PK (batch)', async () => {
    const bars = [FooBar2.create('abc 1'), FooBar2.create('abc 2')];
    expect(bars[0].id).toBeUndefined();
    expect(bars[1].id).toBeUndefined();
    await orm.em.persistAndFlush(bars);
    expect(bars[0].id).toBe(1);
    expect(bars[1].id).toBe(2);
    bars[0].id = 321;
    bars[1].id = 322;

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();
    expect(mock).toHaveBeenCalledTimes(4);
    expect(mock.mock.calls[1][0]).toMatch('select "f0"."id" from "foo_bar2" as "f0" where (("f0"."id" = ? and "f0"."version" = ?) or ("f0"."id" = ? and "f0"."version" = ?))');
    expect(mock.mock.calls[2][0]).toMatch('update "foo_bar2" set "id" = case when ("id" = ?) then ? when ("id" = ?) then ? else "id" end, "version" = current_timestamp(0) where "id" in (?, ?)');

    const c1 = await orm.em.fork().findOne(FooBar2, bars[0]);
    expect(c1).toBeDefined();
    expect(c1!.id).toBe(321);

    const c2 = await orm.em.fork().findOne(FooBar2, bars[1]);
    expect(c2).toBeDefined();
    expect(c2!.id).toBe(322);
  });

});
