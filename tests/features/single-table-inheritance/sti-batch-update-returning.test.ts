import { IDatabaseDriver, MikroORM, raw } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MySqlDriver } from '@mikro-orm/mysql';

@Entity({ abstract: true, discriminatorColumn: 'type' })
abstract class Vehicle {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string', nullable: true })
  type?: string;

  @Property({ type: 'string' })
  brand!: string;
}

@Entity({ discriminatorValue: 'car' })
class Car extends Vehicle {
  @Property({ type: 'integer', nullable: true })
  doors?: number;
}

@Entity({ discriminatorValue: 'bike' })
class Bike extends Vehicle {
  @Property({ type: 'integer', nullable: true })
  gears?: number;
}

const options = {
  // uses a `returning` clause, so the values come back from the update itself
  sqlite: {
    driver: SqliteDriver,
    dbName: ':memory:',
  },
  // no `returning` support, so the raw values are reloaded with a follow up select
  mysql: {
    driver: MySqlDriver,
    dbName: 'sti_batch_update_raw',
    port: 3308,
  },
} as const;

describe.each(['sqlite', 'mysql'] as const)('%s', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      ...options[type],
      entities: [Vehicle, Car, Bike],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('batch update with raw values on subclass-only properties', async () => {
    orm.em.create(Car, { id: 1, brand: 'audi', doors: 4 });
    orm.em.create(Bike, { id: 2, brand: 'bmx', gears: 3 });
    await orm.em.flush();
    orm.em.clear();

    // the batch update is driven by the first change set's metadata, so whichever subclass
    // comes first, the other one's property is only resolvable via the root metadata
    const [car, bike] = await orm.em.find(Vehicle, {}, { orderBy: { id: 'asc' } });
    (car as Car).doors = raw('doors + 1') as unknown as number;
    (bike as Bike).gears = raw('gears + 1') as unknown as number;
    await orm.em.flush();

    // both entities need the raw fragment replaced with the computed value
    expect((car as Car).doors).toBe(5);
    expect((bike as Bike).gears).toBe(4);

    orm.em.clear();
    const [car2, bike2] = await orm.em.find(Vehicle, {}, { orderBy: { id: 'asc' } });
    expect((car2 as Car).doors).toBe(5);
    expect((bike2 as Bike).gears).toBe(4);
  });
});
