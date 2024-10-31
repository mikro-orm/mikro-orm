import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/mssql';

@Entity()
class Client {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => EmployeeClients, employee => employee.client)
  employeeClients = new Collection<EmployeeClients>(this);

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class EmployeeClients {

  [PrimaryKeyProp]?: ['client', 'employee'];

  @ManyToOne({ entity: () => Client, primary: true })
  client!: Client;

  @ManyToOne({ entity: () => Employee, primary: true })
  employee!: Employee;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6204',
    password: 'Root.Root',
    entities: [Client, Employee, EmployeeClients],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6204', async () => {
  orm.em.create(Client, {
    id: 1,
    name: 'The client',
  });

  orm.em.create(Employee, {
    id: 1,
    name: 'The employee',
  });

  orm.em.create(EmployeeClients, {
    employee: 1,
    client: 1,
  });

  await orm.em.flush();
  orm.em.clear();

  const find = await orm.em.find(EmployeeClients, { client: 1, employee: 1 });
  orm.em.remove(find);
  await orm.em.flush();
});
