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
    await orm.em.fork().persistAndFlush(garage);

    const g = await orm.em.findOneOrFail(Garage, garage, { populate: ['cars', 'vehicles'] });
    const c = await orm.em.findOneOrFail(Car, car);
    expect(g.cars.contains(c)).toBe(true);
    expect(g.vehicles.contains(c)).toBe(true);
  });
});


class BaseEntity {

  constructor(data = {}) {
    Object.assign(this, data);
  }

  @PrimaryKey()
  _id = +new Date() + Math.random();

}

@Entity({ tableName: 'basket' })
class Basket extends BaseEntity {

  @OneToMany(() => Apple, f => f.basket)
  apples = new Collection<Apple>(this);

  @OneToMany(() => Banana, f => f.basket)
  bananas = new Collection<Banana>(this);

}

@Entity({ tableName: 'fruit', discriminatorColumn: 'type', abstract: true })
class Fruit extends BaseEntity  {

  @ManyToOne(() => Basket)
  basket!: Basket;

}

@Entity({ discriminatorValue: 'apple' })
class Apple extends Fruit {}

@Entity({ discriminatorValue: 'banana' })
class Banana extends Fruit {}

describe('GH issue 2371 (M)', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Fruit, Apple, Banana, Basket],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  it('should propagate setting m:1 property to matching collections only', async () => {
    const basket = new Basket({});
    const apple = new Apple({ basket });

    expect(basket.apples.contains(apple)).toBe(true);
    expect(basket.bananas.contains(apple)).toBe(false);
    expect(basket.bananas.length).toBe(0);

    await orm.em.fork().persistAndFlush(basket);

    const b = await orm.em.findOneOrFail(Basket, { _id: basket._id }, { populate: ['apples', 'bananas'] });
    const a = await orm.em.findOneOrFail(Apple, { _id: apple._id });
    expect(b.apples.contains(a)).toBe(true);
    expect(b.bananas.contains(a)).toBe(false);
    expect(b.bananas.length).toBe(0);

  });
});
