import { MikroORM, QueryFlag, QueryOrder, raw, sql, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { CriteriaNode } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, FooBar2, Publisher2, PublisherType } from '../../entities-sql/index.js';
import { initORMMySql, mockLogger } from '../../bootstrap.js';
import { performance } from 'node:perf_hooks';

describe('QueryBuilder - Advanced', () => {
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

  test('clone QB', async () => {
    const qb = orm.em
      .createQueryBuilder(Publisher2, 'p')
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .setFlag(QueryFlag.DISABLE_NESTED_INNER_JOIN);

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

    const sql =
      'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      'where `p`.`name` = ? and `b`.`title` like ? ' +
      'order by `b`.`title` desc';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['test 123', '%3']);

    const sql2 =
      'select `p`.*, `b`.*, `a`.*, `t`.* from `publisher2` as `p` ' +
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
    const qb = orm.em
      .createQueryBuilder(Publisher2, 'p')
      .leftJoinAndSelect('books', 'b')
      .joinAndSelect('b.author', 'a')
      .joinAndSelect('b.tags', 't')
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .limit(10, 5)
      .setFlag(QueryFlag.DISABLE_NESTED_INNER_JOIN);
    await qb.getResult();

    const sql =
      'select `p`.*, `b`.`uuid_pk` as `b__uuid_pk`, `b`.`created_at` as `b__created_at`, `b`.`isbn` as `b__isbn`, `b`.`title` as `b__title`, `b`.`price` as `b__price`, `b`.`price` * 1.19 as `b__price_taxed`, `b`.`double` as `b__double`, `b`.`meta` as `b__meta`, `b`.`author_id` as `b__author_id`, `b`.`publisher_id` as `b__publisher_id`, ' +
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
    const qb = orm.em
      .createQueryBuilder(Publisher2, 'p')
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .setFlag(QueryFlag.DISABLE_PAGINATE)
      .setFlag(QueryFlag.DISABLE_NESTED_INNER_JOIN)
      .limit(10, 5);

    const sql =
      'select `p`.*, `b`.*, `a`.*, `t`.* ' +
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
    const qb = orm.em
      .createQueryBuilder(Publisher2, 'p')
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .groupBy('a.id')
      .limit(10, 5)
      .setFlag(QueryFlag.DISABLE_NESTED_INNER_JOIN);

    const sql =
      'select `p`.*, `b`.*, `a`.*, `t`.* ' +
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
    await orm.em
      .createQueryBuilder(Publisher2, 'p')
      .leftJoin('books', 'b')
      .join('b.author', 'a')
      .join('b.tags', 't')
      .select(['p.*', 'b.*', 'a.*', 't.*'])
      .where({ 'p.name': 'test 123', 'b.title': /3$/ })
      .orderBy({ 'b.title': QueryOrder.DESC })
      .limit(10, 5)
      .setFlag(QueryFlag.DISABLE_NESTED_INNER_JOIN)
      .getCount('id', true);

    const sql =
      'select count(distinct `p`.`id`) as `count` ' +
      'from `publisher2` as `p` ' +
      'left join `book2` as `b` on `p`.`id` = `b`.`publisher_id` ' +
      'inner join `author2` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
      'inner join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` ' +
      "where `p`.`name` = 'test 123' and `b`.`title` like '%3'";
    expect(logger.mock.calls[0][0]).toMatch(sql);
    expect(logger.mock.calls[0][0]).not.toMatch(' limit ');
    expect(logger.mock.calls[0][0]).not.toMatch(' offset ');
    expect(logger.mock.calls[0][0]).not.toMatch(' order by ');
    logger.mockRestore();
  });

  test('qp.getResultAndCount()', async () => {
    // given
    const qb = orm.em.createQueryBuilder(FooBar2, 'fb');
    qb.select('*').where({ name: 'fb 1' }).limit(2);

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
      $or: [{ $and: [{ name: 'value1', email: 'value2' }] }, { $and: [{ name: 'value3', email: 'value4' }] }],
    });
    expect(qb2.getQuery()).toEqual('select `a`.* from `author2` as `a` where ((`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?))');

    const qb3 = orm.em.createQueryBuilder(Author2, 'a');
    qb3.select('*').where({
      $and: [{ name: 'value1' }, { name: 'value3' }],
    });
    expect(qb3.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`name` = ?');

    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select('*').where({
      $and: [{ $or: [{ name: 'value1' }] }, { $or: [{ name: 'value3' }] }],
    });
    expect(qb4.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`name` = ?');

    const qb5 = orm.em.createQueryBuilder(Author2, 'a');
    qb5.select('*').where({
      $and: [{ $or: [{ name: 'value1' }, { email: 'value2' }] }, { $or: [{ name: 'value3' }, { email: 'value4' }] }],
    });
    expect(qb5.getQuery()).toEqual('select `a`.* from `author2` as `a` where (`a`.`name` = ? or `a`.`email` = ?) and (`a`.`name` = ? or `a`.`email` = ?)');

    const qb6 = orm.em.createQueryBuilder(Author2, 'a');
    qb6.select('*').where({
      $and: [{ $or: [{ name: 'value1', email: 'value2' }] }, { $or: [{ name: 'value3', email: 'value4' }] }],
    });
    expect(qb6.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`name` = ? and `a`.`email` = ? and `a`.`name` = ? and `a`.`email` = ?');

    const qb7 = orm.em.createQueryBuilder(Author2, 'a');
    qb7.select('*').where({
      $or: [{ $and: [{ name: 'value1', email: 'value2' }] }, { $and: [{ name: 'value3', email: 'value4' }] }, { $or: [{ name: 'value5', email: 'value6' }] }],
    });
    expect(qb7.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where ((`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?) or (`a`.`name` = ? and `a`.`email` = ?))',
    );

    const qb8 = orm.em.createQueryBuilder(Author2, 'a');
    qb8.select('*').where({
      $and: [{ $or: [{ name: 'value1', email: 'value2' }] }, { $or: [{ name: 'value3', email: 'value4' }] }, { $and: [{ name: 'value5', email: 'value6' }] }],
    });
    expect(qb8.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where ' +
        '`a`.`name` = ? and `a`.`email` = ? and ' +
        '`a`.`name` = ? and `a`.`email` = ? and ' +
        '`a`.`name` = ? and `a`.`email` = ?',
    );

    const qb9 = orm.em.createQueryBuilder(Author2, 'a');
    qb9.select('*').where({
      $or: [
        { $and: [{ name: 'value1', email: 'value2' }] },
        { $not: { name: 'value3', email: 'value4' } },
        { $or: [{ name: 'value5', email: 'value6' }] },
        { $and: [{ name: 'value7', email: 'value8' }] },
      ],
    });
    expect(qb9.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where ' +
        '((`a`.`name` = ? and `a`.`email` = ?) or ' +
        'not (`a`.`name` = ? and `a`.`email` = ?) or ' +
        '(`a`.`name` = ? and `a`.`email` = ?) or ' +
        '(`a`.`name` = ? and `a`.`email` = ?))',
    );

    const qb10 = orm.em.createQueryBuilder(Author2, 'a');
    qb10.select('*').where({
      $or: [{ email: 'value1' }, { name: { $in: ['value2'], $ne: 'value3' } }],
    });
    expect(qb10.getQuery()).toEqual('select `a`.* from `author2` as `a` where (`a`.`email` = ? or (`a`.`name` in (?) and `a`.`name` != ?))');

    const qb11 = orm.em.createQueryBuilder(Author2, 'a');
    qb11.select('*').where({
      $or: [
        {
          $or: [{ email: 'value1' }, { name: { $in: ['value2'], $ne: 'value3' } }, { email: 'value4' }],
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
    expect(qb11.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where (' +
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
        ')',
    );
  });

  test('$or operator inside auto-joined relation', async () => {
    const query = {
      author: {
        $or: [{ id: 123 }, { name: { $like: `%jon%` } }],
      },
    };
    const expected =
      "select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where (`e1`.`id` = 123 or `e1`.`name` like '%jon%')";
    const sql1 = orm.em.createQueryBuilder(Book2).select('*').where(query).getFormattedQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Book2).where(query).getFormattedQuery();
    expect(sql2).toBe(expected);
  });

  test('select fk by operator should not trigger auto-joining', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ favouriteBook: { $in: ['1', '2', '3'] } });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`favourite_book_uuid_pk` in (?, ?, ?)');
  });

  test('select and order by auto-joined property', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1
      .select('*')
      .where({
        $or: [{ author: { name: 'test' } }, { publisher: { name: 'RR' } }],
      })
      .orderBy({
        author: { email: 'ASC' },
      });
    expect(qb1.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'left join `publisher2` as `e2` on `a`.`publisher_id` = `e2`.`id` ' +
        'where (`e1`.`name` = ? or `e2`.`name` = ?) ' +
        'order by `e1`.`email` asc',
    );
  });

  test('select with auto-joining and $not (GH issue #1537)', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      $or: [{ author: { name: 'test' } }, { $not: { author: { name: 'wut' } } }],
    });
    expect(qb1.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'where (`e1`.`name` = ? or not (`e1`.`name` = ?))',
    );
  });

  test('select with auto-joining and $not inside relation (GH slack report)', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      author: {
        $not: {
          email: 'test',
        },
      },
    });
    expect(qb1.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'where not (`e1`.`email` = ?)',
    );

    // $not with multiple conditions inside relation
    const qb2 = orm.em.createQueryBuilder(Book2, 'a');
    qb2.select('*').where({
      author: {
        $not: {
          name: 'foo',
          email: 'bar',
        },
      },
    });
    expect(qb2.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'where not (`e1`.`name` = ? and `e1`.`email` = ?)',
    );

    // $not combined with regular conditions inside relation
    const qb3 = orm.em.createQueryBuilder(Book2, 'a');
    qb3.select('*').where({
      author: {
        name: 'test',
        $not: {
          email: 'bar',
        },
      },
    });
    expect(qb3.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'where `e1`.`name` = ? and not (`e1`.`email` = ?)',
    );
  });

  test('select with auto-joining and alias replacement via expr()', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'a');
    qb1.select('*').where({
      $or: [{ author: { name: 'test' } }, { author: { [raw(a => `lower(${a}.name)`)]: 'wut' } }],
    });
    expect(qb1.getQuery()).toEqual(
      'select `a`.*, `a`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `a` ' +
        'inner join `author2` as `e1` on `a`.`author_id` = `e1`.`id` ' +
        'where (`e1`.`name` = ? or lower(e1.name) = ?)',
    );
  });

  test('select by PK via operator', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1.select('*').where({ id: { $in: [1, 2] } });
    expect(qb1.getQuery()).toEqual('select `a`.* from `author2` as `a` where `a`.`id` in (?, ?)');
  });

  test('order by virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1
      .select(['*', sql`"1" as code`])
      .where({ id: { $in: [1, 2] } })
      .orderBy({ code: 'asc' });
    expect(qb1.getQuery()).toEqual('select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) order by `code` asc');
  });

  test('having with virtual property', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a');
    qb1
      .select(['*', sql`"1" as code`])
      .where({ id: { $in: [1, 2] } })
      .having({
        code: { $gte: 'c' },
        $or: [{ code: { $gt: 'c' } }, { id: { $lt: 3 } }],
      });
    expect(qb1.getQuery()).toEqual(
      'select `a`.*, "1" as code from `author2` as `a` where `a`.`id` in (?, ?) having `code` >= ? and (`code` > ? or `a`.`id` < ?)',
    );
  });

  test('perf: select', async () => {
    const start = performance.now();
    for (let i = 1; i <= 10_000; i++) {
      const qb = orm.em.createQueryBuilder(Publisher2);
      qb.select('*')
        .where({ name: `test ${i}`, type: PublisherType.GLOBAL })
        .toQuery();
    }
    const took = performance.now() - start;

    if (took > 250) {
      process.stdout.write(`select test took ${took}\n`);
    }
  });

  test('CriteriaNode', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2);
    node.payload = { foo: 123 };
    expect(node.process({} as any)).toBe(node.payload);
    expect(node.willAutoJoin({} as any)).toBe(false);
  });

  test('getAliasForJoinPath', async () => {
    const node = new CriteriaNode(orm.em.getMetadata(), Author2);
    node.payload = { foo: 123 };
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    expect(qb.getAliasForJoinPath(node.getPath())).toBe('a');
    expect(qb.getAliasForJoinPath(Author2.name)).toBe('a');
    expect(qb.getAliasForJoinPath()).toBe('a');
  });

  test('GH #4104', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    const qb1 = orm.em
      .createQueryBuilder(Book2, 'b')
      .count('b.uuid', true)
      .where({ author: sql.ref('a.id') })
      .as(Author2, 'booksTotal');
    qb.select(['*', qb1])
      .where({ books: { title: 'foo' } })
      .limit(1)
      .orderBy({ booksTotal: QueryOrder.ASC });

    await qb.getResult();
    expect(qb.getQuery()).toEqual(
      'select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` where `a`.`id` in (select `a`.`id` from (select `a`.`id`, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` where `e1`.`title` = ? group by `a`.`id` order by min(`books_total`) asc limit ?) as `a`) order by `books_total` asc',
    );
    expect(qb.getParams()).toEqual(['foo', 1]);
  });

  test('missing where clause', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('*')
      .where({
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
    expect(qb1.getQuery()).toBe(
      'select `a`.* from `author2` as `a` ' +
        'left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'where `e2`.`name` = ?',
    );

    const qb2 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('*')
      .where({
        $or: [
          {
            $and: [{ books2: { $and: [{ publisher: { $and: [{ tests: { $and: [{ name: { $in: ['name'] } }] } }] } }] } }],
          },
        ],
      });
    expect(qb2.getQuery()).toBe(
      'select `a`.* from `author2` as `a` ' +
        'left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
        'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
        'where `e3`.`name` in (?)',
    );
  });

  test('GH #5565', async () => {
    const qb = orm.em.createQueryBuilder(Author2, 'a');
    qb.select('*')
      .limit(1)
      .orderBy({ books: { tags: { id: QueryOrder.ASC } } })
      .populate([{ field: 'friends' }]);

    await qb.getResult();
    expect(qb.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` left join `book2_tags` as `e2` on `e1`.`uuid_pk` = `e2`.`book2_uuid_pk` where `a`.`id` in (select `a`.`id` from (select `a`.`id` from `author2` as `a` left join `book2` as `e1` on `a`.`id` = `e1`.`author_id` left join `book2_tags` as `e2` on `e1`.`uuid_pk` = `e2`.`book2_uuid_pk` group by `a`.`id` order by min(`e2`.`book_tag2_id`) asc limit ?) as `a`) order by `e2`.`book_tag2_id` asc',
    );
    expect(qb.getParams()).toEqual([1]);
  });
});
