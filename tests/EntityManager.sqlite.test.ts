import { unlinkSync } from 'fs';
import { Collection, EntityManager, JavaScriptMetadataProvider, MikroORM, Utils } from '../lib';
import { initORMSqlite, wipeDatabaseSqlite } from './bootstrap';
import { SqliteDriver } from '../lib/drivers/SqliteDriver';
import { Logger } from '../lib/utils';
import { EntityMetadata } from '../lib/decorators';

const { Author3 } = require('./entities-js/Author3');
const { Book3 } = require('./entities-js/Book3');
const { BookTag3 } = require('./entities-js/BookTag3');
const { Publisher3 } = require('./entities-js/Publisher3');
const { Test3 } = require('./entities-js/Test3');

/**
 * @class EntityManagerSqliteTest
 */
describe('EntityManagerSqlite', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMSqlite());
  beforeEach(async () => wipeDatabaseSqlite(orm.em));

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
  });

  test('onUpdate should be re-hydrated when loading metadata from cache', async () => {
    const provider = new JavaScriptMetadataProvider(orm.config);
    const cacheAdapter = orm.config.getCacheAdapter();
    const cache = cacheAdapter.get('Author3');
    const meta = {} as EntityMetadata;
    provider.loadFromCache(meta, cache);
    expect(meta.properties['updatedAt'].onUpdate).toBeDefined();
    expect(meta.properties['updatedAt'].onUpdate!()).toBeInstanceOf(Date);
  });

  test('should return sqlite driver', async () => {
    const driver = orm.em.getDriver<SqliteDriver>();
    expect(driver instanceof SqliteDriver).toBe(true);
    expect(await driver.findOne(Book3.name, { foo: 'bar' })).toBeNull();
    expect(await driver.nativeInsert(BookTag3.name, { books: [1] })).not.toBeNull();
    expect(await driver.getConnection().execute('SELECT 1 as count')).toEqual([{ count: 1 }]);
    expect(await driver.find(BookTag3.name, { books: [1] })).not.toBeNull();
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver<SqliteDriver>();
    const err1 = `SQLITE_ERROR: no such table: not_existing\n in query: INSERT INTO \`not_existing\` (\`foo\`) VALUES (?)\n with params: ["bar"]`;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = `SQLITE_ERROR: no such table: not_existing\n in query: DELETE FROM \`not_existing\``;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('should throw when trying to search by entity instead of identifier', async () => {
    const repo = orm.em.getRepository(Author3);
    const author = new Author3('name', 'email');
    await repo.persist(author);
    await expect(repo.find(author)).rejects.toThrowError('Author3 entity provided in search condition. Please provide identifier instead.');
    await expect(repo.find({ author })).rejects.toThrowError(`Author3 entity provided in search condition in field 'author'. Please provide identifier instead.`);
  });

  test('transactions', async () => {
    const god1 = new Author3('God1', 'hello@heaven.god');
    await orm.em.beginTransaction();
    await orm.em.persist(god1);
    await orm.em.rollback();
    const res1 = await orm.em.findOne(Author3, { name: 'God1' });
    expect(res1).toBeNull();

    await orm.em.beginTransaction();
    const god2 = new Author3('God2', 'hello@heaven.god');
    await orm.em.persist(god2);
    await orm.em.commit();
    const res2 = await orm.em.findOne(Author3, { name: 'God2' });
    expect(res2).not.toBeNull();

    await orm.em.transactional(async em => {
      const god3 = new Author3('God3', 'hello@heaven.god');
      await em.persist(god3);
    });
    const res3 = await orm.em.findOne(Author3, { name: 'God3' });
    expect(res3).not.toBeNull();

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god4 = new Author3('God4', 'hello@heaven.god');
        await em.persist(god4);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res4 = await orm.em.findOne(Author3, { name: 'God4' });
      expect(res4).toBeNull();
    }
  });

  test('nested transactions with save-points', async () => {
    await orm.em.transactional(async em => {
      const driver = em.getDriver();
      const god1 = new Author3('God1', 'hello@heaven.god');
      await driver.beginTransaction();
      await em.persist(god1);
      await driver.rollback();
      const res1 = await em.findOne(Author3, { name: 'God1' });
      expect(res1).toBeNull();

      await driver.beginTransaction();
      const god2 = new Author3('God2', 'hello@heaven.god');
      await em.persist(god2);
      await driver.commit();
      const res2 = await em.findOne(Author3, { name: 'God2' });
      expect(res2).not.toBeNull();
    });
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.getConnection(), { logger });

    // start outer transaction
    const transaction = orm.em.transactional(async em => {
      // do stuff inside inner transaction and rollback
      await em.beginTransaction();
      await em.persist(new Author3('God', 'hello@heaven.god'));
      await em.rollback();

      await em.persist(new Author3('God Persisted!', 'hello-persisted@heaven.god'));
    });

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('[query-logger] BEGIN');
    expect(mock.mock.calls[5][0]).toMatch('[query-logger] COMMIT');
    expect(await orm.em.findOne(Author3, { name: 'God Persisted!' })).not.toBeNull();
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible);

    const author = new Author3('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    author.favouriteBook = bible;

    const publisher = new Publisher3('7K publisher', 'global');

    const book1 = new Book3('My Life on The Wall, part 1', author);
    book1.publisher = publisher;
    const book2 = new Book3('My Life on The Wall, part 2', author);
    book2.publisher = publisher;
    const book3 = new Book3('My Life on The Wall, part 3', author);
    book3.publisher = publisher;

    const repo = orm.em.getRepository(Book3);
    await repo.persist(book1, false);
    await repo.persist(book2, false);
    await repo.persist(book3, false);
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

        expect(book.author).toBeInstanceOf(Author3);
        expect(book.author.isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Publisher3);
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
    expect(lastBook[0].author).toBeInstanceOf(Author3);
    expect(lastBook[0].author.isInitialized()).toBe(true);
    await orm.em.getRepository(Book3).remove(lastBook[0].id);
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author3, god.id);
    expect(ref.isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author3, god.id);
    expect(ref).toBe(newGod);
    expect(ref.isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    const author1 = new Author3('Author 1', 'a1@example.com');
    const author2 = new Author3('Author 2', 'a2@example.com');
    const author3 = new Author3('Author 3', 'a3@example.com');
    await orm.em.persist([author1, author2, author3]);
    orm.em.clear();

    const authors = await orm.em.find<any>(Author3, { email: /exa.*le\.c.m$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
  });

  test('stable results of serialization', async () => {
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    const bible2 = new Book3('Bible pt. 2', god);
    const bible3 = new Book3('Bible pt. 3', new Author3('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]);
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
    await orm.em.persist(pub);
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    bible.publisher = pub;
    const bible2 = new Book3('Bible pt. 2', god);
    bible2.publisher = pub;
    const bible3 = new Book3('Bible pt. 3', new Author3('Lol', 'lol@lol.lol'));
    bible3.publisher = pub;
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = orm.em.getReference<any>(Author3, god.id);
    const publisher = (await orm.em.findOne<any>(Publisher3, pub.id, ['books']))!;
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
    const authorRepository = orm.em.getRepository(Author3);
    const god = new Author3('God', 'hello@heaven.god');
    const bible = new Book3('Bible', god);
    await orm.em.persist(bible);

    let jon = new Author3('Jon Snow', 'snow@wall.st');
    jon.born = new Date();
    jon.favouriteBook = bible;
    await orm.em.persist(jon);
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

    await orm.em.persist(book1, false);
    await orm.em.persist(book2, false);
    await orm.em.persist(book3);

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
    tags = await orm.em.find(BookTag3);
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection Book3\[] of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.add(book1)).toThrowError(/Collection Book3\[] of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection Book3\[] of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection Book3\[] of entity BookTag3\[\d+] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection Book3\[] of entity BookTag3\[\d+] not initialized/);

    // test M:N lazy init
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

    // test M:N lazy init
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
    book.tags.remove(tag1);
    await orm.em.persist(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book3, book.id, ['tags']))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tag1);
    await orm.em.persist(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book3, book.id, ['tags']))!;
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
    await orm.em.persist([p1, p2]);
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
    expect(publishers[1].tests.getItems()[0].isInitialized()).toBe(true);
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
    await orm.em.persist([book1, book2, book3]);
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

    await repo.persist(author);
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await repo.persist(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author3.beforeDestroyCalled).toBe(0);
    expect(Author3.afterDestroyCalled).toBe(0);
    await repo.remove(author);
    expect(Author3.beforeDestroyCalled).toBe(1);
    expect(Author3.afterDestroyCalled).toBe(1);

    const author2 = new Author3('Johny Cash', 'johny@cash.com');
    await repo.persist(author2);
    await repo.remove(author2);
    expect(Author3.beforeDestroyCalled).toBe(2);
    expect(Author3.afterDestroyCalled).toBe(2);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author3);
    const author = new Author3('Johny Cash', 'johny@cash.com');
    await repo.persist(author);
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
    const repo = orm.em.getRepository<any>(Author3);
    const author = new Author3('name', 'email');
    await expect(author.createdAt).toBeDefined();
    await expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    await expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);
    await repo.persist(author);

    author.name = 'name1';
    await new Promise(resolve => setTimeout(resolve, 10));
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
    const res1 = await orm.em.nativeInsert(Author3, { name: 'native name 1' });
    expect(typeof res1).toBe('number');

    const res2 = await orm.em.nativeUpdate(Author3, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.nativeDelete(Author3, { name: 'new native name' });
    expect(res3).toBe(1);

    const res4 = await orm.em.nativeInsert(Author3, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2' });
    expect(typeof res4).toBe('number');

    const res5 = await orm.em.nativeUpdate(Author3, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res5).toBe(1);

    await expect(orm.em.aggregate(Author3, [])).rejects.toThrowError('Aggregations are not supported by SqliteDriver driver');
  });

  test('Utils.prepareEntity changes entity to number id', async () => {
    const author1 = new Author3('Name 1', 'e-mail');
    const book = new Book3('test', author1);
    const author2 = new Author3('Name 2', 'e-mail');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persist([author1, author2, book]);
    const diff = Utils.diffEntities(author1, author2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book.id });
    expect(typeof diff.favouriteBook).toBe('number');
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName'));
  });

});
