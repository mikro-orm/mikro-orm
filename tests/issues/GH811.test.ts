import { Entity, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

@Entity()
export class Address {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

}

@Entity()
export class Contact {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

  @OneToOne({ type: Address, nullable: true })
  address?: Address;

}

@Entity()
export class Employee {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string' })
  name!: string;

  @OneToOne({ type: Contact, nullable: true })
  contact?: Contact;

}

describe('GH issue 811', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Contact, Employee, Address],
      dbName: 'mikro_orm_test_gh811',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('loading entity will not cascade merge new entities in the entity graph', async () => {
    // Create a Contact and an Employee
    const contactCreate = new Contact();
    contactCreate.name = 'My Contact';
    const employeeCreate = new Employee();
    employeeCreate.name = 'My Employee';
    employeeCreate.contact = contactCreate;

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
    expect(orm.em.getUnitOfWork().getOriginalEntityData()).toEqual([
      { id: contact.id, name: 'My Contact', address: null },
    ]);
    const employee = await orm.em.findOneOrFail(Employee, employeeCreate.id);

    // previously the `Employee.contact.address` was accidentally cascade merged
    expect(orm.em.getUnitOfWork().getOriginalEntityData()).toEqual([
      { id: contact.id, name: 'My Contact', address: null },
      { id: employee.id, contact: contact.id, name: 'My Employee' },
    ]);
    await orm.em.flush();

    expect(employee).toBeInstanceOf(Employee);
  });

});
