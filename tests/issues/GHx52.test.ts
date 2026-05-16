import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// `em.assign()` should coerce string/number inputs to `Date` instances for `Date`-typed properties,
// matching the runtime behavior of `em.create()` (which goes through the hydrator).
// `EntityData` already permits `string | Date` for such properties at the type level.

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  startsAt!: Date;

  @Property({ nullable: true })
  endsAt?: Date;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Event],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('em.assign() coerces ISO date strings to Date for Date-typed properties', async () => {
  const event = orm.em.create(Event, { startsAt: new Date('2026-01-01T00:00:00.000Z') });
  await orm.em.flush();
  orm.em.clear();

  const loaded = await orm.em.findOneOrFail(Event, event.id);
  orm.em.assign(loaded, { startsAt: '2026-05-17T10:00:00.000Z', endsAt: '2026-05-17T12:00:00.000Z' });

  expect(loaded.startsAt).toBeInstanceOf(Date);
  expect(loaded.startsAt.toISOString()).toBe('2026-05-17T10:00:00.000Z');
  expect(loaded.endsAt).toBeInstanceOf(Date);
  expect(loaded.endsAt!.toISOString()).toBe('2026-05-17T12:00:00.000Z');

  await orm.em.flush();
});

test('em.assign() still accepts native Date instances', async () => {
  const event = orm.em.create(Event, { startsAt: new Date('2026-01-01T00:00:00.000Z') });
  const next = new Date('2026-06-01T00:00:00.000Z');
  orm.em.assign(event, { startsAt: next });

  expect(event.startsAt).toBe(next);
});

test('em.assign() coerces numeric epoch input to Date', async () => {
  const event = orm.em.create(Event, { startsAt: new Date('2026-01-01T00:00:00.000Z') });
  const epoch = Date.UTC(2026, 6, 1);
  orm.em.assign(event, { startsAt: epoch as unknown as Date });

  expect(event.startsAt).toBeInstanceOf(Date);
  expect(event.startsAt.getTime()).toBe(epoch);
});
