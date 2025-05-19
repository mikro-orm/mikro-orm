import { Entity, IDatabaseDriver, PrimaryKey, Property, SimpleLogger, Utils } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../helpers';
import { PLATFORMS } from '../bootstrap';

@Entity({ hasTriggers: true })
class WithTriggers {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255, nullable: true })
  value?: string | null;

}

@Entity()
class WithoutTriggers {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255, nullable: true })
  value?: string | null;

}

const options = {
  mssql: { password: 'Root.Root' },
};

describe.each(Utils.keys(options))('Output statements [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [WithTriggers, WithoutTriggers],
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

    const withTriggers = new WithTriggers();
    withTriggers.value = 'entity with triggers';

    const withoutTriggers = new WithoutTriggers();
    withoutTriggers.value = 'entity without triggers';

    await orm.em.insert(withTriggers);
    await orm.em.insert(withoutTriggers);

    switch (type) {
      case 'mssql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select top(0) [t].[id] into #out from [with_triggers] as t left join [with_triggers] on 0=1; insert into [with_triggers] ([value]) output inserted.[id] into #out values (\'entity with triggers\'); select [t].[id] from #out as t; drop table #out;');
        expect(mock.mock.calls[1][0]).toMatch('[query] insert into [without_triggers] ([value]) output inserted.[id] values (\'entity without triggers\')');
        break;
    }
  });
});
