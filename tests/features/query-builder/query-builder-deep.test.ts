import { MikroORM, QueryFlag, QueryOrder, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder - Deep', () => {
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

  test('select with deep where condition', async () => {
    // m:1
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ author: { name: 'Jon Snow', termsAccepted: true } });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`name` = ? and `e1`.`terms_accepted` = ?',
    );
    expect(qb1.getParams()).toEqual(['Jon Snow', true]);

    // 1:m
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.select('*').where({ books: { title: 'Book 1' } });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`title` = ?');
    expect(qb2.getParams()).toEqual(['Book 1']);

    // 1:m -> m:1
    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3.select('*').where({ books: { publisher: { name: 'My Publisher 1' } } });
    expect(qb3.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` where `e2`.`name` = ?',
    );
    expect(qb3.getParams()).toEqual(['My Publisher 1']);

    // 1:m -> m:1 -> m:n
    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').where({ books: { publisher: { tests: { name: 'Test 2' } } } });
    expect(qb4.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
        'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
        'where `e3`.`name` = ?',
    );
    expect(qb4.getParams()).toEqual(['Test 2']);

    // m:n owner pivot join
    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5.select('*').where({ tags: ['1', '2', '3'] });
    expect(qb5.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e1` on `e0`.`uuid_pk` = `e1`.`book2_uuid_pk` ' +
        'where `e1`.`book_tag2_id` in (?, ?, ?)',
    );
    expect(qb5.getParams()).toEqual(['1', '2', '3']);

    // m:n owner
    const qb6 = orm.em.createQueryBuilder(Book2);
    qb6.select('*').where({ tags: { name: 'Tag 3' } });
    expect(qb6.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` = ?',
    );
    expect(qb6.getParams()).toEqual(['Tag 3']);

    // m:n inverse pivot join
    const qb7 = orm.em.createQueryBuilder(BookTag2);
    qb7.select('*').where({ books: ['1', '2', '3'] });
    expect(qb7.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `book_tag2` as `e0` ' +
        'left join `book2_tags` as `e1` on `e0`.`id` = `e1`.`book_tag2_id` ' +
        'where `e1`.`book2_uuid_pk` in (?, ?, ?)',
    );
    expect(qb7.getParams()).toEqual(['1', '2', '3']);

    // m:n inverse
    const qb8 = orm.em.createQueryBuilder(BookTag2);
    qb8.select('*').where({ books: { title: 'Book 123' } });
    expect(qb8.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `book_tag2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
        'left join `book2` as `e1` on `e2`.`book2_uuid_pk` = `e1`.`uuid_pk` ' +
        'where `e1`.`title` = ?',
    );
    expect(qb8.getParams()).toEqual(['Book 123']);

    // 1:1 -> 1:1 self-reference -> 1:1
    const qb9 = orm.em.createQueryBuilder(FooBar2);
    qb9.select('*').where({ fooBar: { baz: { name: 'Foo Baz' } } });
    expect(qb9.getQuery()).toEqual(
      'select `e0`.*, (select 123) as `random` from `foo_bar2` as `e0` ' +
        'left join `foo_bar2` as `e1` on `e0`.`foo_bar_id` = `e1`.`id` ' +
        'left join `foo_baz2` as `e2` on `e1`.`baz_id` = `e2`.`id` ' +
        'where `e2`.`name` = ?',
    );
    expect(qb9.getParams()).toEqual(['Foo Baz']);

    // m:1 -> m:1 -> m:1 self-reference
    const qb10 = orm.em.createQueryBuilder(Book2);
    qb10.select('*').where({ author: { favouriteBook: { author: { name: 'Jon Snow' } } } });
    expect(qb10.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join (`book2` as `e2` ' +
        'inner join `author2` as `e3` on `e2`.`author_id` = `e3`.`id`) ' +
        'on `e1`.`favourite_book_uuid_pk` = `e2`.`uuid_pk` ' +
        'where `e3`.`name` = ?',
    );
    expect(qb10.getParams()).toEqual(['Jon Snow']);

    // 1:1 from inverse
    const qb11 = orm.em.createQueryBuilder(FooBaz2);
    qb11.select('*').where({ bar: { name: 'Foo Bar' } });
    expect(qb11.getQuery()).toEqual(
      'select `e0`.* from `foo_baz2` as `e0` ' + 'left join `foo_bar2` as `e1` on `e0`.`id` = `e1`.`baz_id` ' + 'where `e1`.`name` = ?',
    );
    expect(qb11.getParams()).toEqual(['Foo Bar']);

    // include lazy formulas
    const qb12 = orm.em.createQueryBuilder(FooBar2);
    qb12
      .select('*')
      .where({ fooBar: { baz: { name: 'Foo Baz' } } })
      .setFlag(QueryFlag.INCLUDE_LAZY_FORMULAS);
    expect(qb12.getQuery()).toEqual(
      'select `e0`.*, (select 123) as `random`, (select 456) as `lazy_random` from `foo_bar2` as `e0` ' +
        'left join `foo_bar2` as `e1` on `e0`.`foo_bar_id` = `e1`.`id` ' +
        'left join `foo_baz2` as `e2` on `e1`.`baz_id` = `e2`.`id` ' +
        'where `e2`.`name` = ?',
    );
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
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `author2` as `e2` on `e1`.`favourite_author_id` = `e2`.`id` ' +
        'where `e2`.`name` = ? and `e2`.`terms_accepted` = ?',
    );
    expect(qb1.getParams()).toEqual(['Jon Snow', true]);
  });

  test('select with deep order by', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').orderBy({ author: { name: QueryOrder.DESC } });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` order by `e1`.`name` desc',
    );

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.select('*').orderBy({ books: { title: QueryOrder.ASC } });
    expect(qb2.getQuery()).toEqual('select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` order by `e1`.`title` asc');

    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3.select('*').orderBy({ books: { publisher: { name: QueryOrder.DESC } } });
    expect(qb3.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` order by `e2`.`name` desc',
    );

    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.select('*').orderBy({ books: { publisher: { tests: { name: QueryOrder.DESC } } } });
    expect(qb4.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'left join `publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
        'left join `test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
        'order by `e3`.`name` desc',
    );

    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5.select('*').orderBy({ tags: { name: QueryOrder.DESC } });
    expect(qb5.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'order by `e1`.`name` desc',
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

  test('select with deep where and deep order by', async () => {
    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1
      .select('*')
      .where({ author: { name: 'Jon Snow' } })
      .orderBy({ author: { name: QueryOrder.DESC } });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` where `e1`.`name` = ? order by `e1`.`name` desc',
    );
    expect(qb1.getParams()).toEqual(['Jon Snow']);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2
      .select('*')
      .where({ books: { title: 'Book 1' } })
      .orderBy({ books: { title: QueryOrder.ASC } });
    expect(qb2.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` where `e1`.`title` = ? order by `e1`.`title` asc',
    );
    expect(qb2.getParams()).toEqual(['Book 1']);

    const qb3 = orm.em.createQueryBuilder(Author2);
    qb3
      .select('*')
      .where({ books: { publisher: { name: 'My Publisher 1' } } })
      .orderBy({ books: { publisher: { name: QueryOrder.DESC } } });
    expect(qb3.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` where `e2`.`name` = ? order by `e2`.`name` desc',
    );
    expect(qb3.getParams()).toEqual(['My Publisher 1']);

    const qb4 = orm.em.createQueryBuilder(Author2);
    qb4.withSchema('test123');
    qb4
      .select('*')
      .where({ books: { publisher: { tests: { name: 'Test 2' } } } })
      .orderBy({ books: { publisher: { tests: { name: QueryOrder.DESC } } } });
    expect(qb4.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `test123`.`author2` as `e0` ' +
        'left join `test123`.`book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `test123`.`publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'left join `test123`.`publisher2_tests` as `e4` on `e2`.`id` = `e4`.`publisher2_id` ' +
        'left join `test123`.`test2` as `e3` on `e4`.`test2_id` = `e3`.`id` ' +
        'where `e3`.`name` = ? order by `e3`.`name` desc',
    );
    expect(qb4.getParams()).toEqual(['Test 2']);

    const qb5 = orm.em.createQueryBuilder(Book2);
    qb5
      .select('*')
      .where({ tags: { name: 'Tag 3' } })
      .orderBy({ tags: { name: QueryOrder.DESC } });
    expect(qb5.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` = ? order by `e1`.`name` desc',
    );
    expect(qb5.getParams()).toEqual(['Tag 3']);
  });

  test('select with deep where condition with operators', async () => {
    const qb0 = orm.em.createQueryBuilder(Book2);
    qb0.select('*').where({ author: { $or: [{ name: 'Jon Snow 1' }, { email: /^snow@/ }] } });
    expect(qb0.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'where (`e1`.`name` = ? or `e1`.`email` like ?)',
    );
    expect(qb0.getParams()).toEqual(['Jon Snow 1', 'snow@%']);

    const qb1 = orm.em.createQueryBuilder(Book2);
    qb1.select('*').where({ $or: [{ author: { name: 'Jon Snow 1', termsAccepted: true } }, { author: { name: 'Jon Snow 2' } }] });
    expect(qb1.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'where ((`e1`.`name` = ? and `e1`.`terms_accepted` = ?) or `e1`.`name` = ?)',
    );
    expect(qb1.getParams()).toEqual(['Jon Snow 1', true, 'Jon Snow 2']);

    const qb2 = orm.em.createQueryBuilder(Book2);
    qb2.select('*').where({ $or: [{ author: { $or: [{ name: 'Jon Snow 1' }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb2.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
        'where (((`e1`.`name` = ? or `e1`.`email` like ?)) or `e2`.`name` = ?)',
    );
    expect(qb2.getParams()).toEqual(['Jon Snow 1', 'snow@%', 'My Publisher']);

    const qb3 = orm.em.createQueryBuilder(Book2);
    qb3
      .select('*')
      .where({ $or: [{ author: { $or: [{ name: { $in: ['Jon Snow 1', 'Jon Snow 2'] } }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb3.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
        'where (((`e1`.`name` in (?, ?) or `e1`.`email` like ?)) or `e2`.`name` = ?)',
    );
    expect(qb3.getParams()).toEqual(['Jon Snow 1', 'Jon Snow 2', 'snow@%', 'My Publisher']);

    const qb4 = orm.em.createQueryBuilder(Book2);
    qb4.select('*').where({ $or: [{ author: { $or: [{ $not: { name: 'Jon Snow 1' } }, { email: /^snow@/ }] } }, { publisher: { name: 'My Publisher' } }] });
    expect(qb4.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` from `book2` as `e0` ' +
        'inner join `author2` as `e1` on `e0`.`author_id` = `e1`.`id` ' +
        'left join `publisher2` as `e2` on `e0`.`publisher_id` = `e2`.`id` ' +
        'where (((not (`e1`.`name` = ?) or `e1`.`email` like ?)) or `e2`.`name` = ?)',
    );
    expect(qb4.getParams()).toEqual(['Jon Snow 1', 'snow@%', 'My Publisher']);

    const qb5 = orm.em.createQueryBuilder(Author2);
    qb5.select('*').where({ books: { $or: [{ title: 'Book 1' }, { publisher: { name: 'Publisher 1' } }] } });
    expect(qb5.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'where (`e1`.`title` = ? or `e2`.`name` = ?)',
    );
    expect(qb5.getParams()).toEqual(['Book 1', 'Publisher 1']);

    const qb6 = orm.em.createQueryBuilder(Author2);
    qb6.select('*').where({ books: { publisher: { $or: [{ name: 'My Publisher 1' }, { name: 'My Publisher 2' }] } } });
    expect(qb6.getQuery()).toEqual(
      'select `e0`.* from `author2` as `e0` ' +
        'left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id` ' +
        'left join `publisher2` as `e2` on `e1`.`publisher_id` = `e2`.`id` ' +
        'where (`e2`.`name` = ? or `e2`.`name` = ?)',
    );
    expect(qb6.getParams()).toEqual(['My Publisher 1', 'My Publisher 2']);

    const qb7 = orm.em.createQueryBuilder(Book2);
    qb7.select('*').where({ tags: { name: { $in: ['Tag 1', 'Tag 2'] } } });
    expect(qb7.getQuery()).toEqual(
      'select `e0`.*, `e0`.`price` * 1.19 as `price_taxed` ' +
        'from `book2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`uuid_pk` = `e2`.`book2_uuid_pk` ' +
        'left join `book_tag2` as `e1` on `e2`.`book_tag2_id` = `e1`.`id` ' +
        'where `e1`.`name` in (?, ?)',
    );
    expect(qb7.getParams()).toEqual(['Tag 1', 'Tag 2']);

    const qb8 = orm.em.createQueryBuilder(BookTag2);
    qb8.select('*').where({ books: { test: { name: { $in: ['Test 1', 'Test 2'] } } } });
    expect(qb8.getQuery()).toEqual(
      'select `e0`.* ' +
        'from `book_tag2` as `e0` ' +
        'left join `book2_tags` as `e2` on `e0`.`id` = `e2`.`book_tag2_id` ' +
        'left join `book2` as `e1` on `e2`.`book2_uuid_pk` = `e1`.`uuid_pk` ' +
        'left join `test2` as `e3` on `e1`.`uuid_pk` = `e3`.`book_uuid_pk` ' +
        'where `e3`.`name` in (?, ?)',
    );
    expect(qb8.getParams()).toEqual(['Test 1', 'Test 2']);
  });

  test('select with deep where with invalid property throws error', async () => {
    const qb0 = orm.em.createQueryBuilder(Book2);
    const err = 'Trying to query by not existing property Author2.undefinedName';
    expect(() =>
      qb0
        .select('*')
        // @ts-expect-error testing invalid property name
        .where({ author: { undefinedName: 'Jon Snow' } })
        .getQuery(),
    ).toThrow(err);
  });
});
