import { Entity, OneToOne, OptionalProps, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

abstract class CustomBaseEntity<Optional = never> {

  [OptionalProps]?: Optional | 'createdAt' | 'updatedAt' | 'version';

  @PrimaryKey()
  id: string = v4();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ version: true })
  version!: number;

}

@Entity()
class CarEntity extends CustomBaseEntity {

  @Property()
  brand!: string;

  @OneToOne({ nullable: true, entity: () => DriverEntity })
  driver?: Rel<DriverEntity>;

}

@Entity()
class DriverEntity extends CustomBaseEntity {

  @OneToOne(() => CarEntity, car => car.driver, { orphanRemoval: true })
  car!: CarEntity;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [DriverEntity],
    dbName: '4497',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('persisting 1:1 relation issue (#4497)', async () => {
  const car = orm.em.create(CarEntity, { brand: 'skoda' });
  await orm.em.flush();

  const driver = orm.em.create(DriverEntity, { name: 'John Doe', car });
  expect(car.driver).toBe(driver);
  await orm.em.flush();

  const foundCar = await orm.em.findOneOrFail(CarEntity, { id: car.id });
  expect(foundCar).toBe(car);
  expect(foundCar.driver).not.toBeNull();
});
