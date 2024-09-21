import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Options,
  raw,
} from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap';

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

}

describe.each(['libsql', 'sqlite', 'better-sqlite', 'mysql', 'mssql', 'postgresql'] as const)('raw bigint (%s)', type => {
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
    });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('append raw to bigint', async () => {
    const commission = await orm.em.findOneOrFail(Commission, 1);

    commission.age = raw(`age + 10`);
    commission.pending = raw(`pending + 3000`);
    commission.total = raw(`total + 5000`);
    commission.withdrawn = raw(`withdrawn + 9000`);

    await orm.em.persistAndFlush(commission);

    expect(commission.age).toBe(10);
    expect(commission.pending).toBe(4000n);
    expect(commission.total).toBe(6000);
    expect(commission.withdrawn).toBe('10000');
  });

  test('append raw to bigint from reference', async () => {
    const commission = orm.em.getReference(Commission, 1);

    commission.age = raw(`age + 10`);
    commission.pending = raw(`pending + 6000`);
    commission.total = raw(`total + 4000`);
    commission.withdrawn = raw(`withdrawn + 2000`);

    await orm.em.persistAndFlush(commission);

    expect(commission.age).toBe(20);
    expect(commission.pending).toBe(10000n);
    expect(commission.total).toBe(10000);
    expect(commission.withdrawn).toBe('12000');
  });
});
