import { MikroORM, Logger, LoadStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2 } from '../../entities-sql';
import { initORMMySql, wipeDatabaseMySql } from '../../bootstrap';

describe('partial loading (mysql)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));
  afterAll(async () => orm.close(true));

  test('partial selects', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = new Date('1990-03-23');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author2, author, { fields: ['name'] }))!;
    expect(a.name).toBe('Jon Snow');
    expect(a.email).toBeUndefined();
    expect(a.born).toBeUndefined();
  });

  test('partial nested loading (1:m)', async () => {
    const god = new Author2(`God `, `hello@heaven.god`);
    const b1 = new Book2(`Bible 1`, god);
    b1.price = 123;
    const b2 = new Book2(`Bible 2`, god);
    b2.price = 456;
    const b3 = new Book2(`Bible 3`, god);
    b3.price = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(Author2, god, { fields: ['id', 'books.author', 'books.title'], populate: ['books'] });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].books[0].uuid).toBe(b1.uuid);
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id` from `author2` as `e0` where `e0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`author_id`, `e0`.`title` from `book2` as `e0` where `e0`.`author_id` is not null and `e0`.`author_id` in (?) order by `e0`.`title` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Author2, god, { fields: ['id', { books: ['uuid', 'author', 'title'] }], populate: ['books'] });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBeUndefined();
    expect(r2[0].books[0].uuid).toBe(b1.uuid);
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].price).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id` from `author2` as `e0` where `e0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`author_id`, `e0`.`title` from `book2` as `e0` where `e0`.`author_id` is not null and `e0`.`author_id` in (?) order by `e0`.`title` asc');
  });

  test('partial nested loading (m:1)', async () => {
    const god = new Author2(`God `, `hello@heaven.god`);
    const b1 = new Book2(`Bible 1`, god);
    b1.price = 123;
    const b2 = new Book2(`Bible 2`, god);
    b2.price = 456;
    const b3 = new Book2(`Bible 3`, god);
    b3.price = 789;
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(Book2, b1, { fields: ['uuid', 'title', 'author', 'author.email'], populate: ['author'], filters: false });
    expect(r1).toHaveLength(1);
    expect(r1[0].uuid).toBe(b1.uuid);
    expect(r1[0].title).toBe('Bible 1');
    expect(r1[0].price).toBeUndefined();
    expect(r1[0].author).toBeDefined();
    expect(r1[0].author.id).toBe(god.id);
    expect(r1[0].author.name).toBeUndefined();
    expect(r1[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e0`.`author_id` from `book2` as `e0` where `e0`.`uuid_pk` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`id`, `e0`.`email` from `author2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Book2, b1, { fields: ['uuid', 'title', 'author', { author: ['email'] }], populate: ['author'], filters: false });
    expect(r2).toHaveLength(1);
    expect(r2[0].uuid).toBe(b1.uuid);
    expect(r2[0].title).toBe('Bible 1');
    expect(r2[0].price).toBeUndefined();
    expect(r2[0].author).toBeDefined();
    expect(r2[0].author.id).toBe(god.id);
    expect(r2[0].author.name).toBeUndefined();
    expect(r2[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e0`.`author_id` from `book2` as `e0` where `e0`.`uuid_pk` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`id`, `e0`.`email` from `author2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
  });

  test('partial nested loading (m:n)', async () => {
    const god = new Author2(`God `, `hello@heaven.god`);
    const b1 = new Book2(`Bible 1`, god);
    b1.price = 123;
    b1.tags.add(new BookTag2('t1'), new BookTag2('t2'));
    const b2 = new Book2(`Bible 2`, god);
    b2.price = 456;
    b2.tags.add(new BookTag2('t3'), new BookTag2('t4'));
    const b3 = new Book2(`Bible 3`, god);
    b3.price = 789;
    b3.tags.add(new BookTag2('t5'), new BookTag2('t6'));
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(BookTag2, {}, { fields: ['name', 'books.title'], populate: ['books'], filters: false });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name` from `book_tag2` as `e0`');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e1`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `e1`.`book_tag2_id` as `fk__book_tag2_id`, `e2`.`id` as `test_id` from `book2` as `e0` left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` where `e1`.`book_tag2_id` in (?, ?, ?, ?, ?, ?) order by `e1`.`order` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag2, { name: 't1' }, { fields: ['name', { books: ['title'] }], populate: ['books'], filters: false });
    expect(r2).toHaveLength(1);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].price).toBeUndefined();
    expect(r2[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name` from `book_tag2` as `e0` where `e0`.`name` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e1`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `e1`.`book_tag2_id` as `fk__book_tag2_id`, `e2`.`id` as `test_id` from `book2` as `e0` left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` where `e1`.`book_tag2_id` in (?) order by `e1`.`order` asc');
  });

  async function createEntities() {
    const god = new Author2(`God `, `hello@heaven.god`);
    const b1 = new Book2(`Bible 1`, god);
    b1.price = 123;
    b1.tags.add(new BookTag2('t1'), new BookTag2('t2'));
    const b2 = new Book2(`Bible 2`, god);
    b2.price = 456;
    b2.tags.add(new BookTag2('t3'), new BookTag2('t4'));
    const b3 = new Book2(`Bible 3`, god);
    b3.price = 789;
    b3.tags.add(new BookTag2('t5'), new BookTag2('t6'));
    await orm.em.persistAndFlush(god);
    orm.em.clear();
    return god;
  }

  test('partial nested loading (dot notation)', async () => {
    const god = await createEntities();
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r1 = await orm.em.find(BookTag2, {}, { fields: ['name', 'books.title', 'books.author', 'books.author.email'], populate: ['books.author'], filters: false });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(r1[0].books[0].author.id).toBeDefined();
    expect(r1[0].books[0].author.name).toBeUndefined();
    expect(r1[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name` from `book_tag2` as `e0`');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e0`.`author_id`, `e1`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `e1`.`book_tag2_id` as `fk__book_tag2_id`, `e2`.`id` as `test_id` from `book2` as `e0` left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` where `e1`.`book_tag2_id` in (?, ?, ?, ?, ?, ?) order by `e1`.`order` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `e0`.`id`, `e0`.`email` from `author2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
  });

  test('partial nested loading (with joined strategy and dot notation)', async () => {
    const god = await createEntities();
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r3 = await orm.em.find(BookTag2, {}, {
      fields: ['name', 'books.title', 'books.author', 'books.author.email'],
      populate: ['books.author'],
      filters: false,
      strategy: LoadStrategy.JOINED,
    });
    expect(r3).toHaveLength(6);
    expect(r3[0].name).toBe('t1');
    expect(r3[0].books[0].title).toBe('Bible 1');
    expect(r3[0].books[0].price).toBeUndefined();
    expect(r3[0].books[0].author).toBeDefined();
    expect(r3[0].books[0].author.id).toBeDefined();
    expect(r3[0].books[0].author.name).toBeUndefined();
    expect(r3[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name`, ' +
      '`b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`title` as `b1__title`, `b1`.`author_id` as `b1__author_id`, ' +
      '`a3`.`id` as `a3__id`, `a3`.`email` as `a3__email` ' +
      'from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
      'left join `book2` as `b1` on `e2`.`book2_uuid_pk` = `b1`.`uuid_pk` ' +
      'left join `author2` as `a3` on `b1`.`author_id` = `a3`.`id`');
  });

  test('partial nested loading (object notation)', async () => {
    const god = await createEntities();
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r2 = await orm.em.find(BookTag2, {}, { fields: ['name', { books: ['title', 'author', { author: ['email'] }] } ], populate: ['books.author'], filters: false });
    expect(r2).toHaveLength(6);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].price).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(r2[0].books[0].author.id).toBeDefined();
    expect(r2[0].books[0].author.name).toBeUndefined();
    expect(r2[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name` from `book_tag2` as `e0`');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.`uuid_pk`, `e0`.`title`, `e0`.`author_id`, `e1`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `e1`.`book_tag2_id` as `fk__book_tag2_id`, `e2`.`id` as `test_id` from `book2` as `e0` left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` where `e1`.`book_tag2_id` in (?, ?, ?, ?, ?, ?) order by `e1`.`order` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `e0`.`id`, `e0`.`email` from `author2` as `e0` where `e0`.`id` in (?) order by `e0`.`id` asc');
  });

  test('partial nested loading (with joined strategy)', async () => {
    const god = await createEntities();
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const r3 = await orm.em.find(BookTag2, {}, {
      fields: ['name', { books: ['title', 'author', { author: ['email'] }] } ],
      populate: ['books.author'],
      filters: false,
      strategy: LoadStrategy.JOINED,
    });
    expect(r3).toHaveLength(6);
    expect(r3[0].name).toBe('t1');
    expect(r3[0].books[0].title).toBe('Bible 1');
    expect(r3[0].books[0].price).toBeUndefined();
    expect(r3[0].books[0].author).toBeDefined();
    expect(r3[0].books[0].author.id).toBeDefined();
    expect(r3[0].books[0].author.name).toBeUndefined();
    expect(r3[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`name`, ' +
      '`b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`title` as `b1__title`, `b1`.`author_id` as `b1__author_id`, ' +
      '`a3`.`id` as `a3__id`, `a3`.`email` as `a3__email` ' +
      'from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
      'left join `book2` as `b1` on `e2`.`book2_uuid_pk` = `b1`.`uuid_pk` ' +
      'left join `author2` as `a3` on `b1`.`author_id` = `a3`.`id`');
  });

});
