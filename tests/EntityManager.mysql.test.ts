import { v4 } from 'uuid';
import chalk from 'chalk';

import { Collection, Configuration, EntityManager, LockMode, MikroORM, QueryOrder, Reference, Utils, wrap } from '../lib';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, Test2 } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { Logger, ValidationError } from '../lib/utils';
import { MySqlConnection } from '../lib/connections/MySqlConnection';

describe('EntityManagerMySql', () => {

  jest.setTimeout(10e3);
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql());
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
  });

  test('getConnectionOptions()', async () => {
    const config = new Configuration({
      clientUrl: 'mysql://root@127.0.0.1:3308/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      logger: jest.fn(),
      forceUtcTimezone: true,
    } as any, false);
    const driver = new MySqlDriver(config);
    expect(driver.getConnection().getConnectionOptions()).toEqual({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      port: 3308,
      user: 'user',
      timezone: 'Z',
      supportBigNumbers: true,
    });
  });

  test('should return mysql driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(MySqlDriver);
    await expect(driver.findOne(Book2.name, { title: 'bar' })).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name'});
    expect((await driver.nativeInsert(Book2.name, { uuid: v4(), author: author.insertId, tags: [tag.insertId] })).insertId).not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('insert into test2 (name) values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
    });
    expect(driver.getPlatform().usesImplicitTransactions()).toBe(true);
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find(BookTag2.name, { books: { $in: [1] } })).resolves.not.toBeNull();
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = `insert into \`not_existing\` (\`foo\`) values ('bar') - Table 'mikro_orm_test.not_existing' doesn't exist`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = `delete from \`not_existing\` - Table 'mikro_orm_test.not_existing' doesn't exist`;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('connection returns correct URL', async () => {
    const conn1 = new MySqlConnection(new Configuration({
      clientUrl: 'mysql://example.host.com',
      port: 1234,
      user: 'usr',
      password: 'pw',
    } as any, false));
    await expect(conn1.getClientUrl()).toBe('mysql://usr:*****@example.host.com:1234');
    const conn2 = new MySqlConnection(new Configuration({ type: 'mysql', port: 3307 } as any, false));
    await expect(conn2.getClientUrl()).toBe('mysql://root@127.0.0.1:3307');
  });

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    author.termsAccepted = true;
    author.favouriteAuthor = author;
    await repo.persistAndFlush(author);
    const a = await repo.findOne(author);

    const authors = await repo.find({ favouriteAuthor: author });
    expect(a).toBe(author);
    expect(authors[0]).toBe(author);
    expect(await repo.findOne({ termsAccepted: false })).toBeNull();
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
      tags: ['1', '2', '3'],
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
    expect(book.tags[0].id).toBe('1'); // bigint as string
    expect(book.tags[1].id).toBe('2');
    expect(book.tags[2].id).toBe('3');
    expect(repo.getReference(book.uuid)).toBe(book);
  });

  test('should work with boolean values', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    await repo.persistAndFlush(author);
    expect(author.termsAccepted).toBe(false);
    author.termsAccepted = true;
    await repo.persistAndFlush(author);
    expect(author.termsAccepted).toBe(true);
    orm.em.clear();

    const a1 = await repo.findOne({ termsAccepted: false });
    expect(a1).toBeNull();
    const a2 = (await repo.findOne({ termsAccepted: true }))!;
    expect(a2).not.toBeNull();
    a2.termsAccepted = false;
    await repo.persistAndFlush(a2);
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
    const a = await repo.findOne(bar.id, ['baz']);
    expect(wrap(a!.baz).isInitialized()).toBe(true);
    expect(wrap(a!.baz!.bar).isInitialized()).toBe(true);
  });

  test('inverse side of 1:1 is ignored in change set', async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz 1');
    await orm.em.persistAndFlush(bar);

    bar.baz = new FooBaz2('fz 2');
    await orm.em.flush();
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
      await em.persist(god2);
      return true;
    });

    const res2 = await orm.em.findOne(Author2, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god3 = new Author2('God4', 'hello@heaven4.god');
        await em.persist(god3);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res3 = await orm.em.findOne(Author2, { name: 'God4' });
      expect(res3).toBeNull();
    }
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
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

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
    expect(mock.mock.calls[2][0]).toMatch('insert into `author2` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author2` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
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
    author.born = new Date('1990-03-23');
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

    const repo = orm.em.getRepository(Book2);
    repo.persist(book1);
    repo.persist(book2);
    repo.persist(book3);
    await repo.flush();
    orm.em.clear();

    const publisher7k = (await orm.em.getRepository(Publisher2).findOne({ name: '7K publisher' }))!;
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(false);
    orm.em.clear();

    const authorRepository = orm.em.getRepository(Author2);
    const booksRepository = orm.em.getRepository(Book2);
    const books = await booksRepository.findAll(['author']);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible.uuid })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, ['author']);
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }))!;
    await orm.em.populate(jon, ['books', 'favouriteBook']);
    const authors = await authorRepository.findAll();
    await orm.em.populate(authors, ['books', 'favouriteBook']);
    expect(await authorRepository.findOne({ email: 'not existing' })).toBeNull();
    await expect(orm.em.populate([], ['books', 'favouriteBook'])).resolves.toEqual([]);

    // count test
    const count = await authorRepository.count();
    expect(count).toBe(authors.length);
    const count2 = await orm.em.count(Author2);
    expect(count2).toBe(authors.length);

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
        expect(wrap(book.publisher).isInitialized()).toBe(false);
      }
    }

    const booksByTitleAsc = await booksRepository.find({ author: jon.id }, [], { title: QueryOrder.ASC });
    expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
    expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

    const booksByTitleDesc = await booksRepository.find({ author: jon.id }, [], { title: QueryOrder.DESC });
    expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
    expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

    const twoBooks = await booksRepository.find({ author: jon.id }, [], { title: QueryOrder.DESC }, 2);
    expect(twoBooks.length).toBe(2);
    expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
    expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

    const lastBook = await booksRepository.find({ author: jon.id }, ['author'], { title: QueryOrder.DESC }, 2, 2);
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author2);
    expect(wrap(lastBook[0].author).isInitialized()).toBe(true);
    await orm.em.getRepository(Book2).remove(lastBook[0].uuid);
  });

  test('json properties', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    god.identities = ['fb-123', 'pw-231', 'tw-321'];
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'god like', items: 3 };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const g = (await orm.em.findOne(Author2, god.id, ['books']))!;
    expect(Array.isArray(g.identities)).toBe(true);
    expect(g.identities).toEqual(['fb-123', 'pw-231', 'tw-321']);
    expect(typeof g.books[0].meta).toBe('object');
    expect(g.books[0].meta).toEqual({ category: 'god like', items: 3 });
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

    const authors2 = await orm.em.find(Author2, { email: { $re: 'exa.*le\.c.m$' } });
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
    } catch (e) {
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
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrowError('Cannot obtain optimistic lock on unversioned entity Author2');
    await expect(orm.em.findOne(Author2, author.id, { lockMode: LockMode.OPTIMISTIC })).rejects.toThrowError('Cannot obtain optimistic lock on unversioned entity Author2');
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
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrowError('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('lock supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrowError('Entity Test2 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = Test2.create('Lock test');
    await orm.em.persistAndFlush(test);
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrowError('An open transaction is required for this operation');
  });

  test('lock supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `e0` where `e0`.`id` = ? for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('lock supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `e0` where `e0`.`id` = ? lock in share mode');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('custom query expressions via query builder', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'foo', items: 1 };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const qb1 = orm.em.createQueryBuilder(Book2);
    const res1 = await qb1.select('*').where({ 'JSON_CONTAINS(`e0`.`meta`, ?)': [{ foo: 'bar' }, false] }).execute('get');
    expect(res1.createdAt).toBeDefined();
    expect(res1.created_at).not.toBeDefined();
    expect(res1.meta).toEqual({ category: 'foo', items: 1 });

    const qb2 = orm.em.createQueryBuilder(Book2);
    const res2 = await qb2.select('*').where({ 'JSON_CONTAINS(meta, ?)': [{ category: 'foo' }, true] }).execute('get', false);
    expect(res2.createdAt).not.toBeDefined();
    expect(res2.created_at).toBeDefined();
    expect(res2.meta).toEqual({ category: 'foo', items: 1 });

    const res3 = (await orm.em.findOne(Book2, { 'JSON_CONTAINS(meta, ?)': [{ items: 1 }, true] } as any))!;
    expect(res3).toBeInstanceOf(Book2);
    expect(res3.createdAt).toBeDefined();
    expect(res3.meta).toEqual({ category: 'foo', items: 1 });
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
    expect(wrap(res1).isInitialized()).toBe(true);
    const qb2 = orm.em.createQueryBuilder(Book2);
    const res2 = await qb2.select('*').where({ title: 'not exists' }).getSingleResult();
    expect(res2).toBeNull();
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
    await wrap(newGod).init(false);

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
    const publisher = (await orm.em.findOne(Publisher2, pub.id, ['books']))!;
    await wrap(newGod).init();

    const json = wrap(publisher).toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: Book2) => b.uuid === book.uuid)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    await authorRepository.persistAndFlush(jon);

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
    jon.born = new Date();
    jon.favouriteBook = bible;
    await orm.em.persistAndFlush(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(false);

    await wrap(jon.favouriteBook).init();
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(true);
    expect(jon.favouriteBook!.title).toBe('Bible');
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }, ['baz']))!;
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({ baz: wrap(baz).toJSON() });
  });

  test('populate OneToOne relation on inverse side', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    const b0 = (await orm.em.findOne(FooBaz2, { id: baz.id }))!;
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ? limit ?');
    expect(b0.bar).toBeDefined();
    expect(b0.bar).toBeInstanceOf(FooBar2);
    expect(wrap(b0.bar).isInitialized()).toBe(false);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBaz2, { id: baz.id }, ['bar']))!;
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ? limit ?');
    expect(mock.mock.calls[2][0]).toMatch('select `e0`.* from `foo_bar2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: wrap(bar).toJSON() });
    orm.em.clear();

    const b2 = (await orm.em.findOne(FooBaz2, { bar: bar.id }, ['bar']))!;
    expect(mock.mock.calls[3][0]).toMatch('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ? limit ?');
    expect(mock.mock.calls[4][0]).toMatch('select `e0`.* from `foo_bar2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
    expect(b2.bar).toBeInstanceOf(FooBar2);
    expect(b2.bar!.id).toBe(bar.id);
    expect(wrap(b2).toJSON()).toMatchObject({ bar: wrap(bar).toJSON() });
  });

  test('populate OneToOne relation with uuid PK', async () => {
    const author = new Author2('name', 'email');
    const book = new Book2('b1', author);
    const test = Test2.create('t');
    test.book = book;
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const b1 = (await orm.em.findOne(Book2, { test: test.id }, ['test']))!;
    expect(b1.uuid).not.toBeNull();
    expect(wrap(b1).toJSON()).toMatchObject({ test: wrap(test).toJSON() });
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

    author.books.add(b1, b2, b3, b4, b5);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a1 = await orm.em.find(Author2, author, ['books'], { books: { title: QueryOrder.DESC } });
    expect(a1[0].books.getItems().map(b => b.title)).toEqual(['b5', 'b4', 'b3', 'b2', 'b1']);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author, ['books'], { books: { title: QueryOrder.DESC } });
    expect(a2.books.getItems().map(b => b.title)).toEqual(['b5', 'b4', 'b3', 'b2', 'b1']);
    orm.em.clear();

    const a3 = await orm.em.findOneOrFail(Author2, { books: { tags: { name: { $in: ['silly', 'strange'] } } } }, ['books.tags'], { books: { tags: { name: QueryOrder.DESC }, title: QueryOrder.ASC } });
    expect(a3.books.getItems().map(b => b.title)).toEqual(['b4', 'b1', 'b2']); // first strange tag (desc), then silly by name (asc)
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

    expect(typeof tag1.id).toBe('string');
    expect(typeof tag2.id).toBe('string');
    expect(typeof tag3.id).toBe('string');
    expect(typeof tag4.id).toBe('string');
    expect(typeof tag5.id).toBe('string');

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
    expect(() => tags[0].books.getItems()).toThrowError(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.add(book1)).toThrowError(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection<Book2> of entity BookTag2\[\d+] not initialized/);

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
    tags = await tagRepository.findAll(['books']);
    expect(tags[1].books.isInitialized()).toBe(true);
    expect(tags[0].id).toBe(old.id);
    expect(tags[0]).toBe(old);
    expect(tags[0].books).toBe(old.books);

    // test M:N lazy load
    orm.em.clear();
    let book = (await orm.em.findOne(Book2, book1.uuid))!;
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
    book.tags.remove(tag1);
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, ['tags']))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    book.tags.add(new BookTag2('fresh'));
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, ['tags']))!;
    expect(book.tags.count()).toBe(3);

    // contains
    expect(book.tags.contains(tag1)).toBe(true);
    expect(book.tags.contains(tag2)).toBe(false);
    expect(book.tags.contains(tag3)).toBe(true);
    expect(book.tags.contains(tag4)).toBe(false);
    expect(book.tags.contains(tag5)).toBe(false);

    // removeAll
    book.tags.removeAll();
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, ['tags']))!;
    expect(book.tags.count()).toBe(0);
  });

  test('bigint support', async () => {
    const t = new BookTag2('test');
    t.id = '9223372036854775807';
    await orm.em.persistAndFlush(t);
    expect(t.id).toBe('9223372036854775807');
    orm.em.clear();

    const t2 = await orm.em.findOneOrFail(BookTag2, t.id);
    expect(t2.id).toBe('9223372036854775807');
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

    let tag = await orm.em.findOneOrFail(BookTag2, tag1.id, ['books']);
    const err = 'You cannot modify inverse side of M:N collection BookTag2.books when the owning side is not initialized. Consider working with the owning side instead (Book2.tags).';
    expect(() => tag.books.add(orm.em.getReference(Book2, book4.uuid))).toThrowError(err);
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, ['books']);
    book4 = await orm.em.findOneOrFail(Book2, book4.uuid, ['tags']);
    tag.books.add(book4);
    tag.books.add(new Book2('ttt', new Author2('aaa', 'bbb')));
    await orm.em.flush();
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag2, tag1.id, ['books']);
    expect(tag.books.count()).toBe(4);
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
    const publishers = await repo.findAll(['tests']);
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0]).toBeInstanceOf(Publisher2);
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized()).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);
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
    const tags = await repo.findAll(['books']);
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
    book1.publisher = wrap(new Publisher2('B1 publisher')).toReference();
    book1.publisher.unwrap().tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = wrap(new Publisher2('B2 publisher')).toReference();
    book2.publisher.unwrap().tests.add(Test2.create('t21'), Test2.create('t22'));
    book3.createdAt = new Date(Date.now() + 3);
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
    const tags = await repo.findAll(['books.publisher.tests', 'books.author']);
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
    expect(wrap(tags[0].books[0].publisher).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags[0].books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(tags[0].books[0].publisher!.unwrap().tests[1].name).toBe('t12');

    orm.em.clear();
    const books = await orm.em.find(Book2, {}, ['publisher.tests', 'author'], { title: QueryOrder.ASC });
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book2);
    expect(wrap(books[0]).isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author2);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Reference);
    expect(books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(books[0].publisher).isInitialized()).toBe(true);
    expect(books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher!.unwrap().tests[1].name).toBe('t12');
  });

  test('hooks', async () => {
    Author2.beforeDestroyCalled = 0;
    Author2.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Jon Snow', 'snow@wall.st');
    expect(author.id).toBeUndefined();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();

    await repo.persistAndFlush(author);
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await repo.persistAndFlush(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author2.beforeDestroyCalled).toBe(0);
    expect(Author2.afterDestroyCalled).toBe(0);
    await repo.removeAndFlush(author);
    expect(Author2.beforeDestroyCalled).toBe(1);
    expect(Author2.afterDestroyCalled).toBe(1);

    const author2 = new Author2('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author2);
    await repo.removeAndFlush(author2);
    expect(Author2.beforeDestroyCalled).toBe(2);
    expect(Author2.afterDestroyCalled).toBe(2);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author);
    orm.em.clear();

    await expect(repo.findAll(['tests'])).rejects.toThrowError(`Entity 'Author2' does not have property 'tests'`);
    await expect(repo.findOne(author.id, ['tests'])).rejects.toThrowError(`Entity 'Author2' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository(Publisher2);
    const publisher = new Publisher2();
    const t1 = Test2.create('t1');
    const t2 = Test2.create('t2');
    const t3 = Test2.create('t3');
    await orm.em.persistAndFlush([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await repo.persistAndFlush(publisher);
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id, ['tests']))!;
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);
  });

  test('collection allows custom where and orderBy', async () => {
    const book = new Book2('My Life on The Wall, part 1', new Author2('name', 'email'));
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book.tags.add(tag1, tag2, tag3, tag4, tag5);
    await orm.em.persistAndFlush(book);

    orm.em.clear();
    const ent1 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent1.tags.init();
    expect(ent1.tags.getItems().map(t => t.name)).toEqual([tag1.name, tag2.name, tag3.name, tag4.name, tag5.name]);

    orm.em.clear();
    const ent2 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent2.tags.init([], {}, { name: QueryOrder.DESC });
    expect(ent2.tags.getItems().map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name, tag2.name]);

    orm.em.clear();
    const ent3 = await orm.em.findOneOrFail(Book2, book.uuid);
    await ent3.tags.init({ where: { name: { $ne: 'funny' } }, orderBy: { name: QueryOrder.DESC } });
    expect(ent3.tags.getItems().map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name]);
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

    const books = await orm.em.find(Book2, { tags: { name: { $ne: 'funny' } } }, ['tags'], { title: QueryOrder.DESC, tags: { name: QueryOrder.ASC } });
    await expect(books.length).toBe(3);
    await expect(books[0].title).toBe('My Life on The Wall, part 3');
    await expect(books[0].tags.getItems().map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    await expect(books[1].title).toBe('My Life on The Wall, part 2');
    await expect(books[1].tags.getItems().map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    await expect(books[2].title).toBe('My Life on The Wall, part 1');
    await expect(books[2].tags.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);
  });

  test('many to many with composite pk', async () => {
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
    book1.tagsUnordered.add(tag1, tag3, tag6, tag7);
    book2.tagsUnordered.add(tag1, tag2, tag5, tag6);
    book3.tagsUnordered.add(tag2, tag4, tag5, tag7);
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    orm.em.clear();
    const books = await orm.em.find(Book2, { tagsUnordered: { name: { $ne: 'funny' } } }, ['tagsUnordered'], { title: QueryOrder.DESC });
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e3`.`id` as `test_id` from `book2` as `e0` ' +
      'left join `book_to_tag_unordered` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'left join `test2` as `e3` on `e0`.`uuid_pk` = `e3`.`book_uuid_pk` ' +
      'where `e1`.`name` != ? ' +
      'order by `e0`.`title` desc');
    await expect(books.length).toBe(3);
    await expect(books[0].title).toBe('My Life on The Wall, part 3');
    await expect(books[0].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sexy', 'strange']);
    await expect(books[1].title).toBe('My Life on The Wall, part 2');
    await expect(books[1].tagsUnordered.getItems().map(t => t.name)).toEqual(['sexy', 'silly', 'zupa']);
    await expect(books[2].title).toBe('My Life on The Wall, part 1');
    await expect(books[2].tagsUnordered.getItems().map(t => t.name)).toEqual(['awkward', 'sick', 'silly', 'zupa']);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const tags = await orm.em.find(BookTag2, { booksUnordered: { title: { $ne: 'My Life on The Wall, part 3' } } }, ['booksUnordered'], { name: QueryOrder.ASC });
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id`, `e2`.`id` as `test_id` from `book2` as `e0` ' +
      'left join `book_to_tag_unordered` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
      'where `e0`.`title` != ? and `e1`.`book_tag2_id` in (?, ?, ?, ?, ?, ?)');
    await expect(tags.length).toBe(6);
    await expect(tags.map(tag => tag.name)).toEqual(['awkward', 'funny', 'sexy', 'sick', 'silly', 'zupa']);
    await expect(tags.map(tag => tag.booksUnordered.count())).toEqual([1, 1, 1, 1, 2, 2]);
  });

  test('self referencing M:N (unidirectional)', async () => {
    const a1 = new Author2('A1', 'a1@wall.st');
    const a2 = new Author2('A2', 'a2@wall.st');
    const a3 = new Author2('A3', 'a3@wall.st');
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.friends.add(a1, a2, a3, author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = await orm.em.findOneOrFail(Author2, author.id, ['friends'], { friends: { name: QueryOrder.ASC } });
    expect(jon.friends.isInitialized(true)).toBe(true);
    expect(jon.friends.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);

    const jon2 = await orm.em.findOneOrFail(Author2, { friends: a2.id }, ['friends'], { friends: { name: QueryOrder.ASC } });
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

    const jon = await orm.em.findOneOrFail(Author2, author.id, ['following'], { following: { name: QueryOrder.ASC } });
    expect(jon.following.isInitialized(true)).toBe(true);
    expect(jon.following.getIdentifiers()).toEqual([a1.id, a2.id, a3.id, author.id]);
    orm.em.clear();

    const jon2 = await orm.em.findOneOrFail(Author2, { following: a2.id }, ['following'], { following: { name: QueryOrder.ASC } });
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

    const jon = await orm.em.findOneOrFail(Author2, author.id, ['followers'], { followers: { name: QueryOrder.ASC } });
    expect(jon.followers.isInitialized(true)).toBe(true);
    expect(jon.followers.getIdentifiers()).toEqual([a1.id, a3.id, author.id]);

    const jon2 = await orm.em.findOneOrFail(Author2, { followers: a1.id }, ['followers'], { followers: { name: QueryOrder.ASC } });
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
    await repo.persistAndFlush(author);

    author.name = 'name1';
    await repo.persistAndFlush(author);
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
    orm.config.getLogger().setDebugMode(false);
    const res1 = await orm.em.nativeInsert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author2, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author2, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.nativeInsert(Author2, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2', email: 'native2@email.com' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author2, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);

    const res6 = await orm.em.nativeUpdate<Author2>('author2', { name: 'new native name' }, { name: 'native name 3' });
    expect(res6).toBe(1);

    const res7 = await orm.em.nativeDelete<Author2>('author2', res4);
    expect(res7).toBe(1);

    await expect(orm.em.aggregate(Author2, [])).rejects.toThrowError('Aggregations are not supported by MySqlDriver driver');
  });

  test('Utils.prepareEntity changes entity to number id', async () => {
    const author1 = new Author2('Name 1', 'e-mail1');
    const book = new Book2('test', author1);
    const author2 = new Author2('Name 2', 'e-mail2');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persistAndFlush([author1, author2, book]);
    const diff = Utils.diffEntities(author1, author2, orm.getMetadata(), orm.em.getDriver().getPlatform());
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book.uuid });
    expect(typeof diff.favouriteBook).toBe('string');
    expect(diff.favouriteBook).toBe(book.uuid);
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
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

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
    expect(mock.mock.calls.length).toBe(8);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `author2` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book2` (`author_id`, `created_at`, `title`, `uuid_pk`) values (?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('insert into `book2` (`author_id`, `created_at`, `title`, `uuid_pk`) values (?, ?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('insert into `book2` (`author_id`, `created_at`, `title`, `uuid_pk`) values (?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('update `author2` set `favourite_author_id` = ?, `updated_at` = ? where `id` = ?');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    expect(mock.mock.calls[7][0]).toMatch('select `e0`.* from `author2` as `e0` where `e0`.`id` = ?');
  });

  test('self referencing 1:1 (1 step)', async () => {
    const bar = FooBar2.create('bar');
    bar.fooBar = bar;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }))!;
    expect(b1).toBe(b1.fooBar);
    expect(b1.id).not.toBeNull();
    expect(wrap(b1).toJSON()).toMatchObject({ fooBar: b1.id });
  });

  test('persisting entities in parallel inside forked EM with copied IM', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author); // we need to flush here so the entity gets inside IM

    // fork EM without clearing the IM (once for each process), so author entity will be there
    await Promise.all([
      orm.em.fork(false).persistAndFlush(new Book2('b1', author)),
      orm.em.fork(false).persistAndFlush(new Book2('b2', author)),
      orm.em.fork(false).persistAndFlush(new Book2('b3', author)),
    ]);

    orm.em.clear();
    const a1 = (await orm.em.findOne(Author2, author.id, { populate: ['books'] }))!;
    expect(a1.books.count()).toBe(3);
  });

  test('EM supports smart search conditions', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { 'id:ne': 10 } as any))!;
    expect(a1).not.toBeNull();
    expect(a1.id).toBe(author.id);
    const a2 = (await orm.em.findOne(Author2, { 'id>=': 1 } as any))!;
    expect(a2).not.toBeNull();
    expect(a2.id).toBe(author.id);
    const a3 = (await orm.em.findOne(Author2, { 'id:nin': [2, 3, 4] } as any))!;
    expect(a3).not.toBeNull();
    expect(a3.id).toBe(author.id);
    const a4 = (await orm.em.findOne(Author2, { 'id:in': [] } as any))!;
    expect(a4).toBeNull();
    const a5 = (await orm.em.findOne(Author2, { 'id:nin': [] } as any))!;
    expect(a5).not.toBeNull();
    expect(a5.id).toBe(author.id);
    const a6 = (await orm.em.findOne(Author2, { $and: [{ 'id:nin': [] }, { email: 'email' }] } as any))!;
    expect(a6).not.toBeNull();
    expect(a6.id).toBe(author.id);
  });

  test('lookup by array', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    await expect(orm.em.count(Book2, [book1.uuid, book2.uuid, book3.uuid])).resolves.toBe(3);
    // this test was causing TS recursion errors without the type argument
    // see https://github.com/mikro-orm/mikro-orm/issues/124 and https://github.com/mikro-orm/mikro-orm/issues/208
    await expect(orm.em.count<Book2>(Book2, [book1, book2, book3])).resolves.toBe(3);
    await expect(orm.em.count<any>(Book2, [book1, book2, book3])).resolves.toBe(3);
    const a = await orm.em.find<any>(Book2, [book1, book2, book3]) as Book2[];
    await expect(orm.em.getRepository(Book2).count([book1, book2, book3])).resolves.toBe(3);
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

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } });
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeInstanceOf(Test2);
    expect(wrap(res1[0].test).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e2`.`id` as `test_id` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` ' + // auto-joined 1:1 to get test id as book is inverse side
      'where `e1`.`name` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } });
    expect(res2).toHaveLength(3);
    expect(res2[0].test).toBeInstanceOf(Test2);
    expect(wrap(res2[0].test).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e4`.`id` as `test_id` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
      'left join `author2` as `e3` on `e2`.`author_id` = `e3`.`id` ' +
      'left join `test2` as `e4` on `e0`.`uuid_pk` = `e4`.`book_uuid_pk` ' +
      'where `e3`.`name` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } });
    expect(res3).toHaveLength(3);
    expect(res3[0].test).toBeInstanceOf(Test2);
    expect(wrap(res3[0].test).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e2`.`id` as `test_id` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
      'where `e1`.`favourite_book_uuid_pk` = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } });
    expect(res4).toHaveLength(3);
    expect(res4[0].test).toBeInstanceOf(Test2);
    expect(wrap(res4[0].test).isInitialized()).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e4`.`id` as `test_id` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
      'left join `author2` as `e3` on `e2`.`author_id` = `e3`.`id` ' +
      'left join `test2` as `e4` on `e0`.`uuid_pk` = `e4`.`book_uuid_pk` ' +
      'where `e3`.`name` = ?');
  });

  test('partial selects', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author2, author, { fields: ['name'] }))!;
    expect(a.name).toBe('Jon Snow');
    expect(a.email).toBeUndefined();
    expect(a.born).toBeUndefined();
  });

  test('allow undefined value in nullable properties', async () => {
    let god = new Author2('God', 'hello@heaven.god');
    god.age = 21;
    god.born = new Date('0001-01-01');
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

    const [authors1, count1] = await orm.em.findAndCount(Author2, {}, { limit: 10, offset: 10 });
    expect(authors1).toHaveLength(10);
    expect(count1).toBe(30);
    expect(authors1[0]).toBeInstanceOf(Author2);
    expect(authors1[0].name).toBe('God 11');
    expect(authors1[9].name).toBe('God 20');
    orm.em.clear();

    const [authors2, count2] = await orm.em.findAndCount(Author2, {}, { limit: 10, offset: 25, fields: ['name'] });
    expect(authors2).toHaveLength(5);
    expect(authors2[0].email).toBeUndefined();
    expect(count2).toBe(30);
    expect(authors2[0].name).toBe('God 26');
    expect(authors2[4].name).toBe('God 30');
  });

  test('query highlighting', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });
    orm.em.config.set('highlight', true);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');

    if (chalk.level > 0) {
      expect(mock.mock.calls[1][0]).toMatch('[37m[1minsert[22m[39m [37m[1minto[22m[39m [33m`author2`[39m ([33m`created_at`[39m, [33m`email`[39m, [33m`name`[39m, [33m`terms_accepted`[39m, [33m`updated_at`[39m) [37m[1mvalues[22m[39m (?, ?, ?, ?, ?)');
    }

    expect(mock.mock.calls[2][0]).toMatch('commit');
    orm.em.config.set('highlight', false);
  });

  test('read replicas', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    let author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    author.books.add(new Book2('B', author));
    await orm.em.persistAndFlush(author);
    expect(mock.mock.calls[0][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[1][0]).toMatch(/insert into `author2`.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[2][0]).toMatch(/insert into `book2`.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[3][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

    orm.em.clear();
    author = (await orm.em.findOne(Author2, author))!;
    await orm.em.findOne(Author2, author, { refresh: true });
    await orm.em.findOne(Author2, author, { refresh: true });
    expect(mock.mock.calls[4][0]).toMatch(/select `e0`.* from `author2` as `e0` where `e0`.`id` = \? limit \?.*via read connection 'read-\d'/);
    expect(mock.mock.calls[5][0]).toMatch(/select `e0`.* from `author2` as `e0` where `e0`.`id` = \? limit \?.*via read connection 'read-\d'/);
    expect(mock.mock.calls[6][0]).toMatch(/select `e0`.* from `author2` as `e0` where `e0`.`id` = \? limit \?.*via read connection 'read-\d'/);

    author.name = 'Jon Blow';
    await orm.em.flush();
    expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[8][0]).toMatch(/update `author2` set `name` = \?, `updated_at` = \? where `id` = \?.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[9][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

    const qb = orm.em.createQueryBuilder(Author2, 'a', 'write');
    await qb.select('*').where({ name: /.*Blow/ }).execute();
    expect(mock.mock.calls[10][0]).toMatch(/select `a`.* from `author2` as `a` where `a`.`name` like \?.*via write connection '127\.0\.0\.1'/);

    await orm.em.transactional(async em => {
      const book = await em.findOne(Book2, { title: 'B' });
      author.name = 'Jon Flow';
      author.favouriteBook = book!;
      await em.flush();
    });

    expect(mock.mock.calls[11][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[12][0]).toMatch(/select `e0`.*, `e1`\.`id` as `test_id` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e0`.`title` = \?.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[13][0]).toMatch(/update `author2` set `name` = \?, `favourite_book_uuid_pk` = \?, `updated_at` = \? where `id` = \?.*via write connection '127\.0\.0\.1'/);
    expect(mock.mock.calls[14][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author2('n', 'e');
    author.born = new Date('2000-01-01T00:00:00Z');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ born: string }[]>(`select date_format(born, '%Y-%m-%d %T.%f') as born from author2 where id = ${author.id}`);
    expect(res[0].born).toBe('2000-01-01 00:00:00.000000');
    const a = await orm.em.findOneOrFail(Author2, author.id);
    expect(+a.born!).toBe(+author.born);
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

  test('find with different schema', async () => {
    const author = new Author2('n', 'e');
    const book1 = new Book2('b1', author);
    book1.publisher = wrap(new Publisher2('p')).toReference();
    const book2 = new Book2('b2', author);
    await orm.em.persistAndFlush([book1, book2]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    const res1 = await orm.em.find(Book2, { publisher: { $ne: null } }, { schema: 'mikro_orm_test_schema_2' });
    const res2 = await orm.em.find(Book2, { publisher: { $ne: null } });
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e1`.`id` as `test_id` from `mikro_orm_test_schema_2`.`book2` as `e0` left join `mikro_orm_test_schema_2`.`test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e0`.`publisher_id` is not null');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.*, `e1`.`id` as `test_id` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e0`.`publisher_id` is not null');
    expect(res1.length).toBe(0);
    expect(res2.length).toBe(1);
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

    // fails with 2 b/c the post is in the collection twice
    expect(author2.books.length).toEqual(2);
  });

  afterAll(async () => orm.close(true));

});
