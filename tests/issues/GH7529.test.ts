import { Ref } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// GH #7529 - Populate of TPT leaf not working if previously unpopulated in the identity map

@Entity()
class Address7529 {
  @PrimaryKey()
  id!: number;

  @Property()
  street!: string;
}

@Entity({ inheritance: 'tpt' })
abstract class Person7529 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Employee7529 extends Person7529 {
  @Property()
  department!: string;

  @OneToOne(() => Address7529, { ref: true, nullable: true, owner: true })
  address?: Ref<Address7529>;
}

@Entity()
class Report7529 {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Person7529, { ref: true })
  author!: Ref<Person7529>;
}

test('GH #7529 - TPT leaf relations populated when entity already in identity map', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Address7529, Person7529, Employee7529, Report7529],
  });
  await orm.schema.create();

  // Seed data
  const address = orm.em.create(Address7529, { street: '123 Main St' });
  const employee = orm.em.create(Employee7529, {
    name: 'John Doe',
    department: 'Engineering',
    address,
  });
  orm.em.create(Report7529, { title: 'Q1 Report', author: employee });
  await orm.em.flush();

  const em = orm.em.fork();

  // Load the Person first WITHOUT populate — puts it in the identity map as initialized,
  // but its child relations (address) are not populated.
  const person = await em.findOne(Person7529, { id: employee.id });
  expect(person).toBeInstanceOf(Employee7529);
  // address should be a reference but not initialized
  expect((person as Employee7529).address!.isInitialized()).toBe(false);

  // Now load a Report with populate: ['*'] — should fully populate the author (TPT entity)
  // including the child-specific address relation.
  const report = await em.findOne(Report7529, { id: 1 }, { populate: ['*'] });
  expect(report).toBeDefined();
  expect(report!.author.unwrap()).toBe(person); // same identity map entity
  expect((report!.author.unwrap() as Employee7529).address!.isInitialized()).toBe(true);
  expect((report!.author.unwrap() as Employee7529).address!.unwrap().street).toBe('123 Main St');

  await orm.close();
});
