import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, t } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({
  schema: 'accounting',
  tableName: 'account',
})
class Account {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @ManyToMany({ entity: () => Customer, mappedBy: c => c.accounts })
  customers: Collection<Customer> = new Collection<Customer>(this);

  @ManyToMany({ entity: () => Company, mappedBy: c => c.accounts })
  companies: Collection<Company> = new Collection<Company>(this);

}

@Entity({
  schema: 'accounting',
  tableName: 'customer',
})
class Customer {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property()
  name!: string;

  @ManyToMany({
    entity: () => Account,
    pivotTable: 'accounting.customer_account',
    joinColumn: 'customer_id',
    inverseJoinColumn: 'account_id',
  })
  accounts = new Collection<Account>(this);

}

@Entity({
  schema: 'accounting',
  tableName: 'company',
})
class Company {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property()
  name!: string;

  @ManyToMany({
    entity: () => Account,
    pivotTable: 'accounting.company_account',
    joinColumn: 'company_id',
    inverseJoinColumn: 'account_id',
  })
  accounts = new Collection<Account>(this);

}

describe('GH issue 2919', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Account, Customer, Company],
      dbName: 'mikro_orm_test_2919',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2919`, async () => {
    const customer = new Customer();
    customer.name = 'Customer 1';
    customer.accounts.add(new Account(), new Account());
    orm.em.persist(customer);

    const company = new Company();
    company.name = 'Company 1';
    company.accounts.add(new Account());
    await orm.em.fork().persist([customer, company]).flush();

    const companyAccounts = await orm.em.find(Account, {
      companies: { name: 'Company 1' },
    });
    expect(companyAccounts).toHaveLength(1);
  });

});
