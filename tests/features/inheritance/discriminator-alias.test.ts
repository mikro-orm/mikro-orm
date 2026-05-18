import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { SqliteDriver } from '@mikro-orm/sqlite';

// the `discriminator` option is an alias for `discriminatorColumn` (deprecated on `@Embeddable`,
// non-deprecated on `@Entity`). `discriminator` is a property name on the class; the underlying
// column name is derived via the naming strategy (camelCase -> snake_case by default).

@Embeddable({ abstract: true, discriminator: 'animalType' })
abstract class Animal {
  @Property({ type: 'string' })
  animalType!: string;

  @Property({ type: 'string' })
  name!: string;
}

@Embeddable({ discriminatorValue: 'cat' })
class Cat extends Animal {}

@Embeddable({ discriminatorValue: 'dog' })
class Dog extends Animal {}

@Entity({ abstract: true, discriminator: 'vehicleType' })
abstract class Vehicle {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  vehicleType!: string;

  @Property({ type: 'string' })
  brand!: string;
}

@Entity({ discriminatorValue: 'car' })
class Car extends Vehicle {}

@Entity({ discriminatorValue: 'bike' })
class Bike extends Vehicle {}

@Entity()
class Owner {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Cat, Dog, Animal, Owner, Vehicle, Car, Bike],
    dbName: ':memory:',
    driver: SqliteDriver,
    metadataCache: { enabled: false },
  });
});

afterAll(async () => orm.close());

test('`discriminator` is honored as an alias for `discriminatorColumn` on @Embeddable', () => {
  const root = orm.getMetadata().get(Cat).root;
  expect(root.discriminatorColumn).toBe('animalType');
  // the discriminator property gets a snake_case column name via the naming strategy
  expect(root.properties.animalType.fieldNames).toEqual(['animal_type']);
});

test('`discriminator` is honored as an alias for `discriminatorColumn` on @Entity (STI)', () => {
  const root = orm.getMetadata().get(Car).root;
  expect(root.discriminatorColumn).toBe('vehicleType');
  expect(root.properties.vehicleType.fieldNames).toEqual(['vehicle_type']);
});

test('`discriminatorColumn` overrides the column name when `discriminator` is also set', async () => {
  @Entity({ abstract: true, discriminator: 'kind', discriminatorColumn: 'kind_col' })
  abstract class Pet {
    @PrimaryKey({ type: 'integer' })
    id!: number;
  }

  @Entity({ discriminatorValue: 'cat' })
  class PetCat extends Pet {}

  @Entity({ discriminatorValue: 'fish' })
  class PetFish extends Pet {}

  const localOrm = await MikroORM.init({
    entities: [Pet, PetCat, PetFish],
    dbName: ':memory:',
    driver: SqliteDriver,
    metadataCache: { enabled: false },
  });

  // property is `kind`, column is the explicit override `kind_col`
  const root = localOrm.getMetadata().get(PetCat).root;
  expect(root.discriminatorColumn).toBe('kind');
  expect((root.properties as Record<string, { fieldNames: string[] }>).kind.fieldNames).toEqual(['kind_col']);

  await localOrm.close();
});

test('`discriminator` narrows STI variants in `defineEntity` like `discriminatorColumn` does', async () => {
  const BaseSchema = defineEntity({
    name: 'BasePerson',
    abstract: true,
    // captured as a literal type so children form a discriminated union narrowed
    // to their `discriminatorValue` (GH #7677) — same as `discriminatorColumn`.
    discriminator: 'type',
    properties: {
      id: p.integer().primary(),
      type: p.enum(['person', 'employee'] as const),
    },
  });
  class BasePerson extends BaseSchema.class {}
  BaseSchema.setClass(BasePerson);

  const PersonSchema = defineEntity({
    name: 'Person',
    extends: BasePerson,
    discriminatorValue: 'person',
    properties: {},
  });
  class Person extends PersonSchema.class {}
  PersonSchema.setClass(Person);

  const EmployeeSchema = defineEntity({
    name: 'Employee',
    extends: BasePerson,
    discriminatorValue: 'employee',
    properties: {
      salary: p.integer(),
    },
  });
  class Employee extends EmployeeSchema.class {}
  EmployeeSchema.setClass(Employee);

  const localOrm = await MikroORM.init({
    entities: [BasePerson, Person, Employee],
    dbName: ':memory:',
  });

  expect(localOrm.getMetadata().get(Person).root.discriminatorColumn).toBe('type');

  await localOrm.close();
});
