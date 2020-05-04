import { ObjectId } from 'mongodb';
import chalk from 'chalk';
import { Collection, Configuration, EntityProperty, MikroORM, QueryOrder, Reference, wrap, Logger, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager, MongoConnection, MongoDriver } from '@mikro-orm/mongodb';

import { Author, Book, BookTag, Publisher, PublisherType, Test } from './entities';
import { AuthorRepository } from './repositories/AuthorRepository';
import { initORMMongo, wipeDatabase } from './bootstrap';
import FooBar from './entities/FooBar';
import { FooBaz } from './entities/FooBaz';

describe('EntityManagerMongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persistAndFlush(bible);

    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date('2000-01-01');
    author.favouriteBook = bible;

    const publisher = new Publisher('7K publisher', PublisherType.GLOBAL);
    const publisherRef = Reference.create(publisher);

    const book1 = new Book('My Life on The Wall, part 1', author);
    book1.publisher = publisherRef;
    const book2 = new Book('My Life on The Wall, part 2', author);
    book2.publisher = publisherRef;
    const book3 = new Book('My Life on The Wall, part 3', author);
    book3.publisher = publisherRef;

    const repo = orm.em.getRepository(Book);
    repo.persist(book1);
    repo.persist(book2);
    repo.persist(book3);
    await repo.flush();
    orm.em.clear();

    const publisher7k = (await orm.em.getRepository(Publisher).findOne({ name: '7K publisher' }))!;
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(true);
    expect(publisher7k.tests.isInitialized(true)).toBe(true); // tests are eager loaded
    orm.em.clear();

    const authorRepository = orm.em.getRepository(Author);
    const booksRepository = orm.em.getRepository(Book);
    const books = await booksRepository.findAll(['author']);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible._id })).not.toBe(null);
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
    expect(jon).toBe(await authorRepository.findOne(jon._id));

    // serialization test
    const o = jon.toJSON(false);
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
      born: '2000-01-01',
      name: 'Jon Snow',
      foo: 'bar',
    });
    expect(jon.toJSON(false)).toEqual(o);
    expect(jon.books.getIdentifiers('_id')).toBeInstanceOf(Array);
    expect(jon.books.getIdentifiers('_id')[0]).toBeInstanceOf(ObjectId);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers('id')[0]).toBe('string');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);
        expect(book.author).toBeInstanceOf(Author);
        expect(wrap(book.author).isInitialized()).toBe(true);
        expect(book.publisher.isInitialized()).toBe(false);
        expect(typeof book.publisher.id).toBe('string');
        expect(book.publisher._id).toBeInstanceOf(ObjectId);
        expect(book.publisher.unwrap()).toBeInstanceOf(Publisher);
        expect(wrap(book.publisher.unwrap()).isInitialized()).toBe(false);
      }
    }

    const booksByTitleAsc = await booksRepository.find({ author: jon._id }, [], { title: QueryOrder.ASC });
    expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
    expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

    const booksByTitleDesc = await booksRepository.find({ author: jon.id }, [], { title: 'desc' });
    expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
    expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

    const twoBooks = await booksRepository.find({ author: jon._id }, [], { title: 'DESC' }, 2);
    expect(twoBooks.length).toBe(2);
    expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
    expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

    const lastBook = await booksRepository.find({ author: jon.id }, ['author'], { title: -1 }, 2, 2);
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author);
    expect(wrap(lastBook[0].author).isInitialized()).toBe(true);

    const lastBook2 = await booksRepository.find({ author: jon.id }, {
      populate: ['author'],
      orderBy: { title: QueryOrder.DESC },
      limit: 2,
      offset: 2,
    });
    expect(lastBook2.length).toBe(1);
    expect(lastBook[0]).toBe(lastBook2[0]);

    const lastBook3 = await orm.em.find(Book, { author: jon.id }, {
      populate: ['author'],
      orderBy: { title: QueryOrder.DESC },
      limit: 2,
      offset: 2,
    });
    expect(lastBook3.length).toBe(1);
    expect(lastBook[0]).toBe(lastBook3[0]);

    await orm.em.getRepository(Book).remove(lastBook[0]._id);
  });

  test('should provide custom repository', async () => {
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    expect(repo).toBeInstanceOf(AuthorRepository);
    expect(repo.magic).toBeInstanceOf(Function);
    expect(repo.magic('test')).toBe('111 test 222');
  });

  test('eager loading', async () => {
    const bar = FooBar.create('fb');
    bar.baz = FooBaz.create('fz');
    bar.baz.book = new Book('FooBar vs FooBaz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar);
    const a = await repo.findOne(bar.id, ['baz.bar']);
    expect(wrap(a!.baz!).isInitialized()).toBe(true);
    expect(wrap(a!.baz!.book).isInitialized()).toBe(true);
    expect(a!.baz!.book.title).toBe('FooBar vs FooBaz');
  });

  test(`persisting 1:1 from owning side with cycle`, async () => {
    const bar = FooBar.create('fb');
    const baz = FooBaz.create('fz');
    bar.baz = baz;
    baz.bar = bar;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(FooBar, bar.id);
    const b = await orm.em.findOneOrFail(FooBaz, baz.id);
    expect(a.baz).toBe(b);
    expect(a.name).toBe('fb');
    expect(b.bar).toBe(a);
    expect(b.name).toBe('fz');
  });

  test(`persisting 1:1 from inverse side with cycle`, async () => {
    const bar = FooBar.create('fb');
    const baz = FooBaz.create('fz');
    bar.baz = baz;
    baz.bar = bar;
    await orm.em.persistAndFlush(baz);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(FooBar, bar.id);
    const b = await orm.em.findOneOrFail(FooBaz, baz.id);
    expect(a.baz).toBe(b);
    expect(a.name).toBe('fb');
    expect(b.bar).toBe(a);
    expect(b.name).toBe('fz');
  });

  test(`persisting 1:1 created via assign from owner (gh #210)`, async () => {
    const bar = wrap(new FooBar()).assign({
      name: 'fb',
      baz: { name: 'fz' },
    }, { em: orm.em });
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(FooBar, bar.id);
    const b = await orm.em.findOneOrFail(FooBaz, bar.baz!.id);
    expect(a.baz).toBe(b);
    expect(a.name).toBe('fb');
    expect(b.bar).toBe(a);
    expect(b.name).toBe('fz');
  });

  test(`entity.init() and collection.init() works only for managed entities`, async () => {
    const author = new Author('a', 'b');
    await expect(wrap(author).init()).rejects.toThrowError('Entity Author is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
    await expect(wrap(author.books).init()).rejects.toThrowError('Entity Author is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test(`persisting 1:1 created via assign from inverse (gh #210)`, async () => {
    expect(() => wrap(new FooBaz()).assign({
      name: 'fz',
      bar: { name: 'fb' },
    })).toThrowError('To use assign() on not managed entities, explicitly provide EM instance: wrap(entity).assign(data, { em: orm.em })');

    const baz = wrap(new FooBaz()).assign({
      name: 'fz',
      bar: { name: 'fb' },
    }, { em: orm.em });
    await orm.em.persistAndFlush(baz);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(FooBar, baz.bar.id);
    const b = await orm.em.findOneOrFail(FooBaz, baz.id);
    expect(a.baz).toBe(b);
    expect(a.name).toBe('fb');
    expect(b.bar).toBe(a);
    expect(b.name).toBe('fz');
  });

  test('findOne should work with options parameter', async () => {
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    const author = new Author('name 1', 'email1');
    const author2 = new Author('name 2', 'email2');
    await repo.persistAndFlush([author, author2]);
    orm.em.clear();

    const a2 = await repo.findOne({ name: /^name/ }, {
      populate: ['books'],
      orderBy: { name: QueryOrder.DESC },
    });
    expect(a2).not.toBeNull();
    expect(a2!.id).toBe(author2.id);
    expect(a2!.books.isInitialized()).toBe(true);

    const a1 = await repo.findOne({ name: /^name/ }, {
      orderBy: { name: QueryOrder.ASC },
    });
    expect(a1).not.toBeNull();
    expect(a1!.id).toBe(author.id);
    expect(a1!.books.isInitialized()).toBe(false);

    const a3 = await repo.findOne({ name: /^name/ }, [], { name: QueryOrder.ASC });
    expect(a3).toBe(a1);
  });

  test('should convert entity to PK when trying to search by entity', async () => {
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    const author = new Author('name', 'email');
    author.favouriteAuthor = author;
    await repo.persistAndFlush(author);
    const a = await repo.findOne(author);
    const authors = await repo.find({ favouriteAuthor: author });
    expect(a).toBe(author);
    expect(authors[0]).toBe(author);
  });

  test('removing not yet persisted entity will not make db call', async () => {
    const author = new Author('name', 'email');
    const author2 = new Author('name2', 'email2');
    const author3 = new Author('name3', 'email3');
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    repo.persist(author);
    repo.persist(author2);
    await repo.removeAndFlush(author);
    expect(Object.keys(orm.em.getUnitOfWork().getIdentityMap())).toEqual([`Author-${author2.id}`]);
    author2.name = 'lol';
    repo.persistLater(author2);
    orm.em.removeLater(author3);
    await repo.flush();
    await orm.em.remove(Author, author3);
  });

  test('removing persisted entity will remove it from persist stack first', async () => {
    const author = new Author('name', 'email');
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    await repo.persistAndFlush(author);
    expect(orm.em.getUnitOfWork().getById<Author>(Author.name, author.id)).toBeDefined();
    author.name = 'new name';
    repo.persist(author);
    orm.em.removeEntity(author);
    expect(orm.em.getUnitOfWork().getById<Author>(Author.name, author.id)).toBeUndefined();
    expect(orm.em.getUnitOfWork().getIdentityMap()).toEqual({});
  });

  test('removing persisted entity via PK', async () => {
    const author = new Author('name', 'email');
    const repo = orm.em.getRepository(Author) as AuthorRepository;
    await repo.persistAndFlush(author);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });
    await orm.em.remove(Author, author.id);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.deleteMany\({ _id: ObjectId\('\w+'\) }, { session: undefined }\)/);
  });

  test('should throw when trying to merge entity without id', async () => {
    const author = new Author('test', 'test');
    expect(() => orm.em.merge(author)).toThrowError(`You cannot merge entity 'Author' without identifier!`);
  });

  test('transactions', async () => {
    const god1 = new Author('God1', 'hello@heaven1.god');
    try {
      await orm.em.transactional(async em => {
        await em.persistAndFlush(god1);
        throw new Error(); // rollback the transaction
      });
    } catch { }

    const res1 = await orm.em.findOne(Author, { name: 'God1' });
    expect(res1).toBeNull();

    const ret = await orm.em.transactional(async em => {
      const god2 = new Author('God2', 'hello@heaven2.god');
      await em.persist(god2);
      return true;
    });

    const res2 = await orm.em.findOne(Author, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    try {
      await orm.em.transactional(async em => {
        const god3 = new Author('God4', 'hello@heaven4.god');
        await em.persist(god3);
        throw err;
      });
    } catch (e) {
      expect(e).toBe(err);
      const res3 = await orm.em.findOne(Author, { name: 'God4' });
      expect(res3).toBeNull();
    }
  });

  test('fork', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persistAndFlush(bible);
    const fork = orm.em.fork();

    expect(fork).not.toBe(orm.em);
    expect(fork.getMetadata()).toBe(orm.em.getMetadata());
    expect(fork.getUnitOfWork().getIdentityMap()).toEqual({});

    // request context is not started so we can use UoW and EF getters
    expect(fork.getUnitOfWork().getIdentityMap()).not.toBe(orm.em.getUnitOfWork().getIdentityMap());
    expect(fork.getEntityFactory()).not.toBe(orm.em.getEntityFactory());
  });

  test('findOne with empty where will throw', async () => {
    await expect(orm.em.findOne(Author, '')).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne(Author, {})).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne(Author, [])).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne(Author, undefined!)).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne(Author, null!)).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author, god.id);
    expect(wrap(ref).isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author, god.id);
    expect(ref).toBe(newGod);
    expect(wrap(ref).isInitialized()).toBe(true);
  });

  test('findOne supports regexps', async () => {
    const author1 = new Author('Author 1', 'a1@example.com');
    const author2 = new Author('Author 2', 'a2@example.com');
    const author3 = new Author('Author 3', 'a3@example.com');
    await orm.em.persistAndFlush([author1, author2, author3]);
    orm.em.clear();

    const authors = await orm.em.find(Author, { email: /example\.com$/ });
    expect(authors.length).toBe(3);
    expect(authors[0].name).toBe('Author 1');
    expect(authors[1].name).toBe('Author 2');
    expect(authors[2].name).toBe('Author 3');
  });

  test('stable results of serialization', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    const bible2 = new Book('Bible pt. 2', god);
    const bible3 = new Book('Bible pt. 3', new Author('Lol', 'lol@lol.lol'));
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = (await orm.em.findOne(Author, god.id))!;
    const books = await orm.em.find(Book, {});
    await wrap(newGod).init(false);

    for (const book of books) {
      expect(book.toJSON()).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = new Publisher('Publisher2');
    const publisherRef = Reference.create(pub);
    await orm.em.persistAndFlush(pub);
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.publisher = publisherRef;
    const bible2 = new Book('Bible pt. 2', god);
    bible2.publisher = publisherRef;
    const bible3 = new Book('Bible pt. 3', new Author('Lol', 'lol@lol.lol'));
    bible3.publisher = publisherRef;
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = orm.em.getReference(Author, god.id);
    const publisher = (await orm.em.findOne(Publisher, pub.id, ['books']))!;
    await wrap(newGod).init();

    const json = wrap(publisher).toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: Book) => b.id === book.id)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('should return mongo driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(MongoDriver);
    expect(driver.getDependencies()).toEqual(['mongodb']);
    expect(await driver.findOne(BookTag.name, { foo: 'bar', books: 123 })).toBeNull();
    expect(driver.getPlatform().usesPivotTable()).toBe(false);
    expect(driver.getPlatform().usesImplicitTransactions()).toBe(false);
    expect(driver.getPlatform().requiresNullableForAlteringColumn()).toBe(false); // test default Platform value (not used by mongo)
    await expect(driver.loadFromPivotTable({} as EntityProperty, [])).rejects.toThrowError('MongoDriver does not use pivot tables');
    await expect(driver.getConnection().execute('')).rejects.toThrowError('MongoConnection does not support generic execute method');
    expect(driver.getConnection().getCollection(BookTag).collectionName).toBe('book-tag');
    expect(driver.getConnection().getCollection(BookTag.name).collectionName).toBe('book-tag');
  });

  test('ensure indexes', async () => {
    await orm.em.getDriver().ensureIndexes();
    const conn = orm.em.getDriver().getConnection('write');

    const authorInfo = await conn.getCollection('author').indexInformation({ full: true, session: undefined as any });
    const bookInfo = await conn.getCollection('books-table').indexInformation({ full: true, session: undefined as any });
    expect(authorInfo.reduce((o: any, i: any) => { o[i.name] = i; return o; }, {} as any)).toMatchObject({
      _id_: { key: { _id: 1 }, name: '_id_' },
      born_1: { key: { born: 1 }, name: 'born_1' },
      custom_idx_1: { key: { email: 1, name: 1 }, name: 'custom_idx_1' },
      age_uniq: { key: { age: 1 }, name: 'age_uniq', unique: true, partialFilterExpression: { age: { $exists: true } } },
      email_1: { key: { email: 1 }, name: 'email_1', unique: true },
    });
    expect(bookInfo.reduce((o: any, i: any) => { o[i.name] = i; return o; }, {} as any)).toMatchObject({
      _id_: { key: { _id: 1 }, name: '_id_' },
      publisher_idx: { key: { publisher: 1 }, name: 'publisher_idx' },
      title_text: { key: { _fts: 'text', _ftsx: 1 }, weights: { title: 1 } },
      title_1_author_1: { key: { title: 1, author: 1 }, name: 'title_1_author_1', unique: true },
    });
  });

  test('should use user and password as connection options', async () => {
    const config = new Configuration({ type: 'mongo', user: 'usr', password: 'pw' } as any, false);
    const connection = new MongoConnection(config);
    await expect(connection.getConnectionOptions()).toEqual({
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auth: { user: 'usr', password: 'pw' },
    });
  });

  test('connection returns correct URL', async () => {
    const conn1 = new MongoConnection(new Configuration({
      type: 'mongo',
      clientUrl: 'mongodb://example.host.com:34500',
      dbName: 'test-db-name',
      user: 'usr',
      password: 'pw',
    } as any, false));
    await expect(conn1.getClientUrl()).toBe('mongodb://usr:*****@example.host.com:34500');
    const conn2 = new MongoConnection(new Configuration({ type: 'mongo' } as any, false));
    await expect(conn2.getClientUrl()).toBe('mongodb://127.0.0.1:27017');
    const clientUrl = 'mongodb://user:Q#ais@2d-Aa_43:ui!0d.ai6d@mongodb-replicaset-0.cluster.local:27017,mongodb-replicaset-1.cluster.local:27018,...';
    const conn3 = new MongoConnection(new Configuration({ type: 'mongo', clientUrl } as any, false));
    await expect(conn3.getClientUrl()).toBe('mongodb://user:*****@mongodb-replicaset-0.cluster.local:27017,mongodb-replicaset-1.cluster.local:27018,...');
    const conn4 = new MongoConnection(new Configuration({ type: 'mongo', clientUrl: 'invalid-url-that-was-not-properly-parsed' } as any, false));
    await expect(conn4.getClientUrl()).toBe('invalid-url-that-was-not-properly-parsed');
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository(Author);
    const jon = new Author('Jon Snow', 'snow@wall.st');
    await authorRepository.persistAndFlush(jon);

    orm.em.clear();
    let author = (await authorRepository.findOne(jon._id))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = (await authorRepository.findOne(jon.id))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = (await authorRepository.findOne({ id: jon.id }))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = (await authorRepository.findOne({ _id: jon._id }))!;
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');
  });

  test('populate ManyToOne relation via init()', async () => {
    const authorRepository = orm.em.getRepository(Author);
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persistAndFlush(bible);

    let jon = new Author('Jon Snow', 'snow@wall.st');
    jon.born = new Date('1990-03-23');
    jon.favouriteBook = bible;
    await orm.em.persistAndFlush(jon);
    orm.em.clear();

    jon = (await authorRepository.findOne(jon.id))!;
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.born).toEqual(new Date('1990-03-23'));
    expect(jon.favouriteBook).toBeInstanceOf(Book);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(false);

    await wrap(jon.favouriteBook).init();
    expect(jon.favouriteBook).toBeInstanceOf(Book);
    expect(wrap(jon.favouriteBook).isInitialized()).toBe(true);
    expect(jon.favouriteBook.title).toBe('Bible');
  });

  test('many to many relation', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist(book1);
    orm.em.persist(book2);
    await orm.em.persistAndFlush(book3);

    expect(tag1._id).toBeDefined();
    expect(tag2._id).toBeDefined();
    expect(tag3._id).toBeDefined();
    expect(tag4._id).toBeDefined();
    expect(tag5._id).toBeDefined();
    expect(book1.tags.toArray()).toEqual([wrap(tag1).toJSON(), wrap(tag3).toJSON()]);

    // test inverse side
    const tagRepository = orm.em.getRepository(BookTag);
    let tags = await tagRepository.findAll();
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].name).toBe('silly');
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.length).toBe(2);

    orm.em.clear();
    tags = await orm.em.find(BookTag, {});
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection<Book> of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection<Book> of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection<Book> of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection<Book> of entity BookTag\[\w{24}] not initialized/);

    // test M:N lazy load
    orm.em.clear();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0]).toBeInstanceOf(Book);
    expect(tags[0].books.getItems()[0]._id).toBeDefined();
    expect(wrap(tags[0].books.getItems()[0]).isInitialized()).toBe(true);

    // test M:N lazy load
    orm.em.clear();
    let book = await orm.em.findOneOrFail(Book, { tags: tag1._id });
    expect(book.tags.isInitialized()).toBe(true); // owning side is always initialized
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag);
    expect(book.tags.getItems()[0]._id).toBeDefined();
    expect(wrap(book.tags.getItems()[0]).isInitialized()).toBe(false);
    const initSpy = jest.spyOn(Collection.prototype, 'init');
    const items2 = await book.tags.loadItems();
    expect(initSpy).toBeCalledTimes(1);
    expect(book.tags.getItems()).toEqual(items2);
    const items3 = await book.tags.loadItems();
    expect(initSpy).toBeCalledTimes(1);
    expect(items3).toEqual(items2);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tag1, tag5); // tag5 will be ignored as it is not part of collection
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book, book._id))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book, book._id))!;
    expect(book.tags.count()).toBe(2);

    // set
    const items = book.tags.getIdentifiers().map(t => tagRepository.getReference(t));
    book.tags.set(items);
    await orm.em.persistAndFlush(book);
    orm.em.clear();
    book = (await orm.em.findOne(Book, book._id))!;
    expect(book.tags.count()).toBe(2);

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
    book = (await orm.em.findOne(Book, book._id))!;
    expect(book.tags.count()).toBe(0);
  });

  test('populating many to many relation', async () => {
    const p1 = new Publisher('foo');
    expect(p1.tests).toBeInstanceOf(Collection);
    expect(p1.tests.isInitialized()).toBe(true);
    expect(p1.tests.isDirty()).toBe(false);
    expect(p1.tests.count()).toBe(0);
    const p2 = new Publisher('bar');
    p2.tests.add(new Test(), new Test());
    await orm.em.persistAndFlush([p1, p2]);
    const repo = orm.em.getRepository(Publisher);

    orm.em.clear();
    const publishers = await repo.findAll(['tests']);
    expect(publishers).toBeInstanceOf(Array);
    expect(publishers.length).toBe(2);
    expect(publishers[0]).toBeInstanceOf(Publisher);
    expect(publishers[0].tests).toBeInstanceOf(Collection);
    expect(publishers[0].tests.isInitialized()).toBe(true);
    expect(publishers[0].tests.isDirty()).toBe(false);
    expect(publishers[0].tests.count()).toBe(0);
    await publishers[0].tests.init(); // empty many to many on owning side should not make db calls
    expect(wrap(publishers[1].tests.getItems()[0]).isInitialized()).toBe(true);
  });

  test('populating many to many relation on inverse side', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag);

    orm.em.clear();
    await repo.findOne(tag5.id, ['books']); // preload one of collections to test it is not re-loaded
    const tags = await repo.findAll(['books']);
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books).toBeInstanceOf(Collection);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books.getItems()[0]).isInitialized()).toBe(true);
  });

  test('serializing empty initialized many to many collection', async () => {
    let a = new Author('name', 'email');
    await orm.em.persistAndFlush(a);
    expect(a.toJSON()).toMatchObject({
      books: [],
    });
    orm.em.clear();

    a = (await orm.em.findOne(Author, a.id, ['books']))!;
    expect(a.toJSON()).toMatchObject({
      books: [],
    });
  });

  test('merging detached entity', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    author.favouriteBook = book1;
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();

    // cache author with favouriteBook and its tags
    const jon = await orm.em.findOne(Author, author.id, ['favouriteBook.tags']);
    const cache = wrap(jon).toObject();

    // merge cached author with his references
    orm.em.clear();
    const cachedAuthor = orm.em.merge(Author, cache);
    expect(cachedAuthor).toBe(cachedAuthor.favouriteBook.author);
    expect(Object.keys(orm.em.getUnitOfWork().getIdentityMap())).toEqual([
      'Author-' + author.id,
      'Book-' + book1.id,
      'BookTag-' + tag1.id,
      'BookTag-' + tag3.id,
    ]);
    expect(author).not.toBe(cachedAuthor);
    expect(author.id).toBe(cachedAuthor.id);
    const book4 = new Book('My Life on The Wall, part 4', cachedAuthor);
    await orm.em.persistAndFlush(book4);

    // merge detached author
    orm.em.clear();
    const cachedAuthor2 = orm.em.merge(author);
    expect(cachedAuthor2).toBe(cachedAuthor2.favouriteBook.author);
    expect(Object.keys(orm.em.getUnitOfWork().getIdentityMap())).toEqual([
      'Author-' + author.id,
      'Book-' + book1.id,
      'BookTag-' + tag1.id,
      'Book-' + book2.id,
      'BookTag-' + tag2.id,
      'Book-' + book3.id,
      'BookTag-' + tag4.id,
      'BookTag-' + tag5.id,
      'BookTag-' + tag3.id,
    ]);
    expect(author).toBe(cachedAuthor2);
    expect(author.id).toBe(cachedAuthor2.id);
    const book5 = new Book('My Life on The Wall, part 5', cachedAuthor2);
    await orm.em.persistAndFlush(book5);
  });

  test('one to many collection sets inverse side reference after adding', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    author.books.add(book1, book2, book3);
    expect(book1.author).toBe(author);
    expect(book3.author).toBe(author);
    expect(book3.author).toBe(author);
  });

  test('many to many collection sets inverse side reference after adding', async () => {
    const book1 = new Book('My Life on The Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2);
    book3.tags.add(tag2);
    expect(tag1.books[0]).toBe(book1);
    expect(tag1.books[1]).toBe(book2);
    expect(tag1.books.length).toBe(2);
    expect(tag2.books[0]).toBe(book2);
    expect(tag2.books[1]).toBe(book3);
    expect(tag2.books.length).toBe(2);
    expect(tag3.books[0]).toBe(book1);
    expect(tag3.books.length).toBe(1);
  });

  test('many to many collection sets owning side reference after adding', async () => {
    const book1 = new Book('My Life on The Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    tag1.books.add(book1, book2);
    tag2.books.add(book2, book3);
    tag3.books.add(book1);
    expect(tag1.books[0]).toBe(book1);
    expect(tag1.books[1]).toBe(book2);
    expect(tag1.books.length).toBe(2);
    expect(tag2.books[0]).toBe(book2);
    expect(tag2.books[1]).toBe(book3);
    expect(tag2.books.length).toBe(2);
    expect(tag3.books[0]).toBe(book1);
    expect(tag3.books.length).toBe(1);
  });

  test('cascade persist on owning side', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    author.books.add(book1, book2, book3);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const repo = orm.em.getRepository(Book);
    let book = (await repo.findOne(book1.id, ['author', 'tags']))!;
    book.author.name = 'Foo Bar';
    book.tags[0].name = 'new name 1';
    book.tags[1].name = 'new name 2';
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    book = (await repo.findOne(book1.id, ['author', 'tags']))!;
    expect(book.author.name).toBe('Foo Bar');
    expect(book.tags[0].name).toBe('new name 1');
    expect(book.tags[1].name).toBe('new name 2');
  });

  test('cascade persist on inverse side', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();

    const repo = orm.em.getRepository(BookTag);
    let tag = (await repo.findOne(tag5.id, ['books.author']))!;
    tag.books[0].title = 'new title 1';
    tag.books[1].title = 'new title 2';
    tag.books[1].author.name = 'Foo Bar';
    await orm.em.persistAndFlush(tag);
    orm.em.clear();

    tag = (await repo.findOne(tag5.id, ['books.author']))!;
    expect(tag.books[0].title).toBe('new title 1');
    expect(tag.books[1].title).toBe('new title 2');
    expect(tag.books[1].author.name).toBe('Foo Bar');
  });

  test('cascade remove on 1:m collection', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    author.books.add(book1, book2, book3);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const repo = orm.em.getRepository(Book);
    let books = await repo.findAll(['author', 'tags']);
    expect(books.length).toBe(3);
    expect(books[0].tags.count()).toBe(2);
    await books[0].author.books.init();
    await orm.em.removeEntity(books[0].author, true);
    orm.em.clear();

    books = await repo.findAll();
    expect(books.length).toBe(0);
  });

  test('cascade remove on m:1 reference', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    book1.publisher = book2.publisher = book3.publisher = Reference.create(new Publisher('to be removed'));
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const repo = orm.em.getRepository(Book);
    let books = await repo.findAll();
    expect(books.length).toBe(3);
    expect(books[0].publisher.unwrap().id).toBeDefined();
    expect(await orm.em.count(Publisher)).toBe(1);

    // we need to remove those books from IM or ORM will try to persist them automatically (and they still have link to the publisher)
    orm.em.getUnitOfWork().unsetIdentity(books[1]);
    orm.em.getUnitOfWork().unsetIdentity(books[2]);

    // by removing one book, publisher will be cascade removed and other books will remain its identifier
    await orm.em.removeEntity(books[0], true);
    orm.em.clear();

    books = await repo.findAll();
    expect(books.length).toBe(2);
    expect(books[0].publisher).not.toBeNull();
    expect(books[1].publisher).not.toBeNull();
    expect(await orm.em.count(Publisher, {})).toBe(0);
  });

  test('nested populating', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const publisher1 = new Publisher('B1 publisher');
    publisher1.tests.add(Test.create('t11'), Test.create('t12'));
    book1.publisher = Reference.create(publisher1);
    const publisher2 = new Publisher('B2 publisher');
    publisher2.tests.add(Test.create('t21'), Test.create('t22'));
    book2.publisher = Reference.create(publisher2);
    const publisher3 = new Publisher('B3 publisher');
    publisher3.tests.add(Test.create('t31'), Test.create('t32'));
    book3.publisher = Reference.create(publisher3);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag);

    orm.em.clear();
    const tags = await repo.findAll(['books.publisher.tests', 'books.author']);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books[0]).isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author);
    expect(wrap(tags[0].books[0].author).isInitialized()).toBe(true);
    expect(tags[0].books[0].author.name).toBe('Jon Snow');
    expect(tags[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags[0].books[0].publisher.isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher.unwrap()).toBeInstanceOf(Publisher);
    expect(wrap(tags[0].books[0].publisher.unwrap()).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher.unwrap().tests.count()).toBe(2);
    expect(tags[0].books[0].publisher.unwrap().tests[0].name).toBe('t11');
    expect(tags[0].books[0].publisher.unwrap().tests[1].name).toBe('t12');

    orm.em.clear();
    const books = await orm.em.find(Book, {}, ['publisher.tests', 'author']);
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book);
    expect(wrap(books[0]).isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Reference);
    expect(books[0].publisher.isInitialized()).toBe(true);
    expect(books[0].publisher.unwrap()).toBeInstanceOf(Publisher);
    expect(wrap(books[0].publisher.unwrap()).isInitialized()).toBe(true);
    expect(books[0].publisher.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher.unwrap().tests[1].name).toBe('t12');
  });

  test('nested populating with empty collection', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag);

    orm.em.clear();
    const tags = await repo.findAll(['books.publisher.tests']);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books[0]).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher).toBeUndefined();
  });

  test('populating all relationships', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const publisher1 = new Publisher('B1 publisher');
    publisher1.tests.add(Test.create('t11'), Test.create('t12'));
    book1.publisher = wrap(publisher1).toReference();
    const publisher2 = new Publisher('B2 publisher');
    publisher2.tests.add(Test.create('t21'), Test.create('t22'));
    book2.publisher = wrap(publisher2).toReference();
    const publisher3 = new Publisher('B3 publisher');
    publisher3.tests.add(Test.create('t31'), Test.create('t32'));
    book3.publisher = wrap(publisher3).toReference();
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag);

    orm.em.clear();
    const tags = await repo.findAll(true);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books[0]).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags[0].books[0].publisher.unwrap()).toBeInstanceOf(Publisher);
    expect(tags[0].books[0].publisher.isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author);
    expect(wrap(tags[0].books[0].author).isInitialized()).toBe(true);
    expect(tags[0].books[0].author.books.isInitialized(true)).toBe(true);
  });

  test('reference has no collection initialized', async () => {
    const book1 = new Book('t', new Author('a', 'e'));
    await orm.em.fork().persistAndFlush(book1);
    const book = orm.em.getReference(Book, book1.id);
    expect(book.tags).toBeUndefined();
    await wrap(book).init();
    expect(book.tags).not.toBeUndefined();
    expect(book.tags).toBeInstanceOf(Collection);
    expect(book.tags.isInitialized()).toBe(true);
  });

  test('populating one to many relation', async () => {
    let author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(Author);

    orm.em.clear();
    author = (await repo.findOne(author.id))!;
    expect(author.books).toBeInstanceOf(Collection);
    expect(author.books.isInitialized(true)).toBe(false);
    await author.books.init();
    expect(author.books.isInitialized(true)).toBe(true);
    expect(author.books.count()).toBe(3);
  });

  test('getter as a property', async () => {
    const repo = orm.em.getRepository(Author);
    const author = repo.create({ name: 'Jon Snow', email: 'snow@wall.st' });
    expect(author.code2).toBe('snow@wall.st - Jon Snow');
    expect(author.getCode()).toBe('snow@wall.st - Jon Snow');
    expect(author.toJSON()).toMatchObject({
      code: 'snow@wall.st - Jon Snow',
      code2: 'snow@wall.st - Jon Snow',
    });
  });

  test('em.create properly cascades collections', async () => {
    const author = orm.em.create(Author, { name: 'Jon Snow', email: 'snow@wall 1.st' });
    author.books.add(new Book('Test 1'));
    author.books.add(orm.em.create(Book, { title: 'Test 2' }));
    await orm.em.persistAndFlush(author);
    expect(author._id).toBeDefined();
    expect(author.books[0]._id).toBeDefined();
    expect(author.books[1]._id).toBeDefined();
  });

  test('hooks', async () => {
    Author.beforeDestroyCalled = 0;
    Author.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author);
    const author = new Author('Jon Snow', 'snow@wall.st');
    expect(author.id).toBeNull();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();
    expect(author.hookTest).toBe(false);

    await repo.persistAndFlush(author);
    expect(author.id).not.toBeNull();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');
    expect(author.hookTest).toBe(true);

    author.name = 'John Snow';
    await repo.flush();
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author.beforeDestroyCalled).toBe(0);
    expect(Author.afterDestroyCalled).toBe(0);
    await repo.removeAndFlush(author);
    expect(Author.beforeDestroyCalled).toBe(1);
    expect(Author.afterDestroyCalled).toBe(1);

    const author2 = new Author('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author2);
    await repo.removeAndFlush(author2);
    expect(Author.beforeDestroyCalled).toBe(2);
    expect(Author.afterDestroyCalled).toBe(2);
  });

  test('canPopulate', async () => {
    const repo = orm.em.getRepository(Author);
    expect(repo.canPopulate('test')).toBe(false);
    expect(repo.canPopulate('name')).toBe(false);
    expect(repo.canPopulate('favouriteBook')).toBe(true);
    expect(repo.canPopulate('books')).toBe(true);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository(Author);
    const author = new Author('Johny Cash', 'johny@cash.com');
    await repo.persistAndFlush(author);
    orm.em.clear();

    await expect(repo.findAll(['tests'])).rejects.toThrowError(`Entity 'Author' does not have property 'tests'`);
    await expect(repo.findOne(author.id, ['tests'])).rejects.toThrowError(`Entity 'Author' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository(Publisher);
    const publisher = new Publisher();
    let t1 = Test.create('t1');
    let t2 = Test.create('t2');
    let t3 = Test.create('t3');
    await orm.em.persistAndFlush([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await repo.persistAndFlush(publisher);
    orm.em.clear();

    const ent = (await repo.findOne(publisher.id))!;
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers('id')).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers('id')).toEqual([t2.id, t1.id, t3.id]);

    [t1, t2, t3] = ent.tests.getItems();
    ent.tests.set([t3, t2, t1]);
    await repo.flush();
    orm.em.clear();

    const ent1 = (await repo.findOne(publisher.id))!;
    await expect(ent1.tests.count()).toBe(3);
    await expect(ent1.tests.getIdentifiers('id')).toEqual([t3.id, t2.id, t1.id]);
  });

  test('collection allows custom where and orderBy', async () => {
    const book = new Book('My Life on The Wall, part 1');
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book.tags.add(tag1, tag2, tag3, tag4, tag5);
    await orm.em.persistAndFlush(book);

    orm.em.clear();
    const ent1 = await orm.em.findOneOrFail(Book, book.id);
    expect(ent1.tags.count()).toBe(5);
    expect(ent1.tags.getIdentifiers('id')).toEqual([tag1.id, tag2.id, tag3.id, tag4.id, tag5.id]);
    await ent1.tags.init([], {}, { name: QueryOrder.DESC });
    expect(ent1.tags.getItems().map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name, tag2.name]);

    orm.em.clear();
    const ent2 = await orm.em.findOneOrFail(Book, book.id);
    expect(ent2.tags.count()).toBe(5);
    expect(ent2.tags.getIdentifiers('id')).toEqual([tag1.id, tag2.id, tag3.id, tag4.id, tag5.id]);
    await ent2.tags.init([], { name: { $ne: 'funny' } }, { name: QueryOrder.DESC });
    expect(ent2.tags.getItems().map(t => t.name)).toEqual([tag4.name, tag1.name, tag3.name, tag5.name]);
  });

  test('property onUpdate hook (updatedAt field)', async () => {
    const repo = orm.em.getRepository(Author);
    const author = new Author('name', 'email');
    await expect(author.createdAt).toBeDefined();
    await expect(author.updatedAt).toBeDefined();
    // allow 1 ms difference as updated time is recalculated when persisting
    await expect(+author.updatedAt - +author.createdAt).toBeLessThanOrEqual(1);
    await repo.persistAndFlush(author);

    author.name = 'name1';
    await repo.flush();
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

  test('EM supports native insert/update/delete/aggregate', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    const res1 = await orm.em.nativeInsert(Author, { name: 'native name 1' });
    expect(res1).toBeInstanceOf(ObjectId);

    const res2 = await orm.em.nativeUpdate(Author, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.aggregate(Author, [{ $match: { name: 'new native name' } }]);
    expect(res3.length).toBe(1);
    expect(res3[0]).toMatchObject({ name: 'new native name' });

    const res4 = await orm.em.nativeDelete(Author, { name: 'new native name' });
    expect(res4).toBe(1);

    const res5 = await orm.em.nativeInsert(Author, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2' });
    expect(res5).toBeInstanceOf(ObjectId);

    const res6 = await orm.em.nativeUpdate(Author, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res6).toBe(1);

    const res7 = await orm.em.nativeInsert('test', { name: 'native name 1', test: 'abc' });
    expect(res7).toBeInstanceOf(ObjectId);

    const res8 = await orm.em.nativeUpdate('test', { name: 'native name 1' }, { $unset: { test: 1 } });
    expect(res8).toBe(1);

    const res9 = await orm.em.nativeDelete('test', { name: 'native name 1' });
    expect(res9).toBe(1);

    expect(mock.mock.calls.length).toBe(9);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('author'\)\.insertOne\({ name: 'native name 1' }, { session: undefined }\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.updateMany\({ name: 'native name 1' }, { '\$set': { name: 'new native name' } }, { session: undefined }\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('author'\)\.aggregate\(\[ { '\$match': { name: 'new native name' } } ], { session: undefined }\)\.toArray\(\);/);
    expect(mock.mock.calls[3][0]).toMatch(/db\.getCollection\('author'\)\.deleteMany\({ name: 'new native name' }, { session: undefined }\)/);
    expect(mock.mock.calls[4][0]).toMatch(/db\.getCollection\('author'\)\.insertOne\({ createdAt: ISODate\('.*'\), updatedAt: ISODate\('.*'\), name: 'native name 2' }, { session: undefined }\);/);
    expect(mock.mock.calls[5][0]).toMatch(/db\.getCollection\('author'\)\.updateMany\({ name: 'native name 2' }, { '\$set': { name: 'new native name', updatedAt: ISODate\('.*'\) } }, { session: undefined }\);/);
    expect(mock.mock.calls[6][0]).toMatch(/db\.getCollection\('test'\)\.insertOne\({ name: 'native name 1', test: 'abc' }, { session: undefined }\);/);
    expect(mock.mock.calls[7][0]).toMatch(/db\.getCollection\('test'\)\.updateMany\({ name: 'native name 1' }, { '\$unset': { test: 1 } }, { session: undefined }\);/);
    expect(mock.mock.calls[8][0]).toMatch(/db\.getCollection\('test'\)\.deleteMany\({ name: 'native name 1' }, { session: undefined }\)/);
  });

  test('1:m collection is initialized when entity loaded from EM', async () => {
    const author = new Author('name', 'email');
    const b1 = new Book('b1', author);
    const b2 = new Book('b2', author);
    const b3 = new Book('b3', author);
    orm.em.persist([b1, b2, b3]);
    await orm.em.flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author, author.id))!;
    expect(a1.books).toBeInstanceOf(Collection);
    expect(a1.books.isInitialized()).toBe(false);

    await orm.em.nativeUpdate(Author, { id: author.id }, { books: [b1.id, b2.id, b3.id] });
    orm.em.clear();

    const a2 = (await orm.em.findOne(Author, author.id))!;
    expect(a2.books).toBeInstanceOf(Collection);
    expect(a2.books.isInitialized()).toBe(true);
    expect(a2.books.isInitialized(true)).toBe(false);
  });

  test('EM supports smart search conditions', async () => {
    const author = new Author('name', 'email');
    author.born = new Date('1990-03-23');
    const b1 = new Book('b1', author);
    const b2 = new Book('b2', author);
    const b3 = new Book('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author, { 'id:ne': '5ec6d9bf90dae100fbed92ba' } as any))!;
    expect(a1).not.toBeNull();
    expect(a1.id).toBe(author.id);
    const a2 = (await orm.em.findOne(Author, { 'id>=': author.id } as any))!;
    expect(a2).not.toBeNull();
    expect(a2.id).toBe(author.id);
    const a3 = (await orm.em.findOne(Author, { 'id:nin': ['5ec6d9bf90dae100fbed92ba'] } as any))!;
    expect(a3).not.toBeNull();
    expect(a3.id).toBe(author.id);
    const now = new Date();
    const a4 = (await orm.em.findOne(Author, { $or: [
      { 'date >': now },
      { 'date <': now },
      { 'date >=': now },
      { 'date <=': now },
      { 'date !=': now },
    ] } as any))!;
    expect(a4).not.toBeNull();
    expect(a4.id).toBe(author.id);
  });

  test('self referencing (2 step)', async () => {
    const author = new Author('name', 'email');
    const b1 = new Book('b1', author);
    const b2 = new Book('b2', author);
    const b3 = new Book('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    author.favouriteAuthor = author;
    await orm.em.flush();
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(a1.toJSON()).toMatchObject({ favouriteAuthor: a1.id });
  });

  test('self referencing (1 step)', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    const author = new Author('name', 'email');
    author.favouriteAuthor = author;
    const b1 = new Book('b1', author);
    const b2 = new Book('b2', author);
    const b3 = new Book('b3', author);
    await orm.em.persistAndFlush([b1, b2, b3]);
    orm.em.clear();

    const a1 = (await orm.em.findOne(Author, { id: author.id }))!;
    expect(a1).toBe(a1.favouriteAuthor);
    expect(a1.id).not.toBeNull();
    expect(a1.toJSON()).toMatchObject({ favouriteAuthor: a1.id });

    // check fired queries
    expect(mock.mock.calls.length).toBe(8);
    expect(mock.mock.calls[0][0]).toMatch(/db\.begin\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.insertOne\({ createdAt: ISODate\('.*'\), updatedAt: ISODate\('.*'\), foo: '.*', name: '.*', email: '.*', termsAccepted: .* }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('books-table'\)\.insertOne\({ title: 'b1', author: ObjectId\('.*'\) }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[3][0]).toMatch(/db\.getCollection\('books-table'\)\.insertOne\({ title: 'b2', author: ObjectId\('.*'\) }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[4][0]).toMatch(/db\.getCollection\('books-table'\)\.insertOne\({ title: 'b3', author: ObjectId\('.*'\) }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[5][0]).toMatch(/db\.getCollection\('author'\)\.updateMany\({ _id: ObjectId\('.*'\) }, { '\$set': { favouriteAuthor: ObjectId\('.*'\), updatedAt: ISODate\('.*'\) } }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[6][0]).toMatch(/db\.commit\(\);/);
    expect(mock.mock.calls[7][0]).toMatch(/db\.getCollection\('author'\)\.find\(.*\)\.toArray\(\);/);
  });

  test('self referencing via another entity M:1 (1 step)', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    author.favouriteBook = book1; // author -> book1 -> author
    await orm.em.persistAndFlush(book1);
    orm.em.clear();

    const jon = await orm.em.findOne(Author, author.id, ['favouriteBook']);
    expect(jon!.favouriteBook).toBeInstanceOf(Book);
    expect(jon!.favouriteBook.title).toBe(book1.title);
  });

  test('self referencing M:N (1 step)', async () => {
    const a1 = new Author('A1', 'a1@wall.st');
    const a2 = new Author('A2', 'a2@wall.st');
    const a3 = new Author('A3', 'a3@wall.st');
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.friends.add(a1, a2, a3, author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = await orm.em.findOne(Author, author.id, ['friends']);
    const authors = await orm.em.find(Author, {}, { orderBy: { name: QueryOrder.ASC } });
    expect(jon!.friends.isInitialized(true)).toBe(true);
    expect(jon!.friends.toArray()).toMatchObject(authors.map(a => a.toJSON(true, ['id', 'email', 'friends'])));
  });

  test('orphan removal 1:M', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const b1 = new Book('b1', author);
    const b2 = new Book('b2', author);
    const b3 = new Book('b3', author);
    author.books.add(b1, b2, b3);
    await orm.em.persistAndFlush(author);

    // removing book from collection will trigger orphan removal
    author.books.remove(b1);
    await orm.em.flush();
    await expect(orm.em.findOne(Book, b1)).resolves.toBeNull();
    await expect(orm.em.findOne(Book, b3)).resolves.not.toBeNull();

    // replacing collection items will trigger orphan removal
    author.books.remove(b2);
    author.books.set([b1, b2]);
    await orm.em.flush();
    await expect(orm.em.findOne(Book, b1)).resolves.not.toBeNull();
    await expect(orm.em.findOne(Book, b3)).resolves.toBeNull();

    // removing author will cascade the operation as orphan removal behaves also like cascade remove
    await orm.em.removeEntity(author, true);
    await expect(orm.em.count(Book, { author })).resolves.toBe(0);
  });

  test('orphan removal 1:1', async () => {
    const bar = FooBar.create('fb');
    const baz1 = FooBaz.create('fz1');
    const baz2 = FooBaz.create('fz2');
    bar.baz = baz1;
    await orm.em.persistAndFlush(bar);
    // @ts-ignore
    expect(orm.em.getUnitOfWork().originalEntityData[wrap(bar, true).__uuid].baz).toEqual(baz1._id);

    // replacing reference with value will trigger orphan removal
    bar.baz = baz2;
    await orm.em.persistAndFlush(bar);
    // @ts-ignore
    expect(orm.em.getUnitOfWork().originalEntityData[wrap(bar, true).__uuid].baz).toEqual(baz2._id);
    await expect(orm.em.findOne(FooBaz, baz1)).resolves.toBeNull();
    await expect(orm.em.findOne(FooBaz, baz2)).resolves.not.toBeNull();

    // replacing reference with null will trigger orphan removal
    bar.baz = null;
    await orm.em.persistAndFlush(bar);
    await expect(orm.em.findOne(FooBaz, baz2)).resolves.toBeNull();

    // removing bar will cascade the operation as orphan removal behaves also like cascade remove
    bar.baz = baz1;
    await orm.em.persistAndFlush(bar);
    await orm.em.removeEntity(bar, true);
    await expect(orm.em.count(FooBaz, { bar })).resolves.toBe(0);
  });

  test('loading connected entity will not update identity map for associations', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.favouriteBook = new Book('b1', author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author, author, ['favouriteBook']))!;
    expect(a).not.toBe(author);
    a.name = 'test 1';
    a.favouriteBook.title = 'test 2';
    const a1 = (await orm.em.findOne(Author, { favouriteBook: a.favouriteBook }))!;
    const b1 = (await orm.em.findOne(Book, { author }))!;
    expect(a.name).toBe('test 1');
    expect(a.favouriteBook.title).toBe('test 2');
    expect(a1.name).toBe('test 1');
    expect(b1.title).toBe('test 2');
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const a2 = (await orm.em.findOne(Author, author))!;
    const b2 = (await orm.em.findOne(Book, { author }))!;
    expect(a2.name).toBe('test 1');
    expect(b2.title).toBe('test 2');
  });

  test('getReference will not update identity map copy', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.favouriteBook = new Book('b1', author);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author, author, ['favouriteBook']))!;
    expect(a).not.toBe(author);
    a.name = 'test 1';
    a.favouriteBook.title = 'test 2';
    const a1 = orm.em.getReference(Author, a.id)!;
    const b1 = orm.em.getReference(Book, a.favouriteBook.id)!;
    expect(a.name).toBe('test 1');
    expect(a.favouriteBook.title).toBe('test 2');
    expect(a1.name).toBe('test 1');
    expect(b1.title).toBe('test 2');
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const a2 = (await orm.em.findOne(Author, author))!;
    const b2 = (await orm.em.findOne(Book, { author }))!;
    expect(a2.name).toBe('test 1');
    expect(b2.title).toBe('test 2');
  });

  test('partial selects', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author, author, { fields: ['name'] }))!;
    expect(a.name).toBe('Jon Snow');
    expect(a.email).toBeUndefined();
    expect(a.born).toBeUndefined();
  });

  test(`populating inverse side of 1:1 also back-links inverse side's owner (both eager)`, async () => {
    const bar = FooBar.create('fb');
    bar.baz = FooBaz.create('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar);
    const a = await repo.findOne(bar.id); // baz and bar are both marked as eager
    expect(wrap(a!.baz!).isInitialized()).toBe(true);
    expect(wrap(a!.baz!.bar).isInitialized()).toBe(true);
  });

  test('automatically fix PK instead of entity when flushing (m:1)', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    Object.assign(author, { favouriteBook: '0000007b5c9c61c332380f78' });
    expect(author.favouriteBook).not.toBeInstanceOf(Book);
    expect(author.favouriteBook).toBe('0000007b5c9c61c332380f78');
    await orm.em.persistAndFlush(author);
    expect(author.favouriteBook).toBeInstanceOf(Book);
    expect(author.favouriteBook.id).toBe('0000007b5c9c61c332380f78');
  });

  test('automatically fix array of PKs instead of collection when flushing (m:n)', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    const author = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('B123', author);
    await orm.em.persistAndFlush(book);

    const tag = orm.em.getReference(BookTag, '0000007b5c9c61c332380f79');
    Object.assign(book, { tags: ['0000007b5c9c61c332380f78', tag] });
    expect(book.tags).not.toBeInstanceOf(Collection);
    expect(book.tags).toEqual(['0000007b5c9c61c332380f78', tag]);
    expect(() => orm.em.persist(book)).toThrowError(`Entity of type BookTag expected for property Book.tags, '0000007b5c9c61c332380f78' of type string given. If you are using Object.assign(entity, data), use wrap(entity).assign(data, { em }) instead.`);

    wrap(book).assign({ tags: ['0000007b5c9c61c332380f78', tag] }, { em: orm.em });
    expect(book.tags).toBeInstanceOf(Collection);
    expect(book.tags[0]).toBeInstanceOf(BookTag);
    expect(book.tags[1]).toBeInstanceOf(BookTag);
    expect(book.tags[0].id).toBe('0000007b5c9c61c332380f78');
    expect(book.tags[1].id).toBe('0000007b5c9c61c332380f79');
    expect(book.tags.isInitialized()).toBe(true);
    expect(book.tags.isDirty()).toBe(true);

    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(/db\.begin\(\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.insertOne\({ createdAt: ISODate\(.*\), updatedAt: ISODate\(.*\), foo: 'bar', name: 'Jon Snow', email: 'snow@wall\.st', termsAccepted: false }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('books-table'\)\.insertOne\({ title: 'B123', author: ObjectId\('.*'\) }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[3][0]).toMatch(/db\.commit\(\);/);
    expect(mock.mock.calls[4][0]).toMatch(/db\.begin\(\);/);
    expect(mock.mock.calls[5][0]).toMatch(/db\.getCollection\('books-table'\)\.updateMany\({ _id: ObjectId\('.*'\) }, { '\$set': { tags: \[ ObjectId\('0000007b5c9c61c332380f78'\), ObjectId\('0000007b5c9c61c332380f79'\) ] } }, { session: '\[ClientSession]' }\);/);
    expect(mock.mock.calls[6][0]).toMatch(/db\.commit\(\);/);
  });

  test('automatically fix PK in collection instead of entity when flushing (m:n)', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('B123', author);
    expect(() => book.tags.set(['0000007b5c9c61c332380f78' as any])).toThrowError(`Entity of type BookTag expected for property Book.tags, '0000007b5c9c61c332380f78' of type string given.`);
  });

  test('automatically map raw results to entities when setting collection items', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bookData = { title: 'Bible', author: god.id };
    expect(() => god.books.add(bookData as any)).toThrowError(`Entity of type Book expected for property Author.books, { title: 'Bible', author: null } of type object given.`);
  });

  test('allow undefined value in nullable properties', async () => {
    let god = new Author('God', 'hello@heaven.god');
    god.age = 21;
    god.born = new Date('0001-01-01');
    await orm.em.persistAndFlush(god);

    god.age = undefined;
    god.born = undefined;
    await orm.em.flush();

    orm.em.clear();
    god = (await orm.em.findOne(Author, god.id))!;
    expect(god).toBeInstanceOf(Author);
    expect(god.age).toBeNull();
    expect(god.born).toBeNull();
  });

  test('reference wrapper', async () => {
    const author = new Author('God', 'hello@heaven.god');
    const author2 = new Author('God 2', 'hello2@heaven.god');
    await orm.em.persistAndFlush([author, author2]);
    orm.em.clear();

    const ref = orm.em.getReference<Author, 'id' | '_id'>(Author, author.id, true);
    const ref1 = orm.em.getRepository(Author).getReference<'id' | '_id'>(author.id, true);
    expect(ref).not.toBe(ref1);
    expect(ref.unwrap()).toBe(ref1.unwrap());
    expect(ref.isInitialized()).toBe(false);
    expect(typeof ref.id).toBe('string');
    expect(ref._id).toBeInstanceOf(ObjectId);
    expect(ref.unwrap()).toBeInstanceOf(Author);
    expect(wrap(ref.unwrap()).isInitialized()).toBe(false);
    expect(() => ref.getEntity()).toThrowError(`Reference<Author> ${ref.id} not initialized`);
    expect(() => ref.getProperty('email')).toThrowError(`Reference<Author> ${ref.id} not initialized`);

    const ref2 = Reference.create(author);
    const ref3 = Reference.create(ref2);
    expect(ref2).toBe(ref3);

    expect(ref3.unwrap()).toBe(author);
    ref3.set(author2);
    expect(ref3.unwrap()).toBe(author2);
    expect(ref3.id).toBe(author2.id);
    ref3.set(Reference.create(author));
    expect(ref3.id).toBe(author.id);

    const ent = await ref.load();
    expect(ent).toBeInstanceOf(Author);
    expect(wrap(ent).isInitialized()).toBe(true);
    orm.em.clear();

    const ref4 = orm.em.getReference<Author, 'id' | '_id'>(Author, author.id, true);
    expect(ref4.isInitialized()).toBe(false);
    await expect(ref4.get('name')).resolves.toBe('God');
    expect(ref4.isInitialized()).toBe(true);
    expect(ref4.getProperty('name')).toBe('God');
    await expect(ref4.get('email')).resolves.toBe('hello@heaven.god');
    expect(ref4.__populated).toBe(true);
    ref4.populated(false);
    expect(ref4.__populated).toBe(false);
    ref4.populated();
    expect(ref4.__populated).toBe(true);
    expect(ref4.__lazyInitialized).toBe(true);
    expect(ref4.__internal).toBeDefined();
    expect(ref4.__em).toBeDefined();
    expect(ref4.__uuid).toBeDefined();
    expect(ref4.toJSON()).toMatchObject({
      name: 'God',
    });

    // const wrapped = wrap(ref4);
    // console.log(wrapped);
    // expect(wrapped).toBe(ref4);
  });

  test('find and count', async () => {
    for (let i = 1; i <= 30; i++) {
      orm.em.persist(new Author('God ' + i, `hello-${i}@heaven.god`));
    }

    await orm.em.flush();
    orm.em.clear();

    const [authors1, count1] = await orm.em.findAndCount(Author, {}, { limit: 10, offset: 10 });
    expect(authors1).toHaveLength(10);
    expect(count1).toBe(30);
    expect(authors1[0]).toBeInstanceOf(Author);
    expect(authors1[0].name).toBe('God 11');
    expect(authors1[9].name).toBe('God 20');
    orm.em.clear();

    const [authors2, count2] = await orm.em.findAndCount(Author, {}, { limit: 10, offset: 25, fields: ['name'] });
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

    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    expect(mock.mock.calls.length).toBe(3);

    if (chalk.level > 0) {
      expect(mock.mock.calls[1][0]).toMatch(/\[39mdb\.getCollection\(\[33m'author'\[39m\)\.insertOne\({ \[36mcreatedAt\[39m: ISODate\(\[33m'.*'\[39m\), \[36mupdatedAt\[39m: ISODate\(\[33m'.*'\[39m\), \[36mfoo\[39m: \[33m'bar'\[39m, \[36mname\[39m: \[33m'Jon Snow'\[39m, \[36memail\[39m: \[33m'snow@wall\.st'\[39m, \[36mtermsAccepted\[39m: \[36mfalse\[39m }, { \[36msession\[39m: \[33m'\[ClientSession]'\[39m }\)/);
    }
  });

  test('findOneOrFail', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author, author.id);
    expect(a1).not.toBeNull();
    await expect(orm.em.findOneOrFail(Author, '0000007b5c9c61c332380f79')).rejects.toThrowError(`Author not found ('0000007b5c9c61c332380f79')`);
    await expect(orm.em.findOneOrFail(Author, { name: 'test' })).rejects.toThrowError('Author not found ({ name: \'test\' })');
    await expect(orm.em.findOneOrFail(Author, '0000007b5c9c61c332380f79', { failHandler: () => new Error('Test') })).rejects.toThrowError('Test');
    await expect(orm.em.findOneOrFail(Author, '0000007b5c9c61c332380f79', { failHandler: (entityName: string) => new Error(`Failed: ${entityName}`) })).rejects.toThrowError('Failed: Author');
  });

  test('setting optional boolean to false', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author, author.id);
    expect(a1.optional).toBeUndefined();
    a1.optional = false;
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author, author.id);
    expect(a2.optional).toBe(false);
  });

  test('many to many working with inverse side', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    let book4 = new Book('Another Book', author);
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist([book1, book2, book3, book4]);
    await orm.em.flush();
    orm.em.clear();

    let tag = await orm.em.findOneOrFail(BookTag, tag1.id, ['books']);
    const err = 'You cannot modify inverse side of M:N collection BookTag.books when the owning side is not initialized. Consider working with the owning side instead (Book.tags).';
    expect(() => tag.books.add(orm.em.getReference(Book, book4.id))).toThrowError(err);
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag, tag1.id, ['books']);
    book4 = await orm.em.findOneOrFail(Book, book4.id, ['tags']);
    tag.books.add(book4);
    tag.books.add(new Book('ttt', new Author('aaa', 'bbb')));
    await orm.em.flush();
    orm.em.clear();

    tag = await orm.em.findOneOrFail(BookTag, tag1.id, ['books']);
    expect(tag.books.count()).toBe(4);
  });

  test('transactions with embedded transaction', async () => {
    try {
      await orm.em.transactional(async em => {
        // this transaction should not be committed
        await em.transactional(async subEm => {
          const god1 = new Author('test', 'test@example.com');
          await subEm.persistAndFlush(god1);
        });
        throw new Error(); // rollback the transaction
      });
    } catch { }

    const res1 = await orm.em.findOne(Author, { name: 'test' });
    expect(res1).toBeNull();
  });

  test('adding items to not initialized collection', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const b1 = new Book('Bible 1', god);
    await orm.em.persistAndFlush(b1);
    orm.em.clear();

    const a = await orm.em.findOneOrFail(Author, god.id);
    expect(a.books.isInitialized()).toBe(false);
    const b2 = new Book('Bible 2');
    const b3 = new Book('Bible 3');
    a.books.add(b2, b3);
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author, god.id, ['books']);
    expect(a2.books.count()).toBe(3);
    expect(a2.books.getIdentifiers('id')).toEqual([b1.id, b2.id, b3.id]);

    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    let tag5 = new BookTag('sexy');
    a2.books[0].tags.add(tag1);
    a2.books[1].tags.add(tag1);
    a2.books[2].tags.add(tag5);
    await orm.em.flush();
    orm.em.clear();

    const a3 = await orm.em.findOneOrFail(Author, god.id, ['books']);
    tag5 = orm.em.getReference(BookTag, tag5.id);
    a3.books[0].tags.add(tag3);
    a3.books[1].tags.add(tag2, tag5);
    a3.books[2].tags.add(tag4);
    await orm.em.flush();
    orm.em.clear();

    const a4 = await orm.em.findOneOrFail(Author, god.id, ['books.tags']);
    expect(a4.books[0].tags.getIdentifiers()).toEqual([tag1.id, tag3.id]);
    expect(a4.books[1].tags.getIdentifiers()).toEqual([tag1.id, tag2.id, tag5.id]);
    expect(a4.books[2].tags.getIdentifiers()).toEqual([tag5.id, tag4.id]);
  });

  // this should run in ~600ms (when running single test locally)
  test('perf: one to many', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);

    for (let i = 1; i <= 300; i++) {
      author.books.add(new Book('My Life on The Wall, part ' + i, author));
    }

    await orm.em.flush();
    expect(author.books.getItems().every(b => b.id)).toBe(true);
  });

  test('exceptions', async () => {
    const driver = orm.em.getDriver();
    await driver.nativeInsert(Author.name, { name: 'author', email: 'email' });
    await expect(driver.nativeInsert(Author.name, { name: 'author', email: 'email' })).rejects.toThrow(UniqueConstraintViolationException);
  });

  afterAll(async () => orm.close(true));

});
