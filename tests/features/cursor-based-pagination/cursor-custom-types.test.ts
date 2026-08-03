import { Cursor, Reference, ScalarReference, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

/**
 * Minimal Temporal-like wrapper: JS value is not a `Date`, supports sub-millisecond
 * precision, and serializes to an ISO-like string via `toJSON`.
 */
class PointInTime {
  constructor(readonly iso: string) {}

  toJSON(): string {
    return this.iso;
  }
}

class PointInTimeType extends Type<PointInTime | null, string | null> {
  override convertToDatabaseValue(value: PointInTime | string | null): string | null {
    if (value == null || typeof value === 'string') {
      return value;
    }

    if (!(value instanceof PointInTime)) {
      throw new Error(`Expected PointInTime, got ${(value as object).constructor.name}`);
    }

    return value.iso;
  }

  override convertToJSValue(value: PointInTime | string | null): PointInTime | null {
    if (value == null) {
      return null;
    }

    return value instanceof PointInTime ? value : new PointInTime(value);
  }

  override getColumnType(): string {
    return 'varchar(255)';
  }

  override compareAsType(): string {
    return 'string';
  }
}

const isoToMicros = (iso: string): number => {
  const match = /^(.+T\d{2}:\d{2}:\d{2})\.(\d{1,6})Z$/.exec(iso);

  if (!match) {
    throw new Error(`Unexpected iso value: ${iso}`);
  }

  return Date.parse(`${match[1]}Z`) * 1000 + Number(match[2].padEnd(6, '0'));
};

const microsToIso = (micros: number): string => {
  const seconds = Math.floor(micros / 1_000_000);
  const fraction = String(micros % 1_000_000).padStart(6, '0');
  return new Date(seconds * 1000).toISOString().replace('.000Z', `.${fraction}Z`);
};

/** Same JS value as `PointInTimeType`, but the database form (epoch microseconds) differs from the JSON form (ISO string). */
class PointInTimeEpochType extends Type<PointInTime | null, number | null> {
  override convertToDatabaseValue(value: PointInTime | number | null): number | null {
    if (value == null || typeof value === 'number') {
      return value;
    }

    if (!(value instanceof PointInTime)) {
      throw new Error(`Expected PointInTime, got ${(value as object).constructor.name}`);
    }

    return isoToMicros(value.iso);
  }

  override convertToJSValue(value: PointInTime | number | string | null): PointInTime | null {
    if (value == null) {
      return null;
    }

    if (value instanceof PointInTime) {
      return value;
    }

    return new PointInTime(typeof value === 'string' ? value : microsToIso(value));
  }

  override getColumnType(): string {
    return 'integer';
  }

  override compareAsType(): string {
    return 'number';
  }
}

/** Degenerate but valid custom type over a datetime column: both converters are the default identity. */
class TaggedDateType extends Type<Date, Date> {
  override getColumnType(): string {
    return 'datetime';
  }
}

/** Enforces the documented converter contracts: both converters only ever accept a `Date`. */
class StrictDateType extends Type<Date | null, Date | null> {
  override convertToDatabaseValue(value: Date | null): Date | null {
    if (value != null && !(value instanceof Date)) {
      throw new Error(`Expected Date, got ${typeof value}`);
    }

    return value;
  }

  override convertToJSValue(value: Date | null): Date | null {
    if (value != null && !(value instanceof Date)) {
      throw new Error(`Expected Date, got ${typeof value}`);
    }

    return value;
  }

  override getColumnType(): string {
    return 'datetime';
  }
}

/** Wrapper JS value over a datetime column: reflection stamps `runtimeType: 'Stamp'`, not `'Date'`. */
class Stamp {
  constructor(readonly date: Date) {}

  toJSON(): string {
    return this.date.toISOString();
  }
}

class StampType extends Type<Stamp | null, Date | null> {
  override convertToDatabaseValue(value: Stamp | Date | null): Date | null {
    if (value == null || value instanceof Date) {
      return value;
    }

    if (!(value instanceof Stamp)) {
      throw new Error(`Expected Stamp, got ${typeof value}`);
    }

    return value.date;
  }

  override convertToJSValue(value: Stamp | Date | number | null): Stamp | null {
    if (value == null) {
      return null;
    }

    if (value instanceof Stamp) {
      return value;
    }

    // a string is never the DB form of a datetime column, so reject it
    if (!(value instanceof Date) && typeof value !== 'number') {
      throw new Error(`Expected Date or epoch number, got ${typeof value}`);
    }

    return new Stamp(value instanceof Date ? value : new Date(value));
  }

  override getColumnType(): string {
    return 'datetime';
  }
}

/** Wrapper whose JSON form is a number, not a string. */
class Ticks {
  constructor(readonly ms: number) {}

  toJSON(): number {
    return this.ms;
  }
}

class TicksType extends Type<Ticks | null, string | null> {
  override convertToDatabaseValue(value: Ticks | string | null): string | null {
    if (value == null || typeof value === 'string') {
      return value;
    }

    if (!(value instanceof Ticks)) {
      throw new Error(`Expected Ticks, got ${typeof value}`);
    }

    return new Date(value.ms).toISOString();
  }

  override convertToJSValue(value: Ticks | string | number | null): Ticks | null {
    if (value == null) {
      return null;
    }

    if (value instanceof Ticks) {
      return value;
    }

    return new Ticks(typeof value === 'number' ? value : Date.parse(value));
  }

  override getColumnType(): string {
    return 'varchar(64)';
  }

  override compareAsType(): string {
    return 'string';
  }
}

/** Validating type over a varchar column: rejects values outside its known set. */
class CodeType extends Type<string | null, string | null> {
  override convertToJSValue(value: string | null): string | null {
    if (value != null && !/^c\d{2}$/.test(value)) {
      throw new Error(`unknown code '${value}'`);
    }

    return value;
  }

  override getColumnType(): string {
    return 'varchar(3)';
  }

  override compareAsType(): string {
    return 'string';
  }
}

@Embeddable()
class Audit {
  @Property()
  changedAt!: Date;

  @Property({ type: TaggedDateType })
  auditedAt!: Date;

  @Property({ type: PointInTimeEpochType })
  epochAt!: PointInTime;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  since!: Date;
}

@Entity()
class Job {
  @PrimaryKey()
  id!: number;

  @Property({ type: PointInTimeType })
  startedAt!: PointInTime;

  @Property({ type: PointInTimeEpochType })
  startedAtEpoch!: PointInTime;

  @Property({ type: TaggedDateType })
  taggedAt!: Date;

  @Property({ type: StrictDateType })
  strictAt!: Date;

  @Property({ type: StampType })
  stampedAt!: Stamp;

  @Property({ type: CodeType })
  code!: string;

  @Property({ type: TicksType })
  ticksAt!: Ticks;

  @Property({ type: PointInTimeType, nullable: true })
  finishedAt?: PointInTime | null;

  @Property()
  createdAt!: Date;

  @Property()
  label!: string;

  @Property({ type: 'json' })
  payload!: { ts: string };

  @Embedded(() => Audit, { object: true })
  audit!: Audit;

  @ManyToOne(() => Owner)
  owner!: Owner;
}

let orm: MikroORM;

// jobs 2-4 share the same millisecond and differ only in sub-millisecond digits,
// so the page boundary between jobs 3 and 4 requires full precision
const startedAtValues = [
  '2024-01-01T00:00:00.100000Z',
  '2024-01-01T00:00:00.123400Z',
  '2024-01-01T00:00:00.123450Z',
  '2024-01-01T00:00:00.123500Z',
  '2024-01-01T00:00:00.200000Z',
  '2024-01-01T00:00:01.100000Z',
  '2024-01-01T00:00:02.100000Z',
  '2024-01-01T00:00:03.100000Z',
  '2024-01-01T00:00:04.100000Z',
];

const day = (id: number) => String(id).padStart(2, '0');

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Job, Owner, Audit],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  startedAtValues.forEach((iso, index) => {
    const id = index + 1;
    orm.em.create(Job, {
      id,
      startedAt: new PointInTime(iso),
      startedAtEpoch: new PointInTime(iso),
      taggedAt: new Date(`2024-05-${day(id)}T00:00:00.000Z`),
      strictAt: new Date(`2024-06-${day(id)}T00:00:00.000Z`),
      stampedAt: new Stamp(new Date(`2024-07-${day(id)}T00:00:00.000Z`)),
      code: `c${day(id)}`,
      finishedAt: id % 2 === 0 ? null : new PointInTime(iso),
      createdAt: new Date(`2024-02-${day(id)}T00:00:00.500Z`),
      label: iso,
      payload: { ts: `2024-10-${day(id)}T00:00:00.000Z` },
      audit: {
        changedAt: new Date(`2024-04-${day(id)}T00:00:00.000Z`),
        auditedAt: new Date(`2024-08-${day(id)}T00:00:00.000Z`),
        epochAt: new PointInTime(`2024-11-${day(id)}T00:00:00.000Z`),
      },
      ticksAt: new Ticks(Date.parse(`2024-09-${day(id)}T00:00:00.000Z`)),
      owner: { id, name: `Owner ${id}`, since: new Date(`2024-03-${day(id)}T00:00:00.000Z`) },
    });
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

afterEach(() => orm.em.clear());

test('custom-typed cursor member with string cursor', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
  expect(cursor2.items[0].startedAt).toBeInstanceOf(PointInTime);
  expect(cursor2.items[0].startedAt.iso).toBe('2024-01-01T00:00:00.123500Z');
});

test('custom-typed cursor member with POJO `after`', async () => {
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });

  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { startedAt: job3.startedAt, id: job3.id },
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('custom type with distinct JSON and DB forms with string cursor', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { startedAtEpoch: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { startedAtEpoch: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
  expect(cursor2.items[0].startedAtEpoch.iso).toBe('2024-01-01T00:00:00.123500Z');
});

test('custom type with distinct JSON and DB forms with POJO `after`', async () => {
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });

  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { startedAtEpoch: job3.startedAtEpoch, id: job3.id },
    orderBy: { startedAtEpoch: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('identity custom type over a datetime column with POJO `after`', async () => {
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });

  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { taggedAt: job3.taggedAt, id: job3.id },
    orderBy: { taggedAt: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('contract-strict custom type over a datetime column', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { strictAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { strictAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { strictAt: new Date('2024-06-03T00:00:00.000Z'), id: 3 },
    orderBy: { strictAt: 'asc', id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('wrapper-typed field over a datetime column', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { stampedAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);
  expect(cursor1.items[0].stampedAt).toBeInstanceOf(Stamp);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { stampedAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { stampedAt: new Stamp(new Date('2024-07-03T00:00:00.000Z')), id: 3 },
    orderBy: { stampedAt: 'asc', id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor4 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { stampedAt: '2024-07-03T00:00:00.000Z' as unknown as Stamp, id: 3 },
    orderBy: { stampedAt: 'asc', id: 'asc' },
  });
  expect(cursor4.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('hand-written ISO string for a custom-typed datetime cursor member heals to Date', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { taggedAt: '2024-05-03T00:00:00.000Z', id: 3 },
    orderBy: { taggedAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { strictAt: '2024-06-03T00:00:00.000Z', id: 3 },
    orderBy: { strictAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('identity custom type over a datetime column with string cursor', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { taggedAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { taggedAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('native Date cursor member still rehydrates', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { createdAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { createdAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('hand-written ISO string for a native Date cursor member heals to Date', async () => {
  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { createdAt: '2024-02-03T00:00:00.500Z', id: 3 },
    orderBy: { createdAt: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('nested relation cursor member', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { owner: { since: 'asc' }, id: 'asc' },
    populate: ['owner'],
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { owner: { since: 'asc' }, id: 'asc' },
    populate: ['owner'],
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { owner: { since: new Date('2024-03-03T00:00:00.000Z') }, id: 3 },
    orderBy: { owner: { since: 'asc' }, id: 'asc' },
    populate: ['owner'],
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // an entity instance instead of a plain object must work the same way
  const owner3 = await orm.em.findOneOrFail(Owner, { id: 3 });
  const cursor4 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { owner: owner3, id: 3 },
    orderBy: { owner: { since: 'asc' }, id: 'asc' },
    populate: ['owner'],
  });
  expect(cursor4.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // same for a Reference wrapper
  const cursor5 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { owner: Reference.create(owner3), id: 3 },
    orderBy: { owner: { since: 'asc' }, id: 'asc' },
    populate: ['owner'],
  });
  expect(cursor5.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('Date inside object-mode embeddable stays in JSON space', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { audit: { changedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { audit: { changedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { audit: { changedAt: new Date('2024-04-03T00:00:00.000Z') }, id: 3 },
    orderBy: { audit: { changedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // an embeddable class instance instead of a plain object must work the same way
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });
  expect(job3.audit).toBeInstanceOf(Audit);
  const cursor4 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { audit: job3.audit, id: 3 },
    orderBy: { audit: { changedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor4.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('string property with timestamp-shaped values stays a string', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { label: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { label: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('nullable custom-typed cursor member', async () => {
  const cursor = await orm.em.findByCursor(Job, {
    first: 2,
    after: { finishedAt: null, id: 2 },
    orderBy: { finishedAt: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 6 }]);
});

test('MANY_TO_ONE cursor member is unaffected', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { owner: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { owner: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // an entity instance as the relation value must resolve to its primary key
  const owner3 = await orm.em.findOneOrFail(Owner, { id: 3 });
  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { owner: owner3, id: 3 },
    orderBy: { owner: 'asc', id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('custom type whose JSON form is not a string', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { ticksAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);
  expect(cursor1.items[0].ticksAt).toBeInstanceOf(Ticks);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { ticksAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('custom-typed Date inside object-mode embeddable stays in JSON space', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { audit: { auditedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { audit: { auditedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { audit: { auditedAt: new Date('2024-08-03T00:00:00.000Z') }, id: 3 },
    orderBy: { audit: { auditedAt: 'asc' }, id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('custom type with distinct JSON and DB forms inside object-mode embeddable', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { audit: { epochAt: 'asc' }, id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  // the string cursor carries the serialized ISO form, which must be restored to the JS value
  // first, so it can be converted to the epoch number the JSON document holds
  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { audit: { epochAt: 'asc' }, id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { audit: { epochAt: new PointInTime('2024-11-03T00:00:00.000Z') }, id: 3 },
    orderBy: { audit: { epochAt: 'asc' }, id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('validating custom type keeps its own error message', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    orderBy: { code: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { code: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // '2024' is Date.parse-able but not ISO-shaped, so the type's own error must survive
  await expect(
    orm.em.findByCursor(Job, {
      first: 3,
      after: { code: '2024', id: 3 },
      orderBy: { code: 'asc', id: 'asc' },
    }),
  ).rejects.toThrow("unknown code '2024'");

  // an ISO-shaped value must not be coerced to a Date for a non-datetime column,
  // and the type's error referencing the caller's string must survive
  await expect(
    orm.em.findByCursor(Job, {
      first: 3,
      after: { code: '2024-01-05T00:00:00.000Z', id: 3 },
      orderBy: { code: 'asc', id: 'asc' },
    }),
  ).rejects.toThrow("unknown code '2024-01-05T00:00:00.000Z'");
});

test('Date under a plain JSON property stays in JSON space', async () => {
  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { payload: { ts: '2024-10-03T00:00:00.000Z' }, id: 3 },
    orderBy: { payload: { ts: 'asc' }, id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  // a Date instance for the same JSON path must serialize instead of hitting the query as a Date
  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: { payload: { ts: new Date('2024-10-03T00:00:00.000Z') }, id: 3 } as never,
    orderBy: { payload: { ts: 'asc' }, id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor3 = await orm.em.findByCursor(Job, {
    first: 3,
    after: cursor1.endCursor!,
    orderBy: { payload: { ts: 'asc' }, id: 'asc' },
  });
  expect(cursor3.items).toMatchObject([{ id: 7 }, { id: 8 }, { id: 9 }]);
});

test('entity or reference instance as the cursor itself', async () => {
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });

  const cursor1 = await orm.em.findByCursor(Job, {
    first: 3,
    after: job3,
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor1.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);

  const cursor2 = await orm.em.findByCursor(Job, {
    first: 3,
    after: Reference.create(job3) as never,
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor2.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('scalar reference as cursor value unwraps', async () => {
  const job3 = await orm.em.findOneOrFail(Job, { id: 3 });

  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { startedAt: new ScalarReference(job3.startedAt), id: 3 } as never,
    orderBy: { startedAt: 'asc', id: 'asc' },
  });
  expect(cursor.items).toMatchObject([{ id: 4 }, { id: 5 }, { id: 6 }]);
});

test('scalar value where a nested cursor object is expected', async () => {
  await expect(
    orm.em.findByCursor(Job, {
      first: 3,
      after: { owner: 5, id: 3 } as never,
      orderBy: { owner: { since: 'asc' }, id: 'asc' },
    }),
  ).rejects.toThrow("value for 'Job.owner.since' is missing");
});

test('`Cursor.decode` returns raw JSON values', () => {
  const encoded = Cursor.encode(['2024-01-01T00:00:00.123Z', 42, null]);
  expect(Cursor.decode(encoded)).toEqual(['2024-01-01T00:00:00.123Z', 42, null]);
});
