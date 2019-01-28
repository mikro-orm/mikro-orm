import { ObjectID } from 'mongodb';
import { Collection, EntityManager, EntityProperty, MikroORM } from '../lib';
import { Author, Publisher, PublisherType, Book, BookTag, Test } from './entities';
import { AuthorRepository } from './repositories/AuthorRepository';
import { initORM, wipeDatabase } from './bootstrap';
import { MongoDriver } from '../lib/drivers/MongoDriver';

/**
 * @class EntityManagerMongoTest
 */
describe('EntityManagerMongo', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persist(bible);

    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    author.favouriteBook = bible;

    const publisher = new Publisher('7K publisher', PublisherType.GLOBAL);

    const book1 = new Book('My Life on The Wall, part 1', author);
    book1.publisher = publisher;
    const book2 = new Book('My Life on The Wall, part 2', author);
    book2.publisher = publisher;
    const book3 = new Book('My Life on The Wall, part 3', author);
    book3.publisher = publisher;

    const repo = orm.em.getRepository<Book>(Book.name);
    await repo.persist(book1, false);
    await repo.persist(book2, false);
    await repo.persist(book3, false);
    await repo.flush();
    orm.em.clear();

    const publisher7k = await orm.em.getRepository<Publisher>(Publisher.name).findOne({ name: '7K publisher' });
    expect(publisher7k).not.toBeNull();
    expect(publisher7k.tests).toBeInstanceOf(Collection);
    expect(publisher7k.tests.isInitialized()).toBe(true);
    orm.em.clear();

    const authorRepository = orm.em.getRepository<Author>(Author.name);
    const booksRepository = orm.em.getRepository<Book>(Book.name);
    const books = await booksRepository.findAll(['author']);
    expect(books[0].author.isInitialized()).toBe(true);
    expect(await authorRepository.findOne({ favouriteBook: bible._id })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, ['author']);
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books', 'favouriteBook']);
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
    expect(jon.books.getIdentifiers('_id')).toBeInstanceOf(Array);
    expect(jon.books.getIdentifiers('_id')[0]).toBeInstanceOf(ObjectID);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('string');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);
        expect(book.author).toBeInstanceOf(Author);
        expect(book.author.isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Publisher);
        expect(book.publisher.isInitialized()).toBe(false);
      }
    }

    const booksByTitleAsc = await booksRepository.find({ author: jon._id }, [], { title: 1 });
    expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
    expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

    const booksByTitleDesc = await booksRepository.find({ author: jon.id }, [], { title: -1 });
    expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
    expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
    expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

    const twoBooks = await booksRepository.find({ author: jon._id }, [], { title: -1 }, 2);
    expect(twoBooks.length).toBe(2);
    expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
    expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

    const lastBook = await booksRepository.find({ author: jon.id }, ['author'], { title: -1 }, 2, 2);
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author);
    expect(lastBook[0].author.isInitialized()).toBe(true);
    await orm.em.getRepository<Book>(Book.name).remove(lastBook[0]._id);
  });

  test('should provide custom repository', async () => {
    const repo = orm.em.getRepository<Author>(Author.name) as AuthorRepository;
    expect(repo).toBeInstanceOf(AuthorRepository);
    expect(repo.magic).toBeInstanceOf(Function);
    expect(repo.magic('test')).toBe('111 test 222');
  });

  test('should throw when trying to search by entity instead of identifier', async () => {
    const repo = orm.em.getRepository<Author>(Author.name) as AuthorRepository;
    const author = new Author('name', 'email');
    await repo.persist(author);
    await expect(repo.find(author)).rejects.toThrowError('Author entity provided in search condition. Please provide identifier instead.');
    await expect(repo.find({ author })).rejects.toThrowError(`Author entity provided in search condition in field 'author'. Please provide identifier instead.`);
  });

  test('removing not yet persisted entity will not make db call', async () => {
    const author = new Author('name', 'email');
    const author2 = new Author('name2', 'email2');
    const author3 = new Author('name3', 'email3');
    const repo = orm.em.getRepository<Author>(Author.name) as AuthorRepository;
    await repo.persist(author, false);
    await repo.persist(author2, false);
    await repo.remove(author);
    expect(Object.keys(orm.em.getIdentityMap())).toEqual([`Author-${author2.id}`]);
    author2.name = 'lol';
    await repo.persist(author2, false);
    await orm.em.remove(Author.name, author3, false);
    await repo.flush();
    await orm.em.remove(Author.name, author3);
  });

  test('removing persisted entity will remove it from persist stack first', async () => {
    const author = new Author('name', 'email');
    const repo = orm.em.getRepository<Author>(Author.name) as AuthorRepository;
    await repo.persist(author);
    expect(orm.em.getIdentity(Author.name, author.id)).toBeDefined();
    author.name = 'new name';
    await repo.persist(author, false);
    await orm.em.removeEntity(author);
    expect(orm.em.getIdentity(Author.name, author.id)).toBeUndefined();
    expect(orm.em.getIdentityMap()).toEqual({});
  });

  test('should throw when trying to merge entity without id', async () => {
    const author = new Author('test', 'test');
    expect(() => orm.em.merge(Author.name, author)).toThrowError('You cannot merge entity without id!');
  });

  test('fork', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persist(bible);
    const fork = orm.em.fork();

    expect(fork).not.toBe(orm.em);
    expect(fork.getIdentityMap()).not.toBe(orm.em.getIdentityMap());
    expect(fork.entityFactory).not.toBe(orm.em.entityFactory);
    expect(fork['metadata']).toBe(orm.em['metadata']);
    expect(fork.getIdentityMap()).toEqual({});
  });

  test('findOne with empty where will throw', async () => {
    await expect(orm.em.findOne<Author>(Author.name, '')).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne<Author>(Author.name, {})).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne<Author>(Author.name, [])).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne<Author>(Author.name, undefined)).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    await expect(orm.em.findOne<Author>(Author.name, null)).rejects.toThrowError(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
  });

  test('findOne should initialize entity that is already in IM', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persist(bible);
    orm.em.clear();

    const ref = orm.em.getReference(Author.name, god.id);
    expect(ref.isInitialized()).toBe(false);
    const newGod = await orm.em.findOne(Author.name, god.id);
    expect(ref).toBe(newGod);
    expect(ref.isInitialized()).toBe(true);
  });

  test('stable results of serialization', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    const bible2 = new Book('Bible pt. 2', god);
    const bible3 = new Book('Bible pt. 3', new Author('Lol', 'lol@lol.lol'));
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = await orm.em.findOne<Author>(Author.name, god.id);
    const books = await orm.em.find<Book>(Book.name, {});
    await newGod.init(false);

    for (const book of books) {
      expect(book.toJSON()).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('stable results of serialization (collection)', async () => {
    const pub = new Publisher('Publisher2');
    await orm.em.persist(pub);
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.publisher = pub;
    const bible2 = new Book('Bible pt. 2', god);
    bible2.publisher = pub;
    const bible3 = new Book('Bible pt. 3', new Author('Lol', 'lol@lol.lol'));
    bible3.publisher = pub;
    await orm.em.persist([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = orm.em.getReference<Author>(Author.name, god.id);
    const publisher = await orm.em.findOne<Publisher>(Publisher.name, pub.id, ['books']);
    await newGod.init();

    const json = publisher.toJSON().books;

    for (const book of publisher.books) {
      expect(json.find((b: Book) => b.id === book.id)).toMatchObject({
        author: book.author.id,
      });
    }
  });

  test('should return mongo driver', async () => {
    const driver = orm.em.getDriver<MongoDriver>();
    expect(driver instanceof MongoDriver).toBe(true);
    expect(driver.getCollection(Book.name).collectionName).toBe('books-table');
    expect(await driver.findOne(BookTag.name, { foo: 'bar', books: 123 })).toBeNull();
    expect(driver.usesPivotTable()).toBe(false);
    await expect(driver.loadFromPivotTable({} as EntityProperty, [])).rejects.toThrowError('MongoDriver does not use pivot tables')
  });

  test('findOne by id', async () => {
    const authorRepository = orm.em.getRepository<Author>(Author.name);
    const jon = new Author('Jon Snow', 'snow@wall.st');
    await authorRepository.persist(jon);

    orm.em.clear();
    let author = await authorRepository.findOne(jon._id);
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = await authorRepository.findOne(jon.id);
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = await authorRepository.findOne({ id: jon.id });
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');

    orm.em.clear();
    author = await authorRepository.findOne({ _id: jon._id });
    expect(author).not.toBeNull();
    expect(author.name).toBe('Jon Snow');
  });

  test('populate ManyToOne relation', async () => {
    const authorRepository = orm.em.getRepository<Author>(Author.name);
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persist(bible);

    let jon = new Author('Jon Snow', 'snow@wall.st');
    jon.born = new Date();
    jon.favouriteBook = bible;
    await orm.em.persist(jon);
    orm.em.clear();

    jon = await authorRepository.findOne(jon.id);
    expect(jon).not.toBeNull();
    expect(jon.name).toBe('Jon Snow');
    expect(jon.favouriteBook).toBeInstanceOf(Book);
    expect(jon.favouriteBook.isInitialized()).toBe(false);

    await jon.favouriteBook.init();
    expect(jon.favouriteBook).toBeInstanceOf(Book);
    expect(jon.favouriteBook.isInitialized()).toBe(true);
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

    await orm.em.persist(book1, false);
    await orm.em.persist(book2, false);
    await orm.em.persist(book3);

    expect(tag1._id).toBeDefined();
    expect(tag2._id).toBeDefined();
    expect(tag3._id).toBeDefined();
    expect(tag4._id).toBeDefined();
    expect(tag5._id).toBeDefined();
    expect(book1.tags.toArray()).toEqual([tag1.toJSON(), tag3.toJSON()]);

    // test inverse side
    const tagRepository = orm.em.getRepository<BookTag>(BookTag.name);
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
    tags = await orm.em.find<BookTag>(BookTag.name);
    expect(tags[0].books.isInitialized()).toBe(false);
    expect(tags[0].books.isDirty()).toBe(false);
    expect(() => tags[0].books.getItems()).toThrowError(/Collection Book\[] of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.add(book1)).toThrowError(/Collection Book\[] of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.remove(book1, book2)).toThrowError(/Collection Book\[] of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.removeAll()).toThrowError(/Collection Book\[] of entity BookTag\[\w{24}] not initialized/);
    expect(() => tags[0].books.contains(book1)).toThrowError(/Collection Book\[] of entity BookTag\[\w{24}] not initialized/);

    // test M:N lazy init
    orm.em.clear();
    await tags[0].books.init();
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books.getItems()[0]).toBeInstanceOf(Book);
    expect(tags[0].books.getItems()[0]._id).toBeDefined();
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);

    // test M:N lazy init
    orm.em.clear();
    let book = await orm.em.findOne<Book>(Book.name, { tags: tag1._id });
    expect(book.tags.isInitialized()).toBe(true); // owning side is always initialized
    expect(book.tags.count()).toBe(2);
    expect(book.tags.getItems()[0]).toBeInstanceOf(BookTag);
    expect(book.tags.getItems()[0]._id).toBeDefined();
    expect(book.tags.getItems()[0].isInitialized()).toBe(false);
    await book.tags.init();
    expect(book.tags.getItems()[0].isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tag1, tag5); // tag5 will be ignored as it is not part of collection
    await orm.em.persist(book);
    orm.em.clear();
    book = await orm.em.findOne<Book>(Book.name, book._id);
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tag1);
    await orm.em.persist(book);
    orm.em.clear();
    book = await orm.em.findOne<Book>(Book.name, book._id);
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
    book = await orm.em.findOne<Book>(Book.name, book._id);
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
    await orm.em.persist([p1, p2]);
    const repo = orm.em.getRepository<Publisher>(Publisher.name);

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
    expect(publishers[1].tests.getItems()[0].isInitialized()).toBe(true);
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
    await orm.em.persist([book1, book2, book3]);
    const repo = orm.em.getRepository<BookTag>(BookTag.name);

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
    expect(tags[0].books.getItems()[0].isInitialized()).toBe(true);
  });

  test('nested populating', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    book1.publisher = new Publisher('B1 publisher');
    book1.publisher.tests.add(Test.create('t11'), Test.create('t12'));
    book2.publisher = new Publisher('B2 publisher');
    book2.publisher.tests.add(Test.create('t21'), Test.create('t22'));
    book3.publisher = new Publisher('B3 publisher');
    book3.publisher.tests.add(Test.create('t31'), Test.create('t32'));
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persist([book1, book2, book3]);
    const repo = orm.em.getRepository<BookTag>(BookTag.name);

    orm.em.clear();
    const tags = await repo.findAll(['books.publisher.tests', 'books.author']);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books[0].isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author);
    expect(tags[0].books[0].author.isInitialized()).toBe(true);
    expect(tags[0].books[0].author.name).toBe('Jon Snow');
    expect(tags[0].books[0].publisher).toBeInstanceOf(Publisher);
    expect(tags[0].books[0].publisher.isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher.tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher.tests.count()).toBe(2);
    expect(tags[0].books[0].publisher.tests[0].name).toBe('t11');
    expect(tags[0].books[0].publisher.tests[1].name).toBe('t12');

    orm.em.clear();
    const books = await orm.em.find<Book>(Book.name, {}, ['publisher.tests', 'author']);
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book);
    expect(books[0].isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author);
    expect(books[0].author.isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Publisher);
    expect(books[0].publisher.isInitialized()).toBe(true);
    expect(books[0].publisher.tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher.tests.count()).toBe(2);
    expect(books[0].publisher.tests[0].name).toBe('t11');
    expect(books[0].publisher.tests[1].name).toBe('t12');
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
    await orm.em.persist([book1, book2, book3]);
    const repo = orm.em.getRepository<BookTag>(BookTag.name);

    orm.em.clear();
    const tags = await repo.findAll(['books.publisher.tests']);
    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(tags[0].books[0].isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher).toBeUndefined();
  });

  test('populating one to many relation', async () => {
    let author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    await orm.em.persist([book1, book2, book3]);
    const repo = orm.em.getRepository<Author>(Author.name);

    orm.em.clear();
    author = await repo.findOne(author.id);
    expect(author.books).toBeInstanceOf(Collection);
    expect(author.books.isInitialized(true)).toBe(false);
    await author.books.init();
    expect(author.books.isInitialized(true)).toBe(true);
    expect(author.books.count()).toBe(3);
  });

  test('hooks', async () => {
    Author.beforeDestroyCalled = 0;
    Author.afterDestroyCalled = 0;
    const repo = orm.em.getRepository<Author>(Author.name);
    const author = new Author('Jon Snow', 'snow@wall.st');
    expect(author.id).toBeNull();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();

    await repo.persist(author);
    expect(author.id).not.toBeNull();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await repo.persist(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author.beforeDestroyCalled).toBe(0);
    expect(Author.afterDestroyCalled).toBe(0);
    await repo.remove(author);
    expect(Author.beforeDestroyCalled).toBe(1);
    expect(Author.afterDestroyCalled).toBe(1);

    const author2 = new Author('Johny Cash', 'johny@cash.com');
    await repo.persist(author2);
    await repo.remove(author2);
    expect(Author.beforeDestroyCalled).toBe(2);
    expect(Author.afterDestroyCalled).toBe(2);
  });

  test('canPopulate', async () => {
    const repo = orm.em.getRepository<Author>(Author.name);
    expect(repo.canPopulate('test')).toBe(false);
    expect(repo.canPopulate('name')).toBe(false);
    expect(repo.canPopulate('favouriteBook')).toBe(true);
    expect(repo.canPopulate('books')).toBe(true);
  });

  test('trying to populate non-existing or non-reference property will throw', async () => {
    const repo = orm.em.getRepository<Author>(Author.name);
    const author = new Author('Johny Cash', 'johny@cash.com');
    await repo.persist(author);
    orm.em.clear();

    await expect(repo.findAll(['tests'])).rejects.toThrowError(`Entity 'Author' does not have property 'tests'`);
    await expect(repo.findOne(author.id, ['tests'])).rejects.toThrowError(`Entity 'Author' does not have property 'tests'`);
  });

  test('many to many collection does have fixed order', async () => {
    const repo = orm.em.getRepository<Publisher>(Publisher.name);
    const publisher = new Publisher();
    const t1 = Test.create('t1');
    const t2 = Test.create('t2');
    const t3 = Test.create('t3');
    await orm.em.persist([t1, t2, t3]);
    publisher.tests.add(t2, t1, t3);
    await repo.persist(publisher);
    orm.em.clear();

    const ent = await repo.findOne(publisher.id);
    await expect(ent.tests.count()).toBe(3);
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);

    await ent.tests.init();
    await expect(ent.tests.getIdentifiers()).toEqual([t2.id, t1.id, t3.id]);
  });

  test('property onUpdate hook (updatedAt field)', async () => {
    const repo = orm.em.getRepository<Author>(Author.name);
    const author = new Author('name', 'email');
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
    const ent = await repo.findOne(author.id);
    await expect(ent.createdAt).toBeDefined();
    await expect(ent.updatedAt).toBeDefined();
    await expect(ent.updatedAt).not.toEqual(ent.createdAt);
    await expect(ent.updatedAt > ent.createdAt).toBe(true);
  });

  test('EM supports native insert/update/delete/aggregate', async () => {
    orm.em.options.debug = false;
    const res1 = await orm.em.nativeInsert(Author.name, { name: 'native name 1' });
    expect(res1).toBeInstanceOf(ObjectID);

    const res2 = await orm.em.nativeUpdate(Author.name, { name: 'native name 1' }, { name: 'new native name' });
    expect(res2).toBe(1);

    const res3 = await orm.em.aggregate(Author.name, [{ $match: { name: 'new native name' } }]);
    expect(res3.length).toBe(1);
    expect(res3[0]).toMatchObject({ name: 'new native name' });

    const res4 = await orm.em.nativeDelete(Author.name, { name: 'new native name' });
    expect(res4).toBe(1);

    const res5 = await orm.em.nativeInsert(Author.name, { createdAt: new Date('1989-11-17'), updatedAt: new Date('2018-10-28'), name: 'native name 2' });
    expect(res5).toBeInstanceOf(ObjectID);

    const res6 = await orm.em.nativeUpdate(Author.name, { name: 'native name 2' }, { name: 'new native name', updatedAt: new Date('2018-10-28') });
    expect(res6).toBe(1);
  });

  test('EM do not support transactions', async () => {
    await expect(orm.em.begin()).rejects.toThrowError('Transactions are not supported by MongoDriver driver');
    await expect(orm.em.rollback()).rejects.toThrowError('Transactions are not supported by MongoDriver driver');
    await expect(orm.em.commit()).rejects.toThrowError('Transactions are not supported by MongoDriver driver');
  });

  afterAll(async () => orm.close(true));

});
