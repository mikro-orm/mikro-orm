import { type IDatabaseDriver, MikroORM, SimpleLogger, Utils } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  tags?: { name: string; priority: number }[];

  @Property({ nullable: true })
  description?: string;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_test_json_elem', port: 3308 },
  mariadb: { dbName: 'mikro_orm_test_json_elem', port: 3309 },
  postgresql: { dbName: 'mikro_orm_test_json_elem' },
  mssql: {
    dbName: `mikro_orm_test_json_elem_${(Math.random() + 1).toString(36).substring(7)}`,
    password: 'Root.Root',
  },
  oracledb: {
    dbName: 'mikro_orm_test_json_elem',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('$elemMatch on JSON properties [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      metadataProvider: ReflectMetadataProvider,
      entities: [Event],
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });

    if (type === 'mssql') {
      await orm.schema.create();
    } else {
      await orm.schema.refresh();
    }
  }, 120_000);

  afterAll(async () => {
    if (type === 'mssql') {
      await orm.schema.dropDatabase();
    }

    await orm.close(true);
  }, 120_000);

  test('basic $elemMatch queries', async () => {
    orm.em.create(Event, {
      name: 'Conference',
      tags: [
        { name: 'typescript', priority: 10 },
        { name: 'javascript', priority: 5 },
      ],
    });
    orm.em.create(Event, {
      name: 'Meetup',
      tags: [
        { name: 'rust', priority: 8 },
        { name: 'wasm', priority: 3 },
      ],
    });
    // null and empty tags — EXISTS subquery handles gracefully (no match)
    orm.em.create(Event, { name: 'Workshop', tags: null });
    orm.em.create(Event, { name: 'Hackathon', tags: [] });
    await orm.em.flush();
    orm.em.clear();
    const mock = mockLogger(orm, ['query']);

    // basic equality
    const r1 = await orm.em.find(Event, { tags: { $elemMatch: { name: 'typescript' } } });
    expect(r1).toHaveLength(1);
    expect(r1[0].name).toBe('Conference');
    expect(mock.mock.calls[0][0]).toMatchSnapshot('basic equality');

    // numeric operator — inferred type cast
    mock.mockReset();
    const r2 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gt: 7 } } } });
    expect(r2).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('numeric operator');

    // multiple conditions — same element must match both
    mock.mockReset();
    const r3 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'typescript', priority: { $gt: 7 } } } });
    expect(r3).toHaveLength(1);
    expect(r3[0].name).toBe('Conference');
    expect(mock.mock.calls[0][0]).toMatchSnapshot('multiple conditions');

    // cross-element mismatch — typescript has priority 10, not < 3
    const r4 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'typescript', priority: { $lt: 3 } } } });
    expect(r4).toHaveLength(0);

    // $or within $elemMatch
    mock.mockReset();
    const r5 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { $or: [{ name: 'typescript' }, { name: 'rust' }] } },
    });
    expect(r5).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$or');

    // $in operator
    mock.mockReset();
    const r6 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: { $in: ['typescript', 'rust'] } } },
    });
    expect(r6).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$in');

    // $not within $elemMatch — element-level negation
    mock.mockReset();
    const r7 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { $not: { name: 'typescript' } } },
    });
    expect(r7).toHaveLength(2); // both events have at least one non-typescript tag
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$not');

    // no match
    const r8 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'python' } } });
    expect(r8).toHaveLength(0);

    // combined with regular conditions
    mock.mockReset();
    const r9 = await orm.em.fork().find(Event, {
      name: 'Conference',
      tags: { $elemMatch: { name: 'typescript' } },
    });
    expect(r9).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('combined with regular conditions');

    // null/empty tags are excluded by EXISTS — match all non-null/non-empty
    const r10 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gte: 0 } } } });
    expect(r10).toHaveLength(2); // only Conference and Meetup

    // non-existent property name returns no results (safely quoted)
    const r11 = await orm.em.fork().find(Event, { tags: { $elemMatch: { nonExistent: 'val' } } } as any);
    expect(r11).toHaveLength(0);
  });

  test('$elemMatch on non-JSON property throws', async () => {
    await expect(orm.em.fork().find(Event, { description: { $elemMatch: { foo: 'bar' } } } as any)).rejects.toThrow();
  });

  test('$elemMatch with invalid property name throws', async () => {
    await expect(
      orm.em.fork().find(Event, { tags: { $elemMatch: { ["x'; DROP TABLE event --"]: 'val' } } } as any),
    ).rejects.toThrow('Invalid JSON property name');
  });
});
