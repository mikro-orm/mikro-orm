import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
class Carrier {
  @PrimaryKey()
  id!: string;
}

@Entity()
@Unique({ properties: ['id', 'carrier'] })
class TimeTrackingSystem {
  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Carrier)
  carrier!: Carrier;
}

@Entity()
class Location {
  @PrimaryKey()
  id!: string;

  // composite FK references target's PK plus an extra column scoped via the
  // composite UNIQUE constraint on TimeTrackingSystem; target PK itself is scalar.
  @ManyToOne(() => TimeTrackingSystem, {
    joinColumns: ['time_tracking_system_id', 'carrier_id'],
    referencedColumnNames: ['id', 'carrier_id'],
  })
  timeTrackingSystem!: TimeTrackingSystem;

  @ManyToOne(() => Carrier)
  carrier!: Carrier;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Carrier, TimeTrackingSystem, Location],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('filter by FK target PK only does not produce `(col1,col2) = scalar`', async () => {
  const qb = orm.em
    .fork()
    .qb(Location)
    .where({ timeTrackingSystem: { id: 'abc' } });
  expect(qb.getFormattedQuery()).toBe(
    "select `l0`.* from `location` as `l0` where `l0`.`time_tracking_system_id` = 'abc'",
  );
  // executes against the database without raising "row value misused"
  await orm.em.fork().find(Location, { timeTrackingSystem: { id: 'abc' } });
});
