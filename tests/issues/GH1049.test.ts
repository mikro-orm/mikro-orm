import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { MongoDriver, ObjectId } from '@mikro-orm/mongodb';

abstract class Animal {

  @Property()
  legs!: number;

  protected constructor(legs?: number) {
    if (legs) { this.legs = legs; }
  }

}

abstract class Pet extends Animal {

  @Property()
  name!: string;

  protected constructor(name?: string, legs?: number) {
    super(legs);
    if (name) { this.name = name; }
  }

}

@Embeddable()
class Dog extends Pet {

  @Property()
  bark = true;

  constructor(name?: string) {
    super(name, 4);
  }

}

abstract class Person {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  protected constructor(name?: string) {
    if (name) { this.name = name; }
  }

}

@Entity()
class Owner extends Person {

  @Embedded({ entity: () => Dog, object: true })
  dog!: Dog;

  constructor(name?: string, dog?: Dog) {
    super(name);
    if (dog) { this.dog = dog; }
  }

}

describe('GH issue 1049', () => {
  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Animal, Pet, Dog, Person, Owner],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test-gh-1049?replicaSet=rs0',
      type: 'mongo',
      validate: true,
    });
  });

  afterAll(async () => {
    await orm.em.getDriver().dropCollections();
    await orm.close(true);
  });

  test('should contain properties from parent class', async () => {
    const dog = new Dog('Doggy');
    const john = new Owner('John', dog);

    await orm.em.persistAndFlush(john);

    expect(john.dog).toBeInstanceOf(Dog);
    expect(john.dog.name).toBe('Doggy');
    expect(john.dog.legs).toBe(4);

    orm.em.clear();
  });

  test('should map properties from parent class', async () => {
    const john = await orm.em.findOneOrFail(Owner, { name: 'John' });

    expect(john.dog).toBeInstanceOf(Dog);
    expect(john.dog.name).toBe('Doggy');
    expect(john.dog.legs).toBe(4);

    orm.em.clear();
  });

  test('should match by parent property', async () => {
    const john = await orm.em.findOneOrFail(Owner, { dog: { name: 'Doggy' } });

    expect(john).not.toBe(null);
    expect(john.dog.name).toBe('Doggy');
    expect(john.dog.legs).toBe(4);

    orm.em.clear();
  });
});
