import { Book2, BookTag2, Publisher2, PublisherType } from './entities-mysql';
import { QueryBuilder, QueryOrder } from '../lib/QueryBuilder';
import { getMetadata } from './bootstrap';

/**
 * @class QueryBuilderTest
 */
describe('QueryBuilder', () => {

  test('select query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ? ORDER BY `e0`.`name` DESC, `e0`.`type` ASC LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);
  });

  test('select in query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.select('*').where({ name: { $in: ['test 123', 'lol 321'] }, type: PublisherType.GLOBAL }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` IN (?, ?) AND `e0`.`type` = ? LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select by m:n', async () => {
    const qb = new QueryBuilder(Book2.name, getMetadata());
    qb.select('*').where({ tags: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` LEFT JOIN `book_to_tag2` AS `e1` ON `e0`.`id` = `e1`.`book2` WHERE `e1`.`book-tag2` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n inversed', async () => {
    const qb = new QueryBuilder(BookTag2.name, getMetadata());
    qb.select('*').where({ books: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `book-tag2` AS `e0` LEFT JOIN `book_to_tag2` AS `e1` ON `e0`.`id` = `e1`.`book-tag2` WHERE `e1`.`book2` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select count query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.count().where({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('SELECT COUNT(`e0`.`id`) AS `count` FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('insert query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('INSERT INTO `publisher2` (`name`, `type`) VALUES (?, ?)');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('update query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]);
  });

  test('delete query', async () => {
    const qb = new QueryBuilder(Publisher2.name, getMetadata());
    qb.delete({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('DELETE FROM `publisher2` WHERE `name` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

});
