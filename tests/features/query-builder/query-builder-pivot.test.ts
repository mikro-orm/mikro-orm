import { MikroORM, QueryOrder, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, User2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder - Pivot', () => {
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

  test('pivot joining of m:n when target entity is null (GH issue 548)', async () => {
    const qb11 = orm.em.createQueryBuilder(User2, 'u').select('u.*').where({ cars: null });
    expect(qb11.getQuery()).toMatch(
      'select `u`.* ' +
        'from `user2` as `u` ' +
        'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
        'where (`e1`.`car2_name`, `e1`.`car2_year`) is null',
    );
    expect(qb11.getParams()).toEqual([]);

    const qb2 = orm.em
      .createQueryBuilder(Book2, 'b')
      .select('b.*')
      .where({ $or: [{ tags: null }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch(
      'select `b`.*, `b`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `b` ' +
        'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)',
    );
    expect(qb2.getParams()).toEqual(['1']);

    const qb3 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('a.*')
      .where({ friends: null })
      .orderBy({ friends: { name: QueryOrder.ASC } });
    expect(qb3.getQuery()).toMatch(
      'select `a`.* ' +
        'from `author2` as `a` ' +
        'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
        'left join `author2` as `e2` on `e1`.`author2_2_id` = `e2`.`id` ' +
        'where `e1`.`author2_2_id` is null ' +
        'order by `e2`.`name` asc',
    );
    expect(qb3.getParams()).toEqual([]);

    const qb4 = orm.em.createQueryBuilder(Author2, 'a').select('a.*').where({ friends: null }).orderBy({ friends: QueryOrder.ASC });
    expect(qb4.getQuery()).toMatch(
      'select `a`.* ' +
        'from `author2` as `a` ' +
        'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
        'where `e1`.`author2_2_id` is null ' +
        'order by `e1`.`author2_2_id` asc',
    );
    expect(qb4.getParams()).toEqual([]);
  });

  test('123 pivot joining of m:n when no target entity needed directly (GH issue 549)', async () => {
    const qb3 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('a.*')
      .where({ friends: null })
      .orderBy({ friends: { name: QueryOrder.ASC } });
    expect(qb3.getQuery()).toMatch(
      'select `a`.* ' +
        'from `author2` as `a` ' +
        'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
        'left join `author2` as `e2` on `e1`.`author2_2_id` = `e2`.`id` ' +
        'where `e1`.`author2_2_id` is null ' +
        'order by `e2`.`name` asc',
    );
    expect(qb3.getParams()).toEqual([]);
  });

  test('pivot joining of m:n when no target entity needed directly (GH issue 549)', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Book2, 'b')
      .select('b.*')
      .where({ tags: { id: 1 } });
    expect(qb1.getQuery()).toMatch(
      'select `b`.*, `b`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `b` ' +
        'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'where `e1`.`book_tag2_id` = ?',
    );
    expect(qb1.getParams()).toEqual(['1']);

    const qb11 = orm.em
      .createQueryBuilder(User2, 'u')
      .select('u.*')
      .where({ cars: { name: 'n', year: 1 } });
    expect(qb11.getQuery()).toMatch(
      'select `u`.* ' +
        'from `user2` as `u` ' +
        'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
        'where (`e1`.`car2_name`, `e1`.`car2_year`) = (?, ?)',
    );
    expect(qb11.getParams()).toEqual(['n', 1]);

    const qb12 = orm.em
      .createQueryBuilder(User2, 'u')
      .select('u.*')
      .where({
        cars: {
          $in: [
            { name: 'n', year: 1 },
            { name: 'n', year: 2 },
          ],
        },
      } as any);
    expect(qb12.getQuery()).toMatch(
      'select `u`.* ' +
        'from `user2` as `u` ' +
        'left join `user2_cars` as `e1` on `u`.`first_name` = `e1`.`user2_first_name` and `u`.`last_name` = `e1`.`user2_last_name` ' +
        'where (`e1`.`car2_name`, `e1`.`car2_year`) in ((?, ?), (?, ?))',
    );
    expect(qb12.getParams()).toEqual(['n', 1, 'n', 2]);

    const qb2 = orm.em
      .createQueryBuilder(Book2, 'b')
      .select('b.*')
      .where({ $or: [{ tags: { id: null } }, { tags: { $ne: 1 } }] });
    expect(qb2.getQuery()).toMatch(
      'select `b`.*, `b`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `b` ' +
        'left join `book2_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'where (`e1`.`book_tag2_id` is null or `e1`.`book_tag2_id` != ?)',
    );
    expect(qb2.getParams()).toEqual(['1']);

    const qb4 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('a.*')
      .where({ friends: 1 })
      .orderBy({ friends: { id: QueryOrder.ASC } });
    expect(qb4.getQuery()).toMatch(
      'select `a`.* ' +
        'from `author2` as `a` ' +
        'left join `author_to_friend` as `e1` on `a`.`id` = `e1`.`author2_1_id` ' +
        'where `e1`.`author2_2_id` = ? ' +
        'order by `e1`.`author2_2_id` asc',
    );
    expect(qb4.getParams()).toEqual([1]);
  });

  test('branching to-many relations (#2677)', async () => {
    // no branching as there is only one item in $and array
    const qb0 = orm.em.createQueryBuilder(Book2);
    qb0
      .select('*')
      .where({
        $and: [{ tags: { name: 'tag1' } }],
      })
      .orderBy({ tags: { name: 1 } });
    expect(qb0.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` = ? ' +
        'order by `e1`.`name` asc',
    );

    // branching as its m:n
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({
      $and: [{ tags: { name: 'tag1' } }, { tags: { name: 'tag2' } }],
    });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'left join `book2_tags` as `e4` on `e0`.`uuid_pk` = `e4`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e3` on `e4`.`book_tag2_id` = `e3`.`id` ' +
        'where `e1`.`name` = ? and `e3`.`name` = ?',
    );

    // no branching as its m:1
    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      $and: [{ author: { name: 'a1' } }, { author: { name: 'a2' } }],
    });
    expect(qb2.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'where `e1`.`name` = ? and `e1`.`name` = ?',
    );

    // no branching as its m:1 and $or
    const qb3 = orm.em.createQueryBuilder(Book2);
    qb3.select('*').where({
      $or: [{ author: { name: 'a1' } }, { author: { name: 'a2' } }],
    });
    expect(qb3.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'where (`e1`.`name` = ? or `e1`.`name` = ?)',
    );

    // branching as its 1:m
    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').where({
      $and: [{ books: { title: 'b1' } }, { books: { title: 'b2' } }],
    });
    expect(qb4.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `book2` as `e2` on `e0`.`id` = `e2`.`author_id` ' +
        'where `e1`.`title` = ? and `e2`.`title` = ?',
    );

    // no branching as its $or
    const qb5 = orm.em.createQueryBuilder(Author2);
    qb5.select('*').where({
      $or: [{ books: { title: 't1' } }, { books: { title: 't2' } }],
    });
    expect(qb5.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'where (`e1`.`title` = ? or `e1`.`title` = ?)',
    );

    // no branching as the $and is under m:n
    const qb6 = orm.em.createQueryBuilder(Book2);
    qb6.select('*').where({
      tags: {
        $and: [{ name: 'tag1' }, { name: 'tag2' }],
      },
    });
    expect(qb6.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` = ? and `e1`.`name` = ?',
    );

    // no branching as its m:1
    const qb7 = orm.em.createQueryBuilder(Book2);
    qb7.select('*').where({
      $and: [{ author: { favouriteBook: { title: 'a1' } } }, { author: { favouriteBook: { title: 'a2' } } }],
    });
    expect(qb7.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
        'where `e2`.`title` = ? and `e2`.`title` = ?',
    );

    // branching as its 1:m
    const qb8 = orm.em.createQueryBuilder(Author2);
    qb8.select('*').where({
      $and: [{ books: { author: { name: 'a1' } } }, { books: { author: { name: 'a2' } } }],
    });
    expect(qb8.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join (`book2` as `e1` ' +
        'inner join `author2` as `e2` on `e1`.`author_id` = `e2`.`id`) ' +
        'on `e0`.`id` = `e1`.`author_id` ' +
        'left join (`book2` as `e3` ' +
        'inner join `author2` as `e4` on `e3`.`author_id` = `e4`.`id`) ' +
        'on `e0`.`id` = `e3`.`author_id` ' +
        'where `e2`.`name` = ? and `e4`.`name` = ?',
    );

    // no branching as its both m:1
    const qb9 = orm.em.createQueryBuilder(Book2);
    qb9.select('*').where({
      $and: [
        {
          author: {
            $and: [{ favouriteBook: { title: 'a1' } }, { favouriteBook: { title: 'a2' } }],
          },
        },
        {
          author: {
            $and: [{ favouriteBook: { title: 'a3' } }, { favouriteBook: { title: 'a4' } }],
          },
        },
      ],
    });
    expect(qb9.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `book2` as `e2` on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
        'where `e2`.`title` = ? and `e2`.`title` = ? and `e2`.`title` = ? and `e2`.`title` = ?',
    );

    // branching as its both 1:m/m:n
    const qb10 = orm.em.createQueryBuilder(Author2);
    qb10.select('*').where({
      $and: [
        {
          books: {
            $and: [{ tags: { name: 't1' } }, { tags: { name: 't2' } }],
          },
        },
        {
          books: {
            $and: [{ tags: { name: 't3' } }, { tags: { name: 't4' } }],
          },
        },
      ],
    });
    expect(qb10.getQuery()).toEqual(
      'select `e0`.* ' +
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
        'where `e2`.`name` = ? and `e4`.`name` = ? and `e7`.`name` = ? and `e9`.`name` = ?',
    );

    // no branching as its $or
    const qb11 = orm.em.createQueryBuilder(Author2);
    qb11.select('*').where({
      $or: [
        {
          books: {
            $or: [{ tags: { name: 't1' } }, { tags: { name: 't2' } }],
          },
        },
        {
          books: {
            $or: [{ tags: { name: 't3' } }, { tags: { name: 't4' } }],
          },
        },
      ],
    });
    expect(qb11.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `book2_tags` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id` ' +
        'where (((`e2`.`name` = ? or `e2`.`name` = ?)) or ((`e2`.`name` = ? or `e2`.`name` = ?)))',
    );

    // branching only for $and
    const qb12 = orm.em.createQueryBuilder(Author2);
    qb12.select('*').where({
      $or: [
        {
          books: {
            $and: [{ tags: { name: 't1' } }, { tags: { name: 't2' } }],
          },
        },
        {
          books: {
            $and: [{ tags: { name: 't3' } }, { tags: { name: 't4' } }],
          },
        },
      ],
    });
    expect(qb12.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `book2_tags` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id` ' +
        'left join `book2_tags` as `e5` on `e1`.`uuid_pk` = `e5`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e4` on `e5`.`book_tag2_id` = `e4`.`id` ' +
        'where ((`e2`.`name` = ? and `e4`.`name` = ?) or (`e2`.`name` = ? and `e4`.`name` = ?))',
    );
  });

  test('complex condition for json property with update query (GH #2839)', async () => {
    const qb141 = orm.em
      .createQueryBuilder(Book2)
      .update({ meta: { items: 3 } })
      .where({
        $and: [
          { uuid: 'b47f1cca-90ca-11ec-99e0-42010a5d800c' },
          {
            $or: [{ meta: null }, { meta: { $eq: null } }, { meta: { time: { $lt: 1646147306 } } }],
          },
        ],
      });
    expect(qb141.getFormattedQuery()).toBe(
      'update `book2` set `meta` = \'{\\"items\\":3}\' ' +
        "where `uuid_pk` = 'b47f1cca-90ca-11ec-99e0-42010a5d800c' " +
        'and (`meta` is null ' +
        'or `meta` is null ' +
        "or json_extract(`meta`, '$.time') < 1646147306)",
    );
  });

  test('query json property with operator directly (GH #3246)', async () => {
    const qb = orm.em.createQueryBuilder(Book2).where({ meta: { $ne: null } });
    expect(qb.getFormattedQuery()).toBe('select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` where `e0`.`meta` is not null');
  });

  test('GH issue 786', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({
      $and: [{ uuid: { $ne: '...' }, createdAt: { $gt: '2020-08-26T20:01:48.863Z' } }, { tags: { name: { $in: ['tag1'] } } }],
    });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e0`.`uuid_pk` != ? and `e0`.`created_at` > ? and `e1`.`name` in (?)',
    );

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({
      $and: [{ tags: { name: { $in: ['tag1'] } } }, { uuid: { $ne: '...' }, createdAt: { $gt: '2020-08-26T20:01:48.863Z' } }],
    });
    expect(qb2.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` in (?) and `e0`.`uuid_pk` != ? and `e0`.`created_at` > ?',
    );
  });
});
