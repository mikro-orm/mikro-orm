import { defineEntity, MikroORM } from '@mikro-orm/sqlite';

enum TransportType {
  AIR = 'air',
  ROAD = 'road',
}

const Transport = defineEntity({
  name: 'Transport',
  abstract: true,
  discriminatorColumn: 'type',
  properties: p => ({
    id: p.integer().primary(),
    type: p.enum(() => TransportType),
  }),
});

const AirTransport = defineEntity({
  name: 'AirTransport',
  extends: Transport,
  discriminatorValue: TransportType.AIR,
  properties: p => ({
    category: p.string().fieldName('airTransportCategory'),
  }),
});

const RoadTransport = defineEntity({
  name: 'RoadTransport',
  extends: Transport,
  discriminatorValue: TransportType.ROAD,
  properties: p => ({
    category: p.string().fieldName('roadTransportCategory'),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Transport, AirTransport, RoadTransport],
    dbName: ':memory:',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH5813: STI with same property name but different fieldName should create both columns', async () => {
  const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
  // Both columns should be created in the schema
  expect(diff).toContain('airTransportCategory');
  expect(diff).toContain('roadTransportCategory');

  // Verify metadata - root should have both columns as separate properties
  const rootMeta = orm.getMetadata().get(Transport);
  const fieldNames = Object.values(rootMeta.properties)
    .flatMap(p => p.fieldNames ?? [])
    .filter(f => f.includes('Category'));
  expect(fieldNames).toContain('airTransportCategory');
  expect(fieldNames).toContain('roadTransportCategory');
});

test('GH5813: child entities have correct fieldNames in metadata', async () => {
  // Verify child entity metadata still has correct fieldNames
  const airMeta = orm.getMetadata().get(AirTransport);
  const roadMeta = orm.getMetadata().get(RoadTransport);
  expect(airMeta.properties.category.fieldNames).toEqual(['airTransportCategory']);
  expect(roadMeta.properties.category.fieldNames).toEqual(['roadTransportCategory']);
});

test('GH5813: can persist and retrieve entities with different fieldNames', async () => {
  await orm.schema.refresh();

  // Create and persist both entities in the same flush
  const air = orm.em.create(AirTransport, { category: 'cargo', type: TransportType.AIR });
  const road = orm.em.create(RoadTransport, { category: 'freight', type: TransportType.ROAD });
  await orm.em.flush();

  // Verify data is stored in correct columns
  const rawData = await orm.em.execute('SELECT * FROM transport');
  expect(rawData).toHaveLength(2);

  const airRow = rawData.find((r: any) => r.type === 'air')!;
  const roadRow = rawData.find((r: any) => r.type === 'road')!;

  expect(airRow.airTransportCategory).toBe('cargo');
  expect(airRow.roadTransportCategory).toBeNull();
  expect(roadRow.roadTransportCategory).toBe('freight');
  expect(roadRow.airTransportCategory).toBeNull();

  // Clear identity map and reload
  orm.em.clear();

  const loadedAir = await orm.em.findOneOrFail(AirTransport, air.id);
  const loadedRoad = await orm.em.findOneOrFail(RoadTransport, road.id);

  expect(loadedAir.category).toBe('cargo');
  expect(loadedRoad.category).toBe('freight');

  // Test updates - both entities in same flush
  loadedAir.category = 'passenger';
  loadedRoad.category = 'logistics';
  await orm.em.flush();

  // Verify updates are stored in correct columns
  const updatedRawData = await orm.em.execute('SELECT * FROM transport');
  const updatedAirRow = updatedRawData.find((r: any) => r.type === 'air')!;
  const updatedRoadRow = updatedRawData.find((r: any) => r.type === 'road')!;

  expect(updatedAirRow.airTransportCategory).toBe('passenger');
  expect(updatedAirRow.roadTransportCategory).toBeNull();
  expect(updatedRoadRow.roadTransportCategory).toBe('logistics');
  expect(updatedRoadRow.airTransportCategory).toBeNull();
});
