import { v4 } from 'uuid';
import { Collection, EntityManager, MikroORM, QueryFlag, QueryOrder, Reference, wrap } from '@mikro-orm/core';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { Author2, Book2, BookTag2, Publisher2, PublisherType } from './entities-sql/index.js';
import { initORMMySql, mockLogger } from './bootstrap.js';

describe('EntityManagerMariaDb', () => {

  let orm: MikroORM<MariaDbDriver>;

  beforeAll(async () => orm = await initORMMySql<MariaDbDriver>('mariadb', {}, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
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

  test('should return mariadb driver', async () => {
    const driver = orm.em.getDriver();
    expect(driver).toBeInstanceOf(MariaDbDriver);
    await expect(driver.findOne<Book2>(Book2.name, { double: 123 })).resolves.toBeNull();
    const author = await driver.nativeInsert(Author2.name, { name: 'name', email: 'email' });
    const tag = await driver.nativeInsert(BookTag2.name, { name: 'tag name' });
    expect((await driver.nativeInsert(Book2.name, { uuid: v4(), author: author.insertId, tags: [tag.insertId] })).insertId).not.toBeNull();
    await expect(driver.getConnection().execute('select 1 as count')).resolves.toEqual([{ count: 1 }]);
    await expect(driver.getConnection().execute('select 1 as count', [], 'get')).resolves.toEqual({ count: 1 });
    await expect(driver.getConnection().execute('select 1 as count', [], 'run')).resolves.toEqual({
      affectedRows: 1,
      row: {
        count: 1,
      },
      rows: [
        {
          count: 1,
        },
      ],
    });
    await expect(driver.getConnection().execute('insert into test2 (name) values (?)', ['test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      insertId: 1,
      rows: [],
    });
    await expect(driver.getConnection().execute('update test2 set name = ? where name = ?', ['test 2', 'test'], 'run')).resolves.toEqual({
      affectedRows: 1,
      rows: [],
    });
    await expect(driver.getConnection().execute('delete from test2 where name = ?', ['test 2'], 'run')).resolves.toEqual({
      affectedRows: 1,
      rows: [],
    });
    expect(driver.getPlatform().denormalizePrimaryKey(1)).toBe(1);
    expect(driver.getPlatform().denormalizePrimaryKey('1')).toBe('1');
    await expect(driver.find<BookTag2>(BookTag2.name, { books: { $in: ['1'] } })).resolves.not.toBeNull();

    // multi inserts
    const res = await driver.nativeInsertMany(Publisher2.name, [
      { name: 'test 1', type: PublisherType.GLOBAL },
      { name: 'test 2', type: PublisherType.LOCAL },
      { name: 'test 3', type: PublisherType.GLOBAL },
    ]);

    // mysql returns the first inserted id
    expect(res).toMatchObject({ insertId: 1, affectedRows: 3, row: { id: 1 }, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const res2 = await driver.find(Publisher2.name, {});
    expect(res2).toMatchObject([
      { id: 1, name: 'test 1', type: PublisherType.GLOBAL },
      { id: 2, name: 'test 2', type: PublisherType.LOCAL },
      { id: 3, name: 'test 3', type: PublisherType.GLOBAL },
    ]);
  });

  test('driver appends errored query', async () => {
    const driver = orm.em.getDriver();
    const err1 = /Table 'mikro_orm_test_\w+\.not_existing' doesn't exist/;
    await expect(driver.nativeInsert('not_existing', { foo: 'bar' })).rejects.toThrow(err1);
    const err2 = /Table 'mikro_orm_test_\w+\.not_existing' doesn't exist/;
    await expect(driver.nativeDelete('not_existing', {})).rejects.toThrow(err2);
  });

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    await orm.em.persistAndFlush(bible);

    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    author.favouriteBook = bible;

    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);

    // as we order by Book.createdAt when populating collection, we need to make sure values will be sequential
    const book1 = new Book2('My Life on The Wall, part 1', author);
    book1.createdAt = new Date(Date.now() + 1);
    book1.publisher = wrap(publisher).toReference();
    const book2 = new Book2('My Life on The Wall, part 2', author);
    book2.createdAt = new Date(Date.now() + 2);
    book2.publisher = wrap(publisher).toReference();
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book3.createdAt = new Date(Date.now() + 3);
    book3.publisher = wrap(publisher).toReference();

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
    expect(await authorRepository.findOne({ favouriteBook: bible.uuid })).not.toBe(null);
    orm.em.clear();

    const noBooks = await booksRepository.find({ title: 'not existing' }, { populate: ['author'] });
    expect(noBooks.length).toBe(0);
    orm.em.clear();

    const jon = (await authorRepository.findOne({ name: 'Jon Snow' }, { populate: ['books', 'favouriteBook'] }))!;
    const authors = await authorRepository.findAll({ populate: ['books', 'favouriteBook'] });
    expect(await authorRepository.findOne({ email: 'not existing' })).toBeNull();

    // full text search test
    const fullTextBooks = (await booksRepository.find({ title: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);

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
      // born: '1990-03-23', // mariadb driver currently does not work with forced UTC timezone
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

    const lastBook = await booksRepository.find({ author: jon.id }, {
      populate: ['author'],
      orderBy: { title: QueryOrder.DESC },
      limit: 2,
      offset: 2,
    });
    expect(lastBook.length).toBe(1);
    expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
    expect(lastBook[0].author).toBeInstanceOf(Author2);
    expect(wrap(lastBook[0].author).isInitialized()).toBe(true);
    await orm.em.remove(lastBook[0]).flush();
  });

  test('pagination', async () => {
    for (let i = 1; i <= 10; i++) {
      const num = `${i}`.padStart(2, '0');
      const god = new Author2(`God ${num}`, `hello${num}@heaven.god`);
      const b1 = new Book2(`Bible ${num}.1`, god);
      const b2 = new Book2(`Bible ${num}.2`, god);
      const b3 = new Book2(`Bible ${num}.3`, god);
      await orm.em.persistAndFlush([b1, b2, b3]);
      orm.em.persist(god);
    }

    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // without paginate flag it fails to get only 2 records (we need to explicitly disable it)
    const res1 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      limit: 5,
      groupBy: ['id', 'name', 'b1.title'],
      having: { $or: [{ age: { $gt: 0 } }, { age: { $lte: 0 } }, { age: null }] }, // no-op just for testing purposes
      strategy: 'select-in',
    });

    expect(res1).toHaveLength(2);
    expect(res1.map(a => a.name)).toEqual(['God 01', 'God 02']);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.`title` like ? ' +
      'group by `a0`.`id`, `a0`.`name`, `b1`.`title` ' +
      'having (`a0`.`age` > ? or `a0`.`age` <= ? or `a0`.`age` is null) ' +
      'order by `a0`.`name` asc, `b1`.`title` asc ' +
      'limit ?');

    // with paginate flag (and a bit of dark sql magic) we get what we want
    const res2 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      offset: 3,
      limit: 5,
      flags: [QueryFlag.PAGINATE],
      strategy: 'select-in',
    });

    expect(res2).toHaveLength(5);
    expect(res2.map(a => a.name)).toEqual(['God 04', 'God 05', 'God 06', 'God 07', 'God 08']);
    expect(mock.mock.calls[1][0]).toMatch('select `a0`.*, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where (json_contains((select json_arrayagg(`a0`.`id`) from (select `a0`.`id` from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'where `b1`.`title` like \'Bible%\' ' +
      'group by `a0`.`id` ' +
      'order by min(`a0`.`name`) asc, min(`b1`.`title`) asc limit 5 offset 3) as `a0`), `a0`.`id`)) ' +
      'order by `a0`.`name` asc, `b1`.`title` asc');

    // with paginate flag without offset
    const res3 = await orm.em.find(Author2, { books: { title: /^Bible/ } }, {
      orderBy: { name: QueryOrder.ASC, books: { title: QueryOrder.ASC } },
      limit: 5,
      flags: [QueryFlag.PAGINATE],
    });

    expect(res3).toHaveLength(5);
    expect(res3.map(a => a.name)).toEqual(['God 01', 'God 02', 'God 03', 'God 04', 'God 05']);
  });

});
