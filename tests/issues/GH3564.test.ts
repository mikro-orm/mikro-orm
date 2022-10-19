import {
  Collection,
  Entity,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Part {

  @PrimaryKey()
  id!: number;

  @Property()
  public value!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne(() => Car, {
    wrappedReference: true,
    nullable: true,
  })
  public car?: IdentifiedReference<Car>;

  @ManyToOne(() => Part, {
    wrappedReference: true,
    nullable: true,
  })
  part?: Part;

  @OneToMany(() => Part, fV => fV.part, {
    orphanRemoval: true,
    eager: true,
  })
  parts = new Collection<Part>(this);

}

@Entity()
class Car {

  @PrimaryKey()
  id!: number;

  @Property()
  public name!: string;

  @OneToMany(() => Part, fV => fV.car, {
    eager: true,
    orphanRemoval: true,
  })
  parts = new Collection<Part>(this);

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Car, Part],
    dbName: ':memory:',
    type: 'sqlite',
  });
  await orm.getSchemaGenerator().ensureDatabase();
  await orm.getSchemaGenerator().dropSchema();
  await orm.getSchemaGenerator().createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

describe(`GH issue 3564`, () => {
  const createCar = async () => {
    const car = orm.em.create(Car, {
      name: 'Tesla',
      parts: [
        {
          value: 'Battery',
          parts: [{
            value: 'Electrode',
          }],
        },
        {
          value: 'Electrolyte',
        },
      ],
    });
    await orm.em.persist(car).flush();
    return car;
  };

  test(`Using remove and add`, async () => {
    const car = await createCar();
    const electrolytePart = car.parts.getItems()[1];
    car.parts.remove(electrolytePart); // remove part 'Electrolyte' from car 'Tesla'
    car.parts.getItems()[0].parts.add(electrolytePart); // add part 'Electrolyte' to part 'Battery'
    await orm.em.flush();

    await orm.em.refresh(car);

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts.getItems()[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });

  test(`Using collection set`, async () => {
    const car = await createCar();
    const batteryPart = car.parts.getItems()[0];
    const electrodePart = batteryPart.parts.getItems()[0];
    const electrolytePart = car.parts.getItems()[1];
    car.parts.set([batteryPart]); // set Battery only and thus remove part 'Electrolyte' from car 'Tesla'
    batteryPart.parts.set([electrolytePart, electrodePart]); // add part 'Electrolyte' to part 'Battery'
    await orm.em.flush();

    await orm.em.refresh(car);

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts.getItems()[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });

  test(`Using assign`, async () => {
    const car = await createCar();

    const batteryPart = car.parts.getItems()[0];
    const electrodePart = batteryPart.parts.getItems()[0];
    const electrolytePart = car.parts.getItems()[1];

    orm.em.assign(car, {
      id: car.id,
      name: car.name,
      parts: [{
        id: batteryPart.id,
        value: batteryPart.value,
        parts: [{
          id: electrodePart.id,
          value: electrodePart.value,
        },{
          id: electrolytePart.id,
          value: electrolytePart.value,
        }],
      }],
    });
    await orm.em.flush();

    await orm.em.refresh(car);

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts.getItems()[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });
});
