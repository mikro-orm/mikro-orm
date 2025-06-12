import { performance } from 'node:perf_hooks';
import { v4 } from 'uuid';
import {
  Collection,
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
  NotNullConstraintViolationException,
  TableExistsException,
  SyntaxErrorException,
  NonUniqueFieldNameException,
  InvalidFieldNameException,
  IsolationLevel,
  raw,
  sql,
} from '@mikro-orm/core';
import { MsSqlDriver, UnicodeString } from '@mikro-orm/mssql';
import { Address2, Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, PublisherType2, Test2 } from './entities-mssql/index.js';
import { initORMMsSql, mockLogger } from './bootstrap.js';

describe('EntityManagerMsSql', () => {

  let orm: MikroORM<MsSqlDriver>;

  beforeAll(async () => orm = await initORMMsSql());
  beforeEach(async () => orm.getSchemaGenerator().clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('isConnected()', async () => {
    await expect(orm.isConnected()).resolves.toBe(true);
    await orm.close(true);
    await expect(orm.isConnected()).resolves.toBe(false);
    await orm.connect();
    await expect(orm.isConnected()).resolves.toBe(true);
  });

  test('should return mssql driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(MsSqlDriver);
    await expect(driver.findOne<Book2>(Book2.name, { double: 123 })).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'author', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name' });
    const uuid1 = v4();
    await expect(driver.nativeInsert(Book2.name, { uuid: uuid1, author: author.insertId, tags: [tag.insertId] })).resolves.not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: {
        count: 1,
      },
      rows: [{
        count: 1,
      }],
    });
    await expect(driver.getConnection().execute('insert into test2 (name) output inserted.id values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: {
        id: 1,
      },
      rows: [{
        id: 1,
      }],
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?; select @@rowcount', ['test 2', 'test'], 'run')).resolves.toMatchObject({
      affectedRows: 1,
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?; select @@rowcount', ['test 2'], 'run')).resolves.toMatchObject({
      affectedRows: 1,
    });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find<BookTag2>(BookTag2.name, { books: { $in: [uuid1] } })).resolves.not.toBeNull();

    const conn = driver.getConnection();
    const tx = await conn.begin();
    await conn.execute('select 1', [], 'all', tx);
    await conn.execute(raw('select 1'), [], 'all', tx);
    await conn.commit(tx);

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

    expect(mock.mock.calls[0][0]).toMatch('insert into [publisher2] ([name], [type], [type2]) output inserted.[id] values (?, ?, ?), (?, ?, ?), (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('insert into [publisher2_tests] ([test2_id], [publisher2_id]) output inserted.[id] values (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)');

    // mssql returns all the ids based on returning clause
    expect(res).toMatchObject({ insertId: 1, affectedRows: 3, row: { id: 1 }, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const res2 = await driver.find(Publisher2.name, {});
    expect(res2).toMatchObject([
      { id: 1, name: 'test 1', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { id: 2, name: 'test 2', type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { id: 3, name: 'test 3', type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = `Invalid object name 'not_existing'.`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(err1);
    const err2 = `Invalid object name 'not_existing'.`;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrow(err2);
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
    const transaction = orm.em.transactional(async em => {
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
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('save transaction [trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into [author2] ([created_at], [updated_at], [name], [email], [terms_accepted]) output inserted.[id], inserted.[age] values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback transaction [trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into [author2] ([created_at], [updated_at], [name], [email], [terms_accepted]) output inserted.[id], inserted.[age] values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
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
    expect(mock.mock.calls[2][0]).toMatch('insert into [author2] ([created_at], [updated_at], [name], [email], [terms_accepted]) output inserted.[id], inserted.[age] values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback');
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.double = 123.45;
    await orm.em.persistAndFlush(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.publisher = wrap(publisher).toReference();
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.publisher = wrap(publisher).toReference();
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.publisher = wrap(publisher).toReference();

    const repo = orm.em.getRepository(Book2);
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
    await expect(authorRepository.findOne({ favouriteBook: bible.uuid })).resolves.not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, { populate: ['author'] });
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }, { populate: ['books', 'favouriteBook'] }))!;
    const authors = await authorRepository.findAll({ populate: ['books', 'favouriteBook'] });
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

    const lastBook = await booksRepository.find({ author: jon.id }, { populate: ['author'], orderBy: { title: QueryOrder.DESC }, limit: 2, offset: 2 });
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

  test('findOne do not support regexps', async () => {
    const author1 = new Author2('Author 1', 'a1@example.com');
    const author2 = new Author2('Author 2', 'a2@example.com');
    const author3 = new Author2('Author 3', 'a3@example.com');
    await orm.em.persistAndFlush([author1, author2, author3]);
    orm.em.clear();

    // easy regexp is transformed to like
    const authors = await orm.em.find(Author2, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
    orm.em.clear();

    // explicit regexp throws
    await expect(orm.em.find(Author2, { email: { $re: 'exa.*le.c.m$' } })).rejects.toThrow('Not supported');
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

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from [author2] as [a0] with (updlock) where [a0].[id] = ?');
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
    expect(mock.mock.calls[1][0]).toMatch('select 1 from [author2] as [a0] with (holdlock) where [a0].[id] = ?');
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

  test('populate ManyToOne relation via init()', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const publisher = new Publisher2('Publisher');
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(publisher).toReference();
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
    const publisher2 = await bible2.publisher!.load();
    expect(wrap(publisher2!, true).__em!.id).toBe(em2.id);
  });

  test('populate OneToOne relation (default case)', async () => {
    const bar = FooBar2.create('你好世界');
    const baz = new FooBaz2('ěščřžýáíéůú');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }, { populate: ['baz'], refresh: true }))!;
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({
      name: '你好世界',
      baz: {
        id: baz.id,
        bar: bar.id,
        name: 'ěščřžýáíéůú',
      },
    });
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
    expect(mock.mock.calls[0][0]).toMatch('select top (?) [f0].* from [foo_baz2] as [f0] where [f0].[id] = ?');
    expect(b0.bar).toBeUndefined();
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id }, { populate: ['bar'] });
    expect(mock.mock.calls[1][0]).toMatch('select top (?) [f0].*, [b1].[id] as [b1__id], [b1].[name] as [b1__name], [b1].[baz_id] as [b1__baz_id], [b1].[foo_bar_id] as [b1__foo_bar_id], [b1].[version] as [b1__version], [b1].[blob] as [b1__blob], [b1].[array] as [b1__array], [b1].[object] as [b1__object], (select 123) as [b1__random] from [foo_baz2] as [f0] left join [foo_bar2] as [b1] on [f0].[id] = [b1].[baz_id] where [f0].[id] = ?');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, { populate: ['bar'] });
    expect(mock.mock.calls[2][0]).toMatch('select top (?) [f0].*, [b1].[id] as [b1__id], [b1].[name] as [b1__name], [b1].[baz_id] as [b1__baz_id], [b1].[foo_bar_id] as [b1__foo_bar_id], [b1].[version] as [b1__version], [b1].[blob] as [b1__blob], [b1].[array] as [b1__array], [b1].[object] as [b1__object], (select 123) as [b1__random] from [foo_baz2] as [f0] left join [foo_bar2] as [b1] on [f0].[id] = [b1].[baz_id] left join [foo_bar2] as [f2] on [f0].[id] = [f2].[baz_id] where [f2].[id] = ?');
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
    expect(typeof b1.uuid).toBe('string');
    expect(typeof wrap(b1).toJSON().uuid).toBe('string');
    expect(typeof wrap(b1).toJSON().test?.book).toBe('string');
    expect(wrap(b1).toJSON()).toMatchObject({ test: { id: test.id, book: test.book.uuid, name: 't' } });
  });

  test('many to many relation (default case)', async () => {
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
    book.tags.remove(t => t.id === tag1.id);
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
  });

  test('bigint support', async () => {
    const t = new BookTag2('test');
    // this affects the following identity inserts, we need to keep some space
    const id = 9223372036854775807n - 100n;
    t.id = id;
    await orm.em.persistAndFlush(t);
    expect(t.id).toBe(id);
    orm.em.clear();

    const t2 = await orm.em.findOneOrFail(BookTag2, t.id);
    expect(t2.id).toBe(id);
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
    const publishers = await repo.findAll({ populate: ['tests'] });
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
    const books = await orm.em.find(Book2, {}, { populate: ['publisher.tests', 'author'], orderBy: { title: QueryOrder.ASC } });
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
    const res = await orm.em.find(Author2, { books: { title: { $in: ['b1', 'b2'] } } }, { populate: ['books.perex'] });
    expect(res).toHaveLength(1);
    expect(res[0].books.length).toBe(3);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select [a0].*, [b1].[uuid_pk] as [b1__uuid_pk], [b1].[created_at] as [b1__created_at], [b1].[isbn] as [b1__isbn], [b1].[title] as [b1__title], [b1].[perex] as [b1__perex], [b1].[price] as [b1__price], ([b1].[price] * 1.19) as [b1__price_taxed], [b1].[float] as [b1__float], [b1].[float36] as [b1__float36], [b1].[double] as [b1__double], [b1].[meta] as [b1__meta], [b1].[author_id] as [b1__author_id], [b1].[publisher_id] as [b1__publisher_id], [f2].[uuid_pk] as [f2__uuid_pk] ' +
      'from [author2] as [a0] ' +
      'left join [book2] as [b1] on [a0].[id] = [b1].[author_id] and [b1].[author_id] is not null ' +
      'left join [book2] as [f2] on [a0].[favourite_book_uuid_pk] = [f2].[uuid_pk] and [f2].[author_id] is not null ' +
      'left join [book2] as [b3] on [a0].[id] = [b3].[author_id] and [b3].[author_id] is not null ' + // explicit join branch for where query (populateWhere: all)
      'where [b3].[title] in (?, ?) ' +
      'order by [b1].[title] asc');
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    // @ts-expect-error non-existing property
    await expect(repo.findAll({ populate: ['tests'] })).rejects.toThrow(`Entity 'Author2' does not have property 'tests'`);
    // @ts-expect-error non-existing property
    await expect(repo.findOne(author.id, { populate: ['tests'] })).rejects.toThrow(`Entity 'Author2' does not have property 'tests'`);
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
    await orm.em.persistAndFlush(author);

    author.name = 'name1';
    await orm.em.persistAndFlush(author);
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
    orm.config.getLogger().setDebugMode(false);
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
    expect(mock.mock.calls[0][0]).toMatch(`insert into [author2] ([name], [email]) output inserted.[id], inserted.[created_at], inserted.[updated_at], inserted.[age], inserted.[terms_accepted] values (N'native name 1', N'native1@email.com'); select @@rowcount;`);
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
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into [author2] ([created_at], [updated_at], [name], [email], [terms_accepted]) output inserted.[id], inserted.[age] values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into [book2] ([uuid_pk], [created_at], [title], [author_id]) values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('update [author2] set [favourite_author_id] = ?, [updated_at] = ? where [id] = ?; select @@rowcount');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(mock.mock.calls[5][0]).toMatch('select top (?) [a0].*, [f1].[uuid_pk] as [f1__uuid_pk] from [author2] as [a0] left join [book2] as [f1] on [a0].[favourite_book_uuid_pk] = [f1].[uuid_pk] and [f1].[author_id] is not null where [a0].[id] = ?');
  });

  test('allow assigning PK to undefined/null', async () => {
    const test = new Test2({ name: 'name' });
    await orm.em.persistAndFlush(test);
    expect(test.id).toBeDefined();
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
    expect(mock.mock.calls[0][0]).toMatch('select [b0].*, ([b0].[price] * 1.19) as [price_taxed] ' +
      'from [book2] as [b0] ' +
      'left join [author2] as [a1] on [b0].[author_id] = [a1].[id] ' +
      'where [b0].[author_id] is not null and [a1].[name] = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, { populate: ['perex'] });
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select [b0].*, ([b0].[price] * 1.19) as [price_taxed] ' +
      'from [book2] as [b0] ' +
      'left join [author2] as [a1] on [b0].[author_id] = [a1].[id] ' +
      'left join [book2] as [b2] on [a1].[favourite_book_uuid_pk] = [b2].[uuid_pk] and [b2].[author_id] is not null ' +
      'left join [author2] as [a3] on [b2].[author_id] = [a3].[id] ' +
      'where [b0].[author_id] is not null and [a3].[name] = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, { populate: ['perex'] });
    expect(res3).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select [b0].*, ([b0].[price] * 1.19) as [price_taxed] ' +
      'from [book2] as [b0] ' +
      'left join [author2] as [a1] on [b0].[author_id] = [a1].[id] ' +
      'where [b0].[author_id] is not null and [a1].[favourite_book_uuid_pk] = ?');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, { populate: ['perex'] });
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select [b0].*, ([b0].[price] * 1.19) as [price_taxed] ' +
      'from [book2] as [b0] ' +
      'left join [author2] as [a1] on [b0].[author_id] = [a1].[id] ' +
      'left join [book2] as [b2] on [a1].[favourite_book_uuid_pk] = [b2].[uuid_pk] and [b2].[author_id] is not null ' +
      'left join [author2] as [a3] on [b2].[author_id] = [a3].[id] ' +
      'where [b0].[author_id] is not null and [a3].[name] = ?');
  });

  test('datetime is stored in correct timezone', async () => {
    const author = new Author2('n', 'e');
    author.createdAt = new Date('2000-01-01T00:00:00');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ created_at: string }[]>(`select convert(varchar,created_at, 127) created_at from author2 where id = ${author.id}`);
    expect(res[0].created_at).toBe('2000-01-01T00:00:00');
    const a = await orm.em.findOneOrFail(Author2, author.id);
    expect(+a.createdAt!).toBe(+author.createdAt);
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

    // without paginate flag it fails to get 5 records
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
    expect(mock.mock.calls[0][0]).toMatch('select [a0].* ' +
      'from [author2] as [a0] ' +
      'left join [book2] as [b1] on [a0].[id] = [b1].[author_id] where [a0].[id] in (select [a0].[id] ' +
      'from (select [a0].[id] ' +
      'from [author2] as [a0] ' +
      'left join [book2] as [b1] on [a0].[id] = [b1].[author_id] ' +
      'where [b1].[title] like ? group by [a0].[id] order by min([a0].[name]) asc, min([b1].[title]' +
      ') asc offset ? rows fetch next ? rows only' +
      ') as [a0]' +
      ') order by [a0].[name] asc, [b1].[title] asc');
  });

  test('custom types', async () => {
    const bar = FooBar2.create('b1');
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.array = [1, 2, 3, 4, 5];
    bar.object = { foo: 'bar', bar: 3 };
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.array).toEqual([1, 2, 3, 4, 5]);
    expect(b1.array![2]).toBe(3);
    expect(b1.array).toBeInstanceOf(Array);
    expect(b1.object).toEqual({ foo: 'bar', bar: 3 });
    expect(b1.object).toBeInstanceOf(Object);
    expect(b1.object!.bar).toBe(3);
    expect(b1.version).toEqual(bar.version);

    b1.object = 'foo';
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar2, bar.id);
    expect(b2.object).toBe('foo');

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

  // this should run in ~300ms (when running single test locally)
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

  // this should run in ~700ms (when running single test locally)
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

    if (took > 400) {
      process.stdout.write(`delete test took ${took}\n`);
    }
  });

  test('UnicodeString', async () => {
    const u = new UnicodeString('你好世界');
    expect(u.toString()).toBe('你好世界');
    expect(u.toJSON()).toBe('你好世界');
    expect(u.valueOf()).toBe('你好世界');
    expect('' + u).toBe('你好世界');
    expect(+u).toBe(NaN);
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
        [raw(a => `${a}.age`)]: { $like: '%2%' },
      },
    }, { populate: ['perex'] });
    expect(books1).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`select [b0].*, ([b0].[price] * 1.19) as [price_taxed] from [book2] as [b0] left join [author2] as [a1] on [b0].[author_id] = [a1].[id] where [b0].[author_id] is not null and upper(title) in ('B1', 'B2') and a1.age like '%2%'`);
    orm.em.clear();

    const books2 = await orm.em.find(Book2, {
      [sql.upper('title')]: raw('upper(?)', ['b2']),
    }, { populate: ['perex'] });
    expect(books2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(`select [b0].*, ([b0].[price] * 1.19) as [price_taxed] from [book2] as [b0] where [b0].[author_id] is not null and upper(title) = upper('b2')`);
  });

});
