import { CheckConstraintViolationException, MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Check, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', discriminatorMap: { car: 'Car', truck: 'Truck' } })
class Vehicle {
  @PrimaryKey()
  id!: number;

  @Property()
  type!: Opt<string>;
}

@Entity()
class Car extends Vehicle {
  @Check({ expression: 'length(vin) = 17' })
  @Property({ nullable: true })
  vin?: string;
}

@Entity()
class Truck extends Vehicle {
  @Property({ nullable: true })
  payload?: number;
}

describe('GH issue 8687', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Vehicle, Car, Truck],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('property-level check on a child-only STI property', async () => {
    const check = { name: 'vehicle_vin_check', property: 'vin', expression: 'length(vin) = 17' };
    expect(orm.getMetadata(Vehicle).checks).toEqual([check]);
    expect(orm.getMetadata(Car).checks).toEqual([check]);
    expect(orm.getMetadata(Truck).checks).toEqual([]);

    await expect(orm.schema.getCreateSchemaSQL()).resolves.toContain('`vin` text check (length(vin) = 17) null');

    orm.em.create(Truck, { payload: 1 });
    await orm.em.flush();
    orm.em.create(Car, { vin: 'short' });
    await expect(orm.em.flush()).rejects.toThrow(CheckConstraintViolationException);
  });
});
