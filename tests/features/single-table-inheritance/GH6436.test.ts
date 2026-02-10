import { MikroORM, Collection, Opt, ref, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
abstract class BasePerson {
  @PrimaryKey()
  id!: number;

  @Enum()
  type!: ('customer' | 'employee') & Opt;

  @Property()
  name!: string;
}

@Entity({ discriminatorValue: 'customer' })
class Customer extends BasePerson {
  @Property()
  amtMoney!: number;
}

@Entity({ discriminatorValue: 'employee' })
class Employee extends BasePerson {
  @Property()
  hoursWorked!: number;

  @OneToMany(() => Break, b => b.employee)
  breaks = new Collection<Break>(this);
}

@Entity()
class Break {
  @PrimaryKey()
  id!: number;

  @Property()
  time: Date & Opt = new Date();

  @ManyToOne(() => Employee, { ref: true })
  employee!: Ref<Employee>;
}

@Entity()
class Store {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Employee, { ref: true })
  manager!: Ref<Employee>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [BasePerson, Customer, Employee, Break, Store],
  });
  await orm.schema.refresh();

  orm.em.create(Customer, { name: 'Foo', amtMoney: 10 });
  const employee = orm.em.create(Employee, { name: 'Bar', hoursWorked: 8 });
  employee.breaks.add(new Break());

  orm.em.create(Store, {
    name: 'Some Store',
    manager: ref(employee),
  });

  await orm.em.flush();
  orm.em.clear();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('returns proper entities', async () => {
  const people = await orm.em.findAll(BasePerson, {
    orderBy: { id: 1 },
  });
  expect(people[0]).toBeInstanceOf(Customer);
  expect(people[1]).toBeInstanceOf(Employee);
});

test('discriminatorValue is not set when using `fields`; returns BasePerson', async () => {
  const people = await orm.em.findAll(BasePerson, {
    fields: ['name'],
    orderBy: { id: 1 },
  });
  expect(people[0]).toBeInstanceOf(Customer);
  expect(people[1]).toBeInstanceOf(Employee);
});

test('fetching a store with `fields` set fails', async () => {
  const s = await orm.em.findAll(Store, {
    fields: ['name', 'manager.breaks.time'],
  });
});
