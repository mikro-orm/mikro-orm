import { Entity, IDatabaseDriver, PrimaryKey, Property, QueryOrder, SimpleLogger, Utils } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../helpers.js';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255, nullable: true })
  value?: string | null;

}

const options = {
  sqlite: { dbName: ':memory:' },
  libsql: { dbName: ':memory:' },
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { password: 'Root.Root' },
  postgresql: {},
};

describe.each(Utils.keys(options))('Order by [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Test],
      driver: PLATFORMS[type],
      dbName: 'order-by',
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });

    await orm.schema.refreshDatabase();
  });

  beforeEach(() => orm.schema.clearDatabase());

  afterAll(() => orm.close(true));

  test(`order-by`, async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.ASC,
      },
    });

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.DESC,
      },
    });

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.ASC_NULLS_FIRST,
      },
    });

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.ASC_NULLS_LAST,
      },
    });

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.DESC_NULLS_FIRST,
      },
    });

    await orm.em.findAll(Test, {
      orderBy: {
        value: QueryOrder.DESC_NULLS_LAST,
      },
    });

    switch (type) {
      case 'sqlite':
      case 'libsql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` asc');
        expect(mock.mock.calls[1][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` desc');
        expect(mock.mock.calls[2][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` asc nulls first');
        expect(mock.mock.calls[3][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` asc nulls last');
        expect(mock.mock.calls[4][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` desc nulls first');
        expect(mock.mock.calls[5][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` desc nulls last');
        break;
      case 'mysql':
      case 'mariadb':
        expect(mock.mock.calls[0][0]).toMatch('[query] select `t0`.* from `test` as `t0`');
        expect(mock.mock.calls[1][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` desc');
        expect(mock.mock.calls[2][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` is not null, `t0`.`value` asc');
        expect(mock.mock.calls[3][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` is null, `t0`.`value` asc');
        expect(mock.mock.calls[4][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` is not null, `t0`.`value` desc');
        expect(mock.mock.calls[5][0]).toMatch('[query] select `t0`.* from `test` as `t0` order by `t0`.`value` is null, `t0`.`value` desc');
        break;
      case 'mssql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select [t0].* from [test] as [t0]');
        expect(mock.mock.calls[1][0]).toMatch('[query] select [t0].* from [test] as [t0] order by [t0].[value] desc');
        expect(mock.mock.calls[2][0]).toMatch('[query] select [t0].* from [test] as [t0] order by case when [t0].[value] is null then 0 else 1 end, [t0].[value] asc');
        expect(mock.mock.calls[3][0]).toMatch('[query] select [t0].* from [test] as [t0] order by case when [t0].[value] is null then 1 else 0 end, [t0].[value] asc');
        expect(mock.mock.calls[4][0]).toMatch('[query] select [t0].* from [test] as [t0] order by case when [t0].[value] is null then 0 else 1 end, [t0].[value] desc');
        expect(mock.mock.calls[5][0]).toMatch('[query] select [t0].* from [test] as [t0] order by case when [t0].[value] is null then 1 else 0 end, [t0].[value] desc');
        break;
      case 'postgresql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" asc');
        expect(mock.mock.calls[1][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" desc');
        expect(mock.mock.calls[2][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" asc nulls first');
        expect(mock.mock.calls[3][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" asc nulls last');
        expect(mock.mock.calls[4][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" desc nulls first');
        expect(mock.mock.calls[5][0]).toMatch('[query] select "t0".* from "test" as "t0" order by "t0"."value" desc nulls last');
        break;
    }
  });
});
