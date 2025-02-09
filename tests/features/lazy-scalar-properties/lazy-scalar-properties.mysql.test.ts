import type { MikroORM } from '@mikro-orm/core';
import { ref, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, mockLogger } from '../../bootstrap.js';
import { Author2, Book2 } from '../../entities-sql/index.js';

describe('lazy scalar properties (mysql)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql(undefined, undefined, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('lazy scalar properties (select-in)', async () => {
    orm.config.set('loadStrategy', 'select-in');

    const book = new Book2('b', new Author2('n', 'e'));
    book.perex = ref('123');
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, {}, { populate: ['books'] });
    expect(r1[0].books[0].perex?.unwrap()).not.toBe('123');
    await wrap(r1[0]).populate(['books.perex']);
    expect(r1[0].books[0].perex?.unwrap()).toBe('123');
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`perex` from `book2` as `b0` where `b0`.`author_id` is not null and `b0`.`uuid_pk` in (?)');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r2 = await orm.em.find(Author2, {}, { populate: ['books.perex'] });
    expect(r2[0].books[0].perex?.get()).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r3 = await orm.em.findOne(Author2, book.author, { populate: ['books'] });
    expect(r3!.books[0].perex?.unwrap()).not.toBe('123');
    await expect(r3!.books[0].perex?.load()).resolves.toBe('123');
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`perex` from `book2` as `b0` where `b0`.`author_id` is not null and `b0`.`uuid_pk` in (?)');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r4 = await orm.em.findOne(Author2, book.author, { populate: ['books.perex'] });
    expect(r4!.books[0].perex?.$).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');
  });

  test('lazy scalar properties (joined)', async () => {
    orm.config.set('loadStrategy', 'joined');

    const book = new Book2('b', new Author2('n', 'e'));
    book.perex = ref('123');
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, {}, { populate: ['books'] });
    expect(r1[0].books[0].perex?.unwrap()).not.toBe('123');
    await wrap(r1[0]).populate(['books.perex']);
    expect(r1[0].books[0].perex?.unwrap()).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`price` as `b1__price`, `b1`.price * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'order by `b1`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r2 = await orm.em.find(Author2, {}, { populate: ['books.perex'] });
    expect(r2[0].books[0].perex?.get()).toBe('123');
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`perex` as `b1__perex`, `b1`.`price` as `b1__price`, `b1`.price * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a2`.`author_id` as `a2__author_id` ' +
      'from `author2` as `a0` ' +
      'left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null ' +
      'left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` ' +
      'order by `b1`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r3 = await orm.em.findOne(Author2, book.author, { populate: ['books'] });
    expect(r3!.books[0].perex?.unwrap()).not.toBe('123');
    await expect(r3!.books[0].perex?.load()).resolves.toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`price` as `b1__price`, `b1`.price * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a2`.`author_id` as `a2__author_id` from `author2` as `a0` left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` where `a0`.`id` = ? order by `b1`.`title` asc');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`perex` from `book2` as `b0` where `b0`.`author_id` is not null and `b0`.`uuid_pk` in (?)');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r4 = await orm.em.findOne(Author2, book.author, { populate: ['books.perex'] });
    expect(r4!.books[0].perex?.$).toBe('123');
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`perex` as `b1__perex`, `b1`.`price` as `b1__price`, `b1`.price * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a2`.`author_id` as `a2__author_id` from `author2` as `a0` left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` where `a0`.`id` = ? order by `b1`.`title` asc');
  });

  test('em.populate() respects lazy scalar properties', async () => {
    const book = new Book2('b', new Author2('n', 'e'));
    book.perex = ref('123');
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, {});
    await orm.em.populate(r1, ['books']);
    expect(r1[0].books[0].perex?.unwrap()).not.toBe('123');
    await orm.em.populate(r1, ['books.perex']);
    expect(r1[0].books[0].perex?.unwrap()).toBe('123');

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` from `book2` as `b0` left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` where `b0`.`author_id` is not null and `b0`.`author_id` in (?) order by `b0`.`title` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`perex` from `book2` as `b0` where `b0`.`author_id` is not null and `b0`.`uuid_pk` in (?)');

    mock.mockReset();
    await orm.em.flush(); // no queries should be made, as the lazy property should be merged to entity snapshot
    expect(mock.mock.calls).toHaveLength(0);
  });

});
