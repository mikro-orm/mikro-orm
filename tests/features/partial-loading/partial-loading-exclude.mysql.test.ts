import type { MikroORM } from '@mikro-orm/core';
import { LoadStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2 } from '../../entities-sql/index.js';
import { initORMMySql, mockLogger } from '../../bootstrap.js';

describe('partial loading via `exclude` (mysql)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', { dbName: 'partial_loading2' }, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => await orm.close(true));

  async function createEntities() {
    const god = new Author2(`God `, `hello@heaven.god`);
    const b1 = orm.em.create(Book2, { title: `Bible 1`, author: god });
    b1.price = 123;
    b1.tags.add(new BookTag2('t1'), new BookTag2('t2'));
    const b2 = orm.em.create(Book2, { title: `Bible 2`, author: god });
    b2.price = 456;
    b2.tags.add(new BookTag2('t3'), new BookTag2('t4'));
    const b3 = orm.em.create(Book2, { title: `Bible 3`, author: god });
    b3.price = 789;
    b3.tags.add(new BookTag2('t5'), new BookTag2('t6'));
    await orm.em.persistAndFlush(god);
    orm.em.clear();

    return god;
  }

  test('exclude option', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    author.born = '1990-03-23';
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a = (await orm.em.findOne(Author2, author, { exclude: ['email', 'born', 'termsAccepted'] }))!;
    expect(a.name).toBe('Jon Snow');
    // @ts-expect-error
    expect(a.email).toBeUndefined();
    // @ts-expect-error
    expect(a.born).toBeUndefined();
    // @ts-expect-error
    expect(a.termsAccepted).toBeUndefined();

    const a1 = orm.em.assign(a, { email: 'e1' });
    expect(a1.name).toBe('Jon Snow');
    expect(a1.email).toBe('e1');
    // @ts-expect-error
    expect(a1.termsAccepted).toBeUndefined();

    const a2 = orm.em.repo(Author2).assign(a, { email: 'e1' });
    expect(a2.name).toBe('Jon Snow');
    expect(a2.email).toBe('e1');
    // @ts-expect-error
    expect(a2.termsAccepted).toBeUndefined();

    const a3 = orm.em.assign(a1, { born: '1990-03-24' });
    expect(a3.name).toBe('Jon Snow');
    expect(a3.email).toBe('e1');
    expect(a3.born).toBe('1990-03-24');
    // @ts-expect-error
    expect(a3.termsAccepted).toBeUndefined();

    // @ts-expect-error
    const a4 = orm.em.repo(Author2).assign(a2, { born: '1990-03-24', asd: true });
    expect(a4.name).toBe('Jon Snow');
    expect(a4.email).toBe('e1');
    expect(a4.born).toBe('1990-03-24');
    // @ts-expect-error
    expect(a4.asd).toBe(true);

    await orm.em.flush();
    orm.em.clear();

    const a5 = (await orm.em.findOne(Author2, author, { exclude: ['email'] }))!;
    expect(a5.name).toBe('Jon Snow');
    // @ts-expect-error
    expect(a5.email).toBeUndefined();
    expect(a5.born).toEqual('1990-03-24');

    const a6 = await orm.em.refresh(a5);
    expect(a6?.email).toBe('e1');
    orm.em.clear();
  });

  test('partial nested loading (1:m)', async () => {
    const god = await createEntities();

    const rr = await orm.em.findOneOrFail(Author2, god, {
      populate: ['books.publisher'],
      exclude: ['email', 'favouriteBook.author', 'favouriteBook.publisher', 'books.title', 'books.publisher.type'],
      disableIdentityMap: true,
    });

    // @ts-expect-error
    const t1 = rr.favouriteBook?.author;
    const t2 = rr.favouriteBook?.title;
    const t3 = rr.favouriteBook?.double;
    const t4 = rr.favouriteBook?.
      // @ts-expect-error
      publisher?.$.name;

    // @ts-expect-error
    const t5 = rr.books.$[0].title;
    const t6 = rr.books.$[0].publisher?.$.name;
    // @ts-expect-error
    const t7 = rr.books.$[0].publisher?.$.type;

    // test working with scalars
    expect(`This is User #${rr.id.toFixed()} with name '${rr.name.substring(0, 3)}'`).toBe(`This is User #1 with name 'God'`);

    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Author2, god, { populate: ['books'], exclude: ['name', 'books.price'], strategy: 'select-in' });
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    // @ts-expect-error
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].books[0].uuid).toBe(god.books[0].uuid);
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`email`, `a0`.`age`, `a0`.`terms_accepted`, `a0`.`optional`, `a0`.`identities`, `a0`.`born`, `a0`.`born_time`, `a0`.`favourite_book_uuid_pk`, `a0`.`favourite_author_id`, `a0`.`identity`, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.`price` * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` from `book2` as `b0` left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` where `b0`.`author_id` is not null and `b0`.`author_id` in (?) order by `b0`.`title` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r0 = await orm.em.find(Author2, god, { populate: ['books'], exclude: ['name', 'books.price'], strategy: 'joined' });
    expect(r0).toHaveLength(1);
    expect(r0[0].id).toBe(god.id);
    // @ts-expect-error
    expect(r0[0].name).toBeUndefined();
    expect(r0[0].books[0].uuid).toBe(god.books[0].uuid);
    expect(r0[0].books[0].title).toBe('Bible 1');
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`email`, `a0`.`age`, `a0`.`terms_accepted`, `a0`.`optional`, `a0`.`identities`, `a0`.`born`, `a0`.`born_time`, `a0`.`favourite_book_uuid_pk`, `a0`.`favourite_author_id`, `a0`.`identity`, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`price` * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a2`.`author_id` as `a2__author_id` from `author2` as `a0` left join `book2` as `b1` on `a0`.`id` = `b1`.`author_id` and `b1`.`author_id` is not null left join `address2` as `a2` on `a0`.`id` = `a2`.`author_id` where `a0`.`id` = ? order by `b1`.`title` asc');
    // @ts-expect-error
    expect(r0[0].books[0].price).toBeUndefined();
    expect(r0[0].books[0].author).toBeDefined();
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();
    mock.mock.calls.length = 0;

    // partial loading with query builder
    const r3 = await orm.em.qb(Author2, 'a')
      .select('id')
      .innerJoinAndSelect('a.books', 'b', {}, ['author', 'title'])
      .where({ id: god.id })
      .orderBy({ 'b.title': 1 })
      .getResult();
    expect(r3).toHaveLength(1);
    expect(r3[0].id).toBe(god.id);
    expect(r3[0].name).toBeUndefined();
    expect(r3[0].books[0].uuid).toBe(god.books[0].uuid);
    expect(r3[0].books[0].title).toBe('Bible 1');
    expect(r3[0].books[0].price).toBeUndefined();
    expect(r3[0].books[0].author).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `a`.`id`, `b`.`uuid_pk` as `b__uuid_pk`, `b`.`author_id` as `b__author_id`, `b`.`title` as `b__title` from `author2` as `a` inner join `book2` as `b` on `a`.`id` = `b`.`author_id` where `a`.`id` = ? order by `b`.`title` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;
  });

  test('partial nested loading (m:1)', async () => {
    const god = await createEntities();
    const b1 = god.books[0];
    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(Book2, b1, {
      exclude: ['price', 'author.name'],
      populate: ['author'],
      filters: false,
      strategy: LoadStrategy.JOINED,
    });
    expect(r1).toHaveLength(1);
    expect(r1[0].uuid).toBe(b1.uuid);
    expect(r1[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].price).toBeUndefined();
    expect(r1[0].author).toBeDefined();
    expect(r1[0].author.id).toBe(god.id);
    // @ts-expect-error
    expect(r1[0].author.name).toBeUndefined();
    expect(r1[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.`price` * 1.19 as `price_taxed`, `a1`.`id` as `a1__id`, `a1`.`created_at` as `a1__created_at`, `a1`.`updated_at` as `a1__updated_at`, `a1`.`email` as `a1__email`, `a1`.`age` as `a1__age`, `a1`.`terms_accepted` as `a1__terms_accepted`, `a1`.`optional` as `a1__optional`, `a1`.`identities` as `a1__identities`, `a1`.`born` as `a1__born`, `a1`.`born_time` as `a1__born_time`, `a1`.`favourite_book_uuid_pk` as `a1__favourite_book_uuid_pk`, `a1`.`favourite_author_id` as `a1__favourite_author_id`, `a1`.`identity` as `a1__identity`, `t2`.`id` as `t2__id` from `book2` as `b0` left join `author2` as `a1` on `b0`.`author_id` = `a1`.`id` left join `test2` as `t2` on `b0`.`uuid_pk` = `t2`.`book_uuid_pk` where `b0`.`uuid_pk` = ?');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(Book2, b1, {
      exclude: ['price', 'author.name'],
      populate: ['author'],
      filters: false,
      strategy: LoadStrategy.SELECT_IN,
    });
    expect(r2).toHaveLength(1);
    expect(r2[0].uuid).toBe(b1.uuid);
    expect(r2[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].price).toBeUndefined();
    expect(r2[0].author).toBeDefined();
    expect(r2[0].author.id).toBe(god.id);
    // @ts-expect-error
    expect(r2[0].author.name).toBeUndefined();
    expect(r2[0].author.email).toBeDefined();
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`uuid_pk`, `b0`.`created_at`, `b0`.`isbn`, `b0`.`title`, `b0`.`double`, `b0`.`meta`, `b0`.`author_id`, `b0`.`publisher_id`, `b0`.`price` * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` from `book2` as `b0` left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` where `b0`.`uuid_pk` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`email`, `a0`.`age`, `a0`.`terms_accepted`, `a0`.`optional`, `a0`.`identities`, `a0`.`born`, `a0`.`born_time`, `a0`.`favourite_book_uuid_pk`, `a0`.`favourite_author_id`, `a0`.`identity`, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`id` in (?)');
    orm.em.clear();
    mock.mock.calls.length = 0;
  });

  test('partial nested loading (m:n)', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(BookTag2, {}, {
      exclude: ['books.author', 'books.price'],
      populate: ['books'],
      filters: false,
      strategy: 'joined',
    });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].price).toBeUndefined();
    // @ts-expect-error
    expect(r1[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`id`, `b0`.`name`, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`price` * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`publisher_id` as `b1__publisher_id` from `book_tag2` as `b0` left join `book2_tags` as `b2` on `b0`.`id` = `b2`.`book_tag2_id` left join `book2` as `b1` on `b2`.`book2_uuid_pk` = `b1`.`uuid_pk` order by `b2`.`order` asc');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.find(BookTag2, { name: 't1' }, {
      exclude: ['books.author', 'books.price'],
      populate: ['books'],
      filters: false,
      strategy: 'select-in',
    });
    expect(r2).toHaveLength(1);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].books[0].price).toBeUndefined();
    // @ts-expect-error
    expect(r2[0].books[0].author).toBeUndefined();
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`id`, `b0`.`name` from `book_tag2` as `b0` where `b0`.`name` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.`uuid_pk`, `b1`.`created_at`, `b1`.`isbn`, `b1`.`title`, `b1`.`double`, `b1`.`meta`, `b1`.`publisher_id`, `b1`.`price` * 1.19 as `price_taxed`, `b0`.`book_tag2_id` as `fk__book_tag2_id`, `b0`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `b2`.`id` as `b2__id` from `book2_tags` as `b0` inner join `book2` as `b1` on `b0`.`book2_uuid_pk` = `b1`.`uuid_pk` left join `test2` as `b2` on `b1`.`uuid_pk` = `b2`.`book_uuid_pk` where `b0`.`book_tag2_id` in (?) order by `b0`.`order` asc');
  });

  test('partial nested loading (m:n -> m:1)', async () => {
    const god = await createEntities();
    const mock = mockLogger(orm, ['query']);

    const r1 = await orm.em.find(BookTag2, {}, {
      exclude: ['books.price', 'books.author.name'],
      populate: ['books.author'],
      filters: false,
      strategy: LoadStrategy.SELECT_IN,
    });
    expect(r1).toHaveLength(6);
    expect(r1[0].name).toBe('t1');
    expect(r1[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(r1[0].books[0].author.id).toBeDefined();
    // @ts-expect-error
    expect(r1[0].books[0].author.name).toBeUndefined();
    expect(r1[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`id`, `b0`.`name` from `book_tag2` as `b0`');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.`uuid_pk`, `b1`.`created_at`, `b1`.`isbn`, `b1`.`title`, `b1`.`double`, `b1`.`meta`, `b1`.`author_id`, `b1`.`publisher_id`, `b1`.`price` * 1.19 as `price_taxed`, `b0`.`book_tag2_id` as `fk__book_tag2_id`, `b0`.`book2_uuid_pk` as `fk__book2_uuid_pk`, `b2`.`id` as `b2__id` from `book2_tags` as `b0` inner join `book2` as `b1` on `b0`.`book2_uuid_pk` = `b1`.`uuid_pk` left join `test2` as `b2` on `b1`.`uuid_pk` = `b2`.`book_uuid_pk` where `b0`.`book_tag2_id` in (?, ?, ?, ?, ?, ?) order by `b0`.`order` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`email`, `a0`.`age`, `a0`.`terms_accepted`, `a0`.`optional`, `a0`.`identities`, `a0`.`born`, `a0`.`born_time`, `a0`.`favourite_book_uuid_pk`, `a0`.`favourite_author_id`, `a0`.`identity`, `a1`.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`id` in (?)');
    orm.em.clear();
    mock.mock.calls.length = 0;

    const r2 = await orm.em.findAll(BookTag2, {
      exclude: ['books.price', 'books.author.name'],
      populate: ['books.author'],
      filters: false,
      strategy: LoadStrategy.JOINED,
    });
    expect(r2).toHaveLength(6);
    expect(r2[0].name).toBe('t1');
    expect(r2[0].books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r2[0].books[0].price).toBeUndefined();
    expect(r2[0].books[0].author).toBeDefined();
    expect(r2[0].books[0].author.id).toBeDefined();
    // @ts-expect-error
    expect(r2[0].books[0].author.name).toBeUndefined();
    expect(r2[0].books[0].author.email).toBe(god.email);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.`id`, `b0`.`name`, `b1`.`uuid_pk` as `b1__uuid_pk`, `b1`.`created_at` as `b1__created_at`, `b1`.`isbn` as `b1__isbn`, `b1`.`title` as `b1__title`, `b1`.`price` * 1.19 as `b1__price_taxed`, `b1`.`double` as `b1__double`, `b1`.`meta` as `b1__meta`, `b1`.`author_id` as `b1__author_id`, `b1`.`publisher_id` as `b1__publisher_id`, `a3`.`id` as `a3__id`, `a3`.`created_at` as `a3__created_at`, `a3`.`updated_at` as `a3__updated_at`, `a3`.`email` as `a3__email`, `a3`.`age` as `a3__age`, `a3`.`terms_accepted` as `a3__terms_accepted`, `a3`.`optional` as `a3__optional`, `a3`.`identities` as `a3__identities`, `a3`.`born` as `a3__born`, `a3`.`born_time` as `a3__born_time`, `a3`.`favourite_book_uuid_pk` as `a3__favourite_book_uuid_pk`, `a3`.`favourite_author_id` as `a3__favourite_author_id`, `a3`.`identity` as `a3__identity` ' +
      'from `book_tag2` as `b0` ' +
      'left join `book2_tags` as `b2` on `b0`.`id` = `b2`.`book_tag2_id` ' +
      'left join `book2` as `b1` on `b2`.`book2_uuid_pk` = `b1`.`uuid_pk` ' +
      'left join `author2` as `a3` on `b1`.`author_id` = `a3`.`id` ' +
      'order by `b2`.`order` asc');
  });

  test('populate partial (joined)', async () => {
    const god = await createEntities();

    const r1 = await orm.em.findOneOrFail(BookTag2, 1, {
      exclude: ['books.price', 'books.author.name'],
      populate: ['books.author'],
      strategy: LoadStrategy.JOINED,
    });
    expect(r1.name).toBe('t1');
    expect(r1.books[0].title).toBe('Bible 1');
    // @ts-expect-error
    expect(r1.books[0].price).toBeUndefined();
    expect(r1.books[0].author).toBeDefined();
    expect(r1.books[0].author.id).toBeDefined();
    // @ts-expect-error
    expect(r1.books[0].author.name).toBeUndefined();
    expect(r1.books[0].author.email).toBe(god.email);

    const r2 = await orm.em.refreshOrFail(r1, { populate: ['*'] });
    expect(r2.name).toBe('t1');
    expect(r2.books[0].title).toBe('Bible 1');
    expect(r2.books[0].price).toBe(123.00);
    expect(r2.books[0].author).toBeDefined();
    expect(r2.books[0].author.id).toBeDefined();
    expect(r2.books[0].author.name).toBe(god.name);
    expect(r2.books[0].author.email).toBe(god.email);

    await expect(orm.em.findAll(BookTag2, { fields: ['books.title'], exclude: ['name'] })).rejects.toThrow(`Cannot combine 'fields' and 'exclude' option.`);
  });

});
