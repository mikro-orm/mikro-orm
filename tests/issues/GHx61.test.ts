import { MikroORM, PrimaryKeyProp, sql, Type } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// querying a composite primary key via the positional array form (`em.find(Range, [from, to])`) skipped the
// custom type conversion — such conditions are keyed by a hash of all the PK names, which `findProperty`
// cannot resolve, so the per-property `customType` branch never kicked in and the raw JS values were passed
// to the driver, matching nothing.

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
class Range {
  [PrimaryKeyProp]?: ['from', 'to'];

  @PrimaryKey({ type: DateOnlyType })
  from!: Date;

  @PrimaryKey({ type: DateOnlyType })
  to!: Date;

  @Property({ nullable: true })
  label?: string;
}

@Entity()
class Shift {
  [PrimaryKeyProp]?: ['day', 'index'];

  @PrimaryKey({ type: DateOnlyType })
  day!: Date;

  @PrimaryKey()
  index!: number;

  @Property({ nullable: true })
  label?: string;
}

@Entity()
class Slot {
  [PrimaryKeyProp]?: ['group', 'index'];

  @PrimaryKey()
  group!: string;

  @PrimaryKey()
  index!: number;

  @Property({ nullable: true })
  label?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Range, Shift, Slot],
  });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Range, { from: new Date('2024-01-01'), to: new Date('2024-01-02'), label: 'foo' });
  em.create(Range, { from: new Date('2024-02-01'), to: new Date('2024-02-02'), label: 'bar' });
  em.create(Shift, { day: new Date('2024-01-01'), index: 1, label: 'foo' });
  em.create(Slot, { group: 'a', index: 1, label: 'foo' });
  em.create(Slot, { group: 'a', index: 2, label: 'bar' });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('composite primary key with custom types can be queried via the positional array form', async () => {
  const em = orm.em.fork();
  const range = await em.findOneOrFail(Range, [new Date('2024-01-01'), new Date('2024-01-02')]);
  expect(range.label).toBe('foo');
});

test('composite primary key with custom types can be queried via an array of tuples', async () => {
  const em = orm.em.fork();
  const ranges = await em.find(Range, [
    [new Date('2024-01-01'), new Date('2024-01-02')],
    [new Date('2024-02-01'), new Date('2024-02-02')],
  ]);
  expect(ranges.map(r => r.label)).toEqual(['foo', 'bar']);

  const single = await em.find(Range, [[new Date('2024-01-01'), new Date('2024-01-02')]]);
  expect(single.map(r => r.label)).toEqual(['foo']);
});

test('only the composite primary key parts that have a custom type are converted', async () => {
  const em = orm.em.fork();
  const shift = await em.findOneOrFail(Shift, [new Date('2024-01-01'), 1]);
  expect(shift.label).toBe('foo');
});

test('composite primary key without custom types can be queried via the positional array form', async () => {
  const em = orm.em.fork();
  const slot = await em.findOneOrFail(Slot, ['a', 1]);
  expect(slot.label).toBe('foo');

  const slots = await em.find(Slot, [
    ['a', 1],
    ['a', 2],
  ]);
  expect(slots.map(s => s.label)).toEqual(['foo', 'bar']);
});

test('raw fragment keys with array values are not mistaken for composite primary key tuples', async () => {
  const em = orm.em.fork();
  const ranges = await em.find(Range, { [sql.upper('label')]: ['FOO'] });
  expect(ranges.map(r => r.label)).toEqual(['foo']);
});
