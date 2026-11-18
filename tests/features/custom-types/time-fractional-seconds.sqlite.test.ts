import { MikroORM, TimeType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class Appointment {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: new TimeType(), length: 3 })
  startsAt!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Appointment], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('persists and hydrates fractional seconds', async () => {
  const appointment = orm.em.create(Appointment, { startsAt: '12:34:56.123' });
  await orm.em.persist(appointment).flush();
  orm.em.clear();

  const loaded = await orm.em.findOneOrFail(Appointment, appointment.id);
  expect(loaded.startsAt).toBe('12:34:56.123');

  loaded.startsAt = '12:34:56.456';
  await orm.em.flush();
  orm.em.clear();
  expect((await orm.em.findOneOrFail(Appointment, appointment.id)).startsAt).toBe('12:34:56.456');
});

test('converts fractional seconds in filters and native updates', async () => {
  await orm.em.getConnection().execute('insert into appointment (starts_at) values (?)', ['12:34:56.123']);

  const appointment = await orm.em.findOneOrFail(Appointment, { startsAt: '12:34:56.123' });
  expect(appointment.startsAt).toBe('12:34:56.123');

  await orm.em.nativeUpdate(Appointment, appointment.id, { startsAt: '12:34:56.789' });
  orm.em.clear();
  expect((await orm.em.findOneOrFail(Appointment, appointment.id)).startsAt).toBe('12:34:56.789');
});
