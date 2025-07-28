import {
  Entity,
  EntityManager,
  type EntityName,
  EntityRepository,
  type FilterQuery,
  type FindAllOptions,
  type FindOneOptions,
  LockMode,
  type LockOptions,
  MikroORM,
  type NoInfer,
  PrimaryKey,
  Property,
  Transactional,
} from '@mikro-orm/sqlite';
import { mockLogger } from './bootstrap';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

type EntityType = Author;

class TransactionalManager {

  constructor(
    private readonly orm?: MikroORM,
    private readonly em?: EntityManager,
    private readonly di?: EntityRepository<any>,
  ) {
  }

  @Transactional()
  async empty() {
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

  @Transactional({ ignoreNestedTransactions: true })
  async case1() {
    await this.case1_1();
  }

  @Transactional()
  async case1_1() {
    await this.getEntityManager()!.execute('select 1');
  }

  @Transactional()
  async case2(id: number) {
    const author = await this.getEntityManager()!.findOneOrFail(Author, id);
    author.name = 'abc';
  }

  @Transactional()
  async case3() {
    const em = this.getEntityManager()!;

    await this.persistAndFlushWithError(new Author('God1', 'hello@heaven1.god')).catch(() => null);
    const res1 = await em.findOne(Author, { name: 'God1' });
    expect(res1).toBeNull();

    await this.persistAndFlush(new Author('God2', 'hello@heaven2.god'));
    const res2 = await em.findOne(Author, { name: 'God2' });
    expect(res2).not.toBeNull();
  }

  // start outer transaction
  @Transactional()
  async case4() {
    // do stuff inside inner transaction and rollback
    await this.persistAndFlushWithError(new Author('God', 'hello@heaven.god')).catch(() => null);

    await this.getEntityManager()!.persistAndFlush(new Author('God Persisted!', 'hello-persisted@heaven.god'));
  }

  private getEntityManager() {
    return this.em || this.orm?.em || this.di?.getEntityManager();
  }

}

let orm: MikroORM;
let manager: TransactionalManager;

describe('Transactional', () => {
  beforeAll(async () => {
    orm = await MikroORM.init({ dbName: ':memory:', entities: [Author] });
    manager = new TransactionalManager(orm);
    await orm.schema.refreshDatabase();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => await orm.close(true));

  test('disable nested transactions', async () => {
    const mock = mockLogger(orm);

    await manager.case1();

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('transactions', async () => {
    await manager.persistAndFlushWithError(new Author('God1', 'hello@heaven1.god')).catch(() => null);

    const res1 = await orm.em.findOne(Author, { name: 'God1' });
    expect(res1).toBeNull();

    const res2 = await manager.persist(new Author('God2', 'hello@heaven2.god'), true);
    expect(res2).toBe(true);

    const res3 = await orm.em.findOne(Author, { name: 'God2' });
    expect(res3).not.toBeNull();

    const err = new Error('Test');

    const res4 = manager.persistWithError(new Author('God3', 'hello@heaven3.god'), err);
    await expect(res4).rejects.toBe(err);

    const res5 = await orm.em.findOne(Author, { name: 'God3' });
    expect(res5).toBeNull();
  });

  test('transactions respect the tx context', async () => {
    const id = await orm.em.insert(new Author('God1', 'hello@heaven1.god'));

    await manager.case2(id);
    orm.em.clear();

    const res1 = await orm.em.findOne(Author, { name: 'God1' });
    expect(res1).toBeNull();

    const res2 = await orm.em.findOne(Author, { name: 'abc' });
    expect(res2).not.toBeNull();
  });

  test('nested transactions with save-points', async () => {
    await manager.case3();
  });

  test('nested transaction rollback with save-points will commit the outer one', async () => {
    const mock = mockLogger(orm, ['query']);

    const transaction = manager.case4();

    // try to commit the outer transaction
    await expect(transaction).resolves.toBeUndefined();
    expect(mock.mock.calls.length).toBe(6);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('savepoint `trx');
    expect(mock.mock.calls[2][0]).toMatch('insert into `author` (`name`, `email`) values (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('rollback to savepoint `trx');
    expect(mock.mock.calls[4][0]).toMatch('insert into `author` (`name`, `email`) values (?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
    await expect(orm.em.findOne(Author, { name: 'God Persisted!' })).resolves.not.toBeNull();
  });

  test('findOne does not support pessimistic locking [pessimistic write]', async () => {
    const author = new Author('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_WRITE);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author` as `a0` where `a0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('findOne does not support pessimistic locking [pessimistic read]', async () => {
    const author = new Author('name', 'email');
    await orm.em.persistAndFlush(author);

    const mock = mockLogger(orm, ['query']);

    await manager.lock(author, LockMode.PESSIMISTIC_READ);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('select 1 from `author` as `a0` where `a0`.`id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('should throw exception', async () => {
    const manager = new TransactionalManager();

    try {
      class Dummy {

        @Transactional()
        dummy() {
          //
        }

      }
    } catch (e: any) {
      expect(e.message).toBe('@Transactional() should be use with async functions');
    }

    await expect(manager.empty()).rejects.toThrow(/@Transactional\(\) decorator can only be applied/);
  });

});
