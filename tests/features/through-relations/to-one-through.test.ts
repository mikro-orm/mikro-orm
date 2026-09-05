import {
  Collection,
  defineEntity,
  EntitySchema,
  LoadStrategy,
  MetadataError,
  MikroORM,
  Utils,
  ValidationError,
  wrap,
  type IDatabaseDriver,
  type Loaded,
  type Ref,
  type Rel,
} from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger, PLATFORMS } from '../../bootstrap.js';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { SqlEntityManager } from '@mikro-orm/sql';

@Entity()
class Account {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Customer {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Edge, e => e.start)
  edges = new Collection<Edge>(this);

  @ManyToOne(() => Account, {
    through: () => Edge,
    where: { state: 'cleared' },
    ref: true,
    nullable: true,
  })
  account?: Ref<Account>;

  @OneToOne(() => Edge, {
    through: () => Edge,
    orderBy: { id: 'desc' },
    ref: true,
    nullable: true,
  })
  latestEdge?: Ref<Edge>;

  @ManyToOne(() => Account, {
    through: () => Edge,
    where: { state: 'pending' },
    mapToPk: true,
    nullable: true,
  })
  pendingAccountId?: number;
}

@Entity()
class Edge {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Customer)
  start!: Customer;

  @ManyToOne(() => Account)
  end!: Account;

  @Property()
  state!: string;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_through_to_one', port: 3308 },
  postgresql: { dbName: 'mikro_orm_through_to_one' },
  mssql: { dbName: 'mikro_orm_through_to_one', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('to-one relations through another entity [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Customer, Account, Edge],
      driver: PLATFORMS[type],
      metadataProvider: ReflectMetadataProvider,
      ...options[type],
    });
    await orm.schema.refresh();

    const acc1 = orm.em.create(Account, { name: 'acc1' });
    const acc2 = orm.em.create(Account, { name: 'acc2' });
    const acc3 = orm.em.create(Account, { name: 'acc3' });
    const c1 = orm.em.create(Customer, { name: 'c1' });
    const c2 = orm.em.create(Customer, { name: 'c2' });
    orm.em.create(Edge, { start: c1, end: acc1, state: 'pending' });
    orm.em.create(Edge, { start: c1, end: acc2, state: 'cleared' });
    orm.em.create(Edge, { start: c2, end: acc3, state: 'pending' });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  afterEach(() => orm.em.clear());

  test('no column is created for the virtual relations', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');
    const meta = orm.getMetadata(Customer);
    expect(meta.properties.account.persist).toBe(false);
    expect(meta.properties.account.through).toMatchObject({ ownerProperty: 'start', targetProperty: 'end' });
    expect(meta.properties.latestEdge.through).toMatchObject({ ownerProperty: 'start' });
  });

  test.each([LoadStrategy.SELECT_IN, LoadStrategy.JOINED])('populate (%s)', async strategy => {
    const customers = await orm.em.find(
      Customer,
      {},
      { populate: ['account', 'latestEdge', 'edges'], orderBy: { name: 'asc' }, strategy },
    );
    expect(customers).toHaveLength(2);
    expect(customers[0].account!.$.name).toBe('acc2');
    expect(customers[0].pendingAccountId).toBe(customers[0].edges.find(e => e.state === 'pending')!.end.id);
    expect(customers[0].latestEdge!.$.state).toBe('cleared');
    expect(customers[1].account).toBeNull();
    expect(customers[1].pendingAccountId).toBe(customers[1].edges.find(e => e.state === 'pending')!.end.id);
    expect(customers[1].latestEdge!.$.state).toBe('pending');

    const c1: Loaded<Customer, 'account'> = customers[0];
    expect(c1.account?.$.name).toBe('acc2');
  });

  test('generated subquery', async () => {
    const sql = (orm.em as SqlEntityManager).createQueryBuilder(Customer, 'c').select('*').getFormattedQuery();

    if (type === 'sqlite') {
      expect(sql).toBe(
        'select `c`.*, ' +
          "(select `account_through`.`end_id` from `edge` as `account_through` where (`account_through`.`start_id` = `c`.`id`) and `account_through`.`state` = 'cleared' limit 1) as `account_id`, " +
          '(select `latestEdge_through`.`id` from `edge` as `latestEdge_through` where (`latestEdge_through`.`start_id` = `c`.`id`) order by `latestEdge_through`.`id` desc limit 1) as `latest_edge_id`, ' +
          "(select `pendingAccountId_through`.`end_id` from `edge` as `pendingAccountId_through` where (`pendingAccountId_through`.`start_id` = `c`.`id`) and `pendingAccountId_through`.`state` = 'pending' limit 1) as `pending_account_id_id` " +
          'from `customer` as `c`',
      );
    } else {
      expect(sql).toContain('account_through');
    }
  });

  test('querying and ordering by the virtual relation', async () => {
    const acc2 = await orm.em.findOneOrFail(Account, { name: 'acc2' });
    const customers = await orm.em.find(Customer, { account: acc2 });
    expect(customers.map(c => c.name)).toEqual(['c1']);
    const without = await orm.em.find(Customer, { account: null });
    expect(without.map(c => c.name)).toEqual(['c2']);

    const ordered = await orm.em.find(Customer, {}, { orderBy: { latestEdge: 'desc' } });
    expect(ordered.map(c => c.name)).toEqual(['c2', 'c1']);
  });

  test('serialization', async () => {
    const c1 = await orm.em.findOneOrFail(Customer, { name: 'c1' }, { populate: ['account'] });
    expect(wrap(c1).toObject()).toMatchObject({
      name: 'c1',
      account: { name: 'acc2' },
      pendingAccountId: expect.any(Number),
      latestEdge: expect.any(Number),
    });
  });

  test('virtual relations are read-only', async () => {
    const c2 = await orm.em.findOneOrFail(Customer, { name: 'c2' });
    const acc1 = await orm.em.findOneOrFail(Account, { name: 'acc1' });
    c2.account = wrap(acc1).toReference();
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).not.toHaveBeenCalled();
  });
});

describe('to-one relations through another entity (schema variants)', () => {
  test('defineEntity', async () => {
    const Account2 = defineEntity({
      name: 'Account2',
      properties: p => ({ id: p.integer().primary(), name: p.string() }),
    });
    const Customer2 = defineEntity({
      name: 'Customer2',
      properties: p => ({
        id: p.integer().primary(),
        account: () =>
          p
            .manyToOne(Account2)
            .through(() => Edge2)
            .where({ state: 'cleared' })
            .ref()
            .nullable(),
      }),
    });
    const Edge2 = defineEntity({
      name: 'Edge2',
      properties: p => ({
        id: p.integer().primary(),
        start: () => p.manyToOne(Customer2),
        end: () => p.manyToOne(Account2),
        state: p.string(),
      }),
    });
    const orm = await MikroORM.init({
      entities: [Customer2, Account2, Edge2],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    await orm.schema.create();
    const acc = orm.em.create(Account2, { name: 'acc' });
    const customer = orm.em.create(Customer2, {});
    orm.em.create(Edge2, { start: customer, end: acc, state: 'cleared' });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Customer2, customer.id, { populate: ['account'] });
    expect(loaded.account!.$.name).toBe('acc');
    await orm.close(true);
  });

  test('through entity referencing a non-primary key of the owner', async () => {
    @Entity()
    class Account4 {
      @PrimaryKey()
      id!: number;
    }

    @Entity()
    class Customer4 {
      @PrimaryKey()
      id!: number;

      @Property({ unique: true })
      code!: string;

      @ManyToOne(() => Account4, { through: () => Edge4, nullable: true })
      account?: Rel<Account4>;
    }

    @Entity()
    class Edge4 {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Customer4, { targetKey: 'code' })
      start!: Customer4;

      @ManyToOne(() => Account4)
      end!: Account4;
    }

    const orm = await MikroORM.init({
      entities: [Customer4, Account4, Edge4],
      driver: SqliteDriver,
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
    const acc = orm.em.create(Account4, {});
    const customer = orm.em.create(Customer4, { code: 'c' });
    orm.em.create(Edge4, { start: customer, end: acc });
    await orm.em.flush();
    orm.em.clear();

    const sql = orm.em.createQueryBuilder(Customer4, 'c').select('*').getFormattedQuery();
    expect(sql).toBe(
      'select `c`.*, (select `account_through`.`end_id` from `edge4` as `account_through` where (`account_through`.`start_id` = `c`.`code`) limit 1) as `account_id` from `customer4` as `c`',
    );
    const loaded = await orm.em.findOneOrFail(Customer4, customer.id, { populate: ['account'] });
    expect(loaded.account!.id).toBe(acc.id);
    await orm.close(true);
  });

  test('EntitySchema', async () => {
    const Account3: EntitySchema = new EntitySchema({
      name: 'Account3',
      properties: { id: { type: 'number', primary: true }, name: { type: 'string' } },
    });
    const Customer3: EntitySchema = new EntitySchema({
      name: 'Customer3',
      properties: {
        id: { type: 'number', primary: true },
        account: {
          kind: 'm:1',
          entity: () => Account3,
          through: () => Edge3,
          where: { state: 'cleared' },
          nullable: true,
        },
      },
    });
    const Edge3: EntitySchema = new EntitySchema({
      name: 'Edge3',
      properties: {
        id: { type: 'number', primary: true },
        start: { kind: 'm:1', entity: () => Customer3 },
        end: { kind: 'm:1', entity: () => Account3 },
        state: { type: 'string' },
      },
    });
    const orm = await MikroORM.init({
      entities: [Customer3, Account3, Edge3],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    await orm.schema.create();
    const acc = orm.em.create(Account3, { name: 'acc' });
    const customer = orm.em.create(Customer3, {});
    orm.em.create(Edge3, { start: customer, end: acc, state: 'cleared' });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Customer3, customer.id, { populate: ['account'] });
    expect(loaded.account.name).toBe('acc');
    await orm.close(true);
  });
});

describe('to-one relations through another entity (validation)', () => {
  test('through is only allowed on to-one relations', async () => {
    @Entity()
    class Author {
      @PrimaryKey()
      id!: number;

      @OneToMany(() => Book, b => b.author, { ...({ through: () => Book } as object) })
      books = new Collection<Rel<Book>>(this);
    }

    @Entity()
    class Book {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Author)
      author!: Rel<Author>;
    }

    await expect(
      MikroORM.init({
        entities: [Author, Book],
        driver: SqliteDriver,
        dbName: ':memory:',
        metadataProvider: ReflectMetadataProvider,
      }),
    ).rejects.toThrow(
      new MetadataError(
        `Author.books uses 'through' option which is only supported for ManyToOne and OneToOne relations`,
      ),
    );
  });

  test('through is not allowed for targets with composite primary key', async () => {
    @Entity()
    class Author {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Book, { through: () => Book, nullable: true })
      firstBook?: Rel<Book>;
    }

    @Entity()
    class Book {
      @PrimaryKey()
      isbn!: string;

      @PrimaryKey()
      edition!: number;

      @ManyToOne(() => Author)
      author!: Rel<Author>;
    }

    await expect(
      MikroORM.init({
        entities: [Author, Book],
        driver: SqliteDriver,
        dbName: ':memory:',
        metadataProvider: ReflectMetadataProvider,
      }),
    ).rejects.toThrow(
      new MetadataError(
        `Author.firstBook uses 'through' option which is not supported for targets with composite primary key`,
      ),
    );
  });

  test('through entity needs a FK to the owner', async () => {
    @Entity()
    class Author {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Book, { through: () => Book, nullable: true })
      firstBook?: Rel<Book>;
    }

    @Entity()
    class Book {
      @PrimaryKey()
      id!: number;
    }

    await expect(
      MikroORM.init({
        entities: [Author, Book],
        driver: SqliteDriver,
        dbName: ':memory:',
        metadataProvider: ReflectMetadataProvider,
      }),
    ).rejects.toThrow(
      new MetadataError(
        `Author.firstBook uses 'through' entity Book which has no ManyToOne property pointing to Author`,
      ),
    );
  });

  test('through entity needs a FK to the target', async () => {
    @Entity()
    class Publisher {
      @PrimaryKey()
      id!: number;
    }

    @Entity()
    class Author {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Publisher, { through: () => Book, nullable: true })
      publisher?: Rel<Publisher>;
    }

    @Entity()
    class Book {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Author)
      author!: Rel<Author>;
    }

    await expect(
      MikroORM.init({
        entities: [Author, Book, Publisher],
        driver: SqliteDriver,
        dbName: ':memory:',
        metadataProvider: ReflectMetadataProvider,
      }),
    ).rejects.toThrow(
      new MetadataError(
        `Author.publisher uses 'through' entity Book which has no ManyToOne property pointing to Publisher`,
      ),
    );
  });

  test('where and orderBy can only reference own columns of the through entity', async () => {
    @Entity()
    class Author {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Book, { through: () => Book, where: { author: { name: 'foo' } }, nullable: true })
      firstBook?: Rel<Book>;
    }

    @Entity()
    class Book {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Author)
      author!: Rel<Author>;
    }

    const orm = await MikroORM.init({
      entities: [Author, Book],
      driver: SqliteDriver,
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    expect(() => orm.em.createQueryBuilder(Author).select('*').getFormattedQuery()).toThrow(
      new ValidationError(
        `The 'where' and 'orderBy' options of the through relation firstBook can only reference own columns of Book`,
      ),
    );
    await orm.close(true);
  });
});
