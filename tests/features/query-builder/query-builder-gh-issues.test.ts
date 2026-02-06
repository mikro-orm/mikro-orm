import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, FooBaz2, Test2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder - GH Issues', () => {
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

  test('joining 1:1 inverse inside $and condition (GH issue 849)', async () => {
    const sql0 = orm.em.createQueryBuilder(FooBaz2).select('*').where({ bar: 123 }).getQuery();
    expect(sql0).toBe(
      'select `e0`.*, `e1`.`id` as `e1__id` from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` = ?',
    );
    const expected = 'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` where `e1`.`id` in (?)';
    const sql1 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: [123] })
      .getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: { id: [123] } })
      .getQuery();
    expect(sql2).toBe(expected);
    const sql3 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: { id: { $in: [123] } } })
      .getQuery();
    expect(sql3).toBe(expected);
    const sql4 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ $and: [{ bar: { id: { $in: [123] } } }] })
      .getQuery();
    expect(sql4).toBe(expected);
    const sql5 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ $and: [{ bar: [123] }] })
      .getQuery();
    expect(sql5).toBe(expected);
    const sql6 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ $and: [{ bar: { id: [123] } }] })
      .getQuery();
    expect(sql6).toBe(expected);
    const sql7 = orm.em
      .createQueryBuilder(Test2)
      .select('*')
      .where({ book: { $in: ['123'] } })
      .getQuery();
    expect(sql7).toBe('select `e0`.* from `test2` as `e0` where `e0`.`book_uuid_pk` in (?)');
  });

  test('query by 1:m PK (GH issue 857)', async () => {
    const sql0 = orm.em.createQueryBuilder(Author2).select('*').where({ books: '123' }).getQuery();
    expect(sql0).toBe('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` = ?');
    const expected = 'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`uuid_pk` in (?)';
    const sql1 = orm.em
      .createQueryBuilder(Author2)
      .where({ books: ['123'] })
      .getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em
      .createQueryBuilder(Author2)
      .where({ books: { uuid: ['123'] } })
      .getQuery();
    expect(sql2).toBe(expected);
    const sql3 = orm.em
      .createQueryBuilder(Author2)
      .where({ books: { uuid: { $in: ['123'] } } })
      .getQuery();
    expect(sql3).toBe(expected);
    const sql4 = orm.em
      .createQueryBuilder(Author2)
      .where({ $and: [{ books: { uuid: { $in: ['123'] } } }] })
      .getQuery();
    expect(sql4).toBe(expected);
    const sql5 = orm.em
      .createQueryBuilder(Author2)
      .where({ $and: [{ books: ['123'] }] })
      .getQuery();
    expect(sql5).toBe(expected);
    const sql6 = orm.em
      .createQueryBuilder(Author2)
      .where({ $and: [{ books: { uuid: ['123'] } }] })
      .getQuery();
    expect(sql6).toBe(expected);
  });

  test('count query with auto-joining (GH issue 858)', async () => {
    // m:1 -> 1:1 inverse -> PK
    const sql1 = orm.em
      .createQueryBuilder(Author2)
      .count()
      .where({ favouriteBook: { test: { id: 1 } } })
      .getQuery();
    expect(sql1).toBe(
      'select count(*) as `count` ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`favourite_book_uuid_pk` = `e1`.`uuid_pk` ' +
        'left join `test2` as `e2` on `e1`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
        'where `e2`.`id` = ?',
    );

    const sql2 = orm.em
      .createQueryBuilder(Author2)
      .select('*')
      .where({ favouriteBook: { test: { id: 1 } } })
      .getQuery();
    expect(sql2).toBe(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`favourite_book_uuid_pk` = `e1`.`uuid_pk` ' +
        'left join `test2` as `e2` on `e1`.`uuid_pk` = `e2`.`book_uuid_pk` ' +
        'where `e2`.`id` = ?',
    );

    const sql3 = orm.em
      .createQueryBuilder(Book2)
      .count()
      .where({ test: { id: 1 } })
      .getQuery();
    expect(sql3).toBe(
      'select count(*) as `count` ' + 'from `book2` as `e0` ' + 'left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` ' + 'where `e1`.`id` = ?',
    );

    const sql4 = orm.em
      .createQueryBuilder(Book2)
      .select('*')
      .where({ test: { id: 1 } })
      .getQuery();
    expect(sql4).toBe(
      'select `e0`.*, `e1`.`id` as `e1__id`, `e0`.price * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `test2` as `e1` on `e0`.`uuid_pk` = `e1`.`book_uuid_pk` ' +
        'where `e1`.`id` = ?',
    );
  });

  test('deeply nested array condition without operator (GH issue 860)', async () => {
    // 1:1 inverse -> m:n inverse -> [PK]
    let expected =
      'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` left join `test2_bars` as `e2` on `e1`.`id` = `e2`.`foo_bar2_id` where `e2`.`test2_id` in (?, ?, ?)';
    const sql1 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: { tests: { $in: [1, 2, 3] } } })
      .getQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: { tests: [1, 2, 3] } })
      .getQuery();
    expect(sql2).toBe(expected);

    expected =
      'select `e0`.* from `foo_baz2` as `e0` left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` left join `test2_bars` as `e2` on `e1`.`id` = `e2`.`foo_bar2_id` where `e2`.`test2_id` = ?';
    const sql3 = orm.em
      .createQueryBuilder(FooBaz2)
      .where({ bar: { tests: 3 } })
      .getQuery();
    expect(sql3).toBe(expected);
  });
});
