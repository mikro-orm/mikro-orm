import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey, Reference } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Customer {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: 'License', mappedBy: 'customer' })
  licenses = new Collection<License>(this);

}

@Entity()
export class License {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Customer, wrappedReference: true })
  customer: IdentifiedReference<Customer>;

  constructor(customer: Customer | IdentifiedReference<Customer>) {
    this.customer = Reference.create(customer);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer, License],
    dbName: 'mikro_orm_test_tmp',
    driver: PostgreSqlDriver,
    schema: 'myschema',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('entity is retrieved from identity map', async () => {
  const customer = new Customer();
  await orm.em.persistAndFlush(customer);
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);

  const check1 = await orm.em.findOneOrFail(Customer, customer.id);
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);
  expect(check1).toBe(customer);

  const check2 = await orm.em.findOneOrFail(Customer, customer.id, { refresh: true });
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);
  expect(check2).toBe(customer);
});
