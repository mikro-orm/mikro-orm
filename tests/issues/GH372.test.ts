(global as any).process.env.FORCE_COLOR = 0;

import type { Knex } from 'knex';
import { knex } from 'knex';
import { SchemaGenerator } from '@mikro-orm/knex';
import { Entity, Logger, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

type Point = { x: number; y: number };

class PointType extends Type<Point, Knex.Raw> {

  convertToDatabaseValue(value: Point): Knex.Raw {
    return knex({ client: 'pg' }).raw(`point(?,?)`, [value.x, value.y]);
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

describe('GH issue 372', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_372`,
      type: 'postgresql',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`schema updates respect default values`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const a1 = new A();
    a1.prop = { x: 5, y: 9 };

    await orm.em.persistAndFlush(a1);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(A, a1.id);
    expect(a2.prop).toEqual({ x: 5, y: 9 });
    a2.prop.x = 6;
    a2.prop.y = 10;
    await orm.em.flush();
    orm.em.clear();

    const a3 = await orm.em.findOneOrFail(A, a1.id);
    expect(a3.prop).toEqual({ x: 6, y: 10 });

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "a" ("prop") values (point($1,$2)) returning "id"');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('select "a0".* from "a" as "a0" where "a0"."id" = $1 limit $2');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update "a" set "prop" = point($1,$2) where "id" = $3');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    expect(mock.mock.calls[7][0]).toMatch('select "a0".* from "a" as "a0" where "a0"."id" = $1 limit $2');
  });

});
