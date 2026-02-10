import { MikroORM, raw, sql, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2, FooParam2, Publisher2, PublisherType, Test2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';
import { performance } from 'node:perf_hooks';

describe('QueryBuilder - Mutations', () => {
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

  test('insert query picks write replica', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    const spy = vi.spyOn(MySqlDriver.prototype, 'getConnection');
    await qb.execute('run');
    expect(spy).toHaveBeenCalledWith('write');
  });

  test('insert query', async () => {
    const qb0 = orm.em.createQueryBuilder(Publisher2);
    // @ts-expect-error testing empty insert generates defaults
    qb0.insert([{}, {}]);
    expect(qb0.getQuery()).toEqual('insert into `publisher2` (`id`) values (?), (?)');
    expect(qb0.getParams()).toEqual([sql`default`, sql`default`]);

    const qb1 = orm.em.createQueryBuilder(Publisher2);
    qb1.insert({ name: 'test 123', type: PublisherType.GLOBAL });
    expect(qb1.getQuery()).toEqual('insert into `publisher2` (`name`, `type`) values (?, ?)');
    expect(qb1.getParams()).toEqual(['test 123', PublisherType.GLOBAL]);

    const qb2 = orm.em.createQueryBuilder(Author2);
    qb2.insert({ name: 'test 123', email: 'e', favouriteBook: '2359', termsAccepted: true });
    expect(qb2.getQuery()).toEqual(
      'insert into `author2` (`name`, `email`, `favourite_book_uuid_pk`, `terms_accepted`) values (?, ?, ?, ?)',
    );
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
    const qb1 = orm.em
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
      });

    expect(qb1.getQuery()).toEqual(
      'insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `name` = ?, `updated_at` = ?',
    );
    expect(qb1.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp, 'John Doe', timestamp]);

    const qb2 = orm.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge();

    expect(qb2.getQuery()).toEqual(
      'insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `created_at` = values(`created_at`), `email` = values(`email`), `name` = values(`name`), `updated_at` = values(`updated_at`)',
    );
    expect(qb2.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb3 = orm.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict('email')
      .merge(['name', 'updatedAt']);

    expect(qb3.getQuery()).toEqual(
      'insert into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?) on duplicate key update `name` = values(`name`), `updated_at` = values(`updated_at`)',
    );
    expect(qb3.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb4 = orm.em
      .createQueryBuilder(Author2)
      .insert({
        createdAt: timestamp,
        email: 'ignore@example.com',
        name: 'John Doe',
        updatedAt: timestamp,
      })
      .onConflict()
      .ignore();

    expect(qb4.getQuery()).toEqual(
      'insert ignore into `author2` (`created_at`, `email`, `name`, `updated_at`) values (?, ?, ?, ?)',
    );
    expect(qb4.getParams()).toEqual([timestamp, 'ignore@example.com', 'John Doe', timestamp]);

    const qb5 = orm.em.createQueryBuilder(Author2).insert({
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
    expect(qb1.getParams()).toEqual([
      'test 1',
      PublisherType.GLOBAL,
      'test 2',
      PublisherType.LOCAL,
      'test 3',
      PublisherType.GLOBAL,
    ]);
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
    expect(qb.getFormattedQuery()).toEqual("update `book2` set `price` = price + 1 where `uuid_pk` = '123'");
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
    expect(qb.getFormattedQuery()).toEqual(
      "update `book2` set `meta` = jsonb_set(payload, '$.{consumed}', 123) where `uuid_pk` = '456'",
    );
  });

  test('raw() with named bindings', async () => {
    const qb = orm.em.createQueryBuilder(Book2);
    const meta = raw(`jsonb_set(payload, '$.{consumed}', :val)`, { val: 123 });
    qb.update({ meta }).where({ uuid: '456' });
    expect(qb.getFormattedQuery()).toEqual(
      "update `book2` set `meta` = jsonb_set(payload, '$.{consumed}', 123) where `uuid_pk` = '456'",
    );
  });

  test('update query with auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ books: { author: 123 } });
    expect(qb.getQuery()).toEqual(
      'update `publisher2` set `name` = ?, `type` = ? ' +
        'where `id` in (select `e0`.`id` from (' +
        'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`author_id` = ?' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123]);
  });

  test('update query with composite keys and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(FooParam2);
    qb.update({ value: 'test 123' }).where({ bar: { baz: 123 } });
    expect(qb.getQuery()).toEqual(
      'update `foo_param2` set `value` = ?, `version` = ? ' +
        'where (`bar_id`, `baz_id`) in (select `e0`.`bar_id`, `e0`.`baz_id` from (' +
        'select distinct `e0`.`bar_id`, `e0`.`baz_id` from `foo_param2` as `e0` inner join `foo_bar2` as `e1` on `e0`.`bar_id` = `e1`.`id` where `e1`.`baz_id` = ?' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual(['test 123', sql`current_timestamp(3)`, 123]);
  });

  test('update query with joins', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2, 'p');
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL })
      .join('p.books', 'b', { title: 'foo' })
      .where({ 'b.author': 123 });
    expect(qb.getQuery()).toEqual(
      'update `publisher2` as `p` ' +
        'inner join `book2` as `b` on `p`.`id` = `b`.`publisher_id` and `b`.`title` = ? ' +
        'set `name` = ?, `type` = ? ' +
        'where `b`.`author_id` = ?',
    );
    expect(qb.getParams()).toEqual(['foo', 'test 123', PublisherType.GLOBAL, 123]);
  });

  test('trying to call qb.update/delete() after qb.where() will throw', async () => {
    const err1 = 'You are trying to call `qb.where().update()`. Calling `qb.update()` before `qb.where()` is required.';
    expect(() =>
      orm.em
        .qb(Publisher2)
        .where({ id: 123, type: PublisherType.LOCAL })
        .update({ name: 'test 123', type: PublisherType.GLOBAL }),
    ).toThrow(err1);
    expect(() =>
      orm.em
        .qb(Book2)
        .where({ uuid: { $in: ['1', '2', '3'] }, author: 123 })
        .update({ author: 321 }),
    ).toThrow(err1);
    expect(() =>
      orm.em
        .qb(FooParam2)
        .where({ bar: { baz: 123 } })
        .update({ value: 'test 123' }),
    ).toThrow(err1);

    expect(() =>
      orm.em
        .qb(Author2)
        .where({
          $or: [{ email: 'value1' }, { name: { $in: ['value2'], $ne: 'value3' } }],
        })
        .update({ name: '123' }),
    ).toThrow(err1);

    const qb2 = orm.em.createQueryBuilder(FooParam2);
    const err2 = 'You are trying to call `qb.where().delete()`. Calling `qb.delete()` before `qb.where()` is required.';
    expect(() => qb2.where({ bar: { baz: 123 } }).delete()).toThrow(err2);
  });

  test('update query with or condition and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({
      $or: [{ books: { author: 123 } }, { books: { title: 'book' } }],
    });
    expect(qb.getQuery()).toEqual(
      'update `publisher2` set `name` = ?, `type` = ? ' +
        'where `id` in (select `e0`.`id` from (' +
        'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where (`e1`.`author_id` = ? or `e1`.`title` = ?)' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual(['test 123', PublisherType.GLOBAL, 123, 'book']);
  });

  test('delete query with auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ books: { author: 123 } });
    expect(qb.getQuery()).toEqual(
      'delete from `publisher2` where `id` in (select `e0`.`id` from (' +
        'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where `e1`.`author_id` = ?' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('delete query with composite keys and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(FooParam2);
    qb.delete({ bar: { baz: 123 } });
    expect(qb.getQuery()).toEqual(
      'delete from `foo_param2` where (`bar_id`, `baz_id`) in (select `e0`.`bar_id`, `e0`.`baz_id` from (' +
        'select distinct `e0`.`bar_id`, `e0`.`baz_id` from `foo_param2` as `e0` inner join `foo_bar2` as `e1` on `e0`.`bar_id` = `e1`.`id` where `e1`.`baz_id` = ?' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual([123]);
  });

  test('delete query with or condition and auto-joining', async () => {
    const qb = orm.em.createQueryBuilder(Publisher2);
    qb.delete({ $or: [{ books: { author: 123 } }, { books: { title: 'book' } }] });
    expect(qb.getQuery()).toEqual(
      'delete from `publisher2` where `id` in (select `e0`.`id` from (' +
        'select distinct `e0`.`id` from `publisher2` as `e0` left join `book2` as `e1` on `e0`.`id` = `e1`.`publisher_id` where (`e1`.`author_id` = ? or `e1`.`title` = ?)' +
        ') as `e0`)',
    );
    expect(qb.getParams()).toEqual([123, 'book']);
  });

  test('update query with entity in data', async () => {
    const qb = orm.em.createQueryBuilder<any>(Publisher2);
    qb.withSchema('test123');
    const test = Test2.create('test');
    test.id = 321;
    qb.update({ name: 'test 123', test }).where({ id: 123, type: PublisherType.LOCAL });
    expect(qb.getQuery()).toEqual(
      'update `test123`.`publisher2` set `name` = ?, `test` = ? where `id` = ? and `type` = ?',
    );
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

  test('delete query with alias', async () => {
    const sql = orm.em
      .createQueryBuilder(Author2, 'u')
      .delete({
        'u.createdAt': {
          $lt: new Date(),
        },
      })
      .getQuery();
    expect(sql).toBe('delete from `author2` as `u` where `u`.`created_at` < ?');
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
      qb.update({ name: `test ${i}`, type: PublisherType.GLOBAL })
        .where({ id: 123 })
        .toQuery();
    }
    const took = performance.now() - start;

    if (took > 200) {
      process.stdout.write(`update test took ${took}\n`);
    }
  });

  test('index hints', async () => {
    const sql1 = orm.em
      .createQueryBuilder(Author2)
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql1).toBe(
      "select `e0`.* from `author2` as `e0` force index(custom_email_index_name) where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')",
    );

    const sql2 = orm.em
      .createQueryBuilder(Author2)
      .withSchema('my_schema')
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql2).toBe(
      "select `e0`.* from `my_schema`.`author2` as `e0` force index(custom_email_index_name) where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')",
    );

    const sql3 = orm.em
      .createQueryBuilder(Author2)
      .withSchema('my_schema')
      .update({ name: '...' })
      .indexHint('force index(custom_email_index_name)')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql3).toBe(
      "update `my_schema`.`author2` force index(custom_email_index_name) set `name` = '...' where `favourite_book_uuid_pk` in ('1', '2', '3')",
    );
  });

  test('query comments', async () => {
    const sql1 = orm.em
      .createQueryBuilder(Author2)
      .comment('test 123')
      .hintComment('test 123')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql1).toBe(
      "/* test 123 */ select /*+ test 123 */ `e0`.* from `author2` as `e0` where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')",
    );

    const sql2 = orm.em
      .createQueryBuilder(Author2)
      .withSchema('my_schema')
      .comment('test 123')
      .comment('test 456')
      .hintComment('test 123')
      .hintComment('test 456')
      .where({ favouriteBook: { $in: ['1', '2', '3'] } })
      .getFormattedQuery();
    expect(sql2).toBe(
      "/* test 123 */ /* test 456 */ select /*+ test 123 test 456 */ `e0`.* from `my_schema`.`author2` as `e0` where `e0`.`favourite_book_uuid_pk` in ('1', '2', '3')",
    );

    const sql3 = orm.em
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
      "/* test 123 */ /* test 456 */ update /*+ test 123 test 456 */ `my_schema`.`author2` set `name` = '...' where `favourite_book_uuid_pk` in ('1', '2', '3')",
    );
  });
});
