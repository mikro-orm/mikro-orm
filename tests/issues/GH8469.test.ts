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

@Entity({ inheritance: 'tpt', tableName: 'party2' })
abstract class Party2 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Principal2, p => p.associates)
  associatedBy = new Collection<Principal2>(this);
}

@Entity({ tableName: 'principal2' })
abstract class Principal2 extends Party2 {
  @ManyToMany(() => Party2, p => p.associatedBy, { owner: true })
  associates = new Collection<Party2>(this);
}

@Entity({ tableName: 'user2' })
class User2 extends Principal2 {}

@Entity({ tableName: 'contact2' })
class Contact2 extends Party2 {}

test.each([
  [Party2, Principal2, User2, Contact2],
  [Contact2, User2, Principal2, Party2],
])('inverse side inherited by TPT children loads the owners regardless of discovery order', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Party2, Principal2, User2, Contact2]) {
    expect(orm2.getMetadata().get(entity).properties.associatedBy.inverseJoinColumns).toEqual(['principal2_id']);
  }

  const em = orm2.em.fork();
  const contact = em.create(Contact2, { name: 'contact' });
  const user = em.create(User2, { name: 'user' });
  user.associates.add(contact);
  await em.flush();
  em.clear();

  const c = await em.findOneOrFail(Contact2, contact.id, { populate: ['associatedBy'] });
  expect(c.associatedBy.getIdentifiers()).toEqual([user.id]);

  await orm2.close(true);
});

@Entity({ tableName: 'label3' })
class Label3 {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'special_label3' })
class SpecialLabel3 {
  @PrimaryKey()
  id!: number;
}

@Entity({ inheritance: 'tpt', tableName: 'item3' })
abstract class Item3 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Label3)
  labels = new Collection<Label3 | SpecialLabel3>(this);
}

@Entity({ tableName: 'book3' })
class Book3 extends Item3 {
  @ManyToMany(() => SpecialLabel3)
  declare labels: Collection<SpecialLabel3>;
}

test('TPT subclass redeclaring an M:N with another target keeps its own pivot table', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Label3, SpecialLabel3, Item3, Book3],
  });
  const meta = orm2.getMetadata();

  expect(meta.get(Item3).properties.labels.pivotTable).toBe('item3_labels');
  expect(meta.get(Book3).properties.labels.pivotTable).toBe('book3_labels');

  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'animal4' })
abstract class Animal4 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Cat4, c => c.fans, { owner: true })
  favoriteCats = new Collection<Cat4>(this);
}

@Entity({ tableName: 'dog4' })
class Dog4 extends Animal4 {}

@Entity({ tableName: 'cat4' })
class Cat4 extends Animal4 {
  @ManyToMany(() => Animal4, a => a.favoriteCats)
  fans = new Collection<Animal4>(this);
}

test.each([
  [Animal4, Dog4, Cat4],
  [Cat4, Dog4, Animal4],
])('M:N declared on the TPT root targeting a subclass uses separate columns', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Animal4, Dog4, Cat4]) {
    const prop = orm2.getMetadata().get(entity).properties.favoriteCats;
    expect(prop.pivotTable).toBe('animal4_favorite_cats');
    expect(prop.joinColumns).toEqual(['animal4_id']);
    expect(prop.inverseJoinColumns).toEqual(['cat4_id']);
  }

  const em = orm2.em.fork();
  const dog = em.create(Dog4, {});
  const cat = em.create(Cat4, {});
  dog.favoriteCats.add(cat);
  await em.flush();
  em.clear();

  const a = await em.findOneOrFail(Animal4, dog.id, { populate: ['favoriteCats'] });
  expect(a.favoriteCats.getIdentifiers()).toEqual([cat.id]);
  const c = await em.findOneOrFail(Cat4, cat.id, { populate: ['fans'] });
  expect(c.fans.getIdentifiers()).toEqual([dog.id]);

  await orm2.close(true);
});
