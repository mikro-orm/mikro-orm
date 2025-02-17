import { inspect } from 'node:util';
import {
  LockMode,
  MikroORM,
  QueryFlag,
  QueryOrder,
  raw,
  RawQueryFragment,
  sql,
  UnderscoreNamingStrategy,
} from '@mikro-orm/core';
import { CriteriaNode, QueryBuilder, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { v4 } from 'uuid';
import { Address2, Author2, Book2, BookTag2, Car2, CarOwner2, Configuration2, FooBar2, FooBaz2, FooParam2, Publisher2, PublisherType, Test2, User2 } from './entities-sql/index.js';
import { initORMMySql, mockLogger } from './bootstrap.js';
import { BaseEntity2 } from './entities-sql/BaseEntity2.js';
import { performance } from 'node:perf_hooks';
import { BaseEntity22 } from './entities-sql/BaseEntity22.js';

describe('QueryBuilder', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql('mysql', {
      namingStrategy: class NS extends UnderscoreNamingStrategy {

        override aliasName(entityName: string, index: number): string {
          return 'e' + index;
        }

      },
    }, true);
  });
  afterEach(() => expect(RawQueryFragment.checkCacheSize()).toBe(0));
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('select query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? order by `e0`.`name` desc, `e0`.`type` asc limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [raw(`(point(location_latitude, location_longitude) <@> point(?, ?))`, [53, 9])]: 'ASC' });
    expect(qb1.getFormattedQuery()).toBe('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = \'test 123\' and `e0`.`type` = \'global\' order by (point(location_latitude, location_longitude) <@> point(53, 9)) asc');

    const qb2 = orm.em.createQueryBuilder(Publisher2);
    qb2.select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [raw(`(point(location_latitude, location_longitude) <@> point(?, ?))`, [53.46, 9.90])]: 'ASC' });
    expect(qb2.getFormattedQuery()).toBe('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = \'test 123\' and `e0`.`type` = \'global\' order by (point(location_latitude, location_longitude) <@> point(53.46, 9.9)) asc');

    // trying to modify finalized QB will throw
    expect(() => qb2.where('foo = 123')).toThrow('This QueryBuilder instance is already finalized, clone it first if you want to modify it.');
  });

  test('select query picks read replica', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL });
    const spy = vi.spyOn(MySqlDriver.prototype, 'getConnection');
    await qb.execute();
    expect(spy).toHaveBeenCalledWith('read');
  });

  test('insert query picks write replica', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    const spy = vi.spyOn(MySqlDriver.prototype, 'getConnection');
    await qb.execute('run');
    expect(spy).toHaveBeenCalledWith('write');
  });

  test('select where is null', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ type: null }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`type` is null limit ? offset ?');
    expect(qb.getParams()).toEqual([2, 1]);
  });

  test('awaiting the QB instance', async () => {
    const qb1 = orm.em.qb(Publisher2);
    const res1 = await qb1.insert({ name: 'p1', type: PublisherType.GLOBAL });
    expect(res1.insertId > 0).toBe(true); // test the type
    expect(res1.insertId).toBeGreaterThanOrEqual(1);

    const qb2 = orm.em.qb(Publisher2);
    const res2 = await qb2.select('*').where({ name: 'p1' }).limit(5);
    expect(res2.map(p => p.name)).toEqual(['p1']); // test the type
    expect(res2).toHaveLength(1);
    expect(res2[0]).toBeInstanceOf(Publisher2);

    const qb3 = orm.em.qb(Publisher2);
    const res3 = await qb3.count().where({ name: 'p1' });
    expect(res3 > 0).toBe(true); // test the type
    expect(res3).toBe(1);

    const qb4 = orm.em.qb(Publisher2);
    const res4 = await qb4.update({ type: PublisherType.LOCAL }).where({ name: 'p1' });
    expect(res4.affectedRows > 0).toBe(true); // test the type
    expect(res4.affectedRows).toBe(1);

    const qb5 = orm.em.qb(Publisher2);
    const res5 = await qb5.delete().where({ name: 'p1' });
    expect(res5.affectedRows > 0).toBe(true); // test the type
    expect(res5.affectedRows).toBe(1);
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
    qb.select(sql`1`).where({ id: 123 });
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
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb')
      .select(['fb.*', 'fz.*'])
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
      // @ts-expect-error
      .populate([{ field: 'asd' }])
      .setFlag(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)
      .limit(2, 1);
    expect(qb.hasFlag(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)).toBe(true);
    const sql = 'select `fz`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `fz` left join `foo_bar2` as `e1` on `fz`.`id` = `e1`.`baz_id` limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual([2, 1]);
  });

  test('validation of unknown alias', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*').joinAndSelect('fb1.baz', 'fz');
    expect(() => qb.join('fb0.baz', 'b')).toThrow(`Trying to join 'baz' with alias 'fb0', but 'fb0' is not a known alias. Available aliases are: 'fb1', 'fz'.`);
  });

  test('complex select with mapping of joined results', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*').joinAndSelect('fb1.baz', 'fz');

    const err = `Trying to join 'fz.fooBar', but 'fooBar' is not a defined relation on FooBaz2`;
    expect(() => qb.leftJoinAndSelect('fz.fooBar', 'fb2')).toThrow(err);

    qb.leftJoinAndSelect('fz.bar', 'fb2')
      .where({ 'fz.name': 'baz' })
      .limit(1);
    const sql = 'select `fb1`.*, ' +
      '`fz`.`id` as `fz__id`, `fz`.`name` as `fz__name`, `fz`.`code` as `fz__code`, `fz`.`version` as `fz__version`, ' +
      '`fb2`.`id` as `fb2__id`, `fb2`.`name` as `fb2__name`, `fb2`.`name with space` as `fb2__name with space`, `fb2`.`baz_id` as `fb2__baz_id`, `fb2`.`foo_bar_id` as `fb2__foo_bar_id`, `fb2`.`version` as `fb2__version`, `fb2`.`blob` as `fb2__blob`, `fb2`.`blob2` as `fb2__blob2`, `fb2`.`array` as `fb2__array`, `fb2`.`object_property` as `fb2__object_property`, (select 123) as `fb2__random`, ' +
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
      '`fz`.`id` as `fz__id`, `fz`.`name` as `fz__name`, `fz`.`code` as `fz__code`, `fz`.`version` as `fz__version`, ' +
      '`fb2`.`id` as `fb2__id`, `fb2`.`name` as `fb2__name`, `fb2`.`name with space` as `fb2__name with space`, `fb2`.`baz_id` as `fb2__baz_id`, `fb2`.`foo_bar_id` as `fb2__foo_bar_id`, `fb2`.`version` as `fb2__version`, `fb2`.`blob` as `fb2__blob`, `fb2`.`blob2` as `fb2__blob2`, `fb2`.`array` as `fb2__array`, `fb2`.`object_property` as `fb2__object_property`, (select 123) as `fb2__random`, ' +
      '(select 123) as `random` from `foo_bar2` as `fb1` ' +
      'inner join `foo_baz2` as `fz` on `fb1`.`baz_id` = `fz`.`id` ' +
      'left join `foo_bar2` as `fb2` on `fz`.`id` = `fb2`.`baz_id` ' +
      'where `fb1`.`id` in (' +
      'select `fb1`.`id` from (' +
      'select `fb1`.`id` from `foo_bar2` as `fb1` ' +
      'inner join `foo_baz2` as `fz` on `fb1`.`baz_id` = `fz`.`id` ' +
      'left join `foo_bar2` as `fb2` on `fz`.`id` = `fb2`.`baz_id` ' +
      'where `fz`.`name` = ? group by `fb1`.`id` limit ?) ' +
      'as `fb1`)';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['baz', 1]);
    await qb.execute();
  });

  test('join and select with empty collections', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select('*')
      .leftJoinAndSelect('fb.tests', 't')
      .orderBy({ name: 1 });

    await orm.em.insert(Test2, { id: 1, name: 't' });
    await orm.em.insert(FooBar2, { id: 1, name: 'fb 1', tests: [] });
    await orm.em.insert(FooBar2, { id: 2, name: 'fb 2', tests: [1] });
    const res = await qb.getResultList();
    expect(res[0].tests.isInitialized()).toBe(true);
    expect(res[0].tests.getItems()).toHaveLength(0);
    expect(res[1].tests.isInitialized()).toBe(true);
    expect(res[1].tests.getItems()).toHaveLength(1);
    await orm.schema.clearDatabase();
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
      .where({ 'a.name': 'test 123' });
    const sql = 'select `a`.*, `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'where `a`.`name` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b')
      .where({ 'b.title': 'test 123' });
    const sql = 'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` on `a`.`id` = `b`.`author_id` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin 1:m with $not in extra condition (GH #3504)', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b', { $not: { 'b.title': '456' } })
      .where({ 'b.title': 'test 123' });
    const sql = 'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` on `a`.`id` = `b`.`author_id` and not (`b`.`title` = ?) ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['456', 'test 123']);
    await qb;
  });

  test('select leftJoin 1:m with custom sql fragments', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b', {
        [sql`json_contains(b.meta, ${{ 'b.foo': 'bar' }})`]: [],
        [raw('json_contains(`b`.`meta`, ?) = ?', [{ 'b.foo': 'bar' }, false])]: [],
        [sql.lower(a => `${a}.title`)]: '321',
      })
      .where({ 'b.title': 'test 123' });
    expect(qb.getQuery()).toEqual('select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` ' +
      'on `a`.`id` = `b`.`author_id` ' +
      'and json_contains(b.meta, ?) ' +
      'and json_contains(`b`.`meta`, ?) = ? ' +
      'and lower(b.title) = ? ' +
      'where `b`.`title` = ?');
    expect(qb.getParams()).toEqual([{ 'b.foo': 'bar' }, { 'b.foo': 'bar' }, false, '321', 'test 123']);
    expect(qb.getFormattedQuery()).toEqual('select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` ' +
      'on `a`.`id` = `b`.`author_id` ' +
      'and json_contains(b.meta, \'{\\"b.foo\\":\\"bar\\"}\') ' +
      'and json_contains(`b`.`meta`, \'{\\"b.foo\\":\\"bar\\"}\') = false ' +
      'and lower(b.title) = \'321\' ' +
      "where `b`.`title` = 'test 123'");
  });

  test('select leftJoin 1:m with multiple conditions', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.*', 'b.*'])
      .leftJoin('a.books', 'b', {
        'b.baz': { $gt: 1, $lte: 10 },
        'b.title': { $fulltext: 'test' },
        '$or': [
          {
            'b.foo': null,
            'b.qux': { $ne: null },
            'b.quux': { $eq: null },
            'b.baz': 0,
          },
          {
            'b.foo': { $nin: [0, 1] },
            'b.baz': { $in: [2, 3] },
            'b.qux': { $exists: true },
            'b.bar': /test/,
          },
          {
            'b.qux': { $exists: false },
            'b.bar': /^(te){1,3}st$/,
          },
          {
            $and: [
              { [raw('json_contains(`b`.`meta`, ?)', [{ 'b.foo': 'bar' }])]: [] },
              { [raw('json_contains(`b`.`meta`, ?) = ?', [{ 'b.foo': 'bar' }, false])]: [] },
              { [raw('lower(??)', ['b.title'])]: '321' },
            ],
          },
        ],
      })
      .where({ 'b.title': 'test 123' });
    const sql2 = 'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` ' +
      'on `a`.`id` = `b`.`author_id` ' +
      'and `b`.`baz` > ? and `b`.`baz` <= ? ' +
      'and match(??) against (? in boolean mode) ' +
      'and ((`b`.`foo` is null and `b`.`qux` is not null and `b`.`quux` is null and `b`.`baz` = ?) or (`b`.`foo` not in (?, ?) and `b`.`baz` in (?, ?) and `b`.`qux` is not null and `b`.`bar` like ?) or (`b`.`qux` is null and `b`.`bar` regexp ?) or (json_contains(`b`.`meta`, ?) and json_contains(`b`.`meta`, ?) = ? and lower(??) = ?)) ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql2);
    expect(qb.getParams()).toEqual([1, 10, 'b.title', 'test', 0, 0, 1, 2, 3, '%test%', '^(te){1,3}st$', { 'b.foo': 'bar' }, { 'b.foo': 'bar' }, false, 'b.title', '321', 'test 123']);
  });

  test('select leftJoin m:n owner', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.select(['b.*', 't.*'])
      .leftJoin('b.tags', 't')
      .where({ 't.name': 'test 123' });
    const sql = 'select `b`.*, `t`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `t`.`name` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin m:n inverse', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' });
    const sql = 'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select join and leftJoin combined', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ });
    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3']);
  });

  test('select with leftJoin for same property multiple times', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.select(['p.*', 'b.*', 'b2.*'])
      .leftJoin('books', 'b')
      .leftJoin('books', 'b2')
      .where({ 'b.title': 'test 123', 'b2.title': /3$/ });
    const sql = 'select `p`.*, `b`.*, `b2`.* ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'left join `book2` as `b2` on `p`.`id` = `b2`.`publisher_id` ' +
      'where `b`.`title` = ? and `b2`.`title` like ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3']);
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
    qb1.select('*').where({
      [raw('json_contains(`e0`.`meta`, ?)', [{ foo: 'bar' }])]: [],
    });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.`meta`, ?)');
    expect(qb1.getParams()).toEqual([{ foo: 'bar' }]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      [raw(a => `json_contains(\`${a}\`.??, ?) = ?`, ['meta', { foo: 'baz' }, false])]: [],
    });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.??, ?) = ?');
    expect(qb2.getParams()).toEqual(['meta', { foo: 'baz' }, false]);
  });

  test('select with prototype-less object', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    const filter = Object.create(null);
    filter.meta = { foo: 'bar' };
    qb1.select('*').where(filter);
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where json_extract(`e0`.`meta`, \'$.foo\') = ?');
    expect(qb1.getParams()).toEqual(['bar']);
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

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: new RegExp('^c.o.*l-te.*st.c.m$', 'i') });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['(?i)^c.o.*l-te.*st.c.m$']);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: /^c.o.*l-te.*st.c.m$/i });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` regexp ?');
    expect(qb.getParams()).toEqual(['(?i)^c.o.*l-te.*st.c.m$']);
  });

  test('$exists operator', async () => {
    let qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $exists: true } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` is not null');
    expect(qb.getParams()).toEqual([]);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $exists: false } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` is null');
    expect(qb.getParams()).toEqual([]);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ books: { title: { $exists: true } } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`title` is not null');
    expect(qb.getParams()).toEqual([]);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ books: { title: { $exists: false } } });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`title` is null');
    expect(qb.getParams()).toEqual([]);
  });

  test('select by m:1', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ favouriteBook: '123' });
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0` where `e0`.`favourite_book_uuid_pk` = ?');
    expect(qb.getParams()).toEqual(['123']);
  });

  test('GH #1668', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select(raw('floor(`a`.`age`) as `books_total`'))
      .groupBy('booksTotal')
      .orderBy({ booksTotal: QueryOrder.ASC });

    expect(qb1.getQuery()).toEqual('select floor(`a`.`age`) as `books_total` from `author2` as `a` group by `books_total` order by `books_total` asc');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(raw('floor(`a`.`age`) as `code`'))
      .groupBy('code')
      .orderBy({ code: QueryOrder.ASC });

    expect(qb2.getQuery()).toEqual('select floor(`a`.`age`) as `code` from `author2` as `a` group by `code` order by `code` asc');
    expect(qb2.getParams()).toEqual([]);
  });

  test('GH #4104', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).as('Author2.booksTotal');
    qb.select(['*', qb1])
      .where({ books: { title: 'foo' } })
      .limit(1)
      .orderBy({ booksTotal: QueryOrder.ASC });

    await qb;
    expect(qb.getQuery()).toEqual('select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` where `a`.`id` in (select `a`.`id` from (select `a`.`id`, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` where `e1`.`title` = ? group by `a`.`id` order by min(`books_total`) asc limit ?) as `a`) order by `books_total` asc');
    expect(qb.getParams()).toEqual(['foo', 1]);
  });

  test('missing where clause', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a')
      .select('*').where({
        books: {
          $and: [
            {
              publisher: {
                $and: [
                  {
                    name: 'name',
                  },
                ],
              },
            },
          ],
        },
      });
    expect(qb1.getQuery()).toBe('select `a`.* from `author2` as `a` ' +
      'left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'where `e2`.`name` = ?');

    const qb2 = orm.em.createQueryBuilder(Author2, 'a')
      .select('*').where({
        $or: [
          {
            $and: [
              { books2: { $and: [{ publisher: { $and: [{ tests: { $and: [{ name: { $in: ['name'] } }] } }] } }] } },
            ],
          },
        ],
      });
    expect(qb2.getQuery()).toBe('select `a`.* from `author2` as `a` ' +
      'left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` ' +
      'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
      'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
      'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
      'where `e3`.`name` in (?)');
  });

  test('GH #5565', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select('*')
      .limit(1)
      .orderBy({ books: { tags: { id: QueryOrder.ASC } } })
      .populate([{ field: 'friends' }]);

    await qb;
    expect(qb.getQuery()).toEqual('select `a`.* from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` left join `book2_tags` as `e2` on `e1`.`uuid_pk` = `e2`.`book2_uuid_pk` where `a`.`id` in (select `a`.`id` from (select `a`.`id` from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` left join `book2_tags` as `e2` on `e1`.`uuid_pk` = `e2`.`book2_uuid_pk` group by `a`.`id` order by min(`e2`.`book_tag2_id`) asc limit ?) as `a`) order by `e2`.`book_tag2_id` asc');
    expect(qb.getParams()).toEqual([1]);
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
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (search by association)', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ bar: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ id: 123 }).populate([{ field: 'bar' }]);
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 }).populate([{ field: 'test' }]);
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate() before where() (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').populate([{ field: 'test' }]).where({ test: 123 });
    expect(qb.getQuery()).toEqual('select `e0`.*, `e1`.`id` as `e1__id`, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?');
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

  test('select by m:n with unknown populate ignored', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    // @ts-expect-error
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
    expect(() => qb.select('*').where({ $test: { foo: 'bar' } })).toThrow('Trying to query by not existing property Test2.$test');
  });

  test('select distinct id with left join', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select([raw('distinct `b`.`uuid_pk`'), 'b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' });
    const sql = 'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select distinct via flag', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.uuid', 'b.*', 't.*'], true)
      .leftJoin('t.books', 'b')
      .where({ 'b.title': 'test 123' });
    const sql = 'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select where string literal', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*'])
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .andWhere('1 = 1')
      .orWhere('1 = 2');
    const sql = 'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (((b.title = ? or b.title = ?) and (1 = 1)) or (1 = 2))';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321' ]);
  });

  test('select with group by and having', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', sql`count(t.id)`.as('tags')])
      .addSelect(sql.ref('b.title').as('book_title'))
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having('tags > ?', [0])
      .andHaving('tags < ?', [1])
      .orHaving('tags <> ?', [2]);
    const query = 'select `b`.*, `t`.*, count(t.id) as `tags`, `b`.`title` as `book_title` ' +
      'from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (b.title = ? or b.title = ?) ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having (((tags > ?) and (tags < ?)) or (tags <> ?))';
    expect(qb.getQuery()).toEqual(query);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', 0, 1, 2]);
  });

  test('select with group by and having with object', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.select(['b.*', 't.*', raw('count(t.id) as tags')])
      .leftJoin('t.books', 'b')
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having({ $or: [{ 'b.uuid': '...', [raw('count(t.id)')]: { $gt: 0 } }, { 'b.title': 'my title' }] });
    const sql = 'select `b`.*, `t`.*, count(t.id) as tags from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (b.title = ? or b.title = ?) ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having ((`b`.`uuid_pk` = ? and count(t.id) > ?) or `b`.`title` = ?)';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', '...', 0, 'my title']);
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
    expect(qb.getQuery()).toEqual('select count(*) as `count` from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ?');
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
    expect(qb.getQuery()).toEqual('select count(*) as `count` from `book2` as `e0` where `e0`.`title` = ?');
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

  test('select formula property explicitly', async () => {
    const qb1 = orm.em.createQueryBuilder(FooBar2);
    qb1.select('random').where({ id: 1 });
    expect(qb1.getQuery()).toEqual('select (select 123) as `random` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb1.getParams()).toEqual([1]);

    const qb2 = orm.em.createQueryBuilder(FooBar2);
    qb2.select('*').where({ id: 1 });
    expect(qb2.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb2.getParams()).toEqual([1]);

    const qb3 = orm.em.createQueryBuilder(FooBar2);
    qb3.select('*').where({ random: { $gt: 0.5 } });
    expect(qb3.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` where (select 123) > ?');
    expect(qb3.getParams()).toEqual([0.5]);

    const qb4 = orm.em.createQueryBuilder(FooBar2);
    qb4.select('*').having({ random: { $gt: 0.5 } });
    expect(qb4.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` having (select 123) > ?');
    expect(qb4.getParams()).toEqual([0.5]);
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
    expect(() => qb0.select('*').where({ author: { undefinedName: 'Jon Snow' } }).getQuery()).toThrow(err);
  });

  test('pessimistic locking requires active transaction', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ name: '...' });
    expect(() => qb.setLockMode(LockMode.NONE)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.OPTIMISTIC).getQuery()).toThrow('The optimistic lock on entity Author2 failed');
  });

  test('insert query', async () => {
    const qb0 = orm.em.createQueryBuilder(Publisher2);
    qb0.insert([{}, {}] as any);
    expect(qb0.getQuery()).toEqual('insert into `publisher2` (`id`) values (?), (?)');
    expect(qb0.getParams()).toEqual([sql`default`, sql`default`]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb1.getQuery()).toEqual('insert into `publisher2` (`name`, `type`) values (?, ?)');
    expect(qb1.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.insert({ name: 'test 123', email: 'e', favouriteBook: '2359', termsAccepted: true });
    expect(qb2.getQuery()).toEqual('insert into `author2` (`name`, `email`, `favourite_book_uuid_pk`, `terms_accepted`) values (?, ?, ?, ?)');
    expect(qb2.getParams()).toEqual(['test 123', 'e', '2359', true]);

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

    expect(qb1.getQuery()).toEqual('insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `name` = ?, `updated_at` = ?');
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
    qb.update({ price: raw('price + 1') }).where({ uuid: '123' });
    expect(qb.getFormattedQuery()).toEqual('update `book2` set `price` = price + 1 where `uuid_pk` = \'123\'');
  });

  test('count query with column reference', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    await qb.where({ price: raw('price + 1') }).getCount();
  });

  test('gh issue 3182', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    await qb.count('id', true).getCount();
  });

  test('update query with JSON type and raw value', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    const meta = sql`jsonb_set(payload, '$.{consumed}', ${123})`;
    qb.update({ meta }).where({ uuid: '456' });
    expect(qb.getFormattedQuery()).toEqual('update `book2` set `meta` = jsonb_set(payload, \'$.{consumed}\', 123) where `uuid_pk` = \'456\'');
  });

  test('raw() with named bindings', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    const meta = raw(`jsonb_set(payload, '$.{consumed}', :val)`, { val: 123 });
    qb.update({ meta }).where({ uuid: '456' });
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
    expect(qb.getQuery()).toEqual('update `foo_param2` set `value` = ?, `version` = ? ' +
      'where (`bar_id`, `baz_id`) in (select `e0`.`bar_id`, `e0`.`baz_id` from (' +
      'select distinct `e0`.`bar_id`, `e0`.`baz_id` from `foo_param2` as `e0` left join `foo_bar2` as `e1` on `e0`.`bar_id` = `e1`.`id` where `e1`.`baz_id` = ?' +
      ') as `e0`)');
    expect(qb.getParams()).toEqual(['test 123', sql`current_timestamp(3)`, 123]);
  });

  test('update query with joins', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL })
      .join('p.books', 'b', { title: 'foo' })
      .where({ 'b.author': 123 });
    expect(qb.getQuery()).toEqual('update `publisher2` as `p` ' +
      'inner join `book2` as `b` on `p`.`id` = `b`.`publisher_id` and `b`.`title` = ? ' +
      'set `name` = ?, `type` = ? ' +
      'where `b`.`author_id` = ?');
    expect(qb.getParams()).toEqual(['foo', 'test 123', PublisherType.GLOBAL, 123]);
  });

  test('trying to call qb.update/delete() after qb.where() will throw', async () => {
    const err1 = 'You are trying to call `qb.where().update()`. Calling `qb.update()` before `qb.where()` is required.';
    expect(() => orm.em.qb(Publisher2).where({ id: 123, type: PublisherType.LOCAL }).update({ name: 'test 123', type: PublisherType.GLOBAL })).toThrow(err1);
    expect(() => orm.em.qb(Book2).where({ uuid: { $in: ['1', '2', '3'] }, author: 123 }).update({ author: 321 })).toThrow(err1);
    expect(() => orm.em.qb(FooParam2).where({ bar: { baz: 123 } }).update({ value: 'test 123' })).toThrow(err1);

    expect(() => orm.em.qb(Author2).where({
      $or: [
        { email: 'value1' },
        { name: { $in: ['value2'], $ne: 'value3' } },
      ],
    }).update({ name: '123' })).toThrow(err1);

    const qb2 = orm.em.createQueryBuilder(FooParam2);
    const err2 = 'You are trying to call `qb.where().delete()`. Calling `qb.delete()` before `qb.where()` is required.';
    expect(() => qb2.where({ bar: { baz: 123 } }).delete()).toThrow(err2);
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

  test('delete with complex where', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.delete({ author: { id: { $in: [1, 2, 3] } } });
    expect(qb.getQuery()).toEqual('delete from `book2` where `author_id` in (?, ?, ?)');
    expect(qb.getParams()).toEqual([1, 2, 3]);
  });

  test('delete all query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete();
    expect(qb.getQuery()).toEqual('delete from `publisher2`');
    expect(qb.getParams()).toEqual([]);
  });

  test('clone QB', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC });

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
    expect(clone._aliases).not.toBe(qb._aliases);
    // @ts-ignore
    expect(clone._cond).not.toBe(qb._cond);
    // @ts-ignore
    expect(clone._orderBy).not.toBe(qb._orderBy);
    // @ts-ignore
    expect(clone._limit).toBe(qb._limit);
    // @ts-ignore
    expect(clone._offset).toBe(qb._offset);

    clone.orWhere({ 'p.name': 'or this name' }).orderBy({ 'p.name': QueryOrder.ASC });

    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'order by `b`.`title` desc';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3']);

    const sql2 = 'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where ((`p`.`name` = ? and `b`.`title` like ?) or `p`.`name` = ?) ' +
      'order by `p`.`name` asc';
    expect(clone.getQuery()).toEqual(sql2);
    expect(clone.getParams()).toEqual(['test 123', '%3', 'or this name']);
  });

  test('automatic pagination when to-many join detected together with offset/limit', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p')
      .leftJoinAndSelect('books', 'b')
      .joinAndSelect('b.author', 'a')
      .joinAndSelect('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .limit(10, 5);
    await qb;

    const sql = 'select `p`.*, `b`.`uuid_pk` as `b__uuid_pk`, `b`.`created_at` as `b__created_at`, `b`.`isbn` as `b__isbn`, `b`.`title` as `b__title`, `b`.`price` as `b__price`, `b`.price * 1.19 as `b__price_taxed`, `b`.`double` as `b__double`, `b`.`meta` as `b__meta`, `b`.`author_id` as `b__author_id`, `b`.`publisher_id` as `b__publisher_id`, ' +
      '`a`.`id` as `a__id`, `a`.`created_at` as `a__created_at`, `a`.`updated_at` as `a__updated_at`, `a`.`name` as `a__name`, `a`.`email` as `a__email`, `a`.`age` as `a__age`, `a`.`terms_accepted` as `a__terms_accepted`, `a`.`optional` as `a__optional`, `a`.`identities` as `a__identities`, `a`.`born` as `a__born`, `a`.`born_time` as `a__born_time`, `a`.`favourite_book_uuid_pk` as `a__favourite_book_uuid_pk`, `a`.`favourite_author_id` as `a__favourite_author_id`, `a`.`identity` as `a__identity`, ' +
      '`t`.`id` as `t__id`, `t`.`name` as `t__name` ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`id` in (' +
      'select `p`.`id` from (' +
      'select `p`.`id` from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'group by `p`.`id` ' +
      'order by min(`b`.`title`) desc ' +
      'limit ? offset ?' +
      ') as `p`) ' +
      'order by `b`.`title` desc';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 10, 5]);
  });

  test('disabling automatic pagination', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .setFlag(QueryFlag.DISABLE_PAGINATE)
      .limit(10, 5);

    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'order by `b`.`title` desc ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 10, 5]);
  });

  test('group by disables automatic pagination', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .groupBy('a.id')
      .limit(10, 5);

    const sql = 'select `p`.*, `b`.*, `a`.*, `t`.* ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'group by `a`.`id` ' +
      'order by `b`.`title` desc ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3', 10, 5]);
  });

  test('qb.getCount() removes limit, offset and order by clauses', async () => {
    const logger = mockLogger(orm);
    await orm.em.createQueryBuilder(Publisher2, 'p')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .limit(10, 5)
      .getCount('id', true);

    const sql = 'select count(distinct `p`.`id`) as `count` ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = \'test 123\' and `b`.`title` like \'%3\'';
    expect(logger.mock.calls[0][0]).toMatch(sql);
    expect(logger.mock.calls[0][0]).not.toMatch(' limit ');
    expect(logger.mock.calls[0][0]).not.toMatch(' offset ');
    expect(logger.mock.calls[0][0]).not.toMatch(' order by ');
    logger.mockRestore();
  });

  test('qp.getResultAndCount()', async () => {
    // given
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select('*')
      .where({ name: 'fb 1' })
      .limit(2);

    await orm.em.insert(FooBar2, { id: 1, name: 'fb 1' });
    await orm.em.insert(FooBar2, { id: 2, name: 'fb 2' });
    await orm.em.insert(FooBar2, { id: 3, name: 'fb 1' });
    await orm.em.insert(FooBar2, { id: 4, name: 'fb 1' });

    // when
    const [results, count] = await qb.getResultAndCount();

    // then
    expect(results).toHaveLength(2);
    expect(count).toBe(3);
  });

  test('qb.getNextAlias()', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2);
    expect(qb1.alias).toBe('e0');
    expect(qb1.getNextAlias()).toBe('e1');
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

  test('select with auto-joining and alias replacement via expr()', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      $or: [
        { author: { name: 'test' } },
        { author: { [raw(a => `lower(${a}.name)`)]: 'wut' } },
      ],
    });
    expect(qb1.getQuery()).toEqual('select `a`.*, `a`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `a` ' +
      'left join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
      'where (`e1`.`name` = ? or lower(e1.name) = ?)');
  });

  test('select by PK via operator', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ $in: [1, 2] });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`id` in (?, ?)');
  });

  test('order by virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select(['*', sql`"1" as code`]).where({ $in: [1, 2] }).orderBy({ code: 'asc' });
    expect(qb1.getQuery()).toEqual('select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) order by `code` asc');
  });

  test('having with virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select(['*', sql`"1" as code`]).where({ $in: [1, 2] }).having({
      code: { $gte: 'c' },
      $or: [{ code: { $gt: 'c' } }, { id: { $lt: 3 } }],
    });
    expect(qb1.getQuery()).toEqual('select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) having `code` >= ? and (`code` > ? or `a`.`id` < ?)');
  });

  test('select with sub-query', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).as('Author2.booksTotal');
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(['*', qb1]).orderBy({ booksTotal: 'desc' });
    expect(qb2.getQuery()).toEqual('select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc');
    expect(qb2.getParams()).toEqual([]);

    const qb3 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).as('books_total');
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select(['*', qb3]).orderBy({ booksTotal: 'desc' });
    expect(qb4.getQuery()).toEqual('select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc');
    expect(qb4.getParams()).toEqual([]);
  });

  test('select where sub-query', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).getNativeQuery();
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select('*').withSubQuery(qb1, 'a.booksTotal').where({ 'a.booksTotal': { $in: [1, 2, 3] } });
    expect(qb2.getQuery()).toEqual('select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) in (?, ?, ?)');
    expect(qb2.getParams()).toEqual([1, 2, 3]);

    const { sql: sql3, params: params3 } = orm.em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).getNativeQuery().compile();
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select('*').withSubQuery(raw(sql3, params3), 'a.booksTotal').where({ 'a.booksTotal': 1 });
    expect(qb4.getQuery()).toEqual('select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) = ?');
    expect(qb4.getParams()).toEqual([1]);

    const qb5 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb6 = orm.em.createQueryBuilder(Author2, 'a').select('*').where(`id in (${qb5.getFormattedQuery()})`);
    expect(qb6.getQuery()).toEqual('select `a`.* from `author2` as `a` where (id in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb8 = orm.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: qb7.getNativeQuery() } });
    expect(qb8.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`id` in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > ?)');
    expect(qb8.getParams()).toEqual([100]);
  });

  test('join sub-query', async () => {
    const author = await orm.em.insert(Author2, { name: 'a', email: 'e' });
    const t1 = await orm.em.insert(BookTag2, { name: 't1' });
    const t2 = await orm.em.insert(BookTag2, { name: 't2' });
    const t3 = await orm.em.insert(BookTag2, { name: 't3' });
    await orm.em.insert(Book2, { uuid: v4(), title: 'foo 1', author, price: 123, tags: [t1, t2, t3] });
    await orm.em.insert(Book2, { uuid: v4(), title: 'foo 2', author, price: 123, tags: [t1, t2, t3] });

    // simple join with ORM subquery
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').limit(1).orderBy({ title: 1 });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(['*', 'sub.*'])
      .leftJoin(qb1, 'sub', { author_id: sql.ref('a.id') })
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual('select `a`.*, `sub`.* from `author2` as `a` left join (select `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like \'foo%\'');
    const res2 = await qb2.execute();
    expect(res2).toHaveLength(1);
    expect(res2[0]).toMatchObject({
      author_id: 1,
      email: 'e',
      foo: 'lol',
      id: 1,
      name: 'a',
      price: '123.00',
      price_taxed: '146.3700',
      title: 'foo 1',
    });
    orm.em.clear();

    // simple join with subquery
    const qb3 = orm.em.createQueryBuilder(Author2, 'a');
    qb3.select(['*', 'sub.*'])
      .leftJoin(qb1, 'sub', { author_id: sql.ref('a.id') })
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual('select `a`.*, `sub`.* from `author2` as `a` left join (select `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like \'foo%\'');
    const res3 = await qb3.execute();
    expect(res3).toHaveLength(1);
    expect(res3[0]).toMatchObject({
      author_id: 1,
      email: 'e',
      foo: 'lol',
      id: 1,
      name: 'a',
      price: '123.00',
      price_taxed: '146.3700',
      title: 'foo 1',
    });
    orm.em.clear();

    // using subquery to hydrate existing relation
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select(['*'])
      .leftJoinAndSelect(['a.books', qb1], 'sub')
      .leftJoinAndSelect('sub.tags', 't')
      .where({ 'sub.title': /^foo/ });
    expect(qb4.getFormattedQuery()).toEqual('select `a`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.price * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id`, `t`.`id` as `t__id`, `t`.`name` as `t__name` from `author2` as `a` left join (select `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `a`.`id` = `sub`.`author_id` left join `book2_tags` as `e1` on `sub`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` where `sub`.`title` like \'foo%\'');
    const res4 = await qb4.getResult();
    expect(res4).toHaveLength(1);
    expect(res4[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    expect(res4[0].books).toHaveLength(1);
    expect(res4[0].books[0]).toMatchObject({
      title: 'foo 1',
      price: 123.00,
      priceTaxed: '146.3700',
    });
    expect(res4[0].books[0].tags).toHaveLength(3);
    orm.em.clear();

    // with a regular join we get two books, as there is no limit
    const qb5 = orm.em.createQueryBuilder(Author2, 'a');
    qb5.select(['*', 'sub.*'])
      .leftJoinAndSelect('a.books', 'sub')
      .where({ 'sub.title': /^foo/ });
    expect(qb5.getFormattedQuery()).toEqual('select `a`.*, `sub`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.price * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id` from `author2` as `a` left join `book2` as `sub` on `a`.`id` = `sub`.`author_id` where `sub`.`title` like \'foo%\'');
    const res5 = await qb5.getResult();
    expect(res5).toHaveLength(1);
    expect(res5[0].books).toHaveLength(2);
    orm.em.clear();

    // using ORM subquery to hydrate existing relation, without explicit join condition
    const qb6 = orm.em.createQueryBuilder(Author2, 'a');
    qb6.select(['*'])
      .leftJoinAndSelect(['a.books', qb1.toRaw()], 'sub')
      .leftJoinAndSelect('sub.tags', 't')
      .where({ 'sub.title': /^foo/ });
    expect(qb6.getFormattedQuery()).toEqual('select `a`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.price * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id`, `t`.`id` as `t__id`, `t`.`name` as `t__name` from `author2` as `a` left join (select `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `a`.`id` = `sub`.`author_id` left join `book2_tags` as `e1` on `sub`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` where `sub`.`title` like \'foo%\'');
    const res6 = await qb6.getResult();
    expect(res6).toHaveLength(1);
    expect(res6[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    expect(res6[0].books).toHaveLength(1);
    expect(res6[0].books[0]).toMatchObject({
      title: 'foo 1',
      price: 123.00,
      priceTaxed: '146.3700',
    });
    expect(res6[0].books[0].tags).toHaveLength(3);
    orm.em.clear();

    // using raw subquery
    const qb7 = orm.em.createQueryBuilder(Author2, 'a');
    qb7.select(['*'])
      .leftJoin(qb1.toRaw(), 'sub', { author_id: sql.ref('a.id') })
      .where({ 'sub.title': /^foo/ });
    expect(qb7.getFormattedQuery()).toEqual('select `a`.* from `author2` as `a` left join (select `b`.*, `b`.price * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like \'foo%\'');
    const res7 = await qb7.getResult();
    expect(res7).toHaveLength(1);
    expect(res7[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    orm.em.clear();
  });

  test('CriteriaNode', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2.name);
    node.payload = { foo: 123 };
    expect(node.process({} as any)).toBe(node.payload);
    expect(node.willAutoJoin({} as any)).toBe(false);
    expect(inspect(node)).toBe(`CriteriaNode { entityName: 'Author2', payload: { foo: 123 } }`);
  });

  test('getAliasForJoinPath', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2.name);
    node.payload = { foo: 123 };
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    expect(qb.getAliasForJoinPath(node.getPath())).toBe('a');
    expect(qb.getAliasForJoinPath(Author2.name)).toBe('a');
    expect(qb.getAliasForJoinPath()).toBe('a');
  });

  test('pivot joining of m:n when target entity is null (GH issue 548)', async () => {
    const qb11 =  orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: null });
    expect(qb11.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) is null');
    expect(qb11.getParams()).toEqual([]);

    const qb2 =  orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ $or: [{ tags: null }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)');
    expect(qb2.getParams()).toEqual(['1']);

    const qb3 =  orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: { name: QueryOrder.ASC } });
    expect(qb3.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'left join `author2` as `e2` on `e1`.`author2_2_id` = `e2`.`id` ' +
      'where `e1`.`author2_2_id` is null ' +
      'order by `e2`.`name` asc');
    expect(qb3.getParams()).toEqual([]);

    const qb4 =  orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: QueryOrder.ASC });
    expect(qb4.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'where `e1`.`author2_2_id` is null ' +
      'order by `e1`.`author2_2_id` asc');
    expect(qb4.getParams()).toEqual([]);
  });

  test('123 pivot joining of m:n when no target entity needed directly (GH issue 549)', async () => {
    const qb3 =  orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: { name: QueryOrder.ASC } });
    expect(qb3.getQuery()).toMatch('select `a`.* ' +
      'from `author2` as `a` ' +
      'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
      'left join `author2` as `e2` on `e1`.`author2_2_id` = `e2`.`id` ' +
      'where `e1`.`author2_2_id` is null ' +
      'order by `e2`.`name` asc');
    expect(qb3.getParams()).toEqual([]);
  });

  test('pivot joining of m:n when no target entity needed directly (GH issue 549)', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ tags: { id: 1 } });
    expect(qb1.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where `e1`.`book_tag2_id` = ?');
    expect(qb1.getParams()).toEqual(['1']);

    const qb11 = orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: { name: 'n', year: 1 } });
    expect(qb11.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) = (?, ?)');
    expect(qb11.getParams()).toEqual(['n', 1]);

    const qb12 = orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: { $in: [{ name: 'n', year: 1 }, { name: 'n', year: 2 }] } });
    expect(qb12.getQuery()).toMatch('select `u`.* ' +
      'from `user2` as `u` ' +
      'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
      'where (`e1`.`car2_name`, `e1`.`car2_year`) in ((?, ?), (?, ?))');
    expect(qb12.getParams()).toEqual(['n', 1, 'n', 2]);

    const qb2 = orm.em.createQueryBuilder(Book2, 'b').select('b.*').where({ $or: [{ tags: { id: null } }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)');
    expect(qb2.getParams()).toEqual(['1']);

    const qb4 = orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: 1 }).orderBy({ friends: { id: QueryOrder.ASC } });
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
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by `e0`.`name` is not null, `e0`.`name` asc');
  });

  test('order by nulls last', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ name: QueryOrder.DESC_NULLS_LAST, type: QueryOrder.ASC_NULLS_LAST });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by `e0`.`name` is null, `e0`.`name` desc, `e0`.`type` is null, `e0`.`type` asc');
  });

  test('order by custom expression', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ [sql`length(name)`]: QueryOrder.DESC, type: QueryOrder.ASC });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by length(name) desc, `e0`.`type` asc');
  });

  test('complex condition for json property with update query (GH #2839)', async () => {
    const qb141 = orm.em.createQueryBuilder(Book2).update({ meta: { items: 3 } }).where({
      $and: [
        { uuid: 'b47f1cca-90ca-11ec-99e0-42010a5d800c' },
        {
          $or: [
            { meta: null },
            { meta: { $eq: null } },
            { meta: { time: { $lt: 1646147306 } } },
          ],
        },
      ],
    });
    expect(qb141.getFormattedQuery()).toBe('update `book2` set `meta` = \'{\\"items\\":3}\' ' +
      'where `uuid_pk` = \'b47f1cca-90ca-11ec-99e0-42010a5d800c\' ' +
      'and (`meta` is null ' +
      'or `meta` is null ' +
      'or json_extract(`meta`, \'$.time\') < 1646147306)');
  });

  test('query json property with operator directly (GH #3246)', async () => {
    const qb = orm.em.createQueryBuilder(Book2).where({ meta: { $ne: null } });
    expect(qb.getFormattedQuery()).toBe('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`meta` is not null');
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

  test('branching to-many relations (#2677)', async () => {
    // no branching as there is only one item in $and array
    const qb0 = orm.em.createQueryBuilder(Book2);
    qb0.select('*').where({
      $and: [
        { tags: { name: 'tag1' } },
      ],
    }).orderBy({ tags: { name: 1 } });
    expect(qb0.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` = ? ' +
      'order by `e1`.`name` asc');

    // branching as its m:n
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({
      $and: [
        { tags: { name: 'tag1' } },
        { tags: { name: 'tag2' } },
      ],
    });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'left join `book2_tags` as `e4` on `e0`.`uuid_pk` = `e4`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e3` on `e4`.`book_tag2_id` = `e3`.`id` ' +
      'where `e1`.`name` = ? and `e3`.`name` = ?');

    // no branching as its m:1
    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      $and: [
        { author: { name: 'a1' } },
        { author: { name: 'a2' } },
      ],
    });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'where `e1`.`name` = ? and `e1`.`name` = ?');

    // no branching as its m:1 and $or
    const qb3 = orm.em.createQueryBuilder(Book2);
    qb3.select('*').where({
      $or: [
        { author: { name: 'a1' } },
        { author: { name: 'a2' } },
      ],
    });
    expect(qb3.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'where (`e1`.`name` = ? or `e1`.`name` = ?)');

    // branching as its 1:m
    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').where({
      $and: [
        { books: { title: 'b1' } },
        { books: { title: 'b2' } },
      ],
    });
    expect(qb4.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `book2` as `e2` on `e0`.`id` = `e2`.`author_id` ' +
      'where `e1`.`title` = ? and `e2`.`title` = ?');

    // no branching as its $or
    const qb5 = orm.em.createQueryBuilder(Author2);
    qb5.select('*').where({
      $or: [
        { books: { title: 't1' } },
        { books: { title: 't2' } },
      ],
    });
    expect(qb5.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'where (`e1`.`title` = ? or `e1`.`title` = ?)');

    // no branching as the $and is under m:n
    const qb6 = orm.em.createQueryBuilder(Book2);
    qb6.select('*').where({
      tags: {
        $and: [
          { name: 'tag1' },
          { name: 'tag2' },
        ],
      },
    });
    expect(qb6.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
      'where `e1`.`name` = ? and `e1`.`name` = ?');

    // no branching as its m:1
    const qb7 = orm.em.createQueryBuilder(Book2);
    qb7.select('*').where({
      $and: [
        { author: { favouriteBook: { title: 'a1' } } },
        { author: { favouriteBook: { title: 'a2' } } },
      ],
    });
    expect(qb7.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
      'where `e2`.`title` = ? and `e2`.`title` = ?');

    // branching as its 1:m
    const qb8 = orm.em.createQueryBuilder(Author2);
    qb8.select('*').where({
      $and: [
        { books: { author: { name: 'a1' } } },
        { books: { author: { name: 'a2' } } },
      ],
    });
    expect(qb8.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `author2` as `e2` on `e1`.`author_id` = `e2`.`id` ' +
      'left join `book2` as `e3` on `e0`.`id` = `e3`.`author_id` ' +
      'left join `author2` as `e4` on `e3`.`author_id` = `e4`.`id` ' +
      'where `e2`.`name` = ? and `e4`.`name` = ?');

    // no branching as its both m:1
    const qb9 = orm.em.createQueryBuilder(Book2);
    qb9.select('*').where({
      $and: [
        {
          author: {
            $and: [
              { favouriteBook: { title: 'a1' } },
              { favouriteBook: { title: 'a2' } },
            ],
          },
        },
        {
          author: {
            $and: [
              { favouriteBook: { title: 'a3' } },
              { favouriteBook: { title: 'a4' } },
            ],
          },
        },
      ],
    });
    expect(qb9.getQuery()).toEqual('select `e0`.*, `e0`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `e0` ' +
      'left join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
      'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
      'where `e2`.`title` = ? and `e2`.`title` = ? and `e2`.`title` = ? and `e2`.`title` = ?');

    // branching as its both 1:m/m:n
    const qb10 = orm.em.createQueryBuilder(Author2);
    qb10.select('*').where({
      $and: [
        {
          books: {
            $and: [
              { tags: { name: 't1' } },
              { tags: { name: 't2' } },
            ],
          },
        },
        {
          books: {
            $and: [
              { tags: { name: 't3' } },
              { tags: { name: 't4' } },
            ],
          },
        },
      ],
    });
    expect(qb10.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `book2_tags` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id` ' +
      'left join `book2_tags` as `e5` on `e1`.`uuid_pk` = `e5`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e4` on `e5`.`book_tag2_id` = `e4`.`id` ' +
      'left join `book2` as `e6` on `e0`.`id` = `e6`.`author_id` ' +
      'left join `book2_tags` as `e8` on `e6`.`uuid_pk` = `e8`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e7` on `e8`.`book_tag2_id` = `e7`.`id` ' +
      'left join `book2_tags` as `e10` on `e6`.`uuid_pk` = `e10`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e9` on `e10`.`book_tag2_id` = `e9`.`id` ' +
      'where `e2`.`name` = ? and `e4`.`name` = ? and `e7`.`name` = ? and `e9`.`name` = ?');

    // no branching as its $or
    const qb11 = orm.em.createQueryBuilder(Author2);
    qb11.select('*').where({
      $or: [
        {
          books: {
            $or: [
              { tags: { name: 't1' } },
              { tags: { name: 't2' } },
            ],
          },
        },
        {
          books: {
            $or: [
              { tags: { name: 't3' } },
              { tags: { name: 't4' } },
            ],
          },
        },
      ],
    });
    expect(qb11.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `book2_tags` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id` ' +
      'where (((`e2`.`name` = ? or `e2`.`name` = ?)) or ((`e2`.`name` = ? or `e2`.`name` = ?)))');

    // branching only for $and
    const qb12 = orm.em.createQueryBuilder(Author2);
    qb12.select('*').where({
      $or: [
        {
          books: {
            $and: [
              { tags: { name: 't1' } },
              { tags: { name: 't2' } },
            ],
          },
        },
        {
          books: {
            $and: [
              { tags: { name: 't3' } },
              { tags: { name: 't4' } },
            ],
          },
        },
      ],
    });
    expect(qb12.getQuery()).toEqual('select `e0`.* ' +
      'from `author2` as `e0` ' +
      'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
      'left join `book2_tags` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id` ' +
      'left join `book2_tags` as `e5` on `e1`.`uuid_pk` = `e5`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `e4` on `e5`.`book_tag2_id` = `e4`.`id` ' +
      'where ((`e2`.`name` = ? and `e4`.`name` = ?) or (`e2`.`name` = ? and `e4`.`name` = ?))');
  });

  test('postgres', async () => {
    const pg = await MikroORM.init<PostgreSqlDriver>({
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22, Configuration2],
      dbName: `mikro_orm_test_qb`,
      driver: PostgreSqlDriver,
    });
    await pg.schema.refreshDatabase();

    {
      const qb = pg.em.createQueryBuilder(FooBar2, 'fb1');
      qb.select('*')
        .distinctOn('fb1.id')
        .joinAndSelect('fb1.baz', 'fz')
        .leftJoinAndSelect('fz.bar', 'fb2')
        .where({ 'fz.name': 'baz' })
        .limit(1);
      const sql = 'select distinct on ("fb1"."id") "fb1".*, ' +
        '"fz"."id" as "fz__id", "fz"."name" as "fz__name", "fz"."code" as "fz__code", "fz"."version" as "fz__version", ' +
        '"fb2"."id" as "fb2__id", "fb2"."name" as "fb2__name", "fb2"."name with space" as "fb2__name with space", "fb2"."baz_id" as "fb2__baz_id", "fb2"."foo_bar_id" as "fb2__foo_bar_id", "fb2"."version" as "fb2__version", "fb2"."blob" as "fb2__blob", "fb2"."blob2" as "fb2__blob2", "fb2"."array" as "fb2__array", "fb2"."object_property" as "fb2__object_property", (select 123) as "fb2__random", ' +
        '(select 123) as "random" from "foo_bar2" as "fb1" ' +
        'inner join "foo_baz2" as "fz" on "fb1"."baz_id" = "fz"."id" ' +
        'left join "foo_bar2" as "fb2" on "fz"."id" = "fb2"."baz_id" ' +
        'where "fz"."name" = ? ' +
        'limit ?';
      expect(qb.getQuery()).toEqual(sql);
      expect(qb.getParams()).toEqual(['baz', 1]);
    }

    {
      const timestamp = new Date();
      const qb = pg.em.createQueryBuilder(Author2).insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      }).onConflict().ignore();

      expect(qb.getQuery()).toEqual('insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"');
      expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
    }

    {
      const timestamp = new Date();
      const qb = pg.em.createQueryBuilder(Author2)
        .insert({
          createdAt: timestamp,
          email: 'ignore@example.com',
          name: 'John Doe',
          updatedAt: timestamp,
        })
        .onConflict()
        .ignore()
        .returning('*');

      expect(qb.getQuery()).toEqual('insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning *');
      expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
    }

    {
      const timestamp = new Date();
      const qb = pg.em.createQueryBuilder(Author2)
        .insert({
          createdAt: timestamp,
          email: 'ignore@example.com',
          name: 'John Doe',
          updatedAt: timestamp,
        })
        .onConflict()
        .ignore()
        .returning(['id', 'email']);

      expect(qb.getQuery()).toEqual('insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning "id", "email"');
      expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
    }

    {
      const qb = pg.em.createQueryBuilder(FooBar2, 'fb1');
      qb.select('*')
        .distinct()
        .joinAndSelect('fb1.baz', 'fz')
        .leftJoinAndSelect('fz.bar', 'fb2')
        .where({ 'fz.name': 'baz' })
        .limit(1);
      const sql = 'select distinct "fb1".*, ' +
        '"fz"."id" as "fz__id", "fz"."name" as "fz__name", "fz"."code" as "fz__code", "fz"."version" as "fz__version", ' +
        '"fb2"."id" as "fb2__id", "fb2"."name" as "fb2__name", "fb2"."name with space" as "fb2__name with space", "fb2"."baz_id" as "fb2__baz_id", "fb2"."foo_bar_id" as "fb2__foo_bar_id", "fb2"."version" as "fb2__version", "fb2"."blob" as "fb2__blob", "fb2"."blob2" as "fb2__blob2", "fb2"."array" as "fb2__array", "fb2"."object_property" as "fb2__object_property", (select 123) as "fb2__random", ' +
        '(select 123) as "random" from "foo_bar2" as "fb1" ' +
        'inner join "foo_baz2" as "fz" on "fb1"."baz_id" = "fz"."id" ' +
        'left join "foo_bar2" as "fb2" on "fz"."id" = "fb2"."baz_id" ' +
        'where "fz"."name" = ? ' +
        'limit ?';
      expect(qb.getQuery()).toEqual(sql);
      expect(qb.getParams()).toEqual(['baz', 1]);
    }

    const qb01 = pg.em.createQueryBuilder(FooBar2);
    qb01.insert({ array: [] } as any);
    expect(qb01.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{}') returning "id", "version"`);

    const qb02 = pg.em.createQueryBuilder(FooBar2);
    qb02.insert({ array: [1, 2, 3] } as any);
    expect(qb02.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{1,2,3}') returning "id", "version"`);

    const qb1 = pg.em.createQueryBuilder(Publisher2);
    qb1.select('*').where({ name: { $contains: 'test' } });
    expect(qb1.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" @> ?');
    expect(qb1.getFormattedQuery()).toEqual(`select "p0".* from "publisher2" as "p0" where "p0"."name" @> 'test'`);
    expect(qb1.getParams()).toEqual(['test']);

    const qb2 = pg.em.createQueryBuilder(Publisher2);
    qb2.select('*').where({ name: { $contained: 'test' } });
    expect(qb2.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" <@ ?');
    expect(qb2.getParams()).toEqual(['test']);

    const qb3 = pg.em.createQueryBuilder(Publisher2);
    qb3.select('*').where({ name: { $overlap: 'test' } });
    expect(qb3.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" && ?');
    expect(qb3.getParams()).toEqual(['test']);

    const qb4 = pg.em.createQueryBuilder(Publisher2);
    qb4.select('*').where({ name: { $ilike: 'test' } });
    expect(qb4.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ilike ?');
    expect(qb4.getParams()).toEqual(['test']);

    const qb5 = pg.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb6 = pg.em.createQueryBuilder(Author2, 'a').select('*').where(raw(`id in (${qb5.getFormattedQuery()})`));
    expect(qb6.getQuery()).toEqual('select "a".* from "author2" as "a" where (id in (select "b"."author_id" from "book2" as "b" where "b"."price" > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = pg.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb8 = pg.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: qb7 } });
    expect(qb8.getQuery()).toEqual('select "a".* from "author2" as "a" where "a"."id" in (select "b"."author_id" from "book2" as "b" where "b"."price" > ?)');
    expect(qb8.getParams()).toEqual([100]);

    const qb9 = pg.em.createQueryBuilder(Author2);
    qb9.insert({ email: 'ignore@example.com', name: 'John Doe' }).onConflict('email').ignore();
    expect(qb9.getQuery()).toEqual('insert into "author2" ("email", "name") values (?, ?) on conflict ("email") do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"');
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

    expect(qb10.getQuery()).toEqual('insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict ("email") do update set "name" = ?, "updated_at" = ? where "author2"."updated_at" < ? returning "id", "created_at", "updated_at", "age", "terms_accepted"');
    expect(qb10.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp, 'John Doe', timestamp, timestamp]);

    const qb11 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: 123 } });
    expect(qb11.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 = 123`);
    const qb12 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $eq: 123 } } });
    expect(qb12.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 = 123`);
    const qb13 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $lte: 123 } } });
    expect(qb13.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 <= 123`);

    // order by json property
    const qb14 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { foo: 'asc' } });
    expect(qb14.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->>'foo' asc`);
    const qb15 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { str: 'asc' } } });
    expect(qb15.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->'bar'->>'str' asc`);
    const qb16 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { num: QueryOrder.DESC } } });
    expect(qb16.getFormattedQuery()).toBe(`select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->'bar'->>'num' desc`);

    // complex condition for json property with update query (GH #2839)
    const qb141 = pg.em.createQueryBuilder(Book2).update({ meta: { items: 3 } }).where({
      $and: [
        { uuid: 'b47f1cca-90ca-11ec-99e0-42010a5d800c' },
        { $or: [
            { meta: null },
            { meta: { $eq: null } },
            { meta: { time: { $lt: 1646147306 } } },
          ] },
      ],
    });
    expect(qb141.getFormattedQuery()).toBe('update "book2" set "meta" = \'{"items":3}\' ' +
      'where "uuid_pk" = \'b47f1cca-90ca-11ec-99e0-42010a5d800c\' ' +
      'and ("meta" is null ' +
      'or "meta" is null ' +
      'or ("meta"->>\'time\')::float8 < 1646147306)');

    // arrays
    const qb17 = pg.em.createQueryBuilder(Author2);
    qb17.select('*').where({ identities: { $eq: ['4', '5', '6'] } });
    expect(qb17.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" = '{4,5,6}'`);

    const qb18 = pg.em.createQueryBuilder(Author2);
    qb18.select('*').where({ identities: { $ne: ['4', '5', '6'] } });
    expect(qb18.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" != '{4,5,6}'`);

    const qb19 = pg.em.createQueryBuilder(Author2);
    qb19.select('*').where({ identities: { $lt: ['4', '5', '6'] } });
    expect(qb19.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" < '{4,5,6}'`);

    const qb20 = pg.em.createQueryBuilder(Author2);
    qb20.select('*').where({ identities: { $lte: ['4', '5', '6'] } });
    expect(qb20.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" <= '{4,5,6}'`);

    const qb21 = pg.em.createQueryBuilder(Author2);
    qb21.select('*').where({ identities: { $gt: ['4', '5', '6'] } });
    expect(qb21.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" > '{4,5,6}'`);

    const qb22 = pg.em.createQueryBuilder(Author2);
    qb22.select('*').where({ identities: { $gte: ['4', '5', '6'] } });
    expect(qb22.getFormattedQuery()).toEqual(`select "a0".* from "author2" as "a0" where "a0"."identities" >= '{4,5,6}'`);

    // pessimistic locking
    await pg.em.transactional(async em => {
      const qb1 = em.createQueryBuilder(Book2);
      qb1.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ);
      expect(qb1.getQuery()).toEqual('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for share skip locked');

      const qb2 = em.createQueryBuilder(Book2);
      qb2.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE);
      expect(qb2.getQuery()).toEqual('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for update skip locked');

      const qb3 = em.createQueryBuilder(Book2);
      qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL);
      expect(qb3.getQuery()).toEqual('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for share nowait');

      const qb4 = em.createQueryBuilder(Book2);
      qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL);
      expect(qb4.getQuery()).toEqual('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for update nowait');

      const qb5 = em.createQueryBuilder(Book2);
      qb5.select('*').leftJoin('author', 'a').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE, ['book2']);
      expect(qb5.getQuery()).toEqual('select "b0".*, "b0".price * 1.19 as "price_taxed" from "book2" as "b0" left join "author2" as "a" on "b0"."author_id" = "a"."id" where "b0"."title" = ? for update of "book2"');
    });

    // join and select m:n relation with paginate flag (GH #1926)
    const qb = pg.em.createQueryBuilder(Book2, 'b');
    qb.select('*')
      .leftJoinAndSelect('b.tags', 't')
      .where({ 't.name': 'tag name' })
      .setFlag(QueryFlag.PAGINATE)
      .offset(1)
      .limit(20);
    const sql0 = 'select "b".*, "t"."id" as "t__id", "t"."name" as "t__name", "b".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b" ' +
      'left join "book2_tags" as "b1" on "b"."uuid_pk" = "b1"."book2_uuid_pk" ' +
      'left join "book_tag2" as "t" on "b1"."book_tag2_id" = "t"."id" where "b"."uuid_pk" in ' +
      '(select "b"."uuid_pk" from ' +
      '(select "b"."uuid_pk" from "book2" as "b" ' +
      'left join "book2_tags" as "b1" on "b"."uuid_pk" = "b1"."book2_uuid_pk" ' +
      'left join "book_tag2" as "t" on "b1"."book_tag2_id" = "t"."id" where "t"."name" = ? group by "b"."uuid_pk" limit ? offset ?' +
      ') as "b")';
    expect(qb.getQuery()).toEqual(sql0);
    expect(qb.getParams()).toEqual(['tag name', 20, 1]);

    // select by regexp operator
    {
      let qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: { $re: 'test' } });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~ ?');
      expect(qb.getParams()).toEqual(['test']);

      qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: { $re: '^test' } });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~ ?');
      expect(qb.getParams()).toEqual(['^test']);

      qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: { $re: 't.st$' } });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~ ?');
      expect(qb.getParams()).toEqual(['t.st$']);

      qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: { $re: '^c.o.*l-te.*st.c.m$' } });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~ ?');
      expect(qb.getParams()).toEqual(['^c.o.*l-te.*st.c.m$']);

      qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: new RegExp('^c.o.*l-te.*st.c.m$', 'i') });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~* ?');
      expect(qb.getParams()).toEqual(['^c.o.*l-te.*st.c.m$']);

      qb = pg.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: /^c.o.*l-te.*st.c.m$/i });
      expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ~* ?');
      expect(qb.getParams()).toEqual(['^c.o.*l-te.*st.c.m$']);
    }

    // query comments
    {
      const sql1 = pg.em.createQueryBuilder(Author2)
        .comment('test 123')
        .hintComment('test 123')
        .where({ favouriteBook: { $in: ['1', '2', '3'] } })
        .getFormattedQuery();
      expect(sql1).toBe(`/* test 123 */ select /*+ test 123 */ "a0".* from "author2" as "a0" where "a0"."favourite_book_uuid_pk" in ('1', '2', '3')`);

      const sql2 = pg.em.createQueryBuilder(Author2).withSchema('my_schema')
        .comment('test 123')
        .comment('test 456')
        .hintComment('test 123')
        .hintComment('test 456')
        .where({ favouriteBook: { $in: ['1', '2', '3'] } })
        .getFormattedQuery();
      expect(sql2).toBe(`/* test 123 */ /* test 456 */ select /*+ test 123 test 456 */ "a0".* from "my_schema"."author2" as "a0" where "a0"."favourite_book_uuid_pk" in ('1', '2', '3')`);

      const sql3 = pg.em.createQueryBuilder(Author2).withSchema('my_schema')
        .update({ name: '...' })
        .comment('test 123')
        .comment('test 456')
        .hintComment('test 123')
        .hintComment('test 456')
        .where({ favouriteBook: { $in: ['1', '2', '3'] } })
        .getFormattedQuery();
      expect(sql3).toBe(`/* test 123 */ /* test 456 */ update /*+ test 123 test 456 */ "my_schema"."author2" set "name" = '...' where "favourite_book_uuid_pk" in ('1', '2', '3')`);
    }

    // lateral join
    {
      const author = await pg.em.insert(Author2, { name: 'a', email: 'e' });
      const t1 = await pg.em.insert(BookTag2, { name: 't1' });
      const t2 = await pg.em.insert(BookTag2, { name: 't2' });
      const t3 = await pg.em.insert(BookTag2, { name: 't3' });
      await pg.em.insert(Book2, { uuid: v4(), title: 'foo 1', author, price: 123, tags: [t1, t2, t3] });
      await pg.em.insert(Book2, { uuid: v4(), title: 'foo 2', author, price: 123, tags: [t1, t2, t3] });

      // simple join with ORM subquery
      const qb1 = pg.em.createQueryBuilder(Book2, 'b').limit(1).orderBy({ title: 1 });
      const qb2 = pg.em.createQueryBuilder(Author2, 'a');
      qb2.select(['*', 'sub.*'])
        .leftJoinLateral(qb1, 'sub', { author_id: sql.ref('a.id') })
        .where({ 'sub.title': /^foo/ });
      expect(qb2.getFormattedQuery()).toEqual('select "a".*, "sub".* from "author2" as "a" left join lateral (select "b".*, "b".price * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "sub"."author_id" = "a"."id" where "sub"."title" like \'foo%\'');
      const res2 = await qb2.execute();
      expect(res2).toHaveLength(1);
      expect(res2[0]).toMatchObject({
        author_id: 1,
        email: 'e',
        id: 1,
        name: 'a',
        price: '123.00',
        price_taxed: '146.3700',
        title: 'foo 1',
      });
      pg.em.clear();

      // simple join with subquery
      const qb3 = pg.em.createQueryBuilder(Author2, 'a');
      qb3.select(['*', 'sub.*'])
        .innerJoinLateral(qb1, 'sub', { author_id: sql.ref('a.id') })
        .where({ 'sub.title': /^foo/ });
      expect(qb2.getFormattedQuery()).toEqual('select "a".*, "sub".* from "author2" as "a" left join lateral (select "b".*, "b".price * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "sub"."author_id" = "a"."id" where "sub"."title" like \'foo%\'');
      const res3 = await qb3.execute();
      expect(res3).toHaveLength(1);
      expect(res3[0]).toMatchObject({
        author_id: 1,
        email: 'e',
        id: 1,
        name: 'a',
        price: '123.00',
        price_taxed: '146.3700',
        title: 'foo 1',
      });
      pg.em.clear();

      // using subquery to hydrate existing relation
      const qb4 = pg.em.createQueryBuilder(Author2, 'a');
      qb4.select(['*'])
        .innerJoinLateralAndSelect(['a.books', qb1], 'sub')
        .leftJoinAndSelect('sub.tags', 't')
        .where({ 'sub.title': /^foo/ });
      expect(qb4.getFormattedQuery()).toEqual('select "a".*, "sub"."uuid_pk" as "sub__uuid_pk", "sub"."created_at" as "sub__created_at", "sub"."isbn" as "sub__isbn", "sub"."title" as "sub__title", "sub"."price" as "sub__price", "sub".price * 1.19 as "sub__price_taxed", "sub"."double" as "sub__double", "sub"."meta" as "sub__meta", "sub"."author_id" as "sub__author_id", "sub"."publisher_id" as "sub__publisher_id", "t"."id" as "t__id", "t"."name" as "t__name" from "author2" as "a" inner join lateral (select "b".*, "b".price * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "a"."id" = "sub"."author_id" left join "book2_tags" as "b1" on "sub"."uuid_pk" = "b1"."book2_uuid_pk" left join "book_tag2" as "t" on "b1"."book_tag2_id" = "t"."id" where "sub"."title" like \'foo%\'');
      const res4 = await qb4.getResult();
      expect(res4).toHaveLength(1);
      expect(res4[0]).toMatchObject({
        name: 'a',
        email: 'e',
      });
      expect(res4[0].books).toHaveLength(1);
      expect(res4[0].books[0]).toMatchObject({
        title: 'foo 1',
        price: 123.00,
        priceTaxed: '146.3700',
      });
      expect(res4[0].books[0].tags).toHaveLength(3);
      pg.em.clear();

      const qb5 = pg.em.createQueryBuilder(Author2, 'a');
      // @ts-expect-error
      expect(() => qb5.leftJoinLateralAndSelect('a.books', 'sub', { author: sql.ref('a.id') })).toThrow('Lateral join can be used only with a sub-query.');
      // @ts-expect-error
      expect(() => qb5.leftJoinLateralAndSelect('a.books', 'sub')).toThrow('Lateral join can be used only with a sub-query.');
      // @ts-expect-error
      expect(() => qb5.leftJoinLateral('a.books', 'sub')).toThrow('Lateral join can be used only with a sub-query.');
      pg.em.clear();
    }

    await pg.close(true);
  });

  test('perf: select', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.select('*').where({ name: `test ${i}`, type: PublisherType.GLOBAL }).toQuery();
    }
    const took = performance.now() - start;

    if (took > 250) {
      process.stdout.write(`select test took ${took}\n`);
    }
  });

  test('perf: insert', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.insert({ name: `test ${i}`, type: PublisherType.GLOBAL }).toQuery();
    }
    const took = performance.now() - start;

    if (took > 100) {
      process.stdout.write(`insert test took ${took}\n`);
    }
  });

  test('perf: update', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.update({ name: `test ${i}`, type: PublisherType.GLOBAL }).where({ id: 123 }).toQuery();
    }
    const took = performance.now() - start;

    if (took > 200) {
      process.stdout.write(`update test took ${took}\n`);
    }
  });

  test('joining 1:1 inverse inside $and condition (GH issue 849)', async () => {
    const sql0 = orm.em.createQueryBuilder(FooBaz2).select('*').where({ bar: 123 }).getQuery();
    expect(sql0).toBe('select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?');
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
    expect(sql1).toBe('select count(*) as `count` ' +
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
    expect(sql3).toBe('select count(*) as `count` ' +
      'from `book2` as `e0` ' +
      'left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` ' +
      'where `e1`.`id` = ?');

    const sql4 = orm.em.createQueryBuilder(Book2).select('*').where({ test: { id: 1 } }).getQuery();
    expect(sql4).toBe('select `e0`.*, `e1`.`id` as `e1__id`, `e0`.price * 1.19 as `price_taxed` ' +
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

  test('query comments', async () => {
    const sql1 = orm.em.createQueryBuilder(Author2)
      .comment('test 123')
      .hintComment('test 123')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql1).toBe("/* test 123 */ select /*+ test 123 */ `e0`.* from `author2` as `e0` where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')");

    const sql2 = orm.em.createQueryBuilder(Author2).withSchema('my_schema')
      .comment('test 123')
      .comment('test 456')
      .hintComment('test 123')
      .hintComment('test 456')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql2).toBe("/* test 123 */ /* test 456 */ select /*+ test 123 test 456 */ `e0`.* from `my_schema`.`author2` as `e0` where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')");

    const sql3 = orm.em.createQueryBuilder(Author2).withSchema('my_schema')
      .update({ name: '...' })
      .comment('test 123')
      .comment('test 456')
      .hintComment('test 123')
      .hintComment('test 456')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql3).toBe("/* test 123 */ /* test 456 */ update /*+ test 123 test 456 */ `my_schema`.`author2` set `name` = '...' where `favourite_book_uuid_pk` in ('1', '2', '3')");
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

  test(`order by forumla field should not include 'as'`, async () => {
    const sql = orm.em.createQueryBuilder(Book2).select('*').orderBy({ priceTaxed: QueryOrder.DESC }).getFormattedQuery();
    expect(sql).toBe('select `e0`.*, `e0`.price * 1.19 as `price_taxed` from `book2` as `e0` order by `e0`.price * 1.19 desc');
  });

  test('execute return type works based on qb.select/insert/update/delete() being used', async () => {
    const spy = vi.spyOn(QueryBuilder.prototype, 'execute');

    spy.mockResolvedValueOnce([]);
    const res1 = await orm.em.createQueryBuilder(Book2).select('*').execute();
    expect(res1).toEqual([]);

    spy.mockResolvedValue({ insertId: 123 });
    const res2 = await orm.em.createQueryBuilder(Book2).insert({ author: 1 }).execute();
    expect(res2.insertId).toBe(123);
    const res3 = await orm.em.createQueryBuilder(Book2).update({}).execute();
    expect(res3.insertId).toBe(123);
    const res4 = await orm.em.createQueryBuilder(Book2).delete().execute();
    expect(res4.insertId).toBe(123);

    spy.mockResolvedValue({ count: 123 });
    const res5 = await orm.em.createQueryBuilder(Book2).count().execute('get');
    expect(res5.count).toBe(123);
    const res6 = await orm.em.createQueryBuilder(Book2).count().getCount();
    expect(res6).toBe(123);

    spy.mockResolvedValue([]);
    // @ts-expect-error
    await orm.em.createQueryBuilder(Book2).insert({}).getResultList();
    // @ts-expect-error
    await orm.em.createQueryBuilder(Book2).update({}).getResultList();
    // @ts-expect-error
    await orm.em.createQueryBuilder(Book2).delete().getResultList();
    // @ts-expect-error
    await orm.em.createQueryBuilder(Book2).truncate().getResultList();

    spy.mockRestore();
  });

  test('limit of 0 limits results to 0', () => {
    const expected = 'select `e0`.`id` from `book2` as `e0` limit 0';
    const sql = orm.em.createQueryBuilder(Book2).select('id').limit(0).getFormattedQuery();
    expect(sql).toBe(expected);
  });

  test('aliased join condition', () => {
    const sql1 = orm.em.createQueryBuilder(Book2, 'b')
      .select('*')
      .innerJoinAndSelect('author', 'a')
      .where({ 'a.born': '1990-03-23' })
      .getFormattedQuery();
    expect(sql1).toBe("select `b`.*, `a`.`id` as `a__id`, `a`.`created_at` as `a__created_at`, `a`.`updated_at` as `a__updated_at`, `a`.`name` as `a__name`, `a`.`email` as `a__email`, `a`.`age` as `a__age`, `a`.`terms_accepted` as `a__terms_accepted`, `a`.`optional` as `a__optional`, `a`.`identities` as `a__identities`, `a`.`born` as `a__born`, `a`.`born_time` as `a__born_time`, `a`.`favourite_book_uuid_pk` as `a__favourite_book_uuid_pk`, `a`.`favourite_author_id` as `a__favourite_author_id`, `a`.`identity` as `a__identity`, `b`.price * 1.19 as `price_taxed` from `book2` as `b` inner join `author2` as `a` on `b`.`author_id` = `a`.`id` where `a`.`born` = '1990-03-23'");

    const sql2 = orm.em.createQueryBuilder(Book2, 'b')
      .select('*')
      .joinAndSelect('author', 'a', { 'a.born': '1990-03-23' })
      .getFormattedQuery();
    expect(sql2).toBe("select `b`.*, `a`.`id` as `a__id`, `a`.`created_at` as `a__created_at`, `a`.`updated_at` as `a__updated_at`, `a`.`name` as `a__name`, `a`.`email` as `a__email`, `a`.`age` as `a__age`, `a`.`terms_accepted` as `a__terms_accepted`, `a`.`optional` as `a__optional`, `a`.`identities` as `a__identities`, `a`.`born` as `a__born`, `a`.`born_time` as `a__born_time`, `a`.`favourite_book_uuid_pk` as `a__favourite_book_uuid_pk`, `a`.`favourite_author_id` as `a__favourite_author_id`, `a`.`identity` as `a__identity`, `b`.price * 1.19 as `price_taxed` from `book2` as `b` inner join `author2` as `a` on `b`.`author_id` = `a`.`id` and `a`.`born` = '1990-03-23'");
  });

  test('join condition with M:N (GH #4644)', () => {
    const sql1 = orm.em.createQueryBuilder(Book2, 'b')
      .select('*')
      .leftJoin('tags', 't', { 't.name': 't1' })
      .getFormattedQuery();
    expect(sql1).toBe('select `b`.*, `b`.price * 1.19 as `price_taxed` ' +
      'from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` and `t`.`name` = \'t1\'');
  });

  test('sub-query order-by fields are always fully qualified', () => {
    const expected = 'select `e0`.*, `books`.`uuid_pk` as `books__uuid_pk`, `books`.`created_at` as `books__created_at`, `books`.`isbn` as `books__isbn`, `books`.`title` as `books__title`, `books`.`price` as `books__price`, `books`.price * 1.19 as `books__price_taxed`, `books`.`double` as `books__double`, `books`.`meta` as `books__meta`, `books`.`author_id` as `books__author_id`, `books`.`publisher_id` as `books__publisher_id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` where `e0`.`id` in (select `e0`.`id` from (select `e0`.`id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `e0`.`id` order by min(`e0`.`id`) desc limit 10) as `e0`) order by `e0`.`id` desc';
    const sql = orm.em.createQueryBuilder(Author2).select('*').joinAndSelect('books', 'books').orderBy({ id: QueryOrder.DESC }).limit(10).getFormattedQuery();
    expect(sql).toBe(expected);
  });

  test(`sub-query order-by fields should not include 'as'`, async () => {
    const sql = orm.em.createQueryBuilder(Author2).select('*').joinAndSelect('books', 'books').orderBy([{ books: { priceTaxed: QueryOrder.DESC } }, { id: QueryOrder.DESC }]).limit(10).getFormattedQuery();
    expect(sql).toBe('select `e0`.*, `books`.`uuid_pk` as `books__uuid_pk`, `books`.`created_at` as `books__created_at`, `books`.`isbn` as `books__isbn`, `books`.`title` as `books__title`, `books`.`price` as `books__price`, `books`.price * 1.19 as `books__price_taxed`, `books`.`double` as `books__double`, `books`.`meta` as `books__meta`, `books`.`author_id` as `books__author_id`, `books`.`publisher_id` as `books__publisher_id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` where `e0`.`id` in (select `e0`.`id` from (select `e0`.`id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `e0`.`id` order by min(`books`.price * 1.19) desc, min(`e0`.`id`) desc limit 10) as `e0`) order by `books`.price * 1.19 desc, `e0`.`id` desc');
  });

  test(`sub-query group-by fields should not include 'as'`, async () => {
    const sql = orm.em.createQueryBuilder(Author2).select(['id', 'books.priceTaxed']).join('books', 'books').groupBy('books.priceTaxed').limit(10).getFormattedQuery();
    expect(sql).toBe('select `e0`.`id`, `books`.price * 1.19 as `price_taxed` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `books`.price * 1.19 limit 10');
  });

  test('select via fulltext search', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ name: { $fulltext: 'test' }  });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where match(??) against (? in boolean mode)');
  });

  test('select via multiple where clauses with fulltext search', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({
      termsAccepted: true,
      name: { $fulltext: 'test' },
      email: { $fulltext: 'test' },
    });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`terms_accepted` = ? and match(??) against (? in boolean mode) and match(??) against (? in boolean mode)');
  });

  test('delete query with alias', async () => {
    const sql = orm.em.createQueryBuilder(Author2, 'u')
      .delete({
        'u.createdAt': {
          $lt: new Date(),
        },
      }).getQuery();
    expect(sql).toBe('delete from `author2` as `u` where `u`.`created_at` < ?');
  });

  test('from an entity', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.from(Author2);
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0`');
  });

  test('update from', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test' }).from(Author2);
    expect(qb.getQuery()).toEqual('update `author2` set `name` = ?');
  });

  test('delete from', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete().where({ id: 1 }).from(Author2);
    expect(qb.getQuery()).toEqual('delete from `author2` where `id` = ?');
  });

  test('from an query builder on creation', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2);
    const qb2 = orm.em.createQueryBuilder(qb1, 'p');
    expect(qb2.getQuery()).toEqual('select `p`.* from (select `e0`.* from `publisher2` as `e0`) as `p`');
  });

  test('from an entity with alias', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.from(Author2);
    expect(qb.getQuery()).toEqual('select `p`.* from `author2` as `p`');
  });

  test('from an entity with alias', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    // @ts-expect-error the method does not accept an alias if the first argument is EntityName
    expect(() => qb.from(Author2, 'a')).toThrow(`Cannot override the alias to 'a' since a query already contains references to 'p'`);
  });

  test('from a query builder with where and order by clauses', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2).where({ createdAt: { $lte: new Date() } }).orderBy({ createdAt: 'DESC' });
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.from(qb1.clone()).orderBy({ createdAt: 'ASC' });
    expect(qb2.getQuery()).toEqual('select `e1`.* from (select `e0`.* from `author2` as `e0` where `e0`.`created_at` <= ? order by `e0`.`created_at` desc) as `e1` order by `e1`.`created_at` asc');
  });

  test('from a query builder with joins', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2).where({ createdAt: { $lte: new Date() } }).leftJoin('books2', 'b').orderBy({ 'b.createdAt': 'DESC' });
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.from(qb1.clone()).orderBy({ 'b.createdAt': 'ASC' });
    expect(qb2.getQuery()).toEqual('select `e1`.* from (select `e0`.* from `author2` as `e0` left join `book2` as `b` on `e0`.`id` = `b`.`author_id` where `e0`.`created_at` <= ? order by `b`.`created_at` desc) as `e1` order by `b`.`created_at` asc');
  });

  test('from a string', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.from('Author2');
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0`');
  });

  test('from a query builder', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2);
    const qb2 = orm.em.createQueryBuilder(Publisher2);
    qb2.from(qb1);
    expect(qb2.getQuery()).toEqual('select `e1`.* from (select `e0`.* from `author2` as `e0`) as `e1`');
  });

  test('raw should interoperate with the query builder', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2);
    const q1 = qb1.select(['name', 'age']).where({ id: 1 }).toQuery();
    const r = raw(q1.sql, q1.params);
    expect(r.sql).toBe('select `e0`.`name`, `e0`.`age` from `author2` as `e0` where `e0`.`id` = ?');
    expect(r.params).toStrictEqual([1]);
  });

});
