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

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Property({ type: 'decimal', runtimeType: 'number', precision: 38, scale: 18 })
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

test('string decimals beyond double precision are detected as changed', async () => {
  const em = orm.em.fork();
  const wallet = em.create(Wallet, {
    balance: '1.000000000000000001',
    total: '-123456789012345678901',
    price: '1',
    fee: 0,
  });
  await em.flush();

  // both values round to the same double as the ones they replace
  wallet.balance = '1.000000000000000002';
  wallet.total = '-123456789012345678902';
  const mock = mockLogger(orm, ['query', 'query-params']);
  await em.flush();

  expect(mock.mock.calls[1][0]).toMatch(
    /update `wallet` set `balance` = '1.000000000000000002', `total` = '-123456789012345678902'/,
  );
});

test('formatting and sub-scale differences of string decimals are not detected as changed', async () => {
  const em = orm.em.fork();
  const wallet = em.create(Wallet, { balance: '10.5', total: '7', price: '10.5', fee: 0 });
  await em.flush();

  wallet.balance = '10.500000000000000000';
  wallet.total = '007';
  wallet.price = '10.50';
  const mock = mockLogger(orm, ['query', 'query-params']);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();

  // the database rounds to the column scale, so digits beyond it do not change the stored value
  wallet.balance = '10.5000000000000000004';
  wallet.total = '7.4';
  wallet.price = '10.501';
  await em.flush();
  expect(mock).not.toHaveBeenCalled();

  wallet.balance = '10.5000000000000000005';
  await em.flush();
  expect(mock.mock.calls[1][0]).toMatch(/update `wallet` set `balance` = '10.5000000000000000005'/);
});

test('number mode decimals keep the numeric comparison', async () => {
  const em = orm.em.fork();
  const wallet = em.create(Wallet, { balance: '1', total: '1', price: '1', fee: '1.000000000000000001' as any });
  await em.flush();

  wallet.fee = '1.000000000000000002' as any;
  const mock = mockLogger(orm, ['query', 'query-params']);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();

  wallet.fee = 1.5;
  await em.flush();
  expect(mock.mock.calls[1][0]).toMatch(/update `wallet` set `fee` = 1.5/);
});

test('high precision string decimals are rounded to scale like the database does', () => {
  const type = orm.getMetadata().get(Wallet).properties.balance.customType!;

  expect(type.compareValues!('0.9999999999999999995', '1')).toBe(true);
  expect(type.compareValues!('-1.0000000000000000015', '-1.000000000000000002')).toBe(true);
  expect(type.compareValues!('-1.0000000000000000015', '-1.000000000000000001')).toBe(false);
  expect(type.compareValues!('-0.0000000000000000001', '0')).toBe(true);
  // other notations fall back to the numeric comparison
  expect(type.compareValues!('1.000000000000000001e0', '1')).toBe(true);
});
