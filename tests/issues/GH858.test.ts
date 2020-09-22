import { BaseEntity, Collection, Entity, IdentifiedReference, MikroORM, OneToOne, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

@Entity()
class Transaction extends BaseEntity<Transaction, 'id'> {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @ManyToOne('Account')
  debitAccount!: IdentifiedReference<Account>;

  @ManyToOne('Account')
  creditAccount!: IdentifiedReference<Account>;

}

@Entity()
class Voucher extends BaseEntity<Voucher, 'id'> {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @OneToOne('Account')
  account!: IdentifiedReference<Account>;

}

@Entity()
class Account extends BaseEntity<Account, 'id'>  {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

	@OneToMany({ entity: () => Transaction, mappedBy: 'debitAccount' })
	debitTransactions = new Collection<Transaction>(this);

	@OneToMany({ entity: () => Transaction, mappedBy: 'creditAccount' })
  creditTransactions = new Collection<Transaction>(this);

  @OneToOne({ entity: () => Voucher, mappedBy: 'account', nullable: true })
	voucher?: IdentifiedReference<Voucher>;

}

describe('GH issue TBA', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Account, Voucher, Transaction],
      dbName: 'mikro_orm_test_ghtba',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('respects owner', async () => {
    // Setup
    const voucher = new Voucher();
    const voucherAccount = new Account();
    voucher.account = voucherAccount.toReference();

    const someAccount = new Account();
    const someOtherAccount = new Account();

    const transaction1 = new Transaction();
    transaction1.debitAccount = voucherAccount.toReference();
    transaction1.creditAccount = someAccount.toReference();

    const transaction2 = new Transaction();
    transaction2.debitAccount = someAccount.toReference();
    transaction2.creditAccount = voucherAccount.toReference();

    const transaction3 = new Transaction();
    transaction3.debitAccount = someAccount.toReference();
    transaction3.creditAccount = someOtherAccount.toReference();

    // Persist entities and clear
    orm.em.persist([voucher, voucherAccount, someAccount, transaction1, transaction2, transaction3]);
    await orm.em.flush();
    orm.em.clear();

    const filter = { $or: [{ creditAccount: { voucher: { id: voucher.id } } }, { debitAccount: { voucher: { id: voucher.id } } }] };

    const [transactions, total] = await orm.em.getRepository(Transaction).findAndCount(filter);
    expect(transactions).toHaveLength(2);
    expect(total).toBe(2);
  });

});
