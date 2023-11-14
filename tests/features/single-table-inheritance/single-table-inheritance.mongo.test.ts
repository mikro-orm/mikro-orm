import { Entity, MikroORM, PrimaryKey, Property, ObjectId } from '@mikro-orm/mongodb';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    person: 'Person',
    employee: 'Employee',
  },
})
class Person {

  @PrimaryKey()
  _id!: ObjectId;

}

@Entity()
class Employee extends Person {

  @Property()
  number?: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Person, Employee],
    dbName: 'sti1',
  });

  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('single table inheritance in mongo', async () => {
  const e1 = new Employee();
  e1.number = 123;
  await orm.em.insert(e1);
  const [e] = await orm.em.find(Employee, { number: 123 });
  expect(e).toBeInstanceOf(Employee);
});
