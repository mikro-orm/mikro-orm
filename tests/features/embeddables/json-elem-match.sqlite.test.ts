import { MikroORM } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  tags?: { name: string; priority: number }[];

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}

describe('$elemMatch on JSON properties in sqlite', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Event],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

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
    await orm.em.flush();
    orm.em.clear();
    const mock = mockLogger(orm, ['query']);

    // basic equality
    const r1 = await orm.em.find(Event, { tags: { $elemMatch: { name: 'typescript' } } });
    expect(r1).toHaveLength(1);
    expect(r1[0].name).toBe('Conference');
    expect(mock.mock.calls[0][0]).toMatch(
      "select `e0`.* from `event` as `e0` where exists (select 1 from json_each(`e0`.`tags`) as `__je0` where json_extract(`__je0`.value, '$.name') = ?)",
    );

    // operator with type inference (number)
    mock.mockReset();
    const r2 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gt: 7 } } } });
    expect(r2).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      "select `e0`.* from `event` as `e0` where exists (select 1 from json_each(`e0`.`tags`) as `__je0` where json_extract(`__je0`.value, '$.priority') > ?)",
    );

    // multiple conditions — same element must match both
    mock.mockReset();
    const r3 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'typescript', priority: { $gt: 7 } } } });
    expect(r3).toHaveLength(1);
    expect(r3[0].name).toBe('Conference');

    // cross-element mismatch
    const r4 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'typescript', priority: { $lt: 3 } } } });
    expect(r4).toHaveLength(0);

    // $or within $elemMatch
    mock.mockReset();
    const r5 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { $or: [{ name: 'typescript' }, { name: 'rust' }] } },
    });
    expect(r5).toHaveLength(2);

    // $in operator
    mock.mockReset();
    const r6 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: { $in: ['typescript', 'rust'] } } },
    });
    expect(r6).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      "select `e0`.* from `event` as `e0` where exists (select 1 from json_each(`e0`.`tags`) as `__je0` where json_extract(`__je0`.value, '$.name') in (?, ?))",
    );

    // no match
    const r7 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'python' } } });
    expect(r7).toHaveLength(0);

    // combined with regular conditions
    mock.mockReset();
    const r8 = await orm.em.fork().find(Event, {
      name: 'Conference',
      tags: { $elemMatch: { name: 'typescript' } },
    });
    expect(r8).toHaveLength(1);
  });
});
