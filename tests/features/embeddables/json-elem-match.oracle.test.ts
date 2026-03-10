import { MikroORM } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { OracleDriver } from '@mikro-orm/oracledb';
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

describe('$elemMatch on JSON properties in oracle', () => {
  let orm: MikroORM<OracleDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Event],
      dbName: 'mikro_orm_test_json_elem',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
      driver: OracleDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('$elemMatch queries', async () => {
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
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" "e0" where exists (select 1 from json_table("e0"."tags", '$[*]' columns ("name" varchar2(4000) path '$.name')) "__je0" where "__je0"."name" = ?)`,
    );

    // numeric operator with typed column
    mock.mockReset();
    const r2 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gt: 7 } } } });
    expect(r2).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      `select "e0".* from "event" "e0" where exists (select 1 from json_table("e0"."tags", '$[*]' columns ("priority" number path '$.priority')) "__je0" where "__je0"."priority" > ?)`,
    );

    // multiple conditions — same element
    mock.mockReset();
    const r3 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: 'typescript', priority: { $gt: 5 } } },
    });
    expect(r3).toHaveLength(1);

    // cross-element mismatch
    const r4 = await orm.em.fork().find(Event, {
      tags: { $elemMatch: { name: 'typescript', priority: 3 } },
    });
    expect(r4).toHaveLength(0);

    // no match
    const r5 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'python' } } });
    expect(r5).toHaveLength(0);
  });
});
