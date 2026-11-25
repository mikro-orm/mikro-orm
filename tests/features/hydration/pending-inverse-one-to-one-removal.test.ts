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

  @OneToOne(() => DoorLock, { mappedBy: 'door', orphanRemoval: true })
  lock?: Rel<DoorLock> | null;
}

@Entity()
class DoorHandle {
  @PrimaryKey()
  id!: number;

  @Property()
  shape!: string;

  @OneToOne(() => Door, { inversedBy: 'handle', nullable: true })
  door?: Rel<Door> | null;
}

@Entity()
class DoorLock {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Door, { inversedBy: 'lock' })
  door!: Rel<Door>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Car, Door, DoorHandle, DoorLock],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  const car = em.create(Car, { id: 1 });
  em.create(Door, { id: 1, car, handle: { id: 1, shape: 'A' }, lock: { id: 1 } });
  await em.flush();
});

afterAll(() => orm.close(true));

describe.each(['select-in', 'joined'] as const)('pending inverse 1:1 removal (%s)', strategy => {
  test('populate keeps an unflushed removal', async () => {
    const em = orm.em.fork();
    const door = await em.findOneOrFail(Door, 1, { populate: ['handle'] });
    const handle = door.handle!;
    door.handle = null;

    await em.findOneOrFail(Car, 1, { populate: ['doors.handle'], strategy });
    expect(door.handle).toBeNull();
    expect(handle.door).toBeNull();
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Door, 1, { populate: ['handle'] });
    expect(reloaded.handle).toBeNull();
  });

  test('populate keeps an unflushed orphan removal', async () => {
    const em = orm.em.fork();
    const door = await em.findOneOrFail(Door, 1, { populate: ['lock'] });
    door.lock = null;

    await em.findOneOrFail(Car, 1, { populate: ['doors.lock'], strategy });
    expect(door.lock).toBeNull();
    await em.flush();

    const reloaded = await orm.em.fork().findOneOrFail(Door, 1, { populate: ['lock'] });
    expect(reloaded.lock).toBeNull();
    await expect(orm.em.fork().count(DoorLock)).resolves.toBe(0);
  });

  test('populate keeps an entity scheduled for removal out of the relation', async () => {
    const em = orm.em.fork();
    const door = await em.findOneOrFail(Door, 1, { populate: ['lock'] });
    em.remove(door.lock!);
    door.lock = null;

    await em.findOneOrFail(Car, 1, { populate: ['doors.lock'], strategy });
    expect(door.lock).toBeNull();
    await em.flush();

    await expect(orm.em.fork().count(DoorLock)).resolves.toBe(0);
  });
});
