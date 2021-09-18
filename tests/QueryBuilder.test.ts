import { inspect } from 'util';
import { LockMode, MikroORM, QueryFlag, QueryOrder } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { CriteriaNode } from '@mikro-orm/knex';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Address2, Author2, Book2, BookTag2, Car2, CarOwner2, Configuration2, FooBar2, FooBaz2, FooParam2, Publisher2, PublisherType, Test2, User2 } from './entities-sql';
import { initORMMySql } from './bootstrap';
import { BaseEntity2 } from './entities-sql/BaseEntity2';
import { performance } from 'perf_hooks';
import { BaseEntity22 } from './entities-sql/BaseEntity22';

describe('QueryBuilder', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));

  test('select query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? order by `e0`.`name` desc, `e0`.`type` asc limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [`(point(location_latitude, location_longitude) <@> point(${53}, ${9}))`]: 'ASC' });
    expect(qb1.getFormattedQuery()).toBe('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = \'test 123\' and `e0`.`type` = \'global\' order by (point(location_latitude, location_longitude) <@> point(53, 9)) asc');

    const qb2 = orm.em.createQueryBuilder(Publisher2);
    qb2.select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [`(point(location_latitude, location_longitude) <@> point(${53.46}, ${9.90}))`]: 'ASC' });
    expect(qb2.getFormattedQuery()).toBe('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = \'test 123\' and `e0`.`type` = \'global\' order by (point(location_latitude, location_longitude) <@> point(53.46, 9.9)) asc');
  });

  test('select query picks read replica', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL });
    const spy = jest.spyOn(MySqlDriver.prototype, 'getConnection');
    await qb.execute();
    expect(spy).toBeCalledWith('read');
  });

  test('insert query picks write replica', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    const spy = jest.spyOn(MySqlDriver.prototype, 'getConnection');
    await qb.execute('run');
    expect(spy).toBeCalledWith('write');
  });

  test('select where is null', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ type: null }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`type` is null limit ? offset ?');
    expect(qb.getParams()).toEqual([2, 1]);
  });

  test('select query with order by variants', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.select('*').where({ name: 'test 123' }).orderBy({ name: QueryOrder.DESC, type: 'ASC' }).limit(2, 1);
    expect(qb1.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` asc limit ? offset ?');
    expect(qb1.getParams()).toEqual(['test 123', 2, 1]);

    const qb2 = orm.em.createQueryBuilder(Publisher2);
    qb2.select('*').where({ name: 'test 123' }).orderBy({ name: 'desc', type: -1 }).limit(2, 1);
    expect(qb2.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?');
    expect(qb2.getParams()).toEqual(['test 123', 2, 1]);

    const qb3 = orm.em.createQueryBuilder(Publisher2);
    qb3.select('*').where({ name: 'test 123' }).orderBy([{ name: 'desc' }, { type: -1 }]).limit(2, 1);
    expect(qb3.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?');
    expect(qb3.getParams()).toEqual(['test 123', 2, 1]);

    const qb4 = orm.em.createQueryBuilder(Publisher2);
    qb4.select('*').where({ name: 'test 123' }).orderBy([{ name: 'desc', type: -1 }]).limit(2, 1);
    expect(qb4.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?');
    expect(qb4.getParams()).toEqual(['test 123', 2, 1]);

    const qb5 = orm.em.createQueryBuilder(Publisher2);
    qb5.select('*').where({ name: 'test 123' }).orderBy([{ name: 'desc' }, { type: -1 }, { name: 'asc' }]).limit(2, 1);
    expect(qb5.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc, `e0`.`name` asc limit ? offset ?');
    expect(qb5.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select constant expression', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('1').where({ id: 123 });
    expect(qb.getQuery()).toEqual('select 1 from `publisher2` as `e0` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select in query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select(['id', 'name', 'type']).where({ name: { $in: ['test 123', 'lol 321'] }, type: PublisherType.GLOBAL }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.`id`, `e0`.`name`, `e0`.`type` from `publisher2` as `e0` where `e0`.`name` in (?, ?) and `e0`.`type` = ? limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select in query with composite keys', async () => {
    const qb = orm.em.createQueryBuilder(Car2);
    qb.select('*').where({ 'name~~~year': { $in: [['test 123', 123], ['lol 321', 321]] } }).orderBy({ 'name~~~year': QueryOrder.DESC });
    expect(qb.getQuery()).toEqual('select `e0`.* from `car2` as `e0` where (`e0`.`name`, `e0`.`year`) in ((?, ?), (?, ?)) order by `e0`.`name` desc, `e0`.`year` desc');
    expect(qb.getParams()).toEqual(['test 123', 123, 'lol 321', 321]);
  });

  test('select query with auto-joined composite key entity', async () => {
    const qb1 = orm.em.createQueryBuilder(CarOwner2);
    qb1.select('*').where({ car: { name: 'Audi A8', year: 2010 } });
    expect(qb1.getQuery()).toEqual('select `e0`.* from `car_owner2` as `e0` where (`e0`.`car_name`, `e0`.`car_year`) = (?, ?)');
    expect(qb1.getParams()).toEqual(['Audi A8', 2010]);

    const qb2 = orm.em.createQueryBuilder(CarOwner2);
    qb2.select('*').where({ car: ['Audi A8', 2010] });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `car_owner2` as `e0` where (`e0`.`car_name`, `e0`.`car_year`) = (?, ?)');
    expect(qb2.getParams()).toEqual(['Audi A8', 2010]);

    const qb3 = orm.em.createQueryBuilder(CarOwner2);
    qb3.select('*').where({ car: [['Audi A8', 2010]] });
    expect(qb3.getQuery()).toEqual('select `e0`.* from `car_owner2` as `e0` where (`e0`.`car_name`, `e0`.`car_year`) in ((?, ?))');
    expect(qb3.getParams()).toEqual(['Audi A8', 2010]);
  });

  test('select query with auto-joined query with operator and scalar', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ author: { $ne: null } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`author_id` is not null');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ author: { $ne: null, name: 'Jon Snow' } });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e0`.`author_id` is not null and `e1`.`name` = ?');
    expect(qb2.getParams()).toEqual(['Jon Snow']);
  });

  test('select andWhere/orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*')
      .where({ name: 'test 123' })
      .andWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where ((`e0`.`name` = ? and `e0`.`type` = ?) or `e0`.`name` = ?) limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'lol 321', 2, 1]);
  });

  test('select andWhere/orWhere as first where condition', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2)
      .select('*')
      .andWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb1.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where (`e0`.`type` = ? or `e0`.`name` = ?) limit ? offset ?');
    expect(qb1.getParams()).toEqual([PublisherType.GLOBAL, 'lol 321', 2, 1]);

    const qb2 = orm.em.createQueryBuilder(Publisher2)
      .select('*')
      .orWhere({ name: 'lol 321' })
      .andWhere({ type: PublisherType.GLOBAL })
      .limit(2, 1);
    expect(qb2.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? limit ? offset ?');
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
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? and `e0`.`name` = ? and `e0`.`name` = ? limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select multiple orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.where({ name: 'test 123' })
      .orWhere({ type: PublisherType.GLOBAL })
      .orWhere({ name: 'test 321' })
      .orWhere({ name: 'lol 321' })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where (`e0`.`name` = ? or `e0`.`type` = ? or `e0`.`name` = ? or `e0`.`name` = ?) limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select complex where', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.where({ name: 'test 123', $or: [{ name: 'test 321' }, { type: PublisherType.GLOBAL }] })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and (`e0`.`name` = ? or `e0`.`type` = ?) limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', 'test 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select leftJoin 1:1 owner', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select(['fb.*', 'fz.*'])
      .leftJoin('fb.baz', 'fz')
      .where({ 'fz.name': 'test 123' })
      .limit(2, 1);
    const sql = 'select `fb`.*, `fz`.*, (select 123) as `random` from `foo_bar2` as `fb` ' +
      'left join `foo_baz2` as `fz` on `fb`.`baz_id` = `fz`.`id` ' +
      'where `fz`.`name` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select with 1:1 owner auto-join', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2, 'fz');
    qb.select('fz.*')
      .populate([{ field: 'asd' }])
      .setFlag(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)
      .limit(2, 1);
    const sql = 'select `fz`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `fz` left join `foo_bar2` as `e1` on `fz`.`id` = `e1`.`baz_id` limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([2, 1]);
  });

  test('complex select with mapping of joined results', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*').joinAndSelect('fb1.baz', 'fz');

    const err = `Trying to join fz.fooBar, but fooBar is not a defined relation on FooBaz2`;
    expect(() => qb.leftJoinAndSelect('fz.fooBar', 'fb2')).toThrowError(err);

    qb.leftJoinAndSelect('fz.bar', 'fb2')
      .where({ 'fz.name': 'baz' })
      .limit(1);
    const sql = 'select `fb1`.*, ' +
      '`fz`.`id` as `fz__id`, `fz`.`name` as `fz__name`, `fz`.`version` as `fz__version`, ' +
      '`fb2`.`id` as `fb2__id`, `fb2`.`name` as `fb2__name`, `fb2`.`name with space` as `fb2__name with space`, `fb2`.`baz_id` as `fb2__baz_id`, `fb2`.`foo_bar_id` as `fb2__foo_bar_id`, `fb2`.`version` as `fb2__version`, `fb2`.`blob` as `fb2__blob`, `fb2`.`array` as `fb2__array`, `fb2`.`object_property` as `fb2__object_property`, (select 123) as `fb2__random`, ' +
      '(select 123) as `random` from `foo_bar2` as `fb1` ' +
      'inner join `foo_baz2` as `fz` on `fb1`.`baz_id` = `fz`.`id` ' +
      'left join `foo_bar2` as `fb2` on `fz`.`id` = `fb2`.`baz_id` ' +
      'where `fz`.`name` = ? ' +
      'limit ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['baz', 1]);
  });

  test('join and select with paginate', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*')
      .joinAndSelect('fb1.baz', 'fz')
      .leftJoinAndSelect('fz.bar', 'fb2')
      .where({ 'fz.name': 'baz' })
      .setFlag(QueryFlag.PAGINATE)
      .limit(1);
    const sql = 'select `fb1`.*, ' +
      '`fz`.`id` as `fz__id`, `fz`.`name` as `fz__name`, `fz`.`version` as `fz__version`, ' +
      '`fb2`.`id` as `fb2__id`, `fb2`.`name` as `fb2__name`, `fb2`.`name with space` as `fb2__name with space`, `fb2`.`baz_id` as `fb2__baz_id`, `fb2`.`foo_bar_id` as `fb2__foo_bar_id`, `fb2`.`version` as `fb2__version`, `fb2`.`blob` as `fb2__blob`, `fb2`.`array` as `fb2__array`, `fb2`.`object_property` as `fb2__object_property`, (select 123) as `fb2__random`, ' +
      '(select 123) as `random` from `foo_bar2` as `fb1` ' +
      'inner join `foo_baz2` as `fz` on `fb1`.`baz_id` = `fz`.`id` ' +
      'left join `foo_bar2` as `fb2` on `fz`.`id` = `fb2`.`baz_id` ' +
      'where `fb1`.`id` in (' +
      'select `fb1`.`id` from (' +
      'select `fb1`.`id` from (' +
      'select `fb1`.`id` from `foo_bar2` as `fb1` ' +
      'inner join `foo_baz2` as `fz` on `fb1`.`baz_id` = `fz`.`id` ' +
      'left join `foo_bar2` as `fb2` on `fz`.`id` = `fb2`.`baz_id` ' +
      'where `fz`.`name` = ?) as `fb1` ' +
      'group by `fb1`.`id` ' +
      'limit ?) as `fb1`)';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['baz', 1]);
    await qb.execute();
  });

  test('join and select with empty collections', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select('*')
      .leftJoinAndSelect('fb.tests', 't')
      .orderBy({ name: 1 });

    await orm.em.nativeInsert(Test2, { id: 1, name: 't' });
    await orm.em.nativeInsert(FooBar2, { id: 1, name: 'fb 1', tests: [] });
    await orm.em.nativeInsert(FooBar2, { id: 2, name: 'fb 2', tests: [1] });
    const res = await qb.getResultList();
    expect(res[0].tests.isInitialized()).toBe(true);
    expect(res[0].tests.getItems()).toHaveLength(0);
    expect(res[1].tests.isInitialized()).toBe(true);
    expect(res[1].tests.getItems()).toHaveLength(1);
  });

  test('select leftJoin 1:1 inverse', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2, 'fz');
    qb.select(['fb.*', 'fz.*'])
      .leftJoin('fz.bar', 'fb')
      .where({ 'fb.name': 'test 123' })
      .limit(2, 1);
    const sql = 'select `fb`.*, `fz`.* from `foo_baz2` as `fz` ' +
      'left join `foo_bar2` as `fb` on `fz`.`id` = `fb`.`baz_id` ' +
      'where `fb`.`name` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:1', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.select(['a.*', 'b.*'])
      .leftJoin('b.author', 'a')
      .where({ 'a.name': 'test 123' })
      .limit(2, 1);
    const sql = 'select `a`.*, `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'where `a`.`name` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` on `a`.`id` = `b`.`author_id` ' +
      'where `b`.`title` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin 1:m with multiple conditions', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b', {
        'b.foo:gte': '123',
        'b.baz': { $gt: 1, $lte: 10 },
        '$or': [
          { 'b.foo': null, 'b.baz': 0, 'b.bar:ne': 1 },
          { 'b.bar': /321.*/ },
          { $and: [
            { 'json_contains(`a`.`meta`, ?)': [{ 'b.foo': 'bar' }] },
            { 'json_contains(`a`.`meta`, ?) = ?': [{ 'b.foo': 'bar' }, false] },
            { 'lower(b.bar)': '321' },
          ] },
        ],
      })
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` on `a`.`id` = `b`.`author_id` and `b`.`foo` >= ? and (`b`.`baz` > ? and `b`.`baz` <= ?) and ((`b`.`foo` is ? and `b`.`baz` = ? and `b`.`bar` != ?) or `b`.`bar` like ? or (json_contains(`a`.`meta`, ?) and json_contains(`a`.`meta`, ?) = ? and lower(b.bar) = ?)) ' +
      'where `b`.`title` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['123', 1, 10, null, 0, 1, '%321%%', '{"b.foo":"bar"}', '{"b.foo":"bar"}', false, '321', 'test 123', 2, 1]);
  });

  test('select leftJoin m:n owner', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.select(['b.*', 't.*'])
      .leftJoin('b.tags', 't')
      .where({ 't.name': 'test 123' })
      .limit(2, 1);
    const sql = 'select `b`.*, `t`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `t`.`name` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:n inverse', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ? ' +
      'limit ? offset ?';
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
    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 2, 1]);
  });

  test('select with boolean', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ termsAccepted: false });
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0` where `e0`.`terms_accepted` = ?');
    expect(qb.getParams()).toEqual([false]);
  });

  test('select with boolean in relation (GH issue #940)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ author: { termsAccepted: true } });
    expect(qb.getFormattedQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`terms_accepted` = true');
  });

  test('select with custom expression', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ 'json_contains(`e0`.`meta`, ?)': [{ foo: 'bar' }] });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.`meta`, ?)');
    expect(qb1.getParams()).toEqual(['{"foo":"bar"}']);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ 'json_contains(`e0`.`meta`, ?) = ?': [{ foo: 'baz' }, false] });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.`meta`, ?) = ?');
    expect(qb2.getParams()).toEqual(['{"foo":"baz"}', false]);
  });

  test('select by regexp', async () => {
    let qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /test/ });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['%test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^test/ });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /t.st$/ });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['%t_st']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^c.o.*l-te.*st\.c.m$/ });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['c_o%l-te%st.c_m']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^(te){1,3}st$/ });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['^(te){1,3}st$']);
  });

  test('select by like', async () => {
    let qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $like: '%test%' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['%test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $like: 'test%' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['test%']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $like: '%t_st' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['%t_st']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $like: 'c_o%l-te%st.c_m' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` like ?');
    expect(qb.getParams()).toEqual(['c_o%l-te%st.c_m']);
  });

  test('select by regexp operator', async () => {
    let qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $re: 'test' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['test']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $re: '^test' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['^test']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $re: 't.st$' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['t.st$']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $re: '^c.o.*l-te.*st.c.m$' } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['^c.o.*l-te.*st.c.m$']);
  });

  test('select by m:1', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ favouriteBook: '123' });
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0` where `e0`.`favourite_book_uuid_pk` = ?');
    expect(qb.getParams()).toEqual(['123']);
  });

  test('select by 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ books: { $in: ['123', '321'] } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` in (?, ?)');
    expect(qb.getParams()).toEqual(['123', '321']);
  });

  test('select by 1:1', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2);
    qb.select('*').where({ baz: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` where `e0`.`baz_id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ id: 123 }).populate([{ field: 'bar' }]);
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (search by association)', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ bar: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ id: 123 }).populate([{ field: 'bar' }]);
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `test_id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 }).populate([{ field: 'test' }]);
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `test_id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate() before where() (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').populate([{ field: 'test' }]).where({ test: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `test_id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ tags: '123' });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where `e1`.`book_tag2_id` = ?');
    expect(qb.getParams()).toEqual(['123']);
  });

  test('select by m:n inversed', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2);
    qb.select('*').where({ books: '123' });
    expect(qb.getQuery()).toEqual('select `e0`.* from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e1` on `e0`.`id` = `e1`.`book_tag2_id` ' +
      'where `e1`.`book2_uuid_pk` = ?');
    expect(qb.getParams()).toEqual(['123']);
  });

  test('select by m:n inverse side (that is not defined as property) via populate', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').populate([{ field: 'publisher2_tests' }]).where({ 'publisher2_tests.Publisher2_owner': { $in: [ 1, 2 ] } }).orderBy({ 'publisher2_tests.id': QueryOrder.ASC });
    let sql = 'select `e0`.*, `e1`.`test2_id` as `fk__test2_id`, `e1`.`publisher2_id` as `fk__publisher2_id` from `test2` as `e0` ';
    sql += 'left join `publisher2_tests` as `e1` on `e0`.`id` = `e1`.`test2_id` ';
    sql += 'where `e1`.`publisher2_id` in (?, ?) ';
    sql += 'order by `e1`.`id` asc';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([1, 2]);
  });

  test('select by m:n self reference owner', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').populate([{ field: 'author2_following' }]).where({ 'author2_following.Author2_owner': { $in: [ 1, 2 ] } });
    let sql = 'select `e0`.*, `e1`.`author2_2_id` as `fk__author2_2_id`, `e1`.`author2_1_id` as `fk__author2_1_id` from `author2` as `e0` ';
    sql += 'left join `author2_following` as `e1` on `e0`.`id` = `e1`.`author2_2_id` ';
    sql += 'where `e1`.`author2_1_id` in (?, ?)';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([1, 2]);
  });

  test('select by m:n self reference inverse', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').populate([{ field: 'author2_following' }]).where({ 'author2_following.Author2_inverse': { $in: [ 1, 2 ] } });
    let sql = 'select `e0`.*, `e1`.`author2_1_id` as `fk__author2_1_id`, `e1`.`author2_2_id` as `fk__author2_2_id` from `author2` as `e0` ';
    sql += 'left join `author2_following` as `e1` on `e0`.`id` = `e1`.`author2_1_id` ';
    sql += 'where `e1`.`author2_2_id` in (?, ?)';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([1, 2]);
  });

  test('select by m:n with composite keys', async () => {
    const qb = orm.em.createQueryBuilder(User2);
    qb.select('*').populate([{ field: 'user2_cars' }]).where({ 'user2_cars.Car2_inverse': { $in: [ [1, 2], [3, 4] ] } });
    const sql = 'select `e0`.*, `e1`.`user2_first_name` as `fk__user2_first_name`, `e1`.`user2_last_name` as `fk__user2_last_name`, `e1`.`car2_name` as `fk__car2_name`, `e1`.`car2_year` as `fk__car2_year` ' +
      'from `user2` as `e0` left join `user2_cars` as `e1` on `e0`.`first_name` = `e1`.`user2_first_name` and `e0`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) in ((?, ?), (?, ?))';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([1, 2, 3, 4]);
  });

  test('select by m:n with unknown populate ignored', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').populate([{ field: 'not_existing' }]);
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0`');
    expect(qb.getParams()).toEqual([]);
  });

  test('select with operator (simple)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ id: { $nin: [3, 4] } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0` where `e0`.`id` not in (?, ?)');
    expect(qb.getParams()).toEqual([3, 4]);
  });

  test('select with operator (wrapped)', async () => {
    const qb1 = orm.em.createQueryBuilder(Test2);
    qb1.select('*').where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });
    expect(qb1.getQuery()).toEqual('select `e0`.* from `test2` as `e0` where `e0`.`id` not in (?, ?) and `e0`.`id` > ?');
    expect(qb1.getParams()).toEqual([3, 4, 2]);

    const qb2 = orm.em.createQueryBuilder(Test2);
    qb2.select('*').where({ id: { $nin: [3, 4], $gt: 2 } });
    expect(qb2.getQuery()).toEqual(qb1.getQuery());
    expect(qb2.getParams()).toEqual(qb1.getParams());
  });

  test('select with $and', async () => {
    const qb1 = orm.em.createQueryBuilder(Test2);
    qb1.select('*').where({ $and: [{ id: 1 }, { id: 2 }] });
    expect(qb1.getQuery()).toEqual('select `e0`.* from `test2` as `e0` where `e0`.`id` = ? and `e0`.`id` = ?');
    expect(qb1.getParams()).toEqual([1, 2]);
  });

  test('select with operator (not)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $not: { id: { $in: [3, 4] } } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0` where not (`e0`.`id` in (?, ?))');
    expect(qb.getParams()).toEqual([3, 4]);
  });

  test('select with unsupported operator', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    expect(() => qb.select('*').where({ $test: { foo: 'bar' } })).toThrowError('Trying to query by not existing property Test2.$test');
  });

  test('select distinct id with left join', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['distinct `b`.`uuid_pk`', 'b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select distinct via flag', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.uuid', 'b.*', 't.*'], true)
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' })
      .limit(2, 1);
    const sql = 'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select where string literal', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .andWhere('1 = 1')
      .orWhere('1 = 2')
      .limit(2, 1);
    const sql = 'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (((b.title = ? or b.title = ?) and (1 = 1)) or (1 = 2)) ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', 2, 1]);
  });

  test('select with group by and having', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', 'count(t.id) as tags'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having('tags > ?', [0])
      .limit(2, 1);
    const sql = 'select `b`.*, `t`.*, count(t.id) as tags from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (b.title = ? or b.title = ?) ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having (tags > ?) ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', 0, 2, 1]);
  });

  test('select with group by and having with object', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', 'count(t.id) as tags'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having({ $or: [{ 'b.uuid': '...', 'count(t.id)': { $gt: 0 } }, { 'b.title': 'my title' }] })
      .limit(2, 1);
    const sql = 'select `b`.*, `t`.*, count(t.id) as tags from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (b.title = ? or b.title = ?) ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having ((`b`.`uuid_pk` = ? and count(t.id) > ?) or `b`.`title` = ?) ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', '...', 0, 'my title', 2, 1]);
  });

  test('select with operator (and)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $and: [
      { id: { $in: [1, 2, 7] } },
      { id: { $nin: [3, 4] } },
      { id: { $gt: 5 } },
      { id: { $lt: 10 } },
      { id: { $gte: 7 } },
      { id: { $lte: 8 } },
      { id: { $ne: 9 } },
      { $not: { id: { $eq: 10 } } },
    ] });
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0` ' +
      'where `e0`.`id` in (?, ?, ?) ' +
      'and `e0`.`id` not in (?, ?) ' +
      'and `e0`.`id` > ? ' +
      'and `e0`.`id` < ? ' +
      'and `e0`.`id` >= ? ' +
      'and `e0`.`id` <= ? ' +
      'and `e0`.`id` != ? ' +
      'and not (`e0`.`id` = ?)');
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with operator (or)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ $or: [
      { id: { $in: [1, 2, 7] } },
      { id: { $nin: [3, 4] } },
      { id: { $gt: 5 } },
      { id: { $lt: 10 } },
      { id: { $gte: 7 } },
      { id: { $lte: 8 } },
      { id: { $ne: 9 } },
      { $not: { id: { $eq: 10 } } },
    ] });
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0` ' +
      'where (`e0`.`id` in (?, ?, ?) ' +
      'or `e0`.`id` not in (?, ?) ' +
      'or `e0`.`id` > ? ' +
      'or `e0`.`id` < ? ' +
      'or `e0`.`id` >= ? ' +
      'or `e0`.`id` <= ? ' +
      'or `e0`.`id` != ? ' +
      'or not (`e0`.`id` = ?))');
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with smart query conditions', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({ version: {
      $gt: 1,
      $lt: 2,
      $gte: 3,
      $lte: 4,
      $ne: 5,
      $in: [6, 7],
      $nin: [8, 9],
    } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `test2` as `e0` ' +
      'where `e0`.`version` > ? ' +
      'and `e0`.`version` < ? ' +
      'and `e0`.`version` >= ? ' +
      'and `e0`.`version` <= ? ' +
      'and `e0`.`version` != ? ' +
      'and `e0`.`version` in (?, ?) ' +
      'and `e0`.`version` not in (?, ?)');
    expect(qb.getParams()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('select where (not) null via $eq/$ne operators', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ publisher: { $ne: null } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`publisher_id` is not null');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ publisher: { $eq: null } });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`publisher_id` is null');
    expect(qb2.getParams()).toEqual([]);
  });

  test('select count query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.count().where({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('select count(`e0`.`id`) as `count` from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('select count distinct query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.count('id', true).where({ name: 'test 123', type: PublisherType.GLOBAL }).setFlag(QueryFlag.DISTINCT);
    expect(qb.getQuery()).toEqual('select count(distinct `e0`.`id`) as `count` from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('select count with non-standard PK field name (uuid_pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.count().where({ title: 'test 123' });
    expect(qb.getQuery()).toEqual('select count(`e0`.`uuid_pk`) as `count` from `book2` as `e0` where `e0`.`title` = ?');
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select with locking', async () => {
    const qb1 = orm.em.createQueryBuilder(Test2);
    qb1.select('*').where({ name: 'test 123' }).setLockMode(LockMode.OPTIMISTIC);
    expect(qb1.getQuery()).toEqual('select `e0`.* from `test2` as `e0` where `e0`.`name` = ?');

    await orm.em.transactional(async em => {
      const qb2 = em.createQueryBuilder(Book2);
      qb2.select('*').where({ title: 'test 123' }).setLockMode(LockMode.NONE);
      expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ?');

      const qb3 = em.createQueryBuilder(Book2);
      qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ);
      expect(qb3.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ? lock in share mode');

      const qb4 = em.createQueryBuilder(Book2);
      qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE);
      expect(qb4.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ? for update');
    });
  });

  test('select with deep where condition', async () => {
    // m:1
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ author: { name: 'Jon Snow', termsAccepted: true } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`name` = ? and `e1`.`terms_accepted` = ?');
    expect(qb1.getParams()).toEqual(['Jon Snow', true]);

    // 1:m
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.select('*').where({ books: { title: 'Book 1' } });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`title` = ?');
    expect(qb2.getParams()).toEqual(['Book 1']);

    // 1:m -> m:1
    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3.select('*').where({ books: { publisher: { name: 'My Publisher 1' } } });
    expect(qb3.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` where `e2`.`name` = ?');
    expect(qb3.getParams()).toEqual(['My Publisher 1']);

    // 1:m -> m:1 -> m:n
    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').where({ books: { publisher: { tests: { name: 'Test 2' } } } });
    expect(qb4.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
      'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
      'where `e3`.`name` = ?');
    expect(qb4.getParams()).toEqual(['Test 2']);

    // m:n owner pivot join
    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5.select('*').where({ tags: ['1', '2', '3'] });
    expect(qb5.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where `e1`.`book_tag2_id` in (?, ?, ?)');
    expect(qb5.getParams()).toEqual(['1', '2', '3']);

    // m:n owner
    const qb6 = orm.em.createQueryBuilder(Book2);
    qb6.select('*').where({ tags: { name: 'Tag 3' } });
    expect(qb6.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` = ?');
    expect(qb6.getParams()).toEqual(['Tag 3']);

    // m:n inverse pivot join
    const qb7 = orm.em.createQueryBuilder(BookTag2);
    qb7.select('*').where({ books: ['1', '2', '3'] });
    expect(qb7.getQuery()).toEqual('select `e0`.* ' +
      'from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e1` on `e0`.`id` = `e1`.`book_tag2_id` ' +
      'where `e1`.`book2_uuid_pk` in (?, ?, ?)');
    expect(qb7.getParams()).toEqual(['1', '2', '3']);

    // m:n inverse
    const qb8 = orm.em.createQueryBuilder(BookTag2);
    qb8.select('*').where({ books: { title: 'Book 123' } });
    expect(qb8.getQuery()).toEqual('select `e0`.* ' +
      'from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
      'left join `book2` as `e1` on `e2`.`book2_uuid_pk` = `e1`.`uuid_pk` ' +
      'where `e1`.`title` = ?');
    expect(qb8.getParams()).toEqual(['Book 123']);

    // 1:1 -> 1:1 self-reference -> 1:1
    const qb9 = orm.em.createQueryBuilder(FooBar2);
    qb9.select('*').where({ fooBar: { baz: { name: 'Foo Baz' } } });
    expect(qb9.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` ' +
      'left join `foo_bar2` as `e1` on `e0`.`foo_bar_id` = `e1`.`id` ' +
      'left join `foo_baz2` as `e2` on `e1`.`baz_id` = `e2`.`id` ' +
      'where `e2`.`name` = ?');
    expect(qb9.getParams()).toEqual(['Foo Baz']);

    // m:1 -> m:1 -> m:1 self-reference
    const qb10 = orm.em.createQueryBuilder(Book2);
    qb10.select('*').where({ author: { favouriteBook: { author: { name: 'Jon Snow' } } } });
    expect(qb10.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
      'left join `author2` as `e3` on `e2`.`author_id` = `e3`.`id` ' +
      'where `e3`.`name` = ?');
    expect(qb10.getParams()).toEqual(['Jon Snow']);

    // 1:1 from inverse
    const qb11 = orm.em.createQueryBuilder(FooBaz2);
    qb11.select('*').where({ bar: { name: 'Foo Bar' } });
    expect(qb11.getQuery()).toEqual('select `e0`.* from `foo_baz2` as `e0` ' +
      'left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` ' +
      'where `e1`.`name` = ?');
    expect(qb11.getParams()).toEqual(['Foo Bar']);

    // include lazy formulas
    const qb12 = orm.em.createQueryBuilder(FooBar2);
    qb12.select('*').where({ fooBar: { baz: { name: 'Foo Baz' } } }).setFlag(QueryFlag.INCLUDE_LAZY_FORMULAS);
    expect(qb12.getQuery()).toEqual('select `e0`.*, (select 123) as `random`, (select 456) as `lazy_random` from `foo_bar2` as `e0` ' +
      'left join `foo_bar2` as `e1` on `e0`.`foo_bar_id` = `e1`.`id` ' +
      'left join `foo_baz2` as `e2` on `e1`.`baz_id` = `e2`.`id` ' +
      'where `e2`.`name` = ?');
    expect(qb12.getParams()).toEqual(['Foo Baz']);
  });

  test('select with deep where condition with self-reference', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ author: { favouriteAuthor: { name: 'Jon Snow', termsAccepted: true } } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `author2` as `e2` on `e1`.`favourite_author_id` = `e2`.`id` ' +
      'where `e2`.`name` = ? and `e2`.`terms_accepted` = ?');
    expect(qb1.getParams()).toEqual(['Jon Snow', true]);
  });

  test('select with deep order by', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').orderBy({ author: { name: QueryOrder.DESC } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` order by `e1`.`name` desc');

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.select('*').orderBy({ books: { title: QueryOrder.ASC } });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` order by `e1`.`title` asc');

    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3.select('*').orderBy({ books: { publisher: { name: QueryOrder.DESC } } });
    expect(qb3.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` order by `e2`.`name` desc');

    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').orderBy({ books: { publisher: { tests: { name: QueryOrder.DESC } } } });
    expect(qb4.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
      'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
      'order by `e3`.`name` desc');

    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5.select('*').orderBy({ tags: { name: QueryOrder.DESC } });
    expect(qb5.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'order by `e1`.`name` desc');
  });

  test('select with populate and join of 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').populate([{ field: 'books' }]).leftJoin('books', 'b');
    expect(qb.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `b` on `e0`.`id` = `b`.`author_id`');
  });

  test('select with populate and join of m:n', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').populate([{ field: 'tags' }]).leftJoin('tags', 't');
    expect(qb.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id`');
  });

  test('select with deep where and deep order by', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ author: { name: 'Jon Snow' } }).orderBy({ author: { name: QueryOrder.DESC } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`name` = ? order by `e1`.`name` desc');
    expect(qb1.getParams()).toEqual(['Jon Snow']);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.select('*').where({ books: { title: 'Book 1' } }).orderBy({ books: { title: QueryOrder.ASC } });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`title` = ? order by `e1`.`title` asc');
    expect(qb2.getParams()).toEqual(['Book 1']);

    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3.select('*').where({ books: { publisher: { name: 'My Publisher 1' } } }).orderBy({ books: { publisher: { name: QueryOrder.DESC } } });
    expect(qb3.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` where `e2`.`name` = ? order by `e2`.`name` desc');
    expect(qb3.getParams()).toEqual(['My Publisher 1']);

    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.withSchema('test123');
    qb4.select('*').where({ books: { publisher: { tests: { name: 'Test 2' } } } }).orderBy({ books: { publisher: { tests: { name: QueryOrder.DESC } } } });
    expect(qb4.getQuery()).toEqual('select `e0`.* ' +
      'from `test123`.`author2` as `e0` ' +
      'left join `test123`.`book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `test123`.`publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'left join `test123`.`publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
      'left join `test123`.`test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
      'where `e3`.`name` = ? order by `e3`.`name` desc');
    expect(qb4.getParams()).toEqual(['Test 2']);

    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5.select('*').where({ tags: { name: 'Tag 3' } }).orderBy({ tags: { name: QueryOrder.DESC } });
    expect(qb5.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` = ? order by `e1`.`name` desc');
    expect(qb5.getParams()).toEqual(['Tag 3']);
  });

  test('select with deep where condition with operators', async () => {
    const qb0 = orm.em.createQueryBuilder(Book2);
    qb0.select('*').where({ author: { $or: [{ name: 'Jon Snow 1' }, { email: /^snow@/ }] } });
    expect(qb0.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'where (`e1`.`name` = ? or `e1`.`email` like ?)');
    expect(qb0.getParams()).toEqual(['Jon Snow 1', 'snow@%']);

    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ $or: [{ author: { name: 'Jon Snow 1', termsAccepted: true } }, { author: { name: 'Jon Snow 2' } }] });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'where ((`e1`.`name` = ? and `e1`.`terms_accepted` = ?) or `e1`.`name` = ?)');
    expect(qb1.getParams()).toEqual(['Jon Snow 1', true, 'Jon Snow 2']);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ $or: [{ author: { $or: [{ name: 'Jon Snow 1' }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
      'where (((`e1`.`name` = ? or `e1`.`email` like ?)) or `e2`.`name` = ?)');
    expect(qb2.getParams()).toEqual(['Jon Snow 1', 'snow@%', 'My Publisher']);

    const qb3 = orm.em.createQueryBuilder(Book2);
    qb3.select('*').where({ $or: [{ author: { $or: [{ name: { $in: ['Jon Snow 1', 'Jon Snow 2'] } }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb3.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
      'where (((`e1`.`name` in (?, ?) or `e1`.`email` like ?)) or `e2`.`name` = ?)');
    expect(qb3.getParams()).toEqual(['Jon Snow 1', 'Jon Snow 2', 'snow@%', 'My Publisher']);

    const qb4 = orm.em.createQueryBuilder(Book2);
    qb4.select('*').where({ $or: [{ author: { $or: [{ $not: { name: 'Jon Snow 1' } }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb4.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
      'where (((not (`e1`.`name` = ?) or `e1`.`email` like ?)) or `e2`.`name` = ?)');
    expect(qb4.getParams()).toEqual(['Jon Snow 1', 'snow@%', 'My Publisher']);

    const qb5 = orm.em.createQueryBuilder(Author2);
    qb5.select('*').where({ books: { $or: [{ title: 'Book 1' }, { publisher: { name: 'Publisher 1' } }] } });
    expect(qb5.getQuery()).toEqual('select `e0`.* from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'where (`e1`.`title` = ? or `e2`.`name` = ?)');
    expect(qb5.getParams()).toEqual(['Book 1', 'Publisher 1']);

    const qb6 = orm.em.createQueryBuilder(Author2);
    qb6.select('*').where({ books: { publisher: { $or: [{ name: 'My Publisher 1' }, { name: 'My Publisher 2' }] } } });
    expect(qb6.getQuery()).toEqual('select `e0`.* from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'where (`e2`.`name` = ? or `e2`.`name` = ?)');
    expect(qb6.getParams()).toEqual(['My Publisher 1', 'My Publisher 2']);

    const qb7 = orm.em.createQueryBuilder(Book2);
    qb7.select('*').where({ tags: { name: { $in: ['Tag 1', 'Tag 2'] } } });
    expect(qb7.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` in (?, ?)');
    expect(qb7.getParams()).toEqual(['Tag 1', 'Tag 2']);

    const qb8 = orm.em.createQueryBuilder(BookTag2);
    qb8.select('*').where({ books: { test: { name: { $in: ['Test 1', 'Test 2'] } } } });
    expect(qb8.getQuery()).toEqual('select `e0`.* ' +
      'from `book_tag2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
      'left join `book2` as `e1` on `e2`.`book2_uuid_pk` = `e1`.`uuid_pk` ' +
      'left join `test2` as `e3` on `e1`.`uuid_pk` = `e3`.`book_uuid_pk` ' +
      'where `e3`.`name` in (?, ?)');
    expect(qb8.getParams()).toEqual(['Test 1', 'Test 2']);
  });

  test('select with deep where with invalid property throws error', async () => {
    const qb0 = orm.em.createQueryBuilder(Book2);
    const err = 'Trying to query by not existing property Author2.undefinedName';
    expect(() => qb0.select('*').where({ author: { undefinedName: 'Jon Snow' } }).getQuery()).toThrowError(err);
  });

  test('select with invalid query condition throws error', async () => {
    const qb0 = orm.em.createQueryBuilder(Book2);
    const err = `Invalid query condition: { 'e0.author': {} }`;
    expect(() => qb0.select('*').where({ author: {} }).getQuery()).toThrowError(err);
  });

  test('pessimistic locking requires active transaction', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ name: '...' });
    expect(() => qb.setLockMode(LockMode.NONE)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ)).toThrowError('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.OPTIMISTIC).getQuery()).toThrowError('The optimistic lock on entity Author2 failed');
  });

  test('insert query', async () => {
    const qb0 = orm.em.createQueryBuilder(Publisher2);
    qb0.insert([{}, {}]);
    expect(qb0.getQuery()).toEqual('insert into `publisher2` (`id`) values (default), (default)');
    expect(qb0.getParams()).toEqual([]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb1.getQuery()).toEqual('insert into `publisher2` (`name`, `type`) values (?, ?)');
    expect(qb1.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.insert({ name: 'test 123', favouriteBook: '2359', termsAccepted: true });
    expect(qb2.getQuery()).toEqual('insert into `author2` (`favourite_book_uuid_pk`, `name`, `terms_accepted`) values (?, ?, ?)');
    expect(qb2.getParams()).toEqual(['2359', 'test 123', true]);

    const qb3 = orm.em.createQueryBuilder<any>(BookTag2);
    qb3.insert({ books: 123 }).withSchema('test123');
    expect(qb3.getQuery()).toEqual('insert into `test123`.`book_tag2` (`books`) values (?)');
    expect(qb3.getParams()).toEqual([123]);
  });

  test('insert on conflict ignore/merge (GH #1774)', async () => {
    const qb0 = orm.em.createQueryBuilder(Author2);
    qb0.insert({ email: 'ignore@example.com', name: 'John Doe' }).onConflict('email').ignore();
    expect(qb0.getQuery()).toEqual('insert ignore into `author2` (`email`, `name`) values (?, ?)');
    expect(qb0.getParams()).toEqual(['ignore@example.com', 'John Doe']);

    const timestamp = new Date();
    const qb1 = orm.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge({
        name: 'John Doe',
        updatedAt: timestamp,
      });

    expect(qb1.getQuery()).toEqual('insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `name` = ?,`updated_at` = ?');
    expect(qb1.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp, 'John Doe', timestamp]);

    const qb2 = orm.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge();

    expect(qb2.getQuery()).toEqual('insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `created_at` = values(`created_at`), `email` = values(`email`), `name` = values(`name`), `updated_at` = values(`updated_at`)');
    expect(qb2.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb3 = orm.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge(['name', 'updatedAt']);

    expect(qb3.getQuery()).toEqual('insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `name` = values(`name`), `updated_at` = values(`updated_at`)');
    expect(qb3.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb4 = orm.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict()
      .ignore();

    expect(qb4.getQuery()).toEqual('insert ignore into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?)');
    expect(qb4.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb5 = orm.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      });
    expect(() => qb5.ignore()).toThrow('You need to call `qb.onConflict()` first to use `qb.ignore()`');
    expect(() => qb5.merge()).toThrow('You need to call `qb.onConflict()` first to use `qb.merge()`');
  });

  test('insert many query', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.insert([
      { name: 'test 1', type: PublisherType.GLOBAL },
      { name: 'test 2', type: PublisherType.LOCAL },
      { name: 'test 3', type: PublisherType.GLOBAL },
    ]);
    expect(qb1.getQuery()).toEqual('insert into `publisher2` (`name`, `type`) values (?, ?), (?, ?), (?, ?)');
    expect(qb1.getParams()).toEqual(['test 1', PublisherType.GLOBAL, 'test 2', PublisherType.LOCAL, 'test 3', PublisherType.GLOBAL]);
  });

  test('update query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('update `publisher2` set `name` = ?, `type` = ? where `id` = ? and `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]);
  });

  test('update query with column reference', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.update({ price: qb.raw('price + 1') }).where({ uuid: '123' });
    expect(qb.getQuery()).toEqual('update `book2` set `price` = price + 1 where `uuid_pk` = ?');
    expect(qb.getParams()).toEqual(['123']);
  });

  test('update query with JSON type and raw value', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    const raw = qb.raw<any>(`jsonb_set(payload, '$.{consumed}', ?)`, [123]);
    qb.update({ meta: raw }).where({ uuid: '456' });
    expect(qb.getFormattedQuery()).toEqual('update `book2` set `meta` = jsonb_set(payload, \'$.{consumed}\', 123) where `uuid_pk` = \'456\'');
  });

  test('qb.raw() with named bindings', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    const raw = qb.raw<any>(`jsonb_set(payload, '$.{consumed}', :val)`, { val: 123 });
    qb.update({ meta: raw }).where({ uuid: '456' });
    expect(qb.getFormattedQuery()).toEqual('update `book2` set `meta` = jsonb_set(payload, \'$.{consumed}\', 123) where `uuid_pk` = \'456\'');
  });

  test('update query with auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ books: { author: 123 } });
    expect(qb.getQuery()).toEqual('update `publisher2` set `name` = ?, `type` = ? ' +
      'where `id` in (select `e0`.`id` from (' +
      'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`author_id` = ?' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123]);
  });

  test('update query with composite keys and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(FooParam2);
    qb.update({ value: 'test 123' }).where({ bar: { baz: 123 } });
    expect(qb.getQuery()).toEqual('update `foo_param2` set `value` = ?, `version` = current_timestamp(3) ' +
      'where (`bar_id`, `baz_id`) in (select `e0`.`bar_id`, `e0`.`baz_id` from (' +
      'select distinct `e0`.`bar_id`, `e0`.`baz_id` from `foo_param2` as `e0` left join `foo_bar2` as `e1` on `e0`.`bar_id` = `e1`.`id` where `e1`.`baz_id` = ?' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual(['test 123', 123]);
  });

  test('update query with or condition and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ $or: [{ books: { author: 123 } }, { books: { title: 'book' } }] });
    expect(qb.getQuery()).toEqual('update `publisher2` set `name` = ?, `type` = ? ' +
      'where `id` in (select `e0`.`id` from (' +
      'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where (`e1`.`author_id` = ? or `e1`.`title` = ?)' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, 'book']);
  });

  test('delete query with auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ books: { author: 123 } });
    expect(qb.getQuery()).toEqual('delete from `publisher2` where `id` in (select `e0`.`id` from (' +
      'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`author_id` = ?' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual([123]);
  });

  test('delete query with composite keys and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(FooParam2);
    qb.delete({ bar: { baz: 123 } });
    expect(qb.getQuery()).toEqual('delete from `foo_param2` where (`bar_id`, `baz_id`) in (select `e0`.`bar_id`, `e0`.`baz_id` from (' +
      'select distinct `e0`.`bar_id`, `e0`.`baz_id` from `foo_param2` as `e0` left join `foo_bar2` as `e1` on `e0`.`bar_id` = `e1`.`id` where `e1`.`baz_id` = ?' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual([123]);
  });

  test('delete query with or condition and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ $or: [{ books: { author: 123 } }, { books: { title: 'book' } }] });
    expect(qb.getQuery()).toEqual('delete from `publisher2` where `id` in (select `e0`.`id` from (' +
      'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where (`e1`.`author_id` = ? or `e1`.`title` = ?)' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual([123, 'book']);
  });

  test('update query with entity in data', async () => {
    const qb = orm.em.createQueryBuilder<any>(Publisher2);
    qb.withSchema('test123');
    const test = Test2.create('test');
    test.id = 321;
    qb.update({ name: 'test 123', test }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual('update `test123`.`publisher2` set `name` = ?, `test` = ? where `id` = ? and `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', 321, 123, PublisherType.LOCAL]);
  });

  test('delete query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb.getQuery()).toEqual('delete from `publisher2` where `name` = ? and `type` = ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);
  });

  test('delete all query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete();
    expect(qb.getQuery()).toEqual('delete from `publisher2`');
    expect(qb.getParams()).toEqual([]);
  });

  test('lazy delete query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.where({ name: 'test 123', type: PublisherType.GLOBAL }).delete();
    expect(qb.getQuery()).toEqual('delete from `publisher2` where `name` = ? and `type` = ?');
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
    // @ts-ignore
    expect(clone.aliasCounter).toBe(qb.aliasCounter);
    // @ts-ignore
    expect(clone.flags).not.toBe(qb.flags);
    // @ts-ignore
    expect(clone.finalized).toBe(qb.finalized);
    // @ts-ignore
    expect(clone._fields).not.toBe(qb._fields);
    // @ts-ignore
    expect(clone._populate).not.toBe(qb._populate);
    // @ts-ignore
    expect(clone._populateMap).not.toBe(qb._populateMap);
    // @ts-ignore
    expect(clone._joins).not.toBe(qb._joins);
    // @ts-ignore
    expect(clone._aliasMap).not.toBe(qb._aliasMap);
    // @ts-ignore
    expect(clone._cond).not.toBe(qb._cond);
    // @ts-ignore
    expect(clone._orderBy).not.toBe(qb._orderBy);
    // @ts-ignore
    expect(clone._limit).toBe(qb._limit);
    // @ts-ignore
    expect(clone._offset).toBe(qb._offset);

    clone.orWhere({ 'p.name': 'or this name' }).orderBy({ 'p.name': QueryOrder.ASC }).limit(10, 5);

    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'order by `b`.`title` desc ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 2, 1]);

    const sql2 = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where ((`p`.`name` = ? and `b`.`title` like ?) or `p`.`name` = ?) ' +
      'order by `p`.`name` asc ' +
      'limit ? offset ?';
    expect(clone.getQuery()).toEqual(sql2);
    expect(clone.getParams()).toEqual(['test 123', '%3', 'or this name', 10, 5]);
  });

  test('$or and $and combined', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({
      $or: [
        { name: 'value1', email: 'value2' },
        { name: 'value3', email: 'value4' },
      ],
    });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where ((`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?))');

    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select('*').where({
      $or: [
        { $and: [{ name: 'value1', email: 'value2' }] },
        { $and: [{ name: 'value3', email: 'value4' }] },
      ],
    });
    expect(qb2.getQuery()).toEqual('select `a`.* from `author2` as `a` where ((`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?))');

    const qb3 = orm.em.createQueryBuilder(Author2, 'a');
    qb3.select('*').where({
      $and: [
        { name: 'value1' },
        { name: 'value3' },
      ],
    });
    expect(qb3.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`name` = ?');

    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select('*').where({
      $and: [
        { $or: [{ name: 'value1' }] },
        { $or: [{ name: 'value3' }] },
      ],
    });
    expect(qb4.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`name` = ?');

    const qb5 = orm.em.createQueryBuilder(Author2, 'a');
    qb5.select('*').where({
      $and: [
        { $or: [{ name: 'value1' }, { email: 'value2' }] },
        { $or: [{ name: 'value3' }, { email: 'value4' }] },
      ],
    });
    expect(qb5.getQuery()).toEqual('select `a`.* from `author2` as `a` where (`a`.`name` = ? or `a`.`email` = ?) and (`a`.`name` = ? or `a`.`email` = ?)');

    const qb6 = orm.em.createQueryBuilder(Author2, 'a');
    qb6.select('*').where({
      $and: [
        { $or: [{ name: 'value1', email: 'value2' }] },
        { $or: [{ name: 'value3', email: 'value4' }] },
      ],
    });
    expect(qb6.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`email` = ? and `a`.`name` = ? and `a`.`email` = ?');

    const qb7 = orm.em.createQueryBuilder(Author2, 'a');
    qb7.select('*').where({
      $or: [
        { $and: [{ name: 'value1', email: 'value2' }] },
        { $and: [{ name: 'value3', email: 'value4' }] },
        { $or: [{ name: 'value5', email: 'value6' }] },
      ],
    });
    expect(qb7.getQuery()).toEqual('select `a`.* from `author2` as `a` where ((`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?))');

    const qb8 = orm.em.createQueryBuilder(Author2, 'a');
    qb8.select('*').where({
      $and: [
        { $or: [{ name: 'value1', email: 'value2' }] },
        { $or: [{ name: 'value3', email: 'value4' }] },
        { $and: [{ name: 'value5', email: 'value6' }] },
      ],
    });
    expect(qb8.getQuery()).toEqual('select `a`.* from `author2` as `a` where ' +
      '`a`.`name` = ? and `a`.`email` = ? and ' +
      '`a`.`name` = ? and `a`.`email` = ? and ' +
      '`a`.`name` = ? and `a`.`email` = ?');

    const qb9 = orm.em.createQueryBuilder(Author2, 'a');
    qb9.select('*').where({
      $or: [
        { $and: [{ name: 'value1', email: 'value2' }] },
        { $not: { name: 'value3', email: 'value4' } },
        { $or: [{ name: 'value5', email: 'value6' }] },
        { $and: [{ name: 'value7', email: 'value8' }] },
      ],
    });
    expect(qb9.getQuery()).toEqual('select `a`.* from `author2` as `a` where ' +
      '((`a`.`name` = ? and `a`.`email` = ?) or ' +
      'not (`a`.`name` = ? and `a`.`email` = ?) or ' +
      '(`a`.`name` = ? and `a`.`email` = ?) or ' +
      '(`a`.`name` = ? and `a`.`email` = ?))');

    const qb10 = orm.em.createQueryBuilder(Author2, 'a');
    qb10.select('*').where({
      $or: [
        { email: 'value1' },
        { name: { $in: ['value2'], $ne: 'value3' } },
      ],
    });
    expect(qb10.getQuery()).toEqual('select `a`.* from `author2` as `a` where (`a`.`email` = ? or (`a`.`name` in (?) and `a`.`name` != ?))');

    const qb11 = orm.em.createQueryBuilder(Author2, 'a');
    qb11.select('*').where({
      $or: [
        {
          $or: [
            { email: 'value1' },
            { name: { $in: ['value2'], $ne: 'value3' } },
            { email: 'value4' },
          ],
        },
        { $not: { $or: [{ name: 'value5' }, { email: 'value6' }] } },
        {
          $or: [
            {
              $or: [
                { name: 'value7', email: 'value8' },
                { name: 'value9', email: 'value10' },
              ],
            },
            { $or: [{ name: 'value11', email: 'value12' }] },
          ],
        },
      ],
    });
    expect(qb11.getQuery()).toEqual('select `a`.* from `author2` as `a` where (' +
      '((`a`.`email` = ? or (`a`.`name` in (?) and `a`.`name` != ?) or `a`.`email` = ?)) or ' +
      'not ((`a`.`name` = ? or `a`.`email` = ?)) or ' +
      '(' +
        '(' +
          '((' +
            '(`a`.`name` = ? and `a`.`email` = ?) or ' +
            '(`a`.`name` = ? and `a`.`email` = ?)' +
          ')) or ' +
          '(`a`.`name` = ? and `a`.`email` = ?)' +
        ')' +
      ')' +
    ')');
  });

  test('select fk by operator should not trigger auto-joining', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ favouriteBook: { $in: ['1', '2', '3'] } });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`favourite_book_uuid_pk` in (?, ?, ?)');
  });

  test('select and order by auto-joined property', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      $or: [
        { author: { name: 'test' } },
        { publisher: { name: 'RR' } },
      ],
    }).orderBy({
      author: { email: 'ASC' },
    });
    expect(qb1.getQuery()).toEqual('select `a`.*, `a`.price * 1.19 as `price_taxed` from `book2` as `a` ' +
      'left join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
      'left join `publisher2` as `e2` on `a`.`publisher_id` = `e2`.`id` ' +
      'where (`e1`.`name` = ? or `e2`.`name` = ?) ' +
      'order by `e1`.`email` asc');
  });

  test('select with auto-joining and $not (GH issue #1537)', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      $or: [
        { author: { name: 'test' } },
        { $not: { author: { name: 'wut' } } },
      ],
    });
    expect(qb1.getQuery()).toEqual('select `a`.*, `a`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `a` ' +
      'left join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
      'where (`e1`.`name` = ? or not (`e1`.`name` = ?))');
  });

  test('select by PK via operator', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ $in: [1, 2] });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`id` in (?, ?)');
  });

  test('order by virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select(['*', '"1" as code']).where({ $in: [1, 2] }).orderBy({ code: 'asc' });
    expect(qb1.getQuery()).toEqual('select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) order by `code` asc');
  });

  test('having with virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select(['*', '"1" as code']).where({ $in: [1, 2] }).having({
      code: { $gte: 'c' },
      $or: [{ code: { $gt: 'c' } }, { id: { $lt: 3 } }],
    });
    expect(qb1.getQuery()).toEqual('select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) having `code` >= ? and (`code` > ? or `a`.`id` < ?)');
  });

  test('select with sub-query', async () => {
    const knex = orm.em.getKnex();
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: knex.ref('a.id') }).as('Author2.booksTotal');
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(['*', qb1]).orderBy({ booksTotal: 'desc' });
    expect(qb2.getQuery()).toEqual('select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc');
    expect(qb2.getParams()).toEqual([]);

    const qb3 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: knex.ref('a.id') }).as('books_total');
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select(['*', qb3]).orderBy({ booksTotal: 'desc' });
    expect(qb4.getQuery()).toEqual('select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc');
    expect(qb4.getParams()).toEqual([]);
  });

  test('select where sub-query', async () => {
    const knex = orm.em.getKnex();
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: knex.ref('a.id') }).getKnexQuery();
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select('*').withSubQuery(qb1, 'a.booksTotal').where({ 'a.booksTotal': { $in: [1, 2, 3] } });
    expect(qb2.getQuery()).toEqual('select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) in (?, ?, ?)');
    expect(qb2.getParams()).toEqual([1, 2, 3]);

    const qb3 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: knex.ref('a.id') }).getKnexQuery();
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select('*').withSubQuery(qb3, 'a.booksTotal').where({ 'a.booksTotal': 1 });
    expect(qb4.getQuery()).toEqual('select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) = ?');
    expect(qb4.getParams()).toEqual([1]);

    const qb5 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb6 = orm.em.createQueryBuilder(Author2, 'a').select('*').where(`id in (${qb5.getFormattedQuery()})`);
    expect(qb6.getQuery()).toEqual('select `a`.* from `author2` as `a` where (id in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb8 = orm.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: qb7.getKnexQuery() } });
    expect(qb8.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`id` in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > ?)');
    expect(qb8.getParams()).toEqual([100]);
  });

  test('CriteriaNode', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2.name);
    node.payload = { foo: 123 };
    expect(node.process({} as any)).toBe(node.payload);
    expect(inspect(node)).toBe(`CriteriaNode { entityName: 'Author2', key: undefined, payload: { foo: 123 } }`);
  });

  test('getAliasForJoinPath', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2.name);
    node.payload = { foo: 123 };
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    expect(qb.getAliasForJoinPath(node.getPath())).toBe('a');
  });

  test('pivot joining of m:n when target entity is null (GH issue 548)', async () => {
    const qb11 = await orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: null });
    expect(qb11.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) is null');
    expect(qb11.getParams()).toEqual([]);

    const qb2 = await orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ $or: [{ tags: null }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)');
    expect(qb2.getParams()).toEqual(['1']);

    const qb3 = await orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: { name: QueryOrder.ASC } });
    expect(qb3.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'left join `author2` as `e2` on `e1`.`author2_2_id` = `e2`.`id` ' +
      'where `e1`.`author2_2_id` is null ' +
      'order by `e2`.`name` asc');
    expect(qb3.getParams()).toEqual([]);

    const qb4 = await orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: QueryOrder.ASC });
    expect(qb4.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'where `e1`.`author2_2_id` is null ' +
      'order by `e1`.`author2_2_id` asc');
    expect(qb4.getParams()).toEqual([]);
  });

  test('pivot joining of m:n when no target entity needed directly (GH issue 549)', async () => {
    const qb1 = await orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ tags: { id: 1 } });
    expect(qb1.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where `e1`.`book_tag2_id` = ?');
    expect(qb1.getParams()).toEqual(['1']);

    const qb11 = await orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: { name: 'n', year: 1 } });
    expect(qb11.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) = (?, ?)');
    expect(qb11.getParams()).toEqual(['n', 1]);

    const qb12 = await orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: { $in: [{ name: 'n', year: 1 }, { name: 'n', year: 2 }] } });
    expect(qb12.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) in ((?, ?), (?, ?))');
    expect(qb12.getParams()).toEqual(['n', 1, 'n', 2]);

    const qb2 = await orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ $or: [{ tags: { id: null } }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)');
    expect(qb2.getParams()).toEqual(['1']);

    const qb4 = await orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: 1 }).orderBy({ friends: { id: QueryOrder.ASC } });
    expect(qb4.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'where `e1`.`author2_2_id` = ? ' +
      'order by `e1`.`author2_2_id` asc');
    expect(qb4.getParams()).toEqual([1]);
  });

  test('order by asc nulls first', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ name: QueryOrder.ASC_NULLS_FIRST });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by `e0`.`name` asc nulls first');
  });

  test('order by nulls last', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ name: QueryOrder.DESC_NULLS_LAST, type: QueryOrder.ASC_NULLS_LAST });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by `e0`.`name` desc nulls last, `e0`.`type` asc nulls last');
  });

  test('order by custom expression', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ 'length(name)': QueryOrder.DESC, 'type': QueryOrder.ASC });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by length(name) desc, `e0`.`type` asc');
  });

  test('GH issue 786', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({
      $and: [
        { uuid: { $ne: '...' }, createdAt: { $gt: '2020-08-26T20:01:48.863Z' } },
        { tags: { name: { $in: ['tag1'] } } },
      ],
    });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e0`.`uuid_pk` != ? and `e0`.`created_at` > ? and `e1`.`name` in (?)');

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      $and: [
        { tags: { name: { $in: ['tag1'] } } },
        { uuid: { $ne: '...' }, createdAt: { $gt: '2020-08-26T20:01:48.863Z' } },
      ],
    });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` in (?) and `e0`.`uuid_pk` != ? and `e0`.`created_at` > ?');
  });

  test('postgres', async () => {
    const pg = await MikroORM.init<PostgreSqlDriver>({
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22, Configuration2],
      dbName: `mikro_orm_test`,
      type: 'postgresql',
    });
    await pg.getSchemaGenerator().ensureDatabase();

    const qb01 = pg.em.createQueryBuilder(FooBar2);
    qb01.insert({ array: [] });
    expect(qb01.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{}') returning "id", "version"`);

    const qb02 = pg.em.createQueryBuilder(FooBar2);
    qb02.insert({ array: [1, 2, 3] });
    expect(qb02.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{1,2,3}') returning "id", "version"`);

    const qb1 = pg.em.createQueryBuilder(Publisher2);
    qb1.select('*').where({ name: { $contains: 'test' } });
    expect(qb1.getQuery()).toEqual('select "e0".* from "publisher2" as "e0" where "e0"."name" @> $1');
    expect(qb1.getFormattedQuery()).toEqual(`select "e0".* from "publisher2" as "e0" where "e0"."name" @> 'test'`);
    expect(qb1.getParams()).toEqual(['test']);

    const qb2 = pg.em.createQueryBuilder(Publisher2);
    qb2.select('*').where({ name: { $contained: 'test' } });
    expect(qb2.getQuery()).toEqual('select "e0".* from "publisher2" as "e0" where "e0"."name" <@ $1');
    expect(qb2.getParams()).toEqual(['test']);

    const qb3 = pg.em.createQueryBuilder(Publisher2);
    qb3.select('*').where({ name: { $overlap: 'test' } });
    expect(qb3.getQuery()).toEqual('select "e0".* from "publisher2" as "e0" where "e0"."name" && $1');
    expect(qb3.getParams()).toEqual(['test']);

    const qb4 = pg.em.createQueryBuilder(Publisher2);
    qb4.select('*').where({ name: { $ilike: 'test' } });
    expect(qb4.getQuery()).toEqual('select "e0".* from "publisher2" as "e0" where "e0"."name" ilike $1');
    expect(qb4.getParams()).toEqual(['test']);

    const qb5 = pg.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb6 = pg.em.createQueryBuilder(Author2, 'a').select('*').where(`id in (${qb5.getFormattedQuery()})`);
    expect(qb6.getQuery()).toEqual('select "a".* from "author2" as "a" where (id in (select "b"."author_id" from "book2" as "b" where "b"."price" > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = pg.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb8 = pg.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: qb7.getKnexQuery() } });
    expect(qb8.getQuery()).toEqual('select "a".* from "author2" as "a" where "a"."id" in (select "b"."author_id" from "book2" as "b" where "b"."price" > $1)');
    expect(qb8.getParams()).toEqual([100]);

    const qb9 = pg.em.createQueryBuilder(Author2);
    qb9.insert({ email: 'ignore@example.com', name: 'John Doe' }).onConflict('email').ignore();
    expect(qb9.getQuery()).toEqual('insert into "author2" ("email", "name") values ($1, $2) on conflict ("email") do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"');
    expect(qb9.getParams()).toEqual(['ignore@example.com', 'John Doe']);

    const timestamp = new Date();
    const qb10 = pg.em.createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge({
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .where({ updatedAt: { $lt: timestamp } });

    expect(qb10.getQuery()).toEqual('insert into "author2" ("created_at", "email", "name", "updated_at") values ($1, $2, $3, $4) on conflict ("email") do update set "name" = $5,"updated_at" = $6 where "updated_at" < $7 returning "id", "created_at", "updated_at", "age", "terms_accepted"');
    expect(qb10.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp, 'John Doe', timestamp, timestamp]);

    const qb11 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: 123 } });
    expect(qb11.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where ("meta"->>'foo')::float8 = 123`);
    const qb12 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $eq: 123 } } });
    expect(qb12.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where ("meta"->>'foo')::float8 = 123`);
    const qb13 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $lte: 123 } } });
    expect(qb13.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where ("meta"->>'foo')::float8 <= 123`);

    // order by json property
    const qb14 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { foo: 'asc' } });
    expect(qb14.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" order by "meta"->>'foo' asc`);
    const qb15 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { str: 'asc' } } });
    expect(qb15.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" order by "meta"->'bar'->>'str' asc`);
    const qb16 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { num: QueryOrder.DESC } } });
    expect(qb16.getFormattedQuery()).toBe(`select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" order by "meta"->'bar'->>'num' desc`);

    // pessimistic locking
    await pg.em.transactional(async em => {
      const qb1 = em.createQueryBuilder(Book2);
      qb1.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ);
      expect(qb1.getQuery()).toEqual('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where "e0"."title" = $1 for share skip locked');

      const qb2 = em.createQueryBuilder(Book2);
      qb2.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE);
      expect(qb2.getQuery()).toEqual('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where "e0"."title" = $1 for update skip locked');

      const qb3 = em.createQueryBuilder(Book2);
      qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL);
      expect(qb3.getQuery()).toEqual('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where "e0"."title" = $1 for share nowait');

      const qb4 = em.createQueryBuilder(Book2);
      qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL);
      expect(qb4.getQuery()).toEqual('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" where "e0"."title" = $1 for update nowait');

      const qb5 = em.createQueryBuilder(Book2);
      qb5.select('*').leftJoin('author', 'a').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE, ['book2']);
      expect(qb5.getQuery()).toEqual('select "e0".*, "e0".price * 1.19 as "price_taxed" from "book2" as "e0" left join "author2" as "a" on "e0"."author_id" = "a"."id" where "e0"."title" = $1 for update of "book2"');
    });

    // join and select m:n relation with paginate flag (GH #1926)
    const qb = pg.em.createQueryBuilder(Book2, 'b');
    qb.select('*')
      .leftJoinAndSelect('b.tags', 't')
      .where({ 't.name': 'tag name' })
      .setFlag(QueryFlag.PAGINATE)
      .offset(1)
      .limit(20);
    const sql = 'select "b".*, "t"."id" as "t__id", "t"."name" as "t__name", "b".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b" ' +
      'left join "book2_tags" as "e1" on "b"."uuid_pk" = "e1"."book2_uuid_pk" ' +
      'left join "book_tag2" as "t" on "e1"."book_tag2_id" = "t"."id" where "b"."uuid_pk" in ' +
      '(select "b"."uuid_pk" from ' +
      '(select "b"."uuid_pk" from ' +
      '(select "b"."uuid_pk" from "book2" as "b" ' +
      'left join "book2_tags" as "e1" on "b"."uuid_pk" = "e1"."book2_uuid_pk" ' +
      'left join "book_tag2" as "t" on "e1"."book_tag2_id" = "t"."id" where "t"."name" = $1' +
      ') as "b" group by "b"."uuid_pk" limit $2 offset $3' +
      ') as "b")';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['tag name', 20, 1]);

    await pg.close(true);
  });

  test('perf: insert', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.insert({ name: `test ${i}`, type: PublisherType.GLOBAL }).getKnexQuery();
    }
    const took = performance.now() - start;

    if (took > 200) {
      process.stdout.write(`insert test took ${took}\n`);
    }
  });

  test('perf: update', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.update({ name: `test ${i}`, type: PublisherType.GLOBAL }).where({ id: 123 }).getKnexQuery();
    }
    const took = performance.now() - start;

    if (took > 300) {
      process.stdout.write(`update test took ${took}\n`);
    }
  });

  test('joining 1:1 inverse inside $and condition (GH issue 849)', async () => {
    const sql0 = orm.em.createQueryBuilder(FooBaz2).select('*').where({ bar: 123 }).getQuery();
    expect(sql0).toBe('select `e0`.*, `e1`.`id` as `bar_id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?');
    const expected = 'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` in (?)';
    const sql1 = orm.em.createQueryBuilder(FooBaz2).where({ bar: [123] }).getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(FooBaz2).where({ bar: { id: [123] } }).getQuery();
    expect(sql2).toBe(expected);
    const sql3 = orm.em.createQueryBuilder(FooBaz2).where({ bar: { id: { $in: [123] } } }).getQuery();
    expect(sql3).toBe(expected);
    const sql4 = orm.em.createQueryBuilder(FooBaz2).where({ $and: [{ bar: { id: { $in: [123] } } }] }).getQuery();
    expect(sql4).toBe(expected);
    const sql5 = orm.em.createQueryBuilder(FooBaz2).where({ $and: [{ bar: [123] }] }).getQuery();
    expect(sql5).toBe(expected);
    const sql6 = orm.em.createQueryBuilder(FooBaz2).where({ $and: [{ bar: { id: [123] } }] }).getQuery();
    expect(sql6).toBe(expected);
    const sql7 = orm.em.createQueryBuilder(Test2).select('*').where({ book: { $in: ['123'] } }).getQuery();
    expect(sql7).toBe('select `e0`.* from `test2` as `e0` where `e0`.`book_uuid_pk` in (?)');
  });

  test('query by 1:m PK (GH issue 857)', async () => {
    const sql0 = orm.em.createQueryBuilder(Author2).select('*').where({ books: '123' }).getQuery();
    expect(sql0).toBe('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` = ?');
    const expected = 'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` in (?)';
    const sql1 = orm.em.createQueryBuilder(Author2).where({ books: ['123'] }).getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Author2).where({ books: { uuid: ['123'] } }).getQuery();
    expect(sql2).toBe(expected);
    const sql3 = orm.em.createQueryBuilder(Author2).where({ books: { uuid: { $in: ['123'] } } }).getQuery();
    expect(sql3).toBe(expected);
    const sql4 = orm.em.createQueryBuilder(Author2).where({ $and: [{ books: { uuid: { $in: ['123'] } } }] }).getQuery();
    expect(sql4).toBe(expected);
    const sql5 = orm.em.createQueryBuilder(Author2).where({ $and: [{ books: ['123'] }] }).getQuery();
    expect(sql5).toBe(expected);
    const sql6 = orm.em.createQueryBuilder(Author2).where({ $and: [{ books: { uuid: ['123'] } }] }).getQuery();
    expect(sql6).toBe(expected);
  });

  test('count query with auto-joining (GH issue 858)', async () => {
    // m:1 -> 1:1 inverse -> PK
    const sql1 = orm.em.createQueryBuilder(Author2).count().where({ favouriteBook: { test: { id: 1 } } }).getQuery();
    expect(sql1).toBe('select count(`e0`.`id`) as `count` ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`favourite_book_uuid_pk` = `e1`.`uuid_pk` ' +
      'left join `test2` as `e2` on `e1`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
      'where `e2`.`id` = ?');

    const sql2 = orm.em.createQueryBuilder(Author2).select('*').where({ favouriteBook: { test: { id: 1 } } }).getQuery();
    expect(sql2).toBe('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`favourite_book_uuid_pk` = `e1`.`uuid_pk` ' +
      'left join `test2` as `e2` on `e1`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
      'where `e2`.`id` = ?');

    const sql3 = orm.em.createQueryBuilder(Book2).count().where({ test: { id: 1 } }).getQuery();
    expect(sql3).toBe('select count(`e0`.`uuid_pk`) as `count` ' +
      'from `book2` as `e0` ' +
      'left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` ' +
      'where `e1`.`id` = ?');

    const sql4 = orm.em.createQueryBuilder(Book2).select('*').where({ test: { id: 1 } }).getQuery();
    expect(sql4).toBe('select `e0`.*, `e1`.`id` as `test_id`, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` ' +
      'where `e1`.`id` = ?');
  });

  test('deeply nested array condition without operator (GH issue 860)', async () => {
    // 1:1 inverse -> m:n inverse -> [PK]
    let expected = 'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` left join `test2_bars` as `e2` on `e1`.`id` = `e2`.`foo_bar2_id` where `e2`.`test2_id` in (?, ?, ?)';
    const sql1 = orm.em.createQueryBuilder(FooBaz2).where({ bar: { tests: { $in: [1, 2, 3] } } }).getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(FooBaz2).where({ bar: { tests: [1, 2, 3] } }).getQuery();
    expect(sql2).toBe(expected);

    expected = 'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` left join `test2_bars` as `e2` on `e1`.`id` = `e2`.`foo_bar2_id` where `e2`.`test2_id` = ?';
    const sql3 = orm.em.createQueryBuilder(FooBaz2).where({ bar: { tests: 3 } }).getQuery();
    expect(sql3).toBe(expected);
  });

  test('index hints', async () => {
    const sql1 = orm.em.createQueryBuilder(Author2)
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql1).toBe("select `e0`.* from `author2` as `e0` force index(custom_email_index_name) where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')");

    const sql2 = orm.em.createQueryBuilder(Author2).withSchema('my_schema')
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql2).toBe("select `e0`.* from `my_schema`.`author2` as `e0` force index(custom_email_index_name) where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')");

    const sql3 = orm.em.createQueryBuilder(Author2).withSchema('my_schema')
      .update({ name: '...' })
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql3).toBe("update `my_schema`.`author2` force index(custom_email_index_name) set `name` = '...' where `favourite_book_uuid_pk` in ('1', '2', '3')");
  });

  test('$or operator inside auto-joined relation', async () => {
    const query = {
      author: {
        $or: [
          { id: 123 },
          { name: { $like: `%jon%` } },
        ],
      },
    };
    const expected = "select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where (`e1`.`id` = 123 or `e1`.`name` like '%jon%')";
    const sql1 = orm.em.createQueryBuilder(Book2).select('*').where(query).getFormattedQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Book2).where(query).getFormattedQuery();
    expect(sql2).toBe(expected);
  });

  afterAll(async () => orm.close(true));

});
