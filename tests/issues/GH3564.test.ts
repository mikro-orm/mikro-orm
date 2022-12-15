import { Collection, Entity, IdentifiedReference, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Part {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @ManyToOne(() => Car, {
    wrappedReference: true,
    nullable: true,
    onDelete: 'cascade',
  })
  car?: IdentifiedReference<Car>;

  @ManyToOne(() => Part, {
    wrappedReference: true,
    nullable: true,
  })
  part?: IdentifiedReference<Part>;

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
  name!: string;

  @OneToMany(() => Part, fV => fV.car, {
    eager: true,
    orphanRemoval: true,
  })
  parts = new Collection<Part>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Car, Part],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
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
    const electrolyte = car.parts[1];
    car.parts.remove(electrolyte); // remove part 'Electrolyte' from car 'Tesla'
    car.parts[0].parts.add(electrolyte); // add part 'Electrolyte' to part 'Battery'
    await orm.em.flush();

    await orm.em.refresh(car, { populate: true });

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });

  test(`Using collection set`, async () => {
    const car = await createCar();
    const battery = car.parts[0];
    const electrode = battery.parts[0];
    const electrolyte = car.parts[1];
    car.parts.set([battery]); // set Battery only and thus remove part 'Electrolyte' from car 'Tesla'
    battery.parts.set([electrolyte, electrode]); // add part 'Electrolyte' to part 'Battery'
    await orm.em.flush();

    await orm.em.refresh(car, { populate: true });

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });

  test(`Using assign`, async () => {
    const car = await createCar();

    const battery = car.parts[0];
    const electrode = battery.parts[0];
    const electrolyte = car.parts[1];

    orm.em.assign(car, {
      parts: [{
        id: battery.id,
        value: battery.value,
        parts: [{
          id: electrode.id,
          value: electrode.value,
        }, {
          id: electrolyte.id,
          value: electrolyte.value,
        }],
      }],
    });
    await orm.em.flush();
    await orm.em.refresh(car, { populate: true });

    expect(car.parts.count()).toBe(1); // should be one, since we removed the 'Electrolyte'
    expect(car.parts[0].parts.count()).toBe(2); // the part 'Battery' has 2 parts now
  });
});
