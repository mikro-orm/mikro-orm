import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
abstract class BaseUser {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

}

@Entity()
class Employee extends BaseUser {

  @Property()
  employeeProp!: number;

}

@Entity()
class Manager extends BaseUser {

  @Property()
  managerProp!: string;

}

@Entity()
class CompanyOwner extends Manager {

  @Property()
  ownerProp!: string;

}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    person: 'Person',
    employee: 'Employee2',
  },
})
class Person {

  @PrimaryKey()
  _id!: ObjectId;

}

@Entity()
class Employee2 extends Person {

  @Property()
  number?: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Employee, Manager, CompanyOwner, Employee2, Person],
    dbName: 'sti1',
  });
});

afterAll(() => orm.close(true));

test('single table inheritance in mongo 1', async () => {
  const e1 = new Manager();
  e1.firstName = 'f';
  e1.lastName = 'l';
  e1.managerProp = '123';
  await orm.em.insert(e1);
  const [e] = await orm.em.find(Manager, {});
  expect(e).toBeInstanceOf(Manager);
});

test('single table inheritance in mongo 2', async () => {
  const e1 = new Employee2();
  e1.number = 123;
  await orm.em.insert(e1);
  const [e] = await orm.em.find(Person, {});
  expect(e).toBeInstanceOf(Employee2);
});
