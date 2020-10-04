import {
  Collection, EntityManager, EntityMetadata, JavaScriptMetadataProvider, LockMode, MikroORM, QueryOrder, Logger, ValidationError, wrap,
  UniqueConstraintViolationException, TableNotFoundException, NotNullConstraintViolationException, TableExistsException, SyntaxErrorException,
  NonUniqueFieldNameException, InvalidFieldNameException,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

import { initORMSqlite, wipeDatabaseSqlite } from './bootstrap';
const { Author3 } = require('./entities-js/index').Author3;
const { Book3 } = require('./entities-js/index').Book3;
const { BookTag3 } = require('./entities-js/index').BookTag3;
const { Publisher3 } = require('./entities-js/index').Publisher3;
const { Test3 } = require('./entities-js/index').Test3;

describe('EntityManagerSqlite', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => orm = await initORMSqlite());
  beforeEach(async () => wipeDatabaseSqlite(orm.em));

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);

    // as the db lives only in memory, we need to re-create the schema after reconnection
    await orm.getSchemaGenerator().createSchema();
  });

  test('onUpdate should be re-hydrated when loading metadata from cache', async () => {
    const provider = new JavaScriptMetadataProvider(orm.config);
    const cacheAdapter = orm.config.getCacheAdapter();
    const cache = await cacheAdapter.get('Book3.js');
    const meta = {} as EntityMetadata;
    provider.loadFromCache(meta, cache);
    expect(meta.properties.updatedAt.onUpdate).toBeDefined();
    expect(meta.properties.updatedAt.onUpdate!({})).toBeInstanceOf(Date);
  });

  test('should return sqlite driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(SqliteDriver);
    expect(await driver.findOne(Book3.name, { title: '123' })).toBeNull();
    expect(await driver.nativeInsert(Book3.name, { title: '123' })).not.toBeNull();
    expect(await driver.nativeInsert(BookTag3.name, { name: 'tag', books: [1] })).not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('insert into test3 (name) values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
    });
    await expect(driver.getConnection().execute('update test3 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
    });
    await expect(driver.getConnection().execute('delete from test3 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
    });
    expect(await driver.find(BookTag3.name, { books: [1] })).not.toBeNull();

    // multi inserts
    const res = await driver.nativeInsertMany(Publisher3.name, [
      { name: 'test 1', type: 'GLOBAL' },
      { name: 'test 2', type: 'LOCAL' },
      { name: 'test 3', type: 'GLOBAL' },
    ]);

    // sqlite returns the last inserted id
    expect(res).toMatchObject({ insertId: 3, affectedRows: 0, row: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const res2 = await driver.find(Publisher3.name, {});
    expect(res2).toEqual([
      { id: 1, name: 'test 1', type: 'GLOBAL' },
      { id: 2, name: 'test 2', type: 'LOCAL' },
      { id: 3, name: 'test 3', type: 'GLOBAL' },
    ]);

    // multi inserts with no values
    await driver.nativeInsertMany(Test3.name, [{}, {}]);
    const res3 = await driver.find(Test3.name, {});
    expect(res3).toEqual([
      { id: 2, name: null, version: 1 },
      { id: 3, name: null, version: 1 },
    ]);

    const now = new Date();
    expect(driver.getPlatform().processDateProperty(now)).toBe(+now);
    expect(driver.getPlatform().processDateProperty(1)).toBe(1);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = "insert into `not_existing` (`foo`) values ('bar') - SQLITE_ERROR: no such table: not_existing";
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = 'delete from `not_existing` - SQLITE_ERROR: no such table: not_existing';
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository<any>(Author3);
    const author = new Author3('name', 'email');
    await repo.persistAndFlush(author);
    const a = await repo.findOne(author);
    const authors = await repo.find({ id: author });
    expect(a).toBe(author);
    expect(authors[0]).toBe(author);
  });

  test('transactions', async () => {
    const god1 = new Author3('God1', 'hello@heaven1.god');

    try {
      await orm.em.transactional(async em => {
        await em.persistAndFlush(god1);
        throw new Error(); // rollback the transaction
      });
    } catch { }

    const res1 = await orm.em.findOne(Author3, { name: 'God1' });
    expect(res1).toBeNull();

    const ret = await orm.em.transactional(async em => {
      const god2 = new Author3('God2', 'hello@heaven2.god');
      await em.persist(god2);
      return true;
    });

    const res2 = await orm.em.findOne(Author3, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god3 = new Author3('God4', 'hello@heaven4.god');
        await em.persist(god3);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res3 = await orm.em.findOne(Author3, { name: 'God4' });
      expect(res3).toBeNull();
    }
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const god1 = new Author3('God1', 'hello1@heaven.god');

      try {
        await em.transactional(async em2 => {
          await em2.persistAndFlush(god1);
          throw new Error(); // rollback the transaction
        });
      } catch { }

      const res1 = await em.findOne(Author3, { name: 'God1' });
      expect(res1).toBeNull();

      await em.transactional(async em2 => {
        const god2 = new Author3('God2', 'hello2@heaven.god');
        await em2.persistAndFlush(god2);
      });

      const res2 = await em.findOne(Author3, { name: 'God2' });
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
          await em2.persistAndFlush(new Author3('God', 'hello@heaven.god'));
          throw new Error(); // rollback the transaction
        });
      } catch { }

      await em.persistAndFlush(new Author3('God Persisted!', 'hello-persisted@heaven.god'));
    });

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author3` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author3` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author3, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible).flush();

    const author = new Author3('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    author.favouriteBook = bible;

    const publisher = new Publisher3('7K publisher', 'global');

    const book1 = new Book3('My Life on The Wall, part 1', author);
    book1.publisher = publisher;
    const book2 = new Book3('My Life on The Wall, part 2', author);
    book2.publisher = publisher;
    const book3 = new Book3('My Life on The Wall, part 3', author);
    book3.publisher = publisher;

    const repo = orm.em.getRepository(Book3);
    repo.persist(book1);
    repo.persist(book2);
    repo.persist(book3);
    await repo.flush();
    orm.em.clear();

    const publisher7k = (await orm.em.getRepository<any>(Publisher3).findOne({ name: '7K publisher' }))!;
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(false);
    orm.em.clear();

    const authorRepository = orm.em.getRepository<any>(Author3);
    const booksRepository = orm.em.getRepository<any>(Book3);
    const books = await booksRepository.findAll(['author']);
    expect(books[0].author.isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible.id })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, ['author']);
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }, ['books', 'favouriteBook']))!;
    const authors = await authorRepository.findAll(['books', 'favouriteBook']);
    expect(await authorRepository.findOne({ email: 'not existing' })).toBeNull();

    // count test
    const count = await authorRepository.count();
    expect(count).toBe(authors.length);

    // identity map test
    authors.shift(); // shift the god away, as that entity is detached from IM
    expect(jon).toBe(authors[0]);
    expect(jon).toBe(await authorRepository.findOne(jon.id));

    // serialization test
    const o = jon.toJSON();
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
    expect(jon.toJSON()).toEqual(o);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('number');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);

        expect(book.author).toBeInstanceOf(Author3);
        expect(book.author.isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Publisher3);
        expect(book.publisher.isInitialized()).toBe(false);
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
    expect(lastBook[0].author).toBeInstanceOf(Author3);
    expect(lastBook[0].author.isInitialized()).toBe(true);
    await orm.em.getRepository(Book3).remove(lastBook[0]).flush();
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible).flush();
    orm.em.clear();

    const ref = orm.em.getReference<any>(Author3, god.id);
    expect(ref.isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author3, god.id);
    expect(ref).toBe(newGod);
    expect(ref.isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    const author1 = new Author3('Author 1', 'a1@example.com');
    const author2 = new Author3('Author 2', 'a2@example.com');
    const author3 = new Author3('Author 3', 'a3@example.com');
    await orm.em.persist([author1, author2, author3]).flush();
    orm.em.clear();

    const authors = await orm.em.find<any>(Author3, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
    expect(authors[0].createdAt).toBeInstanceOf(Date);
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates]', async () => {
    const test = new Test3();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persistAndFlush(test);
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testStandardFailureThrowsException]', async () => {
    const test = new Test3();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    expect(typeof test.version).toBe('number');
    expect(test.version).toBe(1);
    orm.em.clear();

    const test2 = await orm.em.findOne<any>(Test3, test.id);
    await orm.em.nativeUpdate(Test3, { id: test.id }, { name: 'Changed!' }); // simulate concurrent update
    test2!.name = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe(`The optimistic lock on entity Test3 failed`);
      expect((e as ValidationError).getEntity()).toBe(test2);
    }
  });

  test('findOne supports optimistic locking', async () => {
    const test = new Test3();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test3, test.id);
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test3();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const proxy = orm.em.getReference<any>(Test3, test.id);
    await orm.em.lock(proxy, LockMode.OPTIMISTIC, 1);
    expect(proxy.isInitialized()).toBe(true);
  });

  test('findOne supports optimistic locking [testOptimisticTimestampLockFailureThrowsException]', async () => {
    const tag = new BookTag3('Testing');
    expect(tag.version).toBeUndefined();
    await orm.em.persistAndFlush(tag);
    expect(tag.version).toBeInstanceOf(Date);
    orm.em.clear();

    const tag2 = (await orm.em.findOne<any>(BookTag3, tag.id))!;
    expect(tag2.version).toBeInstanceOf(Date);

    try {
      // Try to lock the record with an older timestamp and it should throw an exception
      const expectedVersionExpired = new Date(+tag2.version - 3600);
      await orm.em.lock(tag2, LockMode.OPTIMISTIC, expectedVersionExpired);
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect((e as ValidationError).getEntity()).toBe(tag2);
    }
  });

  test('findOne supports optimistic locking [unversioned entity]', async () => {
    const author = new Author3('name', 'email');
    await orm.em.persistAndFlush(author);
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrowError('Cannot obtain optimistic lock on unversioned entity Author3');
  });

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = new Test3();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [version mismatch]', async () => {
    const test = new Test3();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrowError('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test3();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrowError('Entity Test3 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = Test3.create('Lock test');
    await orm.em.persistAndFlush(test);
    await expect(orm.em.findOne(Test3, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.findOne(Test3, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrowError('An open transaction is required for this operation');
  });

  test('findOne does not support pessimistic locking [pessimistic write]', async () => {
    const author = new Author3('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author3` as `e0` where `e0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne does not support pessimistic locking [pessimistic read]', async () => {
    const author = new Author3('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author3` as `e0` where `e0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('stable results of serialization', async () => {
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    const bible2 = new Book3('Bible pt. 2', god);
    const bible3 = new Book3('Bible pt. 3', new Author3('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]).flush();
    orm.em.clear();

    const newGod = (await orm.em.findOne<any>(Author3, god.id))!;
    const books = await orm.em.find<any>(Book3, {});
    await newGod.init(false);

    for (const book of books) {
      expect(book.toJSON()).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = new Publisher3('Publisher3');
    await orm.em.persist(pub).flush();
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    bible.publisher = pub;
    const bible2 = new Book3('Bible pt. 2', god);
    bible2.publisher = pub;
    const bible3 = new Book3('Bible pt. 3', new Author3('Lol', 'lol@lol.lol'));
    bible3.publisher = pub;
    await orm.em.persist([bible, bible2, bible3]).flush();
    orm.em.clear();

    const newGod = orm.em.getReference<any>(Author3, god.id);
    const publisher = (await orm.em.findOne(Publisher3, pub.id, ['books']))!;
    await newGod.init();

    const json = publisher.toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: any) => b.id === book.id)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository<any>(Author3);
    const jon = new Author3('Jon Snow', 'snow@wall.st');
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
    const authorRepository = orm.em.getRepository(Author3);
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible).flush();

    let jon = new Author3('Jon Snow', 'snow@wall.st');
    jon.born = new Date('1990-03-23');
    jon.favouriteBook = bible;
    await orm.em.persist(jon).flush();
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.favouriteBook).toBeInstanceOf(Book3);
    expect(jon.favouriteBook.isInitialized()).toBe(false);

    await jon.favouriteBook.init();
    expect(jon.favouriteBook).toBeInstanceOf(Book3);
    expect(jon.favouriteBook.isInitialized()).toBe(true);
    expect(jon.favouriteBook.title).toBe('Bible');
  });

  test('many to many relation', async () => {
    const author = new Author3('Jon Snow', 'snow@wall.st');
    const book1 = new Book3('My Life on The Wall, part 1', author);
    const book2 = new Book3('My Life on The Wall, part 2', author);
    const book3 = new Book3('My Life on The Wall, part 3', author);
    const tag1 = new BookTag3('silly');
    const tag2 = new BookTag3('funny');
    const tag3 = new BookTag3('sick');
    const tag4 = new BookTag3('strange');
    const tag5 = new BookTag3('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    await orm.em.persist(book1);
    await orm.em.persist(book2);
    await orm.em.persist(book3).flush();

    expect(tag1.id).toBeDefined();
    expect(tag2.id).toBeDefined();
    expect(tag3.id).toBeDefined();
    expect(tag4.id).toBeDefined();
    expect(tag5.id).toBeDefined();

    // test inverse side
    const tagRepository = orm.em.getRepository<typeof BookTag3>(BookTag3);
    let tags = await tagRepository.findAll();
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag3);
    expect(tags[0].name).toBe('silly');
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.length).toBe(2);

    orm.em.clear();
    tags = await orm.em.find(BookTag3, {});
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection<Book3> of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection<Book3> of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection<Book3> of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection<Book3> of entity BookTag3\[\d+] not initialized/);

    // test M:N lazy load
    orm.em.clear();
    tags = await tagRepository.findAll();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0]).toBeInstanceOf(Book3);
    expect(tags[0].books.getItems()[0].id).toBeDefined();
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);
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
    let book = (await orm.em.findOne<any>(Book3, { tags: tag1.id }))!;
    expect(book.tags.isInitialized()).toBe(false);
    await book.tags.init();
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag3);
    expect(book.tags.getItems()[0].id).toBeDefined();
    expect(book.tags.getItems()[0].isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tagRepository.getReference(tag1.id));
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book3, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book3, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(2);

    // contains
    expect(book.tags.contains(tagRepository.getReference(tag1.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag2.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag3.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag4.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag5.id))).toBe(false);

    // removeAll
    book.tags.removeAll();
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book3, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(0);
  });

  test('populating many to many relation', async () => {
    const p1 = new Publisher3('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Publisher3('bar');
    p2.tests.add(new Test3(), new Test3());
    await orm.em.persist([p1, p2]).flush();
    const repo = orm.em.getRepository<any>(Publisher3);

    orm.em.clear();
    const publishers = await repo.findAll(['tests']);
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0]).toBeInstanceOf(Publisher3);
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized()).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);
  });

  test('populating many to many relation on inverse side', async () => {
    const author = new Author3('Jon Snow', 'snow@wall.st');
    const book1 = new Book3('My Life on The Wall, part 1', author);
    const book2 = new Book3('My Life on The Wall, part 2', author);
    const book3 = new Book3('My Life on The Wall, part 3', author);
    const tag1 = new BookTag3('silly');
    const tag2 = new BookTag3('funny');
    const tag3 = new BookTag3('sick');
    const tag4 = new BookTag3('strange');
    const tag5 = new BookTag3('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]).flush();
    const repo = orm.em.getRepository<any>(BookTag3);

    orm.em.clear();
    const tags = await repo.findAll(['books']);
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag3);
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);
  });

  test('hooks', async () => {
    Author3.beforeDestroyCalled = 0;
    Author3.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author3);
    const author = new Author3('Jon Snow', 'snow@wall.st');
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

    expect(Author3.beforeDestroyCalled).toBe(0);
    expect(Author3.afterDestroyCalled).toBe(0);
    await repo.remove(author).flush();
    expect(Author3.beforeDestroyCalled).toBe(1);
    expect(Author3.afterDestroyCalled).toBe(1);

    const author2 = new Author3('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author2);
    await repo.remove(author2).flush();
    expect(Author3.beforeDestroyCalled).toBe(2);
    expect(Author3.afterDestroyCalled).toBe(2);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author3);
    const author = new Author3('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author);
    orm.em.clear();

    await expect(repo.findAll(['tests'])).rejects.toThrowError(`Entity 'Author3' does not have property 'tests'`);
    await expect(repo.findOne(author.id, ['tests'])).rejects.toThrowError(`Entity 'Author3' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository<any>(Publisher3);
    const publisher = new Publisher3();
    const t1 = Test3.create('t1');
    const t2 = Test3.create('t2');
    const t3 = Test3.create('t3');
    await orm.em.persist([t1, t2, t3]).flush();
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
    const repo = orm.em.getRepository<any>(Author3);
    const author = new Author3('name', 'email');
    await expect(author.createdAt).toBeDefined();
    await expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    await expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);
    await repo.persistAndFlush(author);

    author.name = 'name1';
    await new Promise(resolve => setTimeout(resolve, 10));
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
    const res1 = await orm.em.nativeInsert(Author3, { name: 'native name 1', email: 'native1@email.com' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author3, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author3, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.nativeInsert(Author3, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2', email: 'native2@email.com' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author3, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);
  });

  test('EM supports smart search conditions', async () => {
    const author = new Author3('name', 'email');
    const b1 = new Book3('b1', author);
    const b2 = new Book3('b2', author);
    const b3 = new Book3('b3', author);
    await orm.em.persist([b1, b2, b3]).flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne<any>(Author3, { 'id:ne': 10 }))!;
    expect(a1).not.toBeNull();
    expect(a1.id).toBe(author.id);
    const a2 = (await orm.em.findOne<any>(Author3, { 'id>=': 1 }))!;
    expect(a2).not.toBeNull();
    expect(a2.id).toBe(author.id);
    const a3 = (await orm.em.findOne<any>(Author3, { 'id:nin': [2, 3, 4] }))!;
    expect(a3).not.toBeNull();
    expect(a3.id).toBe(author.id);
    const a4 = (await orm.em.findOne<any>(Author3, { 'id:in': [] }))!;
    expect(a4).toBeNull();
    const a5 = (await orm.em.findOne<any>(Author3, { 'id:nin': [] }))!;
    expect(a5).not.toBeNull();
    expect(a5.id).toBe(author.id);
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author3('n', 'e');
    author.createdAt = new Date('2000-01-01T00:00:00Z');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ created_at: number }[]>(`select created_at as created_at from author3 where id = ${author.id}`);
    expect(res[0].created_at).toBe(+author.createdAt);
    const a = await orm.em.findOneOrFail<any>(Author3, author.id);
    expect(+a.createdAt!).toBe(+author.createdAt);
    const a1 = await orm.em.findOneOrFail<any>(Author3, { createdAt: { $eq: a.createdAt } });
    expect(+a1.createdAt!).toBe(+author.createdAt);
    expect(orm.em.merge(a1)).toBe(a1);
  });

  test('exceptions', async () => {
    const driver = orm.em.getDriver();
    await driver.nativeInsert(Author3.name, { name: 'author', email: 'email' });
    await expect(driver.nativeInsert(Author3.name, { name: 'author', email: 'email' })).rejects.toThrow(UniqueConstraintViolationException);
    await expect(driver.nativeInsert(Author3.name, {})).rejects.toThrow(NotNullConstraintViolationException);
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(TableNotFoundException);
    await expect(driver.execute('create table author3 (foo text not null)')).rejects.toThrow(TableExistsException);
    await expect(driver.execute('foo bar 123')).rejects.toThrow(SyntaxErrorException);
    await expect(driver.execute('select id from author3, book_tag3')).rejects.toThrow(NonUniqueFieldNameException);
    await expect(driver.execute('select uuid from author3')).rejects.toThrow(InvalidFieldNameException);
  });

  afterAll(async () => {
    await orm.close(true);
  });

});
