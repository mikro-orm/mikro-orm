import { type Constructor, MikroORM, PrimaryKeyProp, type Rel, Type } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class PrefixedIdType extends Type<string, number> {
  override convertToDatabaseValue(value: string | number): number {
    return typeof value === 'number' ? value : Number(value.substring(1));
  }

  override convertToJSValue(value: number | string): string {
    return typeof value === 'string' ? value : `d${value}`;
  }

  override getColumnType(): string {
    return 'integer';
  }

  override compareAsType(): string {
    return 'number';
  }
}

@Entity()
class CompositeDoor {
  @PrimaryKey()
  a!: number;

  @PrimaryKey()
  b!: number;

  [PrimaryKeyProp]?: ['a', 'b'];

  @OneToOne(() => CompositeHandle, { mappedBy: 'door' })
  handle?: Rel<CompositeHandle> | null;
}

@Entity()
class CompositeHandle {
  @PrimaryKey()
  id!: number;

  @Property()
  shape!: string;

  @OneToOne(() => CompositeDoor, { inversedBy: 'handle' })
  door!: Rel<CompositeDoor>;
}

@Entity()
class CustomDoor {
  @PrimaryKey({ type: PrefixedIdType })
  id!: string;

  @OneToOne(() => CustomHandle, { mappedBy: 'door' })
  handle?: Rel<CustomHandle> | null;
}

@Entity()
class CustomHandle {
  @PrimaryKey()
  id!: number;

  @Property()
  shape!: string;

  @OneToOne(() => CustomDoor, { inversedBy: 'handle' })
  door!: Rel<CustomDoor>;
}

interface Door {
  handle?: Handle | null;
}

interface Handle {
  shape: string;
  door: Door;
}

const variants = [
  {
    name: 'composite PK',
    Door: CompositeDoor,
    Handle: CompositeHandle,
    pks: [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
    ],
    orderBy: { b: 'asc' },
  },
  {
    name: 'custom type PK',
    Door: CustomDoor,
    Handle: CustomHandle,
    pks: [{ id: 'd1' }, { id: 'd2' }],
    orderBy: { id: 'asc' },
  },
] as { name: string; Door: Constructor<Door>; Handle: Constructor<Handle>; pks: object[]; orderBy: object }[];

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CompositeDoor, CompositeHandle, CustomDoor, CustomHandle],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();

  for (const { Door, Handle, pks } of variants) {
    em.create(Door, pks[0]);
    em.create(Handle, { id: 2, shape: 'B', door: em.create(Door, pks[1]) });
  }

  await em.flush();
});

afterAll(() => orm.close(true));

const cases = variants.flatMap(v => (['select-in', 'joined'] as const).map(strategy => ({ ...v, strategy })));

describe.each(cases)('pending inverse 1:1 with $name ($strategy)', ({ Door, Handle, orderBy, strategy }) => {
  const load = (em: MikroORM['em']) => em.find(Door, {}, { populate: ['handle'], strategy, orderBy });

  test('populate keeps a new entity', async () => {
    const em = orm.em.fork();
    const [door1] = await load(em);
    const handle = em.create(Handle, { shape: 'A', door: door1 });

    await load(em);
    expect(door1.handle).toBe(handle);
    expect(handle.door).toBe(door1);
    await em.flush();

    const [reloaded] = await load(orm.em.fork());
    expect(reloaded.handle?.shape).toBe('A');
  });

  test('populate keeps an entity moved to another owner', async () => {
    const em = orm.em.fork();
    const [door1, door2] = await load(em);
    const handle = door2.handle!;
    door1.handle = handle;

    await load(em);
    expect(door1.handle).toBe(handle);
    expect(handle.door).toBe(door1);
    expect(door2.handle).toBeUndefined();
    await em.flush();

    const [reloaded] = await load(orm.em.fork());
    expect(reloaded.handle?.shape).toBe('B');
  });

  test('populate still applies the database state when nothing is pending', async () => {
    const em = orm.em.fork();
    const [, door2] = await load(em);
    expect(door2.handle?.shape).toBe('B');
    await orm.em.fork().nativeDelete(Handle, { id: 2 });

    await load(em);
    expect(door2.handle).toBeNull();
  });
});
