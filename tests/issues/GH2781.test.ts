import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Address {

  @PrimaryKey()
  id!: number;

  @Property()
  companyName: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(companyName: string) {
    this.companyName = companyName;
  }

}

@Entity()
export class Customer {

  @PrimaryKey()
  id!: number;

  @Property()
  customerNumber: string;

  @ManyToOne(() => Address)
  companyAddress: Address;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(customerNumber: string, companyAddress: Address) {
    this.customerNumber = customerNumber;
    this.companyAddress = companyAddress;
  }

}

describe('GH issue 2781', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Address, Customer],
      driver: PostgreSqlDriver,
      dbName: 'mikro_orm_test_2781',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2781`, async () => {
    const address1 = new Address('test1');
    const customer = new Customer('100', address1);
    orm.em.persist(customer);
    await orm.em.flush();

    customer.companyAddress = new Address('test2');
    await orm.em.flush();
  });

});
