import { Dictionary, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Something {

  @PrimaryKey()
  id!: number;

  @Property({
    type: 'interval',
    length: 0,
    nullable: true,
  })
  durationBuggy?: Dictionary | string;

}

test('interval columns (postgres)', async () => {
  const orm = await MikroORM.init({
    entities: [Something],
    driver: PostgreSqlDriver,
    dbName: 'mikro_orm_interval_type',
  });
  await orm.schema.refreshDatabase();

  await expect(orm.schema.getCreateSchemaSQL()).resolves.toMatch('"duration_buggy" interval(0) null');

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  const mock = mockLogger(orm);
  orm.em.create(Something, { durationBuggy: '1s' });
  await orm.em.flush();
  await orm.em.flush(); // to check for extra updates
  orm.em.clear();
  const r = await orm.em.findOneOrFail(Something, { id: 1 });
  (r.durationBuggy as Dictionary).seconds = 5;
  await orm.em.flush();
  await orm.em.flush(); // to check for extra updates

  expect(mock.mock.calls).toHaveLength(7);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into "something" ("duration_buggy") values (\'1s\') returning "id"');
  expect(mock.mock.calls[2][0]).toMatch('commit');
  expect(mock.mock.calls[3][0]).toMatch('select "s0".* from "something" as "s0" where "s0"."id" = 1 limit 1');
  expect(mock.mock.calls[4][0]).toMatch('begin');
  expect(mock.mock.calls[5][0]).toMatch('update "something" set "duration_buggy" = \'5 seconds\' where "id" = 1');
  expect(mock.mock.calls[6][0]).toMatch('commit');

  await orm.close(true);
});

test('interval columns (sqlite)', async () => {
  const orm = await MikroORM.init({
    entities: [Something],
    driver: SqliteDriver,
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();

  await expect(orm.schema.getCreateSchemaSQL()).resolves.toMatch('`duration_buggy` interval null');

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  const mock = mockLogger(orm);
  orm.em.create(Something, { durationBuggy: '1s' });
  await orm.em.flush();
  await orm.em.flush(); // to check for extra updates
  orm.em.clear();
  const r = await orm.em.findOneOrFail(Something, { id: 1 });
  r.durationBuggy = '5s';
  await orm.em.flush();
  await orm.em.flush(); // to check for extra updates

  expect(mock.mock.calls).toHaveLength(7);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `something` (`duration_buggy`) values (\'1s\') returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('commit');
  expect(mock.mock.calls[3][0]).toMatch('select `s0`.* from `something` as `s0` where `s0`.`id` = 1 limit 1');
  expect(mock.mock.calls[4][0]).toMatch('begin');
  expect(mock.mock.calls[5][0]).toMatch('update `something` set `duration_buggy` = \'5s\' where `id` = 1');
  expect(mock.mock.calls[6][0]).toMatch('commit');

  await orm.close(true);
});
