import { mockLogger } from '../../helpers';

(global as any).process.env.FORCE_COLOR = 0;

import type { Knex } from 'knex';
import { knex } from 'knex';
import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

type Point = { x: number; y: number };

class PointType extends Type<Point, Knex.Raw> {

  override convertToDatabaseValue(value: Point): Knex.Raw {
    return knex({ client: 'pg' }).raw(`point(?,?)`, [value.x, value.y]);
  }

  override convertToJSValue(value: any): Point {
    if (typeof value === 'object') {
      return value; // pg connector is automatically converting point to { x, y }
    }

    value = value.match(/(\(\d+,\d+\))/);
    return { x: value[0], y: value[1] };
  }

  override getColumnType() {
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

let orm: MikroORM<PostgreSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A],
    dbName: `mikro_orm_test_gh_372`,
    driver: PostgreSqlDriver,
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`custom types with knex.raw()`, async () => {
  const mock = mockLogger(orm, ['query']);

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
  expect(mock.mock.calls[1][0]).toMatch('insert into "a" ("prop") values ($1) returning "id"');
  expect(mock.mock.calls[2][0]).toMatch('commit');
  expect(mock.mock.calls[3][0]).toMatch('select "a0".* from "a" as "a0" where "a0"."id" = $1 limit $2');
  expect(mock.mock.calls[4][0]).toMatch('begin');
  expect(mock.mock.calls[5][0]).toMatch('update "a" set "prop" = point($1,$2) where "id" = $3');
  expect(mock.mock.calls[6][0]).toMatch('commit');
  expect(mock.mock.calls[7][0]).toMatch('select "a0".* from "a" as "a0" where "a0"."id" = $1 limit $2');
});

test(`multi insert with custom types and knex.raw() (GH #1841)`, async () => {
  const mock = mockLogger(orm, ['query']);

  orm.em.create(A, { prop: { x: 5, y: 9 } }, { persist: true });
  orm.em.create(A, { prop: { x: 6, y: 10 } }, { persist: true });
  orm.em.create(A, { prop: { x: 7, y: 11 } }, { persist: true });

  await orm.em.flush();
  orm.em.clear();

  const a1 = await orm.em.find(A, {});
  expect(a1[0].prop).toEqual({ x: 5, y: 9 });
  expect(a1[1].prop).toEqual({ x: 6, y: 10 });
  expect(a1[2].prop).toEqual({ x: 7, y: 11 });

  a1[0].prop.x = 65;
  a1[0].prop.y = 100;
  a1[1].prop.x = 77;
  a1[1].prop.y = 111;

  await orm.em.flush();
  orm.em.clear();

  const a2 = await orm.em.find(A, {});
  expect(a2[0].prop).toEqual({ x: 65, y: 100 });
  expect(a2[1].prop).toEqual({ x: 77, y: 111 });

  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into "a" ("prop") values ($1), ($2), ($3) returning "id"');
  expect(mock.mock.calls[2][0]).toMatch('commit');
  expect(mock.mock.calls[3][0]).toMatch('select "a0".* from "a" as "a0"');
  expect(mock.mock.calls[4][0]).toMatch('begin');
  expect(mock.mock.calls[5][0]).toMatch('update "a" set "prop" = case when ("id" = $1) then $2 when ("id" = $3) then $4 when ("id" = $5) then $6 else "prop" end where "id" in ($7, $8, $9)');
  expect(mock.mock.calls[6][0]).toMatch('commit');
  expect(mock.mock.calls[7][0]).toMatch('select "a0".* from "a" as "a0"');
});
