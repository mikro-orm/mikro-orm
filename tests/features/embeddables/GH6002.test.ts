import { ObjectId, Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, QueryOrder } from '@mikro-orm/mongodb';

@Embeddable()
class RideDetailsDateModel {

  @Property()
  arrival: Date;

  @Property()
  departure: Date;

  constructor(arrival: Date, departure: Date) {
    this.arrival = arrival;
    this.departure = departure;
  }

}

@Embeddable()
class RideDetailsModel {

  @Embedded({ object: true })
  date!: RideDetailsDateModel;

}

@Entity({ collection: 'rides' })
class RideModel {

  @PrimaryKey()
  _id!: ObjectId;

  @Embedded({ object: true })
  details!: RideDetailsModel;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6002',
    entities: [RideModel, RideDetailsModel, RideDetailsDateModel],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(RideModel, {
    details: {
      date: { arrival: new Date(2024, 1, 2), departure: new Date(2024, 1, 1) },
    },
  });
  orm.em.create(RideModel, {
    details: {
      date: { arrival: new Date(2024, 1, 4), departure: new Date(2024, 1, 3) },
    },
  });
  orm.em.create(RideModel, {
    details: {
      date: { arrival: new Date(2024, 1, 6), departure: new Date(2024, 1, 5) },
    },
  });
  orm.em.create(RideModel, {
    details: {
      date: { arrival: new Date(2024, 1, 8), departure: new Date(2024, 1, 7) },
    },
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6002', async () => {
  const rides = await orm.em.find(
    RideModel,
    {},
    {
      orderBy: {
        details: {
          date: {
            departure: QueryOrder.ASC,
          },
        },
      },
    },
  );

  expect(rides).toHaveLength(4);
  expect(rides[0].details.date.departure).toStrictEqual(new Date(2024, 1, 1));
});
