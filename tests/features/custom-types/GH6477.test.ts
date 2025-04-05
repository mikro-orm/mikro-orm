import {
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  RequestContext,
  wrap,
  Type,
} from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

let orm: MikroORM;
const eventID = v4();

type PointDTO = {
  latitude: number;
  longitude: number;
};

class PointType extends Type<
  PointDTO | undefined,
  string | undefined
> {

  convertToDatabaseValue(value?: PointDTO): string | undefined {
    if (!value) {
      return undefined;
    }

    return `SRID=4326;POINT(${value.longitude} ${value.latitude})`;
  }

  convertToJSValue(value?: string): PointDTO | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return { latitude: +m[1], longitude: +m[3] };
  }

  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `${key}::geometry`;
  }

  getColumnType(): string {
    return 'geometry';
  }

}

@Entity()
class CalendarEvent {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'text' })
  name!: string;

  @ManyToMany(() => Keyword)
  keywords = new Collection<Keyword>(this);

  @ManyToMany(() => Station)
  stations = new Collection<Station>(this);

}

@Entity()
class Station {

  @PrimaryKey({ type: 'text' })
  name!: string;

  @Property({ type: PointType })
  position!: PointDTO;

  @Property({ type: 'text' })
  testProperty!: string;

  @ManyToMany(() => CalendarEvent, event => event.stations)
  events = new Collection<CalendarEvent>(this);

  [PrimaryKeyProp]?: 'name';

}

@Entity()
class Keyword {

  @PrimaryKey({ type: 'text' })
  id!: string;

  @ManyToMany(() => CalendarEvent, event => event.keywords)
  events = new Collection<CalendarEvent>(this);

}

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6477',
    port: 5433,
    entities: [CalendarEvent, Station, Keyword],
  });
  await orm.schema.execute('create extension if not exists postgis');
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
  orm.em.clear();

  const station1 = orm.em.create(Station, station1Dto);
  const station2 = orm.em.create(Station, station2Dto);
  const station3 = orm.em.create(Station, station3Dto);

  const keyword1Dto = { id: 'keyword1' };
  const keyword2Dto = { id: 'keyword2' };

  const keyword1 = orm.em.create(Keyword, keyword1Dto);
  const keyword2 = orm.em.create(Keyword, keyword2Dto);

  orm.em.create(CalendarEvent, {
    id: eventID,
    name: 'test',
    stations: [station1, station2],
    keywords: [keyword1, keyword2],
  });

  await orm.em.flush();

  // Simulate a new request (in my Nest tests I have two separate queries too, one for creation and one for update)
  orm.em.clear();
});


// I'm using raw data here to make the test more readable later
const station1Dto = { name: 'First Station', position: { latitude: 1, longitude: 1 }, testProperty: 'Test Property 1' };
const station2Dto = { name: 'Second Station', position: { latitude: 2, longitude: 2 }, testProperty: 'Test Property 2' };
const station3Dto = { name: 'Third Station', position: { latitude: 3, longitude: 3 }, testProperty: 'Test Property 3' };

const populateOptions = ['keywords', 'stations'] as const;

test('normal flow test', async () => {
  // I correctly get my custom type (station.position) here
  const event = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

  expect(event.stations.isInitialized()).toBe(true);
  expect(event.stations.length).toBe(2);
  expect(event.stations[0].position).toEqual(station1Dto.position);
  expect(event.stations[1].position).toEqual(station2Dto.position);

  wrap(event).assign({ name: 'new event name', stations: ['Second Station'] });
  await orm.em.persistAndFlush(event);
  expect(event.name).toBe('new event name');
  expect(event.stations.length).toBe(1);
  expect(event.stations[0].position).toEqual(station2Dto.position);

  wrap(event).assign({ name: 'another event name', stations: ['Second Station', 'Third Station'] });
  await orm.em.persistAndFlush(event);
  expect(event.stations.length).toBe(2);
  expect(event.name).toBe('another event name');

  const updatedEvent = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

  // This throws, as the station.position property is not hydrated
  expect(updatedEvent.stations[1].position).toEqual(station3Dto.position);
});

// This won't pass
test('test with a request context', async () => {
  await RequestContext.create(orm.em, async () => {
    // I correctly get my custom type (station.position) here
    const event = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

    expect(event.stations.isInitialized()).toBe(true);
    expect(event.stations.length).toBe(2);
    expect(event.stations[0].position).toEqual(station1Dto.position);
    expect(event.stations[1].position).toEqual(station2Dto.position);

    wrap(event).assign({ name: 'new event name' });
    await orm.em.persistAndFlush(event);
    expect(event.name).toBe('new event name');
    expect(event.stations.length).toBe(2);
    expect(event.stations[0].position).toEqual(station1Dto.position);
    expect(event.stations[1].position).toEqual(station2Dto.position);
  });

  await RequestContext.create(orm.em, async () => {
    const event = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

    wrap(event).assign({ name: 'another event name', stations: ['Third Station'] });
    await orm.em.persistAndFlush(event);
    expect(event.stations.length).toBe(1);
    expect(event.name).toBe('another event name');

    const updatedEvent = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

    // This throws, as the station.position property is not hydrated
    expect(updatedEvent.stations[0].position).toEqual(station3Dto.position);
  });
});

test('test disconnecting the identity map', async () => {
  await RequestContext.create(orm.em, async () => {
    // I correctly get my custom type (station.position) here
    const event = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

    expect(event.stations.isInitialized()).toBe(true);
    expect(event.stations.length).toBe(2);
    expect(event.stations[0].position).toEqual(station1Dto.position);
    expect(event.stations[1].position).toEqual(station2Dto.position);

    wrap(event).assign({ name: 'new event name' });
    await orm.em.persistAndFlush(event);
    expect(event.name).toBe('new event name');
    expect(event.stations.length).toBe(2);
    expect(event.stations[0].position).toEqual(station1Dto.position);
    expect(event.stations[1].position).toEqual(station2Dto.position);
  });

  await RequestContext.create(orm.em, async () => {
    const event = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, { populate: populateOptions });

    wrap(event).assign({ name: 'another event name', stations: ['Third Station'] });
    await orm.em.persistAndFlush(event);
    expect(event.stations.length).toBe(1);
    expect(event.name).toBe('another event name');

    const updatedEvent = await orm.em.findOneOrFail(CalendarEvent, { id: eventID }, {
      populate: populateOptions,
      disableIdentityMap: true,
    });
    expect(updatedEvent.stations[0].position).toEqual(station3Dto.position);
  });
});
