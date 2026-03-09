import { MikroORM } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  tags?: { name: string; priority: number }[];
}

describe('$elemMatch on JSON properties in postgresql', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Event],
      dbName: 'mikro_orm_test_json_elem',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('$elemMatch queries with type casting', async () => {
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

    // basic equality — string, no cast
    const r1 = await orm.em.find(Event, { tags: { $elemMatch: { name: 'typescript' } } });
    expect(r1).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" as "e0" where exists (select 1 from jsonb_array_elements("e0"."tags") as "__je0" where "__je0"->>'name' = ?)`,
    );

    // numeric operator — inferred float8 cast
    mock.mockReset();
    const r2 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gte: 8 } } } });
    expect(r2).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" as "e0" where exists (select 1 from jsonb_array_elements("e0"."tags") as "__je0" where ("__je0"->>'priority')::float8 >= ?)`,
    );

    // multiple conditions — same element
    mock.mockReset();
    const r3 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: 'typescript', priority: { $gt: 5 } } },
    });
    expect(r3).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" as "e0" where exists (select 1 from jsonb_array_elements("e0"."tags") as "__je0" where "__je0"->>'name' = ? and ("__je0"->>'priority')::float8 > ?)`,
    );

    // $or
    mock.mockReset();
    const r4 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { $or: [{ name: 'typescript' }, { name: 'rust' }] } },
    });
    expect(r4).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" as "e0" where exists (select 1 from jsonb_array_elements("e0"."tags") as "__je0" where ("__je0"->>'name' = ? or "__je0"->>'name' = ?))`,
    );

    // $not within $elemMatch — element-level negation
    mock.mockReset();
    const r5 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { $not: { name: 'typescript' } } },
    });
    expect(r5).toHaveLength(2); // both events have at least one non-typescript tag
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" as "e0" where exists (select 1 from jsonb_array_elements("e0"."tags") as "__je0" where not ("__je0"->>'name' = ?))`,
    );

    // cross-element mismatch
    const r6 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: 'typescript', priority: 3 } },
    });
    expect(r6).toHaveLength(0);

    // $elemMatch combined with $contains via $and
    mock.mockReset();
    const r7 = await orm.em.fork().find(Event, {
      $and: [{ tags: { $elemMatch: { priority: { $gt: 5 } } } }, { tags: { $contains: [{ name: 'typescript' }] } }],
    });
    expect(r7).toHaveLength(1);
    expect(r7[0].name).toBe('Conference');
  });
});
