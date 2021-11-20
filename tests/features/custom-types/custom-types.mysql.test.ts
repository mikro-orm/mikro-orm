import { Entity, LoadStrategy, ManyToOne, MikroORM, PrimaryKey, Property, t, Type } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';
import { mockLogger } from '../../bootstrap';

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

export class ExtendedPointType extends PointType {
}

@Entity()
export class Location {

  @PrimaryKey()
  id!: number;

  @Property({ type: t.float, nullable: true })
  rank?: number;

  @Property({ type: PointType, nullable: true })
  point?: Point;

  @Property({ type: ExtendedPointType, nullable: true })
  extendedPoint?: Point;

}

@Entity()
export class Address {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  location: Location;

  constructor(location: Location) {
    this.location = location;
  }

}

describe('custom types [mysql]', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<MySqlDriver>({
      entities: [Location, Address],
      dbName: `mikro_orm_test_custom_types`,
      type: 'mysql',
      port: 3307,
    });

    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });
  beforeEach(async () => {
    await orm.em.nativeDelete(Address, {});
    await orm.em.nativeDelete(Location, {});
  });
  afterAll(async () => orm.close(true));

  test('advanced custom types', async () => {
    const mock = mockLogger(orm, ['query']);

    const loc = new Location();
    const addr = new Address(loc);
    loc.point = new Point(1.23, 4.56);
    loc.extendedPoint = new Point(5.23, 9.56);
    await orm.em.persistAndFlush(addr);
    orm.em.clear();

    const l1 = await orm.em.findOneOrFail(Location, loc);
    expect(l1.point).toBeInstanceOf(Point);
    expect(l1.point).toMatchObject({ latitude: 1.23, longitude: 4.56 });
    expect(l1.extendedPoint).toBeInstanceOf(Point);
    expect(l1.extendedPoint).toMatchObject({ latitude: 5.23, longitude: 9.56 });
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `location` (`extended_point`, `point`) values (ST_PointFromText(\'point(5.23 9.56)\'), ST_PointFromText(\'point(1.23 4.56)\'))');
    expect(mock.mock.calls[2][0]).toMatch('insert into `address` (`location_id`) values (?)');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('select `l0`.*, ST_AsText(`l0`.`point`) as `point`, ST_AsText(`l0`.`extended_point`) as `extended_point` from `location` as `l0` where `l0`.`id` = ? limit ?');
    expect(mock.mock.calls).toHaveLength(5);
    await orm.em.flush(); // ensure we do not fire queries when nothing changed
    expect(mock.mock.calls).toHaveLength(5);

    l1.point = new Point(2.34, 9.87);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(8);
    expect(mock.mock.calls[5][0]).toMatch('begin');
    expect(mock.mock.calls[6][0]).toMatch('update `location` set `point` = ST_PointFromText(\'point(2.34 9.87)\') where `id` = ?');
    expect(mock.mock.calls[7][0]).toMatch('commit');
    orm.em.clear();

    const qb1 = orm.em.createQueryBuilder(Location, 'l');
    const res1 = await qb1.select('*').where({ id: loc.id }).getSingleResult();
    expect(mock.mock.calls[8][0]).toMatch('select `l`.*, ST_AsText(`l`.`point`) as `point`, ST_AsText(`l`.`extended_point`) as `extended_point` from `location` as `l` where `l`.`id` = ?');
    expect(res1).toMatchObject(l1);
    orm.em.clear();

    const qb2 = orm.em.createQueryBuilder(Location);
    const res2 = await qb2.select(['l0.*']).where({ id: loc.id }).getSingleResult();
    expect(mock.mock.calls[9][0]).toMatch('select `l0`.*, ST_AsText(`l0`.`point`) as `point`, ST_AsText(`l0`.`extended_point`) as `extended_point` from `location` as `l0` where `l0`.`id` = ?');
    expect(res2).toMatchObject(l1);
    mock.mock.calls.length = 0;
    orm.em.clear();

    // custom types with SQL fragments with joined strategy (GH #1594)
    const a2 = await orm.em.findOneOrFail(Address, addr, { populate: ['location'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.`id`, `a0`.`location_id`, `l1`.`id` as `l1__id`, `l1`.`rank` as `l1__rank`, ST_AsText(`l1`.`point`) as `l1__point`, ST_AsText(`l1`.`extended_point`) as `l1__extended_point` from `address` as `a0` left join `location` as `l1` on `a0`.`location_id` = `l1`.`id` where `a0`.`id` = ?');
    expect(a2.location.point).toBeInstanceOf(Point);
    expect(a2.location.point).toMatchObject({ latitude: 2.34, longitude: 9.87 });
    expect(a2.location.extendedPoint).toBeInstanceOf(Point);
    expect(a2.location.extendedPoint).toMatchObject({ latitude: 5.23, longitude: 9.56 });
    expect(mock.mock.calls).toHaveLength(1);
    await orm.em.flush(); // ensure we do not fire queries when nothing changed
    expect(mock.mock.calls).toHaveLength(1);
  });

  test('extending custom types (gh issue 1442)', async () => {
    const meta = orm.getMetadata().get('Location');
    expect(meta.properties.point.customType).toBeInstanceOf(PointType);
    expect(meta.properties.extendedPoint.customType).toBeInstanceOf(ExtendedPointType);
  });

  test('create and update many records with custom types (gh issue 1625)', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    const locations = [new Location(), new Location()];
    locations[0].point = new Point(-1.23, -4.56);
    locations[1].point = new Point(-7.89, -0.12);
    await orm.em.persistAndFlush(locations);

    locations[0].point = new Point(1.23, 4.56);
    locations[1].point = new Point(7.89, 0.12);
    await orm.em.persistAndFlush(locations);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `location` (`point`) values (ST_PointFromText(\'point(-1.23 -4.56)\')), (ST_PointFromText(\'point(-7.89 -0.12)\'))');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch(`update \`location\` set \`point\` = case when (\`id\` = ${locations[0].id}) then ST_PointFromText('point(1.23 4.56)') when (\`id\` = ${locations[1].id}) then ST_PointFromText('point(7.89 0.12)') else \`point\` end where \`id\` in (${locations[0].id}, ${locations[1].id})`);
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls).toHaveLength(6);
  });

  test('find entity by custom types (gh issue 1630)', async () => {
    const location = new Location();
    location.point = new Point(1, 1);
    await orm.em.persistAndFlush(location);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const foundLocation = await orm.em.findOne(Location, {
      point: new Point(1, 1),
      extendedPoint: null,
    });

    expect(mock.mock.calls[0][0]).toMatch('select `l0`.*, ST_AsText(`l0`.`point`) as `point`, ST_AsText(`l0`.`extended_point`) as `extended_point` from `location` as `l0` where ST_AsText(`l0`.`point`) = \'point(1 1)\' and ST_AsText(`l0`.`extended_point`) is null limit 1');
    expect(mock.mock.calls).toHaveLength(1);

    expect(foundLocation).toBeInstanceOf(Location);
  });

  test('find entity by custom types with object subconditions', async () => {
    const location = new Location();
    location.point = new Point(1, 1);
    location.extendedPoint = new Point(1, 1);
    await orm.em.persistAndFlush(location);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const foundLocation = await orm.em.findOne(Location, {
      point: new Point(1, 1),
      extendedPoint: { $ne: null },
    });

    expect(mock.mock.calls[0][0]).toMatch('select `l0`.*, ST_AsText(`l0`.`point`) as `point`, ST_AsText(`l0`.`extended_point`) as `extended_point` from `location` as `l0` where ST_AsText(`l0`.`point`) = \'point(1 1)\' and ST_AsText(`l0`.`extended_point`) is not null limit 1');
    expect(mock.mock.calls).toHaveLength(1);

    expect(foundLocation).toBeInstanceOf(Location);
  });
});
