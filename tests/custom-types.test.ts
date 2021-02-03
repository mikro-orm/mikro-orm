import { Entity, Logger, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

export class Point {

  constructor(public latitude: number, public longitude: number) { }

}

export class PointType extends Type<Point | undefined, string | undefined> {

  convertToDatabaseValue(value: Point | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.latitude} ${value.longitude})`;
  }

  convertToJSValue(value: string | undefined): Point | undefined {
    const m = value?.match(/point\((\d+(\.\d+)?) (\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return new Point(+m[1], +m[3]);
  }

  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `ST_PointFromText(${key})`;
  }

  getColumnType(): string {
    return 'point';
  }

}

@Entity()
export class Location {

  @PrimaryKey()
  id!: number;

  @Property({ type: PointType })
  point?: Point;

}

describe('custom types [mysql]', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<MySqlDriver>({
      entities: [Location],
      dbName: `mikro_orm_test_custom_types`,
      type: 'mysql',
      port: 3307,
    });

    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });
  beforeEach(async () => {
    await orm.em.nativeDelete(Location, {});
  });
  afterAll(async () => orm.close(true));

  test('advanced custom types', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const loc = new Location();
    loc.point = new Point(1.23, 4.56);
    await orm.em.persistAndFlush(loc);
    orm.em.clear();

    const l1 = await orm.em.findOneOrFail(Location, loc);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `location` (`point`) values (ST_PointFromText(\'point(1.23 4.56)\'))');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('select `e0`.*, ST_AsText(`e0`.point) as point from `location` as `e0` where `e0`.`id` = ? limit ?');
    expect(mock.mock.calls).toHaveLength(4);
    await orm.em.flush(); // ensure we do not fire queries when nothing changed
    expect(mock.mock.calls).toHaveLength(4);

    l1.point = new Point(2.34, 9.87);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(7);
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update `location` set `point` = ST_PointFromText(\'point(2.34 9.87)\') where `id` = ?');
    expect(mock.mock.calls[6][0]).toMatch('commit');
  });

});
