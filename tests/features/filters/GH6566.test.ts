import { Collection, MikroORM } from '@mikro-orm/postgresql';

import { Entity, Filter, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
class BaseClass {

  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property()
  name!: string;

}

@Entity()
class Application extends BaseClass {
}

@Filter({
  name: 'contact',
  cond(_, type) {
    if (type === 'read') {
      return { application: '1' };
    }

    return {};
  },
  default: true,
  args: false,
})
@Entity()
class Customer extends BaseClass {

  @ManyToOne(() => Application)
  application!: Application;

  @OneToMany({ entity: () => Contact, mappedBy: contact => contact.customer })
  contacts = new Collection<Contact>(this);

}

@Filter({
  name: 'contact',
  cond(_, type) {
    if (type === 'read') {
      return { customer: { application: '1' } };
    }

    return {};
  },
  default: true,
  args: false,
})
@Entity()
class Contact extends BaseClass {

  @ManyToOne(() => Customer)
  customer!: Customer;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Application, Customer, Contact],
    loadStrategy: 'select-in',
    dbName: '6566',
  });
  await orm.schema.refreshDatabase();

  await orm.em.insert(Application, { id: '1', name: 'Application 1' });
  await orm.em.insert(Customer, { id: '1', name: 'Customer 1', application: '1' });
  await orm.em.insert(Contact, { id: '1', name: 'Contact 1', customer: '1' });
});

afterAll(() => orm.close(true));

test('6566', async () => {
  const customersFromApp1 = await orm.em.fork().findAll(Customer, { orderBy: { name: 'asc' } });
  expect(customersFromApp1.length).toBe(1);

  const contactsFromApp1 = await orm.em.fork().findAll(Contact, { orderBy: { name: 'asc' } });
  expect(contactsFromApp1.length).toBe(1);

  const customersFromApp1WithPopulate = await orm.em.fork().findAll(Customer, {
    populate: ['contacts'],
    where: { contacts: { name: 'Contact 1' } },
  });
  expect(customersFromApp1WithPopulate.length).toBe(1);
});
