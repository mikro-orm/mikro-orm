import type { MikroORM } from '@mikro-orm/core';
import { Logger, QueryOrder } from '@mikro-orm/core';
import { Author2, Book2 } from '../../entities-sql';
import type { MySqlDriver } from '@mikro-orm/mysql-base';
import { initORMMySql, wipeDatabaseMySql } from '../../bootstrap';

describe('filters [mysql]', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));
  afterAll(async () => orm.close(true));

  test('filters', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    author.books.add(book1, book2, book3);
    const god = new Author2('God', 'hello@heaven.god');
    const bible1 = new Book2('Bible', god);
    const bible2 = new Book2('Bible pt. 2', god);
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    god.books.add(bible1, bible2, bible3);
    await orm.em.persistAndFlush([author, god]);

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    orm.em.clear();
    const books1 = await orm.em.find(Book2, { title: '123' }, {
      populate: ['perex'],
      orderBy: { title: QueryOrder.DESC },
      filters: ['long', 'expensive'],
    });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and length(perex) > 10000 and `b0`.`price` > 1000 and `b0`.`title` = \'123\' ' +
      'order by `b0`.`title` desc');

    const books2 = await orm.em.find(Book2, { title: '123' }, {
      filters: { hasAuthor: false, long: true, writtenBy: { name: 'God' } },
    });
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t2`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` ' +
      'where `a1`.`name` = \'God\' and length(perex) > 10000 and `b0`.`title` = \'123\'');

    const books3 = await orm.em.find(Book2, { title: '123' }, {
      filters: false,
    });
    expect(mock.mock.calls[2][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`title` = \'123\'');

    const books4 = await orm.em.find(Book2, { title: '123' }, {
      filters: true,
    });
    expect(mock.mock.calls[3][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and `b0`.`title` = \'123\'');

    const b1 = await orm.em.findOne(Book2, '123', {
      filters: { long: true },
    });
    expect(mock.mock.calls[4][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` ' +
      'where `b0`.`author_id` is not null and length(perex) > 10000 and `b0`.`uuid_pk` = \'123\' limit 1');

    const b2 = await orm.em.findOne(Book2, { author: { name: 'Jon' } }, {
      filters: { hasAuthor: false, long: true },
    });
    expect(mock.mock.calls[5][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`title`, `b0`.`price`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.price * 1.19 as `price_taxed`, `t2`.`id` as `test_id` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` ' +
      'where length(perex) > 10000 and `a1`.`name` = \'Jon\' limit 1');

    await orm.em.count(Book2, { author: { name: 'Jon' } }, {
      filters: { hasAuthor: false, long: true },
    });
    expect(mock.mock.calls[6][0]).toMatch('select count(distinct `b0`.`uuid_pk`) as `count` ' +
      'from `book2` as `b0` ' +
      'left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` ' +
      'where length(perex) > 10000 and `a1`.`name` = \'Jon\'');

    await orm.em.nativeUpdate(Book2, '123', { title: 'b123' }, {
      filters: { hasAuthor: false, long: true },
    });
    expect(mock.mock.calls[7][0]).toMatch('update `book2` set `title` = \'b123\'');

    await orm.em.nativeUpdate(Book2, '123', { title: 'b123' }, {
      filters: { hasAuthor: false, long: true },
    });
    expect(mock.mock.calls[8][0]).toMatch('update `book2` set `title` = \'b123\' where length(perex) > 10000 and `uuid_pk` = \'123\'');

    await orm.em.nativeDelete(Book2, '321', {
      filters: { hasAuthor: false, long: true },
    });
    expect(mock.mock.calls[9][0]).toMatch('delete from `book2` where length(perex) > 10000 and `uuid_pk` = \'321\'');

    // wut, name: 'god' should not be here?
    await expect(orm.em.find(Book2, {}, {
      filters: { hasAuthor: false, long: true, writtenBy: true },
    })).rejects.toThrow(`No arguments provided for filter 'writtenBy'`);
  });

});
