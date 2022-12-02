import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Contract {

  @PrimaryKey()
  id!: number;

  @ManyToOne('Customer')
  customer!: any;

}

@Entity()
export class Customer {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Contract, contract => contract.customer)
  contracts = new Collection<Contract>(this);

  @ManyToOne({ entity: 'Customer', nullable: true })
  parentCustomer?: Customer;

  @OneToMany(() => Customer, customer => customer.parentCustomer)
  childCustomers = new Collection<Customer>(this);

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Contract, Customer],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3490`, async () => {
  const c = orm.em.create(Contract, {
    id: 1,
    customer: {
      childCustomers: [
        {
          contracts: [
            { id: 2 },
            { id: 3 },
            { id: 4 },
          ],
        },
      ],
    },
  });
  await orm.em.persist(c).flush();
  orm.em.clear();

  const contract = await orm.em.findOneOrFail(Contract, c.id,
    { populate: ['customer.childCustomers.contracts'] },
  );

  expect(contract.customer.childCustomers[0].contracts).toHaveLength(3);
  expect(contract.customer.childCustomers[0].contracts[0].id).toBe(2);
  expect(contract.customer.childCustomers[0].contracts[1].id).toBe(3);
  expect(contract.customer.childCustomers[0].contracts[2].id).toBe(4);
});
