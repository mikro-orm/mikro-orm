import { Author2, Book2, BookTag2, Publisher2, PublisherType } from './entities-mysql';
import { QueryBuilder, QueryOrder } from '../lib/QueryBuilder';
import { initORMMySql } from './bootstrap';
import { MikroORM } from '../lib';

/**
 * @class QueryBuilderTest
 */
describe('QueryBuilder', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql());

  test('select query', async () => {
    const qb = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ? ORDER BY `e0`.`name` DESC, `e0`.`type` ASC LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);
  });

  test('select in query', async () => {
    const qb = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb.select(['id', 'name', 'type']).where({ name: { $in: ['test 123', 'lol 321'] }, type: PublisherType.GLOBAL }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.`id`, `e0`.`name`, `e0`.`type` FROM `publisher2` AS `e0` WHERE `e0`.`name` IN (?, ?) AND `e0`.`type` = ? LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select by m:1', async () => {
    const qb = new QueryBuilder(Author2.name, orm.em.entityFactory.getMetadata());
    qb.select('*').where({ favouriteBook: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `author2` AS `e0` WHERE `e0`.`favourite_book_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:m', async () => {
    const qb = new QueryBuilder(Author2.name, orm.em.entityFactory.getMetadata());
    qb.select('*').where({ books: { $in: [123, 321] } });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `author2` AS `e0` LEFT JOIN `book2` AS `e1` ON `e0`.`id` = `e1`.`author_id` WHERE `e1`.`id` IN (?, ?)');
    expect(qb.getParams()).toEqual([123, 321]);
  });

  test('select by m:n', async () => {
    const qb = new QueryBuilder(Book2.name, orm.em.entityFactory.getMetadata());
    qb.select('*').where({ tags: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` LEFT JOIN `book2_to_book_tag2` AS `e1` ON `e0`.`id` = `e1`.`book2_id` WHERE `e1`.`book_tag2_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n inversed', async () => {
    const qb = new QueryBuilder(BookTag2.name, orm.em.entityFactory.getMetadata());
    qb.select('*').where({ books: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `book_tag2` AS `e0` LEFT JOIN `book2_to_book_tag2` AS `e1` ON `e0`.`id` = `e1`.`book_tag2_id` WHERE `e1`.`book2_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select count query', async () => {
    const qb = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb.count().where({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('SELECT COUNT(`e0`.`id`) AS `count` FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('insert query', async () => {
    const qb1 = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb1.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb1.getQuery()).toEqual('INSERT INTO `publisher2` (`name`, `type`) VALUES (?, ?)');
    expect(qb1.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);

    const qb2 = new QueryBuilder(Author2.name, orm.em.entityFactory.getMetadata());
    qb2.insert({ name: 'test 123', favouriteBook: 2359, termsAccepted: true });
    expect(qb2.getQuery()).toEqual('INSERT INTO `author2` (`name`, `favourite_book_id`, `terms_accepted`) VALUES (?, ?, ?)');
    expect(qb2.getParams()).toEqual(['test 123', 2359, true]);

    const qb3 = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb3.insert({ tests: 123 });
    expect(qb3.getQuery()).toEqual('INSERT INTO `publisher2` (`tests`) VALUES (?)');
    expect(qb3.getParams()).toEqual([123]);
  });

  test('update query', async () => {
    const qb = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]);
  });

  test('delete query', async () => {
    const qb = new QueryBuilder(Publisher2.name, orm.em.entityFactory.getMetadata());
    qb.delete({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('DELETE FROM `publisher2` WHERE `name` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  afterAll(async () => orm.close(true));

});
