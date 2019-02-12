import { Collection, EntityManager, MikroORM, MikroORMOptions } from '../lib';
import { Author2, Book2, BookTag2, Publisher2, PublisherType, Test2 } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Utils } from '../lib/utils/Utils';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { Logger } from '../lib/utils/Logger';

/**
 * @class EntityManagerMySqlTest
 */
describe('EntityManagerMySql', () => {

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
    const driver = new MySqlDriver({
      clientUrl: 'mysql://root@127.0.0.1:3308/db_name',
      host: '127.0.0.10',
      password: 'secret',
      user: 'user',
    } as MikroORMOptions, new Logger({ logger: jest.fn() } as any));
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
    expect(await driver.findOne(Book2.name, { foo: 'bar' })).toBeNull();
    expect(await driver.nativeInsert(BookTag2.name, { books: [1] })).not.toBeNull();
    const res = await driver.getConnection().execute('SELECT 1 as count');
    expect(res[0][0]).toEqual({ count: 1 });
    expect(driver.denormalizePrimaryKey(1)).toBe(1);
    expect(driver.denormalizePrimaryKey('1')).toBe('1');
    expect(await driver.find(BookTag2.name, { books: [1] })).not.toBeNull();
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver<MySqlDriver>();
    const err1 = `Table 'mikro_orm_test.not_existing' doesn't exist\n in query: INSERT INTO \`not_existing\` (\`foo\`) VALUES (?)\n with params: ["bar"]`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = `Table 'mikro_orm_test.not_existing' doesn't exist\n in query: DELETE FROM \`not_existing\``;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('should throw when trying to search by entity instead of identifier', async () => {
    const repo = orm.em.getRepository<Author2>(Author2.name);
    const author = new Author2('name', 'email');
    await repo.persist(author);
    await expect(repo.find(author)).rejects.toThrowError('Author2 entity provided in search condition. Please provide identifier instead.');
    await expect(repo.find({ author })).rejects.toThrowError(`Author2 entity provided in search condition in field 'author'. Please provide identifier instead.`);
    expect(await repo.findOne({ termsAccepted: false })).toBeNull();
  });

  test('transactions', async () => {
    const god1 = new Author2('God1', 'hello@heaven.god');
    await orm.em.beginTransaction();
    await orm.em.persist(god1);
    await orm.em.rollback();
    const res1 = await orm.em.findOne(Author2.name, { name: 'God1' });
    expect(res1).toBeNull();

    await orm.em.beginTransaction();
    const god2 = new Author2('God2', 'hello@heaven.god');
    await orm.em.persist(god2);
    await orm.em.commit();
    const res2 = await orm.em.findOne(Author2.name, { name: 'God2' });
    expect(res2).not.toBeNull();

    await orm.em.transactional(async em => {
      const god3 = new Author2('God3', 'hello@heaven.god');
      await em.persist(god3);
    });
    const res3 = await orm.em.findOne(Author2.name, { name: 'God3' });
    expect(res3).not.toBeNull();

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god4 = new Author2('God4', 'hello@heaven.god');
        await em.persist(god4);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res4 = await orm.em.findOne(Author2.name, { name: 'God4' });
      expect(res4).toBeNull();
    }
  });

  test('nested transactions', async () => {
    const mock = jest.fn();
    const logger = new Logger({ logger: mock, debug: true } as any);
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
    expect(mock.mock.calls[0][0]).toBe('[query-logger] START TRANSACTION');
    expect(mock.mock.calls[2][0]).toBe('[query-logger] COMMIT');
  });

  test('nested transaction rollback will rollback the outer one as well', async () => {
    const mock = jest.fn();
    const logger = new Logger({ logger: mock, debug: true } as any);
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
    expect(mock.mock.calls[0][0]).toBe('[query-logger] START TRANSACTION');
    expect(mock.mock.calls[2][0]).toBe('[query-logger] ROLLBACK');
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

    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.publisher = publisher;
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.publisher = publisher;
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.publisher = publisher;

    const repo = orm.em.getRepository<Book2>(Book2.name);
    await repo.persist(book1, false);
    await repo.persist(book2, false);
    await repo.persist(book3, false);
    await repo.flush();
    orm.em.clear();

    const publisher7k = (await orm.em.getRepository<Publisher2>(Publisher2.name).findOne({ name: '7K publisher' }))!;
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(false);
    orm.em.clear();

    const authorRepository = orm.em.getRepository<Author2>(Author2.name);
    const booksRepository = orm.em.getRepository<Book2>(Book2.name);
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
      born: jon.born,
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
    await orm.em.getRepository<Book2>(Book2.name).remove(lastBook[0].id);
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persist(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author2.name, god.id);
    expect(ref.isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author2.name, god.id);
    expect(ref).toBe(newGod);
    expect(ref.isInitialized()).toBe(true);
  });

  test('stable results of serialization', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = (await orm.em.findOne<Author2>(Author2.name, god.id))!;
    const books = await orm.em.find<Book2>(Book2.name, {});
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

    const newGod = orm.em.getReference<Author2>(Author2.name, god.id);
    const publisher = (await orm.em.findOne<Publisher2>(Publisher2.name, pub.id, ['books']))!;
    await newGod.init();

    const json = publisher.toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: Book2) => b.id === book.id)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository<Author2>(Author2.name);
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
    const authorRepository = orm.em.getRepository<Author2>(Author2.name);
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
    const tagRepository = orm.em.getRepository<BookTag2>(BookTag2.name);
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
    tags = await orm.em.find<BookTag2>(BookTag2.name);
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

    // test M:N lazy init
    orm.em.clear();
    let book = (await orm.em.findOne<Book2>(Book2.name, { tags: tag1.id }))!;
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
    book = (await orm.em.findOne<Book2>(Book2.name, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tag1);
    await orm.em.persist(book);
    orm.em.clear();
    book = (await orm.em.findOne<Book2>(Book2.name, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(2);

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
    book = (await orm.em.findOne<Book2>(Book2.name, book.id, ['tags']))!;
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
    const repo = orm.em.getRepository<Publisher2>(Publisher2.name);

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
    const repo = orm.em.getRepository<BookTag2>(BookTag2.name);

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
    book1.publisher = new Publisher2('B1 publisher');
    book1.publisher.tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.publisher = new Publisher2('B2 publisher');
    book2.publisher.tests.add(Test2.create('t21'), Test2.create('t22'));
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
    const repo = orm.em.getRepository<BookTag2>(BookTag2.name);

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
    const books = await orm.em.find<Book2>(Book2.name, {}, ['publisher.tests', 'author']);
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
    const repo = orm.em.getRepository<Author2>(Author2.name);
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
    const repo = orm.em.getRepository<Author2>(Author2.name);
    const author = new Author2('Johny Cash', 'johny@cash.com');
    await repo.persist(author);
    orm.em.clear();

    await expect(repo.findAll(['tests'])).rejects.toThrowError(`Entity 'Author2' does not have property 'tests'`);
    await expect(repo.findOne(author.id, ['tests'])).rejects.toThrowError(`Entity 'Author2' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository<Publisher2>(Publisher2.name);
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
    const repo = orm.em.getRepository<Author2>(Author2.name);
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
    orm.options.debug = false;
    const res1 = await orm.em.nativeInsert(Author2.name, { name: 'native name 1' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author2.name, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author2.name, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.nativeInsert(Author2.name, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author2.name, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);

    await expect(orm.em.aggregate(Author2.name, [])).rejects.toThrowError('Aggregations are not supported by MySqlDriver driver');
  });

  test('Utils.prepareEntity changes entity to number id', async () => {
    const author1 = new Author2('Name 1', 'e-mail');
    const book = new Book2('test', author1);
    const author2 = new Author2('Name 2', 'e-mail');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persist([author1, author2, book]);
    const diff = Utils.diffEntities(author1, author2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book.id });
    expect(typeof diff.favouriteBook).toBe('number');
  });

  afterAll(async () => orm.close(true));

});
