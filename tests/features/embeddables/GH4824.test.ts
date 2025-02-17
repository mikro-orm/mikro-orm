import { Embeddable, Embedded, Entity, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

class Point {

  public latitude!: number;
  public longitude!: number;

  constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

}

class PointType extends Type<Point | undefined, string | undefined> {

  convertToDatabaseValue(value: Point | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.longitude} ${value.latitude})`;
  }

  convertToJSValue(value: string | undefined): Point | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return new Point(+m[3], +m[1]);
  }

  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `ST_GeomFromText(${key}, 4326)`;
  }

  getColumnType(): string {
    return 'geometry';
  }

}

@Embeddable()
class Address {

  @Property()
  postalCode!: string;

  @Property({ type: PointType, nullable: true })
  geolocation?: Point;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Address, { array: true })
  addresses: Address[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #4824', async () => {
  const mock = mockLogger(orm);
  const user = await orm.em.findOne(User, {
    id: 1,
  });
  expect(user).toBeNull();
  expect(mock.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`id` = 1 limit 1');
});
