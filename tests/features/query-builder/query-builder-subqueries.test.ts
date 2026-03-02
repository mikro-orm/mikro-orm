import { MikroORM, QueryOrder, raw, sql, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { v4 } from 'uuid';
import { Author2, Book2, BookTag2, Publisher2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';

describe('QueryBuilder - Subqueries', () => {
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

  test('select with sub-query', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Book2, 'b')
      .count('b.uuid', true)
      .where({ author: sql.ref('a.id') })
      .as(Author2, 'booksTotal');
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2.select(['*', qb1]).orderBy({ booksTotal: 'desc' });
    expect(qb2.getQuery()).toEqual(
      'select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc',
    );
    expect(qb2.getParams()).toEqual([]);

    const qb3 = orm.em
      .createQueryBuilder(Book2, 'b')
      .count('b.uuid', true)
      .where({ author: sql.ref('a.id') })
      .as('books_total');
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select(['*', qb3]).orderBy({ booksTotal: 'desc' });
    expect(qb4.getQuery()).toEqual(
      'select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc',
    );
    expect(qb4.getParams()).toEqual([]);
  });

  test('select where sub-query', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Book2, 'b')
      .count('b.uuid', true)
      .where({ author: sql.ref('a.id') })
      .getNativeQuery();
    const qb2 = orm.em.createQueryBuilder(Author2, 'a');
    qb2
      .select('*')
      .withSubQuery(qb1, 'a.booksTotal')
      .where({ 'a.booksTotal': { $in: [1, 2, 3] } });
    expect(qb2.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) in (?, ?, ?)',
    );
    expect(qb2.getParams()).toEqual([1, 2, 3]);

    const { sql: sql3, params: params3 } = orm.em
      .createQueryBuilder(Book2, 'b')
      .count('b.uuid', true)
      .where({ author: sql.ref('a.id') })
      .getNativeQuery()
      .compile();
    const qb4 = orm.em.createQueryBuilder(Author2, 'a');
    qb4.select('*').withSubQuery(raw(sql3, params3), 'a.booksTotal').where({ 'a.booksTotal': 1 });
    expect(qb4.getQuery()).toEqual(
      'select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) = ?',
    );
    expect(qb4.getParams()).toEqual([1]);

    const qb5 = orm.em
      .createQueryBuilder(Book2, 'b')
      .select('b.author')
      .where({ price: { $gt: 100 } });
    const qb6 = orm.em.createQueryBuilder(Author2, 'a').select('*').where(`id in (${qb5.getFormattedQuery()})`);
    expect(qb6.getQuery()).toEqual('select `a`.* from `author2` as `a` where (id in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = orm.em
      .createQueryBuilder(Book2, 'b')
      .select('b.author')
      .where({ price: { $gt: 100 } });
    const qb8 = orm.em
      .createQueryBuilder(Author2, 'a')
      .select('*')
      .where({ id: { $in: qb7.getNativeQuery() } });
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
    qb2
      .leftJoin(qb1, 'sub', { author_id: sql.ref('a.id') })
      .select(['*', 'sub.*'])
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual(
      "select `a`.*, `sub`.* from `author2` as `a` left join (select `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like 'foo%'",
    );
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
    qb3
      .leftJoin(qb1, 'sub', { author_id: sql.ref('a.id') })
      .select(['*', 'sub.*'])
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual(
      "select `a`.*, `sub`.* from `author2` as `a` left join (select `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like 'foo%'",
    );
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
    qb4.select(['*']).leftJoinAndSelect(['a.books', qb1], 'sub').leftJoinAndSelect('sub.tags', 't').where({ 'sub.title': /^foo/ });
    expect(qb4.getFormattedQuery()).toEqual(
      "select `a`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.`price` * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id`, `t`.`id` as `t__id`, `t`.`name` as `t__name` from `author2` as `a` left join (select `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `a`.`id` = `sub`.`author_id` left join `book2_tags` as `e1` on `sub`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` where `sub`.`title` like 'foo%'",
    );
    const res4 = await qb4.getResult();
    expect(res4).toHaveLength(1);
    expect(res4[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    expect(res4[0].books).toHaveLength(1);
    expect(res4[0].books[0]).toMatchObject({
      title: 'foo 1',
      price: 123.0,
      priceTaxed: '146.3700',
    });
    expect(res4[0].books[0].tags).toHaveLength(3);
    orm.em.clear();

    // with a regular join we get two books, as there is no limit
    const qb5 = orm.em.createQueryBuilder(Author2, 'a').select(['*']).leftJoinAndSelect('a.books', 'sub').where({ 'sub.title': /^foo/ });
    expect(qb5.getFormattedQuery()).toEqual(
      "select `a`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.`price` * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id` from `author2` as `a` left join `book2` as `sub` on `a`.`id` = `sub`.`author_id` where `sub`.`title` like 'foo%'",
    );
    const res5 = await qb5.getResult();
    expect(res5).toHaveLength(1);
    expect(res5[0].books).toHaveLength(2);
    orm.em.clear();

    // using ORM subquery to hydrate existing relation, without explicit join condition
    const qb6 = orm.em.createQueryBuilder(Author2, 'a');
    qb6.select(['*']).leftJoinAndSelect(['a.books', qb1.toRaw()], 'sub').leftJoinAndSelect('sub.tags', 't').where({ 'sub.title': /^foo/ });
    expect(qb6.getFormattedQuery()).toEqual(
      "select `a`.*, `sub`.`uuid_pk` as `sub__uuid_pk`, `sub`.`created_at` as `sub__created_at`, `sub`.`isbn` as `sub__isbn`, `sub`.`title` as `sub__title`, `sub`.`price` as `sub__price`, `sub`.`price` * 1.19 as `sub__price_taxed`, `sub`.`double` as `sub__double`, `sub`.`meta` as `sub__meta`, `sub`.`author_id` as `sub__author_id`, `sub`.`publisher_id` as `sub__publisher_id`, `t`.`id` as `t__id`, `t`.`name` as `t__name` from `author2` as `a` left join (select `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `a`.`id` = `sub`.`author_id` left join `book2_tags` as `e1` on `sub`.`uuid_pk` = `e1`.`book2_uuid_pk` left join `book_tag2` as `t` on `e1`.`book_tag2_id` = `t`.`id` where `sub`.`title` like 'foo%'",
    );
    const res6 = await qb6.getResult();
    expect(res6).toHaveLength(1);
    expect(res6[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    expect(res6[0].books).toHaveLength(1);
    expect(res6[0].books[0]).toMatchObject({
      title: 'foo 1',
      price: 123.0,
      priceTaxed: '146.3700',
    });
    expect(res6[0].books[0].tags).toHaveLength(3);
    orm.em.clear();

    // using raw subquery
    const qb7 = orm.em.createQueryBuilder(Author2, 'a');
    qb7
      .select(['*'])
      .leftJoin(qb1.toRaw(), 'sub', { author_id: sql.ref('a.id') })
      .where({ 'sub.title': /^foo/ });
    expect(qb7.getFormattedQuery()).toEqual(
      "select `a`.* from `author2` as `a` left join (select `b`.*, `b`.`price` * 1.19 as `price_taxed` from `book2` as `b` order by `b`.`title` asc limit 1) as `sub` on `sub`.`author_id` = `a`.`id` where `sub`.`title` like 'foo%'",
    );
    const res7 = await qb7.getResult();
    expect(res7).toHaveLength(1);
    expect(res7[0]).toMatchObject({
      name: 'a',
      email: 'e',
    });
    orm.em.clear();
  });

  test('sub-query order-by fields are always fully qualified', () => {
    const expected =
      'select `e0`.*, `books`.`uuid_pk` as `books__uuid_pk`, `books`.`created_at` as `books__created_at`, `books`.`isbn` as `books__isbn`, `books`.`title` as `books__title`, `books`.`price` as `books__price`, `books`.`price` * 1.19 as `books__price_taxed`, `books`.`double` as `books__double`, `books`.`meta` as `books__meta`, `books`.`author_id` as `books__author_id`, `books`.`publisher_id` as `books__publisher_id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` where `e0`.`id` in (select `e0`.`id` from (select `e0`.`id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `e0`.`id` order by min(`e0`.`id`) desc limit 10) as `e0`) order by `e0`.`id` desc';
    const sql = orm.em.createQueryBuilder(Author2).select('*').joinAndSelect('books', 'books').orderBy({ id: QueryOrder.DESC }).limit(10).getFormattedQuery();
    expect(sql).toBe(expected);
  });

  test(`sub-query order-by fields should not include 'as'`, async () => {
    const sql = orm.em
      .createQueryBuilder(Author2)
      .select('*')
      .joinAndSelect('books', 'books')
      .orderBy([{ books: { priceTaxed: QueryOrder.DESC } }, { id: QueryOrder.DESC }])
      .limit(10)
      .getFormattedQuery();
    expect(sql).toBe(
      'select `e0`.*, `books`.`uuid_pk` as `books__uuid_pk`, `books`.`created_at` as `books__created_at`, `books`.`isbn` as `books__isbn`, `books`.`title` as `books__title`, `books`.`price` as `books__price`, `books`.`price` * 1.19 as `books__price_taxed`, `books`.`double` as `books__double`, `books`.`meta` as `books__meta`, `books`.`author_id` as `books__author_id`, `books`.`publisher_id` as `books__publisher_id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` where `e0`.`id` in (select `e0`.`id` from (select `e0`.`id` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `e0`.`id` order by min(`books`.`price` * 1.19) desc, min(`e0`.`id`) desc limit 10) as `e0`) order by `books`.`price` * 1.19 desc, `e0`.`id` desc',
    );
  });

  test(`sub-query group-by fields should not include 'as'`, async () => {
    const sql = orm.em
      .createQueryBuilder(Author2)
      .join('books', 'books')
      .select(['id', 'books.priceTaxed'])
      .groupBy('books.priceTaxed')
      .limit(10)
      .getFormattedQuery();
    expect(sql).toBe(
      'select `e0`.`id`, `books`.`price` * 1.19 as `price_taxed` from `author2` as `e0` inner join `book2` as `books` on `e0`.`id` = `books`.`author_id` group by `books`.`price` * 1.19 limit 10',
    );
  });

  test('from an entity', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.from(Author2);
    expect(qb.getQuery()).toEqual('select `e0`.* from `author2` as `e0`');
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

  test('from an query builder on creation', async () => {
    const qb1 = orm.em.createQueryBuilder(Publisher2);
    const qb2 = orm.em.createQueryBuilder(qb1, 'p');
    expect(qb2.getQuery()).toEqual('select `p`.* from (select `e0`.* from `publisher2` as `e0`) as `p`');
  });

  test('from a query builder with where and order by clauses', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Author2)
      .where({ createdAt: { $lte: new Date() } })
      .orderBy({ createdAt: 'DESC' });
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.from(qb1.clone()).orderBy({ createdAt: 'ASC' });
    expect(qb2.getQuery()).toEqual(
      'select `e1`.* from (select `e0`.* from `author2` as `e0` where `e0`.`created_at` <= ? order by `e0`.`created_at` desc) as `e1` order by `e1`.`created_at` asc',
    );
  });

  test('from a query builder with joins', async () => {
    const qb1 = orm.em
      .createQueryBuilder(Author2)
      .where({ createdAt: { $lte: new Date() } })
      .leftJoin('books2', 'b')
      .orderBy({ 'b.createdAt': 'DESC' });
    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.from(qb1.clone()).orderBy({ 'b.createdAt': 'ASC' });
    expect(qb2.getQuery()).toEqual(
      'select `e1`.* from (select `e0`.* from `author2` as `e0` left join `book2` as `b` on `e0`.`id` = `b`.`author_id` where `e0`.`created_at` <= ? order by `b`.`created_at` desc) as `e1` order by `b`.`created_at` asc',
    );
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

  test('unionAll combines queries with UNION ALL', () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'foo' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'bar' });
    const result = qb1.unionAll(qb2);

    expect(result.getQuery()).toBe(
      '(select `a`.`id` from `author2` as `a` where `a`.`name` = ?) union all (select `a`.`id` from `author2` as `a` where `a`.`name` = ?)',
    );
    expect(result.getParams()).toEqual(['foo', 'bar']);
  });

  test('union combines queries with UNION (dedup)', () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'foo' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'bar' });
    const result = qb1.union(qb2);

    expect(result.getQuery()).toBe(
      '(select `a`.`id` from `author2` as `a` where `a`.`name` = ?) union (select `a`.`id` from `author2` as `a` where `a`.`name` = ?)',
    );
    expect(result.getParams()).toEqual(['foo', 'bar']);
  });

  test('unionAll with multiple branches', () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'a' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'b' });
    const qb3 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'c' });
    const result = qb1.unionAll(qb2, qb3);

    expect(result.getQuery()).toBe(
      '(select `a`.`id` from `author2` as `a` where `a`.`name` = ?)'
      + ' union all (select `a`.`id` from `author2` as `a` where `a`.`name` = ?)'
      + ' union all (select `a`.`id` from `author2` as `a` where `a`.`name` = ?)',
    );
    expect(result.getParams()).toEqual(['a', 'b', 'c']);
  });

  test('unionAll result can be used with $in', () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
    const qb2 = orm.em.createQueryBuilder(Book2, 'b').select('b.author').where({ title: 'foo' });
    const subquery = qb1.unionAll(qb2);

    const qb3 = orm.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: subquery } });
    expect(qb3.getQuery()).toBe(
      'select `a`.* from `author2` as `a` where `a`.`id` in '
      + '((select `b`.`author_id` from `book2` as `b` where `b`.`price` > ?) union all (select `b`.`author_id` from `book2` as `b` where `b`.`title` = ?))',
    );
    expect(qb3.getParams()).toEqual([100, 'foo']);
  });

  test('unionAll with joined relations in branches', () => {
    const qb1 = orm.em.createQueryBuilder(Book2, 'b').select('b.uuid').where({ title: 'foo' });
    const qb2 = orm.em.createQueryBuilder(Book2, 'b').select('b.uuid').where({ author: { name: 'bar' } });
    const subquery = qb1.unionAll(qb2);

    expect(subquery.getQuery()).toMatch(/union all/);
    expect(subquery.getParams()).toEqual(['foo', 'bar']);
  });

  test('unionAll result can be executed with $in', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'a' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ email: 'e' });
    const subquery = qb1.unionAll(qb2);

    const qb3 = orm.em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: subquery } });
    const result = await qb3.execute();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({ name: 'a', email: 'e' });
  });

  test('union result can be executed directly via from()', async () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'a' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'non-existent' });
    const unionQb = qb1.union(qb2);

    const qb3 = orm.em.createQueryBuilder(Author2).from(unionQb).select('*');
    const result = await qb3.execute();
    expect(result.length).toBeGreaterThan(0);
  });

  test('union result getNativeQuery returns a working NativeQueryBuilder', () => {
    const qb1 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'foo' });
    const qb2 = orm.em.createQueryBuilder(Author2, 'a').select('a.id').where({ name: 'bar' });
    const unionQb = qb1.unionAll(qb2);

    const nqb = unionQb.getNativeQuery();
    const { sql, params } = nqb.compile();
    expect(sql).toMatch(/union all/);
    expect(params).toEqual(['foo', 'bar']);
  });
});
