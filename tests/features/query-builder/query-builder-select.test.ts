import { LockMode, MikroORM, QueryFlag, QueryOrder, raw, sql, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2, Car2, CarOwner2, FooBar2, FooBaz2, Publisher2, PublisherType, Test2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder - Select', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        namingStrategy: class NS extends UnderscoreNamingStrategy {
          override aliasName(entityName: string, index: number): string {
            return 'e' + index;
          }
        },
      },
      true,
    );
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('select query', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123', type: PublisherType.GLOBAL }).orderBy({ name: QueryOrder.DESC, type: QueryOrder.ASC }).limit(2, 1);
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? order by `e0`.`name` desc, `e0`.`type` asc limit ? offset ?',
    );
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 2, 1]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1
      .select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [raw(`(point(location_latitude, location_longitude) <@> point(?, ?))`, [53, 9])]: 'ASC' });
    expect(qb1.getFormattedQuery()).toBe(
      "select `e0`.* from `publisher2` as `e0` where `e0`.`name` = 'test 123' and `e0`.`type` = 'global' order by (point(location_latitude, location_longitude) <@> point(53, 9)) asc",
    );

    const qb2 = orm.em.createQueryBuilder(Publisher2);
    qb2
      .select('*')
      .where({ name: 'test 123', type: PublisherType.GLOBAL })
      .orderBy({ [raw(`(point(location_latitude, location_longitude) <@> point(?, ?))`, [53.46, 9.9])]: 'ASC' });
    expect(qb2.getFormattedQuery()).toBe(
      "select `e0`.* from `publisher2` as `e0` where `e0`.`name` = 'test 123' and `e0`.`type` = 'global' order by (point(location_latitude, location_longitude) <@> point(53.46, 9.9)) asc",
    );

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

  test('select where is null', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ type: null }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`type` is null limit ? offset ?');
    expect(qb.getParams()).toEqual([2, 1]);
  });

  test('awaiting the QB instance', async () => {
    const qb1 = orm.em.qb(Publisher2);
    const res1 = await qb1.insert({ name: 'p1', type: PublisherType.GLOBAL }).execute();
    expect(res1.insertId > 0).toBe(true); // test the type
    expect(res1.insertId).toBeGreaterThanOrEqual(1);

    const qb2 = orm.em.qb(Publisher2);
    const res2 = await qb2.select('*').where({ name: 'p1' }).limit(5).getResult();
    expect(res2.map(p => p.name)).toEqual(['p1']); // test the type
    expect(res2).toHaveLength(1);
    expect(res2[0]).toBeInstanceOf(Publisher2);

    const qb3 = orm.em.qb(Publisher2);
    const res3 = await qb3.count().where({ name: 'p1' }).getCount();
    expect(res3 > 0).toBe(true); // test the type
    expect(res3).toBe(1);

    const qb4 = orm.em.qb(Publisher2);
    const res4 = await qb4.update({ type: PublisherType.LOCAL }).where({ name: 'p1' }).execute();
    expect(res4.affectedRows > 0).toBe(true); // test the type
    expect(res4.affectedRows).toBe(1);

    const qb5 = orm.em.qb(Publisher2);
    const res5 = await qb5.delete().where({ name: 'p1' }).execute();
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
    expect(qb2.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?',
    );
    expect(qb2.getParams()).toEqual(['test 123', 2, 1]);

    const qb3 = orm.em.createQueryBuilder(Publisher2);
    qb3
      .select('*')
      .where({ name: 'test 123' })
      .orderBy([{ name: 'desc' }, { type: -1 }])
      .limit(2, 1);
    expect(qb3.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?',
    );
    expect(qb3.getParams()).toEqual(['test 123', 2, 1]);

    const qb4 = orm.em.createQueryBuilder(Publisher2);
    qb4
      .select('*')
      .where({ name: 'test 123' })
      .orderBy([{ name: 'desc', type: -1 }])
      .limit(2, 1);
    expect(qb4.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc limit ? offset ?',
    );
    expect(qb4.getParams()).toEqual(['test 123', 2, 1]);

    const qb5 = orm.em.createQueryBuilder(Publisher2);
    qb5
      .select('*')
      .where({ name: 'test 123' })
      .orderBy([{ name: 'desc' }, { type: -1 }, { name: 'asc' }])
      .limit(2, 1);
    expect(qb5.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? order by `e0`.`name` desc, `e0`.`type` desc, `e0`.`name` asc limit ? offset ?',
    );
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
    qb.select(['id', 'name', 'type'])
      .where({ name: { $in: ['test 123', 'lol 321'] }, type: PublisherType.GLOBAL })
      .limit(2, 1);
    expect(qb.getQuery()).toEqual(
      'select `e0`.`id`, `e0`.`name`, `e0`.`type` from `publisher2` as `e0` where `e0`.`name` in (?, ?) and `e0`.`type` = ? limit ? offset ?',
    );
    expect(qb.getParams()).toEqual(['test 123', 'lol 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select in query with composite keys', async () => {
    const qb = orm.em.createQueryBuilder(Car2);
    qb.select('*')
      .where({
        [raw(['name', 'year'])]: {
          $in: [
            ['test 123', 123],
            ['lol 321', 321],
          ],
        },
      })
      .orderBy({ [raw(['name', 'year'])]: QueryOrder.DESC });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `car2` as `e0` where (`e0`.`name`, `e0`.`year`) in ((?, ?), (?, ?)) order by `e0`.`name` desc, `e0`.`year` desc',
    );
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
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`author_id` is not null');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ author: { $ne: null, name: 'Jon Snow' } });
    expect(qb2.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e0`.`author_id` is not null and `e1`.`name` = ?',
    );
    expect(qb2.getParams()).toEqual(['Jon Snow']);
  });

  test('select andWhere/orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: 'test 123' }).andWhere({ type: PublisherType.GLOBAL }).orWhere({ name: 'lol 321' }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where ((`e0`.`name` = ? and `e0`.`type` = ?) or `e0`.`name` = ?) limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'lol 321', 2, 1]);
  });

  test('select andWhere/orWhere as first where condition', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2).select('*').andWhere({ type: PublisherType.GLOBAL }).orWhere({ name: 'lol 321' }).limit(2, 1);
    expect(qb1.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where (`e0`.`type` = ? or `e0`.`name` = ?) limit ? offset ?');
    expect(qb1.getParams()).toEqual([PublisherType.GLOBAL, 'lol 321', 2, 1]);

    const qb2 = orm.em.createQueryBuilder(Publisher2).select('*').orWhere({ name: 'lol 321' }).andWhere({ type: PublisherType.GLOBAL }).limit(2, 1);
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
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and `e0`.`type` = ? and `e0`.`name` = ? and `e0`.`name` = ? limit ? offset ?',
    );
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select multiple orWhere', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.where({ name: 'test 123' }).orWhere({ type: PublisherType.GLOBAL }).orWhere({ name: 'test 321' }).orWhere({ name: 'lol 321' }).limit(2, 1);
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` where (`e0`.`name` = ? or `e0`.`type` = ? or `e0`.`name` = ? or `e0`.`name` = ?) limit ? offset ?',
    );
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 'test 321', 'lol 321', 2, 1]);
  });

  test('select complex where', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.where({ name: 'test 123', $or: [{ name: 'test 321' }, { type: PublisherType.GLOBAL }] }).limit(2, 1);
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` where `e0`.`name` = ? and (`e0`.`name` = ? or `e0`.`type` = ?) limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', 'test 321', PublisherType.GLOBAL, 2, 1]);
  });

  test('select leftJoin 1:1 owner', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb').leftJoin('fb.baz', 'fz').select(['fb.*', 'fz.*']).where({ 'fz.name': 'test 123' }).limit(2, 1);
    const sql =
      'select `fb`.*, `fz`.*, (select 123) as `random` from `foo_bar2` as `fb` ' +
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
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1').select('*').joinAndSelect('fb1.baz', 'fz');
    // @ts-expect-error intentionally invalid alias to test runtime error
    expect(() => qb.join('fb0.baz', 'b')).toThrow(`Trying to join 'baz' with alias 'fb0', but 'fb0' is not a known alias. Available aliases are: 'fb1', 'fz'.`);
  });

  test('complex select with mapping of joined results', async () => {
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb1').select('*').joinAndSelect('fb1.baz', 'fz');

    const err = `Trying to join 'fz.fooBar', but 'fooBar' is not a defined relation on FooBaz2`;
    // @ts-expect-error intentionally invalid relation to test runtime error
    expect(() => qb.leftJoinAndSelect('fz.fooBar', 'fb2')).toThrow(err);

    qb.leftJoinAndSelect('fz.bar', 'fb2').where({ 'fz.name': 'baz' }).limit(1);
    const sql =
      'select `fb1`.*, ' +
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
    qb.select('*').joinAndSelect('fb1.baz', 'fz').leftJoinAndSelect('fz.bar', 'fb2').where({ 'fz.name': 'baz' }).setFlag(QueryFlag.PAGINATE).limit(1);
    const sql =
      'select `fb1`.*, ' +
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
    qb.select('*').leftJoinAndSelect('fb.tests', 't').orderBy({ name: 1 });

    await orm.em.insert(Test2, { id: 1, name: 't' });
    await orm.em.insert(FooBar2, { id: 1, name: 'fb 1', tests: [] });
    await orm.em.insert(FooBar2, { id: 2, name: 'fb 2', tests: [1] });
    const res = await qb.getResultList();
    expect(res[0].tests.isInitialized()).toBe(true);
    expect(res[0].tests.getItems()).toHaveLength(0);
    expect(res[1].tests.isInitialized()).toBe(true);
    expect(res[1].tests.getItems()).toHaveLength(1);
    await orm.schema.clear();
  });

  test('select leftJoin 1:1 inverse', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2, 'fz');
    qb.leftJoin('fz.bar', 'fb').select(['fb.*', 'fz.*']).where({ 'fb.name': 'test 123' }).limit(2, 1);
    const sql =
      'select `fb`.*, `fz`.* from `foo_baz2` as `fz` ' +
      'left join `foo_bar2` as `fb` on `fz`.`id` = `fb`.`baz_id` ' +
      'where `fb`.`name` = ? ' +
      'limit ? offset ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('select leftJoin m:1', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.leftJoin('b.author', 'a').select(['a.*', 'b.*']).where({ 'a.name': 'test 123' });
    const sql =
      'select `a`.*, `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'where `a`.`name` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.leftJoin('a.books', 'b').select(['a.*', 'b.*']).where({ 'b.title': 'test 123' });
    const sql = 'select `a`.*, `b`.* from `author2` as `a` ' + 'left join `book2` as `b` on `a`.`id` = `b`.`author_id` ' + 'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin 1:m with $not in extra condition (GH #3504)', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.leftJoin('a.books', 'b', { $not: { 'b.title': '456' } })
      .select(['a.*', 'b.*'])
      .where({ 'b.title': 'test 123' });
    const sql =
      'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` on `a`.`id` = `b`.`author_id` and not (`b`.`title` = ?) ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['456', 'test 123']);
    await qb.getResult();
  });

  test('select leftJoin 1:m with custom sql fragments', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.leftJoin('a.books', 'b', {
      [sql`json_contains(b.meta, ${{ 'b.foo': 'bar' }})`]: [],
      [raw('json_contains(`b`.`meta`, ?) = ?', [{ 'b.foo': 'bar' }, false])]: [],
      [sql.lower(a => `${a}.title`)]: '321',
    })
      .select(['a.*', 'b.*'])
      .where({ 'b.title': 'test 123' });
    expect(qb.getQuery()).toEqual(
      'select `a`.*, `b`.* from `author2` as `a` ' +
        'left join `book2` as `b` ' +
        'on `a`.`id` = `b`.`author_id` ' +
        'and json_contains(b.meta, ?) ' +
        'and json_contains(`b`.`meta`, ?) = ? ' +
        'and lower(b.title) = ? ' +
        'where `b`.`title` = ?',
    );
    expect(qb.getParams()).toEqual([{ 'b.foo': 'bar' }, { 'b.foo': 'bar' }, false, '321', 'test 123']);
    expect(qb.getFormattedQuery()).toEqual(
      'select `a`.*, `b`.* from `author2` as `a` ' +
        'left join `book2` as `b` ' +
        'on `a`.`id` = `b`.`author_id` ' +
        'and json_contains(b.meta, \'{\\"b.foo\\":\\"bar\\"}\') ' +
        'and json_contains(`b`.`meta`, \'{\\"b.foo\\":\\"bar\\"}\') = false ' +
        "and lower(b.title) = '321' " +
        "where `b`.`title` = 'test 123'",
    );
  });

  test('select leftJoin 1:m with multiple conditions', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.leftJoin('a.books', 'b', {
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
      .select(['a.*', 'b.*'])
      .where({ 'b.title': 'test 123' });
    const sql2 =
      'select `a`.*, `b`.* from `author2` as `a` ' +
      'left join `book2` as `b` ' +
      'on `a`.`id` = `b`.`author_id` ' +
      'and `b`.`baz` > ? and `b`.`baz` <= ? ' +
      'and match(??) against (? in boolean mode) ' +
      'and ((`b`.`foo` is null and `b`.`qux` is not null and `b`.`quux` is null and `b`.`baz` = ?) or (`b`.`foo` not in (?, ?) and `b`.`baz` in (?, ?) and `b`.`qux` is not null and `b`.`bar` like ?) or (`b`.`qux` is null and `b`.`bar` regexp ?) or (json_contains(`b`.`meta`, ?) and json_contains(`b`.`meta`, ?) = ? and lower(??) = ?)) ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql2);
    expect(qb.getParams()).toEqual([
      1,
      10,
      'b.title',
      'test',
      0,
      0,
      1,
      2,
      3,
      '%test%',
      '^(te){1,3}st$',
      { 'b.foo': 'bar' },
      { 'b.foo': 'bar' },
      false,
      'b.title',
      '321',
      'test 123',
    ]);
  });

  test('select leftJoin m:n owner', async () => {
    const qb = orm.em.createQueryBuilder(Book2, 'b');
    qb.leftJoin('b.tags', 't').select(['b.*', 't.*']).where({ 't.name': 'test 123' });
    const sql =
      'select `b`.*, `t`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` ' +
      'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `t`.`name` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select leftJoin m:n inverse', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.leftJoin('t.books', 'b').select(['b.*', 't.*']).where({ 'b.title': 'test 123' });
    const sql =
      'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select join and leftJoin combined', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.leftJoin('books', 'b').join('b.author', 'a').join('b.tags', 't').select(['p.*', 'b.*', 'a.*', 't.*']).where({ 'p.name': 'test 123', 'b.title': /3$/ });
    const sql =
      'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join (`book2` as `b` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id`' +
      ') on `p`.`id` = `b`.`publisher_id` ' +
      'where `p`.`name` = ? and `b`.`title` like ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3']);
  });

  test('select with leftJoin for same property multiple times', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.leftJoin('books', 'b').leftJoin('books', 'b2').select(['p.*', 'b.*', 'b2.*']).where({ 'b.title': 'test 123', 'b2.title': /3$/ });
    const sql =
      'select `p`.*, `b`.*, `b2`.* ' +
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
    expect(qb.getFormattedQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`terms_accepted` = true',
    );
  });

  test('select with custom expression', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({
      [raw('json_contains(`e0`.`meta`, ?)', [{ foo: 'bar' }])]: [],
    });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.`meta`, ?)');
    expect(qb1.getParams()).toEqual([{ foo: 'bar' }]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      [raw(a => `json_contains(\`${a}\`.??, ?) = ?`, ['meta', { foo: 'baz' }, false])]: [],
    });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where json_contains(`e0`.??, ?) = ?');
    expect(qb2.getParams()).toEqual(['meta', { foo: 'baz' }, false]);
  });

  test('select with prototype-less object', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    const filter = Object.create(null);
    filter.meta = { foo: 'bar' };
    qb1.select('*').where(filter);
    expect(qb1.getQuery()).toEqual("select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where json_extract(`e0`.`meta`, '$.foo') = ?");
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
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`title` is not null',
    );
    expect(qb.getParams()).toEqual([]);

    qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ books: { title: { $exists: false } } });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`title` is null',
    );
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
    qb1.select(raw('floor(`a`.`age`) as `books_total`')).groupBy('booksTotal').orderBy({ booksTotal: QueryOrder.ASC });

    expect(qb1.getQuery()).toEqual('select floor(`a`.`age`) as `books_total` from `author2` as `a` group by `books_total` order by `books_total` asc');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(raw('floor(`a`.`age`) as `code`')).groupBy('code').orderBy({ code: QueryOrder.ASC });

    expect(qb2.getQuery()).toEqual('select floor(`a`.`age`) as `code` from `author2` as `a` group by `code` order by `code` asc');
    expect(qb2.getParams()).toEqual([]);
  });

  test('select by 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ books: { $in: ['123', '321'] } });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` in (?, ?)',
    );
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
    qb.select('*')
      .where({ id: 123 })
      .populate([{ field: 'bar' }]);
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (search by association)', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*').where({ bar: 123 });
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate', async () => {
    const qb = orm.em.createQueryBuilder(FooBaz2);
    qb.select('*')
      .where({ id: 123 })
      .populate([{ field: 'bar' }]);
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e0`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ test: 123 });
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id`, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*')
      .where({ test: 123 })
      .populate([{ field: 'test' }]);
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id`, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by 1:1 inversed with populate() before where() (uuid pk)', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*')
      .populate([{ field: 'test' }])
      .where({ test: 123 });
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e1`.`id` as `e1__id`, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` where `e1`.`id` = ?',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('select by m:n', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*').where({ tags: '123' });
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'where `e1`.`book_tag2_id` = ?',
    );
    expect(qb.getParams()).toEqual(['123']);
  });

  test('select by m:n inversed', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2);
    qb.select('*').where({ books: '123' });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `book_tag2` as `e0` ' + 'left join `book2_tags` as `e1` on `e0`.`id` = `e1`.`book_tag2_id` ' + 'where `e1`.`book2_uuid_pk` = ?',
    );
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
    // @ts-expect-error testing invalid operator
    expect(() => qb.select('*').where({ $test: { foo: 'bar' } })).toThrow('Trying to query by not existing property Test2.$test');
  });

  test('select distinct id with left join', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.leftJoin('t.books', 'b')
      .select([raw('distinct `b`.`uuid_pk`'), 'b.*', 't.*'])
      .where({ 'b.title': 'test 123' });
    const sql =
      'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select distinct via flag', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't').leftJoin('t.books', 'b').select(['b.uuid', 'b.*', 't.*'], true).where({ 'b.title': 'test 123' });
    const sql =
      'select distinct `b`.`uuid_pk`, `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where `b`.`title` = ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('select where string literal', async () => {
    const qb = orm.em.createQueryBuilder(BookTag2, 't');
    qb.leftJoin('t.books', 'b').select(['b.*', 't.*']).where('b.title = ? or b.title = ?', ['test 123', 'lol 321']).andWhere('1 = 1').orWhere('1 = 2');
    const sql =
      'select `b`.*, `t`.* from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'where (((b.title = ? or b.title = ?) and (1 = 1)) or (1 = 2))';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', 'lol 321']);
  });

  test('select with group by and having', async () => {
    const qb = orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['b.*', 't.*', sql`count(t.id)`.as('tags')])
      .addSelect(sql.ref('b.title').as('book_title'))
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having('tags > ?', [0])
      .andHaving('tags < ?', [1])
      .orHaving('tags <> ?', [2]);
    const query =
      'select `b`.*, `t`.*, count(t.id) as `tags`, `b`.`title` as `book_title` ' +
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
    const qb = orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['b.*', 't.*', raw('count(t.id) as tags')])
      .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
      .groupBy(['b.uuid', 't.id'])
      .having({ $or: [{ 'b.uuid': '...', [raw('count(t.id)')]: { $gt: 0 } }, { 'b.title': 'my title' }] });
    const sql =
      'select `b`.*, `t`.*, count(t.id) as tags from `book_tag2` as `t` ' +
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
    qb.select('*').where({
      $and: [
        { id: { $in: [1, 2, 7] } },
        { id: { $nin: [3, 4] } },
        { id: { $gt: 5 } },
        { id: { $lt: 10 } },
        { id: { $gte: 7 } },
        { id: { $lte: 8 } },
        { id: { $ne: 9 } },
        { $not: { id: { $eq: 10 } } },
      ],
    });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `test2` as `e0` ' +
        'where `e0`.`id` in (?, ?, ?) ' +
        'and `e0`.`id` not in (?, ?) ' +
        'and `e0`.`id` > ? ' +
        'and `e0`.`id` < ? ' +
        'and `e0`.`id` >= ? ' +
        'and `e0`.`id` <= ? ' +
        'and `e0`.`id` != ? ' +
        'and not (`e0`.`id` = ?)',
    );
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with operator (or)', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({
      $or: [
        { id: { $in: [1, 2, 7] } },
        { id: { $nin: [3, 4] } },
        { id: { $gt: 5 } },
        { id: { $lt: 10 } },
        { id: { $gte: 7 } },
        { id: { $lte: 8 } },
        { id: { $ne: 9 } },
        { $not: { id: { $eq: 10 } } },
      ],
    });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `test2` as `e0` ' +
        'where (`e0`.`id` in (?, ?, ?) ' +
        'or `e0`.`id` not in (?, ?) ' +
        'or `e0`.`id` > ? ' +
        'or `e0`.`id` < ? ' +
        'or `e0`.`id` >= ? ' +
        'or `e0`.`id` <= ? ' +
        'or `e0`.`id` != ? ' +
        'or not (`e0`.`id` = ?))',
    );
    expect(qb.getParams()).toEqual([1, 2, 7, 3, 4, 5, 10, 7, 8, 9, 10]);
  });

  test('select with smart query conditions', async () => {
    const qb = orm.em.createQueryBuilder(Test2);
    qb.select('*').where({
      version: {
        $gt: 1,
        $lt: 2,
        $gte: 3,
        $lte: 4,
        $ne: 5,
        $in: [6, 7],
        $nin: [8, 9],
      },
    });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `test2` as `e0` ' +
        'where `e0`.`version` > ? ' +
        'and `e0`.`version` < ? ' +
        'and `e0`.`version` >= ? ' +
        'and `e0`.`version` <= ? ' +
        'and `e0`.`version` != ? ' +
        'and `e0`.`version` in (?, ?) ' +
        'and `e0`.`version` not in (?, ?)',
    );
    expect(qb.getParams()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('select where (not) null via $eq/$ne operators', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ publisher: { $ne: null } });
    expect(qb1.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`publisher_id` is not null');
    expect(qb1.getParams()).toEqual([]);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ publisher: { $eq: null } });
    expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`publisher_id` is null');
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
      expect(qb2.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ?');

      const qb3 = em.createQueryBuilder(Book2);
      qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ);
      expect(qb3.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ? lock in share mode');

      const qb4 = em.createQueryBuilder(Book2);
      qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE);
      expect(qb4.getQuery()).toEqual('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`title` = ? for update');
    });
  });

  test('select with type-safe having using joined alias', async () => {
    const qb = orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['t.*', 'b.*', raw('count(t.id) as tags')])
      .groupBy(['b.uuid', 't.id'])
      .having({ 'b.title': { $like: '%test%' } })
      .andHaving({ 't.name': { $ne: null } });
    const sql =
      'select `t`.*, `b`.*, count(t.id) as tags from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having `b`.`title` like ? and `t`.`name` is not null';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['%test%']);
  });

  test('select with having using raw alias from sql.as()', async () => {
    // Use string-based having for raw aliases
    const qb = orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['t.*', 'b.*', sql`count(t.id)`.as('tag_count')])
      .groupBy(['b.uuid', 't.id'])
      .having('tag_count > ?', [0])
      .andHaving('tag_count < ?', [100]);
    const query =
      'select `t`.*, `b`.*, count(t.id) as `tag_count` from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having (tag_count > ?) and (tag_count < ?)';
    expect(qb.getQuery()).toEqual(query);
    expect(qb.getParams()).toEqual([0, 100]);
  });

  test('select with type-safe having using raw alias from sql.as()', async () => {
    // Raw aliases from sql`...`.as('alias') are type-safe in having()
    // Type safety: typos like 'tag_count123' would be caught at compile time
    const qb = orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['t.*', 'b.*', sql`count(t.id)`.as('tag_count')])
      .groupBy(['b.uuid', 't.id'])
      .having({ tag_count: { $gt: 0, $lt: 100 } });
    const query =
      'select `t`.*, `b`.*, count(t.id) as `tag_count` from `book_tag2` as `t` ' +
      'left join `book2_tags` as `e1` on `t`.`id` = `e1`.`book_tag2_id` ' +
      'left join `book2` as `b` on `e1`.`book2_uuid_pk` = `b`.`uuid_pk` ' +
      'group by `b`.`uuid_pk`, `t`.`id` ' +
      'having `tag_count` > ? and `tag_count` < ?';
    expect(qb.getQuery()).toEqual(query);
    expect(qb.getParams()).toEqual([0, 100]);

    // Type safety: typos in raw alias names are caught at compile time
    orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['t.*', 'b.*', sql`count(t.id)`.as('tag_count')])
      .groupBy(['b.uuid', 't.id'])
      // @ts-expect-error - 'tag_count_typo' is not a valid key (should be 'tag_count')
      .having({ tag_count_typo: { $gt: 0 } });

    // Type safety: invalid operator keys are caught at compile time
    orm.em
      .createQueryBuilder(BookTag2, 't')
      .leftJoin('t.books', 'b')
      .select(['t.*', 'b.*', sql`count(t.id)`.as('tag_count')])
      .groupBy(['b.uuid', 't.id'])
      // @ts-expect-error - '$invalid' is not a valid operator (should be $gt, $lt, etc.)
      .having({ tag_count: { $invalid: 0 } });
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

  test('select formula property with string alias', async () => {
    // formula with 'as' alias
    const qb1 = orm.em.createQueryBuilder(FooBar2);
    qb1.select(['id', 'random as rnd']).where({ id: 1 });
    expect(qb1.getQuery()).toEqual('select `e0`.`id`, (select 123) as `rnd` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb1.getParams()).toEqual([1]);

    // regular property with 'as' alias
    const qb2 = orm.em.createQueryBuilder(FooBar2);
    qb2.select(['id', 'name as userName']).where({ id: 1 });
    expect(qb2.getQuery()).toEqual('select `e0`.`id`, `e0`.`name` as `userName` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb2.getParams()).toEqual([1]);

    // formula with sql.ref().as()
    const qb3 = orm.em.createQueryBuilder(FooBar2);
    qb3.select(['id', sql.ref('random').as('rnd')]).where({ id: 1 });
    expect(qb3.getQuery()).toEqual('select `e0`.`id`, (select 123) as `rnd` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb3.getParams()).toEqual([1]);

    // aliased table + formula with string alias
    const qb4 = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb4.select(['fb.id', 'fb.random as rnd']).where({ id: 1 });
    expect(qb4.getQuery()).toEqual('select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` where `fb`.`id` = ?');
    expect(qb4.getParams()).toEqual([1]);

    // Book2 formula with string alias
    const qb5 = orm.em.createQueryBuilder(Book2, 'b');
    qb5.select(['b.title', 'b.priceTaxed as tax']).where({ title: 'test' });
    expect(qb5.getQuery()).toEqual('select `b`.`title`, `b`.`price` * 1.19 as `tax` from `book2` as `b` where `b`.`title` = ?');
    expect(qb5.getParams()).toEqual(['test']);

    // Book2 formula with sql.ref().as()
    const qb6 = orm.em.createQueryBuilder(Book2, 'b');
    qb6.select(['b.title', sql.ref('b.priceTaxed').as('tax')]).where({ title: 'test' });
    expect(qb6.getQuery()).toEqual('select `b`.`title`, `b`.`price` * 1.19 as `tax` from `book2` as `b` where `b`.`title` = ?');
    expect(qb6.getParams()).toEqual(['test']);
  });

  test('select regular property with sql.ref().as()', async () => {
    // sql.ref('name').as('alias') for non-formula property should resolve to table-prefixed column
    const qb = orm.em.createQueryBuilder(FooBar2);
    qb.select(['id', sql.ref('name').as('userName')]).where({ id: 1 });
    expect(qb.getQuery()).toEqual('select `e0`.`id`, `e0`.`name` as `userName` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([1]);

    // with explicit table alias
    const qb2 = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb2.select(['fb.id', sql.ref('fb.name').as('userName')]).where({ id: 1 });
    expect(qb2.getQuery()).toEqual('select `fb`.`id`, `fb`.`name` as `userName` from `foo_bar2` as `fb` where `fb`.`id` = ?');
    expect(qb2.getParams()).toEqual([1]);
  });

  test('select formula via sql.ref() without alias', async () => {
    // sql.ref('formula') without .as() should expand the formula with default alias
    const qb = orm.em.createQueryBuilder(FooBar2);
    qb.select(['id', sql.ref('random')]).where({ id: 1 });
    expect(qb.getQuery()).toEqual('select `e0`.`id`, (select 123) as `random` from `foo_bar2` as `e0` where `e0`.`id` = ?');
    expect(qb.getParams()).toEqual([1]);
  });

  test('select with join context alias', async () => {
    // alias on a joined field via string 'as'
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.leftJoin('a.books', 'b').select(['a.id', 'b.title as bookTitle']);
    expect(qb.getQuery()).toEqual('select `a`.`id`, `b`.`title` as `bookTitle` from `author2` as `a` left join `book2` as `b` on `a`.`id` = `b`.`author_id`');

    // sql.ref() formula on a joined alias
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.leftJoin('a.books', 'b').select(['a.id', sql.ref('b.priceTaxed').as('tax')]);
    expect(qb2.getQuery()).toEqual('select `a`.`id`, `b`.`price` * 1.19 as `tax` from `author2` as `a` left join `book2` as `b` on `a`.`id` = `b`.`author_id`');
  });

  test('select embedded with alias', async () => {
    // object embedded property with 'as' alias
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select(['a.id', 'a.identity as ident']).where({ id: 1 });
    expect(qb.getQuery()).toEqual('select `a`.`id`, `a`.`identity` as `ident` from `author2` as `a` where `a`.`id` = ?');
    expect(qb.getParams()).toEqual([1]);
  });

  test('select formula alias feeds into having()', async () => {
    const qb = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', sql.ref('random').as('rnd')])
      .groupBy('fb.id')
      .having({ rnd: { $gt: 0 } });
    expect(qb.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` group by `fb`.`id` having `rnd` > ?',
    );
    expect(qb.getParams()).toEqual([0]);

    // string alias also feeds into having
    const qb2 = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', 'random as rnd'])
      .groupBy('fb.id')
      .having({ rnd: { $gt: 0 } });
    expect(qb2.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` group by `fb`.`id` having `rnd` > ?',
    );
    expect(qb2.getParams()).toEqual([0]);
  });

  test('select alias feeds into orderBy()', async () => {
    // ordering by a raw alias from sql.ref().as()
    const qb = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', sql.ref('random').as('rnd')])
      .orderBy({ rnd: 'desc' });
    expect(qb.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` order by `rnd` desc',
    );

    // ordering by a string alias
    const qb2 = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', 'random as rnd'])
      .orderBy({ rnd: 'asc' });
    expect(qb2.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` order by `rnd` asc',
    );
  });

  test('groupBy with aliased formula field suppresses alias', async () => {
    // formula in groupBy should not emit an alias
    const qb = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', 'random as rnd'])
      .groupBy(['fb.id', 'random'])
      .having({ rnd: { $gt: 0 } });
    expect(qb.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` group by `fb`.`id`, (select 123) having `rnd` > ?',
    );
    expect(qb.getParams()).toEqual([0]);

    // same with sql.ref() in groupBy
    const qb2 = orm.em
      .createQueryBuilder(FooBar2, 'fb')
      .select(['fb.id', sql.ref('random').as('rnd')])
      .groupBy(['fb.id', sql.ref('random')])
      .having({ rnd: { $gt: 0 } });
    expect(qb2.getQuery()).toEqual(
      'select `fb`.`id`, (select 123) as `rnd` from `foo_bar2` as `fb` group by `fb`.`id`, (select 123) having `rnd` > ?',
    );
    expect(qb2.getParams()).toEqual([0]);
  });

  test('alias on multi-column field throws', async () => {
    // composite FK (CarOwner2.car -> Car2 with composite PK [name, year])
    const qb = orm.em.createQueryBuilder(CarOwner2);
    qb.select(['id', 'car as myCar']);
    expect(() => qb.getQuery()).toThrow(
      `Cannot use 'as myCar' alias on 'car' because it expands to multiple columns (car_name, car_year).`,
    );
  });

  test('select with populate and join of 1:m', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*')
      .populate([{ field: 'books' }])
      .leftJoin('books', 'b');
    expect(qb.getQuery()).toEqual('select `e0`.* ' + 'from `author2` as `e0` ' + 'left join `book2` as `b` on `e0`.`id` = `b`.`author_id`');
  });

  test('select with populate and join of m:n', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    qb.select('*')
      .populate([{ field: 'tags' }])
      .leftJoin('tags', 't');
    expect(qb.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id`',
    );
  });

  test('pessimistic locking requires active transaction', async () => {
    const qb = orm.em.createQueryBuilder(Author2);
    qb.select('*').where({ name: '...' });
    expect(() => qb.setLockMode(LockMode.NONE)).not.toThrow();
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ)).toThrow('An open transaction is required for this operation');
    expect(() => qb.setLockMode(LockMode.OPTIMISTIC).getQuery()).toThrow('The optimistic lock on entity Author2 failed');
  });

  test('select via fulltext search', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ name: { $fulltext: 'test' } });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where match(??) against (? in boolean mode)');
  });

  test('select via multiple where clauses with fulltext search', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({
      termsAccepted: true,
      name: { $fulltext: 'test' },
      email: { $fulltext: 'test' },
    });
    expect(qb1.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where `a`.`terms_accepted` = ? and match(??) against (? in boolean mode) and match(??) against (? in boolean mode)',
    );
  });

  test('order by asc nulls first', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ name: QueryOrder.ASC_NULLS_FIRST });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by `e0`.`name` is not null, `e0`.`name` asc');
  });

  test('order by nulls last', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*').orderBy({ name: QueryOrder.DESC_NULLS_LAST, type: QueryOrder.ASC_NULLS_LAST });
    expect(qb.getQuery()).toEqual(
      'select `e0`.* from `publisher2` as `e0` order by `e0`.`name` is null, `e0`.`name` desc, `e0`.`type` is null, `e0`.`type` asc',
    );
  });

  test('order by custom expression', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.select('*')
      .orderBy({ [sql`length(name)`]: QueryOrder.DESC })
      .andOrderBy({ type: QueryOrder.ASC });
    expect(qb.getQuery()).toEqual('select `e0`.* from `publisher2` as `e0` order by length(name) desc, `e0`.`type` asc');
  });

  test('limit of 0 limits results to 0', () => {
    const expected = 'select `e0`.`uuid_pk` from `book2` as `e0` limit 0';
    const sql = orm.em.createQueryBuilder(Book2).select('uuid').limit(0).getFormattedQuery();
    expect(sql).toBe(expected);
  });

  test(`order by forumla field should not include 'as'`, async () => {
    const sql = orm.em.createQueryBuilder(Book2).select('*').orderBy({ priceTaxed: QueryOrder.DESC }).getFormattedQuery();
    expect(sql).toBe('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` order by `e0`.`price` * 1.19 desc');
  });

  test('aliased join condition', () => {
    const sql1 = orm.em.createQueryBuilder(Book2, 'b').select('*').innerJoinAndSelect('author', 'a').where({ 'a.born': '1990-03-23' }).getFormattedQuery();
    expect(sql1).toBe(
      "select `b`.*, `a`.`id` as `a__id`, `a`.`created_at` as `a__created_at`, `a`.`updated_at` as `a__updated_at`, `a`.`name` as `a__name`, `a`.`email` as `a__email`, `a`.`age` as `a__age`, `a`.`terms_accepted` as `a__terms_accepted`, `a`.`optional` as `a__optional`, `a`.`identities` as `a__identities`, `a`.`born` as `a__born`, `a`.`born_time` as `a__born_time`, `a`.`favourite_book_uuid_pk` as `a__favourite_book_uuid_pk`, `a`.`favourite_author_id` as `a__favourite_author_id`, `a`.`identity` as `a__identity`, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` inner join `author2` as `a` on `b`.`author_id` = `a`.`id` where `a`.`born` = '1990-03-23'",
    );

    const sql2 = orm.em.createQueryBuilder(Book2, 'b').select('*').joinAndSelect('author', 'a', { 'a.born': '1990-03-23' }).getFormattedQuery();
    expect(sql2).toBe(
      "select `b`.*, `a`.`id` as `a__id`, `a`.`created_at` as `a__created_at`, `a`.`updated_at` as `a__updated_at`, `a`.`name` as `a__name`, `a`.`email` as `a__email`, `a`.`age` as `a__age`, `a`.`terms_accepted` as `a__terms_accepted`, `a`.`optional` as `a__optional`, `a`.`identities` as `a__identities`, `a`.`born` as `a__born`, `a`.`born_time` as `a__born_time`, `a`.`favourite_book_uuid_pk` as `a__favourite_book_uuid_pk`, `a`.`favourite_author_id` as `a__favourite_author_id`, `a`.`identity` as `a__identity`, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` inner join `author2` as `a` on `b`.`author_id` = `a`.`id` and `a`.`born` = '1990-03-23'",
    );
  });

  test('join condition with M:N (GH #4644)', () => {
    const sql1 = orm.em.createQueryBuilder(Book2, 'b').select('*').leftJoin('tags', 't', { 't.name': 't1' }).getFormattedQuery();
    expect(sql1).toBe(
      'select `b`.*, `b`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `b` ' +
        'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        "left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` and `t`.`name` = 't1'",
    );
  });
});
