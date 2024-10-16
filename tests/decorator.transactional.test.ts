import {
  Collection,
  EntityManager,
  type EntityName,
  type FilterQuery,
  type FindAllOptions,
  type FindOneOptions,
  IsolationLevel,
  LoadStrategy,
  LockMode,
  type LockOptions,
  MikroORM,
  type NoInfer,
  PopulateHint,
  ref,
  Transactional,
} from '@mikro-orm/core';
import { initORMMongo, initORMMySql, initORMPostgreSql, mockLogger } from './bootstrap';
import { Author } from './entities';
import { Author2, Book2, BookTag2, Publisher2, PublisherType } from './entities-sql';

type EntityType = Author | Author2 | Book2;

class TransactionalManager {

  constructor(
    private readonly orm?: MikroORM,
    private readonly em?: EntityManager,
    private readonly di?: MikroORM,
  ) {
  }

  @Transactional()
  async emptyTransactional() {
    //
  }

  @Transactional()
  async persist(entity: EntityType, returnValue?: any) {
    this.getEntityManager()!.persist(entity);
    return returnValue;
  }

  @Transactional()
  async persistWithError(entity: EntityType, err = new Error()) {
    this.getEntityManager()!.persist(entity);
    throw err;
  }

  @Transactional()
  async persistAndFlush(entity: EntityType) {
    await this.getEntityManager()!.persistAndFlush(entity);
  }

  @Transactional()
  async persistAndFlushWithError(entity: EntityType, err = new Error()) {
    await this.getEntityManager()!.persistAndFlush(entity);
    throw err; // rollback the transaction
  }

  @Transactional()
  async lock(entity: EntityType, lockMode: LockMode, options?: LockOptions) {
    await this.getEntityManager()!.lock(entity, lockMode, options);
  }

  @Transactional()
  async findAll<
    Entity extends EntityType,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, options?: FindAllOptions<NoInfer<Entity>, Hint, Fields, Excludes>) {
    return this.getEntityManager()!.findAll(entityName, options);
  }

  @Transactional()
  async findOne<
    Entity extends EntityType,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options?: FindOneOptions<Entity, Hint, Fields, Excludes>) {
    return this.getEntityManager()!.findOne(entityName, where, options);
  }

  @Transactional({ isolationLevel: IsolationLevel.READ_UNCOMMITTED })
  async case1() {
    await this.getEntityManager()!.persistAndFlush(new Author2('God1', 'hello@heaven1.god'));
    throw new Error(); // rollback the transaction
  }

  @Transactional()
  async case2() {
    const em = this.getEntityManager()!;

    await this.persistAndFlushWithError(new Author2('God1', 'hello1@heaven.god')).catch(() => null);
    const res1 = await em.findOne(Author2, { name: 'God1' });
    expect(res1).toBeNull();

    await this.persist(new Author2('God2', 'hello2@heaven.god'));
    const res2 = await em.findOne(Author2, { name: 'God2' });
    expect(res2).not.toBeNull();
  }

  // start outer transaction
  @Transactional()
  async case3() {
    // do stuff inside inner transaction and rollback
    await this.persistAndFlushWithError(new Author2('God', 'hello@heaven.god')).catch(() => null);

    this.getEntityManager()!.persist(new Author2('God Persisted!', 'hello-persisted@heaven.god'));
  }

  @Transactional<TransactionalManager>(manager => manager.di!)
  async case4(err: Error) {
    // this transaction should not be committed
    this.di!.em.persist(new Author('test', 'test@example.com'));

    throw err; // rollback the transaction
  }

  @Transactional({ readOnly: true, isolationLevel: IsolationLevel.READ_COMMITTED })
  async case5() {
    await this.getEntityManager()!.persistAndFlush(new Author2('God1', 'hello@heaven1.god'));
  }

  private getEntityManager() {
    return this.em || this.orm?.em || this.di?.em;
  }

}

let orm: MikroORM;
let manager: TransactionalManager;

describe('TransactionalMySql', () => {

  beforeAll(async () => {
    orm = await initORMMySql('mysql');
    manager = new TransactionalManager(orm);
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('transactions', async () => {
    await manager.persist(new Author2('God1', 'hello@heaven1.god'));
    const res1 = await orm.em.findOne(Author2, { name: 'God1' });
    expect(res1).not.toBeNull();

    const err = new Error('Test');

    await manager.persistWithError(new Author2('God2', 'hello@heaven2.god'), err)
      .catch(async e => {
        expect(e).toBe(err);
        const res2 = await orm.em.findOne(Author2, { name: 'God2' });
        expect(res2).toBeNull();
      });
  });

  test('transactions with isolation levels', async () => {
    const mock = mockLogger(orm, ['query']);

    await manager.case1().catch(() => null);

    expect(mock.mock.calls[0][0]).toMatch('set transaction isolation level read uncommitted');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback');
  });

  test('nested transactions with save-points', async () => {
    await manager.case2();
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = mockLogger(orm, ['query']);

    const transaction = manager.case3();

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author2` (`created_at`, `updated_at`, `name`, `email`, `terms_accepted`) values (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('lock supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_WRITE);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `a0` where `a0`.`id` = ? for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('lock supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_READ);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author2` as `a0` where `a0`.`id` = ? lock in share mode');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    orm.em.clear();
    mock.mock.calls.length = 0;

    await manager.findOne(Author2, { email: 'foo' }, {
      lockMode: LockMode.PESSIMISTIC_READ,
      strategy: 'select-in',
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(' from `author2` as `a0` left join `address2` as `a1` on `a0`.`id` = `a1`.`author_id` where `a0`.`email` = ? limit ? lock in share mode');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

});

describe('TransactionalMongo', () => {

  beforeAll(async () => {
    orm = await initORMMongo();
    manager = new TransactionalManager(undefined, undefined, orm);
  });
  beforeEach(() => orm.schema.clearDatabase());
  afterAll(() => orm.close(true));

  test('transactions with embedded transaction', async () => {
    await expect(manager.emptyTransactional()).rejects.toThrow(/@Transactional\(\) decorator can only be applied/);

    const err = new Error('Test');
    await expect(manager.case4(err)).rejects.toBe(err);

    const res = await orm.em.findOne(Author, { name: 'test' });
    expect(res).toBeNull();
  });

});

describe('TransactionalPostgre', () => {

  async function createBooksWithTags() {
    const author = await orm.em.upsert(Author2, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = new Book2('My Life on The Wall, part 1', author.id);
    const book2 = new Book2('My Life on The Wall, part 2', author.id);
    const book3 = new Book2('My Life on The Wall, part 3', author.id);
    const publisher = new Publisher2();
    book1.publisher = ref(publisher);
    book2.publisher = ref(publisher);
    book3.publisher = ref(publisher);
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

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    manager = new TransactionalManager(undefined, orm.em);
  });
  beforeEach(() => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('transactions', async () => {
    await manager.persistAndFlushWithError(new Author2('God1', 'hello@heaven1.god')).catch(() => null);
    const res1 = await orm.em.findOne(Author2, { name: 'God1' });
    expect(res1).toBeNull();

    const ret = await manager.persist(new Author2('God2', 'hello@heaven2.god'), true);
    const res2 = await orm.em.findOne(Author2, { name: 'God2' });
    expect(res2).not.toBeNull();
    expect(ret).toBe(true);

    const err = new Error('Test');

    await manager.persistWithError(new Author2('God4', 'hello@heaven4.god'), err)
      .catch(async e => {
        expect(e).toBe(err);
        const res3 = await orm.em.findOne(Author2, { name: 'God4' });
        expect(res3).toBeNull();
      });
  });

  test('transactions with isolation levels', async () => {
    const mock = mockLogger(orm, ['query']);

    await manager.case1().catch(() => null);

    expect(mock.mock.calls[0][0]).toMatch('begin transaction isolation level read uncommitted');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values ($1, $2, $3, $4, $5) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('read-only transactions', async () => {
    const mock = mockLogger(orm, ['query']);

    await expect(manager.case5()).rejects.toThrow(/cannot execute INSERT in a read-only transaction/);

    expect(mock.mock.calls[0][0]).toMatch('begin transaction isolation level read committed read only');
    expect(mock.mock.calls[1][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values ($1, $2, $3, $4, $5) returning "id", "age"');
    expect(mock.mock.calls[2][0]).toMatch('rollback');
  });

  test('nested transactions with save-points', async () => {
    await manager.case2();
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = mockLogger(orm, ['query']);

    const transaction = manager.case3();

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values ($1, $2, $3, $4, $5) returning "id"');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into "author2" ("created_at", "updated_at", "name", "email", "terms_accepted") values ($1, $2, $3, $4, $5) returning "id"');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author2, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('collection loads items after savepoint should not fail', async () => {
    const publisher = new Publisher2('7K publisher', PublisherType.GLOBAL);
    const book = new Book2('My Life on The Wall, part 1', new Author2('name', 'email'));
    book.publisher = ref(publisher);

    const author = new Author2('Bartleby', 'bartelby@writer.org');
    author.books.add(book);

    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();

    await em.transactional(async em => {
      const book2 = await em.findOneOrFail(Book2, book.uuid);
      const publisher2 = await book2.publisher!.loadOrFail({
        populate: ['tests'],
        lockMode: LockMode.PESSIMISTIC_WRITE,
      });

      await manager.emptyTransactional();

      expect(publisher2.books.isInitialized(true)).toBe(false);
      const books1 = await publisher2.books.load({ lockMode: LockMode.PESSIMISTIC_WRITE });
      const books2 = await publisher2.books.load({ lockMode: LockMode.PESSIMISTIC_WRITE });
      expect(books1).toBeInstanceOf(Collection);
      expect(books1.isInitialized(true)).toBe(true);
      expect(books1).toBe(books2);
    });

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."uuid_pk" = $1 limit $2`);
    expect(mock.mock.calls[2][0]).toMatch(`select "p0".* from "publisher2" as "p0" where "p0"."id" = $1 limit $2 for update`);
    expect(mock.mock.calls[3][0]).toMatch(`select "t1".*, "p0"."test2_id" as "fk__test2_id", "p0"."publisher2_id" as "fk__publisher2_id" from "publisher2_tests" as "p0" inner join "public"."test2" as "t1" on "p0"."test2_id" = "t1"."id" where "p0"."publisher2_id" in ($1) order by "p0"."id" asc for update`);
    expect(mock.mock.calls[4][0]).toMatch(`savepoint trx`);
    expect(mock.mock.calls[5][0]).toMatch(`release savepoint trx`);
    expect(mock.mock.calls[6][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null and "b0"."publisher_id" in ($1) for update`);
    expect(mock.mock.calls[7][0]).toMatch(`commit`);
  });

  test('findOne supports pessimistic locking [pessimistic write]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_WRITE);

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = $1 for update');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne supports pessimistic locking [pessimistic read]', async () => {
    const author = new Author2('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_READ);
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = $1 for share');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;

    await manager.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE);
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = $1 for update skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;

    await manager.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE, { lockTableAliases: ['a0'] });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from "author2" as "a0" where "a0"."id" = $1 for update of "a0" skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mock.calls.length = 0;

    await manager.findAll(Book2, {
      lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      lockTableAliases: ['b0'],
      populate: ['author'],
      strategy: LoadStrategy.JOINED,
    });
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed", "a1"."id" as "a1__id", "a1"."created_at" as "a1__created_at", "a1"."updated_at" as "a1__updated_at", "a1"."name" as "a1__name", "a1"."email" as "a1__email", "a1"."age" as "a1__age", "a1"."terms_accepted" as "a1__terms_accepted", "a1"."optional" as "a1__optional", "a1"."identities" as "a1__identities", "a1"."born" as "a1__born", "a1"."born_time" as "a1__born_time", "a1"."favourite_book_uuid_pk" as "a1__favourite_book_uuid_pk", "a1"."favourite_author_id" as "a1__favourite_author_id", "a1"."identity" as "a1__identity" from "book2" as "b0" left join "author2" as "a1" on "b0"."author_id" = "a1"."id" where "b0"."author_id" is not null for update of "b0" skip locked');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('locking and select-in population (GH #1670)', async () => {
    await createBooksWithTags();
    const mock = mockLogger(orm, ['query']);

    await manager.findAll(Book2, {
      lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      populate: ['author', 'tags'],
      populateWhere: PopulateHint.INFER,
      strategy: LoadStrategy.SELECT_IN,
    });
    expect(mock.mock.calls.length).toBe(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`select "b0"."uuid_pk", "b0"."created_at", "b0"."isbn", "b0"."title", "b0"."price", "b0"."double", "b0"."meta", "b0"."author_id", "b0"."publisher_id", "b0".price * 1.19 as "price_taxed" from "book2" as "b0" where "b0"."author_id" is not null for update skip locked`);
    expect(mock.mock.calls[2][0]).toMatch(`select "a0".* from "author2" as "a0" where "a0"."id" in ($1) and "a0"."id" is not null for update skip locked`);
    expect(mock.mock.calls[3][0]).toMatch(`select "b1".*, "b0"."book_tag2_id" as "fk__book_tag2_id", "b0"."book2_uuid_pk" as "fk__book2_uuid_pk" from "book2_tags" as "b0" inner join "public"."book_tag2" as "b1" on "b0"."book_tag2_id" = "b1"."id" where "b0"."book2_uuid_pk" in ($1, $2, $3) order by "b0"."order" asc for update skip locked`);
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

});
