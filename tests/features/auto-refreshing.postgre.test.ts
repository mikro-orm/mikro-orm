import type { MikroORM } from '@mikro-orm/core';
import { LoadStrategy, Logger, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { initORMPostgreSql, mockLogger, wipeDatabasePostgreSql } from '../bootstrap';
import { Author2, Book2, FooBar2, FooBaz2 } from '../entities-sql';

describe('automatic refreshing of already loaded entities', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => orm = await initORMPostgreSql());
  beforeEach(async () => wipeDatabasePostgreSql(orm.em));
  afterAll(async () => orm.close(true));

  async function createEntities() {
    const god = new Author2('God', 'hello@heaven.god');
    god.favouriteAuthor = new Author2('God 2', 'hello2@heaven.god');
    god.favouriteAuthor.age = 21;
    god.age = 999;
    god.identities = ['a', 'b', 'c'];
    const b1 = new Book2('Bible 1', god);
    b1.perex = 'b1 perex';
    b1.price = 123;
    const b2 = new Book2('Bible 2', god);
    b2.perex = 'b2 perex';
    b2.price = 456;
    const b3 = new Book2('Bible 3', god);
    b3.perex = 'b3 perex';
    b3.price = 789;
    await orm.em.fork().persistAndFlush(god);

    return { god };
  }

  test('em.find()', async () => {
    const { god } = await createEntities();

    const r1 = await orm.em.find(Author2, god, { fields: ['id'], populate: ['books'] });
    r1[0].email = 'lol';
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].termsAccepted).toBeUndefined();
    const r2 = await orm.em.find(Author2, god, { populate: ['books'] });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBe(god.name);
    expect(r2[0].termsAccepted).toBe(false);
    expect(r2[0].email).toBe('lol');
    expect(r1[0]).toBe(r2[0]);

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = 'lol', "updated_at" = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' where "id" = 2/);
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('em.find() with relations and joined strategy 1', async () => {
    const { god } = await createEntities();

    const r1 = await orm.em.find(Author2, god, { fields: ['id'] });
    r1[0].email = 'lol@lol.lol';
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].termsAccepted).toBeUndefined();
    const r2 = await orm.em.find(Author2, god, { populate: ['books', 'books.perex'], strategy: LoadStrategy.JOINED });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBe(god.name);
    expect(r2[0].termsAccepted).toBe(false);
    expect(r2[0].email).toBe('lol@lol.lol');
    expect(r2[0].books[0].title).toBe('Bible 1');
    expect(r2[0].books[0].price).toBe('123.00');
    expect(r2[0].books[0].perex).toBe('b1 perex');
    expect(r1[0]).toBe(r2[0]);

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = 'lol@lol\.lol', "updated_at" = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' where "id" = 2/);
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('em.find() with relations and joined strategy 2', async () => {
    const { god } = await createEntities();

    const r1 = await orm.em.find(Author2, god, { fields: ['id', 'books.title', 'books.author'], populate: ['books'], strategy: LoadStrategy.JOINED });
    r1[0].email = 'lol@lol.lol';
    r1[0].books[0].title = 'lol';
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].termsAccepted).toBeUndefined();
    expect(r1[0].books[0].uuid).toBeDefined();
    expect(r1[0].books[0].title).toBeDefined();
    expect(r1[0].books[0].author).toBeDefined();
    expect(r1[0].books[0].price).toBeUndefined();
    expect(r1[0].books[0].perex).toBeUndefined();
    const r2 = await orm.em.find(Author2, god, { populate: ['books', 'books.perex'], strategy: LoadStrategy.JOINED });
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBe(god.name);
    expect(r2[0].termsAccepted).toBe(false);
    expect(r2[0].email).toBe('lol@lol.lol');
    expect(r2[0].books[0].title).toBe('lol');
    expect(r2[0].books[0].price).toBe('123.00');
    expect(r2[0].books[0].perex).toBe('b1 perex');
    expect(r1[0]).toBe(r2[0]);

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = 'lol@lol\.lol', "updated_at" = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' where "id" = 2/);
    expect(mock.mock.calls[2][0]).toMatch(/update "book2" set "title" = 'lol' where "uuid_pk" = '[\w-]{36}'/);
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

  test('em.find() with relations and joined strategy 3', async () => {
    const { god } = await createEntities();

    const r1 = await orm.em.find(Author2, god, { fields: ['id', 'favouriteAuthor.name'], populate: ['favouriteAuthor'], strategy: LoadStrategy.JOINED });
    r1[0].email = 'lol@lol.lol';
    expect(r1).toHaveLength(1);
    expect(r1[0].id).toBe(god.id);
    expect(r1[0].name).toBeUndefined();
    expect(r1[0].termsAccepted).toBeUndefined();
    expect(r1[0].favouriteAuthor!.id).toBeDefined();
    expect(r1[0].favouriteAuthor!.name).toBeDefined();
    expect(r1[0].favouriteAuthor!.age).toBeUndefined();
    r1[0].favouriteAuthor!.name = 'lol';
    console.log(r1[0]);
    console.log((r1[0] as any).__helper.__originalEntityData);
    const r2 = await orm.em.find(Author2, god, { populate: ['favouriteAuthor'], strategy: LoadStrategy.JOINED });
    console.log(r2[0]);
    console.log((r2[0] as any).__helper.__originalEntityData);
    expect(r2).toHaveLength(1);
    expect(r2[0].id).toBe(god.id);
    expect(r2[0].name).toBe(god.name);
    expect(r2[0].termsAccepted).toBe(false);
    expect(r2[0].email).toBe('lol@lol.lol');
    expect(r2[0].favouriteAuthor!.name).toBe('lol');
    expect(r2[0].favouriteAuthor!.age).toBe(21);
    expect(r1[0]).toBe(r2[0]);

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = case when \("id" = 2\) then 'lol@lol\.lol' else "email" end, "updated_at" = case when \("id" = 2\) then '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' when \("id" = 1\) then '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' else "updated_at" end, "name" = case when \("id" = 1\) then 'lol' else "name" end where "id" in \(2, 1\)/);
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('em.findOne()', async () => {
    const { god } = await createEntities();

    const mock = mockLogger(orm);
    const a1 = await orm.em.findOneOrFail(Author2, god, { fields: ['id', 'email'], populate: ['books'] });
    expect(mock).toBeCalledTimes(2);
    expect(a1.id).toBe(god.id);
    expect(a1.email).toBe(god.email);
    a1.email = 'lol';
    expect(a1.name).toBeUndefined();
    expect(a1.termsAccepted).toBeUndefined();
    expect(a1.age).toBeUndefined();
    expect(a1.identities).toBeUndefined();

    // reloading with same fields won't fire the query
    const a11 = await orm.em.findOneOrFail(Author2, god, { fields: ['email'] });
    expect(a11).toBe(a1);
    expect(mock).toBeCalledTimes(2);

    // reloading with additional fields will work without `refresh: true`
    const a12 = await orm.em.findOneOrFail(Author2, god, { fields: ['id', 'age'] });
    expect(a12).toBe(a1);
    expect(a1.age).toBe(999);
    a1.age = 1000;
    expect(mock).toBeCalledTimes(3);

    // reloading without partial loading will work without `refresh: true`
    const a2 = await orm.em.findOneOrFail(Author2, god, { populate: ['books'] });
    expect(mock).toBeCalledTimes(4);
    expect(a2.id).toBe(god.id);
    expect(a2.name).toBe(god.name);
    expect(a2.termsAccepted).toBe(false);
    expect(a2.email).toBe('lol');
    expect(a1).toBe(a2);

    // no query should be fired as the entity was fully loaded before too
    const b11 = await orm.em.findOneOrFail(Book2, god.books[0].uuid, { filters: false });
    expect(mock).toBeCalledTimes(4);
    expect(b11).toBe(a1.books[0]);

    // reloading with additional lazy scalar properties will work without `refresh: true`
    const b12 = await orm.em.findOneOrFail(Book2, god.books[0], { populate: ['perex'], filters: false });
    expect(mock).toBeCalledTimes(5);
    expect(b11).toBe(b12);

    mock.mockReset();
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = 'lol', "age" = 1000, "updated_at" = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' where "id" = 2/);
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('em.findOne() with joined strategy', async () => {
    const { god } = await createEntities();

    const mock = mockLogger(orm);
    const a1 = await orm.em.findOneOrFail(Author2, god, { fields: ['id', 'email'], populate: ['books'], strategy: LoadStrategy.JOINED });
    expect(mock).toBeCalledTimes(1);
    expect(a1.id).toBe(god.id);
    expect(a1.email).toBe(god.email);
    a1.email = 'lol';
    expect(a1.name).toBeUndefined();
    expect(a1.termsAccepted).toBeUndefined();
    expect(a1.age).toBeUndefined();
    expect(a1.identities).toBeUndefined();

    // reloading with same fields won't fire the query
    const a11 = await orm.em.findOneOrFail(Author2, god, { fields: ['email'] });
    expect(a11).toBe(a1);
    expect(mock).toBeCalledTimes(1);

    // reloading with additional fields will work without `refresh: true`
    const a12 = await orm.em.findOneOrFail(Author2, god, { fields: ['id', 'age'] });
    expect(a12).toBe(a1);
    expect(a1.age).toBe(999);
    a1.age = 1000;
    expect(mock).toBeCalledTimes(2);

    // reloading without partial loading will work without `refresh: true`
    const a2 = await orm.em.findOneOrFail(Author2, god, { populate: ['books'], strategy: LoadStrategy.JOINED });
    expect(mock).toBeCalledTimes(3);
    expect(a2.id).toBe(god.id);
    expect(a2.name).toBe(god.name);
    expect(a2.termsAccepted).toBe(false);
    expect(a2.email).toBe('lol');
    expect(a1).toBe(a2);

    // no query should be fired as the entity was fully loaded before too
    const b11 = await orm.em.findOneOrFail(Book2, god.books[0].uuid, { filters: false });
    expect(mock).toBeCalledTimes(3);
    expect(b11).toBe(a1.books[0]);

    // reloading with additional lazy scalar properties will work without `refresh: true`
    const b12 = await orm.em.findOneOrFail(Book2, god.books[0], { populate: ['perex'], filters: false });
    expect(mock).toBeCalledTimes(4);
    expect(b11).toBe(b12);

    mock.mockReset();
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(/update "author2" set "email" = 'lol', "age" = 1000, "updated_at" = '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z' where "id" = 2/);
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('populate OneToOne relation', async () => {
    const bar = FooBar2.create('bar');
    const baz = new FooBaz2('baz');
    bar.baz = baz;
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(FooBar2, { id: bar.id }, { populate: ['baz'] });
    expect(b1.baz).toBeInstanceOf(FooBaz2);
    expect(b1.baz!.id).toBe(baz.id);
    expect(wrap(b1).toJSON()).toMatchObject({ baz: { id: baz.id, bar: bar.id, name: 'baz' } });

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(0);
  });

});
