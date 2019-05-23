import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, PublisherType, Test2 } from './entities-sql';
import { initORMMySql } from './bootstrap';
import { LockMode, MikroORM, QueryOrder } from '../lib';

/**
 * @class QueryBuilderTest
 */
describe('QueryBuilder', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql());

  test('select query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ? ORDER BY `e0`.`name` DESC, `e0`.`type` ASC LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);
  });

  test('select constant expression', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('1').where({ id: 123 });
    expect(qb.getQuery()).toEqual('SELECT 1 FROM `publisher2` AS `e0` WHERE `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select in query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select(['id', 'name', 'type']).where({ name: { $in: ['test 123', 'lol 321'] }, type: PublisherType.GLOBAL }).limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.`id`, `e0`.`name`, `e0`.`type` FROM `publisher2` AS `e0` WHERE `e0`.`name` IN (?, ?) AND `e0`.`type` = ? LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select andWhere/orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*')
      .where({ name: 'test 123' })
      .andWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE ((`e0`.`name` = ? AND `e0`.`type` = ?) OR `e0`.`name` = ?) LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'lol 321', 2, 1]);
  });

  test('select andWhere/orWhere as first where condition', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2)
      .select('*')
      .andWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb1.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE (`e0`.`type` = ? OR `e0`.`name` = ?) LIMIT ? OFFSET ?');
    expect(qb1.getParams()).toEqual([PublisherType.GLOBAL, 'lol 321', 2, 1]);

    const qb2 = orm.em.createQueryBuilder(Publisher2)
      .select('*')
      .orWhere({ name: 'lol 321' })
      .andWhere({ type: PublisherType.GLOBAL })
      .limit(2, 1);
    expect(qb2.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE (`e0`.`name` = ? AND `e0`.`type` = ?) LIMIT ? OFFSET ?');
    expect(qb2.getParams()).toEqual(['lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select multiple andWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*')
      .where({ name: 'test 123' })
      .andWhere({ type: PublisherType.GLOBAL })
      .andWhere({ name: 'test 321' })
      .andWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE (`e0`.`name` = ? AND `e0`.`type` = ? AND `e0`.`name` = ? AND `e0`.`name` = ?) LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select multiple orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*')
      .where({ name: 'test 123' })
      .orWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'test 321' })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE (`e0`.`name` = ? OR `e0`.`type` = ? OR `e0`.`name` = ? OR `e0`.`name` = ?) LIMIT ? OFFSET ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select leftJoin 1:1 owner', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select(['fb.*', 'fz.*'])
      .leftJoin('fb.baz', 'fz')
      .where({ 'fz.name': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `fb`.*, `fz`.* FROM `foo_bar2` AS `fb` ' +
      'LEFT JOIN `foo_baz2` AS `fz` ON `fb`.`baz_id` = `fz`.`id` ' +
      'WHERE `fz`.`name` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin 1:1 inverse', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2, 'fz');
    qb.select(['fb.*', 'fz.*'])
      .leftJoin('fz.bar', 'fb')
      .where({ 'fb.name': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `fb`.*, `fz`.* FROM `foo_baz2` AS `fz` ' +
      'LEFT JOIN `foo_bar2` AS `fb` ON `fz`.`id` = `fb`.`baz_id` ' +
      'WHERE `fb`.`name` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:1', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.select(['a.*', 'b.*'])
      .leftJoin('b.author', 'a')
      .where({ 'a.name': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `a`.*, `b`.* FROM `book2` AS `b` ' +
      'LEFT JOIN `author2` AS `a` ON `b`.`author_id` = `a`.`id` ' +
      'WHERE `a`.`name` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `a`.*, `b`.* FROM `author2` AS `a` ' +
      'LEFT JOIN `book2` AS `b` ON `a`.`id` = `b`.`author_id` ' +
      'WHERE `b`.`title` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:n owner', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.select(['b.*', 't.*'])
      .leftJoin('b.tags', 't')
      .where({ 't.name': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `b`.*, `t`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id` FROM `book2` AS `b` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'LEFT JOIN `book_tag2` AS `t` ON `e1`.`book_tag2_id` = `t`.`id` ' +
      'WHERE `t`.`name` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:n inverse', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT `b`.*, `t`.*, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE `b`.`title` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select join and leftJoin combined', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .limit(2, 1);
    const sql = 'SELECT `p`.*, `b`.*, `a`.*, `t`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id` FROM `publisher2` AS `p` ' +
      'LEFT JOIN `book2` AS `b` ON `p`.`id` = `b`.`publisher_id` ' +
      'JOIN `author2` AS `a` ON `b`.`author_id` = `a`.`id` ' +
      'JOIN `book2_to_book_tag2` AS `e1` ON `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'JOIN `book_tag2` AS `t` ON `e1`.`book_tag2_id` = `t`.`id` ' +
      'WHERE `p`.`name` = ? AND `b`.`title` LIKE ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 2, 1]);
  });

  test('select with boolean', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ termsAccepted: false });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `author2` AS `e0` WHERE `e0`.`terms_accepted` = ?');
    expect(qb.getParams()).toEqual([false]);
  });

  test('select with custom expression', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ 'JSON_CONTAINS(`e0`.`meta`, ?)': [{ foo: 'bar' }, true] });
    expect(qb1.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` WHERE JSON_CONTAINS(`e0`.`meta`, ?) = ?');
    expect(qb1.getParams()).toEqual(['{"foo":"bar"}', true]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ 'JSON_CONTAINS(`e0`.`meta`, ?)': [{ foo: 'baz' }, false] });
    expect(qb2.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` WHERE JSON_CONTAINS(`e0`.`meta`, ?) = ?');
    expect(qb2.getParams()).toEqual(['{"foo":"baz"}', false]);
  });

  test('select by regexp', async () => {
    let qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /test/ });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` LIKE ?');
    expect(qb.getParams()).toEqual(['%test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^test/ });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` LIKE ?');
    expect(qb.getParams()).toEqual(['test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /t.st$/ });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` LIKE ?');
    expect(qb.getParams()).toEqual(['%t_st']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^c.o.*l-te.*st\.c.m$/ });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `publisher2` AS `e0` WHERE `e0`.`name` LIKE ?');
    expect(qb.getParams()).toEqual(['c_o%l-te%st.c_m']);
  });

  test('select by m:1', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ favouriteBook: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `author2` AS `e0` WHERE `e0`.`favourite_book_uuid_pk` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ books: { $in: [123, 321] } });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `author2` AS `e0` LEFT JOIN `book2` AS `e1` ON `e0`.`id` = `e1`.`author_id` WHERE `e1`.`id` IN (?, ?)');
    expect(qb.getParams()).toEqual([123, 321]);
  });

  test('select by 1:1', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2);
    qb.select('*').where({ baz: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `foo_bar2` AS `e0` WHERE `e0`.`baz_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ bar: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`id` AS `bar_id` FROM `foo_baz2` AS `e0` LEFT JOIN `foo_bar2` AS `e1` ON `e0`.`id` = `e1`.`baz_id` WHERE `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ id: 123 }).populate(['bar']);
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`id` AS `bar_id` FROM `foo_baz2` AS `e0` LEFT JOIN `foo_bar2` AS `e1` ON `e0`.`id` = `e1`.`baz_id` WHERE `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`id` AS `test_id` FROM `book2` AS `e0` LEFT JOIN `test2` AS `e1` ON `e0`.`uuid_pk` = `e1`.`book_uuid_pk` WHERE `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 }).populate(['test']);
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`id` AS `test_id` FROM `book2` AS `e0` LEFT JOIN `test2` AS `e1` ON `e0`.`uuid_pk` = `e1`.`book_uuid_pk` WHERE `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate() before where() (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').populate(['test']).where({ test: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`id` AS `test_id` FROM `book2` AS `e0` LEFT JOIN `test2` AS `e1` ON `e0`.`uuid_pk` = `e1`.`book_uuid_pk` WHERE `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ tags: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id` FROM `book2` AS `e0` LEFT JOIN `book2_to_book_tag2` AS `e1` ON `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` WHERE `e1`.`book_tag2_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n inversed', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2);
    qb.select('*').where({ books: 123 });
    expect(qb.getQuery()).toEqual('SELECT `e0`.*, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `e0` LEFT JOIN `book2_to_book_tag2` AS `e1` ON `e0`.`id` = `e1`.`book_tag2_id` WHERE `e1`.`book2_uuid_pk` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n with populate', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').populate(['publisher2_to_test2']).where({ publisher2_id: { $in: [ 1, 2 ] } }).orderBy({ 'publisher2_to_test2.id': QueryOrder.ASC });
    let sql = 'SELECT `e0`.*, `e1`.`test2_id`, `e1`.`publisher2_id` FROM `test2` AS `e0`';
    sql += ' LEFT JOIN `publisher2_to_test2` AS `e1` ON `e0`.`id` = `e1`.`test2_id`';
    sql += ' WHERE `e1`.`publisher2_id` IN (?, ?)';
    sql += ' ORDER BY `e1`.`id` ASC';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([1, 2]);
  });

  test('select by m:n with unknown populate ignored', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').populate(['not_existing']);
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0`');
    expect(qb.getParams()).toEqual([]);
  });

  test('select with operator (simple)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ id: { $nin: [3, 4] } });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` WHERE `e0`.`id` NOT IN (?, ?)');
    expect(qb.getParams()).toEqual([3, 4]);
  });

  test('select with operator (wrapped)', async () => {
    const qb1 = orm.em.createQueryBuilder(Test2);
    qb1.select('*').where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });
    expect(qb1.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` WHERE (`e0`.`id` NOT IN (?, ?) AND `e0`.`id` > ?)');
    expect(qb1.getParams()).toEqual([3, 4, 2]);

    const qb2 = orm.em.createQueryBuilder(Test2);
    qb2.select('*').where({ id: { $nin: [3, 4], $gt: 2 } });
    expect(qb2.getQuery()).toEqual(qb1.getQuery());
    expect(qb2.getParams()).toEqual(qb1.getParams());
  });

  test('select with operator (NOT)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $not: { id: { $in: [3, 4] } } });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` WHERE NOT (`e0`.`id` IN (?, ?))');
    expect(qb.getParams()).toEqual([3, 4]);
  });

  test('select with unsupported operator', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $test: { foo: 'bar'} });
    expect(qb.getParams()).toEqual([{ foo: 'bar'}]);
  });

  test('select distinct id with left join', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['DISTINCT b.uuid_pk', 'b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT DISTINCT b.uuid_pk, `b`.*, `t`.*, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE `b`.`title` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select distinct via flag', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.uuid', 'b.*', 't.*'], true)
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'SELECT DISTINCT `b`.`uuid_pk`, `b`.*, `t`.*, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE `b`.`title` = ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select where string literal', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? OR b.title = ?', ['test 123', 'lol 321'])
      .andWhere('1 = 1')
      .orWhere('1 = 2')
      .limit(2, 1);
    const sql = 'SELECT `b`.*, `t`.*, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE (((b.title = ? OR b.title = ?) AND (1 = 1)) OR (1 = 2)) ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', 2, 1]);
  });

  test('select with group by and having', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', 'COUNT(t.id) as tags'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? OR b.title = ?', ['test 123', 'lol 321'])
      .groupBy('b.uuid')
      .having('tags > ?', [0])
      .limit(2, 1);
    const sql = 'SELECT `b`.*, `t`.*, COUNT(t.id) as tags, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE (b.title = ? OR b.title = ?) ' +
      'GROUP BY `b`.`uuid_pk` ' +
      'HAVING (tags > ?) ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', 0, 2, 1]);
  });

  test('select with group by and having with object', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', 'COUNT(t.id) as tags'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? OR b.title = ?', ['test 123', 'lol 321'])
      .groupBy('b.uuid')
      .having({ 'b.uuid': '...', 'COUNT(t.id)': { $gt: 0 } })
      .limit(2, 1);
    const sql = 'SELECT `b`.*, `t`.*, COUNT(t.id) as tags, `e1`.`book_tag2_id`, `e1`.`book2_uuid_pk` FROM `book_tag2` AS `t` ' +
      'LEFT JOIN `book2_to_book_tag2` AS `e1` ON `t`.`id` = `e1`.`book_tag2_id` ' +
      'LEFT JOIN `book2` AS `b` ON `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'WHERE (b.title = ? OR b.title = ?) ' +
      'GROUP BY `b`.`uuid_pk` ' +
      'HAVING `b`.`uuid_pk` = ? AND COUNT(t.id) > ? ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', '...', 0, 2, 1]);
  });

  test('select with operator (AND)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $and: [
      { id: { $in: [1, 2, 7] }, },
      { id: { $nin: [3, 4] }, },
      { id: { $gt: 5 }, },
      { id: { $lt: 10 }, },
      { id: { $gte: 7 }, },
      { id: { $lte: 8 }, },
      { id: { $ne: 9 }, },
      { $not: { id: { $eq: 10 } } },
    ] });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` ' +
      'WHERE (`e0`.`id` IN (?, ?, ?) ' +
      'AND `e0`.`id` NOT IN (?, ?) ' +
      'AND `e0`.`id` > ? ' +
      'AND `e0`.`id` < ? ' +
      'AND `e0`.`id` >= ? ' +
      'AND `e0`.`id` <= ? ' +
      'AND `e0`.`id` != ? ' +
      'AND NOT (`e0`.`id` = ?))');
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with operator (OR)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $or: [
      { id: { $in: [1, 2, 7] }, },
      { id: { $nin: [3, 4] }, },
      { id: { $gt: 5 }, },
      { id: { $lt: 10 }, },
      { id: { $gte: 7 }, },
      { id: { $lte: 8 }, },
      { id: { $ne: 9 }, },
      { $not: { id: { $eq: 10 } } },
    ] });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` ' +
      'WHERE (`e0`.`id` IN (?, ?, ?) ' +
      'OR `e0`.`id` NOT IN (?, ?) ' +
      'OR `e0`.`id` > ? ' +
      'OR `e0`.`id` < ? ' +
      'OR `e0`.`id` >= ? ' +
      'OR `e0`.`id` <= ? ' +
      'OR `e0`.`id` != ? ' +
      'OR NOT (`e0`.`id` = ?))');
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with smart query conditions', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({
      'key1:gt': 1,
      'key2:lt': 2,
      'key3:gte': 3,
      'key4:lte': 4,
      'key5:ne': 5,
      'key6:in': [6, 7],
      'key7:nin': [8, 9],
    });
    expect(qb.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` ' +
      'WHERE `e0`.`key1` > ? ' +
      'AND `e0`.`key2` < ? ' +
      'AND `e0`.`key3` >= ? ' +
      'AND `e0`.`key4` <= ? ' +
      'AND `e0`.`key5` != ? ' +
      'AND `e0`.`key6` IN (?, ?) ' +
      'AND `e0`.`key7` NOT IN (?, ?)');
    expect(qb.getParams()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('select count query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.count().where({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('SELECT COUNT(`e0`.`id`) AS `count` FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('select count distinct query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.count('id', true).where({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('SELECT COUNT(DISTINCT `e0`.`id`) AS `count` FROM `publisher2` AS `e0` WHERE `e0`.`name` = ? AND `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('select count with non-standard PK field name (uuid_pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.count().where({ title: 'test 123' });
    expect(qb.getQuery()).toEqual('SELECT COUNT(`e0`.`uuid_pk`) AS `count` FROM `book2` AS `e0` WHERE `e0`.`title` = ?');
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select with locking', async () => {
    const qb1 = orm.em.createQueryBuilder(Test2);
    qb1.select('*').where({ title: 'test 123' }).setLockMode(LockMode.OPTIMISTIC);
    expect(qb1.getQuery()).toEqual('SELECT `e0`.* FROM `test2` AS `e0` WHERE `e0`.`title` = ?');

    await orm.em.beginTransaction();
    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ title: 'test 123' }).setLockMode(LockMode.NONE);
    expect(qb2.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` WHERE `e0`.`title` = ?');

    const qb3 = orm.em.createQueryBuilder(Book2);
    qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ);
    expect(qb3.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` WHERE `e0`.`title` = ? LOCK IN SHARE MODE');

    const qb4 = orm.em.createQueryBuilder(Book2);
    qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE);
    expect(qb4.getQuery()).toEqual('SELECT `e0`.* FROM `book2` AS `e0` WHERE `e0`.`title` = ? FOR UPDATE');
    await orm.em.commit();
  });

  test('pessimistic locking requires active transaction', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ name: '...' });
    expect(() => qb.setLockMode(LockMode.NONE)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.OPTIMISTIC).getQuery()).toThrowError('The optimistic lock on entity Author2 failed');
  });

  test('insert query', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb1.getQuery()).toEqual('INSERT INTO `publisher2` (`name`, `type`) VALUES (?, ?)');
    expect(qb1.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.insert({ name: 'test 123', favouriteBook: 2359, termsAccepted: true });
    expect(qb2.getQuery()).toEqual('INSERT INTO `author2` (`name`, `favourite_book_uuid_pk`, `terms_accepted`) VALUES (?, ?, ?)');
    expect(qb2.getParams()).toEqual(['test 123', 2359, true]);

    const qb3 = orm.em.createQueryBuilder(BookTag2);
    qb3.insert({ books: 123 });
    expect(qb3.getQuery()).toEqual('INSERT INTO `book_tag2` (`books`) VALUES (?)');
    expect(qb3.getParams()).toEqual([123]);
  });

  test('update query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]);
  });

  test('update query with entity in data', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    const test = Test2.create('test');
    test.id = 321;
    qb.update({ name: 'test 123', test }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('UPDATE `publisher2` SET `name` = ?, `test` = ? WHERE `id` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', 321, 123, PublisherType.LOCAL]);
  });

  test('delete query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('DELETE FROM `publisher2` WHERE `name` = ? AND `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('clone QB', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .limit(2, 1);

    const clone = qb.clone();
    expect(clone.type).toBe(qb.type);
    expect(clone['aliasCounter']).toBe(qb['aliasCounter']);
    expect(clone['flags']).not.toBe(qb['flags']);
    expect(clone['finalized']).toBe(qb['finalized']);
    expect(clone['_fields']).not.toBe(qb['_fields']);
    expect(clone['_populate']).not.toBe(qb['_populate']);
    expect(clone['_populateMap']).not.toBe(qb['_populateMap']);
    expect(clone['_joins']).not.toBe(qb['_joins']);
    expect(clone['_aliasMap']).not.toBe(qb['_aliasMap']);
    expect(clone['_cond']).not.toBe(qb['_cond']);
    expect(clone['_orderBy']).not.toBe(qb['_orderBy']);
    expect(clone['_limit']).toBe(qb['_limit']);
    expect(clone['_offset']).toBe(qb['_offset']);

    clone.orWhere({ 'p.name': 'or this name' }).orderBy({ 'p.name': QueryOrder.ASC }).limit(10, 5);
    clone.limit(10, 5);

    const sql = 'SELECT `p`.*, `b`.*, `a`.*, `t`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id` FROM `publisher2` AS `p` ' +
      'LEFT JOIN `book2` AS `b` ON `p`.`id` = `b`.`publisher_id` ' +
      'JOIN `author2` AS `a` ON `b`.`author_id` = `a`.`id` ' +
      'JOIN `book2_to_book_tag2` AS `e1` ON `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'JOIN `book_tag2` AS `t` ON `e1`.`book_tag2_id` = `t`.`id` ' +
      'WHERE `p`.`name` = ? AND `b`.`title` LIKE ? ' +
      'ORDER BY `b`.`title` DESC ' +
      'LIMIT ? OFFSET ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 2, 1]);

    const sql2 = 'SELECT `p`.*, `b`.*, `a`.*, `t`.*, `e1`.`book2_uuid_pk`, `e1`.`book_tag2_id` FROM `publisher2` AS `p` ' +
      'LEFT JOIN `book2` AS `b` ON `p`.`id` = `b`.`publisher_id` ' +
      'JOIN `author2` AS `a` ON `b`.`author_id` = `a`.`id` ' +
      'JOIN `book2_to_book_tag2` AS `e1` ON `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'JOIN `book_tag2` AS `t` ON `e1`.`book_tag2_id` = `t`.`id` ' +
      'WHERE ((`p`.`name` = ? AND `b`.`title` LIKE ?) OR `p`.`name` = ?) ' +
      'ORDER BY `p`.`name` ASC ' +
      'LIMIT ? OFFSET ?';
    expect(clone.getQuery()).toEqual(sql2);
    expect(clone.getParams()).toEqual(['test 123', '%3', 'or this name', 10, 5]);
  });

  afterAll(async () => orm.close(true));

});
