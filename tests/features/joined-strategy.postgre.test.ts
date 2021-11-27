import type { MikroORM } from '@mikro-orm/core';
import { LoadStrategy, QueryFlag, QueryOrder, Reference, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AbstractSqlConnection } from '@mikro-orm/postgresql';
import { initORMPostgreSql, mockLogger, wipeDatabasePostgreSql } from '../bootstrap';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2, Publisher2, Test2 } from '../entities-sql';

describe('Joined loading strategy', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => orm = await initORMPostgreSql(LoadStrategy.JOINED));
  beforeEach(async () => wipeDatabasePostgreSql(orm.em));

  afterAll(async () => orm.close(true));

  test('populate OneToMany with joined strategy [findOne()]', async () => {
    const author = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author, 100);
    const fall = new Book2('The Fall', author, 200);
    author.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author, { populate: ['books2', 'following'] });
    expect(a2.books2).toHaveLength(2);
    expect(a2.books2[0].title).toBe('The Fall');
    expect(a2.books2[0].price).toBe('200.00');
    expect(a2.books2[0].priceTaxed).toBe('238.0000');
    expect(a2.books2[1].title).toBe('The Stranger');
    expect(a2.books2[1].price).toBe('100.00');
    expect(a2.books2[1].priceTaxed).toBe('119.0000');
  });

  test('populate OneToMany with joined strategy [find()]', async () => {
    const a1 = new Author2('Albert Camus 1', 'albert.camus1@email.com');
    a1.books2.add(new Book2('The Stranger 1', a1, 100), new Book2('The Fall 1', a1, 200));
    const a2 = new Author2('Albert Camus 2', 'albert.camus2@email.com');
    a2.books2.add(new Book2('The Stranger 2', a2, 300), new Book2('The Fall 2', a2, 400));
    const a3 = new Author2('Albert Camus 3', 'albert.camus3@email.com');
    a3.books2.add(new Book2('The Stranger 3', a3, 500), new Book2('The Fall 3', a3, 600));
    await orm.em.persistAndFlush([a1, a2, a3]);
    orm.em.clear();

    const ret = await orm.em.find(Author2, {}, { populate: ['books2', 'following'], orderBy: { email: 'asc' } });
    expect(ret).toHaveLength(3);
    expect(ret[0].books2).toHaveLength(2);
    expect(ret[0].books2[0].title).toEqual('The Fall 1');
    expect(ret[0].books2[0].priceTaxed).toBe('238.0000');
    expect(ret[0].books2[1].title).toEqual('The Stranger 1');
    expect(ret[0].books2[1].priceTaxed).toBe('119.0000');
    expect(ret[1].books2).toHaveLength(2);
    expect(ret[1].books2[0].title).toEqual('The Fall 2');
    expect(ret[1].books2[0].priceTaxed).toBe('476.0000');
    expect(ret[1].books2[1].title).toEqual('The Stranger 2');
    expect(ret[1].books2[1].priceTaxed).toBe('357.0000');
    expect(ret[2].books2).toHaveLength(2);
    expect(ret[2].books2[0].title).toEqual('The Fall 3');
    expect(ret[2].books2[0].priceTaxed).toBe('714.0000');
    expect(ret[2].books2[1].title).toEqual('The Stranger 3');
    expect(ret[2].books2[1].priceTaxed).toBe('595.0000');
  });

  test('populate ManyToOne with joined strategy [findOne()]', async () => {
    const author = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author);
    const fall = new Book2('The Fall', author);
    author.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(Book2, stranger, { populate: ['author'] });
    expect(b1.title).toEqual('The Stranger');
    expect(b1.author.name).toEqual('Albert Camus');
  });

  test('populate ManyToOne with joined strategy [find()]', async () => {
    const a1 = new Author2('Albert Camus 1', 'albert.camus1@email.com');
    a1.books2.add(new Book2('The Stranger 1', a1), new Book2('The Fall 1', a1));
    const a2 = new Author2('Albert Camus 2', 'albert.camus2@email.com');
    a2.books2.add(new Book2('The Stranger 2', a2), new Book2('The Fall 2', a2));
    const a3 = new Author2('Albert Camus 3', 'albert.camus3@email.com');
    a3.books2.add(new Book2('The Stranger 3', a3), new Book2('The Fall 3', a3));
    await orm.em.persistAndFlush([a1, a2, a3]);
    orm.em.clear();

    const books = await orm.em.find(Book2, {}, { populate: ['author'] });
    expect(books).toHaveLength(6);
    expect(books[0].title).toBe('The Stranger 1');
    expect(books[0].author.name).toBe('Albert Camus 1');
    expect(books[2].title).toBe('The Stranger 2');
    expect(books[2].author.name).toBe('Albert Camus 2');
    expect(books[4].title).toBe('The Stranger 3');
    expect(books[4].author.name).toBe('Albert Camus 3');
  });

  test('should only fire one query [findOne()]', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2, 100);
    const fall = new Book2('The Fall', author2, 200);
    author2.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: ['books2.perex'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."perex" as "b1__perex", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: ['books2'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: ['books'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: ['books.perex'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."perex" as "b1__perex", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');
  });

  test('should only fire one query [find()]', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2, 100);
    const fall = new Book2('The Fall', author2, 200);
    author2.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    await orm.em.find(Author2, { id: author2.id }, { populate: ['books2.perex'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."perex" as "b1__perex", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.find(Author2, { id: author2.id }, { populate: ['books2'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.find(Author2, { id: author2.id }, { populate: ['books'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    await orm.em.find(Author2, { id: author2.id }, { populate: ['books.perex'] });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "a0"."id", "a0"."created_at", "a0"."updated_at", "a0"."name", "a0"."email", "a0"."age", "a0"."terms_accepted", "a0"."optional", "a0"."identities", "a0"."born", "a0"."born_time", "a0"."favourite_book_uuid_pk", "a0"."favourite_author_id", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."perex" as "b1__perex", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id" ' +
      'from "author2" as "a0" ' +
      'left join "book2" as "b1" on "a0"."id" = "b1"."author_id" ' +
      'where "a0"."id" = $1');
  });

  test('populate ManyToMany with joined strategy', async () => {
    const author = new Author2('name', 'email');
    const b1 = new Book2('b1', author);
    const b2 = new Book2('b2', author);
    const b3 = new Book2('b3', author);
    const b4 = new Book2('b4', author);
    const b5 = new Book2('b5', author);
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    b1.tags.add(tag1, tag3);
    b2.tags.add(tag1, tag2, tag5);
    b3.tags.add(tag5);
    b4.tags.add(tag2, tag4, tag5);
    b5.tags.add(tag5);

    author.books.add(b1, b2, b3, b4, b5);
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    mock.mock.calls.length = 0;
    const books = await orm.em.find(Book2, {}, { populate: ['tags'], strategy: LoadStrategy.JOINED, orderBy: { tags: { name: 'desc' } } });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."title", "b0"."price", "b0".price * 1.19 as "price_taxed", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", ' +
      '"t1"."id" as "t1__id", "t1"."name" as "t1__name", "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "book2_tags" as "b2" on "b0"."uuid_pk" = "b2"."book2_uuid_pk" ' +
      'left join "book_tag2" as "t1" on "b2"."book_tag2_id" = "t1"."id" ' +
      'where "b0"."author_id" is not null ' +
      'order by "t1"."name" desc');

    expect(books.map(b => b.title)).toEqual(['b4', 'b2', 'b1', 'b5', 'b3']);
    expect(books[0].tags.getItems().map(t => t.name)).toEqual(['strange', 'sexy', 'funny']);
    expect(books[1].tags.getItems().map(t => t.name)).toEqual(['silly', 'sexy', 'funny']);
    expect(books[2].tags.getItems().map(t => t.name)).toEqual(['silly', 'sick']);
    expect(books[3].tags.getItems().map(t => t.name)).toEqual(['sexy']);
    expect(books[4].tags.getItems().map(t => t.name)).toEqual(['sexy']);
  });

  test('can populate all related entities', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2, 100);
    const fall = new Book2('The Fall', author2, 200);
    author2.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: true, strategy: LoadStrategy.SELECT_IN });
    expect(a2.books2).toHaveLength(2);
    expect(a2.books).toHaveLength(2);
  });

  test('when related records not exist it still returns the root entity', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, { id: author2.id }, { populate: ['books2'] });
    expect(a2).toHaveProperty('id');
    expect(a2.books2).toHaveLength(0);
  });

  test('when the root entity does not exist', async () => {
    const a2 = await orm.em.findOne(Author2, 1, { populate: ['books2'] });
    expect(a2).toBeNull();
  });

  test('when populating only a single relation via em.populate', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2, 100);
    const fall = new Book2('The Fall', author2, 200);
    author2.books2.add(stranger, fall);
    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, 1);
    await orm.em.populate(a2, ['books2']);
    expect(a2.books2).toHaveLength(2);
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const connMock = jest.spyOn(AbstractSqlConnection.prototype, 'execute');
    const b1 = await orm.em.findOneOrFail(FooBar2, { id: bar.id }, { populate: ['baz'] });
    expect(connMock).toBeCalledTimes(1);
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({ baz: { id: baz.id, bar: bar.id, name: 'baz' } });
  });

  test('populate OneToOne relation on inverse side', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // autoJoinOneToOneOwner: false
    const b0 = await orm.em.findOneOrFail(FooBaz2, { id: baz.id });
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch('select "f0".* from "foo_baz2" as "f0" where "f0"."id" = $1 limit $2');
    expect(b0.bar).toBeUndefined();
    orm.em.clear();

    const b1 = (await orm.em.findOne(FooBaz2, { id: baz.id }, { populate: ['bar'], strategy: LoadStrategy.JOINED }))!;
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[1][0]).toMatch('select "f0"."id", "f0"."name", "f0"."version", ' +
      '"b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random", "b1"."id" as "bar_id" ' +
      'from "foo_baz2" as "f0" ' +
      'left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" ' +
      'where "f0"."id" = $1');
    expect(b1.bar).toBeInstanceOf(FooBar2);
    expect(b1.bar!.id).toBe(bar.id);
    expect(b1.bar!.random).toBe(123);
    expect(b1.bar!.lazyRandom).toBeUndefined();
    expect(wrap(b1).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, { populate: ['bar'] });
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[2][0]).toMatch('select "f0"."id", "f0"."name", "f0"."version", ' +
      '"b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random", "b1"."id" as "bar_id" ' +
      'from "foo_baz2" as "f0" ' +
      'left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" ' +
      'where "b1"."id" = $1');
    expect(b2.bar).toBeInstanceOf(FooBar2);
    expect(b2.bar!.id).toBe(bar.id);
    expect(b2.bar!.random).toBe(123);
    expect(b2.bar!.lazyRandom).toBeUndefined();
    expect(wrap(b2).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });
    orm.em.clear();

    const b3 = await orm.em.findOneOrFail(FooBaz2, { bar: bar.id }, { populate: ['bar.lazyRandom'] });
    expect(mock.mock.calls).toHaveLength(4);
    expect(mock.mock.calls[3][0]).toMatch('select "f0"."id", "f0"."name", "f0"."version", ' +
      '"b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random", (select 456) as "b1__lazy_random", "b1"."id" as "bar_id" ' +
      'from "foo_baz2" as "f0" ' +
      'left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" ' +
      'where "b1"."id" = $1');
    expect(b3.bar).toBeInstanceOf(FooBar2);
    expect(b3.bar!.id).toBe(bar.id);
    expect(b3.bar!.random).toBe(123);
    expect(b3.bar!.lazyRandom).toBe(456);
    expect(wrap(b3).toJSON()).toMatchObject({ bar: { id: bar.id, baz: baz.id, name: 'bar' } });

    // paginate with joined loading strategy
    await orm.em.find(FooBaz2, { id: baz.id }, { populate: ['bar'], strategy: LoadStrategy.JOINED, flags: [QueryFlag.PAGINATE], limit: 3, offset: 10 });
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[4][0]).toMatch('select "f0"."id", "f0"."name", "f0"."version", ' +
      '"b1"."id" as "b1__id", "b1"."name" as "b1__name", "b1"."name with space" as "b1__name with space", "b1"."baz_id" as "b1__baz_id", "b1"."foo_bar_id" as "b1__foo_bar_id", "b1"."version" as "b1__version", "b1"."blob" as "b1__blob", "b1"."array" as "b1__array", "b1"."object_property" as "b1__object_property", (select 123) as "b1__random", "b1"."id" as "bar_id" ' +
      'from "foo_baz2" as "f0" ' +
      'left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" ' +
      'where "f0"."id" in (' +
      'select "f0"."id" from (' +
      'select "f0"."id" from "foo_baz2" as "f0" ' +
      'left join "foo_bar2" as "b1" on "f0"."id" = "b1"."baz_id" ' +
      'where "f0"."id" = $1 group by "f0"."id" limit $2 offset $3) as "f0")');
  });

  test('nested populating', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    book1.publisher = wrap(new Publisher2('B1 publisher')).toReference();
    book1.publisher.unwrap().tests.add(Test2.create('t11'), Test2.create('t12'));
    book2.publisher = wrap(new Publisher2('B2 publisher')).toReference();
    book2.publisher.unwrap().tests.add(Test2.create('t21'), Test2.create('t22'));
    book3.publisher = wrap(new Publisher2('B3 publisher')).toReference();
    book3.publisher.unwrap().tests.add(Test2.create('t31'), Test2.create('t32'));
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    const repo = orm.em.getRepository(BookTag2);

    orm.em.clear();
    const mock = mockLogger(orm, ['query']);

    const tags = await repo.findAll({
      populate: ['books.author', 'books.publisher.tests'],
      orderBy: { name: 'asc', books: { publisher: { tests: { name: 'asc' } } } }, // TODO should be implicit as we have fixed order there
      strategy: LoadStrategy.JOINED,
    });
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."id", "b0"."name", ' +
      '"b1"."uuid_pk" as "b1__uuid_pk", "b1"."created_at" as "b1__created_at", "b1"."title" as "b1__title", "b1"."price" as "b1__price", "b1".price * 1.19 as "b1__price_taxed", "b1"."double" as "b1__double", "b1"."meta" as "b1__meta", "b1"."author_id" as "b1__author_id", "b1"."publisher_id" as "b1__publisher_id", ' +
      '"a3"."id" as "a3__id", "a3"."created_at" as "a3__created_at", "a3"."updated_at" as "a3__updated_at", "a3"."name" as "a3__name", "a3"."email" as "a3__email", "a3"."age" as "a3__age", "a3"."terms_accepted" as "a3__terms_accepted", "a3"."optional" as "a3__optional", "a3"."identities" as "a3__identities", "a3"."born" as "a3__born", "a3"."born_time" as "a3__born_time", "a3"."favourite_book_uuid_pk" as "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" as "a3__favourite_author_id", ' +
      '"p4"."id" as "p4__id", "p4"."name" as "p4__name", "p4"."type" as "p4__type", "p4"."type2" as "p4__type2", "p4"."enum1" as "p4__enum1", "p4"."enum2" as "p4__enum2", "p4"."enum3" as "p4__enum3", "p4"."enum4" as "p4__enum4", "p4"."enum5" as "p4__enum5", ' +
      '"t5"."id" as "t5__id", "t5"."name" as "t5__name", "t5"."book_uuid_pk" as "t5__book_uuid_pk", "t5"."parent_id" as "t5__parent_id", "t5"."version" as "t5__version" ' +
      'from "book_tag2" as "b0" ' +
      'left join "book2_tags" as "b2" on "b0"."id" = "b2"."book_tag2_id" ' +
      'left join "book2" as "b1" on "b2"."book2_uuid_pk" = "b1"."uuid_pk" ' +
      'left join "author2" as "a3" on "b1"."author_id" = "a3"."id" ' +
      'left join "publisher2" as "p4" on "b1"."publisher_id" = "p4"."id" ' +
      'left join "publisher2_tests" as "p6" on "p4"."id" = "p6"."publisher2_id" ' +
      'left join "test2" as "t5" on "p6"."test2_id" = "t5"."id" ' +
      'order by "b0"."name" asc, "t5"."name" asc');

    expect(tags.length).toBe(5);
    expect(tags[0]).toBeInstanceOf(BookTag2);
    expect(tags[0].books.isInitialized()).toBe(true);
    expect(tags[0].books.count()).toBe(2);
    expect(wrap(tags[0].books[0]).isInitialized()).toBe(true);
    expect(tags[0].books[0].author).toBeInstanceOf(Author2);
    expect(wrap(tags[0].books[0].author).isInitialized()).toBe(true);
    expect(tags[0].books[0].author.name).toBe('Jon Snow');
    expect(tags[0].books[0].publisher).toBeInstanceOf(Reference);
    expect(tags[0].books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(wrap(tags[0].books[0].publisher).isInitialized()).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(tags[0].books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(tags[0].books[0].publisher!.unwrap().tests[0].name).toBe('t21');
    expect(tags[0].books[0].publisher!.unwrap().tests[1].name).toBe('t22');

    orm.em.clear();
    const books = await orm.em.find(Book2, {}, {
      populate: ['publisher.tests', 'author'],
      orderBy: { title: QueryOrder.ASC },
    });
    expect(books.length).toBe(3);
    expect(books[0]).toBeInstanceOf(Book2);
    expect(wrap(books[0]).isInitialized()).toBe(true);
    expect(books[0].author).toBeInstanceOf(Author2);
    expect(wrap(books[0].author).isInitialized()).toBe(true);
    expect(books[0].author.name).toBe('Jon Snow');
    expect(books[0].publisher).toBeInstanceOf(Reference);
    expect(books[0].publisher!.unwrap()).toBeInstanceOf(Publisher2);
    expect(books[0].publisher!.isInitialized()).toBe(true);
    expect(books[0].publisher!.unwrap().tests.isInitialized(true)).toBe(true);
    expect(books[0].publisher!.unwrap().tests.count()).toBe(2);
    expect(books[0].publisher!.unwrap().tests[0].name).toBe('t11');
    expect(books[0].publisher!.unwrap().tests[1].name).toBe('t12');
  });

  test('handles nested joinedLoads that map to the same entity', async () => {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const t1 = Test2.create('t1');
    t1.book = book1;
    const t2 = Test2.create('t2');
    t2.book = book2;
    const t3 = Test2.create('t3');
    t3.book = book3;
    author.books.add(book1, book2, book3);
    await orm.em.persistAndFlush([author, t1, t2, t3]);
    author.favouriteBook = book3;
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['perex', 'author'] });
    expect(res1).toHaveLength(3);
    expect(res1[0].test).toBeUndefined();
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."title", "b0"."perex", "b0"."price", "b0".price * 1.19 as "price_taxed", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", ' +
      '"a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'where "b0"."author_id" is not null and "a1"."name" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(Book2, { author: { favouriteBook: { author: { name: 'Jon Snow' } } } }, { populate: ['perex', 'author.favouriteBook.author'] });
    expect(res2).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."title", "b0"."perex", "b0"."price", "b0".price * 1.19 as "price_taxed", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", ' +
      '"a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", ' +
      '"f2"."uuid_pk" as "f2__uuid_pk", "f2"."created_at" as "f2__created_at", "f2"."title" as "f2__title", "f2"."price" as "f2__price", "f2".price * 1.19 as "f2__price_taxed", "f2"."double" as "f2__double", "f2"."meta" as "f2__meta", "f2"."author_id" as "f2__author_id", "f2"."publisher_id" as "f2__publisher_id", ' +
      '"a3"."id" as "a3__id", "a3"."created_at" as "a3__created_at", "a3"."updated_at" as "a3__updated_at", "a3"."name" as "a3__name", "a3"."email" as "a3__email", "a3"."age" as "a3__age", "a3"."terms_accepted" as "a3__terms_accepted", "a3"."optional" as "a3__optional", "a3"."identities" as "a3__identities", "a3"."born" as "a3__born", "a3"."born_time" as "a3__born_time", "a3"."favourite_book_uuid_pk" as "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" as "a3__favourite_author_id", "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "f2" on "a1"."favourite_book_uuid_pk" = "f2"."uuid_pk" ' +
      'left join "author2" as "a3" on "f2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res3 = await orm.em.find(Book2, { author: { favouriteBook: book3 } }, { populate: ['perex'] });
    expect(res3).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0".*, "b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" ' +
      'left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'where "b0"."author_id" is not null and "a1"."favourite_book_uuid_pk" = $1');

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(Book2, { author: { favouriteBook: { $or: [{ author: { name: 'Jon Snow' } }] } } }, { populate: ['perex', 'author.favouriteBook.author'] });
    expect(res4).toHaveLength(3);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."title", "b0"."perex", "b0"."price", "b0".price * 1.19 as "price_taxed", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", ' +
      '"a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", ' +
      '"f2"."uuid_pk" as "f2__uuid_pk", "f2"."created_at" as "f2__created_at", "f2"."title" as "f2__title", "f2"."price" as "f2__price", "f2".price * 1.19 as "f2__price_taxed", "f2"."double" as "f2__double", "f2"."meta" as "f2__meta", "f2"."author_id" as "f2__author_id", "f2"."publisher_id" as "f2__publisher_id", ' +
      '"a3"."id" as "a3__id", "a3"."created_at" as "a3__created_at", "a3"."updated_at" as "a3__updated_at", "a3"."name" as "a3__name", "a3"."email" as "a3__email", "a3"."age" as "a3__age", "a3"."terms_accepted" as "a3__terms_accepted", "a3"."optional" as "a3__optional", "a3"."identities" as "a3__identities", "a3"."born" as "a3__born", "a3"."born_time" as "a3__born_time", "a3"."favourite_book_uuid_pk" as "a3__favourite_book_uuid_pk", "a3"."favourite_author_id" as "a3__favourite_author_id", ' +
      '"b0".price * 1.19 as "price_taxed" ' +
      'from "book2" as "b0" left join "author2" as "a1" on "b0"."author_id" = "a1"."id" ' +
      'left join "book2" as "f2" on "a1"."favourite_book_uuid_pk" = "f2"."uuid_pk" ' +
      'left join "author2" as "a3" on "f2"."author_id" = "a3"."id" ' +
      'where "b0"."author_id" is not null and "a3"."name" = $1');
  });

});
