import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Department {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ deleteRule: 'cascade' })
  department!: Department;

  @ManyToOne({ deleteRule: 'cascade' })
  person!: Person;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Department, Person, Employee],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('insert reference object after deleting it', async () => {
  const em = orm.em.fork();

  const department = new Department();
  department.name = 'Department';
  await em.persistAndFlush(department); // here we create department

  const person = new Person();
  person.name = 'Person';
  await em.persistAndFlush(person); // here we create person

  const employee = new Employee();
  employee.department = department;
  employee.person = person;
  await em.persistAndFlush(employee); // here we create employee
  await em.removeAndFlush(department); // here we remove department and owned employee

  person.name = 'New Person';
  await em.persistAndFlush(person); // here we update person
  await em.removeAndFlush(person); // here we remove person
  orm.em.clear();

  const departments = await em.find(Department, {});
  const people = await em.find(Person, {});
  const employees = await em.find(Employee, {});

  expect(departments.length).toBe(0);
  expect(people.length).toBe(0);
  expect(employees.length).toBe(0);
});
