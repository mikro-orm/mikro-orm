import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Wallet {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'decimal', precision: 38, scale: 18 })
  balance!: string;

  @Property({ type: 'decimal', precision: 30, scale: 0 })
  total!: string;

  @Property({ type: 'decimal', runtimeType: 'number', precision: 10, scale: 2 })
  fee!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Wallet],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(() => orm.em.clear());

test('string decimals beyond double precision are detected as changed', async () => {
  const wallet = orm.em.create(Wallet, { balance: '1.000000000000000001', total: '-123456789012345678901', fee: 0 });
  await orm.em.flush();

  // both values round to the same double as the ones they replace
  wallet.balance = '1.000000000000000002';
  wallet.total = '-123456789012345678902';
  const mock = mockLogger(orm);
  await orm.em.flush();

  const update = mock.mock.calls.find(call => call[0].includes('update'));
  expect(update?.[0]).toMatch(
    /update `wallet` set `balance` = '1.000000000000000002', `total` = '-123456789012345678902'/,
  );

  mock.mockReset();
  wallet.fee = 1.25;
  await orm.em.flush();

  const feeUpdate = mock.mock.calls.find(call => call[0].includes('update'));
  expect(feeUpdate?.[0]).toMatch(/update `wallet` set `fee` = 1.25/);
});

test('equivalent string decimals are not detected as changed', async () => {
  const wallet = orm.em.create(Wallet, { balance: '10.5', total: '7', fee: 0 });
  await orm.em.flush();

  wallet.balance = '10.500000000000000000';
  wallet.total = '007';
  wallet.fee = 0.001;
  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  wallet.balance = '-0.000';
  wallet.total = '1e0';
  await orm.em.flush();
  mock.mockReset();

  wallet.balance = '0';
  wallet.total = '1';
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
