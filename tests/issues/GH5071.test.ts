import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity()
class TimestampTest {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp' })
  createdAtTimestamp!: Date;

}

test('postgres timestamp is correctly parsed', async () => {
  const orm = await MikroORM.init({
    entities: [TimestampTest],
    dbName: '5071',
    ensureDatabase: { create: true, clear: true },
    forceUtcTimezone: true,
  });

  const createdAt = new Date('0022-01-01T00:00:00Z');
  const something = orm.em.create(TimestampTest, { id: 1, createdAtTimestamp: createdAt });
  await orm.em.persistAndFlush(something);

  const res = await orm.em.fork().find(TimestampTest, something.id);

  expect(isNaN(res[0]!.createdAtTimestamp.getTime())).toBe(false);
  expect(res[0]!.createdAtTimestamp.getTime()).toEqual(createdAt.getTime());

  await orm.close(true);
});
