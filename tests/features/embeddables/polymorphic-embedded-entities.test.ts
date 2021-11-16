import type { ObjectHydrator } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class Animal {

  @Enum(() => AnimalType)
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
class Cat extends Animal {

  @Property({ nullable: true })
  canMeow?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
class Dog extends Animal {

  @Property({ nullable: true })
  canBark?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

}

describe('polymorphic embeddables', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Dog, Cat, Owner],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`schema`, async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    const hydrator = orm.config.getHydrator(orm.getMetadata()) as ObjectHydrator;
    expect(hydrator.getEntityHydrator(orm.getMetadata().get('Owner'), 'full').toString()).toMatchSnapshot();
  });

  // TODO
  //  - test comparator and updates via UoW
  //  - test assigning
  //  - test everything in object mode too
  //  - test everything in mongo too, add sqlite suffix to the test file

  test(`working with polymorphic embeddables`, async () => {
    const ent1 = new Owner();
    ent1.name = 'o1';
    ent1.pet = new Dog('d1');
    expect(ent1.pet).toBeInstanceOf(Dog);
    expect((ent1.pet as Dog).canBark).toBe(true);
    const ent2 = orm.em.create(Owner, {
      name: 'o2',
      pet: { type: AnimalType.CAT, name: 'c1' },
    });
    expect(ent2.pet).toBeInstanceOf(Cat);
    expect((ent2.pet as Cat).canMeow).toBe(true);
    const ent3 = orm.em.create(Owner, {
      name: 'o3',
      pet: { type: AnimalType.DOG, name: 'd2' },
    });
    expect(ent3.pet).toBeInstanceOf(Dog);
    expect((ent3.pet as Dog).canBark).toBe(true);
    await orm.em.persistAndFlush([ent1, ent2, ent3]);
    orm.em.clear();

    const owners = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(owners[0].name).toBe('o1');
    expect(owners[0].pet).toBeInstanceOf(Dog);
    expect(owners[0].pet.name).toBe('d1');
    expect(owners[0].pet.type).toBe(AnimalType.DOG);
    expect((owners[0].pet as Cat).canMeow).toBeNull();
    expect((owners[0].pet as Dog).canBark).toBe(true);
    expect(owners[1].pet).toBeInstanceOf(Cat);
    expect(owners[1].pet.name).toBe('c1');
    expect(owners[1].pet.type).toBe(AnimalType.CAT);
    expect((owners[1].pet as Cat).canMeow).toBe(true);
    expect((owners[1].pet as Dog).canBark).toBeNull();
    expect(owners[2].pet).toBeInstanceOf(Dog);
    expect(owners[2].pet.name).toBe('d2');
  });

});
