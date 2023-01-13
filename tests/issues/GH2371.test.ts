import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'vehicle', discriminatorColumn: 'type', abstract: true })
class Vehicle {

  @PrimaryKey()
  id!: number;

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

  @OneToMany(() => Truck, v => v.garage)
  trucks = new Collection<Truck>(this);

}

describe('GH issue 2371', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Car, Vehicle, Truck, Garage],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('should propagate setting m:1 property to all matching collections', async () => {
    const garage = orm.em.create(Garage, {});
    const car = orm.em.create(Car, { garage });

    expect(garage.cars.contains(car)).toBe(true);
    expect(garage.vehicles.contains(car)).toBe(true);
    expect(garage.trucks.length).toBe(0);
    await orm.em.fork().persistAndFlush(garage);

    const g = await orm.em.findOneOrFail(Garage, garage, { populate: ['cars', 'vehicles', 'trucks'] });
    const c = await orm.em.findOneOrFail(Car, car);
    expect(g.cars.contains(c)).toBe(true);
    expect(g.vehicles.contains(c)).toBe(true);
    expect(g.trucks.length).toBe(0);
  });
});
