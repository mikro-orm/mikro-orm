import type { MikroORM } from '@mikro-orm/core';
import { wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { Author, Book, BookTag, Publisher } from '../../entities/index.js';
import { initORMMongo, mockLogger } from '../../bootstrap.js';

describe('result cache (mongo)', () => {

  let orm: MikroORM<MongoDriver>;

  async function createBooksWithTags() {
    const author = new Author('Jon Snow', 'snow@wall.st');
    const book1 = new Book('My Life on The Wall, part 1', author);
    const book2 = new Book('My Life on The Wall, part 2', author);
    const book3 = new Book('My Life on The Wall, part 3', author);
    const publisher = new Publisher();
    book1.publisher = wrap(publisher).toReference();
    book2.publisher = wrap(publisher).toReference();
    book3.publisher = wrap(publisher).toReference();
    const tag1 = new BookTag('silly');
    const tag2 = new BookTag('funny');
    const tag3 = new BookTag('sick');
    const tag4 = new BookTag('strange');
    const tag5 = new BookTag('sexy');
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);
    await orm.em.persistAndFlush([book1, book2, book3]);
    orm.em.clear();

    return author;
  }

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => orm.close(true));

  test('result caching (find)', async () => {
    const a = await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    vi.useFakeTimers();

    const res1 = await orm.em.find(Book, { author: a.id }, { populate: ['author', 'tags', 'publisher'], cache: 50 });
    expect(mock.mock.calls).toHaveLength(4);
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res2 = await orm.em.find(Book, { author: a.id }, { populate: ['author', 'tags', 'publisher'], cache: 50 });
    expect(mock.mock.calls).toHaveLength(4); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res2.map(e => wrap(e).toObject()));
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res3 = await orm.em.find(Book, { author: a.id }, { populate: ['author', 'tags', 'publisher'], cache: 50 });
    expect(mock.mock.calls).toHaveLength(4); // cache hit, no new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res3.map(e => wrap(e).toObject()));
    orm.em.clear();

    vi.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await orm.em.find(Book, { author: a.id }, { populate: ['author', 'tags', 'publisher'], cache: 50 });
    expect(mock.mock.calls).toHaveLength(8); // cache miss, new query fired
    expect(res1.map(e => wrap(e).toObject())).toEqual(res4.map(e => wrap(e).toObject()));

    vi.useRealTimers();
  });

  test('result caching (findOne)', async () => {
    const a = await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    vi.useFakeTimers();

    const call = () => orm.em.findOneOrFail(Book, {
      author: a.id,
    }, {
      populate: ['author', 'tags'],
      cache: ['abc', 50],
    });

    const res1 = await call();
    expect(mock.mock.calls).toHaveLength(3);
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res2 = await call();
    expect(mock.mock.calls).toHaveLength(3); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res2).toObject());
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res3 = await call();
    expect(mock.mock.calls).toHaveLength(3); // cache hit, no new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res3).toObject());
    orm.em.clear();

    vi.advanceTimersByTime(1); // wait for cache to expire

    const res4 = await call();
    expect(mock.mock.calls).toHaveLength(6); // cache miss, new query fired
    expect(wrap(res1).toObject()).toEqual(wrap(res4).toObject());

    vi.advanceTimersByTime(10);

    const res5 = await call();
    expect(mock.mock.calls).toHaveLength(6); // cache hit
    expect(wrap(res1).toObject()).toEqual(wrap(res5).toObject());

    vi.advanceTimersByTime(10);

    // clear key
    await orm.em.clearCache('abc');
    orm.em.clear();

    vi.advanceTimersByTime(10);

    const res6 = await call();
    expect(mock.mock.calls).toHaveLength(9); // cache miss as we just cleared the key
    expect(wrap(res1).toObject()).toEqual(wrap(res6).toObject());

    vi.useRealTimers();
  });

  test('result caching (count)', async () => {
    const a = await createBooksWithTags();

    const mock = mockLogger(orm, ['query']);
    vi.useFakeTimers();

    const res1 = await orm.em.count(Book, { author: a.id }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1);
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res2 = await orm.em.count(Book, { author: a.id }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res2);
    orm.em.clear();

    vi.advanceTimersByTime(25);

    const res3 = await orm.em.count(Book, { author: a.id }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res1).toEqual(res3);
    orm.em.clear();

    vi.advanceTimersByTime(1);

    const res4 = await orm.em.count(Book, { author: a.id }, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(2); // cache miss, new query fired
    expect(res1).toEqual(res4);

    vi.useRealTimers();
  });

});
