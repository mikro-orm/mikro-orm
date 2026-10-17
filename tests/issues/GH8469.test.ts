import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
abstract class Party {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
abstract class Principal extends Party {
  @ManyToMany(() => Party)
  associates = new Collection<Party>(this);
}

@Entity()
class User extends Principal {
  @Property({ nullable: true })
  email?: string;
}

@Entity()
class Employee extends Principal {
  @Property({ nullable: true })
  title?: string;
}

@Entity()
class Contact extends Party {
  @Property({ nullable: true })
  phone?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Party, Principal, User, Employee, Contact],
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('M:N declared on an intermediate TPT entity uses one pivot table with separate columns', async () => {
  const meta = orm.getMetadata();
  const principal = meta.get(Principal).properties.associates;
  const user = meta.get(User).properties.associates;
  const employee = meta.get(Employee).properties.associates;

  expect(principal.pivotTable).toBe('principal_associates');
  expect(principal.joinColumns).toEqual(['principal_id']);
  expect(principal.inverseJoinColumns).toEqual(['party_id']);
  expect(user.pivotTable).toBe(principal.pivotTable);
  expect(employee.pivotTable).toBe(principal.pivotTable);
  expect(user.joinColumns).toEqual(principal.joinColumns);
  expect(employee.inverseJoinColumns).toEqual(principal.inverseJoinColumns);

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).not.toMatch('user_associates');
  expect(sql).not.toMatch('employee_associates');
});

test('pivot table mapping does not depend on discovery order', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Employee, Contact, Principal, Party],
  });
  const meta = orm2.getMetadata();

  for (const entity of [Principal, User, Employee]) {
    const prop = meta.get(entity).properties.associates;
    expect(prop.pivotTable).toBe('principal_associates');
    expect(prop.joinColumns).toEqual(['principal_id']);
    expect(prop.inverseJoinColumns).toEqual(['party_id']);
  }

  await orm2.close(true);
});

test('M:N declared on an intermediate TPT entity loads the associated entity', async () => {
  const contact = orm.em.create(Contact, { name: 'contact' });
  const user = orm.em.create(User, { name: 'user' });
  const employee = orm.em.create(Employee, { name: 'employee' });
  user.associates.add(contact, employee);
  employee.associates.add(user);
  await orm.em.flush();
  orm.em.clear();

  const u = await orm.em.findOneOrFail(User, user.id, { populate: ['associates'] });
  expect(u.associates.getIdentifiers().sort()).toEqual([contact.id, employee.id].sort());

  const e = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['associates'] });
  expect(e.associates.getIdentifiers()).toEqual([user.id]);

  const p = await orm.em.findOneOrFail(Principal, user.id, { populate: ['associates'] });
  expect(p.associates.getIdentifiers().sort()).toEqual([contact.id, employee.id].sort());
});
