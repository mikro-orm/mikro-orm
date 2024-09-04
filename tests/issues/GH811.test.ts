import { Entity, helper, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

@Entity()
class Address {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

}

@Entity()
class Contact {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'timestamptz' })
  created = new Date();

  @OneToOne({ type: Address, nullable: true })
  address?: Address;

}

@Entity()
class Employee {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

  @OneToOne({ type: Contact, nullable: true })
  contact?: Contact;

}

describe('GH issue 811', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Contact, Employee, Address],
      dbName: 'mikro_orm_test_gh811',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('loading entity will not cascade merge new entities in the entity graph', async () => {
    // Create a Contact and an Employee
    const contactCreate = orm.em.create(Contact, {
      name: 'My Contact',
      created: '2024-09-04T08:24:05.672Z',
    });
    const employeeCreate = new Employee();
    employeeCreate.name = 'My Employee';
    employeeCreate.contact = contactCreate;
    expect(contactCreate.created).toBeInstanceOf(Date);
    expect(contactCreate.created.toISOString()).toBe('2024-09-04T08:24:05.672Z');

    // Persist entities
    orm.em.persist(contactCreate);
    orm.em.persist(employeeCreate);

    // Flush and then clear the identity map
    await orm.em.flush();
    orm.em.clear();

    // Find my contact previously created
    const contact = await orm.em.findOneOrFail(Contact, contactCreate.id);

    // Create a new address and persist it
    const address = new Address();
    address.name = 'My Address';
    orm.em.persist(address);

    // Assign the created address to the contact
    contact.address = address;

    // Find my previously created employee
    expect(orm.em.getUnitOfWork().getIdentityMap().values().map(e => helper(e).__originalEntityData)).toEqual([
      { id: contact.id, name: 'My Contact', address: null, created: expect.any(Date) },
      undefined,
    ]);
    const employee = await orm.em.findOneOrFail(Employee, employeeCreate.id);

    // previously the `Employee.contact.address` was accidentally cascade merged
    expect(orm.em.getUnitOfWork().getIdentityMap().values().map(e => helper(e).__originalEntityData).filter(Boolean)).toEqual([
      { id: contact.id, name: 'My Contact', address: null, created: expect.any(Date) },
      { id: employee.id, contact: contact.id, name: 'My Employee' },
    ]);
    await orm.em.flush();

    expect(employee).toBeInstanceOf(Employee);
  });

});
