import { MikroORM, ValidationError, wrap } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  happenedAt!: Date;
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

test('assign() rejects an unparseable date string with ValidationError (#8656)', async () => {
  const event = orm.em.create(Event, { happenedAt: new Date('2026-01-01T00:00:00.000Z') });
  await orm.em.flush();

  expect(() => orm.em.assign(event, { happenedAt: 'not a date' })).toThrow(ValidationError);
  expect(() => wrap(event).assign({ happenedAt: 'invalid date' })).toThrow(ValidationError);

  // valid ISO string and timestamp coercion still work
  orm.em.assign(event, { happenedAt: '2026-11-09T10:00:00.000Z' });
  expect(event.happenedAt).toBeInstanceOf(Date);
  expect(event.happenedAt.toISOString()).toBe('2026-11-09T10:00:00.000Z');

  orm.em.assign(event, { happenedAt: Date.UTC(2026, 10, 10) as any });
  expect(event.happenedAt).toBeInstanceOf(Date);
  expect(event.happenedAt.toISOString()).toBe('2026-11-10T00:00:00.000Z');

  expect(() => orm.em.assign(event, { happenedAt: NaN as any })).toThrow(ValidationError);
});
