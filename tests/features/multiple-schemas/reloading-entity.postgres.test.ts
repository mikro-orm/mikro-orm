import { Collection, Ref, MikroORM, Reference } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Customer {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({ entity: 'License', mappedBy: 'customer' })
  licenses = new Collection<License>(this);

}

@Entity()
export class License {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Customer, ref: true })
  customer: Ref<Customer>;

  constructor(customer: Customer | Ref<Customer>) {
    this.customer = Reference.create(customer);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Customer, License],
    dbName: 'mikro_orm_test_tmp',
    driver: PostgreSqlDriver,
    schema: 'myschema',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('entity is retrieved from identity map', async () => {
  const customer = new Customer();
  customer.name = 'foo';
  await orm.em.persistAndFlush(customer);
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);

  const check1 = await orm.em.findOneOrFail(Customer, customer.id);
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);
  expect(check1).toBe(customer);
  expect(check1.name).toBe('foo');

  // simulate change in the database from outside
  await orm.em.nativeUpdate(Customer, { id: customer.id }, { name: 'bar' });
  const check2 = await orm.em.findOneOrFail(Customer, customer.id, {
    refresh: true, // will force reloading the values from database
  });
  expect(check2.name).toBe('bar');
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual(['Customer-myschema:1']);
  expect(check2).toBe(customer);
});
