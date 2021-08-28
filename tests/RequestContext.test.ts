import { RequestContext, MikroORM, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Author4, BaseEntity5, Book4, BookTag4, FooBar4, FooBaz4, Publisher4, Test4 } from './entities-schema';
import { initORMMongo, wipeDatabase } from './bootstrap';
import { Author, Book } from './entities';

describe('RequestContext', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

  test('create new context', async () => {
    expect(RequestContext.getEntityManager()).toBeUndefined();
    RequestContext.create(orm.em, () => {
      const em = RequestContext.getEntityManager()!;
      expect(em).not.toBe(orm.em);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em.unitOfWork.getIdentityMap()).not.toBe(orm.em.unitOfWork.getIdentityMap());
      expect(RequestContext.currentRequestContext()).not.toBeUndefined();
      expect(RequestContext.currentRequestContext()!.em).toBe(em);
    });
    expect(RequestContext.currentRequestContext()).toBeUndefined();
  });

  test('create new context (async)', async () => {
    expect(RequestContext.getEntityManager()).toBeUndefined();
    const ret = await RequestContext.createAsync(orm.em, async () => {
      const em = RequestContext.getEntityManager()!;
      expect(em).not.toBe(orm.em);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em.unitOfWork.getIdentityMap()).not.toBe(orm.em.unitOfWork.getIdentityMap());
      expect(RequestContext.currentRequestContext()).not.toBeUndefined();

      return 123;
    });
    expect(RequestContext.currentRequestContext()).toBeUndefined();
    expect(ret).toBe(123);
  });

  test('request context does not break population', async () => {
    const bible = new Book('Bible', new Author('God', 'hello@heaven.god'));
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.favouriteBook = bible;
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    await new Promise<void>(resolve => {
      RequestContext.create(orm.em, async () => {
        const em = RequestContext.getEntityManager()!;
        const jon = await em.findOne(Author, author.id, { populate: ['favouriteBook'] });
        expect(jon!.favouriteBook).toBeInstanceOf(Book);
        expect(wrap(jon!.favouriteBook).isInitialized()).toBe(true);
        expect(jon!.favouriteBook.title).toBe('Bible');
        resolve();
      });
    });
  });

  afterAll(async () => orm.close(true));

});

describe('MultiRequestContext', () => {

  let orm1: MikroORM<SqliteDriver>;
  let orm2: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm1 = await MikroORM.init<SqliteDriver>({
      entities: [Author4, Book4, BookTag4, Publisher4, Test4, BaseEntity5],
      dbName: ':memory:',
      driver: SqliteDriver,
      contextName: 'orm1',
    });
    orm2 = await MikroORM.init<SqliteDriver>({
      entities: [FooBar4, FooBaz4, BaseEntity5],
      dbName: ':memory:',
      driver: SqliteDriver,
      contextName: 'orm2',
    });
  });

  test('create new context', async () => {
    expect(RequestContext.getEntityManager(orm1.em.name)).toBeUndefined();
    expect(RequestContext.getEntityManager(orm2.em.name)).toBeUndefined();
    RequestContext.create([orm1.em, orm2.em], () => {
      const em1 = orm1.em.getContext();
      expect(em1).not.toBe(orm1.em);
      expect(em1.name).toBe(orm1.em.name);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em1.unitOfWork.getIdentityMap()).not.toBe(orm1.em.unitOfWork.getIdentityMap());

      const em2 = orm2.em.getContext();
      expect(em2).not.toBe(orm2.em);
      expect(em2.name).toBe(orm2.em.name);
      expect(em1).not.toBe(em2);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em2.unitOfWork.getIdentityMap()).not.toBe(orm2.em.unitOfWork.getIdentityMap());

      expect(RequestContext.currentRequestContext()).not.toBeUndefined();
    });
    expect(RequestContext.currentRequestContext()).toBeUndefined();
  });

  test('create new context (async)', async () => {
    expect(RequestContext.getEntityManager(orm1.em.name)).toBeUndefined();
    expect(RequestContext.getEntityManager(orm2.em.name)).toBeUndefined();
    await RequestContext.createAsync([orm1.em, orm2.em], async () => {
      const em1 = orm1.em.getContext();
      expect(em1).not.toBe(orm1.em);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em1.unitOfWork.getIdentityMap()).not.toBe(orm1.em.unitOfWork.getIdentityMap());

      const em2 = orm2.em.getContext();
      expect(em2).not.toBe(orm2.em);
      expect(em2.name).toBe(orm2.em.name);
      expect(em1).not.toBe(em2);
      // access UoW via property so we do not get the one from request context automatically
      // @ts-ignore
      expect(em2.unitOfWork.getIdentityMap()).not.toBe(orm2.em.unitOfWork.getIdentityMap());

      expect(RequestContext.currentRequestContext()).not.toBeUndefined();
    });
    expect(RequestContext.currentRequestContext()).toBeUndefined();
  });

  afterAll(async () => {
    await orm1.close(true);
    await orm2.close(true);
  });

});
