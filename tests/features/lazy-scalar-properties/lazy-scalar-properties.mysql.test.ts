import type { MikroORM } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, mockLogger, wipeDatabaseMySql } from '../../bootstrap';
import { Author2, Book2 } from '../../entities-sql';

describe('lazy scalar properties (mysql)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql(undefined, undefined, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('lazy scalar properties', async () => {
    const book = new Book2('b', new Author2('n', 'e'));
    book.perex = '123';
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, {}, { populate: ['books'] });
    expect(r1[0].books[0].perex).not.toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `address_author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r2 = await orm.em.find(Author2, {}, { populate: ['books.perex'] });
    expect(r2[0].books[0].perex).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `address_author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r3 = await orm.em.findOne(Author2, book.author, { populate: ['books'] });
    expect(r3!.books[0].perex).not.toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `address_author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const r4 = await orm.em.findOne(Author2, book.author, { populate: ['books.perex'] });
    expect(r4!.books[0].perex).toBe('123');
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `address_author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`author_id` in (?) ' +
      'order by `b0`.`title` asc');
  });

  test('em.populate() respects lazy scalar properties', async () => {
    const book = new Book2('b', new Author2('n', 'e'));
    book.perex = '123';
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, {});
    await orm.em.populate(r1, ['books']);
    expect(r1[0].books[0].perex).not.toBe('123');
    await orm.em.populate(r1, ['books.perex']);
    expect(r1[0].books[0].perex).toBe('123');

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `a1`.`author_id` as `address_author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id`');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` from `book2` as `b0` left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` where `b0`.`author_id` is not null and `b0`.`author_id` in (?) order by `b0`.`title` asc, `b0`.`author_id` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`perex` from `book2` as `b0` where `b0`.`author_id` is not null and `b0`.`uuid_pk` in (?)');

    mock.mockReset();
    await orm.em.flush(); // no queries should be made, as the lazy property should be merged to entity snapshot
    expect(mock.mock.calls).toHaveLength(0);
  });

  afterAll(async () => orm.close(true));

});
