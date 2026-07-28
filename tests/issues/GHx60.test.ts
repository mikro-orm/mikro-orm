import { MikroORM, PrimaryKeyProp, Type, wrap } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class DateOnlyType extends Type<Date, string> {
  override convertToDatabaseValue(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().substring(0, 10);
    }

    return value;
  }

  override convertToJSValue(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  override getColumnType(): string {
    return 'date(10)';
  }
}

@Entity()
class User {
  @PrimaryKey()
  name!: string;
}

@Entity()
class Range {
  [PrimaryKeyProp]?: ['from', 'to'];

  @PrimaryKey({ type: DateOnlyType })
  from!: Date;

  @PrimaryKey({ type: DateOnlyType })
  to!: Date;

  @ManyToOne(() => User)
  user!: User;

  @Property({ nullable: true })
  label?: string;
}

@Entity()
class Booking {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Range)
  range!: Range;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Range, Booking],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('composite primary key with custom types is keyed by its database form in the identity map', () => {
  const em = orm.em.fork();
  const range = em.create(Range, {
    user: em.create(User, { name: 'Nik' }),
    from: new Date('2023-01-01'),
    to: new Date('2023-01-02'),
  });

  const hash = em
    .getUnitOfWork()
    .getIdentityMap()
    .keys()
    .find(k => k.startsWith('Range-'));
  expect(hash).toBe('Range-2023-01-01~~~2023-01-02');

  // the identity map must be reachable through a plain PK lookup
  const found = em.getUnitOfWork().getById(Range, [new Date('2023-01-01'), new Date('2023-01-02')]);
  expect(found).toBe(range);
});

test('composite primary key with custom types is matched when merging a transactional fork back', async () => {
  const setup = orm.em.fork();
  const range = setup.create(Range, {
    user: setup.create(User, { name: 'Lu' }),
    from: new Date('2024-01-01'),
    to: new Date('2024-01-02'),
    label: 'foo',
  });
  setup.create(Booking, { id: 1, range });
  await setup.flush();

  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Range, { from: new Date('2024-01-01'), to: new Date('2024-01-02') });
  expect(loaded.label).toBe('foo');

  await em.transactional(async fork => {
    // after clearing, hydrating the booking yields a *managed but uninitialized* range reference in the fork
    fork.clear();
    const booking = await fork.findOneOrFail(Booking, 1);
    expect(wrap(booking.range).isInitialized()).toBe(false);
  });

  // the uninitialized fork reference must not replace the loaded entity in the parent context
  const again = await em.findOneOrFail(Range, { from: new Date('2024-01-01'), to: new Date('2024-01-02') });
  expect(again).toBe(loaded);
  expect(again.label).toBe('foo');
});
