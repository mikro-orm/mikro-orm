import { v4 } from 'uuid';
import { Collection, Configuration, EntityManager, MikroORM, QueryOrder, Utils } from '../lib';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, Test2 } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { Logger } from '../lib/utils';
import { MySqlConnection } from '../lib/connections/MySqlConnection';

/**
 * @class EntityManagerMySqlTest
 */
describe('EntityManagerMySql', () => {

  jest.setTimeout(10000);
  let orm: MikroORM;

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
    } as any, false);
    const driver = new MySqlDriver(config);
    expect(driver.getConnection().getConnectionOptions()).toEqual({
      database: 'db_name',
      host: '127.0.0.10',
      password: 'secret',
      port: 3308,
      user: 'user',
    });
  });

  test('should return mysql driver', async () => {
    const driver = orm.em.getDriver<MySqlDriver>();
    expect(driver instanceof MySqlDriver).toBe(true);
    await expect(driver.findOne(Book2.name, { foo: 'bar' })).resolves.toBeNull();
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name '});
    expect((await driver.nativeInsert(Book2.name, { uuid: v4(), tags: [tag.insertId] })).insertId).not.toBeNull();
    const res = await driver.getConnection().execute('SELECT 1 as count');
    expect(res[0]).toEqual({ count: 1 });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find(BookTag2.name, { books: { $in: [1] } })).resolves.not.toBeNull();
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver<MySqlDriver>();
    const err1 = `Table 'mikro_orm_test.not_existing' doesn't exist\n in query: INSERT INTO \`not_existing\` (\`foo\`) VALUES (?)\n with params: ["bar"]`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = `Table 'mikro_orm_test.not_existing' doesn't exist\n in query: DELETE FROM \`not_existing\``;
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
    await repo.persist(author);
    const a = await repo.findOne(author);
    const authors = await repo.find({ id: author });
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

  test('should work with boolean values', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('name', 'email');
    await repo.persist(author);
    expect(author.termsAccepted).toBe(false);
    author.termsAccepted = true;
    await repo.persist(author);
    expect(author.termsAccepted).toBe(true);
    orm.em.clear();

    const a1 = await repo.findOne({ termsAccepted: false });
    expect(a1).toBeNull();
    const a2 = (await repo.findOne({ termsAccepted: true }))!;
    expect(a2).not.toBeNull();
    a2.termsAccepted = false;
    await repo.persist(a2);
    orm.em.clear();

    const a3 = (await repo.findOne({ termsAccepted: false }))!;
    expect(a3).not.toBeNull();
    expect(a3.termsAccepted).toBe(false);
    const a4 = await repo.findOne({ termsAccepted: true });
    expect(a4).toBeNull();
  });

  test('transactions', async () => {
    const god1 = new Author2('God1', 'hello@heaven1.god');
    await orm.em.beginTransaction();
    await orm.em.persist(god1);
    await orm.em.rollback();
    const res1 = await orm.em.findOne(Author2, { name: 'God1' });
    expect(res1).toBeNull();

    await orm.em.beginTransaction();
    const god2 = new Author2('God2', 'hello@heaven2.god');
    await orm.em.persist(god2);
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

  test('nested transactions', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.getConnection(), { logger });

    // start outer transaction
    const transaction = orm.em.transactional(async em => {
      // do stuff inside inner transaction
      await em.transactional(async em2 => {
        await em2.persist(new Author2('God', 'hello@heaven.god'), false);
      });
    });

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('[query-logger] START TRANSACTION');
    expect(mock.mock.calls[2][0]).toMatch('[query-logger] COMMIT');
  });

  test('nested transaction rollback will rollback the outer one as well', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.getConnection(), { logger });

    // start outer transaction
    const transaction = orm.em.transactional(async em => {
      // do stuff inside inner transaction and rollback
      await em.beginTransaction();
      await em.persist(new Author2('God', 'hello@heaven.god'), false);
      await em.rollback();
    });

    // try to commit the outer transaction
    await expect(transaction).rejects.toThrowError('Transaction commit failed because the transaction has been marked for rollback only');
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('[query-logger] START TRANSACTION');
    expect(mock.mock.calls[2][0]).toMatch('[query-logger] ROLLBACK');
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persist(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    // as we order by Book.createdAt when populating collection, we need to make sure values will be sequential
    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.createdAt = new Date(Date.now() + 1);
    book1.publisher = publisher;
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = publisher;
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.createdAt = new Date(Date.now() + 3);
    book3.publisher = publisher;

    const repo = orm.em.getRepository(Book2);
    await repo.persist(book1, false);
    await repo.persist(book2, false);
    await repo.persist(book3, false);
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
    expect(books[0].author.isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible.uuid })).not.toBe(null);
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
      born: jon.born,
      email: 'snow@wall.st',
      name: 'Jon Snow',
    });
    expect(jon.toJSON()).toEqual(o);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('string');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);

        expect(book.author).toBeInstanceOf(Author2);
        expect(book.author.isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Publisher2);
        expect(book.publisher.isInitialized()).toBe(false);
      }
    }

    const booksByTitleAsc = await booksRepository.find({ author: jon.id }, [], { title: 1 });
    expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
    expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

    const booksByTitleDesc = await booksRepository.find({ author: jon.id }, [], { title: -1 });
    expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
    expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

    const twoBooks = await booksRepository.find({ author: jon.id }, [], { title: -1 }, 2);
    expect(twoBooks.length).toBe(2);
    expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
    expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

    const lastBook = await booksRepository.find({ author: jon.id }, ['author'], { title: -1 }, 2, 2);
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author2);
    expect(lastBook[0].author.isInitialized()).toBe(true);
    await orm.em.getRepository(Book2).remove(lastBook[0].uuid);
  });

  test('json properties', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    god.identities = ['fb-123', 'pw-231', 'tw-321'];
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'god like', items: 3 };
    await orm.em.persist(bible);
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
    await orm.em.persist(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author2, god.id);
    expect(ref.isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author2, god.id);
    expect(ref).toBe(newGod);
    expect(ref.isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    const author1 = new Author2('Author 1', 'a1@example.com');
    const author2 = new Author2('Author 2', 'a2@example.com');
    const author3 = new Author2('Author 3', 'a3@example.com');
    await orm.em.persist([author1, author2, author3]);
    orm.em.clear();

    const authors = await orm.em.find(Author2, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
  });

  test('custom query expressions via query builder', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.meta = { category: 'foo', items: 1 };
    await orm.em.persist(bible);
    orm.em.clear();

    const qb1 = orm.em.createQueryBuilder(Book2);
    const res1 = await qb1.select('*').where({ 'JSON_CONTAINS(`e0`.`meta`, ?)': [{ foo: 'bar' }, false] }).execute('get');
    expect(res1['createdAt']).toBeDefined();
    expect(res1['created_at']).not.toBeDefined();
    expect(res1.meta).toEqual({ category: 'foo', items: 1 });

    const qb2 = orm.em.createQueryBuilder(Book2);
    const res2 = await qb2.select('*').where({ 'JSON_CONTAINS(meta, ?)': [{ category: 'foo' }, true] }).execute('get', false);
    expect(res2['createdAt']).not.toBeDefined();
    expect(res2['created_at']).toBeDefined();
    expect(res2.meta).toEqual({ category: 'foo', items: 1 });

    const res3 = (await orm.em.findOne(Book2, { 'JSON_CONTAINS(meta, ?)': [{ items: 1 }, true] }))!;
    expect(res3).toBeInstanceOf(Book2);
    expect(res3.createdAt).toBeDefined();
    expect(res3.meta).toEqual({ category: 'foo', items: 1 });
  });

  test('stable results of serialization', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = (await orm.em.findOne(Author2, god.id))!;
    const books = await orm.em.find(Book2, {});
    await newGod.init(false);

    for (const book of books) {
      expect(book.toJSON()).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = new Publisher2('Publisher2');
    await orm.em.persist(pub);
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = pub;
    const bible2 = new Book2('Bible pt. 2', god);
    bible2.publisher = pub;
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    bible3.publisher = pub;
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = orm.em.getReference(Author2, god.id);
    const publisher = (await orm.em.findOne(Publisher2, pub.id, ['books']))!;
    await newGod.init();

    const json = publisher.toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: Book2) => b.uuid === book.uuid)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository(Author2);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    await authorRepository.persist(jon);

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
    await orm.em.persist(bible);

    let jon = new Author2('Jon Snow', 'snow@wall.st');
    jon.born = new Date();
    jon.favouriteBook = bible;
    await orm.em.persist(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(jon.favouriteBook.isInitialized()).toBe(false);

    await jon.favouriteBook.init();
    expect(jon.favouriteBook).toBeInstanceOf(Book2);
    expect(jon.favouriteBook.isInitialized()).toBe(true);
    expect(jon.favouriteBook.title).toBe('Bible');
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persist(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }, ['baz']))!;
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz.id).toBe(baz.id);
    expect(b1.toJSON()).toMatchObject({ baz: baz.toJSON() });
  });

  test('populate OneToOne relation on inverse side', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persist(bar);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.getConnection(), { logger });

    const b1 = (await orm.em.findOne(FooBaz2, { id: baz.id }, ['bar']))!;
    expect(mock.mock.calls[0][0]).toMatch('SELECT `e0`.*, `e1`.`id` AS `bar_id` FROM `foo_baz2` AS `e0` LEFT JOIN `foo_bar2` AS `e1` ON `e0`.`id` = `e1`.`baz_id` WHERE `e0`.`id` = ? LIMIT ?');
    expect(mock.mock.calls[1][0]).toMatch('SELECT `e0`.* FROM `foo_bar2` AS `e0` WHERE `e0`.`id` IN (?) ORDER BY `e0`.`id` ASC');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar.id).toBe(bar.id);
    expect(b1.toJSON()).toMatchObject({ bar: bar.toJSON() });
    orm.em.clear();

    const b2 = (await orm.em.findOne(FooBaz2, { bar: bar.id }, ['bar']))!;
    expect(mock.mock.calls[2][0]).toMatch('SELECT `e0`.*, `e1`.`id` AS `bar_id` FROM `foo_baz2` AS `e0` LEFT JOIN `foo_bar2` AS `e1` ON `e0`.`id` = `e1`.`baz_id` WHERE `e1`.`id` = ? LIMIT ?');
    expect(mock.mock.calls[3][0]).toMatch('SELECT `e0`.* FROM `foo_bar2` AS `e0` WHERE `e0`.`id` IN (?) ORDER BY `e0`.`id` ASC');
    expect(b2.bar).toBeInstanceOf(FooBar2);
    expect(b2.bar.id).toBe(bar.id);
    expect(b2.toJSON()).toMatchObject({ bar: bar.toJSON() });
  });

  test('populate OneToOne relation with uuid PK', async () => {
    const author = new Author2('name', 'email');
    const book = new Book2('b1', author);
    const test = Test2.create('t');
    test.book = book;
    await orm.em.persist(test);
    orm.em.clear();

    const b1 = (await orm.em.findOne(Book2, { test: test.id }, ['test']))!;
    expect(b1.id).not.toBeNull();
    expect(b1.toJSON()).toMatchObject({ test: test.toJSON() });
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

    await orm.em.persist(book1, false);
    await orm.em.persist(book2, false);
    await orm.em.persist(book3);

    expect(tag1.id).toBeDefined();
    expect(tag2.id).toBeDefined();
    expect(tag3.id).toBeDefined();
    expect(tag4.id).toBeDefined();
    expect(tag5.id).toBeDefined();

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
    tags = await orm.em.find(BookTag2);
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection Book2\[] of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.add(book1)).toThrowError(/Collection Book2\[] of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection Book2\[] of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection Book2\[] of entity BookTag2\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection Book2\[] of entity BookTag2\[\d+] not initialized/);

    // test M:N lazy init
    orm.em.clear();
    tags = await tagRepository.findAll();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0]).toBeInstanceOf(Book2);
    expect(tags[0].books.getItems()[0].uuid).toBeDefined();
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);
    expect(tags[0].books.isInitialized()).toBe(true);
    const old = tags[0];
    expect(tags[1].books.isInitialized()).toBe(false);
    tags = await tagRepository.findAll(['books']);
    expect(tags[1].books.isInitialized()).toBe(true);
    expect(tags[0].id).toBe(old.id);
    expect(tags[0]).toBe(old);
    expect(tags[0].books).toBe(old.books);

    // test M:N lazy init
    orm.em.clear();
    let book = (await orm.em.findOne(Book2, book1.uuid))!;
    expect(book.tags.isInitialized()).toBe(false);
    await book.tags.init();
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag2);
    expect(book.tags.getItems()[0].id).toBeDefined();
    expect(book.tags.getItems()[0].isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tag1);
    await orm.em.persist(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, ['tags']))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    book.tags.add(new BookTag2('fresh'));
    await orm.em.persist(book);
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
    await orm.em.persist(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book2, book.uuid, ['tags']))!;
    expect(book.tags.count()).toBe(0);
  });

  test('populating many to many relation', async () => {
    const p1 = new Publisher2('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Publisher2('bar');
    p2.tests.add(new Test2(), new Test2());
    await orm.em.persist([p1, p2]);
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
    expect(publishers[1].tests.getItems()[0].isInitialized()).toBe(true);
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
    await orm.em.persist([book1, book2, book3]);
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
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);
  });

  test('nested populating', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);

    // as we order by Book.createdAt when populating collection, we need to make sure values will be sequential
    book1.createdAt = new Date(Date.now() + 1);
    book1.publisher = new Publisher2('B1 publisher');
    book1.publisher.tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = new Publisher2('B2 publisher');
    book2.publisher.tests.add(Test2.create('t21'), Test2.create('t22'));
    book3.createdAt = new Date(Date.now() + 3);
    book3.publisher = new Publisher2('B3 publisher');
    book3.publisher.tests.add(Test2.create('t31'), Test2.create('t32'));

    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag2);

    orm.em.clear();
    const tags = await repo.findAll(['books.publisher.tests', 'books.author']);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag2);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books[0].isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author2);
    expect(tags[0].books[0].author.isInitialized()).toBe(true);
    expect(tags[0].books[0].author.name).toBe('Jon Snow');
    expect(tags[0].books[0].publisher).toBeInstanceOf(Publisher2);
    expect(tags[0].books[0].publisher.isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher.tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher.tests.count()).toBe(2);
    expect(tags[0].books[0].publisher.tests[0].name).toBe('t11');
    expect(tags[0].books[0].publisher.tests[1].name).toBe('t12');

    orm.em.clear();
    const books = await orm.em.find(Book2, {}, ['publisher.tests', 'author'], { createdAt: QueryOrder.ASC });
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book2);
    expect(books[0].isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author2);
    expect(books[0].author.isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Publisher2);
    expect(books[0].publisher.isInitialized()).toBe(true);
    expect(books[0].publisher.tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher.tests.count()).toBe(2);
    expect(books[0].publisher.tests[0].name).toBe('t11');
    expect(books[0].publisher.tests[1].name).toBe('t12');
  });

  test('hooks', async () => {
    Author2.beforeDestroyCalled = 0;
    Author2.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Jon Snow', 'snow@wall.st');
    expect(author.id).toBeUndefined();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();

    await repo.persist(author);
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await repo.persist(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author2.beforeDestroyCalled).toBe(0);
    expect(Author2.afterDestroyCalled).toBe(0);
    await repo.remove(author);
    expect(Author2.beforeDestroyCalled).toBe(1);
    expect(Author2.afterDestroyCalled).toBe(1);

    const author2 = new Author2('Johny Cash', 'johny@cash.com');
    await repo.persist(author2);
    await repo.remove(author2);
    expect(Author2.beforeDestroyCalled).toBe(2);
    expect(Author2.afterDestroyCalled).toBe(2);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author2);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await repo.persist(author);
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
    await orm.em.persist([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await repo.persist(publisher);
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
    await repo.persist(author);

    author.name = 'name1';
    await repo.persist(author);
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

    const res6 = await orm.em.nativeUpdate('author2', { name: 'new native name' }, { name: 'native name 3' });
    expect(res6).toBe(1);

    const res7 = await orm.em.nativeDelete('author2', res4);
    expect(res7).toBe(1);

    await expect(orm.em.aggregate(Author2, [])).rejects.toThrowError('Aggregations are not supported by MySqlDriver driver');
  });

  test('Utils.prepareEntity changes entity to number id', async () => {
    const author1 = new Author2('Name 1', 'e-mail1');
    const book = new Book2('test', author1);
    const author2 = new Author2('Name 2', 'e-mail2');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persist([author1, author2, book]);
    const diff = Utils.diffEntities(author1, author2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book.uuid });
    expect(typeof diff.favouriteBook).toBe('string');
    expect(diff.favouriteBook).toBe(book.uuid);
  });

  test('self referencing (2 step)', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]);
    author.favouriteAuthor = author;
    await orm.em.persist(author);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(a1.toJSON()).toMatchObject({ favouriteAuthor: a1.id });
  });

  test('self referencing (1 step)', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.getConnection(), { logger });

    const author = new Author2('name', 'email');
    author.favouriteAuthor = author;
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    await orm.em.persist([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(a1.toJSON()).toMatchObject({ favouriteAuthor: a1.id });

    // check fired queries
    expect(mock.mock.calls.length).toBe(8);
    expect(mock.mock.calls[0][0]).toMatch('START TRANSACTION');
    expect(mock.mock.calls[1][0]).toMatch('INSERT INTO `author2` (`name`, `email`, `created_at`, `updated_at`, `terms_accepted`) VALUES (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('INSERT INTO `book2` (`title`, `uuid_pk`, `created_at`, `author_id`) VALUES (?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('INSERT INTO `book2` (`title`, `uuid_pk`, `created_at`, `author_id`) VALUES (?, ?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('INSERT INTO `book2` (`title`, `uuid_pk`, `created_at`, `author_id`) VALUES (?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('UPDATE `author2` SET `favourite_author_id` = ?, `updated_at` = ? WHERE `id` = ?');
    expect(mock.mock.calls[6][0]).toMatch('COMMIT');
    expect(mock.mock.calls[7][0]).toMatch('SELECT `e0`.* FROM `author2` AS `e0` WHERE `e0`.`id` = ?');
  });

  test('self referencing 1:1 (1 step)', async () => {
    const bar = FooBar2.create('bar');
    bar.fooBar = bar;
    await orm.em.persist(bar);
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBar2, { id: bar.id }))!;
    expect(b1).toBe(b1.fooBar);
    expect(b1.id).not.toBeNull();
    expect(b1.toJSON()).toMatchObject({ fooBar: b1.id });
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
    await orm.em.persist([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author2, { 'id:ne': 10 }))!;
    expect(a1).not.toBeNull();
    expect(a1.id).toBe(author.id);
    const a2 = (await orm.em.findOne(Author2, { 'id>=': 1 }))!;
    expect(a2).not.toBeNull();
    expect(a2.id).toBe(author.id);
    const a3 = (await orm.em.findOne(Author2, { 'id:nin': [2, 3, 4] }))!;
    expect(a3).not.toBeNull();
    expect(a3.id).toBe(author.id);
    const a4 = (await orm.em.findOne(Author2, { 'id:in': [] }))!;
    expect(a4).toBeNull();
    const a5 = (await orm.em.findOne(Author2, { 'id:nin': [] }))!;
    expect(a5).not.toBeNull();
    expect(a5.id).toBe(author.id);
    const a6 = (await orm.em.findOne(Author2, { $and: [{ 'id:nin': [] }, { email: 'email' }] }))!;
    expect(a6).not.toBeNull();
    expect(a6.id).toBe(author.id);
  });

  test('lookup by array', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    author.books.add(book1, book2, book3);
    await orm.em.persist(author);
    await expect(orm.em.count(Book2, [book1, book2, book3])).resolves.toBe(3);
    await expect(orm.em.count(Book2, [book1.uuid, book2.uuid, book3.uuid])).resolves.toBe(3);
  });

  afterAll(async () => orm.close(true));

});
