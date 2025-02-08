import { Embeddable, Embedded, Entity, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Embeddable()
class Time {

  @Property()
  hour: number;

  @Property()
  minute: number;

  constructor(hour: number, minute: number) {
    this.hour = hour;
    this.minute = minute;
  }

}

@Embeddable()
class TimeInterval {

  @Embedded(() => Time)
  start!: Time;

  @Embedded(() => Time)
  end!: Time;

}

@Entity()
class Example {

  @PrimaryKey()
  name!: string;

  @Embedded(() => TimeInterval)
  timeInterval!: TimeInterval;

}

describe('embedded entities without other properties', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Example],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('fetching entity should populate embedded property', async () => {
    const example = new Example();
    example.name = 'Test';
    example.timeInterval = new TimeInterval();
    example.timeInterval.start = new Time(9, 0);
    example.timeInterval.end = new Time(17, 59);

    expect(wrap(example.timeInterval).toJSON()).toEqual({
      start: {
        hour: 9,
        minute: 0,
      },
      end: {
        hour: 17,
        minute: 59,
      },
    });

    await orm.em.persistAndFlush(example);
    orm.em.clear();

    const fetched = await orm.em.findOneOrFail(Example, { name: example.name });
    expect(fetched.timeInterval).not.toBeUndefined();
    expect(wrap(fetched.timeInterval).toJSON()).toEqual({
      start: {
        hour: 9,
        minute: 0,
      },
      end: {
        hour: 17,
        minute: 59,
      },
    });
  });
});
