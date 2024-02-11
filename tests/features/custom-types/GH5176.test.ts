import { Entity, JsonType, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

class GeoJSONPolygonType extends JsonType {

  convertToJSValueSQL(key: string) {
    return `ST_AsGeoJSON(${key},15)`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `ST_GeomFromGeoJSON(${key})`;
  }

  getColumnType(): string {
    return 'GEOGRAPHY(POLYGON,4326)';
  }

}

@Entity()
class DeliveryZone {

  @PrimaryKey()
  id!: number;

  @Property({ type: GeoJSONPolygonType })
  polygon!: GeoJSONPolygon;

}

export const polygonOne: GeoJSONPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [44.25, 46.33],
      [44.24, 46.31],
    ],
  ],
};

export const polygonTwo: GeoJSONPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [44.27, 46.30],
      [44.27, 46.29],
    ],
  ],
};

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5176',
    port: 5433,
    entities: [DeliveryZone],
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('create extension if not exists postgis');
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  orm.em.clear();
  await orm.schema.clearDatabase();
});

test('update entity', async () => {
  const deliveryZone = orm.em.create(DeliveryZone, { polygon: polygonOne });
  await orm.em.flush();

  deliveryZone.polygon = polygonTwo;
  await orm.em.flush();

  expect(deliveryZone.polygon).toStrictEqual(polygonTwo);
});

test('insert/update many entities', async () => {
  const deliveryZone1 = orm.em.create(DeliveryZone, { polygon: polygonOne });
  const deliveryZone2 = orm.em.create(DeliveryZone, { polygon: polygonTwo });
  await orm.em.flush();

  deliveryZone1.polygon = polygonTwo;
  deliveryZone2.polygon = polygonOne;
  await orm.em.flush();

  expect(deliveryZone1.polygon).toStrictEqual(polygonTwo);
  expect(deliveryZone2.polygon).toStrictEqual(polygonOne);
});

test('native update entity', async () => {
  const deliveryZone = orm.em.create(DeliveryZone, { polygon: polygonOne });
  await orm.em.flush();

  deliveryZone.polygon = polygonTwo;
  await orm.em.nativeUpdate(DeliveryZone, { id: deliveryZone.id }, { polygon: polygonTwo });
  await orm.em.refresh(deliveryZone);

  expect(deliveryZone.polygon).toStrictEqual(polygonTwo);
});

test('create entity', async () => {
  const deliveryZone = orm.em.create(DeliveryZone, { polygon: polygonOne });
  await orm.em.flush();

  expect(deliveryZone).toMatchObject({
    id: expect.any(Number),
    polygon: polygonOne,
  });
});

test('fetch entity', async () => {
  const deliveryZone = orm.em.create(DeliveryZone, { polygon: polygonOne });
  await orm.em.flush();
  await orm.em.clear();

  const refetchedDeliveryZone = await orm.em.findOneOrFail(DeliveryZone, deliveryZone.id);

  expect(deliveryZone).toStrictEqual(refetchedDeliveryZone);
});
