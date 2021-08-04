import { Entity, MikroORM, PrimaryKey, Property, Filter, Index } from '@mikro-orm/core';
import { AbstractSqlDriver, EntityManager } from '@mikro-orm/knex';

@Entity({ discriminatorColumn: 'type', abstract: true })
@Filter({
  name: 'isActive',
  cond: { benefitStatus: 'A', createdAt: { $lte: new Date() } },
})
abstract class Benefit {

  @PrimaryKey()
  id!: number;

  @Property()
  benefitStatus!: string;

  @Index()
  @Property({ columnType: 'timestamp' })
  createdAt: Date = new Date();

  @Property()
  type!: string;

}

@Entity({
  discriminatorValue: 'Profit',
})
class Profit extends Benefit {

  @Property()
  title!: string;

}

@Filter({
  name: 'isActiveLost',
  cond: () => ({ lostStatus: 'L', createdAt: { $lte: new Date() } }),
})
@Entity()
class Lost {

  @PrimaryKey()
  id!: number;

  @Property()
  lostStatus!: string;

  @Property()
  title!: string;

  @Index()
  @Property({ columnType: 'timestamp' })
  createdAt: Date = new Date();

}

describe('GH issue 1979', () => {
  let orm: MikroORM<AbstractSqlDriver>;
  let em: EntityManager;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Benefit, Profit, Lost],
      dbName: `:memory:`,
      type: 'sqlite',
    });

    await orm.getSchemaGenerator().createSchema();
    em = orm.em.fork();

    const now = Date.now();
    const ACTIVE_PROFIT_1 = new Profit();
    ACTIVE_PROFIT_1.id = 1;
    ACTIVE_PROFIT_1.benefitStatus = 'A';
    ACTIVE_PROFIT_1.createdAt = new Date(now - 320000);
    ACTIVE_PROFIT_1.title = 'PROFIT_A';
    const ACTIVE_PROFIT_2 = new Profit();
    ACTIVE_PROFIT_2.id = 2;
    ACTIVE_PROFIT_2.benefitStatus = 'A';
    ACTIVE_PROFIT_2.createdAt = new Date(now - 320000);
    ACTIVE_PROFIT_1.title = 'PROFIT_B';
    const INACTIVE_PROFIT = new Profit();
    INACTIVE_PROFIT.id = 3;
    INACTIVE_PROFIT.benefitStatus = 'B';
    INACTIVE_PROFIT.createdAt = new Date(now + 320000);
    ACTIVE_PROFIT_1.title = 'PROFIT_C';

    const ACTIVE_LOST_1 = new Lost();
    ACTIVE_LOST_1.id = 1;
    ACTIVE_LOST_1.lostStatus = 'L';
    ACTIVE_LOST_1.createdAt = new Date(now - 320000);
    ACTIVE_LOST_1.title = 'Lost_A';
    const ACTIVE_LOST_2 = new Lost();
    ACTIVE_LOST_2.id = 2;
    ACTIVE_LOST_2.lostStatus = 'L';
    ACTIVE_LOST_2.createdAt = new Date(now - 320000);
    ACTIVE_LOST_2.title = 'Lost_B';
    const INACTIVE_LOST = new Lost();
    INACTIVE_LOST.id = 3;
    INACTIVE_LOST.lostStatus = 'X';
    INACTIVE_LOST.createdAt = new Date(now + 320000);
    INACTIVE_LOST.title = 'Lost_C';

    await em.persistAndFlush([
      ACTIVE_PROFIT_1,
      ACTIVE_PROFIT_2,
      INACTIVE_PROFIT,
      ACTIVE_LOST_1,
      ACTIVE_LOST_2,
      INACTIVE_LOST,
    ]);
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('count with Filter (benefit)', async () => {
    const count = await em.count(
      Profit,
      {},
      {
        filters: ['isActive'],
      },
    );
    expect(count).toBe(2);
  });

  test('count with out Filter (benefit)', async () => {
    const count = await em.count(Profit, {
      benefitStatus: 'A',
      createdAt: { $lte: new Date() },
    });
    expect(count).toBe(2);
  });

  test('count with Filter (lost)', async () => {
    const count = await em.count(
      Lost,
      {},
      {
        filters: ['isActiveLost'],
      },
    );
    expect(count).toBe(2);
  });

  test('count with out Filter (lost)', async () => {
    const count = await em.count(Lost, {
      lostStatus: 'L',
      createdAt: { $lte: new Date() },
    });
    expect(count).toBe(2);
  });
});
