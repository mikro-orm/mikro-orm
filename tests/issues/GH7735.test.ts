import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, Enum, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum VehicleType {
  Car = 'car',
  Truck = 'truck',
}

@Entity({
  abstract: true,
  discriminatorColumn: 'type',
  tableName: 'vehicle',
})
abstract class Vehicle {
  @PrimaryKey()
  id!: string;

  @Enum(() => VehicleType)
  type!: VehicleType;

  @ManyToOne(() => Vehicle, { nullable: true })
  predecessor?: Vehicle;

  @Property()
  label!: string;
}

@Entity({ discriminatorValue: VehicleType.Car })
class Car extends Vehicle {
  @Property()
  doors!: number;
}

@Entity({ discriminatorValue: VehicleType.Truck })
class Truck extends Vehicle {
  @Property()
  loadCapacity!: number;
}

describe('GH issue 7735', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Vehicle, Car, Truck],
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();

    const oldCar = orm.em.create(Car, { id: '1', type: VehicleType.Car, label: 'old', doors: 2 });
    orm.em.create(Car, { id: '2', type: VehicleType.Car, label: 'new', doors: 4, predecessor: oldCar });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('user-declared discriminator is hydrated on direct find', async () => {
    const loaded = await orm.em.findOneOrFail(Car, { id: '2' });
    expect(loaded.type).toBe(VehicleType.Car);
  });

  test('user-declared discriminator is hydrated on populated reference', async () => {
    const loaded = await orm.em.findOneOrFail(Car, { id: '2' }, { populate: ['predecessor'] });
    expect(loaded.type).toBe(VehicleType.Car);
    expect(loaded.predecessor!.type).toBe(VehicleType.Car);
  });

  test('user-declared discriminator is hydrated when entity already exists as a reference (mergeData path)', async () => {
    orm.em.clear();
    // pre-populate the identity map with an uninitialized reference so the
    // subsequent find path goes through EntityFactory.mergeData
    orm.em.getReference(Car, '2');
    const loaded = await orm.em.findOneOrFail(Car, { id: '2' }, { populate: ['predecessor'] });
    expect(loaded.type).toBe(VehicleType.Car);
    expect(loaded.predecessor!.type).toBe(VehicleType.Car);
  });
});
