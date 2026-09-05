import { EntitySchema, type Ref } from '@mikro-orm/core';
import { MikroORM, type ObjectId } from '@mikro-orm/mongodb';

class Airport {
  _id!: ObjectId;
  id!: string;
  code!: string;
}

const airportEntity = new EntitySchema({
  class: Airport,
  properties: {
    _id: { primary: true, type: 'ObjectId' },
    id: { serializedPrimaryKey: true, type: 'string' },
    code: { type: 'string' },
  },
});

const dataEntity = new EntitySchema({
  abstract: true,
  discriminatorColumn: 'type',
  embeddable: true,
  name: 'Data',
  properties: {
    type: { type: 'string' },
  },
});

// child A: `in.departureAirport`
const aInEntity = new EntitySchema({
  embeddable: true,
  name: 'AIn',
  properties: {
    departureAirport: { entity: () => airportEntity, kind: 'm:1', ref: true },
  },
});

const dataAEntity = new EntitySchema({
  discriminatorValue: 'a',
  embeddable: true,
  extends: dataEntity,
  name: 'DataA',
  properties: {
    in: { entity: () => aInEntity, kind: 'embedded', object: true },
  },
});

// child B: same child name `in`, different relation name `originAirport`
const bInEntity = new EntitySchema({
  embeddable: true,
  name: 'BIn',
  properties: {
    originAirport: { entity: () => airportEntity, kind: 'm:1', ref: true },
  },
});

const dataBEntity = new EntitySchema({
  discriminatorValue: 'b',
  embeddable: true,
  extends: dataEntity,
  name: 'DataB',
  properties: {
    in: { entity: () => bInEntity, kind: 'embedded', object: true },
  },
});

class Doc {
  _id!: ObjectId;
  id!: string;
  data!: { type: string; in?: { departureAirport?: Ref<Airport>; originAirport?: Ref<Airport> } };
}

const docEntity = new EntitySchema({
  class: Doc,
  properties: {
    _id: { primary: true, type: 'ObjectId' },
    id: { serializedPrimaryKey: true, type: 'string' },
    data: {
      entity: () => [dataAEntity, dataBEntity],
      kind: 'embedded',
      object: true,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    clientUrl: 'mongodb://localhost:27017/mikro-orm-7983',
    entities: [airportEntity, dataEntity, aInEntity, dataAEntity, bInEntity, dataBEntity, docEntity],
  });
  await orm.schema.clear();
});

afterAll(() => orm.close(true));

test('populate * with polymorphic embeddables having same-named nested embeddable with different relations (GH #7983)', async () => {
  const em = orm.em.fork();
  const hav = em.create(Airport, { code: 'HAV' });
  const mad = em.create(Airport, { code: 'MAD' });
  em.create(Doc, { data: { type: 'a', in: { departureAirport: hav } } });
  em.create(Doc, { data: { type: 'b', in: { originAirport: mad } } });
  await em.flush();
  em.clear();

  const docs = await em.find(Doc, {}, { populate: ['*'] });
  expect(docs).toHaveLength(2);

  const docA = docs.find(d => d.data.type === 'a')!;
  const docB = docs.find(d => d.data.type === 'b')!;
  expect(docA.data.in!.departureAirport!.isInitialized()).toBe(true);
  expect(docA.data.in!.departureAirport!.getProperty('code')).toBe('HAV');
  expect(docB.data.in!.originAirport!.isInitialized()).toBe(true);
  expect(docB.data.in!.originAirport!.getProperty('code')).toBe('MAD');
});
