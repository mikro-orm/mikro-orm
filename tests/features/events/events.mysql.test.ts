import type { MikroORM } from '@mikro-orm/core';
import { EventType, LoadStrategy, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Book2, BookTag2, Publisher2 } from '../../entities-sql';
import { initORMMySql } from '../../bootstrap';
import { Author2Subscriber } from '../../subscribers/Author2Subscriber';
import { EverythingSubscriber } from '../../subscribers/EverythingSubscriber';
import { FlushSubscriber } from '../../subscribers/FlushSubscriber';
import { Test2Subscriber } from '../../subscribers/Test2Subscriber';
import { ManualAuthor2Subscriber } from '../../subscribers/ManualAuthor2Subscriber';

describe('events (mysql)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql(undefined, undefined, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterEach(() => {
    Author2Subscriber.log.length = 0;
    EverythingSubscriber.log.length = 0;
    FlushSubscriber.log.length = 0;
    Test2Subscriber.log.length = 0;
  });
  afterAll(async () => orm.close(true));

  async function createBooksWithTags() {
    const author = new Author2('Jon Snow', 'snow@wall.st');
    expect(wrap(author, true).__onLoadFired).toBeUndefined();
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
    await orm.em.persistAndFlush(author);
    expect(wrap(author, true).__onLoadFired).toBeUndefined();
    orm.em.clear();
  }

  test('hooks', async () => {
    expect(Author2Subscriber.log).toEqual([]);
    Author2.beforeDestroyCalled = 0;
    Author2.afterDestroyCalled = 0;
    const author = new Author2('Jon Snow', 'snow@wall.st');
    expect(author.id).toBeUndefined();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();
    expect(author.hookParams).toHaveLength(0);

    await orm.em.persistAndFlush(author);
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');
    expect(author.hookParams[0].em).toBe(orm.em);
    expect(author.hookParams[0].changeSet).toMatchObject({ entity: author, type: 'create', payload: { name: 'Jon Snow' } });

    author.name = 'John Snow';
    await orm.em.persistAndFlush(author);
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');
    expect(author.hookParams[2].em).toBe(orm.em);
    expect(author.hookParams[2].changeSet).toMatchObject({ entity: author, type: 'update', payload: { name: 'John Snow' }, originalEntity: { name: 'Jon Snow' } });

    expect(Author2.beforeDestroyCalled).toBe(0);
    expect(Author2.afterDestroyCalled).toBe(0);
    await orm.em.removeAndFlush(author);
    expect(Author2.beforeDestroyCalled).toBe(1);
    expect(Author2.afterDestroyCalled).toBe(1);

    const author2 = new Author2('Johny Cash', 'johny@cash.com');
    await orm.em.persistAndFlush(author2);
    await orm.em.removeAndFlush(author2);
    expect(Author2.beforeDestroyCalled).toBe(2);
    expect(Author2.afterDestroyCalled).toBe(2);

    expect(Author2Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['beforeUpdate', 'Author2'],
      ['afterUpdate', 'Author2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
      ['beforeCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
    ]);
  });

  test('subscribers', async () => {
    expect(Author2Subscriber.log).toEqual([]);
    expect(EverythingSubscriber.log).toEqual([]);
    expect(FlushSubscriber.log).toEqual([]);

    const pub = new Publisher2('Publisher2');
    await orm.em.persistAndFlush(pub);
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(pub).toReference();
    const bible2 = new Book2('Bible pt. 2', god);
    bible2.publisher = wrap(pub).toReference();
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    bible3.publisher = wrap(pub).toReference();
    await orm.em.persistAndFlush([bible, bible2, bible3]);

    god.name = 'John Snow';
    bible2.title = '123';
    await orm.em.flush();

    orm.em.remove(bible);
    orm.em.remove(bible2);
    orm.em.remove(god);
    await orm.em.flush();

    expect(Author2Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeCreate', 'Author2'],
      ['beforeCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['beforeUpdate', 'Author2'],
      ['afterUpdate', 'Author2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
    ]);

    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeCreate', 'Publisher2'],
      ['afterCreate', 'Publisher2'],
      ['beforeCreate', 'Author2'],
      ['beforeCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['beforeCreate', 'Book2'],
      ['beforeCreate', 'Book2'],
      ['beforeCreate', 'Book2'],
      ['afterCreate', 'Book2'],
      ['afterCreate', 'Book2'],
      ['afterCreate', 'Book2'],
      ['beforeUpdate', 'Author2'],
      ['afterUpdate', 'Author2'],
      ['beforeUpdate', 'Book2'],
      ['afterUpdate', 'Book2'],
      ['beforeUpdate', 'Book2'],
      ['afterUpdate', 'Book2'],
      ['beforeDelete', 'Book2'],
      ['beforeDelete', 'Book2'],
      ['afterDelete', 'Book2'],
      ['afterDelete', 'Book2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
      ['beforeDelete', 'Publisher2'],
      ['afterDelete', 'Publisher2'],
    ]);

    expect(FlushSubscriber.log.map(l => [l[0], Object.keys(l[1])])).toEqual([
      ['beforeFlush', ['em', 'uow']],
      ['onFlush', ['em', 'uow']],
      ['afterFlush', ['em', 'uow']],
      ['beforeFlush', ['em', 'uow']],
      ['onFlush', ['em', 'uow']],
      ['afterFlush', ['em', 'uow']],
      ['beforeFlush', ['em', 'uow']],
      ['onFlush', ['em', 'uow']],
      ['afterFlush', ['em', 'uow']],
      ['beforeFlush', ['em', 'uow']],
      ['onFlush', ['em', 'uow']],
      ['afterFlush', ['em', 'uow']],
    ]);
  });

  test('onLoad event', async () => {
    await createBooksWithTags();
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad)).toEqual([]);

    const books1 = await orm.em.fork().find(Book2, {});
    expect(books1).toHaveLength(3);
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad)).toEqual([
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
    ]);
    EverythingSubscriber.log.length = 0;

    const authors1 = await orm.em.fork().find(Author2, {});
    expect(authors1).toHaveLength(1);
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad)).toEqual([
      ['onLoad', 'Author2'],
    ]);
    EverythingSubscriber.log.length = 0;

    const authors2 = await orm.em.fork().find(Author2, {}, { populate: ['books'] });
    expect(authors2).toHaveLength(1);
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad)).toEqual([
      ['onLoad', 'Author2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
    ]);
    EverythingSubscriber.log.length = 0;

    const authors3 = await orm.em.fork().find(Author2, {}, { populate: true });
    expect(authors3).toHaveLength(1);
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad)).toEqual([
      ['onLoad', 'Author2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Publisher2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
    ]);
    EverythingSubscriber.log.length = 0;

    const authors4 = await orm.em.fork().find(Author2, {}, { populate: ['books.tags'], strategy: LoadStrategy.JOINED });
    expect(authors4).toHaveLength(1);
    expect(wrap(authors4[0], true).__onLoadFired).toBe(true);
    expect(EverythingSubscriber.log.map(l => [l[0], l[1].entity.constructor.name]).filter(a => a[0] === EventType.onLoad).sort()).toEqual([
      ['onLoad', 'Author2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'Book2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
      ['onLoad', 'BookTag2'],
    ]);
  });

  test('subscribers in forked entity managers', async () => {
    expect(Author2Subscriber.log).toEqual([]);
    expect(ManualAuthor2Subscriber.log).toEqual([]);

    const pub = new Publisher2('Publisher2');
    await orm.em.persistAndFlush(pub);
    const god = new Author2('God', 'hello@heaven.god');
    const bible = new Book2('Bible', god);
    bible.publisher = wrap(pub).toReference();
    const bible2 = new Book2('Bible pt. 2', god);
    bible2.publisher = wrap(pub).toReference();
    const bible3 = new Book2('Bible pt. 3', new Author2('Lol', 'lol@lol.lol'));
    bible3.publisher = wrap(pub).toReference();
    await orm.em.persistAndFlush([bible, bible2, bible3]);

    const forkedEm = orm.em.fork({ freshEventManager: true });
    forkedEm.getEventManager().registerSubscriber(new ManualAuthor2Subscriber());

    const repoAuthor = forkedEm.getRepository(Author2);
    const repoBook = forkedEm.getRepository(Book2);
    const forkedGod = await repoAuthor.findOneOrFail(god.id);
    const forkedBible = await repoBook.findOneOrFail(bible.uuid);
    const forkedBible2 = await repoBook.findOneOrFail(bible2.uuid);

    forkedGod.name = 'Thor';
    forkedBible2.title = '123';
    await forkedEm.flush();

    forkedEm.remove(forkedBible);
    forkedEm.remove(forkedBible2);
    forkedEm.remove(forkedGod);
    await forkedEm.flush();

    expect(Author2Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['beforeCreate', 'Author2'],
      ['beforeCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['afterCreate', 'Author2'],
      ['onInit', 'Author2'],
      ['beforeUpdate', 'Author2'],
      ['afterUpdate', 'Author2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
    ]);

    expect(ManualAuthor2Subscriber.log.map(l => [l[0], l[1].entity.constructor.name])).toEqual([
      ['onInit', 'Author2'],
      ['beforeUpdate', 'Author2'],
      ['afterUpdate', 'Author2'],
      ['beforeDelete', 'Author2'],
      ['afterDelete', 'Author2'],
    ]);
  });

});
