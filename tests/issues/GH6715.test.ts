import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/postgresql';
import { mockLogger } from '../bootstrap';

type GeoPoint = {
  lat: number;
  lng: number;
};
class GeoPointType extends Type<GeoPoint | undefined, string | undefined> {

  override convertToDatabaseValue(value: GeoPoint | undefined) {
    return value ? `point(${value.lat} ${value.lng})` : value;
  }

  override convertToJSValue(value: string | undefined) {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);
    return m ? { lat: +m[1], lng: +m[3] } : undefined;
  }

  override convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  override convertToDatabaseValueSQL(key: string) {
    return `ST_PointFromText(${key})`;
  }

  override getColumnType() {
    return 'geometry(Point)';
  }

}

@Entity()
class Place {

  @PrimaryKey()
  id!: number;

  @Property({ type: GeoPointType, lazy: true })
  location!: GeoPoint;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Place],
    dbName: 'GHxxxx',
    port: 5433,
  });

  await orm.schema.execute('create extension if not exists postgis');
  await orm.schema.refreshDatabase();
});
beforeEach(async () => {
  await orm.schema.clearDatabase();
});
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});


test('should handle lazy scalar properties with custom types correctly', async () => {
  const place = orm.em.create(Place, { id: 1, location: { lat: 2, lng: 3 } });

  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm, ['query']);

  const r1 = await orm.em.find(Place, {});
  expect(r1[0]).toEqual({ id: 1 });
  expect(mock.mock.calls[0][0]).toMatch('select "p0"."id" from "place" as "p0"');

  orm.em.clear();
  mock.mockClear();

  const r2 = await orm.em.find(Place, {}, { populate: ['location'] });
  expect(r2[0]).toEqual({ id: 1, location: { lat: 2, lng: 3 } });
  expect(mock.mock.calls[0][0]).toMatch('select "p0".*, ST_AsText("p0"."location") as "location" from "place" as "p0"');
});


