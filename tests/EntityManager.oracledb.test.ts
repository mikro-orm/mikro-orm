import { performance } from 'node:perf_hooks';
import { v4 } from 'uuid';
import {
  AnyEntity,
  ChangeSet,
  ChangeSetType,
  Collection,
  Configuration,
  DefaultLogger,
  EntityManager,
  EntityMetadata,
  EventSubscriber,
  FilterQuery,
  FlushEventArgs,
  ForeignKeyConstraintViolationException,
  InvalidFieldNameException,
  IsolationLevel,
  LoadStrategy,
  LockMode,
  MikroORM,
  NonUniqueFieldNameException,
  NotNullConstraintViolationException,
  OracleDriver,
  PopulateHint,
  QueryFlag,
  QueryOrder,
  raw,
  ref,
  Reference,
  sql,
  SyntaxErrorException,
  TableExistsException,
  UniqueConstraintViolationException,
  ValidationError,
  wrap,
} from '@mikro-orm/oracledb';
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

describe('EntityManagerOracle', () => {
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
      dbName: 'mikro_orm_test',
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, Configuration2, FooBar2, FooBaz2],
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
    const config = new Configuration(
      {
        driver: OracleDriver,
        clientUrl: 'localhost:91521/service_name',
        host: '127.0.0.10',
        password: 'secret',
        user: 'user',
        pool: { min: 1, max: 2, idleTimeoutMillis: 1000 },
      } as any,
      false,
    );
    const driver = new OracleDriver(config);
    expect(driver.getConnection().mapOptions({})).toMatchObject({
      connectionString: 'localhost:91521/service_name',
      password: 'secret',
      user: '"user"',
      poolMin: 1,
      poolMax: 2,
      poolTimeout: 1000,
    });
  });

  test('raw query with array param', async () => {
    const q1 = orm.em
      .getPlatform()
      .formatQuery(`select * from "author2" where "id" in (?) fetch next ? rows`, [[1, 2, 3], 3]);
    expect(q1).toBe('select * from "author2" where "id" in (1, 2, 3) fetch next 3 rows');
    const q2 = orm.em
      .getPlatform()
      .formatQuery(`select * from "author2" where "id" in (?) fetch next ? rows`, [['1', '2', '3'], 3]);
    expect(q2).toBe(`select * from "author2" where "id" in ('1', '2', '3') fetch next 3 rows`);
  });

  test('should return oracledb driver', async () => {
    expect(orm.driver).toBeInstanceOf(OracleDriver);
    await orm.driver.findOne(Book2, { double: 123 });
    await expect(orm.driver.findOne(Book2, { double: 123 })).resolves.toBeNull();
    const author = await orm.driver.nativeInsert(Author2, { name: 'author', email: 'email' });
    const tag = await orm.driver.nativeInsert(BookTag2, { name: 'tag name' });
    const uuid1 = v4();
    await expect(
      orm.driver.nativeInsert(Book2, { uuid: uuid1, author: author.insertId, tags: [tag.insertId] }),
    ).resolves.not.toBeNull();
    await expect(
      orm.driver.nativeUpdate(Book2, { uuid: uuid1 }, { title: 'booook' }, { convertCustomTypes: true }),
    ).resolves.not.toBeNull();
    await expect(orm.driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(orm.driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(orm.driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: { count: 1 },
      rows: [{ count: 1 }],
    });
    await expect(
      orm.driver
        .getConnection()
        .execute(
          'insert into "test2" ("name") values (?) returning "id" into :id',
          ['test', orm.driver.getPlatform().createOutBindings({ id: 'number' })],
          'run',
        ),
    ).resolves.toEqual({
      affectedRows: 1,
      row: { id: 1 },
      rows: [{ id: 1 }],
    });
    await expect(
      orm.driver.getConnection().execute('update "test2" set "name" = ? where "name" = ?', ['test 2', 'test'], 'run'),
    ).resolves.toEqual({
      affectedRows: 1,
      row: undefined,
      rows: [],
    });
    await expect(
      orm.driver.getConnection().execute('delete from "test2" where "name" = ?', ['test 2'], 'run'),
    ).resolves.toEqual({
      affectedRows: 1,
      row: undefined,
      rows: [],
    });
    expect(orm.driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(orm.driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(orm.driver.find(BookTag2, { books: { $in: [uuid1] } })).resolves.not.toBeNull();

    // multi inserts
    await orm.driver.nativeInsert(Test2, { id: 1, name: 't1' });
    await orm.driver.nativeInsert(Test2, { id: 2, name: 't2' });
    await orm.driver.nativeInsert(Test2, { id: 3, name: 't3' });
    await orm.driver.nativeInsert(Test2, { id: 4, name: 't4' });
    await orm.driver.nativeInsert(Test2, { id: 5, name: 't5' });

    const mock = mockLogger(orm, ['query']);

    const res = await orm.driver.nativeInsertMany(Publisher2, [
      { name: 'test 1', tests: [1, 3, 4], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
      { name: 'test 2', tests: [4, 2], type: PublisherType.LOCAL, type2: PublisherType2.LOCAL },
      { name: 'test 3', tests: [1, 5, 2], type: PublisherType.GLOBAL, type2: PublisherType2.LOCAL },
    ]);

    expect(mock.mock.calls[0][0]).toMatch(
      `begin execute immediate 'insert into "publisher2" ("name", "type", "type2") values (?, ?, ?) returning "id" into :out_id' using out :out_id__0; execute immediate 'insert into "publisher2" ("name", "type", "type2") values (?, ?, ?) returning "id" into :out_id' using out :out_id__1; execute immediate 'insert into "publisher2" ("name", "type", "type2") values (?, ?, ?) returning "id" into :out_id' using out :out_id__2; end;`,
    );
    // pivot table rows are inserted per-publisher (3 batches: 3 + 2 + 3 rows)
    expect(mock.mock.calls[1][0]).toMatch(
      `begin execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__0; execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__1; execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__2; end;`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `begin execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__0; execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__1; end;`,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `begin execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__0; execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__1; execute immediate 'insert into "publisher2_tests" ("test2_id", "publisher2_id") values (?, ?) returning "id" into :out_id' using out :out_id__2; end;`,
    );

    expect(res).toMatchObject({
      insertId: 1,
      affectedRows: 3,
      row: { id: 1 },
      rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });
    const res2 = await orm.driver.find(Publisher2, {});
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

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    author.termsAccepted = true;
    author.favouriteAuthor = author;
    await orm.em.persist(author).flush();
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
        await em.persist(god1).flush();
        throw new Error(); // rollback the transaction
      });
    } catch {}

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
    await orm.em.persist([god, believer]).flush();
    orm.em.clear();

    const believerFromTx = await orm.em.transactional(async () => {
      const believerFromTx = await orm.em.findOneOrFail(Author2, { name: 'believer' }, { populate: ['following'] });
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
      await orm.em.transactional(
        async em => {
          await em.persist(god1).flush();
          throw new Error(); // rollback the transaction
        },
        { isolationLevel: IsolationLevel.READ_COMMITTED },
      );
    } catch {}

    expect(mock.mock.calls[0][0]).toMatch('set transaction isolation level read committed');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age',
    );
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('read-only transactions', async () => {
    const mock = mockLogger(orm, ['query']);

    const god1 = new Author2('God1', 'hello@heaven1.god');
    await expect(
      orm.em.transactional(
        async em => {
          await em.persist(god1).flush();
        },
        { readOnly: true },
      ),
    ).rejects.toThrow(/ORA-01456: may not perform insert, delete, update operation inside a READ ONLY transaction/);

    expect(mock.mock.calls[0][0]).toMatch('set transaction read only');
    expect(mock.mock.calls[1][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id", "age" into :out_id, :out_age',
    );
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const god1 = new Author2('God1', 'hello1@heaven.god');

      try {
        await em.transactional(async em2 => {
          await em2.persist(god1).flush();
          throw new Error(); // rollback the transaction
        });
      } catch {}

      const res1 = await em.findOne(Author2, { name: 'God1' });
      expect(res1).toBeNull();

      await em.transactional(async em2 => {
        const god2 = new Author2('God2', 'hello2@heaven.god');
        await em2.persist(god2).flush();
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
          await em2.persist(new Author2('God', 'hello@heaven.god')).flush();
          throw new Error(); // rollback the transaction
        });
      } catch {}

      em.persist(new Author2('God Persisted!', 'hello-persisted@heaven.god'));
    });

    // try to commit the outer transaction
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint "trx');
    expect(mock.mock.calls[2][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id"',
    );
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint "trx');
    expect(mock.mock.calls[4][0]).toMatch(
      'insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values (?, ?, ?, ?, ?) returning "id"',
    );
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('collection loads items after savepoint should not fail', async () => {
    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);
    const book = new Book2('My Life on The Wall, part 1', new Author2('name', 'email'));
    book.publisher = ref(publisher);

    const author = new Author2('Bartleby', 'bartelby@writer.org');
    author.books.add(book);

    await orm.em.persist(author).flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();
    await em.begin();

    const book2 = await em.findOneOrFail(Book2, book.uuid);
    const publisher2 = await book2.publisher!.loadOrFail({
      populate: ['tests'],
      strategy: 'select-in',
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });

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
    expect(mock.mock.calls[1][0]).toMatch(
      `select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null and "b0"."uuid_pk" = ? fetch next ? rows`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `select "p0".* from "publisher2" "p0" where "p0"."id" = ? fetch next ? rows only for update`,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `select "p0"."id", "p0"."test2_id", "p0"."publisher2_id", "t1"."id" "t1__id", "t1"."name" "t1__name", "t1"."book_uuid_pk" "t1__book_uuid_pk", "t1"."parent_id" "t1__parent_id", "t1"."version" "t1__version", "b2"."uuid_pk" "b2__uuid_pk" from "publisher2_tests" "p0" inner join "test2" "t1" on "p0"."test2_id" = "t1"."id" left join "book2" "b2" on "t1"."book_uuid_pk" = "b2"."uuid_pk" where "p0"."publisher2_id" in (?) order by "p0"."id" asc for update of "p0"."id", "t1"."id"`,
    );
    expect(mock.mock.calls[4][0]).toMatch(`savepoint "trx`);
    expect(mock.mock.calls[5][0]).toMatch(`release savepoint "trx`);
    expect(mock.mock.calls[6][0]).toMatch(
      `select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null and "b0"."publisher_id" in (?) for update`,
    );
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
    const logSpy = vi.spyOn(DefaultLogger.prototype, 'log');
    const a = await qb.execute();
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

    const r1 = await orm.em.createQueryBuilder(Test2).where({ name: '123' }).getResult();
    orm.em.clear();
    const test = new Test2();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persist(test).flush();
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
    await orm.em.persist(bible).flush();

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
    const books = await booksRepository.findAll({ populate: ['author'], orderBy: { title: 'asc' } });
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

    const lastBook = await booksRepository.find(
      { author: jon.id },
      {
        populate: ['author'],
        orderBy: { title: QueryOrder.DESC },
        limit: 2,
        offset: 2,
      },
    );
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
    bible.meta = {
      category: 'god like',
      items: 3,
      valid: true,
      nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } },
    };
    await orm.em.persist(bible).flush();
    orm.em.clear();

    const g = await orm.em.findOneOrFail(Author2, god.id, { populate: ['books'] });
    expect(Array.isArray(g.identities)).toBe(true);
    expect(g.identities).toEqual(['fb-123', 'pw-231', 'tw-321']);
    expect(typeof g.books[0].meta).toBe('object');
    expect(g.books[0].meta).toEqual({
      category: 'god like',
      items: 3,
      valid: true,
      nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } },
    });
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(Book2, { meta: { category: 'god like' } });
    const b2 = await orm.em.findOneOrFail(Book2, { meta: { category: { $in: ['god like'] }, items: 3 } }); // supports operators (GH #1487)
    const b3 = await orm.em.findOneOrFail(Book2, { meta: { nested: { bar: 321 } } });
    const b4 = await orm.em.findOneOrFail(Book2, { meta: { nested: { foo: '123', bar: 321 } } });
    const b5 = await orm.em.findOneOrFail(Book2, { meta: { valid: true, nested: { foo: '123', bar: 321 } } });
    const b6 = await orm.em.findOneOrFail(Book2, {
      meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59 } } },
    });
    const b7 = await orm.em.findOneOrFail(Book2, {
      meta: { valid: true, nested: { foo: '123', bar: 321, deep: { baz: 59, qux: false } } },
    });
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
      {
        uuid: '123e4567-e89b-12d3-a456-426614174001',
        title: 't1',
        author: 1,
        meta: { nested: { foo: '3', deep: { str: 'c', qux: false, baz: 3 } } },
      },
      {
        uuid: '123e4567-e89b-12d3-a456-426614174002',
        title: 't2',
        author: 1,
        meta: { nested: { foo: '2', deep: { str: 'b', qux: false, baz: 1 } } },
      },
      {
        uuid: '123e4567-e89b-12d3-a456-426614174003',
        title: 't3',
        author: 1,
        meta: { nested: { foo: '1', deep: { str: 'a', qux: false, baz: 2 } } },
      },
    ]);

    const res14 = await orm.em.fork().findAll(Book2, { orderBy: { meta: { nested: { foo: 'asc' } } } });
    expect(res14.map(r => r.title)).toEqual(['t3', 't2', 't1']);

    const res15 = await orm.em.fork().findAll(Book2, { orderBy: { meta: { nested: { deep: { str: 'asc' } } } } });
    expect(res15.map(r => r.title)).toEqual(['t3', 't2', 't1']);

    const res16 = await orm.em
      .fork()
      .findAll(Book2, { orderBy: { meta: { nested: { deep: { baz: QueryOrder.DESC } } } } });
    expect(res16.map(r => r.title)).toEqual(['t1', 't3', 't2']);
  });

  test('properties with spaces in column names', async () => {
    const bar = new FooBar2();
    bar.name = 'n';
    bar.nameWithSpace = '123';
    await orm.em.fork().persist(bar).flush();

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
    await orm.em.persist([fb1, fb2, fz1, fz2]).flush();

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
    await orm.em.fork().persist(bar).flush();

    const mock = mockLogger(orm, ['query', 'query-params']);
    const em = orm.em.fork({ loggerContext: { label: 'foo', bar: 1 } });
    em.setLoggerContext({ label: 'foo', bar: 123 });
    expect(em.getLoggerContext()).toEqual({ label: 'foo', bar: 123 });
    const logSpy = vi.spyOn(DefaultLogger.prototype, 'log');
    const b0 = await em.findOneOrFail(FooBar2, bar, {
      logging: { label: 'foo 123' },
      loggerContext: { bar: 456, new: true },
    });
    expect(b0.objectProperty).toEqual({ myPropName: { nestedProperty: 123, somethingElse: null } });

    const b1 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { nestedProperty: { $in: [123] } } } });
    const b2 = await em.findOneOrFail(FooBar2, { objectProperty: { myPropName: { somethingElse: null } } });
    const b3 = await em.findOneOrFail(FooBar2, {
      objectProperty: { myPropName: { nestedProperty: [123], somethingElse: null } },
    });
    const b4 = await em.findOneOrFail(FooBar2, {
      objectProperty: { myPropName: { nestedProperty: 123, somethingElse: null } },
    });
    expect(b0).toBe(b1);
    expect(b0).toBe(b2);
    expect(b0).toBe(b3);
    expect(b0).toBe(b4);

    expect(mock.mock.calls).toHaveLength(5);
    expect(logSpy.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "f0".*, (select 123) as "random" from "foo_bar2" "f0" where "f0"."id" = 1 fetch next 1 rows`,
    );
    expect(mock.mock.calls[0][0]).toMatch('(foo 123)');
    expect(logSpy.mock.calls[0][2]).toMatchObject({ id: em.id, label: 'foo 123', bar: 456, new: true });
    expect(mock.mock.calls[1][0]).toMatch(
      `select "f0".*, (select 123) as "random" from "foo_bar2" "f0" where json_value("f0"."object_property", '$.myPropName.nestedProperty') in (123) fetch next 1 rows`,
    );
    expect(mock.mock.calls[1][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[1][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[2][0]).toMatch(
      `select "f0".*, (select 123) as "random" from "foo_bar2" "f0" where json_value("f0"."object_property", '$.myPropName.somethingElse') is null fetch next 1 rows`,
    );
    expect(mock.mock.calls[2][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[2][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[3][0]).toMatch(
      `select "f0".*, (select 123) as "random" from "foo_bar2" "f0" where json_value("f0"."object_property", '$.myPropName.nestedProperty') in (123) and json_value("f0"."object_property", '$.myPropName.somethingElse') is null fetch next 1 rows`,
    );
    expect(mock.mock.calls[3][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[3][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
    expect(mock.mock.calls[4][0]).toMatch(
      `select "f0".*, (select 123) as "random" from "foo_bar2" "f0" where json_value("f0"."object_property", '$.myPropName.nestedProperty') = 123 and json_value("f0"."object_property", '$.myPropName.somethingElse') is null fetch next 1 rows`,
    );
    expect(mock.mock.calls[4][0]).toMatch('(foo)');
    expect(logSpy.mock.calls[4][2]).toMatchObject({ id: em.id, label: 'foo', bar: 123 });
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persist(bible).flush();
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
    await orm.em.persist([author1, author2, author3]).flush();
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
      await orm.em.persist(test).flush();
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testStandardFailureThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persist(test).flush();
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
    await orm.em.persist(test).flush();
    orm.em.clear();

    const proxy = orm.em.getReference(Test2, test.id);
    await orm.em.lock(proxy, LockMode.OPTIMISTIC, 1);
    expect(wrap(proxy).isInitialized()).toBe(true);
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persist(test).flush();
    orm.em.clear();

    const test2 = await orm.em.findOne(Test2, test.id);
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [testOptimisticTimestampLockFailureThrowsException]', async () => {
    const bar = FooBar2.create('Testing');
    expect(bar.version).toBeUndefined();
    await orm.em.persist(bar).flush();
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
    await orm.em.persist(author).flush();
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrow(
      'Cannot obtain optimistic lock on unversioned entity Author2',
    );
  });

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persist(test).flush();
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [version mismatch]', async () => {
    const test = new Test2();
    test.name = 'test';
    await orm.em.persist(test).flush();
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrow(
      'The optimistic lock failed, version 2 was expected, but is actually 1',
    );
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test2();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrow(
      'Entity Test2 is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()',
    );
  });

  test('batch updates increments version field (optimistic locking)', async () => {
    const tests = [new Test2({ name: 't1' }), new Test2({ name: 't2' }), new Test2({ name: 't3' })];
    await orm.em.persist(tests).flush();
    expect(tests.map(t => t.version)).toEqual([1, 1, 1]);
    tests.forEach(t => (t.name += ' changed!'));
    await orm.em.flush();
    expect(tests.map(t => t.version)).toEqual([2, 2, 2]);
  });

  test('pessimistic locking requires active transaction', async () => {
    const test = Test2.create('Lock test');
    await orm.em.persist(test).flush();
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_READ })).rejects.toThrow(
      'An open transaction is required for this operation',
    );
    await expect(orm.em.findOne(Test2, test.id, { lockMode: LockMode.PESSIMISTIC_WRITE })).rejects.toThrow(
      'An open transaction is required for this operation',
    );
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_READ)).rejects.toThrow(
      'An open transaction is required for this operation',
    );
    await expect(orm.em.lock(test, LockMode.PESSIMISTIC_WRITE)).rejects.toThrow(
      'An open transaction is required for this operation',
    );
  });

  test('findOne supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persist(author).flush();

    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_WRITE);
    });

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" "a0" where "a0"."id" = ? for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persist(author).flush();

    const mock = mockLogger(orm, ['query']);

    mock.mock.calls.length = 0;
    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE);
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" "a0" where "a0"."id" = ? for update skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;
    await orm.em.transactional(async em => {
      await em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE, { lockTableAliases: ['a0'] });
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'select 1 from "author2" "a0" where "a0"."id" = ? for update of "a0"."id" skip locked',
    );
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
    expect(mock.mock.calls[1][0]).toMatch(
      'select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed", "a1"."id" "a1__id", "a1"."created_at" "a1__created_at", "a1"."updated_at" "a1__updated_at", "a1"."name" "a1__name", "a1"."email" "a1__email", "a1"."age" "a1__age", "a1"."terms_accepted" "a1__terms_accepted", "a1"."optional" "a1__optional", "a1"."identities" "a1__identities", "a1"."born" "a1__born", "a1"."born_time" "a1__born_time", "a1"."favourite_book_uuid_pk" "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" "a1__favourite_author_id", "a1"."identity" as "a1__identity", "f2"."uuid_pk" "f2__uuid_pk" from "book2" "b0" inner join "author2" "a1" on "b0"."author_id" = "a1"."id" left join "book2" "f2" on "a1"."favourite_book_uuid_pk" = "f2"."uuid_pk" and "f2"."author_id" is not null where "b0"."author_id" is not null for update of "b0"."uuid_pk" skip locked',
    );
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
    expect(mock.mock.calls[1][0]).toMatch(
      `select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0"."price" * 1.19 as "price_taxed" from "book2" "b0" where "b0"."author_id" is not null for update skip locked`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `select "a0".*, "f1"."uuid_pk" "f1__uuid_pk" from "author2" "a0" left join "book2" "f1" on "a0"."favourite_book_uuid_pk" = "f1"."uuid_pk" and "f1"."author_id" is not null where "a0"."id" in (?) and "a0"."id" is not null for update of "a0"."id" skip locked`,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `select "b0"."order", "b0"."book_tag2_id", "b0"."book2_uuid_pk", "b1"."id" "b1__id", "b1"."name" "b1__name" from "book2_tags" "b0" inner join "book_tag2" "b1" on "b0"."book_tag2_id" = "b1"."id" where "b0"."book2_uuid_pk" in (?, ?, ?) order by "b0"."order" asc for update skip locked`,
    );
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('stable results of serialization', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]).flush();
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
    await orm.em.persist(pub).flush();
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(pub).toReference();
    const bible2 = new Book2('Bible pt. 2', god);
    bible2.publisher = wrap(pub).toReference();
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    bible3.publisher = wrap(pub).toReference();
    await orm.em.persist([bible, bible2, bible3]).flush();
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
    await orm.em.fork().persist(god).flush();

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
    await orm.em.persist(jon).flush();

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
    await orm.em.persist(bible).flush();

    let jon = new Author2('Jon Snow', 'snow@wall.st');
    jon.born = '1990-03-23';
    jon.favouriteBook = bible;
    await orm.em.persist(jon).flush();
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
    await orm.em.persist(bible).flush();
    orm.em.clear();

    const b = await orm.em.findOneOrFail(Book2, bible.uuid, { populate: ['author'] });
    expect(wrap(b.author, true).__originalEntityData).toMatchObject({ name: 'God', email: 'hello@heaven.god' });
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persist(bar).flush();
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
    await orm.em.persist(bar).flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // autoJoinOneToOneOwner: false
    const b0 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id });
    expect(mock.mock.calls[0][0]).toMatch('select "f0".* from "foo_baz2" "f0" where "f0"."id" = ? fetch next ? rows');
    expect(b0.bar).toBeUndefined();
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id }, { populate: ['bar'] });
    expect(mock.mock.calls[1][0]).toMatch(
      'select "f0".*, "b1"."id" "b1__id", "b1"."name" "b1__name", "b1"."name with space" "b1__name with space", "b1"."baz_id" "b1__baz_id", "b1"."foo_bar_id" "b1__foo_bar_id", "b1"."version" "b1__version", "b1"."blob" "b1__blob", "b1"."blob2" "b1__blob2", "b1"."array" "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random" from "foo_baz2" "f0" left join "foo_bar2" "b1" on "f0"."id" = "b1"."baz_id" where "f0"."id" = ? fetch next ? rows',
    );
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, { populate: ['bar'] });
    expect(mock.mock.calls[2][0]).toMatch(
      'select "f0".*, "b1"."id" "b1__id", "b1"."name" "b1__name", "b1"."name with space" "b1__name with space", "b1"."baz_id" "b1__baz_id", "b1"."foo_bar_id" "b1__foo_bar_id", "b1"."version" "b1__version", "b1"."blob" "b1__blob", "b1"."blob2" "b1__blob2", "b1"."array" "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random" from "foo_baz2" "f0" left join "foo_bar2" "b1" on "f0"."id" = "b1"."baz_id" where "b1"."id" = ? fetch next ? rows only',
    );
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
    await orm.em.persist(test).flush();
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
    await orm.em.persist([bar1, bar3]).flush();
    bar1.fooBar = undefined;
    bar3.fooBar = bar2;

    const mock = mockLogger(orm, ['query']);

    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(
      'update "foo_bar2" set "foo_bar_id" = ?, "version" = ? where "id" = ? and "version" = ? returning "version"',
    );
    expect(mock.mock.calls[2][0]).toMatch(
      'update "foo_bar2" set "foo_bar_id" = ?, "version" = ? where "id" = ? and "version" = ? returning "version"',
    );
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
    await orm.em.persist(book3).flush();

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
    expect(() => tags[0].books.remove(book1, book2)).toThrow(
      /Collection<Book2> of entity BookTag2\[\d+] not initialized/,
    );
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
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    book.tags.add(new BookTag2('fresh'));
    await orm.em.persist(book).flush();
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
    expect(book.tags.find(tag => tag === tagRepository.getReference(tag1.id))).toEqual(
      tagRepository.getReference(tag1.id),
    );
    expect(book.tags.find(() => false)).toBeUndefined();

    // filter
    expect(book.tags.filter(tag => tag === tagRepository.getReference(tag1.id))).toEqual([
      tagRepository.getReference(tag1.id),
    ]);
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
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(0);
    expect(book.tags.isEmpty()).toBe(true);
  });
});
