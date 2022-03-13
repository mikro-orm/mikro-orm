import type { EntityName } from '@mikro-orm/core';
import { ArrayCollection, Collection, EntityManager, LockMode, MikroORM, QueryOrder, ValidationError, wrap } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { initORMSqlite2, mockLogger } from './bootstrap';
import type { IAuthor4, IPublisher4, ITest4 } from './entities-schema';
import { Author4, Book4, BookTag4, FooBar4, Publisher4, PublisherType, Test4 } from './entities-schema';

describe.each(['sqlite', 'better-sqlite'] as const)('EntityManager (%s)', driver => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => orm = await initORMSqlite2(driver));
  beforeEach(async () => orm.getSchemaGenerator().clearDatabase());

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);

    // as the db lives only in memory, we need to re-create the schema after reconnection
    await orm.getSchemaGenerator().createSchema();
  });

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository(Author4);
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await repo.flush();
    const a = await repo.findOne(author);
    const authors = await repo.find({ id: author.id });
    expect(a).toBe(author);
    expect(authors[0]).toBe(author);
  });

  test('hydration with `forceUndefined` converts null values', async () => {
    const repo = orm.em.getRepository(Author4);
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await repo.flush();
    orm.em.clear();

    const a = await repo.findOneOrFail(author);
    expect(a.age).toBeUndefined();
    expect(a.identities).toBeUndefined();
    expect(a.born).toBeUndefined();
    expect(a.bornTime).toBeUndefined();
    expect(a.favouriteBook).toBeUndefined();
  });

  test('raw query with array param', async () => {
    const q1 = await orm.em.getPlatform().formatQuery(`select * from author4 where id in (?) limit ?`, [[1, 2, 3], 3]);
    expect(q1).toBe('select * from author4 where id in (1, 2, 3) limit 3');
    const q2 = await orm.em.getPlatform().formatQuery(`select * from author4 where id in (?) limit ?`, [['1', '2', '3'], 3]);
    expect(q2).toBe(`select * from author4 where id in ('1', '2', '3') limit 3`);
  });

  test('transactions', async () => {
    const god1 = orm.em.create(Author4, { name: 'God1', email: 'hello@heaven1.god' });

    try {
      await orm.em.transactional(async em => {
        await em.persistAndFlush(god1);
        throw new Error(); // rollback the transaction
      });
    } catch { }

    const res1 = await orm.em.findOne(Author4, { name: 'God1' });
    expect(res1).toBeNull();

    const ret = await orm.em.transactional(async em => {
      const god2 = orm.em.create(Author4, { name: 'God2', email: 'hello@heaven2.god' });
      await em.persist(god2);
      return true;
    });

    const res2 = await orm.em.findOne(Author4, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god3 = orm.em.create(Author4, { name: 'God4', email: 'hello@heaven4.god' });
        await em.persist(god3);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res3 = await orm.em.findOne(Author4, { name: 'God4' });
      expect(res3).toBeNull();
    }
  });

  test('transactions respect the tx context', async () => {
    const god1 = await orm.em.nativeInsert(Author4, { name: 'God1', email: 'hello@heaven1.god' });

    // this repo is based on `orm.em`, but thanks `TransactionContext` helper,
    // it will use the right EM behind the scenes when used inside `em.transactional()`
    const repo = orm.em.getRepository(Author4);

    await orm.em.transactional(async () => {
      const a = await repo.findOneOrFail(god1);
      a.name = 'abc';
    });

    orm.em.clear();
    const res1 = await orm.em.findOne(Author4, { name: 'God1' });
    expect(res1).toBeNull();

    const res2 = await orm.em.findOne(Author4, { name: 'abc' });
    expect(res2).not.toBeNull();
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const god1 = orm.em.create(Author4, { name: 'God1', email: 'hello1@heaven.god' });

      try {
        await em.transactional(async em2 => {
          await em2.persistAndFlush(god1);
          throw new Error(); // rollback the transaction
        });
      } catch { }

      const res1 = await em.findOne(Author4, { name: 'God1' });
      expect(res1).toBeNull();

      await em.transactional(async em2 => {
        const god2 = orm.em.create(Author4, { name: 'God2', email: 'hello2@heaven.god' });
        await em2.persistAndFlush(god2);
      });

      const res2 = await em.findOne(Author4, { name: 'God2' });
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
          await em2.persistAndFlush(orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' }));
          throw new Error(); // rollback the transaction
        });
      } catch { }

      await em.persistAndFlush(orm.em.create(Author4, { name: 'God Persisted!', email: 'hello-persisted@heaven.god' }));
    });

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author4` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author4` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author4, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    expect(bible.author).toBe(god);
    bible.author = god;
    await orm.em.flush();

    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    author.born = new Date('1990-03-23');
    author.favouriteBook = bible;

    const publisher = orm.em.create(Publisher4, { name: '7K publisher', type: PublisherType.GLOBAL });
    const book1 = orm.em.create(Book4, { title: 'My Life on The Wall, part 1', author });
    book1.publisher = wrap(publisher).toReference();
    book1.author = author;
    const book2 = orm.em.create(Book4, { title: 'My Life on The Wall, part 2', author });
    book2.publisher = wrap(publisher).toReference();
    book2.author = author;
    const book3 = orm.em.create(Book4, { title: 'My Life on The Wall, part 3', author });
    book3.publisher = wrap(publisher).toReference();
    book3.author = author;

    await orm.em.flush();
    orm.em.clear();

    const publisher7k = await orm.em.getRepository(Publisher4).findOneOrFail({ name: '7K publisher' });
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(false);
    orm.em.clear();

    const authorRepository = orm.em.getRepository(Author4);
    const booksRepository = orm.em.getRepository(Book4);
    const books = await booksRepository.findAll({ populate: ['author'] });
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible.id })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, { populate: ['author'] });
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = await authorRepository.findOneOrFail({ name: 'Jon Snow' }, { populate: ['books', 'favouriteBook'] });
    const authors = await authorRepository.findAll({ populate: ['books', 'favouriteBook'] });
    expect(await authorRepository.findOne({ email: 'not existing' })).toBeNull();

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
    expect(typeof jon.books.getIdentifiers()[0]).toBe('number');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books.$) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);

        expect(book.author!.constructor.name).toBe('Author4');
        expect(wrap(book.author).isInitialized()).toBe(true);
        expect(book.publisher!.unwrap().constructor.name).toBe('Publisher4');
        expect(wrap(book.publisher).isInitialized()).toBe(false);
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
    expect(lastBook[0].author!.constructor.name).toBe('Author4');
    expect(wrap(lastBook[0].author).isInitialized()).toBe(true);
    await orm.em.getRepository(Book4).remove(lastBook[0]).flush();
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    await orm.em.flush();
    orm.em.clear();

    const ref = orm.em.getReference(Author4, god.id);
    expect(wrap(ref).isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author4, god.id);
    expect(ref).toBe(newGod);
    expect(wrap(ref).isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    orm.em.create(Author4, { name: 'Author 1', email: 'a1@example.com' });
    orm.em.create(Author4, { name: 'Author 2', email: 'a2@example.com' });
    orm.em.create(Author4, { name: 'Author 3', email: 'a3@example.com' });
    await orm.em.flush();
    orm.em.clear();

    const authors = await orm.em.find(Author4, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates]', async () => {
    const test = orm.em.create(Test4, {});

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.flush();
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testStandardFailureThrowsException]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await orm.em.flush();
    expect(typeof test.version).toBe('number');
    expect(test.version).toBe(1);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test4, test.id);
    await orm.em.nativeUpdate<ITest4>('Test4', { id: test.id }, { name: 'Changed!' }); // simulate concurrent update
    test2!.name = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe(`The optimistic lock on entity Test4 failed`);
      expect((e as ValidationError).getEntity()).toBe(test2);
    }
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await orm.em.flush();
    orm.em.clear();

    const proxy = orm.em.getReference(Test4, test.id);
    await orm.em.lock(proxy, LockMode.OPTIMISTIC, 1);
    expect(wrap(proxy).isInitialized()).toBe(true);
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await orm.em.flush();
    orm.em.clear();

    const test2 = await orm.em.findOne(Test4, test.id);
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [testOptimisticTimestampLockFailureThrowsException]', async () => {
    const tag = orm.em.create(BookTag4, { name: 'Testing' });
    expect(tag.version).toBeUndefined();
    await orm.em.persistAndFlush(tag);
    expect(tag.version).toBeInstanceOf(Date);
    orm.em.clear();

    const tag2 = (await orm.em.findOne(BookTag4, tag.id))!;
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
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await orm.em.persistAndFlush(author);
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrowError('Cannot obtain optimistic lock on unversioned entity Author4');
  });

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await orm.em.flush();
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [version mismatch]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await orm.em.flush();
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrowError('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = orm.em.create(Test4, {});
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrowError('Entity Test4 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = orm.em.create(Test4, { name: 'Lock test' });
    await orm.em.flush();
    await expect(orm.em.findOne(Test4, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.findOne(Test4, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrowError('An open transaction is required for this operation');
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrowError('An open transaction is required for this operation');
  });

  test('findOne does not support pessimistic locking [pessimistic write]', async () => {
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author4` as `a0` where `a0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne does not support pessimistic locking [pessimistic read]', async () => {
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_READ);
    });

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author4` as `a0` where `a0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('stable results of serialization', async () => {
    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    const bible2 = orm.em.create(Book4, { title: 'Bible pt. 2', author: god });
    const bible3 = orm.em.create(Book4, { title: 'Bible pt. 3', author: orm.em.create(Author4, { name: 'Lol', email: 'lol@lol.lol' }) });
    await orm.em.persist([bible, bible2, bible3]).flush();
    orm.em.clear();

    const newGod = (await orm.em.findOne(Author4, god.id))!;
    const books = await orm.em.find(Book4, {});
    await wrap(newGod).init(false);

    for (const book of books) {
      expect(wrap(book).toJSON()).toMatchObject({
        author: book.author!.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = orm.em.create(Publisher4, { name: 'Publisher4' });
    await orm.em.persist(pub).flush();
    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    bible.publisher = wrap(pub).toReference();
    const bible2 = orm.em.create(Book4, { title: 'Bible pt. 2', author: god });
    bible2.publisher = wrap(pub).toReference();
    const bible3 = orm.em.create(Book4, { title: 'Bible pt. 3', author: orm.em.create(Author4, { name: 'Lol', email: 'lol@lol.lol' }) });
    bible3.publisher = wrap(pub).toReference();
    await orm.em.persist([bible, bible2, bible3]).flush();
    orm.em.clear();

    const newGod = orm.em.getReference(Author4, god.id);
    const publisher = await orm.em.findOneOrFail('Publisher4' as EntityName<IPublisher4>, pub.id, { populate: ['books'] });
    await wrap(newGod).init();

    const json = wrap(publisher).toJSON().books!;

    for (const book of publisher.books) {
      expect(json.find((b: any) => b.id === book.id)).toMatchObject({
        author: book.author!.id,
      });
    }
  });

  test('json properties', async () => {
    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    god.identities = ['fb-123', 'pw-231', 'tw-321'];
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    bible.meta = { category: 'god like', items: 3, valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } };
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const g = await orm.em.findOneOrFail(Author4, god.id, { populate: ['books'] });
    expect(Array.isArray(g.identities)).toBe(true);
    expect(g.identities).toEqual(['fb-123', 'pw-231', 'tw-321']);
    expect(typeof g.books[0].meta).toBe('object');
    expect(g.books[0].meta).toEqual({ category: 'god like', items: 3, valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } });
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(Book4, { meta: { category: 'god like' } });
    const b2 = await orm.em.findOneOrFail(Book4, { meta: { category: 'god like', items: 3 } });
    const b3 = await orm.em.findOneOrFail(Book4, { meta: { nested: { bar: 321 } } });
    const b4 = await orm.em.findOneOrFail(Book4, { meta: { nested: { foo: '123', bar: 321 } } });
    const b5 = await orm.em.findOneOrFail(Book4, { meta: { valid: true, nested: { foo: '123', bar: 321 } } });
    const b6 = await orm.em.findOneOrFail(Book4, { meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59 } } } });
    const b7 = await orm.em.findOneOrFail(Book4, { meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } } });
    expect(b1).toBe(b2);
    expect(b1).toBe(b3);
    expect(b1).toBe(b4);
    expect(b1).toBe(b5);
    expect(b1).toBe(b6);
    expect(b1).toBe(b7);

    // complex condition for json property with update query (GH #2839)
    const qb141 = orm.em.createQueryBuilder(Book4).update({ meta: { items: 3 } }).where({
      $and: [
        { id: 123 },
        { $or: [
            { meta: null },
            { meta: { $eq: null } },
            { meta: { time: { $lt: 1646147306 } } },
          ] },
      ],
    });
    expect(qb141.getFormattedQuery()).toBe('update `book4` set `meta` = \'{"items":3}\' ' +
      'where `id` = 123 ' +
      'and (`meta` is null ' +
      'or `meta` is null ' +
      'or json_extract(`meta`, \'$.time\') < 1646147306)');
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository(Author4);
    const jon = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
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
    const authorRepository = orm.em.getRepository(Author4);
    const god = orm.em.create(Author4, { name: 'God', email: 'hello@heaven.god' });
    const bible = orm.em.create(Book4, { title: 'Bible', author: god });
    await orm.em.persist(bible).flush();

    const jon = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    jon.born = new Date('1990-03-23');
    jon.favouriteBook = bible;
    await orm.em.persist(jon).flush();
    orm.em.clear();

    const jon2 = await authorRepository.findOneOrFail(jon.id);
    expect(jon2).not.toBeNull();
    expect(jon2.name).toBe('Jon Snow');
    expect(jon2.favouriteBook!.constructor.name).toBe('Book4');
    expect(wrap(jon2.favouriteBook).isInitialized()).toBe(false);

    await wrap(jon2.favouriteBook).init();
    expect(jon2.favouriteBook!.constructor.name).toBe('Book4');
    expect(wrap(jon2.favouriteBook).isInitialized()).toBe(true);
    expect(jon2.favouriteBook!.title).toBe('Bible');
  });

  test('many to many relation', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = orm.em.create(Book4, { title: 'My Life on the Wall, part 1', author });
    const book2 = orm.em.create(Book4, { title: 'My Life on the Wall, part 2', author });
    const book3 = orm.em.create(Book4, { title: 'My Life on the Wall, part 3', author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly' });
    const tag2 = orm.em.create(BookTag4, { name: 'funny' });
    const tag3 = orm.em.create(BookTag4, { name: 'sick' });
    const tag4 = orm.em.create(BookTag4, { name: 'strange' });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy' });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist([book1, book2, book3]);
    await orm.em.flush();

    expect(tag1.id).toBeDefined();
    expect(tag2.id).toBeDefined();
    expect(tag3.id).toBeDefined();
    expect(tag4.id).toBeDefined();
    expect(tag5.id).toBeDefined();

    // test inverse side
    const tagRepository = orm.em.getRepository(BookTag4);
    let tags = await tagRepository.findAll();
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0].constructor.name).toBe('BookTag4');
    expect(tags[0].name).toBe('silly');
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.length).toBe(2);

    orm.em.clear();
    tags = await orm.em.find(BookTag4, {});
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection<Book4> of entity BookTag4\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection<Book4> of entity BookTag4\[\d+] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection<Book4> of entity BookTag4\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection<Book4> of entity BookTag4\[\d+] not initialized/);

    // test M:N lazy load
    orm.em.clear();
    tags = await tagRepository.findAll();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0].constructor.name).toBe('Book4');
    expect(tags[0].books.getItems()[0].id).toBeDefined();
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
    let book = (await orm.em.findOne(Book4, { tags: tag1.id }))!;
    expect(book.tags.isInitialized()).toBe(false);
    await book.tags.init();
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0].constructor.name).toBe('BookTag4');
    expect(book.tags.getItems()[0].id).toBeDefined();
    expect(wrap(book.tags.getItems()[0]).isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tagRepository.getReference(tag1.id));
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
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
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(0);
  });

  test('partial loading of collections', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });

    for (let i = 1; i <= 15; i++) {
      const book = orm.em.create(Book4, { title: `book ${('' + i).padStart(2, '0')}` });
      author.books.add(book);

      for (let j = 1; j <= 15; j++) {
        const tag1 = orm.em.create(BookTag4, { name: `tag ${('' + i).padStart(2, '0')}-${('' + j).padStart(2, '0')}` });
        book.tags.add(tag1);
      }
    }

    await orm.em.persist(author).flush();
    orm.em.clear();

    const a = await orm.em.findOneOrFail(Author4, author);
    const books = await a.books.matching({ limit: 5, offset: 10, orderBy: { title: 'asc' } });
    expect(books).toHaveLength(5);
    expect(a.books.getItems(false)).not.toHaveLength(5);
    expect(books.map(b => b.title)).toEqual(['book 11', 'book 12', 'book 13', 'book 14', 'book 15']);

    const tags = await books[0].tags.matching({ limit: 5, offset: 5, orderBy: { name: 'asc' }, store: true });
    expect(tags).toHaveLength(5);
    expect(books[0].tags).toHaveLength(5);
    expect(tags.map(t => t.name)).toEqual(['tag 11-06', 'tag 11-07', 'tag 11-08', 'tag 11-09', 'tag 11-10']);
    expect(() => books[0].tags.add(orm.em.create(BookTag4, { name: 'new' }))).toThrowError('You cannot modify collection Book4.tags as it is marked as readonly.');
    expect(wrap(books[0]).toObject()).toMatchObject({
      tags: books[0].tags.getItems().map(t => ({ name: t.name })),
    });
  });

  test('disabling identity map', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = orm.em.create(Book4, { title: 'My Life on the Wall, part 1', author });
    const book2 = orm.em.create(Book4, { title: 'My Life on the Wall, part 2', author });
    const book3 = orm.em.create(Book4, { title: 'My Life on the Wall, part 3', author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly' });
    const tag2 = orm.em.create(BookTag4, { name: 'funny' });
    const tag3 = orm.em.create(BookTag4, { name: 'sick' });
    const tag4 = orm.em.create(BookTag4, { name: 'strange' });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy' });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist(book1);
    orm.em.persist(book2);
    await orm.em.persist(book3).flush();
    orm.em.clear();

    const authors = await orm.em.find(Author4, {}, {
      populate: ['books.tags'],
      disableIdentityMap: true,
    });

    expect(authors).toHaveLength(1);
    expect(authors[0].id).toBe(author.id);
    expect(authors[0].books).toHaveLength(3);
    expect(authors[0].books[0].id).toBe(book1.id);
    expect(authors[0].books[0].tags).toHaveLength(2);
    expect(authors[0].books[0].tags[0].name).toBe('silly');
    expect(orm.em.getUnitOfWork().getIdentityMap().values().length).toBe(0);

    const a1 = await orm.em.findOneOrFail(Author4, author.id, {
      populate: ['books.tags'],
      disableIdentityMap: true,
    });
    expect(a1.id).toBe(author.id);
    expect(a1.books).toHaveLength(3);
    expect(a1.books[0].id).toBe(book1.id);
    expect(a1.books[0].tags).toHaveLength(2);
    expect(a1.books[0].tags[0].name).toBe('silly');
    expect(orm.em.getUnitOfWork().getIdentityMap().values().length).toBe(0);

    expect(a1).not.toBe(authors[0]);
    expect(a1.books[0]).not.toBe(authors[0].books[0]);
  });

  test('populating many to many relation', async () => {
    const p1 = orm.em.create(Publisher4, { name: 'foo' });
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = orm.em.create(Publisher4, { name: 'bar' });
    p2.tests.add(orm.em.create(Test4, {}), orm.em.create(Test4, {}));
    await orm.em.persist([p1, p2]).flush();
    const repo = orm.em.getRepository(Publisher4);

    orm.em.clear();
    const publishers = await repo.findAll({ populate: ['tests'] });
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0].constructor.name).toBe('Publisher4');
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized()).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);
  });

  test('populating many to many relation on inverse side', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = orm.em.create(Book4, { title: 'My Life on } The Wall, part 1', author });
    const book2 = orm.em.create(Book4, { title: 'My Life on } The Wall, part 2', author });
    const book3 = orm.em.create(Book4, { title: 'My Life on } The Wall, part 3', author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly' });
    const tag2 = orm.em.create(BookTag4, { name: 'funny' });
    const tag3 = orm.em.create(BookTag4, { name: 'sick' });
    const tag4 = orm.em.create(BookTag4, { name: 'strange' });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy' });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]).flush();
    const repo = orm.em.getRepository(BookTag4);

    orm.em.clear();
    const tags = await repo.findAll({ populate: ['books'] });
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0].constructor.name).toBe('BookTag4');
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books.getItems()[0]).isInitialized()).toBe(true);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author4);
    const author = orm.em.create(Author4, { name: 'Johny Cash', email: 'johny@cash.com' });
    await repo.persistAndFlush(author);
    orm.em.clear();

    await expect(repo.findAll({ populate: ['tests'] as never })).rejects.toThrowError(`Entity 'Author4' does not have property 'tests'`);
    await expect(repo.findOne(author.id, { populate: ['tests'] as never })).rejects.toThrowError(`Entity 'Author4' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository(Publisher4);
    const publisher = orm.em.create(Publisher4, {});
    const t1 = orm.em.create(Test4, { name: 't1' });
    const t2 = orm.em.create(Test4, { name: 't2' });
    const t3 = orm.em.create(Test4, { name: 't3' });
    await orm.em.persist([t1, t2, t3]).flush();
    publisher.tests.add(t2, t1, t3);
    await repo.persistAndFlush(publisher);
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id, { populate: ['tests'] }))!;
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);
  });

  test('property onUpdate hook (updatedAt field)', async () => {
    const repo = orm.em.getRepository(Author4);
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    await repo.persistAndFlush(author);
    expect(author.createdAt).toBeDefined();
    expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);

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
    const res1 = await orm.em.nativeInsert<IAuthor4>('Author4', { name: 'native name 1', email: 'native1@email.com' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author4, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author4, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.nativeInsert(Author4, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2', email: 'native2@email.com' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author4, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);
  });

  test('EM supports smart search conditions', async () => {
    const author = orm.em.create(Author4, { name: 'name', email: 'email' });
    const b1 = orm.em.create(Book4, { title: 'b1', author });
    const b2 = orm.em.create(Book4, { title: 'b2', author });
    const b3 = orm.em.create(Book4, { title: 'b3', author });
    await orm.em.persist([b1, b2, b3]).flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author4, { 'id:ne': 10 } as any))!;
    expect(a1).not.toBeNull();
    expect(a1.id).toBe(author.id);
    const a2 = (await orm.em.findOne(Author4, { 'id>=': 1 } as any))!;
    expect(a2).not.toBeNull();
    expect(a2.id).toBe(author.id);
    const a3 = (await orm.em.findOne(Author4, { 'id:nin': [2, 3, 4] } as any))!;
    expect(a3).not.toBeNull();
    expect(a3.id).toBe(author.id);
    const a4 = (await orm.em.findOne(Author4, { 'id:in': [] } as any))!;
    expect(a4).toBeNull();
    const a5 = (await orm.em.findOne(Author4, { 'id:nin': [] } as any))!;
    expect(a5).not.toBeNull();
    expect(a5.id).toBe(author.id);
  });

  test('datetime is stored in correct timezone', async () => {
    const author = orm.em.create(Author4, { name: 'n', email: 'e' });
    author.createdAt = new Date('2000-01-01T00:00:00Z');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const res = await orm.em.getConnection().execute<{ created_at: number }[]>(`select created_at as created_at from author4 where id = ${author.id}`);
    expect(res[0].created_at).toBe(+author.createdAt);
    const a = await orm.em.findOneOrFail(Author4, author.id);
    expect(+a.createdAt!).toBe(+author.createdAt);
  });

  test('merging results from QB to existing entity', async () => {
    const bar = orm.em.create(FooBar4, { name: 'b1' });
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar4, { name: 'b1' });
    expect(b1.virtual).toBeUndefined();

    await orm.em.createQueryBuilder(FooBar4).select(`id, '123' as virtual`).getResultList();
    expect(b1.virtual).toBe('123');
  });

  test('batch update with changing OneToOne relation (GH issue #1025)', async () => {
    const bar1 = orm.em.create(FooBar4, { name: 'bar 1' });
    const bar2 = orm.em.create(FooBar4, { name: 'bar 2' });
    const bar3 = orm.em.create(FooBar4, { name: 'bar 3' });
    bar1.fooBar = bar2;
    await orm.em.persistAndFlush([bar1, bar3]);

    bar1.fooBar = undefined;
    bar3.fooBar = bar2;

    const mock = mockLogger(orm, ['query']);

    await new Promise(resolve => setTimeout(resolve, 10));
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select `f0`.`id` from `foo_bar4` as `f0` where ((`f0`.`id` = ? and `f0`.`version` = ?) or (`f0`.`id` = ? and `f0`.`version` = ?))');
    expect(mock.mock.calls[2][0]).toMatch('update `foo_bar4` set `foo_bar_id` = case when (`id` = ?) then ? when (`id` = ?) then ? else `foo_bar_id` end, `updated_at` = case when (`id` = ?) then ? when (`id` = ?) then ? else `updated_at` end, `version` = `version` + 1 where `id` in (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('select `f0`.`id`, `f0`.`version` from `foo_bar4` as `f0` where `f0`.`id` in (?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('custom types', async () => {
    await orm.em.nativeInsert(FooBar4, { id: 123, name: 'n1', array: [1, 2, 3] });
    await orm.em.nativeInsert(FooBar4, { id: 456, name: 'n2', array: [] });

    const bar = orm.em.create(FooBar4, { name: 'b1 \'the bad\' lol' });
    bar.blob = Buffer.from([1, 2, 3, 4, 5]);
    bar.array = [];
    bar.object = { foo: 'bar "lol" \'wut\' escaped', bar: 3 };
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar4, bar.id);
    expect(b1.blob).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(b1.blob).toBeInstanceOf(Buffer);
    expect(b1.array).toEqual([]);
    expect(b1.array).toBeInstanceOf(Array);
    expect(b1.object).toEqual({ foo: 'bar "lol" \'wut\' escaped', bar: 3 });
    expect(b1.object).toBeInstanceOf(Object);
    expect(b1.object!.bar).toBe(3);

    b1.object = 'foo';
    b1.array = [1, 2, 3, 4, 5];
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBar4, bar.id);
    expect(b2.object).toBe('foo');
    expect(b2.array).toEqual([1, 2, 3, 4, 5]);
    expect(b2.array![2]).toBe(3);

    b2.object = [1, 2, '3'];
    await orm.em.flush();
    orm.em.clear();

    const b3 = await orm.em.findOneOrFail(FooBar4, bar.id);
    expect(b3.object[0]).toBe(1);
    expect(b3.object[1]).toBe(2);
    expect(b3.object[2]).toBe('3');

    b3.object = 123;
    await orm.em.flush();
    orm.em.clear();

    const b4 = await orm.em.findOneOrFail(FooBar4, bar.id);
    expect(b4.object).toBe(123);
  });

  test('mapping joined results from query builder', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = orm.em.create(Book4, { title: 'My Life on the Wall, part 1', author });
    const book2 = orm.em.create(Book4, { title: 'My Life on the Wall, part 2', author });
    const book3 = orm.em.create(Book4, { title: 'My Life on the Wall, part 3', author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly' });
    const tag2 = orm.em.create(BookTag4, { name: 'funny' });
    const tag3 = orm.em.create(BookTag4, { name: 'sick' });
    const tag4 = orm.em.create(BookTag4, { name: 'strange' });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy' });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    await orm.em.persist([book1, book2, book3]).flush();
    orm.em.clear();

    const qb = orm.em.createQueryBuilder(Author4, 'a');
    qb.select('*')
      .leftJoinAndSelect('a.books', 'b')
      .leftJoinAndSelect('b.tags', 't')
      .where({ 't.name': ['sick', 'sexy'] });
    const sql = 'select `a`.*, ' +
      '`b`.`id` as `b__id`, `b`.`created_at` as `b__created_at`, `b`.`updated_at` as `b__updated_at`, `b`.`title` as `b__title`, `b`.`price` as `b__price`, `b`.`author_id` as `b__author_id`, `b`.`publisher_id` as `b__publisher_id`, `b`.`meta` as `b__meta`, ' +
      '`t`.`id` as `t__id`, `t`.`created_at` as `t__created_at`, `t`.`updated_at` as `t__updated_at`, `t`.`name` as `t__name`, `t`.`version` as `t__version` ' +
      'from `author4` as `a` ' +
      'left join `book4` as `b` on `a`.`id` = `b`.`author_id` ' +
      'left join `tags_ordered` as `t1` on `b`.`id` = `t1`.`book4_id` ' +
      'left join `book_tag4` as `t` on `t1`.`book_tag4_id` = `t`.`id` ' +
      'where `t`.`name` in (\'sick\', \'sexy\')';
    expect(qb.getFormattedQuery()).toEqual(sql);
    const res = await qb.getSingleResult();
    expect(res).not.toBeNull();
    expect(res!.books[0]).not.toBeNull();
    expect(res!.books[0].title).toBe('My Life on the Wall, part 1');
    expect(res!.books[0].tags[0].name).toBe('sick');
  });

  test('question marks and parameter interpolation (GH issue #920)', async () => {
    const e = orm.em.create(Author4, { name: `?baz? uh \\? ? wut? \\\\ wut`, email: '123' });
    await orm.em.persistAndFlush(e);
    const e2 = await orm.em.fork().findOneOrFail(Author4, e);
    expect(e2.name).toBe(`?baz? uh \\? ? wut? \\\\ wut`);
    const res = await orm.em.getKnex().raw('select ? as count', [1]);
    expect(res[0].count).toBe(1);
  });

  test('qb.getCount()`', async () => {
    for (let i = 1; i <= 50; i++) {
      const author = orm.em.create(Author4, {
        name: `a${i}`,
        email: `e${i}`,
        termsAccepted: !(i % 2),
      });
      orm.em.persist(author);
    }

    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm);
    const count1 = await orm.em.createQueryBuilder(Author4).limit(10, 20).getCount();
    expect(count1).toBe(50);
    const count2 = await orm.em.createQueryBuilder(Author4).getCount('termsAccepted');
    expect(count2).toBe(50);
    const count3 = await orm.em.createQueryBuilder(Author4).getCount('termsAccepted', true);
    expect(count3).toBe(2);
    const count4 = await orm.em.createQueryBuilder(Author4).where({ email: '123' }).getCount();
    expect(count4).toBe(0);
    expect(mock.mock.calls[0][0]).toMatch('select count(`a0`.`id`) as `count` from `author4` as `a0`');
    expect(mock.mock.calls[1][0]).toMatch('select count(`a0`.`terms_accepted`) as `count` from `author4` as `a0`');
    expect(mock.mock.calls[2][0]).toMatch('select count(distinct `a0`.`terms_accepted`) as `count` from `author4` as `a0`');
    expect(mock.mock.calls[3][0]).toMatch('select count(`a0`.`id`) as `count` from `author4` as `a0` where `a0`.`email` = \'123\'');
  });

  test('using collection methods with null/undefined (GH issue #1408)', async () => {
    const e = orm.em.create(Author4, { name: 'name', email: 'email' });
    expect(() => e.books.remove(null as any)).not.toThrow();
    expect(() => e.books.remove(undefined as any)).not.toThrow();
  });

  // this should run in ~600ms (when running single test locally)
  test('perf: one to many', async () => {
    const author = orm.em.create(Author4, { name: 'n', email: 'e' });
    await orm.em.persistAndFlush(author);

    for (let i = 1; i <= 3_000; i++) {
      const book = orm.em.create(Book4, { title: 'My Life on The Wall, part ' + i, author });
      author.books.add(book);
    }

    await orm.em.flush();
    expect(author.books.getItems().every(b => b.id)).toBe(true);
  });

  // this should run in ~400ms (when running single test locally)
  test('perf: batch insert and update', async () => {
    const authors = new Set<IAuthor4>();

    for (let i = 1; i <= 1000; i++) {
      const author = orm.em.create(Author4, { name: `Jon Snow ${i}`, email: `snow-${i}@wall.st` });
      orm.em.persist(author);
      authors.add(author);
    }

    await orm.em.flush();
    authors.forEach(author => expect(author.id).toBeGreaterThan(0));

    authors.forEach(a => a.termsAccepted = true);
    await orm.em.flush();
  });

  test('loadCount to get the number of entries without initializing the collection (GH issue #949)', async () => {
    let author = orm.em.create(Author4, { name: 'Jon Doe', email: 'doe-jon@wall.st' });
    author.books.add(orm.em.create(Book4, { title: 'bo1' }));
    // Entity not managed yet
    await expect(author.books.loadCount()).rejects.toThrow(ValidationError);
    await orm.em.persistAndFlush(author);

    const reloadedBook = await author.books.loadCount();
    expect(reloadedBook).toBe(1);

    // Adding new items
    const laterRemoved = orm.em.create(Book4, { title: 'bo2' });
    author.books.add(laterRemoved, orm.em.create(Book4, { title: 'bo3' }));
    const threeItms = await author.books.loadCount();
    expect(threeItms).toEqual(3);

    // Force refresh
    expect(await author.books.loadCount(true)).toEqual(1);
    // Testing array collection implementation
    await orm.em.flush();
    orm.em.clear();

    // Updates when removing an item
    author = (await orm.em.findOneOrFail(Author4, author.id));
    expect(await author.books.loadCount()).toEqual(3);
    await author.books.init();
    author.books.remove(author.books[0]);
    expect(await author.books.loadCount()).toEqual(2);
    expect(await author.books.loadCount(true)).toEqual(3);
    await orm.em.flush();
    orm.em.clear();

    // Resets the counter when hydrating
    author = (await orm.em.findOneOrFail(Author4, author.id));
    await author.books.loadCount();
    author.books.hydrate([]);
    expect(await author.books.loadCount()).toEqual(0);
    expect(await author.books.loadCount(true)).toEqual(2);

    const coll = new ArrayCollection(author);
    expect(await coll.loadCount()).toEqual(0);

    // n:m relations
    let taggedBook = orm.em.create(Book4, { title: 'FullyTagged' });
    await orm.em.persistAndFlush(taggedBook);
    const tags = [orm.em.create(BookTag4, { name: 'science-fiction' }), orm.em.create(BookTag4, { name: 'adventure' }), orm.em.create(BookTag4, { name: 'horror' })];
    taggedBook.tags.add(...tags);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(0);
    await orm.em.flush();
    orm.em.clear();

    taggedBook = await orm.em.findOneOrFail(Book4, taggedBook.id);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length);
    expect(taggedBook.tags.isInitialized()).toBe(false);
    await taggedBook.tags.init();
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length);
    const removing  = taggedBook.tags[0];
    taggedBook.tags.remove(removing);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length - 1);
    await expect(taggedBook.tags.loadCount(true)).resolves.toEqual(tags.length);
    await orm.em.flush();
    orm.em.clear();

    taggedBook = await orm.em.findOneOrFail(Book4, taggedBook.id);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length - 1);
  });

  test('loadCount with unidirectional m:n (GH issue #1608)', async () => {
    const publisher = orm.em.create(Publisher4, { name: 'pub' });
    const t1 = orm.em.create(Test4, { name: 't1' });
    const t2 = orm.em.create(Test4, { name: 't2' });
    const t3 = orm.em.create(Test4, { name: 't3' });
    await orm.em.persist([t1, t2, t3]).flush();
    publisher.tests.add(t2, t1, t3);
    await orm.em.persistAndFlush(publisher);
    orm.em.clear();

    let ent = await orm.em.findOneOrFail(Publisher4, publisher.id);
    await expect(ent.tests.loadCount()).resolves.toBe(3);
    await ent.tests.init();
    await expect(ent.tests.loadCount()).resolves.toBe(3);
    orm.em.clear();

    ent = await orm.em.findOneOrFail(Publisher4, publisher.id, { populate: ['tests'] as const });
    await expect(ent.tests.loadCount()).resolves.toBe(3);
    await ent.tests.init();
    await expect(ent.tests.loadCount()).resolves.toBe(3);
  });

  test('findAndCount with populate (GH issue #1736)', async () => {
    const publisher = orm.em.create(Publisher4, {
      name: 'pub',
      tests: [
        { name: 't1' },
        { name: 't2' },
        { name: 't3' },
      ],
    });
    await orm.em.fork().persistAndFlush(publisher);

    const [res, count] = await orm.em.findAndCount(Publisher4, { name: 'pub' }, { populate: ['tests'] });
    expect(count).toBe(1);
    expect(res[0].tests).toHaveLength(3);
  });

  test('cascade persisting when persist called early (before relations are set)', async () => {
    const author = orm.em.create(Author4, { name: 'a1', email: 'e1' });
    orm.em.persist(author);
    orm.em.assign(author, {
      books: [
        { title: 't1' },
        { title: 't2' },
        { title: 't3' },
      ],
    });

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `author4` (`created_at`, `email`, `name`, `terms_accepted`, `updated_at`) values');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book4` (`created_at`, `updated_at`, `title`, `author_id`) values');
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

  afterAll(async () => {
    await orm.close(true);
  });

});
