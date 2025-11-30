import { Collection, LoadStrategy } from '@mikro-orm/core';
import { Entity, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Car)
  cars = new Collection<Car>(this);

}

@Entity()
class Car {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => User, u => u.cars)
  users = new Collection<User>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('loading M:N via em.populate from inverse side with joined strategy', async () => {
  const u1 = orm.em.create(User, {});
  const u2 = orm.em.create(User, {});
  const c1 = orm.em.create(Car, {});
  const c2 = orm.em.create(Car, {});
  u1.cars.add(c1);
  u1.cars.add(c2);
  u2.cars.add(c1);
  u2.cars.add(c2);
  await orm.em.flush();
  orm.em.clear();

  const cars = await orm.em.find(Car, {});
  await orm.em.populate(cars, ['users']);

  expect(cars[0].users.toArray()).toEqual([
    { id: 1 },
    { id: 2 },
  ]);
  expect(cars[1].users.toArray()).toEqual([
    { id: 1 },
    { id: 2 },
  ]);
});
