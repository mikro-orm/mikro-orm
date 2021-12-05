import type { MikroORM } from '@mikro-orm/core';
import { FlushMode } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { initORMPostgreSql, mockLogger, wipeDatabasePostgreSql } from '../bootstrap';
import { Author2, Book2 } from '../entities-sql';

describe('automatic flushing when querying for overlapping entities via em.find/One', () => {

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

  test('em.find() triggers auto-flush', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    // querying for author will trigger auto-flush if we have new author persisted
    const a1 = new Author2('A1', 'a1@example.com');
    orm.em.persist(a1);
    const r1 = await orm.em.find(Author2, {});
    expect(mock).toBeCalledTimes(4);
    expect(r1).toHaveLength(3);
    mock.mockReset();

    // querying author won't trigger auto-flush if we have new book
    const b4 = new Book2('b4', a1, 444);
    orm.em.persist(b4);
    const r2 = await orm.em.find(Author2, {});
    expect(mock).toBeCalledTimes(1);
    expect(r2).toHaveLength(3);
    mock.mockReset();

    // but querying for book will trigger auto-flush
    const r3 = await orm.em.find(Book2, {});
    expect(mock).toBeCalledTimes(4);
    expect(r3).toHaveLength(4);
  });

  test('changes to managed entities are detected automatically', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.find(Book2, {});
    expect(books).toHaveLength(3);
    books[0].price = 1000;

    const ret = await Promise.all(books.map(async () => {
      return orm.em.find(Book2, { price: { $gt: 500 } });
    }));
    expect(ret[0]).toHaveLength(2);
    expect(ret[1]).toHaveLength(2);
    expect(ret[2]).toHaveLength(2);
    expect(mock.mock.calls).toHaveLength(7);
  });

  test('em.fork() supports flushMode option', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const em = orm.em.fork({ flushMode: FlushMode.COMMIT });
    const books = await em.find(Book2, {});
    expect(books).toHaveLength(3);
    books[0].price = 1000;

    const ret = await Promise.all(books.map(async () => {
      return em.find(Book2, { price: { $gt: 500 } });
    }));
    expect(ret[0]).toHaveLength(1);
    expect(ret[1]).toHaveLength(1);
    expect(ret[2]).toHaveLength(1);
    expect(mock.mock.calls).toHaveLength(4);
  });

  test('em.transactional() supports flushMode option', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    await orm.em.transactional(async () => {
      const books = await orm.em.find(Book2, {});
      expect(books).toHaveLength(3);
      books[0].price = 1000;

      const ret = await Promise.all(books.map(async () => {
        return orm.em.find(Book2, { price: { $gt: 500 } });
      }));
      expect(ret[0]).toHaveLength(1);
      expect(ret[1]).toHaveLength(1);
      expect(ret[2]).toHaveLength(1);
    }, { flushMode: FlushMode.COMMIT });

    // update will be still triggered at the end of transaction, so as the last query before `commit`
    expect(mock.mock.calls).toHaveLength(7);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select');
    expect(mock.mock.calls[2][0]).toMatch('select');
    expect(mock.mock.calls[3][0]).toMatch('select');
    expect(mock.mock.calls[4][0]).toMatch('select');
    expect(mock.mock.calls[5][0]).toMatch('update');
    expect(mock.mock.calls[6][0]).toMatch('commit');
  });

  test('QB triggers auto-flushing', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.createQueryBuilder(Book2).select('*');
    expect(books).toHaveLength(3);
    books[0].price = 1000;

    const ret = await Promise.all(books.map(async () => {
      return orm.em.qb(Book2).select('*').where({ price: { $gt: 500 } });
    }));
    expect(ret[0]).toHaveLength(2);
    expect(ret[1]).toHaveLength(2);
    expect(ret[2]).toHaveLength(2);
    expect(mock.mock.calls).toHaveLength(7);
  });

  test('em.find() supports `FindOptions.flushMode` to allow disabling auto-flush for given query', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.find(Book2, {});
    expect(books).toHaveLength(3);
    books[0].price = 1000;

    const ret = await Promise.all(books.map(async () => {
      return orm.em.find(Book2, { price: { $gt: 500 } }, { flushMode: FlushMode.COMMIT });
    }));
    expect(ret[0]).toHaveLength(1);
    expect(ret[1]).toHaveLength(1);
    expect(ret[2]).toHaveLength(1);
    expect(mock.mock.calls).toHaveLength(4);
  });

  test('QB supports `setFlushMode()` to allow disabling auto-flush for given query', async () => {
    await createEntities();
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.qb(Book2).select('*');
    expect(books).toHaveLength(3);
    books[0].price = 1000;

    const ret = await Promise.all(books.map(async () => {
      return orm.em.qb(Book2).select('*').where({ price: { $gt: 500 } }).setFlushMode(FlushMode.COMMIT);
    }));
    expect(ret[0]).toHaveLength(1);
    expect(ret[1]).toHaveLength(1);
    expect(ret[2]).toHaveLength(1);
    expect(mock.mock.calls).toHaveLength(4);
  });

  test('performance', async () => {
    const fork = orm.em.fork();

    for (let i = 1; i <= 300; i++) {
      const god = new Author2('God', `hello-${i}@heaven.god`);
      god.favouriteAuthor = new Author2('God 2', `hello2-${i}@heaven.god`);
      god.favouriteAuthor.age = 21;
      god.age = 999;
      god.identities = ['a', 'b', 'c'];
      const b1 = new Book2(`Bible 1-${i}`, god);
      b1.perex = `b1-${i} perex`;
      b1.price = 123;
      const b2 = new Book2(`Bible 2-${i}`, god);
      b2.perex = `b2-${i} perex`;
      b2.price = 456;
      const b3 = new Book2(`Bible 3-${i}`, god);
      b3.perex = `b3-${i} perex`;
      b3.price = 789;
      fork.persist(god);
    }

    await fork.flush();
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.find(Book2, {});
    expect(books).toHaveLength(900);
    books[0].price = 1000;

    const ret = await Promise.all(books.slice(0, 3).map(async () => {
      return orm.em.find(Book2, { price: { $gt: 500 } });
    }));
    expect(ret[0]).toHaveLength(301);
    expect(ret[1]).toHaveLength(301);
    expect(ret[2]).toHaveLength(301);
    expect(mock.mock.calls).toHaveLength(7);
  });

  test.todo('em.find() triggers auto-flush when STI entity changed');

});
