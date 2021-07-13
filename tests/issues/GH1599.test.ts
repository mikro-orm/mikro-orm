import { MikroORM, Logger } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2 } from '../entities-sql';
import { initORMMySql, wipeDatabaseMySql } from '../bootstrap';

describe('EntityManagerMySql', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => (orm = await initORMMySql()));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('formulas can have conditions', async () => {
    const aristocles = new Author2('Aristocles', 'Aristocles@greek.net');
    const theSymposium = new Book2('The Symposium', aristocles);
    const republic = new Book2('Republic', aristocles);
    theSymposium.price = 1000;
    republic.price = 1995;
    await orm.em.persistAndFlush([theSymposium, republic]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const b = await orm.em.findOneOrFail(Book2, {
      author: { name: 'Aristocles' },
      priceTaxed: 1190,
    });
    expect(b.price).toBe(1000);
    expect(b.priceTaxed).toBe(1190);
    expect(mock.mock.calls[0][0]).toMatch(
      'select `e0`.`uuid_pk`, `e0`.`created_at`, `e0`.`title`, `e0`.`price`, `e0`.`double`, `e0`.`meta`, `e0`.`author_id`, `e0`.`publisher_id`, `e0`.price * 1.19 as `price_taxed`, `e2`.`id` as `test_id` ' +
        'from `book2` as `e0` ' +
        'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
        'where `e0`.`author_id` is not null and `e1`.`name` = ? ' +
        'having price_taxed = 1190 limit ?'
    );
  });

  test('formulas can be counted', async () => {
    const aristocles = new Author2('Aristocles', 'Aristocles@greek.net');
    const theSymposium = new Book2('The Symposium', aristocles);
    const republic = new Book2('Republic', aristocles);
    theSymposium.price = 1000;
    republic.price = 1995;
    await orm.em.persistAndFlush([theSymposium, republic]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const [b, count] = await orm.em.findAndCount(
      Book2,
      {
        author: { name: 'Aristocles' },
      },
      { having: { priceTaxed: 1190 } }
    );
    expect(count).toBe(1);
    expect(b.length).toBe(1);
    expect(b[0].price).toBe(1000);
    expect(b[0].priceTaxed).toBe(1190);
    expect(mock.mock.calls[0][0]).toMatch(
      'select `e0`.`uuid_pk`, `e0`.`created_at`, `e0`.`title`, `e0`.`price`, `e0`.`double`, `e0`.`meta`, `e0`.`author_id`, `e0`.`publisher_id`, `e0`.price * 1.19 as `price_taxed`, `e2`.`id` as `test_id` ' +
        'from `book2` as `e0` ' +
        'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `test2` as `e2` on `e0`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
        'where `e0`.`author_id` is not null and `e1`.`name` = ? ' +
        'having price_taxed = 1190 limit ?'
    );
  });

  test('counts include conditions', async () => {
    const aristocles = new Author2('Aristocles', 'Aristocles@greek.net');
    const theSymposium = new Book2('The Symposium', aristocles);
    const republic = new Book2('Republic', aristocles);
    theSymposium.price = 1000;
    republic.price = 1995;
    await orm.em.persistAndFlush([theSymposium, republic]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const [b, count] = await orm.em.findAndCount(Book2, {
      author: { name: 'Aristocles' },
      price: 1000,
    });
    expect(count).toBe(1);
    expect(b.length).toBe(1);
    expect(b[0].price).toBe(1000);
    expect(b[0].priceTaxed).toBe(1190);
  });

  afterAll(async () => orm.close(true));
});
