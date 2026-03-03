import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuid } from 'uuid';

enum VenueType {
  Physical = 'Physical',
  Virtual = 'Virtual',
}

@Entity({ tableName: 'appointment-sti' })
class AppointmentStiEntity {
  @PrimaryKey()
  id: string = uuid();

  @OneToMany(() => VenueStiEntity, venue => venue.appointment)
  venues = new Collection<VenueStiEntity>(this);
}

@Entity({
  tableName: 'venue-sti',
  discriminatorColumn: 'type',
  discriminatorValue: 'Venue',
})
class VenueStiEntity {
  @PrimaryKey()
  id: string = uuid();

  @Property()
  name!: string;

  @Enum(() => VenueType)
  type!: VenueType; // discriminator for polymorphic behavior

  @ManyToOne(() => AppointmentStiEntity)
  appointment!: AppointmentStiEntity;
}

@Entity({ discriminatorValue: VenueType.Physical })
class PhysicalVenueStiEntity extends VenueStiEntity {
  @Property()
  street!: string;

  @Property()
  block!: string;
}

@Entity({ discriminatorValue: VenueType.Virtual })
class VirtualVenueStiEntity extends VenueStiEntity {
  @Property()
  meetingLink!: string;

  @Property()
  passcode!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [AppointmentStiEntity, VenueStiEntity, PhysicalVenueStiEntity, VirtualVenueStiEntity],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('6069', async () => {
  const appointment = new AppointmentStiEntity();

  const physicalVenue = new PhysicalVenueStiEntity();
  physicalVenue.name = 'Venue 1';
  physicalVenue.street = 'Street 1';
  physicalVenue.block = 'Block 1';
  physicalVenue.appointment = appointment;

  const virtualVenue = new VirtualVenueStiEntity();
  virtualVenue.name = 'Venue 2';
  virtualVenue.meetingLink = 'Link 1';
  virtualVenue.passcode = 'Passcode 1';
  virtualVenue.appointment = appointment;

  await orm.em.persist([virtualVenue, physicalVenue]).flush();

  const venues = await orm.em.findAll(VenueStiEntity);

  // make updates on the managed venue entities
  for (const venue of venues) {
    if (venue instanceof PhysicalVenueStiEntity) {
      venue.block = `Block ${Math.random()}`;
    }

    if (venue instanceof VirtualVenueStiEntity) {
      venue.passcode = `Passcode ${Math.random()}`;
    }
  }

  await orm.em.flush();
});
