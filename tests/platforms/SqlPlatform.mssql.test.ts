import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../helpers';
import { MikroORM, MsSqlDriver } from '@mikro-orm/mssql';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', length: 255 })
  path?: string;

}

describe('MsSqlPlatform', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    const dbName = `mikro_orm_test_${(Math.random() + 1).toString(36).substring(2)}`;

    orm = await MikroORM.init({
      entities: [Test],
      dbName,
      driver: MsSqlDriver,
      password: 'Root.Root',
      debug: true,
      logger: i => i,
    });

    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test(`unicode characters escaping`, async () => {
    const test = new Test();
    test.path = '\\\\path\\to\\directory';

    orm.em.persist(test);

    orm.config.set('colors', false);
    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('[query] begin');
    expect(mock.mock.calls[1][0]).toMatch(`[query] insert into [test] ([path]) output inserted.[id] values (N'\\\\path\\to\\directory')`);
    expect(mock.mock.calls[2][0]).toMatch('[query] commit');
  });
});
