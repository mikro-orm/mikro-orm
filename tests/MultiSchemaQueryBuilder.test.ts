import { LoadStrategy, MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, initORMPostgreSql, initORMSqlite } from './bootstrap';
import { FooBarSchema2, FooBazSchema2 } from './entities-with-schema';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

describe('QueryBuilder [mysql]', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {
    entities: [FooBarSchema2, FooBazSchema2],
    entitiesTs: [FooBarSchema2, FooBazSchema2],
  }, true));

  test('select query [mysql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.select('*').where({ name: 'test 123' }).limit(2, 1).leftJoin('baz', 'foobaz');
    expect(qb.getQuery()).toEqual('select `e0`.*, (select 123) as `random` from `mikro_orm_test_multi_1`.`foo_bar_schema2` as `e0` left join `mikro_orm_test_multi_2`.`foo_baz_schema2` as `foobaz` on `e0`.`baz_id` = `foobaz`.`id` where `e0`.`name` = ? limit ? offset ?');
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('insert query [mysql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.insert({ name: 'test 123' });
    expect(qb.getQuery()).toEqual('insert into `mikro_orm_test_multi_1`.`foo_bar_schema2` (`name`) values (?)');
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('update query with column reference [mysql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.update({ name: qb.raw('name + 1') }).where({ id: '1' });
    expect(qb.getQuery()).toEqual('update `mikro_orm_test_multi_1`.`foo_bar_schema2` set `name` = name + 1, `version` = current_timestamp where `id` = ?');
    expect(qb.getParams()).toEqual(['1']);
  });

  test('delete query with auto-joining [mysql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.delete({ baz: { name: 'stuff' } });
    expect(qb.getQuery()).toEqual('delete from `mikro_orm_test_multi_1`.`foo_bar_schema2` where `id` in (select `e0`.`id` from (select distinct `e0`.`id` from `mikro_orm_test_multi_1`.`foo_bar_schema2` as `e0` left join `mikro_orm_test_multi_2`.`foo_baz_schema2` as `e1` on `e0`.`baz_id` = `e1`.`id` where `e1`.`name` = ?) as `e0`)');
    expect(qb.getParams()).toEqual(['stuff']);
  });

  afterAll(async () => orm.close(true));

});

describe('QueryBuilder [postgresql]', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => orm = await initORMPostgreSql(LoadStrategy.SELECT_IN, {
    entities: [FooBarSchema2, FooBazSchema2],
    entitiesTs: [FooBarSchema2, FooBazSchema2],
  }));

  test('select query [postgresql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.select('*').where({ name: 'test 123' }).limit(2, 1).leftJoin('baz', 'foobaz');
    expect(qb.getQuery()).toEqual('select "e0".*, (select 123) as "random" from "mikro_orm_test_multi_1"."foo_bar_schema2" as "e0" left join "mikro_orm_test_multi_2"."foo_baz_schema2" as "foobaz" on "e0"."baz_id" = "foobaz"."id" where "e0"."name" = $1 limit $2 offset $3');
    expect(qb.getParams()).toEqual(['test 123', 2, 1]);
  });

  test('insert query [postgresql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.insert({ name: 'test 123' });
    expect(qb.getQuery()).toEqual('insert into "mikro_orm_test_multi_1"."foo_bar_schema2" ("name") values ($1) returning "id", "version"');
    expect(qb.getParams()).toEqual(['test 123']);
  });

  test('update query with column reference [postgresql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.update({ name: qb.raw('name + 1') }).where({ id: '1' });
    expect(qb.getQuery()).toEqual('update "mikro_orm_test_multi_1"."foo_bar_schema2" set "name" = name + 1, "version" = current_timestamp(0) where "id" = $1');
    expect(qb.getParams()).toEqual(['1']);
  });

  test('delete query with auto-joining [postgresql]', async () => {
    const qb = orm.em.createQueryBuilder(FooBarSchema2);
    qb.delete({ baz: { name: 'stuff' } });
    expect(qb.getQuery()).toEqual('delete from "mikro_orm_test_multi_1"."foo_bar_schema2" where "id" in (select "e0"."id" from (select distinct "e0"."id" from "mikro_orm_test_multi_1"."foo_bar_schema2" as "e0" left join "mikro_orm_test_multi_2"."foo_baz_schema2" as "e1" on "e0"."baz_id" = "e1"."id" where "e1"."name" = $1) as "e0")');
    expect(qb.getParams()).toEqual(['stuff']);
  });

  afterAll(async () => orm.close(true));

});
