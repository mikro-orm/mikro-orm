import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/mysql';

class Point {

  latitude!: number;
  longitude!: number;

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

@Entity()
class Person {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;

  @Property({ type: PointType })
  homeAddress!: Point;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6241',
    port: 3308,
    entities: [Person],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6241', async () => {
  await orm.em.upsert(Person, {
    name: 'John',
    homeAddress: {
      latitude: 0,
      longitude: 0,
    },
  });
});
