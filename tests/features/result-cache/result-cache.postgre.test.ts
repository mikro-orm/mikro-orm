import type { MikroORM } from '@mikro-orm/core';
import { wrap, LoadStrategy, serialize } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Author2, Book2, BookTag2, Publisher2 } from '../../entities-sql';
import { initORMPostgreSql, mockLogger } from '../../bootstrap';

describe('result cache (postgres)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  async function createBooksWithTags() {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('My Life on The Wall, part 1', author);
    const book2 = new Book2('My Life on The Wall, part 2', author);
    const book3 = new Book2('My Life on The Wall, part 3', author);
    const publisher = new Publisher2();
    book1.publisher = wrap(publisher).toReference();
    book2.publisher = wrap(publisher).toReference();
    book3.publisher = wrap(publisher).toReference();
    const tag1 = new BookTag2('silly');
    const tag2 = new BookTag2('funny');
    const tag3 = new BookTag2('sick');
    const tag4 = new BookTag2('strange');
    const tag5 = new BookTag2('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();
  }

  beforeAll(async () => orm = await initORMPostgreSql());
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('result caching (find)', async () => {
    await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 100, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res2 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 100, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res2.map(e => wrap(e).toObject()));
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res3 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 100, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res3.map(e => wrap(e).toObject()));
    orm.em.clear();

    jest.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], cache: 100, strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res4.map(e => wrap(e).toObject()));

    jest.useRealTimers();
  });

  test('result caching (global, find)', async () => {
    await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    orm.config.get('resultCache').global = 100;
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const res1 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res2 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res2.map(e => wrap(e).toObject()));
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res3 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res3.map(e => wrap(e).toObject()));
    orm.em.clear();

    jest.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await orm.em.find(Book2, { author: { name: 'Jon Snow' } }, { populate: ['author', 'tags', 'publisher'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res4.map(e => wrap(e).toObject()));

    orm.config.get('resultCache').global = undefined;

    jest.useRealTimers();
  });

  test('result caching (findOne)', async () => {
    await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    const call = () => orm.em.findOneOrFail(Book2, {
      author: { name: 'Jon Snow' },
    }, {
      populate: ['author', 'tags'],
      cache: ['abc', 100],
      strategy: LoadStrategy.JOINED,
    });
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const res1 = await call();
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res2 = await call();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res2).toObject());
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res3 = await call();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res3).toObject());
    orm.em.clear();

    jest.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await call();
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res4).toObject());

    jest.advanceTimersByTime(50);

    const res5 = await call();
    expect(mock.mock.calls).toHaveLength(2); // cache hit
    expect(wrap(res1).toObject()).toEqual(wrap(res5).toObject());

    jest.advanceTimersByTime(50);

    // clear key
    await orm.em.clearCache('abc');
    orm.em.clear();
    const res6 = await call();
    expect(mock.mock.calls).toHaveLength(3); // cache miss as we just cleared the key
    expect(wrap(res1).toObject()).toEqual(wrap(res6).toObject());

    jest.useRealTimers();
  });

  test('result caching (count)', async () => {
    await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const res1 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 100 });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res2 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 100 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res2);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res3 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 100 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res3);
    orm.em.clear();

    jest.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await orm.em.count(Book2, { author: { name: 'Jon Snow' } }, { cache: 100 });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1).toEqual(res4);

    jest.useRealTimers();
  });

  test('result caching (query builder)', async () => {
    await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const res1 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(100).getResultList();
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res2 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(100).getResultList();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(serialize(res1)).toEqual(serialize(res2));
    orm.em.clear();

    jest.advanceTimersByTime(50);

    const res3 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache(100).getResultList();
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(serialize(res1)).toEqual(serialize(res3));
    orm.em.clear();

    jest.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await orm.em.createQueryBuilder(Book2).where({ author: { name: 'Jon Snow' } }).cache().getResultList();
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(serialize(res1)).toEqual(serialize(res4));

    jest.useRealTimers();
  });

});
