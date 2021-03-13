(global as any).process.env.FORCE_COLOR = 0;

import Knex, { Raw } from 'knex';
import { SchemaGenerator } from '@mikro-orm/knex';
import {
  Entity,
  Logger,
  MikroORM,
  PrimaryKey,
  Property,
  Type,
  ValidationError,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

type Point = { x: number; y: number };

class PointType extends Type<Point, Raw> {

  convertToDatabaseValue(value: any): Raw {
    if (!value) { return value; }
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      return Knex({ client: 'pg' }).raw(`point(?,?)`, [value.x, value.y]);
    }

    throw ValidationError.invalidType(PointType, value, 'database');
  }

  convertToJSValue(value: any): Point {
    if (typeof value === 'object') {
      return value; // pg connector is automatically converting point to { x, y }
    }

    value = value.match(/(\(\d+,\d+\))/);
    return { x: value[0], y: value[1] };
  }

  getColumnType() {
    return 'point';
  }

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: PointType })
  prop!: Point;

}

describe('GH issue 1263', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_1263`,
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`queries are able to match on point values`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const a1 = new A();
    a1.prop = { x: 5, y: 9 };

    await orm.em.persistAndFlush(a1);
    orm.em.clear();

	const [result] = await orm.em.find(A, { prop: { $sameAs: { x: 5, y: 9 } } });
    expect(result?.prop.x).toBe(5);
    expect(result?.prop.y).toBe(9);

	const result2 = await orm.em.findOne(A, { prop: { $sameAs: { x: 5, y: 9 } } });
    expect(result2?.prop.x).toBe(5);
    expect(result2?.prop.y).toBe(9);

	const result3 = await orm.em.findOneOrFail(A, { prop: { $sameAs: { x: 5, y: 9 } } });
    expect(result3.prop.x).toBe(5);
    expect(result3.prop.y).toBe(9);

  });
});
