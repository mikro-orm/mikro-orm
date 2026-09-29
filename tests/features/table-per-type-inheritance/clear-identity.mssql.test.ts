import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
abstract class Vehicle {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class Car extends Vehicle {
  @Property({ type: 'integer' })
  doors!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Vehicle, Car],
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_tpt_clear_identity',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('clear() reseeds only the identity of the root table in a TPT hierarchy', async () => {
  const insert = async () => {
    const em = orm.em.fork();
    const car = em.create(Car, { name: 'car', doors: 4 });
    await em.flush();
    return car.id;
  };

  await expect(insert()).resolves.toBe(1);
  await orm.schema.clear();
  await expect(insert()).resolves.toBe(1);
});
