import { MikroORM, Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Department {

  @PrimaryKey()
  public id!: number;

  @Property()
  public name!: string;

}

@Entity()
class Person {

  @PrimaryKey()
  public id!: number;

  @Property()
  public name!: string;

}

@Entity()
class Employee {

  @PrimaryKey()
  public id!: number;

  @ManyToOne({ onDelete: 'cascade' })
  public department!: Department;

  @ManyToOne({ onDelete: 'cascade' })
  public person!: Person;

}

describe('GH issue 4863', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Department, Person, Employee],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('insert reference object after deleting it', async () => {
    const em = orm.em.fork();

    const dep = new Department();
    dep.name = 'Department';
    await em.persistAndFlush(dep); // here we create department

    const per = new Person();
    per.name = 'Person';
    await em.persistAndFlush(per); // here we create person

    const emp = new Employee();
    emp.department = dep;
    emp.person = per;
    await em.persistAndFlush(emp); // here we create employee

    await em.removeAndFlush(dep); // here we remove department and owned employee

    per.name = 'New Person';
    await em.persistAndFlush(per); // here we update person
    await em.removeAndFlush(per); // here we remove person

    const departments = await em.find(Department, {});
    const people = await em.find(Person, {});
    const employees = await em.find(Employee, {});

    expect(departments.length).toBe(0);
    expect(people.length).toBe(0);
    expect(employees.length).toBe(0);
  });
});
