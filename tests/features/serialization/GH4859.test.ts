import { Entity,  PrimaryKey, Property, serialize } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class TimeSeriesEntityTest {

  @PrimaryKey()
  id!: string;

  @Property()
  data!: number[];

  @Property({
    serializer: value => ({ AVG: value.average, MAX: value.max, TOTAL: value.totalItems }),
    persist: false,
  })
  get stats() {
    return {
      average: this.data.reduce((sum, curr) => sum + curr, 0) / this.data.length,
      max: this.data.reduce((max, curr) => max > curr ? max : curr, 0),
      totalItems: this.data.length,
    };
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TimeSeriesEntityTest],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('custom serializer should be called in getters', async () => {
  const timeSeries = new TimeSeriesEntityTest();
  timeSeries.id = 'weather';
  timeSeries.data = [45, 56, 75, 34];

  const dto = serialize(timeSeries);

  expect(dto).toStrictEqual({
    id: 'weather',
    data: [45, 56, 75, 34],
    stats: {
      AVG: 52.5,
      MAX: 75,
      TOTAL: 4,
    },
  });
});
