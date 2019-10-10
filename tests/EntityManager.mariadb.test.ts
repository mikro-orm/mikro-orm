import { v4 } from 'uuid';

import { Collection, EntityManager, MikroORM, QueryOrder, wrap } from '../lib';
import { Author2, Book2, BookTag2, Publisher2, PublisherType } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { MariaDbDriver } from '../lib/drivers/MariaDbDriver';

describe('EntityManagerMariaDb', () => {

  jest.setTimeout(10000);
  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql('mariadb'));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
  });

  test('should return mysql driver', async () => {
    const driver = orm.em.getDriver<MariaDbDriver>();
    expect(driver).toBeInstanceOf(MariaDbDriver);
    await expect(driver.findOne(Book2.name, { double: 123 })).resolves.toBeNull();
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name'});
    expect((await driver.nativeInsert(Book2.name, { uuid: v4(), tags: [tag.insertId] })).insertId).not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('insert into test2 (name) values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
      warningStatus: 0,
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      warningStatus: 0,
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 0,
      warningStatus: 0,
    });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find(BookTag2.name, { books: { $in: [1] } })).resolves.not.toBeNull();
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver<MariaDbDriver>();
    const err1 = /insert into `not_existing` \(`foo`\) values \('bar'\) - \(conn=\d+, no: \d+, SQLState: \w+\) Table 'mikro_orm_test\.not_existing' doesn't exist/;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrowError(err1);
    const err2 = /delete from `not_existing` - \(conn=\d+, no: \d+, SQLState: \w+\) Table 'mikro_orm_test\.not_existing' doesn't exist/;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrowError(err2);
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);

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
      born: jon.born,
      email: 'snow@wall.st',
      name: 'Jon Snow',
    });
    expect(wrap(jon).toJSON()).toEqual(o);
    expect(jon.books.getIdentifiers()).toBeInstanceOf(Array);
    expect(typeof jon.books.getIdentifiers()[0]).toBe('string');

    for (const author of authors) {
      expect(author.books).toBeInstanceOf(Collection);
      expect(author.books.isInitialized()).toBe(true);

      // iterator test
      for (const book of author.books) {
        expect(book.title).toMatch(/My Life on The Wall, part \d/);

        expect(book.author).toBeInstanceOf(Author2);
        expect(wrap(book.author).isInitialized()).toBe(true);
        expect(book.publisher).toBeInstanceOf(Publisher2);
        expect(wrap(book.publisher).isInitialized()).toBe(false);
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
    await orm.em.getRepository(Book2).remove(lastBook[0].uuid);
  });

  afterAll(async () => orm.close(true));

});
