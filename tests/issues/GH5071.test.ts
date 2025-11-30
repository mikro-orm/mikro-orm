import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class TimestampTest {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp' })
  createdAtTimestamp!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [TimestampTest],
    dbName: '5071',
    ensureDatabase: { create: true, clear: true },
    forceUtcTimezone: true,
  });
});
afterAll(async () => await orm.close(true));

test('postgres timestamp is correctly parsed', async () => {
  const createdAt = new Date('0022-01-01T00:00:00Z');
  const something = orm.em.create(TimestampTest, { id: 1, createdAtTimestamp: createdAt });
  await orm.em.persistAndFlush(something);

  const res = await orm.em.fork().find(TimestampTest, something.id);

  expect(isNaN(res[0]!.createdAtTimestamp.getTime())).toBe(false);
  expect(res[0]!.createdAtTimestamp.getTime()).toEqual(createdAt.getTime());
});
