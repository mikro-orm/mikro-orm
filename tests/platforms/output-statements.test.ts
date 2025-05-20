import {Entity, PrimaryKey, Property, SimpleLogger, Utils} from '@mikro-orm/core';
import {MikroORM, MsSqlDriver} from '@mikro-orm/mssql';
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
    orm = await MikroORM.init<MsSqlDriver>({
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

  test(`insert`, async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    const withTriggers = new WithTriggers();
    withTriggers.value = 'entity with triggers';

    const withoutTriggers = new WithoutTriggers();
    withoutTriggers.value = 'entity without triggers';

    const withTriggersAndIdentifyInsert = new WithTriggers();
    withTriggersAndIdentifyInsert.id = 2;
    withTriggersAndIdentifyInsert.value = 'entity with triggers and identity insert';

    await orm.em.insert(withTriggers);
    await orm.em.insert(withoutTriggers);
    await orm.em.insert(withTriggersAndIdentifyInsert);

    orm.em.clear();

    const withTriggersReselected = await orm.em.findOne(WithTriggers, { value: 'entity with triggers' });

    switch (type) {
      case 'mssql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select top(0) [t].[id] into #out from [with_triggers] as t left join [with_triggers] on 0=1; insert into [with_triggers] ([value]) output inserted.[id] into #out values (\'entity with triggers\'); select [t].[id] from #out as t; drop table #out;');
        expect(mock.mock.calls[1][0]).toMatch('[query] insert into [without_triggers] ([value]) output inserted.[id] values (\'entity without triggers\')');
        expect(mock.mock.calls[2][0]).toMatch('[query] set identity_insert [with_triggers] on; insert into [with_triggers] ([id], [value]) values (2, \'entity with triggers and identity insert\'); set identity_insert [with_triggers] off');
        expect(withTriggersReselected?.id).toBe(withTriggers.id); // ensure select from #out table works.
        break;
    }
  });

  test(`insert using query builder`, async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em
      .createQueryBuilder(WithTriggers)
      .insert({ value: 'entity with triggers' })
      .execute();

    await orm.em
      .createQueryBuilder(WithoutTriggers)
      .insert({ value: 'entity with triggers' })
      .execute();

    await orm.em
      .createQueryBuilder(WithTriggers)
      .insert({ id: 2, value: 'entity with triggers' })
      .execute();

    switch (type) {
      case 'mssql':
        expect(mock.mock.calls[0][0]).toMatch('[query] select top(0) [t].[id] into #out from [with_triggers] as t left join [with_triggers] on 0=1; insert into [with_triggers] ([value]) output inserted.[id] into #out values (\'entity with triggers\'); select [t].[id] from #out as t; drop table #out;');
        expect(mock.mock.calls[1][0]).toMatch('[query] insert into [without_triggers] ([value]) output inserted.[id] values (\'entity with triggers\')');
        expect(mock.mock.calls[2][0]).toMatch('[query] set identity_insert [with_triggers] on; insert into [with_triggers] ([id], [value]) values (2, \'entity with triggers\'); set identity_insert [with_triggers] off;');
        break;
    }
  });
});
