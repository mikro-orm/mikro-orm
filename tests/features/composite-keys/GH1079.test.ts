import {
  Entity,
  PrimaryKey,
  MikroORM,
  ManyToOne,
  Enum,
  Property,
  BigIntType,
  wrap,
  Opt,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey({ type: BigIntType })
  _id!: string;

}

@Entity()
class Wallet {

  [PrimaryKeyProp]?: ['currencyRef', 'owner'];

  @PrimaryKey()
  currencyRef!: string;

  @ManyToOne({ primary: true, entity: () => User })
  owner!: User;

  @Property({ type: String, nullable: false, default: '0' })
  mainBalance!: string;

}

class AbstractDeposit {

  @Property({ type: String, nullable: false })
  amount!: string;

  @Property({ type: String, nullable: false })
  gatewayKey!: string;

  @Property()
  createdAt: Opt & Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Opt & Date = new Date();

}

enum DepositStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}


@Entity()
export class Deposit extends AbstractDeposit {

  [PrimaryKeyProp]?: ['txRef', 'wallet'];

  @PrimaryKey()
  txRef!: string;

  @ManyToOne({ primary: true, entity: () => Wallet })
  wallet!: Wallet;

  @Enum({
    nullable: false,
    items: () => DepositStatus,
  })
  status: Opt & DepositStatus = DepositStatus.UNPAID;

}

describe('GH issue 1079', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Wallet, Deposit, AbstractDeposit],
      dbName: `mikro_orm_test_gh_1079`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1079`, async () => {
    const user = new User();
    const wallet = new Wallet();
    const deposit = new Deposit();
    expect(wrap(deposit, true).getPrimaryKeys()).toBeNull();
    user._id = '1';
    wallet.currencyRef = 'USD';
    wallet.owner = user;
    wallet.mainBalance = '456';
    deposit.wallet = wallet;
    deposit.amount = '123';
    deposit.txRef = '456';
    deposit.gatewayKey = '789';
    expect(wrap(deposit, true).getPrimaryKeys()).toEqual(['456', 'USD', '1']);

    const mock = mockLogger(orm, ['query']);

    await orm.em.fork().persistAndFlush(deposit);

    const w = await orm.em.findOneOrFail(Wallet, {
      currencyRef: 'USD',
      owner: { _id: '1' },
    });

    const deposit2 = orm.em.create(Deposit, {
      wallet: w,
      gatewayKey: 'STRIPE',
      amount: '98765',
      txRef: v4(),
    });
    await orm.em.persistAndFlush(deposit2);

    const queries: string[] = mock.mock.calls.map(c => c[0]);
    expect(queries[0]).toMatch(`begin`);
    expect(queries[1]).toMatch(`insert into "user" ("_id") values (?)`);
    expect(queries[2]).toMatch(`insert into "wallet" ("currency_ref", "owner__id", "main_balance") values (?, ?, ?)`);
    expect(queries[3]).toMatch(`insert into "deposit" ("tx_ref", "wallet_currency_ref", "wallet_owner__id", "amount", "gateway_key", "created_at", "updated_at", "status") values (?, ?, ?, ?, ?, ?, ?, ?)`);
    expect(queries[4]).toMatch(`commit`);
    expect(queries[5]).toMatch(`select "w0".* from "wallet" as "w0" where "w0"."currency_ref" = ? and "w0"."owner__id" = ? limit ?`);
    expect(queries[6]).toMatch(`begin`);
    expect(queries[7]).toMatch(`insert into "deposit" ("tx_ref", "wallet_currency_ref", "wallet_owner__id", "amount", "gateway_key", "created_at", "updated_at", "status") values (?, ?, ?, ?, ?, ?, ?, ?)`);
    expect(queries[8]).toMatch(`commit`);
  });

});
