import { Entity, IDatabaseDriver, MikroORM, PrimaryKey, Property, SimpleLogger, Utils } from '@mikro-orm/core';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp' })
  date1!: Date;

  @Property()
  date2!: Date;

}

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: { dbName: 'mikro_orm_upsert_5591' },
  postgresql2: { dbName: 'mikro_orm_upsert_5591', forceUtcTimezone: false },
  mysql: { dbName: 'mikro_orm_upsert_5591', port: 3308 },
};

describe.each(Utils.keys(options))('GH #5591 [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Test],
      driver: PLATFORMS[type.replace(/\d+$/, '') as keyof typeof PLATFORMS],
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('timestamp without timezone', async () => {
    const testEntity = orm.em.create(Test, {
      date1: new Date('2024-08-01T17:00:00.000Z'),
      date2: new Date('2024-08-01T17:00:00.000Z'),
    });
    await orm.em.flush();
    orm.em.clear();

    const managedEntity = await orm.em.findOneOrFail(Test, testEntity.id);
    expect(managedEntity.date1.toISOString()).toBe('2024-08-01T17:00:00.000Z');
    expect(managedEntity.date2.toISOString()).toBe('2024-08-01T17:00:00.000Z');
  });
});
