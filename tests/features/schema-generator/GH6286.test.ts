import { Entity, type IDatabaseDriver, MikroORM, PrimaryKey, Utils } from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap';

@Entity()
class TestEntity {

  @PrimaryKey({
    comment: `This
is
a
comment`,
  })
  id!: bigint;

}

const options = {
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { port: 1433, password: 'Root.Root' },
  postgresql: {},
};

describe.each(Utils.keys(options))('6286 [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      dbName: '6286',
      entities: [TestEntity],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('6286', async () => {
    const sources = await orm.entityGenerator.generate();
    expect(sources[0]).toMatch(`This\nis\na\ncomment`);
  });
});
