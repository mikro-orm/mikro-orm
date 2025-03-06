import { Entity, MikroORM, PrimaryKey, Property, Type, PostgreSqlDriver } from '@mikro-orm/postgresql';

interface PointDTO {
  latitude: number;
  longitude: number;
}

class PointType extends Type<
  PointDTO | undefined,
  string | undefined
> {

  convertToDatabaseValue(value?: PointDTO): string | undefined {
    if (!value) { return undefined; }

    return `SRID=4326;POINT(${value.longitude} ${value.latitude})`;
  }

  convertToJSValue(value?: string): PointDTO | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) { return undefined; }

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
class User {

  @PrimaryKey()
  id!: number;

  @Property({ type: PointType, nullable: true })
  point: PointDTO | null = null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    dbName: '5433',
    port: 5433,
    entities: [User],
  });
  await orm.schema.execute('create extension if not exists postgis');
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('create user with null point', async () => {
  orm.em.create(User, { point: null });
  await orm.em.flush();
});

test('update user with null point', async () => {
  const user = new User();
  user.point = { latitude: 1, longitude: 1 };
  orm.em.persist(user);
  await orm.em.flush();
  orm.em.clear();

  user.point = null;
  await orm.em.flush();
});
