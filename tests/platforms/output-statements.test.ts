import { SimpleLogger } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM, MsSqlDriver } from '@mikro-orm/mssql';
import { mockLogger } from '../helpers.js';

@Entity({ hasTriggers: true })
class WithTriggers {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', length: 255, nullable: true })
  value?: string | null;
}

@Entity()
class WithoutTriggers {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', length: 255, nullable: true })
  value?: string | null;
}

@Entity()
class WithoutAutoincrement {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property({ type: 'string', length: 255, nullable: true })
  value?: string | null;
}

describe('Output statements [mssql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [WithTriggers, WithoutTriggers, WithoutAutoincrement],
      driver: MsSqlDriver,
      dbName: 'output-stmt',
      loggerFactory: SimpleLogger.create,
      password: 'Root.Root',
    });

    await orm.schema.refresh();
  });

  beforeEach(() => orm.schema.clear());

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

    const withoutAutoincrement = new WithoutAutoincrement();
    withoutAutoincrement.id = 1;
    withoutAutoincrement.value = 'entity without autoincrement';

    await orm.em.insert(withTriggers);
    await orm.em.insert(withoutTriggers);
    await orm.em.insert(withTriggersAndIdentifyInsert);
    await orm.em.insert(withoutAutoincrement);

    orm.em.clear();

    const withTriggersReselected = await orm.em.findOne(WithTriggers, { value: 'entity with triggers' });

    expect(mock.mock.calls[0][0]).toMatch(
      "[query] select top(0) [t].[id] into #out from [with_triggers] as t left join [with_triggers] on 0 = 1; insert into [with_triggers] ([value]) output inserted.[id] into #out values (N'entity with triggers'); select [t].[id] from #out as t; drop table #out",
    );
    expect(mock.mock.calls[1][0]).toMatch(
      "[query] insert into [without_triggers] ([value]) output inserted.[id] values (N'entity without triggers')",
    );
    expect(mock.mock.calls[2][0]).toMatch(
      "[query] set identity_insert [with_triggers] on; insert into [with_triggers] ([id], [value]) values (2, N'entity with triggers and identity insert'); set identity_insert [with_triggers] off",
    );
    expect(mock.mock.calls[3][0]).toMatch(
      "[query] insert into [without_autoincrement] ([id], [value]) values (1, N'entity without autoincrement')",
    );
    expect(withTriggersReselected?.id).toBe(withTriggers.id); // ensure select from #out table works.
  });

  test(`insert using query builder`, async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em.createQueryBuilder(WithTriggers).insert({ value: 'entity with triggers' }).execute();

    await orm.em.createQueryBuilder(WithoutTriggers).insert({ value: 'entity with triggers' }).execute();

    await orm.em.createQueryBuilder(WithTriggers).insert({ id: 2, value: 'entity with triggers' }).execute();

    await orm.em
      .createQueryBuilder(WithoutAutoincrement)
      .insert({ id: 1, value: 'entity without autoincrement' })
      .execute();

    expect(mock.mock.calls[0][0]).toMatch(
      "[query] select top(0) [t].[id] into #out from [with_triggers] as t left join [with_triggers] on 0 = 1; insert into [with_triggers] ([value]) output inserted.[id] into #out values (N'entity with triggers'); select [t].[id] from #out as t; drop table #out",
    );
    expect(mock.mock.calls[1][0]).toMatch(
      "[query] insert into [without_triggers] ([value]) output inserted.[id] values (N'entity with triggers')",
    );
    expect(mock.mock.calls[2][0]).toMatch(
      "[query] set identity_insert [with_triggers] on; insert into [with_triggers] ([id], [value]) values (2, N'entity with triggers'); select @@rowcount; set identity_insert [with_triggers] off;",
    );
    expect(mock.mock.calls[3][0]).toMatch(
      "[query] insert into [without_autoincrement] ([id], [value]) values (1, N'entity without autoincrement')",
    );
  });
});
