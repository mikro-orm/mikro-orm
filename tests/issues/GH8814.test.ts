import { Collection, MikroORM, type Rel } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Car {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Door, door => door.car)
  doors = new Collection<Door>(this);
}

@Entity()
class Door {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Car)
  car!: Rel<Car>;

  @OneToOne(() => DoorHandle, { mappedBy: 'door' })
  handle?: Rel<DoorHandle> | null;
}

@Entity()
class DoorHandle {
  @PrimaryKey()
  id!: number;

  @Property()
  shape!: string;

  @OneToOne(() => Door, { inversedBy: 'handle' })
  door!: Rel<Door>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Car, Door, DoorHandle],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  const car = em.create(Car, { id: 1 });
  em.create(Door, { id: 1, car });
  em.create(Door, { id: 2, car, handle: { id: 2, shape: 'B' } });
  await em.flush();
});

afterAll(() => orm.close(true));

describe.each(['select-in', 'joined'] as const)('GH #8814 (%s)', strategy => {
  test('populate keeps an unflushed inverse 1:1', async () => {
    const em = orm.em.fork();
    const door = await em.findOneOrFail(Door, 1, { populate: ['handle'] });
    const handle = em.create(DoorHandle, { shape: 'A', door });
    expect(door.handle).toBe(handle);

    await em.findOneOrFail(Car, 1, { populate: ['doors.handle'], strategy });
    expect(door.handle).toBe(handle);
    expect(handle.door).toBe(door);
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Door, 1, { populate: ['handle'] });
    expect(reloaded.handle?.shape).toBe('A');
  });

  test('populate keeps an unflushed replacement of an inverse 1:1', async () => {
    const em = orm.em.fork();
    const door = await em.findOneOrFail(Door, 2, { populate: ['handle'] });
    em.remove(door.handle!);
    const handle = em.create(DoorHandle, { shape: 'A', door });

    await em.findOneOrFail(Car, 1, { populate: ['doors.handle'], strategy });
    expect(door.handle).toBe(handle);
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Door, 2, { populate: ['handle'] });
    expect(reloaded.handle?.shape).toBe('A');
  });

  test('populate keeps an inverse 1:1 moved to another entity', async () => {
    const em = orm.em.fork();
    const car = await em.findOneOrFail(Car, 1, { populate: ['doors.handle'] });
    const [door1, door2] = car.doors.getItems();
    const handle = door2.handle!;
    door1.handle = handle;

    await em.findOneOrFail(Car, 1, { populate: ['doors.handle'], strategy });
    expect(door1.handle).toBe(handle);
    expect(handle.door).toBe(door1);
    expect(door2.handle).toBeUndefined();
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Door, 1, { populate: ['handle'] });
    expect(reloaded.handle?.shape).toBe('B');
  });
});
