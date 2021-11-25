import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'vehicle', discriminatorColumn: 'type', abstract: true })
class Vehicle {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne(() => Garage, { wrappedReference: true })
  garage!: IdentifiedReference<Garage>;

}

@Entity({ discriminatorValue: 'car' })
class Car extends Vehicle {}

@Entity({ discriminatorValue: 'truck' })
class Truck extends Vehicle {}

@Entity({ tableName: 'garage' })
class Garage {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Vehicle, v => v.garage)
  vehicles = new Collection<Vehicle>(this);

  @OneToMany(() => Car, v => v.garage)
  cars = new Collection<Car>(this);

}

describe('GH issue 2371', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Car, Vehicle, Truck, Garage],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should propagate setting m:1 property to all matching collections', async () => {
    const garage = orm.em.create(Garage, {});
    const car = orm.em.create(Car, { garage });

    expect(garage.cars.contains(car)).toBe(true);
    expect(garage.vehicles.contains(car)).toBe(true);
    await orm.em.fork().persistAndFlush(garage);

    const g = await orm.em.findOneOrFail(Garage, garage, { populate: ['cars', 'vehicles'] });
    const c = await orm.em.findOneOrFail(Car, car);
    expect(g.cars.contains(c)).toBe(true);
    expect(g.vehicles.contains(c)).toBe(true);
  });

});
