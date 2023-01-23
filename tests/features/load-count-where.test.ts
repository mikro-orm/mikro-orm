import {
  Collection,
  Entity, ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class EndUser {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Booking, booking => booking.endUser)
  bookings = new Collection<Booking>(this);

}

@Entity()
export class Event {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    () => Booking,
    booking => booking.event,
  )
  bookings = new Collection<Booking>(this);

}

@Entity()
export class Booking {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => EndUser)
  endUser!: EndUser;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne(() => Event)
  event!: Event;

}

describe('Collection.loadCount where option', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [EndUser, Booking, Event],
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('Collection.loadCount with where option should work', async () => {
    const endUser1 = orm.em.create(EndUser, { id: 1, name: 'Revò' });
    const event1 = orm.em.create(Event, { id: 1, name: 'MikroORM party' });
    const event2 = orm.em.create(Event, { id: 2, name: 'MikroORM second party!' });
    await orm.em.persistAndFlush([endUser1, event1, event2]);
    const endUser = await orm.em.findOneOrFail(EndUser, { id: endUser1.id });
    let bookingCount = await endUser.bookings.loadCount(true);
    expect(bookingCount).toBe(0);
    const booking1 = orm.em.create(Booking, { id: 1, endUser, event: event1.id });
    await orm.em.persistAndFlush(booking1);
    bookingCount = await endUser.bookings.loadCount(true);
    expect(bookingCount).toBe(1);
    const booking2 = orm.em.create(Booking, { id: 2, endUser, event: event2.id });
    await orm.em.persistAndFlush(booking2);
    bookingCount = await endUser.bookings.loadCount(true);
    expect(bookingCount).toBe(2);
    const userFirstPartyBookingCount = await endUser.bookings.loadCount({ where: { event: event1 } });
    expect(userFirstPartyBookingCount).toBe(1);
  });
});
