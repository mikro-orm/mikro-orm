import { v4 } from 'uuid';
import { inspect } from 'util';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import {
  Collection,
  Configuration,
  EntityManager,
  LockMode,
  MikroORM,
  QueryFlag,
  QueryOrder,
  Reference,
  ValidationError,
  wrap,
  UniqueConstraintViolationException,
  TableNotFoundException,
  TableExistsException,
  SyntaxErrorException,
  NonUniqueFieldNameException,
  InvalidFieldNameException,
  IsolationLevel,
  NullHighlighter,
  PopulateHint,
  raw,
  ref,
  RawQueryFragment,
} from '@mikro-orm/core';
import { MySqlDriver, MySqlConnection, ScalarReference } from '@mikro-orm/mysql';
import { Address2, Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, Test2 } from './entities-sql';
import { initORMMySql, mockLogger } from './bootstrap';
import { Author2Subscriber } from './subscribers/Author2Subscriber';
import { EverythingSubscriber } from './subscribers/EverythingSubscriber';
import { FlushSubscriber } from './subscribers/FlushSubscriber';
import { Test2Subscriber } from './subscribers/Test2Subscriber';

describe('EntityManagerMySql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterEach(() => {
    expect(RawQueryFragment.checkCacheSize()).toBe(0);
    orm.config.set('debug', false);
    Author2Subscriber.log.length = 0;
    EverythingSubscriber.log.length = 0;
    FlushSubscriber.log.length = 0;
    Test2Subscriber.log.length = 0;
  });
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
      error: expect.any(Error),
      reason: 'Unable to acquire a connection',
    });
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
    expect(await orm.checkConnection()).toEqual({
      ok: true,
    });
    expect(inspect(orm.em)).toBe(`[EntityManager<${orm.em.id}>]`);
  });

  test('getConnectionOptions()', async () => {
    const config = new Configuration({
      driver: MySqlDriver,
      clientUrl: 'mysql://root@127.0.0.1:3308/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      logger: jest.fn(),
      forceUtcTimezone: true,
    } as any, false);
    config.reset('debug');
    const driver = new MySqlDriver(config);
    expect(driver.getConnection().getConnectionOptions()).toMatchObject({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      port: 3308,
      user: 'user',
      timezone: 'Z',
      dateStrings: true,
      supportBigNumbers: true,
    });
  });

  test('raw query with array param', async () => {
    const q1 = await orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [[1, 2, 3], 3]);
    expect(q1).toBe('select * from author2 where id in (1, 2, 3) limit 3');
    const q2 = await orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [['1', '2', '3'], 3]);
    expect(q2).toBe(`select * from author2 where id in ('1', '2', '3') limit 3`);
  });

  test('should return mysql driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(MySqlDriver);
    await expect(driver.findOne<Book2>(Book2.name, { title: 'bar' })).resolves.toBeNull();
    await expect(driver.findOne<Book2>(Book2.name, 'uuid')).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name' });
    expect((await driver.nativeInsert(Book2.name, { uuid: v4(), author: author.insertId, tags: [tag.insertId] })).insertId).not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('insert into test2 (name) values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
      rows: [],
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      rows: [],
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      rows: [],
    });
    expect(driver.getPlatform().usesImplicitTransactions()).toBe(true);
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find<BookTag2>(BookTag2.name, { books: { $in: ['1'] } })).resolves.not.toBeNull();
    await expect(driver.count(BookTag2.name, {})).resolves.toBe(1);

    const conn = driver.getConnection();
    const tx = await conn.begin();
    await conn.execute('select 1', [], 'all', tx);
    await conn.execute(orm.em.getKnex().raw('select 1'), [], 'all', tx);
    await conn.execute(orm.em.getRepository(Author2).getKnex().raw('select 1'), [], 'all', tx);
    await conn.commit(tx);

    // multi inserts
    const res = await driver.nativeInsertMany(Publisher2.name, [
      { name: 'test 1', type: PublisherType.GLOBAL },
      { name: 'test 2', type: PublisherType.LOCAL },
      { name: 'test 3', type: PublisherType.GLOBAL },
    ]);

    // mysql returns the first inserted id
    expect(res).toMatchObject({ insertId: 1, affectedRows: 3, row: { id: 1 }, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const res2 = await driver.find(Publisher2.name, {});
    expect(res2).toMatchObject([
      { id: 1, name: 'test 1', type: PublisherType.GLOBAL },
      { id: 2, name: 'test 2', type: PublisherType.LOCAL },
      { id: 3, name: 'test 3', type: PublisherType.GLOBAL },
    ]);

    // multi updates
    const res3 = await driver.nativeUpdateMany<Publisher2>(Publisher2.name, [1, 2, 3], [
      { name: 'test 11', type: PublisherType.LOCAL },
      { type: PublisherType.GLOBAL },
      { name: 'test 33', type: PublisherType.LOCAL },
    ]);

    const res4 = await driver.find(Publisher2.name, {});
    expect(res4).toMatchObject([
      { id: 1, name: 'test 11', type: PublisherType.LOCAL },
      { id: 2, name: 'test 2', type: PublisherType.GLOBAL },
      { id: 3, name: 'test 33', type: PublisherType.LOCAL },
    ]);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = `insert into \`not_existing\` (\`foo\`) values ('bar') - Table '${orm.config.get('dbName')}.not_existing' doesn't exist`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(err1);
    const err2 = `delete from \`not_existing\` - Table '${orm.config.get('dbName')}.not_existing' doesn't exist`;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrow(err2);
  });

  test('connection returns correct URL', async () => {
    const conn1 = new MySqlConnection(new Configuration({
      driver: MySqlDriver,
      clientUrl: 'mysql://example.host.com',
      port: 1234,
      user: 'usr',
      password: 'pw',
    } as any, false));
    await expect(conn1.getClientUrl()).toBe('mysql://usr:*****@example.host.com:1234');
    const conn2 = new MySqlConnection(new Configuration({ driver: MySqlDriver, port: 3307 } as any, false));
    await expect(conn2.getClientUrl()).toBe('mysql://root@127.0.0.1:3307');
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
    expect(await repo.findOne({ termsAccepted: false })).toBeNull();
  });

  test('should allow to find by array of PKs', async () => {
    await orm.em.getDriver().nativeInsertMany(Author2.name, [
      { id: 1, name: 'n1', email: 'e1' },
      { id: 2, name: 'n2', email: 'e2' },
      { id: 3, name: 'n3', email: 'e3' },
    ]);
    const repo = orm.em.getRepository(Author2);
    const res = await repo.find([1, 2, 3]);
    expect(res.map(a => a.id)).toEqual([1, 2, 3]);
  });

  test('should allow shadow properties in EM.create()', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = repo.create({ name: 'name', email: 'email', version: 123 });
    await expect(author.version).toBe(123);
  });

  test('should create UUID value when using EM.create()', async () => {
    const repo = orm.em.getRepository(Book2);
    const book = repo.create({ title: 'name', author: 123 });
    expect(book.uuid).toBeDefined();
  });

  test('manual mapping of raw DB results to entities vie EM.map()', async () => {
    const repo = orm.em.getRepository(Book2);
    const book = repo.map({
      uuid_pk: '123-dsa',
      title: 'name',
      created_at: '2019-06-09T07:50:25.722Z',
      author_id: 123,
      publisher_id: 321,
      tags: [1n, 2n, 3n],
    })!;
    expect(book.uuid).toBe('123-dsa');
    expect(book.title).toBe('name');
    expect(book.createdAt).toBeInstanceOf(Date);
    expect(book.author).toBeInstanceOf(Author2);
    expect(book.author.id).toBe(123);
    expect(book.publisher).toBeInstanceOf(Reference);
    expect(book.publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(book.publisher!.id).toBe(321);
    expect(book.tags.length).toBe(3);
    expect(book.tags[0]).toBeInstanceOf(BookTag2);
    expect(book.tags[0].id).toBe(1n);
    expect(book.tags[1].id).toBe(2n);
    expect(book.tags[2].id).toBe(3n);
    expect(repo.getReference(book.uuid)).toBe(book);
  });

  test('should work with boolean values', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);
    expect(author.termsAccepted).toBe(false);
    author.termsAccepted = true;
    await orm.em.persistAndFlush(author);
    expect(author.termsAccepted).toBe(true);
    orm.em.clear();

    const a1 = await repo.findOne({ termsAccepted: false });
    expect(a1).toBeNull();
    const a2 = (await repo.findOne({ termsAccepted: true }))!;
    expect(a2).not.toBeNull();
    a2.termsAccepted = false;
    await orm.em.persistAndFlush(a2);
    orm.em.clear();

    const a3 = (await repo.findOne({ termsAccepted: false }))!;
    expect(a3).not.toBeNull();
    expect(a3.termsAccepted).toBe(false);
    const a4 = await repo.findOne({ termsAccepted: true });
    expect(a4).toBeNull();
  });

  test(`populating inverse side of 1:1 also back-links inverse side's owner`, async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOne(bar.id, { populate: ['baz'], flags: [QueryFlag.DISTINCT] });
    expect(wrap(a!.baz!).isInitialized()).toBe(true);
    expect(wrap(a!.baz!.bar!).isInitialized()).toBe(true);
  });

  test('factory should support a primary key value of 0', async () => {
    const factory = orm.em.getEntityFactory();
    const p1 = new Publisher2(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher2);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.create(Publisher2, { id: 0 }); // shouldn't call constructor
    expect(p2).toBeInstanceOf(Publisher2);
    expect(p2.name).toBeUndefined();
    expect(p2.books).toBeInstanceOf(Collection);
    expect(p2.tests).toBeInstanceOf(Collection);
  });

  test(`1:1 relationships with an inverse side primary key of 0 should link`, async () => {
    // Set up static data with id of 0
    const response = await orm.em.execute('set sql_mode = \'NO_AUTO_VALUE_ON_ZERO\'; insert into foo_baz2 (id, name) values (?, ?); set sql_mode = \'\'', [0, 'testBaz'], 'run');
    expect(response[1]).toMatchObject({
      affectedRows: 1,
      insertId: 0,
    });
    const fooBazRef = orm.em.getReference<FooBaz2>(FooBaz2, 0);
    const fooBar = FooBar2.create('testBar');
    fooBar.baz = fooBazRef;
    await orm.em.persistAndFlush(fooBar);
    orm.em.clear();
    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOne(fooBar.id, { populate: ['baz'] });
    expect(wrap(a!.baz!).isInitialized()).toBe(true);
    expect(a!.baz!.id).toBe(0);
    expect(a!.baz!.name).toBe('testBaz');
  });

  test('inverse side of 1:1 is ignored in change set', async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz 1');
    await orm.em.persistAndFlush(bar);

    bar.baz = new FooBaz2('fz 2');
    await orm.em.flush();
  });

  test('partial loading of 1:1 owner from inverse side', async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.fork().persistAndFlush(bar);

    const a1 = await orm.em.findOneOrFail(FooBaz2, bar.baz, {
      fields: ['name', 'bar'],
      populate: [], // otherwise it would be inferred from `fields` and populate the `bar` automatically
    });
    expect(a1.name).toBe('fz');
    expect(a1.bar).toBeInstanceOf(FooBar2);
    // @ts-expect-error
    expect(a1.version).toBeUndefined();
    expect(wrap(a1.bar!).isInitialized()).toBe(false);
  });

  test('transactions', async () => {
    const god1 = new Author2('God1', 'hello@heaven1.god');
    await orm.em.begin();
    orm.em.persist(god1);
    await orm.em.rollback();
    const res1 = await orm.em.findOne(Author2, { name: 'God1' });
    expect(res1).toBeNull();

    await orm.em.begin();
    const god2 = new Author2('God2', 'hello@heaven2.god');
    orm.em.persist(god2);
    await orm.em.commit();
    const res2 = await orm.em.findOne(Author2, { name: 'God2' });
    expect(res2).not.toBeNull();

    await orm.em.transactional(async em => {
      const god3 = new Author2('God3', 'hello@heaven3.god');
      await em.persist(god3);
    });
    const res3 = await orm.em.findOne(Author2, { name: 'God3' });
    expect(res3).not.toBeNull();

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god4 = new Author2('God4', 'hello@heaven4.god');
        await em.persist(god4);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res4 = await orm.em.findOne(Author2, { name: 'God4' });
      expect(res4).toBeNull();
    }
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

    expect(mock.mock.calls[0][0]).toMatch('set transaction isolation level read uncommitted');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback');
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const god1 = new Author2('God1', 'hello1@heaven.god');

      try {
        await em.transactional(async em2 => {
          await em2.persist(god1);
          throw new Error(); // rollback the transaction
        });
      } catch { }

      const res1 = await em.findOne(Author2, { name: 'God1' });
      expect(res1).toBeNull();

      await em.transactional(async em2 => {
        const god2 = new Author2('God2', 'hello2@heaven.god');
        em2.persist(god2);
      });

      const res2 = await em.findOne(Author2, { name: 'God2' });
      expect(res2).not.toBeNull();
    });
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = mockLogger(orm, ['query']);

    // start outer transaction
    const transaction = orm.em.transactional(async em => {
      // do stuff inside inner transaction and rollback
      try {
        await em.transactional(async em2 => {
          await em2.persistAndFlush(new Author2('God', 'hello@heaven.god'));
          throw new Error(); // rollback the transaction
        });
      } catch { }

      await em.persist(new Author2('God Persisted!', 'hello-persisted@heaven.god'));
    });

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    author.bornTime = '00:23:59';
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    // as we order by Book.createdAt when populating collection, we need to make sure values will be sequential
    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.createdAt = new Date(Date.now() + 1);
    book1.publisher = wrap(publisher).toReference();
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = wrap(publisher).toReference();
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.createdAt = new Date(Date.now() + 3);
    book3.publisher = wrap(publisher).toReference();

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
    expect(await authorRepository.findOne({ favouriteBook: bible.uuid })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, { populate: ['author'] });
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }))!;
    await orm.em.populate(jon, ['books', 'favouriteBook']);
    const authors = await authorRepository.findAll();
    await orm.em.populate(authors, ['books', 'favouriteBook'], { where: { books: '123' } });
    expect(await authorRepository.findOne({ email: 'not existing' })).toBeNull();
    await expect(orm.em.populate([] as Author2[], ['books', 'favouriteBook'])).resolves.toEqual([]);

    // full text search test
    const fullTextBooks = (await booksRepository.find({ title: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);

    // count test
    const count = await authorRepository.count();
    expect(count).toBe(authors.length);
    const count2 = await orm.em.count(Author2);
    expect(count2).toBe(authors.length);
    const count3 = await orm.em.getRepository(Author2).count({}, {
      groupBy: ['termsAccepted'],
      having: { termsAccepted: false },
    });
    expect(count3).toBe(authors.length);

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
      bornTime: '00:23:59',
      email: 'snow@wall.st',
      name: 'Jon Snow',
    });
    expect(wrap(jon).toJSON()).toEqual(o);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('string');

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
        expect(wrap(book.publisher!).isInitialized()).toBe(false);
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
    const b2 = await orm.em.findOneOrFail(Book2, { meta: { category: 'god like', items: 3 } });
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
    expect(Test2Subscriber.log).toEqual([]);
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

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test2, test.id, { lockMode: LockMode.OPTIMISTIC, lockVersion: test.version });
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
    const test3 = await orm.em.findOne(Test2, test.id, { lockMode: LockMode.OPTIMISTIC, lockVersion: test.version });
    expect(test3).toBe(test2);
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
    await expect(orm.em.findOne(Author2, author.id, { lockMode: LockMode.OPTIMISTIC })).rejects.toThrow('Cannot obtain optimistic lock on unversioned entity Author2');
  });

  test('lock supports optimistic locking [versioned entity]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await orm.em.lock(test, undefined!);
    await orm.em.lock(test, LockMode.OPTIMISTIC);
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('lock supports optimistic locking [version mismatch]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrow('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('lock supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrow('Entity Test2 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = Test2.create('Lock test');
    await orm.em.persistAndFlush(test);
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrow('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrow('An open transaction is required for this operation');
  });

  test('lock supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `a0` where `a0`.`id` = ? for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('lock supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `a0` where `a0`.`id` = ? lock in share mode');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    orm.em.clear();
    mock.mock.calls.length = 0;

    await orm.em.transactional(async em => {
      await em.findOne(Author2, { email: 'foo' }, { lockMode: LockMode.PESSIMISTIC_READ, strategy: 'select-in' });
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(' from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`email` = ? limit ? lock in share mode');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('custom query expressions via query builder', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.price = 100;
    bible.meta = { category: 'foo', items: 1 };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const qb1 = orm.em.fork().createQueryBuilder(Book2);
    const res1 = await qb1.select('*').where({ [raw('JSON_CONTAINS(`b0`.`meta`, ?)', [{ foo: 'bar' }])]: false }).execute('get');
    expect(res1.createdAt).toBeDefined();
    // @ts-expect-error
    expect(res1.created_at).not.toBeDefined();
    expect(res1.meta).toEqual({ category: 'foo', items: 1 });

    const qb2 = orm.em.fork().createQueryBuilder(Book2);
    const res2 = await qb2.select('*').where({ [raw('JSON_CONTAINS(meta, ?)', [{ category: 'foo' }])]: true }).execute('get', false);
    expect(res2.createdAt).not.toBeDefined();
    // @ts-expect-error
    expect(res2.created_at).toBeDefined();
    expect(res2.meta).toEqual({ category: 'foo', items: 1 });

    const qb3 = orm.em.fork().createQueryBuilder(Book2);
    const res3 = await qb3.select('*').where({ [raw('JSON_CONTAINS(meta, ?)', [{ category: 'foo' }])]: true }).getSingleResult();
    expect(res3).toBeInstanceOf(Book2);
    expect(res3!.createdAt).toBeDefined();
    expect(res3!.meta).toEqual({ category: 'foo', items: 1 });

    const res4 = await orm.em.fork().findOneOrFail(Book2, { [raw('JSON_CONTAINS(meta, ?)', [{ items: 1 }])]: true });
    expect(res4).toBeInstanceOf(Book2);
    expect(res4.createdAt).toBeDefined();
    expect(res4.meta).toEqual({ category: 'foo', items: 1 });
  });

  test('tuple comparison', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.price = 100;
    bible.meta = { category: 'foo', items: 1 };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res4 = await orm.em.findOneOrFail(Book2, { [raw<Book2>(['price', 'createdAt'])]: { $lte: [100, new Date()] } });
    expect(res4).toBeInstanceOf(Book2);
    expect(res4.createdAt).toBeDefined();
    expect(res4.price).toBe(100.00);
    expect(res4.meta).toEqual({ category: 'foo', items: 1 });
    expect(mock.mock.calls[0][0]).toMatch('where `b0`.`author_id` is not null and (`b0`.`price`, `b0`.`created_at`) <= (?, ?)');
  });

  test('query builder getResult() and getSingleResult() return entities', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'foo', items: 1 };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const qb1 = orm.em.createQueryBuilder(Book2);
    const res1 = await qb1.select('*').getSingleResult();
    expect(res1).toBeInstanceOf(Book2);
    expect(res1!.createdAt).toBeDefined();
    expect((res1 as any).created_at).not.toBeDefined();
    expect(res1!.meta).toEqual({ category: 'foo', items: 1 });
    expect(wrap(res1!).isInitialized()).toBe(true);
    const qb2 = orm.em.createQueryBuilder(Book2);
    const res2 = await qb2.select('*').where({ title: 'not exists' }).getSingleResult();
    expect(res2).toBeNull();
    const res3 = await qb1.clone().select('*').getResult();
    expect(res3).toHaveLength(1);
  });

  test('stable results of serialization', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const books0 = await orm.em.find(Book2, []);
    expect(books0).toHaveLength(0);
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

  test('populate ManyToOne relation', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);

    let jon = new Author2('Jon Snow', 'snow@wall.st');
    jon.born = '2023-03-23';
    jon.favouriteBook = bible;
    await orm.em.persistAndFlush(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook!).isInitialized()).toBe(false);

    await wrap(jon.favouriteBook!).init();
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook!).isInitialized()).toBe(true);
    expect(jon.favouriteBook!.title).toBe('Bible');
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }, { populate: ['baz'] }))!;
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({ baz: { id: baz.id, bar: bar.id, name: 'baz' } });
  });

  test('populate OneToOne relation on inverse side (select-in)', async () => {
    const bar = FooBar2.create('bar');
    bar.id = 2;
    const baz = new FooBaz2('baz');
    baz.id = 3;
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const b0 = (await orm.em.findOne(FooBaz2, { id: baz.id }, { strategy: 'select-in' }))!;
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, `f1`.`id` as `f1__id` from `foo_baz2` as `f0` left join `foo_bar2` as `f1` on `f0`.`id` = `f1`.`baz_id` where `f0`.`id` = 3 limit 1');
    expect(b0.bar).toBeDefined();
    expect(b0.bar).toBeInstanceOf(FooBar2);
    expect(wrap(b0.bar!).isInitialized()).toBe(false);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBaz2, { id: baz.id }, { populate: ['bar'], strategy: 'select-in' }))!;
    expect(mock.mock.calls[1][0]).toMatch('select `f0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`name with space` as `b1__name with space`, `b1`.`baz_id` as `b1__baz_id`, `b1`.`foo_bar_id` as `b1__foo_bar_id`, `b1`.`version` as `b1__version`, `b1`.`blob` as `b1__blob`, `b1`.`blob2` as `b1__blob2`, `b1`.`array` as `b1__array`, `b1`.`object_property` as `b1__object_property`, (select 123) as `b1__random`, `b1`.`id` as `b1__id` from `foo_baz2` as `f0` left join `foo_bar2` as `b1` on `f0`.`id` = `b1`.`baz_id` where `f0`.`id` = 3 limit 1');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = (await orm.em.findOne(FooBaz2, { bar: bar.id }, { populate: ['bar'], strategy: 'select-in' }))!;
    expect(mock.mock.calls[2][0]).toMatch('select `f0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`name with space` as `b1__name with space`, `b1`.`baz_id` as `b1__baz_id`, `b1`.`foo_bar_id` as `b1__foo_bar_id`, `b1`.`version` as `b1__version`, `b1`.`blob` as `b1__blob`, `b1`.`blob2` as `b1__blob2`, `b1`.`array` as `b1__array`, `b1`.`object_property` as `b1__object_property`, (select 123) as `b1__random`, `b1`.`id` as `b1__id` from `foo_baz2` as `f0` left join `foo_bar2` as `b1` on `f0`.`id` = `b1`.`baz_id` left join `foo_bar2` as `f2` on `f0`.`id` = `f2`.`baz_id` where `f2`.`id` = 2 limit 1');
    expect(mock.mock.calls).toHaveLength(3);
    expect(b2.bar).toBeInstanceOf(FooBar2);
    expect(b2.bar!.id).toBe(bar.id);
    expect(wrap(b2).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
  });

  test('populate OneToOne relation on inverse side (joined)', async () => {
    const bar = FooBar2.create('bar');
    bar.id = 2;
    const baz = new FooBaz2('baz');
    baz.id = 3;
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const b0 = (await orm.em.findOne(FooBaz2, { id: baz.id }, { strategy: 'joined' }))!;
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, `f1`.`id` as `f1__id` from `foo_baz2` as `f0` left join `foo_bar2` as `f1` on `f0`.`id` = `f1`.`baz_id` where `f0`.`id` = 3 limit 1');
    expect(b0.bar).toBeDefined();
    expect(b0.bar).toBeInstanceOf(FooBar2);
    expect(wrap(b0.bar!).isInitialized()).toBe(false);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBaz2, { id: baz.id }, { populate: ['bar'], strategy: 'joined' }))!;
    expect(mock.mock.calls[1][0]).toMatch('select `f0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`name with space` as `b1__name with space`, `b1`.`baz_id` as `b1__baz_id`, `b1`.`foo_bar_id` as `b1__foo_bar_id`, `b1`.`version` as `b1__version`, `b1`.`blob` as `b1__blob`, `b1`.`blob2` as `b1__blob2`, `b1`.`array` as `b1__array`, `b1`.`object_property` as `b1__object_property`, (select 123) as `b1__random`, `b1`.`id` as `b1__id` ' +
      'from `foo_baz2` as `f0` ' +
      'left join `foo_bar2` as `b1` on `f0`.`id` = `b1`.`baz_id` ' +
      'where `f0`.`id` = 3 limit 1');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = (await orm.em.findOne(FooBaz2, { bar: bar.id }, { populate: ['bar'], strategy: 'joined' }))!;
    expect(mock.mock.calls[2][0]).toMatch('select `f0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`name with space` as `b1__name with space`, `b1`.`baz_id` as `b1__baz_id`, `b1`.`foo_bar_id` as `b1__foo_bar_id`, `b1`.`version` as `b1__version`, `b1`.`blob` as `b1__blob`, `b1`.`blob2` as `b1__blob2`, `b1`.`array` as `b1__array`, `b1`.`object_property` as `b1__object_property`, (select 123) as `b1__random`, `b1`.`id` as `b1__id` ' +
      'from `foo_baz2` as `f0` ' +
      'left join `foo_bar2` as `b1` on `f0`.`id` = `b1`.`baz_id` ' +
      'left join `foo_bar2` as `f2` on `f0`.`id` = `f2`.`baz_id` ' +
      'where `f2`.`id` = 2 limit 1');
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

  test('populate passes nested where and orderBy', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    const b4 = new Book2('b4', author);
    const b5 = new Book2('b5', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    b1.tags.add(tag1, tag3);
    b2.tags.add(tag1, tag2, tag5);
    b3.tags.add(tag5);
    b4.tags.add(tag2, tag4, tag5);
    b5.tags.add(tag5);

    await orm.em.persistAndFlush([b1, b2, b3, b4, b5]);
    orm.em.clear();

    const a0 = await orm.em.find(Author2, author, {
      populate: ['books'],
      orderBy: { books: { title: 'asc' } },
    });
    expect(a0[0].books.map(b => b.title)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5']);
    orm.em.clear();

    const a1 = await orm.em.find(Author2, author, {
      populate: ['books'],
      orderBy: { books: { title: QueryOrder.DESC } },
    });
    expect(a1[0].books.map(b => b.title)).toEqual(['b5', 'b4', 'b3', 'b2', 'b1']);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author, {
      populate: ['books'],
      orderBy: [{ books: { title: QueryOrder.DESC } }],
    });
    expect(a2.books.map(b => b.title)).toEqual(['b5', 'b4', 'b3', 'b2', 'b1']);
    orm.em.clear();

    const a3 = await orm.em.findOneOrFail(Author2, { books: { tags: { name: { $in: ['silly', 'strange'] } } } }, {
      populate: ['books.tags'],
      populateWhere: PopulateHint.INFER,
      orderBy: { books: { tags: { name: QueryOrder.DESC }, title: QueryOrder.ASC } },
    });
    expect(a3.books.map(b => b.title)).toEqual(['b4', 'b1', 'b2']); // first strange tag (desc), then silly by name (asc)
    orm.em.clear();

    const a4 = await orm.em.findOneOrFail(Author2, { books: { tags: { name: { $in: ['silly', 'strange'] } } } }, {
      populate: ['books.tags'],
      populateWhere: PopulateHint.INFER,
      orderBy: [
        { books: { tags: { name: QueryOrder.DESC } } },
        { books: { title: QueryOrder.ASC } },
      ],
    });
    expect(a4.books.map(b => b.title)).toEqual(['b4', 'b1', 'b2']); // first strange tag (desc), then silly by name (asc)
    orm.em.clear();

    const a5 = await orm.em.findOneOrFail(Author2, { books: { tags: { name: { $in: ['silly', 'strange'] } } } }, {
      populate: ['books.tags'],
      populateWhere: PopulateHint.ALL,
      orderBy: [
        { books: { tags: { name: QueryOrder.DESC } } },
        { books: { title: QueryOrder.ASC } },
      ],
    });
    expect(a5.books.map(b => b.title)).toEqual(['b4', 'b1', 'b2', 'b3', 'b5']);
    orm.em.clear();

    const a6 = await orm.em.findOneOrFail(Author2, { books: { tags: { name: { $in: ['silly', 'strange'] } } } }, {
      populate: ['books.tags'],
      populateWhere: {},
      orderBy: [
        { books: { tags: { name: QueryOrder.DESC } } },
        { books: { title: QueryOrder.ASC } },
      ],
    });
    expect(a6.books.map(b => b.title)).toEqual(['b4', 'b1', 'b2', 'b3', 'b5']);
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
    let book = (await orm.em.findOne(Book2, book1.uuid))!;
    expect(book.tags.isInitialized()).toBe(false);
    expect(book.tags.toJSON()).toEqual([]);
    await book.tags.init();
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.count()).toBe(2);
    expect(book.tags.toJSON()).toHaveLength(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag2);
    expect(book.tags.getItems()[0].id).toBeDefined();
    expect(wrap(book.tags.getItems()[0]).isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tagRepository.getReference(tag1.id));
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
    expect(book.tags.slice(0, 3).length).toBe(3);
    expect(book.tags.slice(0, 1)).toEqual([book.tags[0]]);
    expect(book.tags.slice(1, 2)).toEqual([book.tags[1]]);

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

  test('many to many working with inverse side', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    let book4 = new Book2('Another Book', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist([book1, book2, book3, book4]);
    await orm.em.flush();
    orm.em.clear();

    let tag = await orm.em.findOneOrFail(BookTag2, tag1.id, { populate: ['books'] });
    expect(tag.books.count()).toBe(2);
    tag.books.add(orm.em.getReference(Book2, book4.uuid));
    await orm.em.flush();
    orm.em.clear();
    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, { populate: ['books'] });
    expect(tag.books.count()).toBe(3);
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, { populate: ['books'] });
    book4 = await orm.em.findOneOrFail(Book2, book4.uuid, { populate: ['tags.books'] });

    // to check that circular serialization works fine with chain of populated collections
    expect(JSON.stringify(book4)).not.toEqual({});

    tag.books.add(book4);
    tag.books.add(new Book2('ttt', new Author2('aaa', 'bbb')));
    await orm.em.flush();
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, { populate: ['books'] });
    expect(tag.books.count()).toBe(4);
  });

  test('many to many working with inverse side persistence', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const book4 = new Book2('Another Book', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist([book1, book2, book3, book4]);
    await orm.em.flush();
    orm.em.clear();

    let tag = await orm.em.findOneOrFail(BookTag2, tag1.id);
    tag.books.removeAll();
    await orm.em.flush();
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, { populate: ['books'] as const });
    expect(tag.books.count()).toBe(0);
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
    const repo = orm.em.getRepository(Publisher2);

    orm.em.clear();
    const publishers = await repo.findAll({ populate: ['tests'], orderBy: { id: 1 } });
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
    const publishers2 = await repo.findAll({ populate: ['tests:ref'], orderBy: { id: 1 } });
    expect(publishers2).toBeInstanceOf(Array);
    expect(publishers2.length).toBe(2);
    expect(publishers2[0]).toBeInstanceOf(Publisher2);
    expect(publishers2[0].tests).toBeInstanceOf(Collection);
    expect(publishers2[0].tests.isInitialized()).toBe(true);
    expect(publishers2[0].tests.isInitialized(true)).toBe(true); // empty collection
    expect(publishers2[0].tests.isDirty()).toBe(false);
    expect(publishers2[0].tests.count()).toBe(0);
    expect(publishers2[1].tests.isInitialized(true)).toBe(false); // collection with references only
    expect(wrap(publishers2[1].tests[0]).isInitialized()).toBe(false);

    orm.em.clear();
    const publishers3 = await repo.findAll({ populate: ['tests:ref'], strategy: 'joined', orderBy: { id: 1 } });
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

    orm.em.clear();
    const publishers4 = await repo.findAll({ orderBy: { id: 1 } });
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
    const publishers5 = await repo.findAll({ orderBy: { id: 1 } });
    await publishers5[0].tests.init({ ref: true });
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

  test('populating many to many relation on inverse side', async () => {
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
    const repo = orm.em.getRepository(BookTag2);

    orm.em.clear();
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

  test('nested populating', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);

    // as we order by Book.createdAt when populating collection, we need to make sure values will be sequential
    book1.createdAt = new Date(Date.now() + 1);
    book1.publisher = ref(new Publisher2('B1 publisher'));
    book1.publisher.unwrap().tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = ref(new Publisher2('B2 publisher'));
    book2.publisher.unwrap().tests.add(Test2.create('t21'), Test2.create('t22'));
    book3.createdAt = new Date(Date.now() + 3);
    book3.publisher = ref(new Publisher2('B3 publisher'));
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
    orm.em.clear();

    const tags0 = await orm.em.findAll(BookTag2, {
      populate: ['books.publisher.tests', 'books.author'],
    });
    expect(tags0.length).toBe(5);
    expect(tags0[0]).toBeInstanceOf(BookTag2);
    expect(tags0[0].books.isInitialized()).toBe(true);
    expect(tags0[0].books.count()).toBe(2);
    expect(wrap(tags0[0].books[0]).isInitialized()).toBe(true);
    expect(tags0[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags0[0].books[0].author).isInitialized()).toBe(true);
    expect(tags0[0].books[0].author.name).toBe('Jon Snow');
    expect(tags0[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags0[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags0[0].books[0].publisher!).isInitialized()).toBe(true);
    expect(tags0[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags0[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags0[0].books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(tags0[0].books[0].publisher!.unwrap().tests[1].name).toBe('t12');
    orm.em.clear();

    const tags1 = await orm.em.findAll(BookTag2, {
      populate: ['books.publisher.tests', 'books.author'],
      orderBy: { books: { publisher: { tests: -1 } } },
    });
    expect(tags1.length).toBe(5);
    expect(tags1[0]).toBeInstanceOf(BookTag2);
    expect(tags1[0].books.isInitialized()).toBe(true);
    expect(tags1[0].books.count()).toBe(2);
    expect(wrap(tags1[0].books[0]).isInitialized()).toBe(true);
    expect(tags1[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags1[0].books[0].author).isInitialized()).toBe(true);
    expect(tags1[0].books[0].author.name).toBe('Jon Snow');
    expect(tags1[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags1[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags1[0].books[0].publisher!).isInitialized()).toBe(true);
    expect(tags1[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags1[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags1[0].books[0].publisher!.unwrap().tests[0].name).toBe('t32');
    expect(tags1[0].books[0].publisher!.unwrap().tests[1].name).toBe('t31');
    orm.em.clear();

    const tags2 = await orm.em.findAll(BookTag2, {
      populate: ['books.publisher.tests', 'books.author'],
      orderBy: { books: { publisher: { tests: { name: -1 } } } },
    });
    expect(tags2.length).toBe(5);
    expect(tags2[0]).toBeInstanceOf(BookTag2);
    expect(tags2[0].books.isInitialized()).toBe(true);
    expect(tags2[0].books.count()).toBe(2);
    expect(wrap(tags2[0].books[0]).isInitialized()).toBe(true);
    expect(tags2[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags2[0].books[0].author).isInitialized()).toBe(true);
    expect(tags2[0].books[0].author.name).toBe('Jon Snow');
    expect(tags2[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags2[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags2[0].books[0].publisher!).isInitialized()).toBe(true);
    expect(tags2[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags2[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags2[0].books[0].publisher!.unwrap().tests[0].name).toBe('t32');
    expect(tags2[0].books[0].publisher!.unwrap().tests[1].name).toBe('t31');
    orm.em.clear();

    const tags3 = await orm.em.findAll(BookTag2, {
      populate: ['books.publisher.tests', 'books.author'],
      orderBy: { books: { publisher: { tests: { id: 1 } } } },
    });
    expect(tags3.length).toBe(5);
    expect(tags3[0]).toBeInstanceOf(BookTag2);
    expect(tags3[0].books.isInitialized()).toBe(true);
    expect(tags3[0].books.count()).toBe(2);
    expect(wrap(tags3[0].books[0]).isInitialized()).toBe(true);
    expect(tags3[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags3[0].books[0].author).isInitialized()).toBe(true);
    expect(tags3[0].books[0].author.name).toBe('Jon Snow');
    expect(tags3[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags3[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags3[0].books[0].publisher!).isInitialized()).toBe(true);
    expect(tags3[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags3[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags3[0].books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(tags3[0].books[0].publisher!.unwrap().tests[1].name).toBe('t12');
    orm.em.clear();

    const books = await orm.em.findAll(Book2, {
      populate: ['publisher.tests', 'author'],
      orderBy: { title: 1, publisher: { tests: 1 } },
    });
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book2);
    expect(wrap(books[0]).isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author2);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Reference);
    expect(books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(books[0].publisher!).isInitialized()).toBe(true);
    expect(books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher!.unwrap().tests[1].name).toBe('t12');
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
    let t1 = Test2.create('t1');
    let t2 = Test2.create('t2');
    let t3 = Test2.create('t3');
    await orm.em.persistAndFlush([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await orm.em.persistAndFlush(publisher);
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id, { populate: ['tests'] }))!;
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    [t1, t2, t3] = ent.tests.getItems();
    ent.tests.set([t3, t2, t1]);
    await orm.em.flush();
    orm.em.clear();

    const ent1 = (await repo.findOne(publisher.id, { populate: ['tests'] }))!;
    await expect(ent1.tests.count()).toBe(3);
    await expect(ent1.tests.getIdentifiers()).toEqual([t3.id, t2.id, t1.id]);
  });

  test('collection allows populate, custom where and orderBy', async () => {
    const book = new Book2('My Life on The Wall, part 1', new Author2('name', 'email'));
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book.tags.add(tag1, tag2, tag3, tag4, tag5);

    const author = new Author2('Bartleby', 'bartelby@writer.org');
    author.books.add(book);

    await orm.em.persistAndFlush(author);

    orm.em.clear();
    const ent1 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent1.tags.init();
    expect(ent1.tags.map(t => t.name)).toEqual([tag1.name, tag2.name, tag3.name, tag4.name, tag5.name]);

    orm.em.clear();
    const ent2 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent2.tags.init({ orderBy: { name: QueryOrder.DESC } });
    expect(ent2.tags.map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name, tag2.name]);

    orm.em.clear();
    const ent3 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent3.tags.init({ where: { name: { $ne: 'funny' } }, orderBy: { name: QueryOrder.DESC } });
    expect(ent3.tags.map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name]);

    orm.em.clear();
    const ent4 = await orm.em.findOneOrFail(Author2, author.id);
    await ent4.books.init({
      populate: ['tags'],
    });
    expect(ent4.books[0].tags.count()).toBe(5);
  });

  test('many to many collection allows custom orderBy', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    const tag6 = new BookTag2('zupa');
    const tag7 = new BookTag2('awkward');
    book1.tags.add(tag1, tag3, tag6, tag7);
    book2.tags.add(tag1, tag2, tag5, tag6);
    book3.tags.add(tag2, tag4, tag5, tag7);
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const books = await orm.em.findAll(Book2, {
      where: { tags: { name: { $ne: 'funny' } } },
      populate: ['tags'],
      populateWhere: PopulateHint.INFER,
      orderBy: { title: QueryOrder.DESC, tags: { name: QueryOrder.ASC } },
    });
    expect(books.length).toBe(3);
    expect(books[0].title).toBe('My Life on The Wall, part 3');
    expect(books[0].tags.map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    expect(books[1].title).toBe('My Life on The Wall, part 2');
    expect(books[1].tags.map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    expect(books[2].title).toBe('My Life on The Wall, part 1');
    expect(books[2].tags.map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);
  });

  test('populateWhere: all/infer with different loading strategies', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.perex = ref('asd 1');
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.perex = ref('asd 2');
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.perex = ref('asd 3');
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    const tag6 = new BookTag2('zupa');
    const tag7 = new BookTag2('awkward');
    book1.tagsUnordered.add(tag1, tag3, tag6, tag7);
    book2.tagsUnordered.add(tag1, tag2, tag5, tag6);
    book3.tagsUnordered.add(tag2, tag4, tag5, tag7);
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);

    orm.em.clear();
    const books1 = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, {
      populate: ['tagsUnordered', 'perex'],
      populateWhere: PopulateHint.ALL,
      orderBy: { title: QueryOrder.DESC },
      strategy: 'select-in',
    });
    expect(books1.length).toBe(3);
    expect(books1[0].perex).toBeInstanceOf(ScalarReference);
    expect(books1[0].perex?.$).toBe('asd 3');
    expect(books1[0].title).toBe('My Life on The Wall, part 3');
    expect(books1[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'funny', 'sexy', 'strange']);
    expect(books1[1].title).toBe('My Life on The Wall, part 2');
    expect(books1[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['funny', 'sexy', 'silly', 'zupa']);
    expect(books1[2].title).toBe('My Life on The Wall, part 1');
    expect(books1[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    orm.em.clear();
    const books2 = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, {
      populate: ['tagsUnordered', 'perex'],
      populateWhere: PopulateHint.INFER,
      orderBy: { title: QueryOrder.DESC },
      strategy: 'select-in',
    });
    expect(books2.length).toBe(3);
    expect(books2[0].perex).toBeInstanceOf(ScalarReference);
    expect(books2[0].perex?.$).toBe('asd 3');
    expect(books2[0].title).toBe('My Life on The Wall, part 3');
    expect(books2[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    expect(books2[1].title).toBe('My Life on The Wall, part 2');
    expect(books2[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    expect(books2[2].title).toBe('My Life on The Wall, part 1');
    expect(books2[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    const mock = mockLogger(orm, ['query']);

    orm.em.clear();
    const books3 = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, {
      populate: ['tagsUnordered', 'perex'],
      populateWhere: PopulateHint.ALL,
      orderBy: { title: QueryOrder.DESC },
      strategy: 'joined',
    });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name`, `t5`.`id` as `t5__id` ' +
      'from `book2` as `b0` ' +
      'left join `book_to_tag_unordered` as `b2` on `b0`.`uuid_pk` = `b2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t1` on `b2`.`book_tag2_id` = `t1`.`id` ' +
      'left join `book_to_tag_unordered` as `b4` on `b0`.`uuid_pk` = `b4`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `b3` on `b4`.`book_tag2_id` = `b3`.`id` ' +
      'left join `test2` as `t5` on `b0`.`uuid_pk` = `t5`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b3`.`name` != ? ' +
      'order by `b0`.`title` desc, `t1`.`name` asc');
    expect(books3.length).toBe(3);
    expect(books3[0].perex).toBeInstanceOf(ScalarReference);
    expect(books3[0].perex?.$).toBe('asd 3');
    expect(books3[0].title).toBe('My Life on The Wall, part 3');
    expect(books3[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'funny', 'sexy', 'strange']);
    expect(books3[1].title).toBe('My Life on The Wall, part 2');
    expect(books3[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['funny', 'sexy', 'silly', 'zupa']);
    expect(books3[2].title).toBe('My Life on The Wall, part 1');
    expect(books3[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    orm.em.clear();
    mock.mockReset();
    const books4 = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, {
      populate: ['tagsUnordered', 'perex'],
      populateWhere: PopulateHint.INFER,
      orderBy: { title: QueryOrder.DESC },
      strategy: 'joined',
    });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name`, `t3`.`id` as `t3__id` ' +
      'from `book2` as `b0` ' +
      'left join `book_to_tag_unordered` as `b2` on `b0`.`uuid_pk` = `b2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t1` on `b2`.`book_tag2_id` = `t1`.`id` and `t1`.`name` != ? ' +
      'left join `test2` as `t3` on `b0`.`uuid_pk` = `t3`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `t1`.`name` != ? ' +
      'order by `b0`.`title` desc, `t1`.`name` asc');

    expect(books4.length).toBe(3);
    expect(books4[0].perex).toBeInstanceOf(ScalarReference);
    expect(books4[0].perex?.$).toBe('asd 3');
    expect(books4[0].title).toBe('My Life on The Wall, part 3');
    expect(books4[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    expect(books4[1].title).toBe('My Life on The Wall, part 2');
    expect(books4[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    expect(books4[2].title).toBe('My Life on The Wall, part 1');
    expect(books4[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    orm.em.clear();
    mock.mockReset();
    const books5 = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, {
      populate: ['tagsUnordered', 'perex'],
      populateWhere: { tagsUnordered: { name: { $ne: 'funny' } } },
      orderBy: { title: QueryOrder.DESC },
      strategy: 'joined',
    });

    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name`, `t5`.`id` as `t5__id` ' +
      'from `book2` as `b0` ' +
      'left join `book_to_tag_unordered` as `b2` on `b0`.`uuid_pk` = `b2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t1` on `b2`.`book_tag2_id` = `t1`.`id` and `t1`.`name` != ? ' +
      'left join `book_to_tag_unordered` as `b4` on `b0`.`uuid_pk` = `b4`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `b3` on `b4`.`book_tag2_id` = `b3`.`id` ' +
      'left join `test2` as `t5` on `b0`.`uuid_pk` = `t5`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b3`.`name` != ? ' +
      'order by `b0`.`title` desc, `t1`.`name` asc');

    expect(books5.length).toBe(3);
    expect(books5[0].perex).toBeInstanceOf(ScalarReference);
    expect(books5[0].perex?.$).toBe('asd 3');
    expect(books5[0].title).toBe('My Life on The Wall, part 3');
    expect(books5[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    expect(books5[1].title).toBe('My Life on The Wall, part 2');
    expect(books5[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    expect(books5[2].title).toBe('My Life on The Wall, part 1');
    expect(books5[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const tags = await orm.em.find(BookTag2, { booksUnordered: { title: { $ne: 'My Life on The Wall, part 3' } } }, {
      populate: ['booksUnordered.perex'],
      populateWhere: PopulateHint.INFER,
      orderBy: { name: QueryOrder.ASC },
    });
    expect(tags.length).toBe(6);
    expect(tags.map(tag => tag.name)).toEqual(['awkward', 'funny', 'sexy', 'sick', 'silly', 'zupa']);
    expect(tags.map(tag => tag.booksUnordered.count())).toEqual([1, 1, 1, 1, 2, 2]);
  });

  test('self referencing M:N (unidirectional)', async () => {
    const a1 = new Author2('A1', 'a1@wall.st');
    const a2 = new Author2('A2', 'a2@wall.st');
    const a3 = new Author2('A3', 'a3@wall.st');
    const author = new Author2('Jon Snow', 'snow@wall.st');
    a1.address = new Address2(a1, 'val');
    author.friends.add(a1, a2, a3, author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const jon = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['friends'],
      orderBy: { friends: { name: QueryOrder.ASC } },
      strategy: 'select-in',
    });
    expect(jon.friends.isInitialized(true)).toBe(true);
    expect(jon.friends.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);
    expect(jon.friends[0].name).toBe('A1');
    // console.log(111);
    expect(jon.friends[0].address).not.toBeUndefined();
    expect(wrap(jon.friends[0].address!).isInitialized()).toBe(false);
    // console.log(222);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a3`.`author_id` as `a3__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `author_to_friend` as `a2` on `a0`.`id` = `a2`.`author2_1_id` ' +
      'left join `author2` as `a1` on `a2`.`author2_2_id` = `a1`.`id` ' +
      'left join `address2` as `a3` on `a0`.`id` = `a3`.`author_id` ' +
      'where `a0`.`id` = ? order by `a1`.`name` asc limit ?');

    expect(mock.mock.calls[1][0]).toMatch('select `a1`.*, `a0`.`author2_2_id` as `fk__author2_2_id`, `a0`.`author2_1_id` as `fk__author2_1_id`, `a2`.`author_id` as `a2__author_id` ' +
      'from `author_to_friend` as `a0` ' +
      'inner join `author2` as `a1` on `a0`.`author2_2_id` = `a1`.`id` ' +
      'left join `address2` as `a2` on `a1`.`id` = `a2`.`author_id` ' +
      'where `a0`.`author2_1_id` in (?) ' +
      'order by `a1`.`name` asc');
    orm.em.clear();

    // console.log(222);
    const jon2 = await orm.em.findOneOrFail(Author2, { friends: a2.id }, {
      populate: ['friends'],
      orderBy: { friends: { name: QueryOrder.ASC } },
      strategy: 'select-in',
    });
    expect(mock.mock.calls[2][0]).toMatch('select `a0`.*, `a3`.`author_id` as `a3__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `author_to_friend` as `a1` on `a0`.`id` = `a1`.`author2_1_id` ' +
      'left join `author2` as `a2` on `a1`.`author2_2_id` = `a2`.`id` ' +
      'left join `address2` as `a3` on `a0`.`id` = `a3`.`author_id` ' +
      'where `a1`.`author2_2_id` = ? order by `a2`.`name` asc ' +
      'limit ?');
    expect(mock.mock.calls[3][0]).toMatch('select `a1`.*, `a0`.`author2_2_id` as `fk__author2_2_id`, `a0`.`author2_1_id` as `fk__author2_1_id`, `a2`.`author_id` as `a2__author_id` ' +
      'from `author_to_friend` as `a0` ' +
      'inner join `author2` as `a1` on `a0`.`author2_2_id` = `a1`.`id` ' +
      'left join `address2` as `a2` on `a1`.`id` = `a2`.`author_id` ' +
      'where `a0`.`author2_1_id` in (?) ' +
      'order by `a1`.`name` asc');
    expect(jon2.id).toBe(author.id);
    expect(jon2.friends.isInitialized(true)).toBe(true);
    expect(jon2.friends.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);
  });

  test('self referencing M:N (owner)', async () => {
    const a1 = new Author2('A1', 'a1@wall.st');
    const a2 = new Author2('A2', 'a2@wall.st');
    const a3 = new Author2('A3', 'a3@wall.st');
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.following.add(a1, a2, a3, author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['following'],
      orderBy: { following: { name: QueryOrder.ASC } },
    });
    expect(jon.following.isInitialized(true)).toBe(true);
    expect(jon.following.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);
    orm.em.clear();

    const jon2 = await orm.em.findOneOrFail(Author2, { following: a2.id }, {
      populate: ['following'],
      orderBy: { following: { name: QueryOrder.ASC } },
    });

    expect(jon2.id).toBe(author.id);
    expect(jon2.following.isInitialized(true)).toBe(true);
    expect(jon2.following.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);
  });

  test('self referencing M:N (inverse)', async () => {
    const a1 = new Author2('A1', 'a1@wall.st');
    const a2 = new Author2('A2', 'a2@wall.st');
    const a3 = new Author2('A3', 'a3@wall.st');
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.following.add(a1, a2, a3, author);
    a1.following.add(author);
    a3.following.add(author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = await orm.em.findOneOrFail(Author2, author.id, {
      populate: ['followers'],
      orderBy: { followers: { name: QueryOrder.ASC } },
    });
    expect(jon.followers.isInitialized(true)).toBe(true);
    expect(jon.followers.getIdentifiers()).toEqual([a1.id, a3.id, author.id]);

    const jon2 = await orm.em.findOneOrFail(Author2, { followers: a1.id }, {
      populate: ['followers'],
      orderBy: { followers: { name: QueryOrder.ASC } },
    });
    expect(jon2.id).toBe(author.id);
    expect(jon2.followers.isInitialized(true)).toBe(true);
    expect(jon.followers.getIdentifiers()).toEqual([a1.id, a3.id, author.id]);
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
    const a = new Author2('native name 1', 'native1@email.com');
    const res1 = await orm.em.insert(a);
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author2, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author2, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.insert(Author2, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2', email: 'native2@email.com' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author2, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);

    const res6 = await orm.em.nativeUpdate<Author2>('author2', { name: 'new native name' }, { name: 'native name 3' });
    expect(res6).toBe(1);

    const res7 = await orm.em.nativeDelete<Author2>('author2', res4);
    expect(res7).toBe(1);

    const id = await orm.em.insert(Author2, { name: 'native name 1', email: 'native1@email.com' });

    const res8 = await orm.em.nativeUpdate(Author2, id, { friends: [id] });
    expect(res8).toBe(0);

    const res9 = await orm.em.nativeUpdate(Author2, id, {});
    expect(res9).toBe(0);
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
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book2` (`uuid_pk`, `created_at`, `title`, `author_id`) values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('update `author2` set `favourite_author_id` = ?, `updated_at` = ? where `id` = ?');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`id` = ?');
  });

  test('self referencing 1:1 (1 step)', async () => {
    const bar = FooBar2.create('bar');
    bar.fooBar = bar;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }))!;
    expect(b1).toBe(b1.fooBar);
    expect(b1.id).not.toBeNull();
    expect(wrap(b1).toJSON().fooBar).toBe(b1.id);
    // @ts-expect-error
    expect(wrap(b1).toJSON().foo).toBeUndefined();
    // @ts-expect-error
    expect(wrap(b1).toJSON().bar).toBeUndefined();
  });

  test('persisting entities in parallel inside forked EM with copied IM', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author); // we need to flush here so the entity gets inside IM

    const saveBook = async (title: string, author: number) => {
      const em = orm.em.fork();
      const book = new Book2(title, em.getReference(Author2, author));
      await em.persistAndFlush(book);
    };

    await Promise.all([
      saveBook('b1', author.id),
      saveBook('b2', author.id),
      saveBook('b3', author.id),
    ]);

    orm.em.clear();
    const a1 = (await orm.em.findOne(Author2, author.id, { populate: ['books'] }))!;
    expect(a1.books.count()).toBe(3);
  });

  test('lookup by array', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    await expect(orm.em.count(Book2, [book1.uuid, book2.uuid, book3.uuid])).resolves.toBe(3);
    await expect(orm.em.count(Book2, [book1, book2, book3])).resolves.toBe(3);
    await expect(orm.em.count(Book2, [book1, book2, book3])).resolves.toBe(3);
    const a = await orm.em.find(Book2, [book1, book2, book3]) as Book2[];
    await expect(orm.em.getRepository(Book2).count([book1, book2, book3])).resolves.toBe(3);
  });

  test('insert with raw sql fragment', async () => {
    const author = orm.em.create(Author2, { id: 1, name: 'name', email: 'email', age: raw('100 + 20 + 3') });
    const mock = mockLogger(orm, ['query', 'query-params']);
    expect(() => (author.age as number)++).toThrow();
    expect(() => JSON.stringify(author)).toThrow();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/insert into `author2` \(`id`, `created_at`, `updated_at`, `name`, `email`, `age`, `terms_accepted`\) values \(1, '.*', '.*', 'name', 'email', 100 \+ 20 \+ 3, false\)/);
    expect(mock.mock.calls[2][0]).toMatch('select `a0`.`id`, `a0`.`age` from `author2` as `a0` where `a0`.`id` in (1)');
    expect(mock.mock.calls[3][0]).toMatch('commit');

    expect(author.age).toBe(123);
  });

  test('update with raw sql fragment', async () => {
    await orm.em.insert(Author2, { id: 1, name: 'name', email: 'email', age: 123 });
    const mock = mockLogger(orm, ['query', 'query-params']);

    const ref = orm.em.getReference(Author2, 1);
    ref.age = raw(`age * 2`);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update `author2` set `age` = age \* 2, `updated_at` = '.*' where `id` = 1/);
    expect(mock.mock.calls[2][0]).toMatch('select `a0`.`id`, `a0`.`age` from `author2` as `a0` where `a0`.`id` in (1)');
    expect(mock.mock.calls[3][0]).toMatch('commit');

    expect(ref.age).toBe(246);
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
    expect(mock.mock.calls[1][0]).toMatch(/update `author2` set `age` = case when \(`id` = 1\) then age \* 2 when \(`id` = 2\) then age \/ 2 else `age` end, `updated_at` = case when \(`id` = 1\) then '.*' when \(`id` = 2\) then '.*' else `updated_at` end where `id` in \(1, 2\)/);
    expect(mock.mock.calls[2][0]).toMatch('select `a0`.`id`, `a0`.`age` from `author2` as `a0` where `a0`.`id` in (1, 2)');
    expect(mock.mock.calls[3][0]).toMatch('commit');

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
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['perex'], strategy: 'select-in' });
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeInstanceOf(Test2);
    expect(wrap(res1[0].test!).isInitialized()).toBe(false);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t2`.`id` as `t2__id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` ' + // auto-joined 1:1 to get test id as book is inverse side
      'where `b0`.`author_id` is not null and `a1`.`name` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, { populate: ['perex'], strategy: 'select-in' });
    expect(res2).toHaveLength(3);
    expect(res2[0].test).toBeInstanceOf(Test2);
    expect(wrap(res2[0].test!).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t4`.`id` as `t4__id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `book2` as `b2` on `a1`.`favourite_book_uuid_pk` = `b2`.`uuid_pk` ' +
      'left join `author2` as `a3` on `b2`.`author_id` = `a3`.`id` ' +
      'left join `test2` as `t4` on `b0`.`uuid_pk` = `t4`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `a3`.`name` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, { populate: ['perex'], strategy: 'select-in' });
    expect(res3).toHaveLength(3);
    expect(res3[0].test).toBeInstanceOf(Test2);
    expect(wrap(res3[0].test!).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t2`.`id` as `t2__id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `a1`.`favourite_book_uuid_pk` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, { populate: ['perex'], strategy: 'select-in' });
    expect(res4).toHaveLength(3);
    expect(res4[0].test).toBeInstanceOf(Test2);
    expect(wrap(res4[0].test!).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t4`.`id` as `t4__id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `book2` as `b2` on `a1`.`favourite_book_uuid_pk` = `b2`.`uuid_pk` ' +
      'left join `author2` as `a3` on `b2`.`author_id` = `a3`.`id` ' +
      'left join `test2` as `t4` on `b0`.`uuid_pk` = `t4`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `a3`.`name` = ?');
  });

  test('question marks and parameter interpolation (GH issue #920)', async () => {
    const e = new FooBaz2(`?baz? uh \\? ? wut? \\\\ wut`);
    await orm.em.persistAndFlush(e);
    const e2 = await orm.em.fork().findOneOrFail(FooBaz2, e);
    expect(e2.name).toBe(`?baz? uh \\? ? wut? \\\\ wut`);
    const res = await orm.em.getKnex().raw('select ? as count', [1]);
    expect(res[0][0].count).toBe(1);
  });

  test('allow undefined value in nullable properties', async () => {
    let god = new Author2('God', 'hello@heaven.god');
    god.age = 21;
    god.born = '0001-01-01';
    await orm.em.persistAndFlush(god);

    god.age = undefined;
    god.born = undefined;
    await orm.em.flush();

    orm.em.clear();
    god = (await orm.em.findOne(Author2, god.id))!;
    expect(god).toBeInstanceOf(Author2);
    expect(god.age).toBeNull();
    expect(god.born).toBeNull();
  });

  test('find and count', async () => {
    for (let i = 1; i <= 30; i++) {
      orm.em.persist(new Author2('God ' + i, `hello-${i}@heaven.god`));
    }

    await orm.em.flush();
    orm.em.clear();

    const [authors1, count1] = await orm.em.findAndCount(Author2, {}, { limit: 10, offset: 10, orderBy: { id: QueryOrder.ASC } });
    expect(authors1).toHaveLength(10);
    expect(count1).toBe(30);
    expect(authors1[0]).toBeInstanceOf(Author2);
    expect(authors1[0].name).toBe('God 11');
    expect(authors1[9].name).toBe('God 20');
    orm.em.clear();

    const [authors2, count2] = await orm.em.findAndCount(Author2, {}, { limit: 10, offset: 25, fields: ['name'], orderBy: { id: QueryOrder.ASC } });
    expect(authors2).toHaveLength(5);
    // @ts-expect-error
    expect(authors2[0].email).toBeUndefined();
    expect(count2).toBe(30);
    expect(authors2[0].name).toBe('God 26');
    expect(authors2[4].name).toBe('God 30');
  });

  test('query highlighting', async () => {
    const mock = mockLogger(orm, ['query']);
    Object.assign(orm.config.getLogger(), { highlighter: new SqlHighlighter() });

    const author = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('[37m[1minsert[22m[39m [37m[1minto[22m[39m [33m`author2`[39m ([33m`created_at`[39m[0m,[0m [33m`updated_at`[39m[0m,[0m [33m`name`[39m[0m,[0m [33m`email`[39m[0m,[0m [33m`terms_accepted`[39m) [37m[1mvalues[22m[39m (?[0m,[0m ?[0m,[0m ?[0m,[0m ?[0m,[0m ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    Object.assign(orm.config.getLogger(), { highlighter: new NullHighlighter() });
  });

  test('colors: false', async () => {
    const mock = mockLogger(orm, ['query']);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch("\x1B[90m[query] \x1B[39mbegin\x1B[36m (via write connection '127.0.0.1')\x1B[39m");
    expect(mock.mock.calls[1][0]).toMatch(/\x1B\[90m\[query] \x1B\[39minsert into `author2` \(`created_at`, `updated_at`, `name`, `email`, `terms_accepted`\) values \(\?, \?, \?, \?, \?\)\x1B\[90m \[took \d+ ms, 1 row affected]\x1B\[39m\x1B\[36m \(via write connection '127\.0\.0\.1'\)\x1B\[39m/);
    expect(mock.mock.calls[2][0]).toMatch("\x1B[90m[query] \x1B[39mcommit\x1B[36m (via write connection '127.0.0.1')\x1B[39m");

    orm.config.set('colors', false);
    mock.mockReset();
    await orm.em.removeAndFlush(author);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch("[query] begin (via write connection '127.0.0.1')");
    expect(mock.mock.calls[1][0]).toMatch(/\[query] delete from `author2` where `id` in \(\?\) \[took \d+ ms, 1 row affected] \(via write connection '127\.0\.0\.1'\)/);
    expect(mock.mock.calls[2][0]).toMatch("[query] commit (via write connection '127.0.0.1')");
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author2('n', 'e');
    author.createdAt = new Date('2000-01-01T00:00:00Z');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ created_at: string }[]>(`select date_format(created_at, '%Y-%m-%d %T.%f') as created_at from author2 where id = ${author.id}`);
    expect(res[0].created_at).toBe('2000-01-01 00:00:00.000000');
    const a = await orm.em.findOneOrFail(Author2, author.id);
    expect(+a.createdAt!).toBe(+author.createdAt);
    const a1 = await orm.em.findOneOrFail(Author2, { createdAt: { $eq: a.createdAt } });
    expect(+a1.createdAt!).toBe(+author.createdAt);
    expect(orm.em.merge(a1)).toBe(a1);
    const a2 = await orm.em.findOneOrFail(Author2, { updatedAt: { $eq: a.updatedAt } });
    expect(+a2.updatedAt!).toBe(+author.updatedAt);
  });

  test('setting optional boolean to false', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author2, author.id);
    expect(a1.optional).toBeNull();
    a1.optional = false;
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author.id);
    expect(a2.optional).toBe(false);
  });

  test('find where property is not null ($ne operator)', async () => {
    const author = new Author2('n', 'e');
    const book1 = new Book2('b1', author);
    book1.publisher = wrap(new Publisher2('p')).toReference();
    const book2 = new Book2('b2', author);
    await orm.em.persistAndFlush([book1, book2]);
    orm.em.clear();

    const res = await orm.em.find(Book2, { publisher: { $ne: null } });
    expect(res.length).toBe(1);
    expect(res[0].publisher).toBeInstanceOf(Reference);
    expect(res[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(res[0].publisher!.isInitialized()).toBe(false);
    expect(res[0].publisher!.id).toBe(1);
  });

  test('calling Collection.init in parallel', async () => {
    const author = new Author2('n', 'e');
    author.books.add(new Book2('b1', author));
    author.books.add(new Book2('b2', author));
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const author2 = await orm.em.findOneOrFail(Author2, author.id);
    const p1 = author2.books.init();
    const p2 = author2.books.init();
    await Promise.all([p1, p2]);

    expect(author2.books.length).toEqual(2);
  });

  test('explicit removing of entity that is loaded as a relation already', async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(FooBar2, bar.id, { populate: ['baz'] });
    orm.em.remove(a.baz!);

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('delete from `foo_baz2` where `id` in (?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('em.remove() with null or undefined in where parameter throws', async () => {
    expect(() => orm.em.remove(undefined as any)).toThrow(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
    expect(() => orm.em.remove(null as any)).toThrow(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
    expect(() => orm.em.remove({} as any)).toThrow(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
    expect(() => orm.em.remove({ foo: 1 } as any)).toThrow(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
  });

  test('adding items to not initialized collection', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const b1 = new Book2('Bible 1', god);
    await orm.em.persistAndFlush(b1);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(Author2, god.id);
    expect(a.books.isInitialized()).toBe(false);
    const b2 = new Book2('Bible 2', a);
    const b3 = new Book2('Bible 3', a);
    a.books.add(b2, b3);
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, god.id, { populate: ['books'] });
    expect(a2.books.count()).toBe(3);
    expect(a2.books.getIdentifiers()).toEqual([b1.uuid, b2.uuid, b3.uuid]);

    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    let tag5 = new BookTag2('sexy');
    a2.books[0].tags.add(tag1);
    a2.books[1].tags.add(tag1);
    a2.books[2].tags.add(tag5);
    await orm.em.flush();
    orm.em.clear();

    const a3 = await orm.em.findOneOrFail(Author2, god.id, { populate: ['books'] });
    tag5 = orm.em.getReference(BookTag2, tag5.id);
    a3.books[0].tags.add(tag3);
    a3.books[1].tags.add(tag2, tag5);
    a3.books[2].tags.add(tag4);
    await orm.em.flush();
    orm.em.clear();

    const a4 = await orm.em.findOneOrFail(Author2, god.id, { populate: ['books.tags'] });
    expect(a4.books[0].tags.getIdentifiers()).toEqual([tag1.id, tag3.id]);
    expect(a4.books[1].tags.getIdentifiers()).toEqual([tag1.id, tag2.id, tag5.id]);
    expect(a4.books[2].tags.getIdentifiers()).toEqual([tag5.id, tag4.id]);
    orm.em.clear();

    const tag = await orm.em.findOneOrFail(BookTag2, tag1.id);
    const book = await orm.em.findOneOrFail(Book2, b3.uuid);
    tag.books.add(book);
    await orm.em.flush();
    orm.em.clear();
  });

  test('pagination', async () => {
    for (let i = 1; i <= 10; i++) {
      const num = `${i}`.padStart(2, '0');
      const god = new Author2(`God ${num}`, `hello${num}@heaven.god`);
      const b1 = new Book2(`Bible ${num}.1`, god);
      const b2 = new Book2(`Bible ${num}.2`, god);
      const b3 = new Book2(`Bible ${num}.3`, god);
      await orm.em.persistAndFlush([b1, b2, b3]);
      orm.em.persist(god);
    }

    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // select `a0`.*, `a1`.`author_id` as `a1__author_id`
    // from `author2` as `a0`
    // left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`
    // left join `book2` as `b2` on `a0`.`id` = `b2`.`author_id`
    // where `b2`.`title` like 'Bible%'
    // group by `a0`.`id`, `a0`.`name`, `b1`.`title`
    // having (`a0`.`age` > 0 or `a0`.`age` <= 0 or `a0`.`age` is null)
    // order by `a0`.`name` asc, `b2`.`title` asc limit 5
    // Unknown column 'b1.title' in 'group statement'

    // without paginate flag it fails to get only 2 records (we need to explicitly disable it)
    const res1 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      limit: 5,
      groupBy: ['id', 'name', 'b1.title'],
      having: { $or: [{ age: { $gt: 0 } }, { age: { $lte: 0 } }, { age: null }] }, // no-op just for testing purposes
      strategy: 'select-in',
    });

    expect(res1).toHaveLength(2);
    expect(res1.map(a => a.name)).toEqual(['God 01', 'God 02']);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.`title` like ? ' +
      'group by `a0`.`id`, `a0`.`name`, `b1`.`title` ' +
      'having (`a0`.`age` > ? or `a0`.`age` <= ? or `a0`.`age` is null) ' +
      'order by `a0`.`name` asc, `b1`.`title` asc ' +
      'limit ?');

    // with paginate flag (and a bit of dark sql magic) we get what we want
    const res2 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
      flags: [QueryFlag.PAGINATE],
      strategy: 'select-in',
    });

    expect(res2).toHaveLength(5);
    expect(res2.map(a => a.name)).toEqual(['God 04', 'God 05', 'God 06', 'God 07', 'God 08']);
    expect(mock.mock.calls[1][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `a0`.`id` in (select `a0`.`id` from (select `a0`.`id` from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.`title` like ? ' +
      'group by `a0`.`id` ' +
      'order by min(`a0`.`name`) asc, min(`b1`.`title`) asc limit ? offset ?) as `a0`) ' +
      'order by `a0`.`name` asc, `b1`.`title` asc');

    // with paginate flag without offset
    const res3 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      limit: 5,
      flags: [QueryFlag.PAGINATE],
    });

    expect(res3).toHaveLength(5);
    expect(res3.map(a => a.name)).toEqual(['God 01', 'God 02', 'God 03', 'God 04', 'God 05']);
  });

  test('formulas', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.price = 1000;
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const b = await orm.em.findOneOrFail(Book2, { author: { name: 'God' } }, { strategy: 'select-in' });
    expect(b.price).toBe(1000.00);
    expect(b.priceTaxed).toBe('1190.0000');
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t2`.`id` as `t2__id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `a1`.`name` = ? ' +
      'limit ?');

    // should trigger auto-flush
    orm.em.create(FooBar2, { name: 'f' });
    await orm.em.findOneOrFail(FooBar2, { random: { $gt: 0.5 } }, { having: { random: { $gt: 0.5 } } });
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `foo_bar2` (`name`) values (?)');
    expect(mock.mock.calls[3][0]).toMatch('select `f0`.`id`, `f0`.`version` from `foo_bar2` as `f0` where `f0`.`id` in (?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch('select `f0`.*, (select 123) as `random` from `foo_bar2` as `f0` where (select 123) > ? having (select 123) > ? limit ?');
  });

  test('lazy formulas (gh #1229)', async () => {
    const b = FooBar2.create('b');
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const b1 = await orm.em.findOneOrFail(FooBar2, b.id);
    expect(b1.random).toBe(123);
    expect(b1.lazyRandom).toBeUndefined();
    await wrap(b1).populate(['lazyRandom']);
    expect(b1.lazyRandom).toBe(456);
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, (select 123) as `random` from `foo_bar2` as `f0` where `f0`.`id` = ? limit ?');
    expect(mock.mock.calls[1][0]).toMatch('select `f0`.`id`, (select 456) as `lazy_random` from `foo_bar2` as `f0` where `f0`.`id` in (?)');
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, b.id, { populate: ['lazyRandom'] });
    expect(b2.random).toBe(123);
    expect(b2.lazyRandom).toBe(456);
    expect(mock.mock.calls[2][0]).toMatch('select `f0`.*, (select 123) as `random`, (select 456) as `lazy_random` from `foo_bar2` as `f0` where `f0`.`id` = ? limit ?');
  });

  test('search by formulas (gh #3048)', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.price = 1000;
    god.favouriteBook = bible;
    await orm.em.persistAndFlush(bible);

    const mock = mockLogger(orm, ['query']);

    const b = await orm.em.fork().findOneOrFail(Book2, { priceTaxed: '1190.0000' }, { strategy: 'select-in' });
    expect(b.price).toBe(1000.00);
    expect(b.priceTaxed).toBe('1190.0000');
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.price * 1.19 = ? limit ?');

    const a1 = await orm.em.fork().find(Author2, { $or: [{ favouriteBook: { priceTaxed: '1190.0000' } }] }, { populate: ['books'], strategy: 'select-in' });
    expect(a1[0].books[0].price).toBe(1000.00);
    expect(a1[0].books[0].priceTaxed).toBe('1190.0000');
    expect(mock.mock.calls[1][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`favourite_book_uuid_pk` = `b1`.`uuid_pk` ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.price * 1.19 = ?');
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');

    const a2 = await orm.em.fork().find(Author2, { favouriteBook: { $or: [{ priceTaxed: '1190.0000' }] } }, { populate: ['books'], strategy: 'select-in' });
    expect(a2[0].books[0].price).toBe(1000.00);
    expect(a2[0].books[0].priceTaxed).toBe('1190.0000');
    expect(mock.mock.calls[3][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`favourite_book_uuid_pk` = `b1`.`uuid_pk` ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.price * 1.19 = ?');
    expect(mock.mock.calls[4][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');
  });

  test('refreshing already loaded entity', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    new Book2('Bible 1', god);
    new Book2('Bible 2', god);
    new Book2('Bible 3', god);
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const r1 = await orm.em.find(Author2, god, { fields: ['id'], populate: ['books'] });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    // @ts-expect-error
    expect(r1[0].name).toBeUndefined();
    const r2 = await orm.em.find(Author2, god, { refresh: true, populate: ['books'] });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBe(god.name);
    expect(r1[0]).toBe(r2[0]);
  });

  test('batch update with changing OneToOne relation (GH issue #1025)', async () => {
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
    expect(mock.mock.calls[1][0]).toMatch('select `f0`.`id` from `foo_bar2` as `f0` where ((`f0`.`id` = ? and `f0`.`version` = ?) or (`f0`.`id` = ? and `f0`.`version` = ?))');
    expect(mock.mock.calls[2][0]).toMatch('update `foo_bar2` set `foo_bar_id` = case when (`id` = ?) then ? when (`id` = ?) then ? else `foo_bar_id` end, `version` = current_timestamp where `id` in (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('select `f0`.`id`, `f0`.`version` from `foo_bar2` as `f0` where `f0`.`id` in (?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('custom types', async () => {
    await orm.em.insert(FooBar2, { id: 123, name: 'n1', array: [1, 2, 3] });
    await orm.em.insert(FooBar2, { id: 456, name: 'n2', array: [] });

    const bar = FooBar2.create('b1');
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.blob2 = new Uint8Array([1, 2, 3, 4, 5]);
    bar.array = [];
    bar.objectProperty = { foo: 'bar', bar: 3 };
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.blob2).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(b1.blob2).toBeInstanceOf(Uint8Array);
    expect(b1.array).toEqual([]);
    expect(b1.array).toBeInstanceOf(Array);
    expect(b1.objectProperty).toEqual({ foo: 'bar', bar: 3 });
    expect(b1.objectProperty).toBeInstanceOf(Object);
    expect(b1.objectProperty!.bar).toBe(3);

    b1.objectProperty = 'foo';
    b1.array = [1, 2, 3, 4, 5];
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b2.array).toEqual([1, 2, 3, 4, 5]);
    expect(b2.array![2]).toBe(3);
    expect(b2.objectProperty).toBe('foo');

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

  test('exceptions', async () => {
    await orm.em.insert(Author2, { name: 'author', email: 'email' });
    await expect(orm.em.insert(Author2, { name: 'author', email: 'email' })).rejects.toThrow(UniqueConstraintViolationException);
    await expect(orm.em.insert<any>('not_existing', { foo: 'bar' })).rejects.toThrow(TableNotFoundException);
    await expect(orm.em.execute('create table author2 (foo text not null)')).rejects.toThrow(TableExistsException);
    await expect(orm.em.execute('foo bar 123')).rejects.toThrow(SyntaxErrorException);
    await expect(orm.em.execute('select id from author2, foo_bar2')).rejects.toThrow(NonUniqueFieldNameException);
    await expect(orm.em.execute('select uuid from author2')).rejects.toThrow(InvalidFieldNameException);
    // await expect(orm.em.execute('insert into foo_bar2 () values ()')).rejects.toThrow(NotNullConstraintViolationException);
  });

  test('GH 625', async () => {
    const a = new Author2('n', 'e');
    a.termsAccepted = false;
    await orm.em.persistAndFlush(a);
    const res = await orm.em.findOne(Author2, { id: a.id, termsAccepted: true });
    expect(res).toBeNull();
  });

  test('em.execute()', async () => {
    const res1 = await orm.em.execute('insert into author2 (name, email) values (?, ?)', ['name', 'email']);
    expect(res1).toMatchObject({ affectedRows: 1, insertId: 1 });
    const res2 = await orm.em.execute('select 1 as count');
    expect(res2).toMatchObject([{ count: 1 }]);
  });

  test('query comments', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.find(Author2, {}, {
      comments: ['foo'],
      hintComments: 'bar',
      indexHint: 'force index(custom_email_index_name)',
    });
    expect(mock.mock.calls[0][0]).toMatch('/* foo */ select /*+ bar */ `a0`.*, ' +
      '`a1`.`author_id` as `a1__author_id` ' +
      'from `author2` as `a0` force index(custom_email_index_name) ' +
      'left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
  });

  // this should run in ~800ms (when running single test locally)
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

  test('clientUrl with replicas (GH issue #4813)', async () => {
    const config = new Configuration({
      driver: MySqlDriver,
      clientUrl: 'mysql://usr:pswd@128.0.0.1:5433/foo',
      preferReadReplicas: true,
      replicas: [
        { clientUrl: 'mysql://usr2:pswd2@129.0.0.1:5434/bar' },
      ],
      entities: ['src/**/*.entity.ts'],
    }, false);
    const driver = new MySqlDriver(config);
    expect(driver.getConnection('write').getConnectionOptions()).toMatchObject({
      database: 'foo',
      host: '128.0.0.1',
      password: 'pswd',
      port: 5433,
      user: 'usr',
    });
    expect(driver.getConnection('read').getConnectionOptions()).toMatchObject({
      database: 'bar',
      host: '129.0.0.1',
      password: 'pswd2',
      port: 5434,
      user: 'usr2',
    });
  });

});
