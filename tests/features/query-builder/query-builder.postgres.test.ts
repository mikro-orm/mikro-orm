import { LockMode, MikroORM, QueryFlag, QueryOrder, raw, sql } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import {
  Address2,
  Author2,
  Book2,
  BookTag2,
  Configuration2,
  FooBar2,
  FooBaz2,
  Publisher2,
  Test2,
} from '../../entities-sql/index.js';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2.js';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22.js';

describe('QueryBuilder - Postgres', () => {
  let pg: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    pg = await MikroORM.init<PostgreSqlDriver>({
      entities: [Author2, Address2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22, Configuration2],
      dbName: `mikro_orm_test_qb_pg_${(Math.random() + 1).toString(36).substring(2)}`,
      driver: PostgreSqlDriver,
      metadataProvider: ReflectMetadataProvider,
    });
    await pg.schema.refresh();
  });

  afterAll(async () => {
    await pg.schema.dropDatabase();
    await pg.close(true);
  });

  test('select with distinctOn', async () => {
    const qb = pg.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*').distinctOn('fb1.id').joinAndSelect('fb1.baz', 'fz').leftJoinAndSelect('fz.bar', 'fb2').where({ 'fz.name': 'baz' }).limit(1);
    const sql =
      'select distinct on ("fb1"."id") "fb1".*, ' +
      '"fz"."id" as "fz__id", "fz"."name" as "fz__name", "fz"."code" as "fz__code", "fz"."version" as "fz__version", ' +
      '"fb2"."id" as "fb2__id", "fb2"."name" as "fb2__name", "fb2"."name with space" as "fb2__name with space", "fb2"."baz_id" as "fb2__baz_id", "fb2"."foo_bar_id" as "fb2__foo_bar_id", "fb2"."version" as "fb2__version", "fb2"."blob" as "fb2__blob", "fb2"."blob2" as "fb2__blob2", "fb2"."array" as "fb2__array", "fb2"."object_property" as "fb2__object_property", (select 123) as "fb2__random", ' +
      '(select 123) as "random" from "foo_bar2" as "fb1" ' +
      'inner join "foo_baz2" as "fz" on "fb1"."baz_id" = "fz"."id" ' +
      'left join "foo_bar2" as "fb2" on "fz"."id" = "fb2"."baz_id" ' +
      'where "fz"."name" = ? ' +
      'limit ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['baz', 1]);
  });

  test('insert with onConflict ignore', async () => {
    const timestamp = new Date();
    const qb = pg.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict()
      .ignore();

    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"',
    );
    expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
  });

  test('insert with onConflict ignore and returning *', async () => {
    const timestamp = new Date();
    const qb = pg.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict()
      .ignore()
      .returning('*');

    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning *',
    );
    expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
  });

  test('insert with onConflict ignore and returning specific fields', async () => {
    const timestamp = new Date();
    const qb = pg.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict()
      .ignore()
      .returning(['id', 'email']);

    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict do nothing returning "id", "email"',
    );
    expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);
  });

  test('select with distinct', async () => {
    const qb = pg.em.createQueryBuilder(FooBar2, 'fb1');
    qb.select('*').distinct().joinAndSelect('fb1.baz', 'fz').leftJoinAndSelect('fz.bar', 'fb2').where({ 'fz.name': 'baz' }).limit(1);
    const sql =
      'select distinct "fb1".*, ' +
      '"fz"."id" as "fz__id", "fz"."name" as "fz__name", "fz"."code" as "fz__code", "fz"."version" as "fz__version", ' +
      '"fb2"."id" as "fb2__id", "fb2"."name" as "fb2__name", "fb2"."name with space" as "fb2__name with space", "fb2"."baz_id" as "fb2__baz_id", "fb2"."foo_bar_id" as "fb2__foo_bar_id", "fb2"."version" as "fb2__version", "fb2"."blob" as "fb2__blob", "fb2"."blob2" as "fb2__blob2", "fb2"."array" as "fb2__array", "fb2"."object_property" as "fb2__object_property", (select 123) as "fb2__random", ' +
      '(select 123) as "random" from "foo_bar2" as "fb1" ' +
      'inner join "foo_baz2" as "fz" on "fb1"."baz_id" = "fz"."id" ' +
      'left join "foo_bar2" as "fb2" on "fz"."id" = "fb2"."baz_id" ' +
      'where "fz"."name" = ? ' +
      'limit ?';
    expect(qb.getQuery()).toEqual(sql);
    expect(qb.getParams()).toEqual(['baz', 1]);
  });

  test('insert with array values', async () => {
    const qb01 = pg.em.createQueryBuilder(FooBar2);
    qb01.insert({ array: [] } as any);
    expect(qb01.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{}') returning "id", "version"`);

    const qb02 = pg.em.createQueryBuilder(FooBar2);
    qb02.insert({ array: [1, 2, 3] } as any);
    expect(qb02.getFormattedQuery()).toEqual(`insert into "foo_bar2" ("array") values ('{1,2,3}') returning "id", "version"`);
  });

  test('$contains operator', async () => {
    const qb = pg.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $contains: 'test' } });
    expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" @> ?');
    expect(qb.getFormattedQuery()).toEqual(`select "p0".* from "publisher2" as "p0" where "p0"."name" @> 'test'`);
    expect(qb.getParams()).toEqual(['test']);
  });

  test('$contained operator', async () => {
    const qb = pg.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $contained: 'test' } });
    expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" <@ ?');
    expect(qb.getParams()).toEqual(['test']);
  });

  test('$overlap operator', async () => {
    const qb = pg.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $overlap: 'test' } });
    expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" && ?');
    expect(qb.getParams()).toEqual(['test']);
  });

  test('$ilike operator', async () => {
    const qb = pg.em.createQueryBuilder(Publisher2);
    qb.select('*').where({ name: { $ilike: 'test' } });
    expect(qb.getQuery()).toEqual('select "p0".* from "publisher2" as "p0" where "p0"."name" ilike ?');
    expect(qb.getParams()).toEqual(['test']);
  });

  test('subquery in where clause', async () => {
    const qb5 = pg.em
      .createQueryBuilder(Book2, 'b')
      .select('b.author')
      .where({ price: { $gt: 100 } });
    const qb6 = pg.em
      .createQueryBuilder(Author2, 'a')
      .select('*')
      .where(raw(`id in (${qb5.getFormattedQuery()})`));
    expect(qb6.getQuery()).toEqual('select "a".* from "author2" as "a" where (id in (select "b"."author_id" from "book2" as "b" where "b"."price" > 100))');
    expect(qb6.getParams()).toEqual([]);

    const qb7 = pg.em
      .createQueryBuilder(Book2, 'b')
      .select('b.author')
      .where({ price: { $gt: 100 } });
    const qb8 = pg.em
      .createQueryBuilder(Author2, 'a')
      .select('*')
      .where({ id: { $in: qb7 } });
    expect(qb8.getQuery()).toEqual('select "a".* from "author2" as "a" where "a"."id" in (select "b"."author_id" from "book2" as "b" where "b"."price" > ?)');
    expect(qb8.getParams()).toEqual([100]);
  });

  test('onConflict with column name', async () => {
    const qb = pg.em.createQueryBuilder(Author2);
    qb.insert({ email: 'ignore@example.com', name: 'John Doe' }).onConflict('email').ignore();
    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("email", "name") values (?, ?) on conflict ("email") do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"',
    );
    expect(qb.getParams()).toEqual(['ignore@example.com', 'John Doe']);
  });

  test('onConflict with merge', async () => {
    const timestamp = new Date();
    const qb = pg.em
      .createQueryBuilder(Author2)
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

    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("created_at", "email", "name", "updated_at") values (?, ?, ?, ?) on conflict ("email") do update set "name" = ?, "updated_at" = ? where "author2"."updated_at" < ? returning "id", "created_at", "updated_at", "age", "terms_accepted"',
    );
    expect(qb.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp, 'John Doe', timestamp, timestamp]);
  });

  test('onConflict with raw fragment', async () => {
    const qb = pg.em
      .createQueryBuilder(Author2)
      .insert({ email: 'ignore@example.com', name: 'John Doe' })
      .onConflict(raw('("email") where "email" is not null'))
      .ignore();
    expect(qb.getQuery()).toEqual(
      'insert into "author2" ("email", "name") values (?, ?) on conflict ("email") where "email" is not null do nothing returning "id", "created_at", "updated_at", "age", "terms_accepted"',
    );
    expect(qb.getParams()).toEqual(['ignore@example.com', 'John Doe']);
  });

  test('json property queries', async () => {
    const qb11 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: 123 } });
    expect(qb11.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 = 123`);

    const qb12 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $eq: 123 } } });
    expect(qb12.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 = 123`);

    const qb13 = pg.em.createQueryBuilder(Book2).where({ meta: { foo: { $lte: 123 } } });
    expect(qb13.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where ("b0"."meta"->>'foo')::float8 <= 123`);
  });

  test('order by json property', async () => {
    const qb14 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { foo: 'asc' } });
    expect(qb14.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->>'foo' asc`);

    const qb15 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { str: 'asc' } } });
    expect(qb15.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->'bar'->>'str' asc`);

    const qb16 = pg.em.createQueryBuilder(Book2).orderBy({ meta: { bar: { num: QueryOrder.DESC } } });
    expect(qb16.getFormattedQuery()).toBe(`select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" order by "b0"."meta"->'bar'->>'num' desc`);
  });

  test('complex condition for json property with update query (GH #2839)', async () => {
    const qb = pg.em
      .createQueryBuilder(Book2)
      .update({ meta: { items: 3 } })
      .where({
        $and: [{ uuid: 'b47f1cca-90ca-11ec-99e0-42010a5d800c' }, { $or: [{ meta: null }, { meta: { $eq: null } }, { meta: { time: { $lt: 1646147306 } } }] }],
      });
    expect(qb.getFormattedQuery()).toBe(
      'update "book2" set "meta" = \'{"items":3}\' ' +
        'where "uuid_pk" = \'b47f1cca-90ca-11ec-99e0-42010a5d800c\' ' +
        'and ("meta" is null ' +
        'or "meta" is null ' +
        'or ("meta"->>\'time\')::float8 < 1646147306)',
    );
  });

  test('array comparison operators', async () => {
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
  });

  test('pessimistic locking', async () => {
    await pg.em.transactional(async em => {
      const qb1 = em.createQueryBuilder(Book2);
      qb1.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_READ);
      expect(qb1.getQuery()).toEqual('select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for share skip locked');

      const qb2 = em.createQueryBuilder(Book2);
      qb2.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_PARTIAL_WRITE);
      expect(qb2.getQuery()).toEqual('select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for update skip locked');

      const qb3 = em.createQueryBuilder(Book2);
      qb3.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_READ_OR_FAIL);
      expect(qb3.getQuery()).toEqual('select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for share nowait');

      const qb4 = em.createQueryBuilder(Book2);
      qb4.select('*').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE_OR_FAIL);
      expect(qb4.getQuery()).toEqual('select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."title" = ? for update nowait');

      const qb5 = em.createQueryBuilder(Book2);
      qb5.select('*').leftJoin('author', 'a').where({ title: 'test 123' }).setLockMode(LockMode.PESSIMISTIC_WRITE, ['book2']);
      expect(qb5.getQuery()).toEqual(
        'select "b0".*, "b0"."price" * 1.19 as "price_taxed" from "book2" as "b0" left join "author2" as "a" on "b0"."author_id" = "a"."id" where "b0"."title" = ? for update of "book2"',
      );
    });
  });

  test('join and select m:n relation with paginate flag (GH #1926)', async () => {
    const qb = pg.em.createQueryBuilder(Book2, 'b');
    qb.select('*').leftJoinAndSelect('b.tags', 't').where({ 't.name': 'tag name' }).setFlag(QueryFlag.PAGINATE).offset(1).limit(20);
    const sql0 =
      'select "b".*, "t"."id" as "t__id", "t"."name" as "t__name", "b"."price" * 1.19 as "price_taxed" ' +
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
  });

  test('select by regexp operator', async () => {
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
  });

  test('query comments', async () => {
    const sql1 = pg.em
      .createQueryBuilder(Author2)
      .comment('test 123')
      .hintComment('test 123')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql1).toBe(`/* test 123 */ select /*+ test 123 */ "a0".* from "author2" as "a0" where "a0"."favourite_book_uuid_pk" in ('1', '2', '3')`);

    const sql2 = pg.em
      .createQueryBuilder(Author2)
      .withSchema('my_schema')
      .comment('test 123')
      .comment('test 456')
      .hintComment('test 123')
      .hintComment('test 456')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql2).toBe(
      `/* test 123 */ /* test 456 */ select /*+ test 123 test 456 */ "a0".* from "my_schema"."author2" as "a0" where "a0"."favourite_book_uuid_pk" in ('1', '2', '3')`,
    );

    const sql3 = pg.em
      .createQueryBuilder(Author2)
      .withSchema('my_schema')
      .update({ name: '...' })
      .comment('test 123')
      .comment('test 456')
      .hintComment('test 123')
      .hintComment('test 456')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql3).toBe(
      `/* test 123 */ /* test 456 */ update /*+ test 123 test 456 */ "my_schema"."author2" set "name" = '...' where "favourite_book_uuid_pk" in ('1', '2', '3')`,
    );
  });

  test('lateral join', async () => {
    const author = await pg.em.insert(Author2, { name: 'a', email: 'e' });
    const t1 = await pg.em.insert(BookTag2, { name: 't1' });
    const t2 = await pg.em.insert(BookTag2, { name: 't2' });
    const t3 = await pg.em.insert(BookTag2, { name: 't3' });
    await pg.em.insert(Book2, { uuid: v4(), title: 'foo 1', author, price: 123, tags: [t1, t2, t3] });
    await pg.em.insert(Book2, { uuid: v4(), title: 'foo 2', author, price: 123, tags: [t1, t2, t3] });

    // simple join with ORM subquery
    const qb1 = pg.em.createQueryBuilder(Book2, 'b').limit(1).orderBy({ title: 1 });
    const qb2 = pg.em
      .createQueryBuilder(Author2, 'a')
      .leftJoinLateral(qb1, 'sub', { author_id: sql.ref('a.id') })
      .select(['*', 'sub.*'])
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual(
      'select "a".*, "sub".* from "author2" as "a" left join lateral (select "b".*, "b"."price" * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "sub"."author_id" = "a"."id" where "sub"."title" like \'foo%\'',
    );
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
    qb3
      .innerJoinLateral(qb1, 'sub', { author_id: sql.ref('a.id') })
      .select(['*', 'sub.*'])
      .where({ 'sub.title': /^foo/ });
    expect(qb2.getFormattedQuery()).toEqual(
      'select "a".*, "sub".* from "author2" as "a" left join lateral (select "b".*, "b"."price" * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "sub"."author_id" = "a"."id" where "sub"."title" like \'foo%\'',
    );
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
    qb4.select(['*']).innerJoinLateralAndSelect(['a.books', qb1], 'sub').leftJoinAndSelect('sub.tags', 't').where({ 'sub.title': /^foo/ });
    expect(qb4.getFormattedQuery()).toEqual(
      'select "a".*, "sub"."uuid_pk" as "sub__uuid_pk", "sub"."created_at" as "sub__created_at", "sub"."isbn" as "sub__isbn", "sub"."title" as "sub__title", "sub"."price" as "sub__price", "sub"."price" * 1.19 as "sub__price_taxed", "sub"."double" as "sub__double", "sub"."meta" as "sub__meta", "sub"."author_id" as "sub__author_id", "sub"."publisher_id" as "sub__publisher_id", "t"."id" as "t__id", "t"."name" as "t__name" from "author2" as "a" inner join lateral (select "b".*, "b"."price" * 1.19 as "price_taxed" from "book2" as "b" order by "b"."title" asc limit 1) as "sub" on "a"."id" = "sub"."author_id" left join "book2_tags" as "b1" on "sub"."uuid_pk" = "b1"."book2_uuid_pk" left join "book_tag2" as "t" on "b1"."book_tag2_id" = "t"."id" where "sub"."title" like \'foo%\'',
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
    pg.em.clear();

    const qb5 = pg.em.createQueryBuilder(Author2, 'a');
    // @ts-expect-error
    expect(() => qb5.leftJoinLateralAndSelect('a.books', 'sub', { author: sql.ref('a.id') })).toThrow('Lateral join can be used only with a sub-query.');
    // @ts-expect-error
    expect(() => qb5.leftJoinLateralAndSelect('a.books', 'sub')).toThrow('Lateral join can be used only with a sub-query.');
    // @ts-expect-error
    expect(() => qb5.leftJoinLateral('a.books', 'sub')).toThrow('Lateral join can be used only with a sub-query.');
    pg.em.clear();
  });
});
