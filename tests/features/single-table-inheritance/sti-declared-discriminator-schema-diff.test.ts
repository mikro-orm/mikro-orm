import { MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', discriminatorMap: { car: 'Car', truck: 'Truck' } })
class Vehicle {
  @PrimaryKey()
  id!: number;

  @Property()
  type!: Opt<string>;
}

@Entity()
class Car extends Vehicle {
  @Property({ nullable: true })
  vin?: string;
}

@Entity()
class Truck extends Vehicle {
  @Property({ nullable: true })
  payload?: number;
}

describe('STI with explicitly declared non-enum discriminator property', () => {
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

  test('schema diff is empty after creating the schema', async () => {
    await expect(orm.schema.getCreateSchemaSQL()).resolves.toContain('`type` text not null');
    await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');
  });
});
