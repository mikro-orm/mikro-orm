import { MikroORM, LockMode, ArrayCollection, ref, ValidationError, wrap } from '@mikro-orm/mongodb';

import { Author, Book, BookTag, Publisher, Test } from './entities';
import { initORMMongo } from './bootstrap';
import FooBar from './entities/FooBar';

describe('EntityManagerMongo2', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('isConnected()', async () => {
    expect(await orm.isConnected()).toBe(true);
    expect(await orm.checkConnection()).toEqual({
      ok: true,
    });
    await orm.close(true);
    expect(await orm.isConnected()).toBe(false);
    expect(await orm.checkConnection()).toMatchObject({
      ok: false,
      error: expect.any(Error),
      reason: 'Client must be connected before running operations',
    });
    await orm.connect();
    expect(await orm.isConnected()).toBe(true);
    expect(await orm.checkConnection()).toEqual({
      ok: true,
    });

    const commandMock = jest
      .spyOn(orm.config.getDriver().getConnection().getDb(), 'command')
      .mockReturnValue(Promise.resolve({ error: 'boom!' }));
    expect(await orm.isConnected()).toBe(false);
    expect(await orm.checkConnection()).toEqual({
      ok: false,
      reason: 'Ping reply does not feature "ok" property, or it evaluates to "false"',
    });
    expect(commandMock).toHaveBeenCalledTimes(2);
    commandMock.mockRestore();
    await orm.close(true);
  });

  test('loaded references and collections', async () => {
    const pub = new Publisher('Publisher 123');
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.publisher = wrap(pub).toReference();
    bible.tags.add(new BookTag('t1'), new BookTag('t2'), new BookTag('t3'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const book0 = await orm.em.findOne(Book, { author: { books: { publisher: ['1', '2'] } } }, { populate: ['publisher', 'tags'] });
    expect(book0).toBeNull();

    const book1 = await orm.em.findOneOrFail(Book, bible, { populate: ['*'] });
    expect(book1.publisher!.$.name).toBe('Publisher 123');
    expect(book1.tags.$[0].name).toBe('t1');
    expect(book1.tags.$[1].name).toBe('t2');
    expect(book1.tags.$[2].name).toBe('t3');
    // type safe `populate: ['*']`
    expect(book1.tags.$[0].books.$[0].tags.$[0].books.$[0].tags.$[0].name).toBe('t1');
    orm.em.clear();

    const book2 = await orm.em.findOneOrFail(Book, bible, {});
    // @ts-expect-error
    expect(book2.publisher!.$.name).toBeUndefined();
    // @ts-expect-error
    expect(book2.tags.$[0].name).toBeUndefined();
    orm.em.clear();
    // @ts-expect-error base entity helpers and other functions are excluded
    await expect(() => orm.em.findOneOrFail(Book, bible, { populate: 'populate' })).rejects.toThrow("Entity 'Book' does not have property 'populate'");

    const books = await orm.em.find(Book, { id: bible.id }, {
      populate: ['publisher.books.publisher'],
      fields: ['*', 'publisher.name'],
    });
    expect(books[0].publisher!.get().books.get()[0].publisher!.$.name).toBe('Publisher 123');
    expect(books[0].publisher!.$
      // @ts-expect-error
      .type).toBeUndefined();

    const book5 = await orm.em.findOneOrFail(Book, bible, { populate: ['publisher', 'tags', 'perex'] });
    expect(book5.publisher!.$.name).toBe('Publisher 123');
    expect(book5.tags.$[0].name).toBe('t1');

    const pub2 = orm.em.create(Publisher, { name: 'asd' });
    const wrapped0 = ref(pub2);
    // @ts-expect-error
    expect(wrapped0.books).toBeUndefined();
    book5.publisher = wrapped0;
  });

  test('loadCount with m:n relationships', async () => {
    let bible = new Book('Bible');
    bible.author = new Author('a', 'b');
    bible.tags.add(new BookTag('t1'), new BookTag('t2'), new BookTag('t3'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    bible = await orm.em.findOneOrFail(Book, bible.id);
    await expect(bible.tags.loadCount()).resolves.toEqual(3);
    const tag1 = await orm.em.findOneOrFail(BookTag, { name: 't1' });
    await expect(tag1.books.loadCount()).resolves.toEqual(1);
    bible.tags.removeAll();
    await expect(bible.tags.loadCount()).resolves.toEqual(0);
    await expect(tag1.books.loadCount()).resolves.toEqual(1);
  });

  test('required fields validation', async () => {
    const jon = new Author('Jon', undefined as any);
    await expect(orm.em.persistAndFlush(jon)).rejects.toThrow(`Value for Author.email is required, 'undefined' found`);
  });

  test('Loaded type does not remove optionality', async () => {
    const b = await orm.em.find(Book, {}, { populate: ['publisher'] });
    // @ts-expect-error publisher can be null
    const p1 = b[0]?.publisher.$.name;
    const p2 = b[0]?.publisher?.$.name;
  });

  test('partial loading of collections', async () => {
    const author = orm.em.create(Author, { name: 'Jon Snow', email: 'snow@wall.st' });

    for (let i = 1; i <= 15; i++) {
      const book = orm.em.create(Book, { author, title: `book ${('' + i).padStart(2, '0')}` });

      for (let j = 1; j <= 15; j++) {
        const tag1 = orm.em.create(BookTag, { name: `tag ${('' + i).padStart(2, '0')}-${('' + j).padStart(2, '0')}` });
        book.tags.add(tag1);
      }
    }

    await orm.em.persist(author).flush();
    orm.em.clear();

    const a = await orm.em.findOneOrFail(Author, author);
    const books = await a.books.matching({ limit: 5, offset: 10, orderBy: { title: 'asc' } });
    expect(books).toHaveLength(5);
    expect(a.books.getItems(false)).not.toHaveLength(5);
    expect(books.map(b => b.title)).toEqual(['book 11', 'book 12', 'book 13', 'book 14', 'book 15']);

    const tags = await books[0].tags.matching({ limit: 5, offset: 5, orderBy: { name: 'asc' }, store: true });
    expect(tags).toHaveLength(5);
    expect(books[0].tags).toHaveLength(5);
    expect(tags.map(t => t.name)).toEqual(['tag 11-06', 'tag 11-07', 'tag 11-08', 'tag 11-09', 'tag 11-10']);
    expect(() => books[0].tags.add(orm.em.create(BookTag, { name: 'new' }))).toThrow('You cannot modify collection Book.tags as it is marked as readonly.');
    expect(wrap(books[0]).toObject()).toMatchObject({
      tags: books[0].tags.getItems().map(t => ({ name: t.name })),
    });

    const [book11, ...rest] = await tags[0].books.matching({ where: { title: 'book 11' } });
    expect(book11.title).toBe('book 11');
    expect(rest).toHaveLength(0);

    orm.em.addFilter('testFilter', { name: 'tag 11-08' }, BookTag, false);
    const filteredTags = await books[0].tags.matching({ filters: { testFilter: true } });
    expect(filteredTags).toHaveLength(1);
    expect(filteredTags[0].name).toBe('tag 11-08');
  });

  test('loadCount to get the number of entries without initializing the collection (GH issue #949)', async () => {
    let author = orm.em.create(Author, { name: 'Jon Doe', email: 'doe-jon@wall.st' });
    orm.em.create(Book, { title: 'bo1', author });
    // Entity not managed yet
    await expect(author.books.loadCount()).rejects.toThrow(ValidationError);
    await orm.em.persistAndFlush(author);

    const reloadedBook = await author.books.loadCount();
    expect(reloadedBook).toBe(1);

    // Adding new items
    const laterRemoved = orm.em.create(Book, { title: 'bo2', author });
    author.books.add(laterRemoved, orm.em.create(Book, { title: 'bo3', author }));
    const threeItms = await author.books.loadCount();
    expect(threeItms).toEqual(3);

    // Force refresh
    expect(await author.books.loadCount(true)).toEqual(3); // triggers auto flush
    // Testing array collection implementation
    await orm.em.flush();
    orm.em.clear();

    // Updates when removing an item
    author = (await orm.em.findOneOrFail(Author, author.id));
    expect(await author.books.loadCount()).toEqual(3);
    await author.books.init();
    author.books.remove(author.books[0]);
    expect(await author.books.loadCount()).toEqual(2);
    expect(await author.books.loadCount(true)).toEqual(2); // triggers auto flush
    await orm.em.flush();
    orm.em.clear();

    // Resets the counter when hydrating
    author = (await orm.em.findOneOrFail(Author, author.id));
    await author.books.loadCount();
    author.books.hydrate([]);
    expect(await author.books.loadCount()).toEqual(0);
    expect(await author.books.loadCount(true)).toEqual(2);

    const coll = new ArrayCollection(author);
    expect(await coll.loadCount()).toEqual(0);

    // n:m relations
    let taggedBook = orm.em.create(Book, { title: 'FullyTagged', author });
    await orm.em.persistAndFlush(taggedBook);
    const tags = [orm.em.create(BookTag, { name: 'science-fiction' }), orm.em.create(BookTag, { name: 'adventure' }), orm.em.create(BookTag, { name: 'horror' })] as const;
    taggedBook.tags.add(...tags);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(3); // with mongo m:n owners this works based on the collection state
    await orm.em.flush();
    orm.em.clear();

    taggedBook = await orm.em.findOneOrFail(Book, taggedBook.id);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length);
    expect(taggedBook.tags.isInitialized()).toBe(true); // mongo m:n owner is always (partially) initialized
    await taggedBook.tags.init();
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length);
    const removing  = taggedBook.tags[0];
    taggedBook.tags.remove(removing);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length - 1);
    await expect(taggedBook.tags.loadCount(true)).resolves.toEqual(tags.length - 1); // with mongo m:n owners this works based on the collection state
    await orm.em.flush();
    orm.em.clear();

    taggedBook = await orm.em.findOneOrFail(Book, taggedBook.id);
    await expect(taggedBook.tags.loadCount()).resolves.toEqual(tags.length - 1);
  });

  test('loadCount with unidirectional m:n (GH issue #1608)', async () => {
    const publisher = orm.em.create(Publisher, { name: 'pub' });
    const t1 = orm.em.create(Test, { name: 't1' });
    const t2 = orm.em.create(Test, { name: 't2' });
    const t3 = orm.em.create(Test, { name: 't3' });
    await orm.em.persist([t1, t2, t3]).flush();
    publisher.tests.add(t2, t1, t3);
    await orm.em.persistAndFlush(publisher);
    orm.em.clear();

    let ent = await orm.em.findOneOrFail(Publisher, publisher.id);
    // eager loaded tests are type safe as we use `EagerProps` symbol
    await expect(ent.tests.$.loadCount()).resolves.toBe(3);
    await ent.tests.init();
    await expect(ent.tests.$.loadCount()).resolves.toBe(3);
    orm.em.clear();

    ent = await orm.em.findOneOrFail(Publisher, publisher.id, { populate: ['tests'] as const });
    await expect(ent.tests.loadCount()).resolves.toBe(3);
    await ent.tests.init();
    await expect(ent.tests.loadCount()).resolves.toBe(3);
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates2]', async () => {
    const test = new Test();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persistAndFlush(test);
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testMultipleFlushesDoIncrementalUpdates]', async () => {
    const test = new Test();

    for (let i = 0; i < 5; i++) {
      test.name = 'test' + i;
      await orm.em.persistAndFlush(test);
      expect(typeof test.version).toBe('number');
      expect(test.version).toBe(i + 1);
    }
  });

  test('findOne supports optimistic locking [testStandardFailureThrowsException]', async () => {
    const test = new Test();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    expect(typeof test.version).toBe('number');
    expect(test.version).toBe(1);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test, test.id);
    await orm.em.nativeUpdate(Test, { id: test.id }, { name: 'Changed!' }); // simulate concurrent update
    test2!.name = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe(`The optimistic lock on entity Test failed`);
      expect((e as ValidationError).getEntity()).toBe(test2);
    }
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const proxy = orm.em.getReference(Test, test.id);
    await orm.em.lock(proxy, LockMode.OPTIMISTIC, 1);
    expect(wrap(proxy).isInitialized()).toBe(true);
  });

  test('findOne supports optimistic locking [versioned proxy]', async () => {
    const test = new Test();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const test2 = await orm.em.findOne(Test, test.id);
    await orm.em.lock(test2!, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [testOptimisticTimestampLockFailureThrowsException]', async () => {
    const bar = FooBar.create('Testing');
    expect(bar.version).toBeUndefined();
    await orm.em.persistAndFlush(bar);
    expect(bar.version).toBeInstanceOf(Date);
    orm.em.clear();

    const bar2 = (await orm.em.findOne(FooBar, bar.id))!;
    expect(bar2.version).toBeInstanceOf(Date);

    try {
      // Try to lock the record with an older timestamp and it should throw an exception
      const expectedVersionExpired = new Date(+bar2.version - 3600);
      await orm.em.lock(bar2, LockMode.OPTIMISTIC, expectedVersionExpired);
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect((e as ValidationError).getEntity()).toBe(bar2);
    }
  });

  test('findOne supports optimistic locking [unversioned entity]', async () => {
    const author = new Author('name', 'email');
    await orm.em.persistAndFlush(author);
    await expect(orm.em.lock(author, LockMode.OPTIMISTIC)).rejects.toThrow('Cannot obtain optimistic lock on unversioned entity Author');
  });

  test('findOne supports optimistic locking [versioned entity]', async () => {
    const test = new Test();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await orm.em.lock(test, LockMode.OPTIMISTIC, test.version);
  });

  test('findOne supports optimistic locking [version mismatch]', async () => {
    const test = new Test();
    test.name = 'test';
    await orm.em.persistAndFlush(test);
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC, test.version + 1)).rejects.toThrow('The optimistic lock failed, version 2 was expected, but is actually 1');
  });

  test('findOne supports optimistic locking [testLockUnmanagedEntityThrowsException]', async () => {
    const test = new Test();
    test.name = 'test';
    await expect(orm.em.lock(test, LockMode.OPTIMISTIC)).rejects.toThrow('Entity Test is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()');
  });

  test('batch updates increments version field (optimistic locking)', async () => {
    const tests = [
      new Test({ name: 't1' }),
      new Test({ name: 't2' }),
      new Test({ name: 't3' }),
    ];
    await orm.em.persistAndFlush(tests);
    expect(tests.map(t => t.version)).toEqual([1, 1, 1]);
    tests.forEach(t => t.name += ' changed!');
    await orm.em.flush();
    expect(tests.map(t => t.version)).toEqual([2, 2, 2]);
  });

  afterAll(async () => orm.close(true));

});
