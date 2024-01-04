import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class TimestampTest {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp' })
  createdAtTimestamp!: Date;

}

test('postgres timestamp is correctly parsed', async () => {
  const orm = await MikroORM.init({
    entities: [TimestampTest],
    dbName: `mikro_orm_test_timestamp`,
    driver: PostgreSqlDriver,
    forceUtcTimezone: true,
  });

  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop table if exists timestamp_test');
  await orm.schema.createSchema();

  const createdAt = new Date('0022-01-01T00:00:00Z');

  const something = orm.em.create(TimestampTest, { createdAtTimestamp: createdAt });
  await orm.em.persistAndFlush(something);

  const res = await orm.em.find(TimestampTest, something.id);

  expect(isNaN(res[0]!.createdAtTimestamp.getTime())).toBe(false);
  expect(res[0]!.createdAtTimestamp.getTime()).toEqual(createdAt.getTime());

  await orm.close(true);
});
