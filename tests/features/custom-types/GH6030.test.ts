import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Options,
  raw,
  sql,
} from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Commission {

  @PrimaryKey({ name: '_id' })
  id!: number;

  @Property({ type: 'int', default: 0 })
  age?: number;

  @Property({ type: 'bigint', default: 0 })
  pending?: bigint;

  @Property({ type: 'bigint', default: 0 })
  total?: number;

  @Property({ type: 'bigint', default: 0 })
  withdrawn?: string;

  @Property({ type: 'bigint', default: 0 })
  pendingMoney?: bigint;

  @Property({ type: 'bigint', default: 0 })
  totalMoney?: number;

  @Property({ type: 'bigint', default: 0 })
  withdrawnMoney?: string;

}

describe.each(['libsql', 'sqlite', 'mysql', 'mssql', 'postgresql'] as const)('raw bigint (%s)', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    if (type === 'mssql') {
      options.password = 'Root.Root';
    }

    orm = await MikroORM.init({
      entities: [Commission],
      dbName: type.match(/sqlite|libsql/) ? ':memory:' : 'raw_bigint',
      driver: PLATFORMS[type],
      ...options,
    });
    await orm.schema.refreshDatabase();

    orm.em.create(Commission, {
      id: 1,
      age: 0,
      pending: 1000n,
      total: 1000,
      withdrawn: '1000',
      pendingMoney: 1000n,
      totalMoney: 1000,
      withdrawnMoney: '1000',
    });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('append raw to bigint', async () => {
    const commission = await orm.em.findOneOrFail(Commission, 1);

    orm.em.assign(commission, {
      age: sql`age + 10`,
      pending: sql`pending + 3000`,
      total: sql`total + 5000`,
      withdrawn: sql`withdrawn + 9000`,
      pendingMoney: sql`pending_money + 3000`,
      totalMoney: sql`total_money + 5000`,
      withdrawnMoney: sql`withdrawn_money + 9000`,
    });

    await orm.em.flush();

    expect(commission.age).toBe(10);
    expect(commission.pending).toBe(4000n);
    expect(commission.total).toBe(6000);
    expect(commission.withdrawn).toBe('10000');
    expect(commission.pendingMoney).toBe(4000n);
    expect(commission.totalMoney).toBe(6000);
    expect(commission.withdrawnMoney).toBe('10000');
  });

  test('append raw to bigint from reference', async () => {
    const commission = orm.em.getReference(Commission, 1);

    commission.age = raw(`age + 10`);
    commission.pending = raw(`pending + 6000`);
    commission.total = raw(`total + 4000`);
    commission.withdrawn = raw(`withdrawn + 2000`);
    commission.pendingMoney = raw(`pending_money + 6000`);
    commission.totalMoney = raw(`total_money + 4000`);
    commission.withdrawnMoney = raw(`withdrawn_money + 2000`);

    await orm.em.flush();

    expect(commission.age).toBe(20);
    expect(commission.pending).toBe(10000n);
    expect(commission.total).toBe(10000);
    expect(commission.withdrawn).toBe('12000');
    expect(commission.pendingMoney).toBe(10000n);
    expect(commission.totalMoney).toBe(10000);
    expect(commission.withdrawnMoney).toBe('12000');
  });
});
