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
