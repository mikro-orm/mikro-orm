import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

class Place {

  id!: number;
  name!: string;
  altitude!: Altitude;
  population!: Population;

}

class Altitude {

  value1!: number;
  value2!: number;

}

class Population {

  value1!: number;
  value2!: number;

}

const placeSchema = new EntitySchema({
  class: Place,
  properties: {
    id: { primary: true, type: Number },
    name: { type: String },
    altitude: {
      kind: 'embedded',
      entity: () => Altitude,
      prefix: false,
    },
    population: {
      kind: 'embedded',
      entity: () => Population,
      prefix: false,
    },
  },
  tableName: 'Place',
});

const altitudeSchema = new EntitySchema({
  class: Altitude,
  embeddable: true,
  properties: {
    value1: {
      fieldName: 'altitude',
      type: Number,
    },
    value2: {
      fieldName: 'altitude2',
      type: Number,
    },
  },
});

const populationSchema = new EntitySchema({
  class: Population,
  embeddable: true,
  properties: {
    value1: {
      fieldName: 'population',
      type: Number,
    },
    value2: {
      fieldName: 'population2',
      type: Number,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [placeSchema],
    dbName: ':memory:',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH #5065`, async () => {
  expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatch(`create table \`Place\` (\`id\` integer not null primary key autoincrement, \`name\` text not null, \`altitude\` integer not null, \`altitude2\` integer not null, \`population\` integer not null, \`population2\` integer not null);`);
});
