import { v4 } from 'uuid';
import {
  Collection, Configuration, EntityManager, LockMode, MikroORM, QueryFlag, QueryOrder, Reference, Logger, ValidationError, ChangeSetType, wrap, expr,
  UniqueConstraintViolationException, TableNotFoundException, NotNullConstraintViolationException, TableExistsException, SyntaxErrorException,
  NonUniqueFieldNameException, InvalidFieldNameException, EventSubscriber, ChangeSet, AnyEntity, FlushEventArgs, LoadStrategy,
} from '@mikro-orm/core';
import { PostgreSqlDriver, PostgreSqlConnection } from '@mikro-orm/postgresql';
import { Address2, Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, PublisherType2, Test2, Label2 } from './entities-sql';
import { initORMPostgreSql, wipeDatabasePostgreSql } from './bootstrap';
import { performance } from 'perf_hooks';

describe('EntityManagerPostgre', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  async function createBooksWithTags() {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const publisher = new Publisher2();
    book1.publisher = wrap(publisher).toReference();
    book2.publisher = wrap(publisher).toReference();
    book3.publisher = wrap(publisher).toReference();
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush(author);
    orm.em.clear();
  }

  beforeAll(async () => orm = await initORMPostgreSql());
  beforeEach(async () => wipeDatabasePostgreSql(orm.em));

  test('isConnected()', async () => {
    await expect(orm.isConnected()).resolves.toBe(true);
    await orm.close(true);
    await expect(orm.isConnected()).resolves.toBe(false);
    await orm.connect();
    await expect(orm.isConnected()).resolves.toBe(true);
  });

  test('getConnectionOptions()', async () => {
    const config = new Configuration({
      type: 'postgresql',
      clientUrl: 'postgre://root@127.0.0.1:1234/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
      logger: jest.fn(),
      forceUtcTimezone: true,
    } as any, false);
    const driver = new PostgreSqlDriver(config);
    expect(driver.getConnection().getConnectionOptions()).toEqual({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      port: 1234,
      user: 'user',
    });
  });

  test('raw query with array param', async () => {
    const q1 = await orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [[1, 2, 3], 3]);
    expect(q1).toBe('select * from author2 where id in (1, 2, 3) limit 3');
    const q2 = await orm.em.getPlatform().formatQuery(`select * from author2 where id in (?) limit ?`, [['1', '2', '3'], 3]);
    expect(q2).toBe(`select * from author2 where id in ('1', '2', '3') limit 3`);
  });

  test('should return postgre driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(PostgreSqlDriver);
    await expect(driver.findOne(Book2.name, { double: 123 })).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name' });
    await expect(driver.nativeInsert(Book2.name, { uuid: v4(), author: author.insertId, tags: [tag.insertId] })).resolves.not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: { count: 1 },
      rows: [{ count: 1 }],
    });
    await expect(driver.getConnection().execute('insert into test2 (name) values (?) returning id', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
      row: { id: 1 },
      rows: [{ id: 1 }],
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      row: undefined,
      rows: [],
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      row: undefined,
      rows: [],
    });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find(BookTag2.name, { books: { $in: ['1'] } })).resolves.not.toBeNull();
    expect(driver.getPlatform().formatQuery('CREATE USER ?? WITH PASSWORD ?', ['foo', 'bar'])).toBe(`CREATE USER "foo" WITH PASSWORD 'bar'`);
    expect(driver.getPlatform().formatQuery('select \\?, ?, ?', ['foo', 'bar'])).toBe(`select ?, 'foo', 'bar'`);

    // multi inserts
    await driver.nativeInsert(Test2.name, { id: 1, name: 't1' });
    await driver.nativeInsert(Test2.name, { id: 2, name: 't2' });
    await driver.nativeInsert(Test2.name, { id: 3, name: 't3' });
    await driver.nativeInsert(Test2.name, { id: 4, name: 't4' });
    await driver.nativeInsert(Test2.name, { id: 5, name: 't5' });

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const res = await driver.nativeInsertMany(Publisher2.name, [
      { name: 'test 1', tests: [1, 3, 4], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { name: 'test 2', tests: [4, 2], type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { name: 'test 3', tests: [1, 5, 2], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);

    expect(mock.mock.calls[0][0]).toMatch('insert into "publisher2" ("name", "type", "type2") values ($1, $2, $3), ($4, $5, $6), ($7, $8, $9) returning "id"');
    expect(mock.mock.calls[1][0]).toMatch('insert into "publisher2_tests" ("publisher2_id", "test2_id") values ($1, $2), ($3, $4), ($5, $6)');
    expect(mock.mock.calls[2][0]).toMatch('insert into "publisher2_tests" ("publisher2_id", "test2_id") values ($1, $2), ($3, $4)');
    expect(mock.mock.calls[3][0]).toMatch('insert into "publisher2_tests" ("publisher2_id", "test2_id") values ($1, $2), ($3, $4), ($5, $6)');

    // postgres returns all the ids based on returning clause
    expect(res).toMatchObject({ insertId: 1, affectedRows: 3, row: { id: 1 }, rows: [ { id: 1 }, { id: 2 }, { id: 3 } ] });
    const res2 = await driver.find(Publisher2.name, {});
    expect(res2).toMatchObject([
      { id: 1, name: 'test 1', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { id: 2, name: 'test 2', type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { id: 3, name: 'test 3', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = `insert into "not_existing" ("foo") values ('bar') - relation "not_existing" does not exist`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = `delete from "not_existing" - relation "not_existing" does not exist`;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('connection returns correct URL', async () => {
    const conn1 = new PostgreSqlConnection(new Configuration({
      type: 'postgresql',
      clientUrl: 'postgre://example.host.com',
      port: 1234,
      user: 'usr',
      password: 'pw',
    } as any, false));
    await expect(conn1.getClientUrl()).toBe('postgre://usr:*****@example.host.com:1234');
    const conn2 = new PostgreSqlConnection(new Configuration({ type: 'postgresql', port: 5433 } as any, false));
    await expect(conn2.getClientUrl()).toBe('postgresql://postgres@127.0.0.1:5433');
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
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

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
    expect(mock.mock.calls[2][0]).toMatch('insert into "author2" ("created_at", "email", "name", "terms_accepted", "updated_at") values ($1, $2, $3, $4, $5) returning "id"');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into "author2" ("created_at", "email", "name", "terms_accepted", "updated_at") values ($1, $2, $3, $4, $5) returning "id"');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.double = 123.45;
    await orm.em.persistAndFlush(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.publisher = wrap(publisher).toReference();
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.publisher = wrap(publisher).toReference();
    const book3 = new Book2('My Life on The Wall, part 3', author);
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
    await expect(authorRepository.findOne({ favouriteBook: bible.uuid })).resolves.not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, ['author']);
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }, ['books', 'favouriteBook']))!;
    const authors = await authorRepository.findAll(['books', 'favouriteBook']);
    await expect(authorRepository.findOne({ email: 'not existing' })).resolves.toBeNull();

    // count test
    const count = await authorRepository.count();
    expect(count).toBe(authors.length);

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
    await orm.em.getRepository(Book2).remove(lastBook[0]).flush();
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
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrowError('Cannot obtain optimistic lock on unversioned entity Author2');
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
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrowError('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
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

  test('findOne supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "e0" where "e0"."id" = $1 for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "e0" where "e0"."id" = $1 for share');
    expect(mock.mock.calls[2][0]).toMatch('commit');
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

  test('populate ManyToOne relation via init()', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const publisher = new Publisher2('Publisher');
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(publisher).toReference();
    await orm.em.persistAndFlush(bible);

    let jon = new Author2('Jon Snow', 'snow@wall.st');
    jon.born = new Date('1990-03-23');
    jon.favouriteBook = bible;
    await orm.em.persistAndFlush(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.born).toEqual(new Date('1990-03-23'));
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(false);

    await wrap(jon.favouriteBook).init();
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(true);
    expect(jon.favouriteBook!.title).toBe('Bible');

    const em2 = orm.em.fork();
    const bible2 = await em2.findOneOrFail(Book2, { uuid: bible.uuid });
    expect(wrap(bible2, true).__em!.id).toBe(em2.id);
    expect(wrap(bible2.publisher, true).__em!.id).toBe(em2.id);
    const publisher2 = await bible2.publisher!.load();
    expect(wrap(publisher2, true).__em!.id).toBe(em2.id);
  });

  test('populating a relation does save its original entity data (GH issue 864)', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const b = await orm.em.findOneOrFail(Book2, bible.uuid, ['author']);
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

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(0);
  });

  test('populate OneToOne relation on inverse side', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    // autoJoinOneToOneOwner: false
    const b0 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id });
    expect(mock.mock.calls[0][0]).toMatch('select "e0".* from "foo_baz2" as "e0" where "e0"."id" = $1 limit $2');
    expect(b0.bar).toBeUndefined();
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id }, ['bar']);
    expect(mock.mock.calls[1][0]).toMatch('select "e0".*, "e1"."id" as "bar_id" from "foo_baz2" as "e0" left join "foo_bar2" as "e1" on "e0"."id" = "e1"."baz_id" where "e0"."id" = $1 limit $2');
    expect(mock.mock.calls[2][0]).toMatch('select "e0".*, (select 123) as "random" from "foo_bar2" as "e0" where "e0"."baz_id" in ($1) order by "e0"."baz_id" asc');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, ['bar']);
    expect(mock.mock.calls[3][0]).toMatch('select "e0".*, "e1"."id" as "bar_id" from "foo_baz2" as "e0" left join "foo_bar2" as "e1" on "e0"."id" = "e1"."baz_id" where "e1"."id" = $1 limit $2');
    expect(mock.mock.calls[4][0]).toMatch('select "e0".*, (select 123) as "random" from "foo_bar2" as "e0" where "e0"."baz_id" in ($1) order by "e0"."baz_id" asc');
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

    const b1 = (await orm.em.findOne(Book2, { test: test.id }, ['test.config']))!;
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

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "foo_bar2" set "foo_bar_id" = $1, "version" = current_timestamp(0) where "id" = $2 and "version" = $3');
    expect(mock.mock.calls[2][0]).toMatch('select "e0"."id", "e0"."version" from "foo_bar2" as "e0" where "e0"."id" in ($1)');
    expect(mock.mock.calls[3][0]).toMatch('update "foo_bar2" set "foo_bar_id" = $1, "version" = current_timestamp(0) where "id" = $2 and "version" = $3');
    expect(mock.mock.calls[4][0]).toMatch('select "e0"."id", "e0"."version" from "foo_bar2" as "e0" where "e0"."id" in ($1)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
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

    await orm.em.persist(book1);
    await orm.em.persist(book2);
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
    book.tags.remove(orm.em.getReference(BookTag2, tag1.id)); // we need to get reference as tag1 is detached from current EM
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
    expect(book.tags.contains(tagRepository.getReference(tag1.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag2.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag3.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag4.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag5.id))).toBe(false);

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
    await createBooksWithTags();
    const repo = orm.em.getRepository(BookTag2);
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
    expect(books[0].publisher!.isInitialized()).toBe(true);
    expect(books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher!.unwrap().tests[1].name).toBe('t12');
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

  test('populate queries respect the root condition (query condition propagation)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    const res = await orm.em.find(Author2, { books: { title: { $in: ['b1', 'b2'] } } }, ['books.perex']);
    expect(res).toHaveLength(1);
    expect(res[0].books.length).toBe(2);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".* from "author2" as "e0" left join "book2" as "e1" on "e0"."id" = "e1"."author_id" where "e1"."title" in ($1, $2)');
    expect(mock.mock.calls[1][0]).toMatch('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where "e0"."author_id" is not null and "e0"."author_id" in ($1) and "e0"."title" in ($2, $3) order by "e0"."title" asc');
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

    const author = orm.em.getReference(Author2, res4);
    const b = orm.em.create(Book2, { uuid: v4(), author, title: 'native name 2' }); // do not provide createdAt, default value from DB will be used
    await orm.em.persistAndFlush(b);
    expect(b.createdAt).toBeDefined();
    expect(b.createdAt).toBeInstanceOf(Date);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query', 'query-params']);
    Object.assign(orm.config, { logger });
    await orm.em.nativeInsert(Author2, { name: 'native name 1', email: 'native1@email.com' });
    expect(mock.mock.calls[0][0]).toMatch('insert into "author2" ("email", "name") values (\'native1@email.com\', \'native name 1\') returning "id", "created_at", "updated_at"');
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
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

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
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "email", "name", "terms_accepted", "updated_at") values ($1, $2, $3, $4, $5)');
    expect(mock.mock.calls[2][0]).toMatch('insert into "book2" ("uuid_pk", "created_at", "title", "author_id") values ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12)');
    expect(mock.mock.calls[3][0]).toMatch('update "author2" set "favourite_author_id" = $1, "updated_at" = $2 where "id" = $3');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch('select "e0".* from "author2" as "e0" where "e0"."id" = $1');
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
  });

  test('allow assigning PK to undefined/null', async () => {
    const test = new Test2({ name: 'name' });
    await orm.em.persistAndFlush(test);
    expect(test.id).toBeDefined();
  });

  test('find with custom function', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query', 'query-params']);
    Object.assign(orm.config, { logger });

    const books1 = await orm.em.find(Book2, {
      [expr('upper(title)')]: ['B1', 'B2'],
    }, { populate: ['perex'] });
    expect(books1).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where upper(title) in ('B1', 'B2') and "e0"."author_id" is not null`);
    orm.em.clear();

    const books2 = await orm.em.find(Book2, {
      [expr('upper(title)')]: orm.em.getKnex().raw('upper(?)', ['b2']),
    }, { populate: ['perex'] });
    expect(books2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where upper(title) = upper('b2') and "e0"."author_id" is not null`);
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
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, ['perex']);
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeUndefined();
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".*, "e0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "e0" ' +
      'left join "author2" as "e1" on "e0"."author_id" = "e1"."id" ' +
      'where "e0"."author_id" is not null and "e1"."name" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, ['perex']);
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".*, "e0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "e0" ' +
      'left join "author2" as "e1" on "e0"."author_id" = "e1"."id" ' +
      'left join "book2" as "e2" on "e1"."favourite_book_uuid_pk" = "e2"."uuid_pk" ' +
      'left join "author2" as "e3" on "e2"."author_id" = "e3"."id" ' +
      'where "e0"."author_id" is not null and "e3"."name" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, ['perex']);
    expect(res3).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".*, "e0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "e0" ' +
      'left join "author2" as "e1" on "e0"."author_id" = "e1"."id" ' +
      'where "e0"."author_id" is not null and "e1"."favourite_book_uuid_pk" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, ['perex']);
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".*, "e0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "e0" ' +
      'left join "author2" as "e1" on "e0"."author_id" = "e1"."id" ' +
      'left join "book2" as "e2" on "e1"."favourite_book_uuid_pk" = "e2"."uuid_pk" ' +
      'left join "author2" as "e3" on "e2"."author_id" = "e3"."id" ' +
      'where "e0"."author_id" is not null and "e3"."name" = $1');
  });

  test('result caching (find)', async () => {
    await createBooksWithTags();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 50, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 50, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res2.map(e => wrap(e).toObject()));
    orm.em.clear();

    const res3 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 50, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res3.map(e => wrap(e).toObject()));
    orm.em.clear();

    await new Promise(r => setTimeout(r, 100)); // wait for cache to expire
    const res4 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 50, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res4.map(e => wrap(e).toObject()));
  });

  test('result caching (findOne)', async () => {
    await createBooksWithTags();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const res1 = await orm.em.findOneOrFail(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags'], cache: ['abc', 50], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.findOneOrFail(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags'], cache: ['abc', 50], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res2).toObject());
    orm.em.clear();

    const res3 = await orm.em.findOneOrFail(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags'], cache: ['abc', 50], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res3).toObject());
    orm.em.clear();

    await new Promise(r => setTimeout(r, 100)); // wait for cache to expire
    const res4 = await orm.em.findOneOrFail(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags'], cache: ['abc', 50], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res4).toObject());
  });

  test('result caching (count)', async () => {
    await createBooksWithTags();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const res1 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res2);
    orm.em.clear();

    const res3 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res3);
    orm.em.clear();

    await new Promise(r => setTimeout(r, 100)); // wait for cache to expire
    const res4 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1).toEqual(res4);
  });

  test('result caching (query builder)', async () => {
    await createBooksWithTags();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const res1 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(50).getResultList();
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    const res2 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(50).getResultList();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res2);
    orm.em.clear();

    const res3 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(50).getResultList();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res3);
    orm.em.clear();

    await new Promise(r => setTimeout(r, 100)); // wait for cache to expire
    const res4 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache().getResultList();
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1).toEqual(res4);
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author2('n', 'e');
    author.createdAt = new Date('2000-01-01T00:00:00Z');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ created_at: string }[]>(`select to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.US') as created_at from author2 where id = ${author.id}`);
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

    const a1 = await orm.em.findOneOrFail(Author2, author.id, ['address']);
    expect(a1.address!.value).toBe('v1');
    expect(a1.address!.author).toBe(a1);

    a1.address!.value = 'v2';
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author.id, ['address']);
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

  test('pagination', async () => {
    for (let i = 1; i <= 10; i++) {
      const num = `${i}`.padStart(2, '0');
      const god = new Author2(`God ${num}`, `hello${num}@heaven.god`);
      new Book2(`Bible ${num}.1`, god);
      new Book2(`Bible ${num}.2`, god);
      new Book2(`Bible ${num}.3`, god);
      orm.em.persist(god);
    }

    await orm.em.flush();
    orm.em.clear();

    // without paginate flag it fails to get 5 records
    const res1 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
    });

    expect(res1).toHaveLength(2);
    expect(res1.map(a => a.name)).toEqual(['God 02', 'God 03']);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    // with paginate flag (and a bit of dark sql magic) we get what we want
    const res2 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
      flags: [QueryFlag.PAGINATE],
    });

    expect(res2).toHaveLength(5);
    expect(res2.map(a => a.name)).toEqual(['God 04', 'God 05', 'God 06', 'God 07', 'God 08']);
    expect(mock.mock.calls[0][0]).toMatch('select "e0".* ' +
      'from "author2" as "e0" ' +
      'left join "book2" as "e1" on "e0"."id" = "e1"."author_id" where "e0"."id" in (select "e0"."id" ' +
      'from (select "e0"."id" ' +
      'from (select "e0"."id" ' +
      'from "author2" as "e0" ' +
      'left join "book2" as "e1" on "e0"."id" = "e1"."author_id" ' +
      'where "e1"."title" like $1 order by "e0"."name" asc, "e1"."title" asc' +
      ') as "e0" group by "e0"."id" limit $2 offset $3' +
      ') as "e0"' +
      ') order by "e0"."name" asc, "e1"."title" asc');
  });

  test('custom types', async () => {
    await orm.em.nativeInsert(FooBar2, { id: 123, name: 'n1', array: [1, 2, 3] });
    await orm.em.nativeInsert(FooBar2, { id: 456, name: 'n2', array: [] });

    const bar = FooBar2.create('b1 "b" \'1\'');
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.array = [];
    bar.object = { foo: `bar 'lol' baz "foo"`, bar: 3 };
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.array).toEqual([]);
    expect(b1.array).toBeInstanceOf(Array);
    expect(b1.object).toEqual({ foo: `bar 'lol' baz "foo"`, bar: 3 });
    expect(b1.object).toBeInstanceOf(Object);
    expect(b1.object!.bar).toBe(3);

    b1.object = 'foo';
    b1.array = [1, 2, 3, 4, 5];
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b2.object).toBe('foo');
    expect(b2.array).toEqual([1, 2, 3, 4, 5]);
    expect(b2.array![2]).toBe(3);

    b2.object = [1, 2, '3'];
    await orm.em.flush();
    orm.em.clear();

    const b3 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b3.object[0]).toBe(1);
    expect(b3.object[1]).toBe(2);
    expect(b3.object[2]).toBe('3');

    b3.object = 123;
    await orm.em.flush();
    orm.em.clear();

    const b4 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b4.object).toBe(123);
  });

  test('using $contains', async () => {
    const a = new Author2('n', 'e');
    a.identities = ['1', '2', '3'];
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    await expect(orm.em.findOneOrFail(Author2, { identities: { $contains: ['2'] } })).resolves.toBeTruthy();
    await expect(orm.em.findOneOrFail(Author2, { identities: { $contains: ['4'] } })).rejects.toThrowError();
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
    const res = await repo.find([1, 2, 3]);
    expect(res.map(a => a.id)).toEqual([1, 2, 3]);
  });

  test('exceptions', async () => {
    const driver = orm.em.getDriver();
    await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
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
    const res = await orm.em.getKnex().raw('select ? as count', [1]);
    expect(res.rows[0].count).toBe('1');
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
    a.born = new Date();
    const b = new Book2('1stB', a);

    await em.persistAndFlush(b);
    em.clear();

    // Comment this out and the test will pass
    await em.findOneOrFail(Book2, { title: '1stB' }, ['author']);

    const newA = new Author2('2ndA', 'e2');
    a.born = new Date();
    const newB = new Book2('2ndB', newA);
    newB.author = newA;
    await em.persistAndFlush(newB);

    expect(Subscriber.log).toHaveLength(2);
    const updates = Subscriber.log.reduce((x, y) => x.concat(y), []).filter(c => c.type === ChangeSetType.UPDATE);
    expect(updates).toHaveLength(0);
  });

  // this should run in ~600ms (when running single test locally)
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

  afterAll(async () => orm.close(true));

});
