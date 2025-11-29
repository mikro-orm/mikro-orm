import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { BaseEntity, Collection } from '@mikro-orm/core';

@Entity()
export class Car extends BaseEntity {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class User extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Car)
  car!: Car;

  @ManyToMany(() => Car)
  cars = new Collection<Car>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    driver: SqliteDriver,
    dbName: ':memory:',
    entities: [User, Car],
  });
  await orm.schema.createSchema();
});

afterAll(async () => await orm.close());

test('assign relation on not managed entity', async () => {
  const user = new User();
  const car = new Car();
  user.assign({ car, cars: [car] });
  user.assign({ cars: new Car() });
  expect(user.car).toBe(car);
  expect(user.cars).toHaveLength(2);

  await orm.em.persist(user).flush();
  expect(user.id).toBeDefined();
  expect(user.cars[0].id).toBeDefined();
  expect(user.cars[1].id).toBeDefined();
});
